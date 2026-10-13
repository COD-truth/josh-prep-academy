-- Owner-requested parent registration, reviewed tutor profiles and orientation content.
-- Role lookup must bypass user_roles RLS: the admin policies themselves call
-- has_role, so SECURITY INVOKER would recursively re-enter those policies.
-- This helper only reads roles; it cannot grant them. Preserve its existing grants.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Account type is a UI preference; it does not grant administrative or tutor permissions.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'student' CHECK (account_type IN ('student','parent','teacher'));
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS city text;
CREATE UNIQUE INDEX IF NOT EXISTS tutors_user_id_unique ON public.tutors(user_id) WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.tutor_applications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
 full_name text NOT NULL, phone text NOT NULL, subjects text[] NOT NULL, levels text[] NOT NULL, languages text[] NOT NULL,
 experience_years integer NOT NULL CHECK (experience_years BETWEEN 0 AND 60), bio text NOT NULL, diploma text NOT NULL,
 hourly_rate_fcfa integer NOT NULL CHECK (hourly_rate_fcfa BETWEEN 1000 AND 50000),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
 created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz, reviewed_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.tutor_applications ADD COLUMN IF NOT EXISTS residence text;
ALTER TABLE public.tutor_applications ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.tutor_applications ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.tutor_applications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.tutor_applications TO authenticated;
GRANT ALL ON public.tutor_applications TO service_role;
DROP POLICY IF EXISTS "Applicants read own application" ON public.tutor_applications;
CREATE POLICY "Applicants read own application" ON public.tutor_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Applicants submit pending application" ON public.tutor_applications;
CREATE POLICY "Applicants submit pending application" ON public.tutor_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL);
DROP POLICY IF EXISTS "Admins read applications" ON public.tutor_applications;
CREATE POLICY "Admins read applications" ON public.tutor_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 INSERT INTO public.profiles (id,full_name,phone,account_type) VALUES (NEW.id,
 COALESCE(NEW.raw_user_meta_data->>'full_name',NEW.raw_user_meta_data->>'name',split_part(NEW.email,'@',1)),
 left(NEW.raw_user_meta_data->>'phone',20),
 CASE WHEN NEW.raw_user_meta_data->>'user_type' IN ('student','parent','teacher') THEN NEW.raw_user_meta_data->>'user_type' ELSE 'student' END);
 INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'student');
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Approval publishes a tutor profile in the same transaction; rejected applicants stay private.
CREATE OR REPLACE FUNCTION public.publish_approved_tutor_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
  INSERT INTO public.tutors(user_id,full_name,title,bio,subjects,levels,languages,hourly_rate_fcfa,years_experience,photo_url,city,is_active)
  VALUES(NEW.user_id,NEW.full_name,NEW.diploma,NEW.bio,NEW.subjects,NEW.levels,NEW.languages,NEW.hourly_rate_fcfa,NEW.experience_years,NEW.photo_url,NEW.city,true)
  ON CONFLICT(user_id) WHERE user_id IS NOT NULL DO UPDATE SET full_name=excluded.full_name,title=excluded.title,bio=excluded.bio,subjects=excluded.subjects,levels=excluded.levels,languages=excluded.languages,hourly_rate_fcfa=excluded.hourly_rate_fcfa,years_experience=excluded.years_experience,photo_url=excluded.photo_url,city=excluded.city,is_active=true;
  INSERT INTO public.user_roles(user_id,role) VALUES(NEW.user_id,'tutor') ON CONFLICT(user_id,role) DO NOTHING;
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.publish_approved_tutor_application() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS publish_approved_tutor_application ON public.tutor_applications;
CREATE TRIGGER publish_approved_tutor_application AFTER UPDATE OF status ON public.tutor_applications FOR EACH ROW EXECUTE FUNCTION public.publish_approved_tutor_application();

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('tutor-photos','tutor-photos',true,5242880,ARRAY['image/jpeg','image/png','image/webp']) ON CONFLICT(id) DO NOTHING;
CREATE POLICY "Tutor photos public read" ON storage.objects FOR SELECT TO anon,authenticated USING(bucket_id='tutor-photos');
CREATE POLICY "Tutor photos own upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='tutor-photos' AND (storage.foldername(name))[1]=auth.uid()::text);

CREATE TABLE IF NOT EXISTS public.schools (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, name_en text,
 type text NOT NULL CHECK(type IN ('maternelle','primaire','college','lycee','superieur')),
 section text NOT NULL CHECK(section IN ('francophone','anglophone','bilingue')), levels text[] NOT NULL DEFAULT '{}',
 address text, city text NOT NULL, district text, latitude double precision, longitude double precision, phone text,
 is_public boolean NOT NULL DEFAULT false, is_active boolean NOT NULL DEFAULT true
);
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS study_fields text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.schools TO anon,authenticated;
GRANT ALL ON public.schools TO service_role;
CREATE POLICY "Public read active schools" ON public.schools FOR SELECT TO anon,authenticated USING(is_active=true);

CREATE TABLE public.concours_announcements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, institution text NOT NULL, study_field text NOT NULL,
 level_required text NOT NULL, city text, deadline date, exam_date date, official_url text NOT NULL,
 summary_fr text NOT NULL, summary_en text NOT NULL, verified_at date NOT NULL,
 is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.concours_announcements ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.concours_announcements TO anon,authenticated;
GRANT INSERT,UPDATE ON public.concours_announcements TO authenticated;
GRANT ALL ON public.concours_announcements TO service_role;
CREATE POLICY "Public read active concours" ON public.concours_announcements FOR SELECT TO anon,authenticated USING(is_active=true);
CREATE POLICY "Admins manage concours" ON public.concours_announcements FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
