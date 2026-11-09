-- Apply AFTER 20261013050000. Private learning data is scoped to booking participants.
CREATE OR REPLACE FUNCTION public.can_access_lesson(_booking uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.bookings b JOIN public.tutors t ON t.id=b.tutor_id WHERE b.id=_booking AND (b.student_id=auth.uid() OR t.user_id=auth.uid() OR public.has_role(auth.uid(),'admin')))
$$;
CREATE OR REPLACE FUNCTION public.can_teach_lesson(_booking uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.bookings b JOIN public.tutors t ON t.id=b.tutor_id WHERE b.id=_booking AND (t.user_id=auth.uid() OR public.has_role(auth.uid(),'admin')))
$$;
REVOKE ALL ON FUNCTION public.can_access_lesson(uuid),public.can_teach_lesson(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_access_lesson(uuid),public.can_teach_lesson(uuid) TO authenticated;

-- A student must not mark a booking complete and then manufacture a verified review.
CREATE OR REPLACE FUNCTION public.protect_booking_learning_state()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.status<>'pending' OR NEW.payment_id IS NOT NULL OR NEW.student_id<>auth.uid() THEN RAISE EXCEPTION 'New bookings must be pending'; END IF;
  IF EXISTS(SELECT 1 FROM public.tutors WHERE id=NEW.tutor_id AND user_id=NEW.student_id) THEN RAISE EXCEPTION 'Self bookings are not allowed'; END IF;
 ELSE
  IF (to_jsonb(NEW)-ARRAY['status','updated_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['status','updated_at']) THEN RAISE EXCEPTION 'Booking details require administrator review'; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
   IF public.can_teach_lesson(OLD.id) THEN
    IF NEW.status NOT IN ('completed','cancelled') OR OLD.status NOT IN ('confirmed','completed') OR (NEW.status='completed' AND OLD.ends_at>now()) THEN RAISE EXCEPTION 'Lesson cannot be completed yet'; END IF;
   ELSIF OLD.student_id=auth.uid() THEN
    IF NEW.status<>'cancelled' OR OLD.status NOT IN ('pending','confirmed') THEN RAISE EXCEPTION 'Only pending or confirmed bookings can be cancelled'; END IF;
   ELSE RAISE EXCEPTION 'Forbidden'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.protect_booking_learning_state() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER protect_booking_learning_state BEFORE INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.protect_booking_learning_state();

CREATE TABLE public.lesson_reports(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
 author_id uuid NOT NULL REFERENCES auth.users(id),objective text NOT NULL,summary text NOT NULL,homework text NOT NULL DEFAULT '',
 progress integer NOT NULL CHECK(progress BETWEEN 0 AND 100),updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_reports ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.lesson_reports TO authenticated;
GRANT ALL ON public.lesson_reports TO service_role;
CREATE POLICY "Participants read lesson reports" ON public.lesson_reports FOR SELECT TO authenticated USING(public.can_access_lesson(booking_id));

CREATE OR REPLACE FUNCTION public.save_lesson_report(_booking uuid,_objective text,_summary text,_homework text,_progress integer)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b public.bookings%ROWTYPE; report_id uuid;
BEGIN
 IF NOT public.can_teach_lesson(_booking) THEN RAISE EXCEPTION 'Forbidden'; END IF;
 SELECT * INTO b FROM public.bookings WHERE id=_booking FOR UPDATE;
 IF b.status NOT IN ('confirmed','completed') OR b.ends_at>now() THEN RAISE EXCEPTION 'Only finished confirmed lessons can receive a report'; END IF;
 IF length(trim(_objective)) NOT BETWEEN 3 AND 500 OR length(trim(_summary)) NOT BETWEEN 20 AND 2000 OR length(_homework)>1500 OR _progress NOT BETWEEN 0 AND 100 THEN RAISE EXCEPTION 'Invalid report'; END IF;
 INSERT INTO public.lesson_reports(booking_id,author_id,objective,summary,homework,progress) VALUES(_booking,auth.uid(),trim(_objective),trim(_summary),_homework,_progress)
 ON CONFLICT(booking_id) DO UPDATE SET objective=excluded.objective,summary=excluded.summary,homework=excluded.homework,progress=excluded.progress,updated_at=now() RETURNING id INTO report_id;
 UPDATE public.bookings SET status='completed',updated_at=now() WHERE id=_booking;
 RETURN report_id;
END; $$;
REVOKE ALL ON FUNCTION public.save_lesson_report(uuid,text,text,text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_lesson_report(uuid,text,text,text,integer) TO authenticated;

CREATE TABLE public.tutor_reviews(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
 tutor_id uuid NOT NULL REFERENCES public.tutors(id),rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5),
 comment text NOT NULL CHECK(length(comment) BETWEEN 10 AND 1200),display_name text NOT NULL CHECK(length(display_name) BETWEEN 1 AND 40),created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tutor_reviews ENABLE ROW LEVEL SECURITY;
-- Do not expose the private booking ID through the public reviews API.
GRANT SELECT(id,tutor_id,rating,comment,display_name,created_at) ON public.tutor_reviews TO anon,authenticated;
GRANT INSERT ON public.tutor_reviews TO authenticated;
GRANT ALL ON public.tutor_reviews TO service_role;
CREATE POLICY "Public read published tutor reviews" ON public.tutor_reviews FOR SELECT TO anon,authenticated USING(EXISTS(SELECT 1 FROM public.tutors t WHERE t.id=tutor_id AND t.is_active));
CREATE POLICY "Review completed account-owned lesson" ON public.tutor_reviews FOR INSERT TO authenticated WITH CHECK(EXISTS(
 SELECT 1 FROM public.bookings b JOIN public.tutors t ON t.id=b.tutor_id JOIN public.lesson_reports r ON r.booking_id=b.id
 WHERE b.id=tutor_reviews.booking_id AND b.tutor_id=tutor_reviews.tutor_id AND b.student_id=auth.uid() AND b.status='completed' AND b.ends_at<=now() AND t.user_id IS DISTINCT FROM auth.uid()
));

CREATE TABLE public.lesson_settings(booking_id uuid PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,meeting_url text NOT NULL CHECK(meeting_url LIKE 'https://%'),updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.lesson_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE ON public.lesson_settings TO authenticated;
GRANT ALL ON public.lesson_settings TO service_role;
CREATE POLICY "Participants read meeting link" ON public.lesson_settings FOR SELECT TO authenticated USING(public.can_access_lesson(booking_id));
CREATE POLICY "Tutors manage meeting link" ON public.lesson_settings FOR INSERT TO authenticated WITH CHECK(public.can_teach_lesson(booking_id));
CREATE POLICY "Tutors update meeting link" ON public.lesson_settings FOR UPDATE TO authenticated USING(public.can_teach_lesson(booking_id)) WITH CHECK(public.can_teach_lesson(booking_id));

CREATE TABLE public.lesson_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
 actor_id uuid NOT NULL REFERENCES auth.users(id),kind text NOT NULL CHECK(kind IN ('stroke','message','clear')),payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),CHECK(octet_length(payload::text)<=30000)
);
CREATE INDEX lesson_events_booking_date ON public.lesson_events(booking_id,created_at DESC);
ALTER TABLE public.lesson_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT ON public.lesson_events TO authenticated;
GRANT ALL ON public.lesson_events TO service_role;
CREATE POLICY "Participants read workspace" ON public.lesson_events FOR SELECT TO authenticated USING(public.can_access_lesson(booking_id));
CREATE POLICY "Participants contribute workspace" ON public.lesson_events FOR INSERT TO authenticated WITH CHECK(actor_id=auth.uid() AND public.can_access_lesson(booking_id) AND (kind<>'clear' OR public.can_teach_lesson(booking_id)) AND EXISTS(SELECT 1 FROM public.bookings WHERE id=booking_id AND status IN ('confirmed','completed')));
CREATE OR REPLACE FUNCTION public.validate_lesson_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p jsonb; count_recent integer;
BEGIN
 NEW.created_at:=clock_timestamp();
 IF NEW.kind='message' AND (jsonb_typeof(NEW.payload->'text') IS DISTINCT FROM 'string' OR length(trim(NEW.payload->>'text')) NOT BETWEEN 1 AND 1000) THEN RAISE EXCEPTION 'Invalid message'; END IF;
 IF NEW.kind='stroke' THEN
  IF jsonb_typeof(NEW.payload->'points') IS DISTINCT FROM 'array' OR jsonb_array_length(NEW.payload->'points') NOT BETWEEN 1 AND 200 OR NEW.payload->>'color' IS NULL OR NEW.payload->>'color' NOT IN ('#14213d','#f97316','#ffffff') OR NEW.payload->>'width' IS NULL OR (NEW.payload->>'width') !~ '^[0-9]+$' OR (NEW.payload->>'width')::integer NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Invalid stroke'; END IF;
  FOR p IN SELECT value FROM jsonb_array_elements(NEW.payload->'points') LOOP
   IF jsonb_typeof(p) IS DISTINCT FROM 'array' OR jsonb_array_length(p)<>2 OR jsonb_typeof(p->0) IS DISTINCT FROM 'number' OR jsonb_typeof(p->1) IS DISTINCT FROM 'number' OR (p->>0)::numeric NOT BETWEEN 0 AND 1 OR (p->>1)::numeric NOT BETWEEN 0 AND 1 THEN RAISE EXCEPTION 'Invalid point'; END IF;
  END LOOP;
 END IF;
 SELECT count(*) INTO count_recent FROM public.lesson_events WHERE actor_id=NEW.actor_id AND booking_id=NEW.booking_id AND created_at>now()-interval '10 seconds';
 IF count_recent>=30 THEN RAISE EXCEPTION 'Please slow down'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.validate_lesson_event() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER validate_lesson_event BEFORE INSERT ON public.lesson_events FOR EACH ROW EXECUTE FUNCTION public.validate_lesson_event();

CREATE TABLE public.lesson_quizzes(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
 author_id uuid NOT NULL REFERENCES auth.users(id),title text NOT NULL CHECK(length(title) BETWEEN 3 AND 120),questions jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),CHECK(jsonb_typeof(questions)='array' AND jsonb_array_length(questions) BETWEEN 1 AND 10)
);
ALTER TABLE public.lesson_quizzes ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT ON public.lesson_quizzes TO authenticated;
GRANT ALL ON public.lesson_quizzes TO service_role;
-- The answer key remains visible only to the assigned teacher/admin.
CREATE POLICY "Tutors read quiz keys" ON public.lesson_quizzes FOR SELECT TO authenticated USING(public.can_teach_lesson(booking_id));
CREATE POLICY "Tutors create lesson quiz" ON public.lesson_quizzes FOR INSERT TO authenticated WITH CHECK(author_id=auth.uid() AND public.can_teach_lesson(booking_id));

CREATE OR REPLACE FUNCTION public.validate_lesson_quiz()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE q jsonb; choice jsonb;
BEGIN
 FOR q IN SELECT value FROM jsonb_array_elements(NEW.questions) LOOP
  IF jsonb_typeof(q->'prompt') IS DISTINCT FROM 'string' OR length(trim(q->>'prompt')) NOT BETWEEN 3 AND 500 OR jsonb_typeof(q->'choices') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid quiz question'; END IF;
  IF jsonb_array_length(q->'choices') NOT BETWEEN 2 AND 5 OR q->>'correct' IS NULL OR (q->>'correct') !~ '^[0-9]+$' OR (q->>'correct')::integer>=jsonb_array_length(q->'choices') OR jsonb_typeof(q->'explanation') IS DISTINCT FROM 'string' OR length(q->>'explanation')>800 THEN RAISE EXCEPTION 'Invalid quiz answer'; END IF;
  FOR choice IN SELECT value FROM jsonb_array_elements(q->'choices') LOOP
   IF jsonb_typeof(choice) IS DISTINCT FROM 'string' OR length(trim(choice#>>'{}')) NOT BETWEEN 1 AND 300 THEN RAISE EXCEPTION 'Invalid choice'; END IF;
  END LOOP;
 END LOOP;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.validate_lesson_quiz() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER validate_lesson_quiz BEFORE INSERT OR UPDATE ON public.lesson_quizzes FOR EACH ROW EXECUTE FUNCTION public.validate_lesson_quiz();

CREATE TABLE public.quiz_attempts(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),quiz_id uuid NOT NULL REFERENCES public.lesson_quizzes(id),booking_id uuid NOT NULL REFERENCES public.bookings(id),
 user_id uuid NOT NULL REFERENCES auth.users(id),score integer NOT NULL,total integer NOT NULL,feedback jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(quiz_id,user_id)
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
CREATE POLICY "Participants read quiz results" ON public.quiz_attempts FOR SELECT TO authenticated USING(public.can_access_lesson(booking_id));

CREATE OR REPLACE FUNCTION public.get_lesson_quiz(_booking uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE q public.lesson_quizzes%ROWTYPE; safe_questions jsonb;
BEGIN
 IF NOT public.can_access_lesson(_booking) THEN RAISE EXCEPTION 'Forbidden'; END IF;
 SELECT * INTO q FROM public.lesson_quizzes WHERE booking_id=_booking;
 IF NOT FOUND THEN RETURN NULL; END IF;
 SELECT jsonb_agg(jsonb_build_object('prompt',value->'prompt','choices',value->'choices') ORDER BY ordinality) INTO safe_questions FROM jsonb_array_elements(q.questions) WITH ORDINALITY;
 RETURN jsonb_build_object('id',q.id,'title',q.title,'questions',safe_questions);
END; $$;
CREATE OR REPLACE FUNCTION public.submit_lesson_quiz(_quiz uuid,_answers jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE q public.lesson_quizzes%ROWTYPE;b public.bookings%ROWTYPE;question jsonb;i integer:=0;selected integer;correct integer;score integer:=0;feedback jsonb:='[]';result public.quiz_attempts%ROWTYPE;
BEGIN
 SELECT * INTO q FROM public.lesson_quizzes WHERE id=_quiz;
 IF NOT FOUND THEN RAISE EXCEPTION 'Quiz unavailable'; END IF;
 SELECT * INTO b FROM public.bookings WHERE id=q.booking_id;
 IF auth.uid() IS NULL OR b.student_id<>auth.uid() OR b.status NOT IN ('confirmed','completed') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 IF jsonb_typeof(_answers) IS DISTINCT FROM 'array' OR jsonb_array_length(_answers)<>jsonb_array_length(q.questions) THEN RAISE EXCEPTION 'Answer every question'; END IF;
 FOR question IN SELECT value FROM jsonb_array_elements(q.questions) LOOP
  IF (_answers->>i) IS NULL OR (_answers->>i) !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Invalid choice'; END IF;
  selected:=(_answers->>i)::integer;correct:=(question->>'correct')::integer;
  IF selected<0 OR selected>=jsonb_array_length(question->'choices') THEN RAISE EXCEPTION 'Invalid choice'; END IF;
  IF selected=correct THEN score:=score+1; END IF;
  feedback:=feedback||jsonb_build_array(jsonb_build_object('prompt',question->>'prompt','selected',selected,'correct',correct,'explanation',question->>'explanation'));i:=i+1;
 END LOOP;
 INSERT INTO public.quiz_attempts(quiz_id,booking_id,user_id,score,total,feedback) VALUES(q.id,b.id,auth.uid(),score,i,feedback) RETURNING * INTO result;
 RETURN to_jsonb(result)-ARRAY['user_id','booking_id'];
END; $$;
REVOKE ALL ON FUNCTION public.get_lesson_quiz(uuid),public.submit_lesson_quiz(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_lesson_quiz(uuid),public.submit_lesson_quiz(uuid,jsonb) TO authenticated;

DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') AND NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='lesson_events') THEN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_events;
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.lesson_has_review(_booking uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.can_access_lesson(_booking) THEN RAISE EXCEPTION 'Forbidden'; END IF;
 RETURN EXISTS(SELECT 1 FROM public.tutor_reviews WHERE booking_id=_booking);
END; $$;
REVOKE ALL ON FUNCTION public.lesson_has_review(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lesson_has_review(uuid) TO authenticated;
-- Public scheduling exposes occupied times only, never student identities or notes.
CREATE OR REPLACE FUNCTION public.get_tutor_busy_slots(_tutor uuid,_from timestamptz,_to timestamptz)
RETURNS TABLE(starts_at timestamptz,ends_at timestamptz,status public.booking_status)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF _to<_from OR _to-_from>interval '62 days' THEN RAISE EXCEPTION 'Invalid date range'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.tutors WHERE id=_tutor AND is_active) THEN RETURN; END IF;
 RETURN QUERY SELECT b.starts_at,b.ends_at,b.status FROM public.bookings b WHERE b.tutor_id=_tutor AND b.status IN ('pending','confirmed') AND b.ends_at>_from AND b.starts_at<_to;
END; $$;
REVOKE ALL ON FUNCTION public.get_tutor_busy_slots(uuid,timestamptz,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tutor_busy_slots(uuid,timestamptz,timestamptz) TO anon,authenticated;

-- The old UI sent payment metadata which its server validator silently discarded.
-- Reserve the slot and store the manual Mobile Money receipt in one transaction.
CREATE OR REPLACE FUNCTION public.request_lesson_booking(_tutor uuid,_subject text,_level text,_format text,_starts timestamptz,_duration integer,_address text,_notes text,_provider text,_phone text,_reference text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t public.tutors%ROWTYPE;b public.bookings%ROWTYPE;p public.payments%ROWTYPE;finishes timestamptz;price integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 IF length(trim(_subject)) NOT BETWEEN 1 AND 80 OR length(trim(_level)) NOT BETWEEN 1 AND 40 OR _format NOT IN ('home','online','office') OR _provider NOT IN ('orange','mtn') OR length(_phone) NOT BETWEEN 7 AND 20 OR length(_reference) NOT BETWEEN 4 AND 60 OR _duration NOT BETWEEN 30 AND 240 OR length(_address)>200 OR length(_notes)>500 THEN RAISE EXCEPTION 'Invalid booking'; END IF;
 SELECT * INTO p FROM public.payments WHERE transaction_ref=_reference;
 IF FOUND THEN
  SELECT * INTO b FROM public.bookings WHERE id=p.booking_id;
  IF p.user_id=auth.uid() AND b.tutor_id=_tutor AND b.starts_at=_starts AND b.ends_at=_starts+make_interval(mins=>_duration) AND b.subject=trim(_subject) AND b.level=trim(_level) AND b.format::text=_format THEN RETURN jsonb_build_object('id',b.id,'starts_at',b.starts_at,'ends_at',b.ends_at,'price_fcfa',b.price_fcfa,'status',b.status); END IF;
  RAISE EXCEPTION 'This transaction reference is already used';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_tutor::text,0));
 SELECT * INTO t FROM public.tutors WHERE id=_tutor AND is_active FOR SHARE;
 IF NOT FOUND OR t.user_id=auth.uid() THEN RAISE EXCEPTION 'Tutor unavailable'; END IF;
 IF _starts<now()+interval '1 hour' THEN RAISE EXCEPTION 'Book at least one hour ahead'; END IF;
 finishes:=_starts+make_interval(mins=>_duration);
 IF (_starts AT TIME ZONE 'UTC')::date<>(finishes AT TIME ZONE 'UTC')::date OR NOT EXISTS(SELECT 1 FROM public.tutor_availability a WHERE a.tutor_id=_tutor AND a.weekday=extract(dow FROM _starts AT TIME ZONE 'UTC')::integer AND a.start_time<=(_starts AT TIME ZONE 'UTC')::time AND a.end_time>=(finishes AT TIME ZONE 'UTC')::time) THEN RAISE EXCEPTION 'Outside tutor availability'; END IF;
 IF EXISTS(SELECT 1 FROM public.bookings WHERE tutor_id=_tutor AND status IN ('pending','confirmed') AND starts_at<finishes AND ends_at>_starts) THEN RAISE EXCEPTION 'Slot already taken'; END IF;
 price:=round(t.hourly_rate_fcfa::numeric*_duration/60);
 INSERT INTO public.bookings(student_id,tutor_id,subject,level,format,starts_at,ends_at,address,notes,price_fcfa,status)
 VALUES(auth.uid(),_tutor,trim(_subject),trim(_level),_format::public.booking_format,_starts,finishes,_address,_notes,price,'pending') RETURNING * INTO b;
 INSERT INTO public.payments(user_id,booking_id,provider,phone,transaction_ref,amount_xaf,status,plan_id) VALUES(auth.uid(),b.id,_provider,_phone,_reference,price,'pending',null);
 RETURN jsonb_build_object('id',b.id,'starts_at',b.starts_at,'ends_at',b.ends_at,'price_fcfa',b.price_fcfa,'status',b.status);
END; $$;
REVOKE ALL ON FUNCTION public.request_lesson_booking(uuid,text,text,text,timestamptz,integer,text,text,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.request_lesson_booking(uuid,text,text,text,timestamptz,integer,text,text,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_lesson_payment(_payment uuid,_approve boolean,_notes text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.payments%ROWTYPE;b public.bookings%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 SELECT * INTO p FROM public.payments WHERE id=_payment FOR UPDATE;
 IF NOT FOUND OR p.booking_id IS NULL THEN RAISE EXCEPTION 'Lesson payment not found'; END IF;
 IF p.status<>'pending' THEN RAISE EXCEPTION 'Payment already reviewed'; END IF;
 SELECT * INTO b FROM public.bookings WHERE id=p.booking_id FOR UPDATE;
 IF _approve AND (b.status<>'pending' OR p.user_id<>b.student_id OR p.amount_xaf<>b.price_fcfa) THEN RAISE EXCEPTION 'Booking does not match this payment'; END IF;
 IF _approve THEN UPDATE public.bookings SET status='confirmed',payment_id=p.id,updated_at=now() WHERE id=b.id; END IF;
 UPDATE public.payments SET status=CASE WHEN _approve THEN 'verified' ELSE 'rejected' END,notes=_notes,verified_at=now(),verified_by=auth.uid() WHERE id=p.id;
END; $$;
REVOKE ALL ON FUNCTION public.review_lesson_payment(uuid,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_lesson_payment(uuid,boolean,text) TO authenticated;
