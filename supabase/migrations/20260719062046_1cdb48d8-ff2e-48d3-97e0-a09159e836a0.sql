
-- ============ TUTORS ============
CREATE TABLE public.tutors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  photo_url TEXT,
  subjects TEXT[] NOT NULL DEFAULT '{}',
  levels TEXT[] NOT NULL DEFAULT '{}',
  languages TEXT[] NOT NULL DEFAULT '{fr,en}',
  hourly_rate_fcfa INTEGER NOT NULL DEFAULT 5000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rating NUMERIC(3,2),
  years_experience INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tutors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tutors TO authenticated;
GRANT ALL ON public.tutors TO service_role;

ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active tutors"
  ON public.tutors FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage tutors"
  ON public.tutors FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ TUTOR AVAILABILITY (weekly recurring slots) ============
CREATE TABLE public.tutor_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_window CHECK (end_time > start_time)
);

CREATE INDEX idx_tutor_avail_tutor ON public.tutor_availability(tutor_id, weekday);

GRANT SELECT ON public.tutor_availability TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tutor_availability TO authenticated;
GRANT ALL ON public.tutor_availability TO service_role;

ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view availability of active tutors"
  ON public.tutor_availability FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.tutors t WHERE t.id = tutor_id AND (t.is_active = true OR public.has_role(auth.uid(), 'admin')))
  );

CREATE POLICY "Admins manage availability"
  ON public.tutor_availability FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ BOOKINGS ============
CREATE TYPE public.booking_format AS ENUM ('home', 'online', 'office');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES public.tutors(id) ON DELETE RESTRICT,
  subject TEXT NOT NULL,
  level TEXT NOT NULL,
  format public.booking_format NOT NULL DEFAULT 'home',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  address TEXT,
  notes TEXT,
  price_fcfa INTEGER NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'pending',
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_slot CHECK (ends_at > starts_at)
);

CREATE INDEX idx_bookings_student ON public.bookings(student_id);
CREATE INDEX idx_bookings_tutor_slot ON public.bookings(tutor_id, starts_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view their own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid())
  );

CREATE POLICY "Students create their own bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Tutors and admins update bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid())
    OR student_id = auth.uid()
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid())
    OR student_id = auth.uid()
  );

CREATE POLICY "Admins delete bookings"
  ON public.bookings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger reuse
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_tutors_updated BEFORE UPDATE ON public.tutors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SEED: 8 tutors + basic weekly availability ============
INSERT INTO public.tutors (full_name, title, bio, subjects, levels, languages, hourly_rate_fcfa, years_experience, rating) VALUES
  ('Dr. Josh',                'PhD · Fondateur',        'Docteur en sciences, 15 ans d''expérience en préparation aux concours.', ARRAY['Mathématiques','Physique','Chimie'], ARRAY['Terminale','GCE A Level','Baccalauréat'], ARRAY['fr','en'], 8000, 15, 4.95),
  ('Marie Nkoumou',           'Agrégée de Mathématiques','Spécialiste préparation Bac C/D et GCE A Level.',                     ARRAY['Mathématiques','Physique'],           ARRAY['Lycée','Terminale','Baccalauréat'], ARRAY['fr','en'], 6500, 10, 4.90),
  ('Samuel Fotso',            'Ingénieur Polytech',     'Physique et chimie appliquées, coaching concours ENSPY.',              ARRAY['Physique','Chimie','Mathématiques'], ARRAY['Lycée','Terminale','GCE A Level'], ARRAY['fr','en'], 6000, 8, 4.85),
  ('Grace Etame',             'MSc Biologie',           'Biologie, SVT et préparation FMSB.',                                    ARRAY['Biologie','SVT','Chimie'],           ARRAY['Lycée','GCE O Level','GCE A Level'], ARRAY['fr','en'], 5500, 7, 4.80),
  ('Paul Mbarga',             'MA Littérature',         'Français, littérature et philosophie.',                                 ARRAY['Français','Littérature','Philosophie'], ARRAY['Collège','Lycée','Baccalauréat'], ARRAY['fr'], 5000, 9, 4.75),
  ('Sarah Ngo Bell',          'English & Literature',   'English Language, Literature and GCE O/A prep.',                       ARRAY['English','Literature'],              ARRAY['GCE O Level','GCE A Level'], ARRAY['en'], 6000, 6, 4.88),
  ('Kevin Tchouameni',        'MSc Informatique',       'Mathématiques, ICT et Computing.',                                     ARRAY['Mathématiques','ICT','Computing'],   ARRAY['GCE O Level','GCE A Level','Lycée'], ARRAY['fr','en'], 5500, 5, 4.70),
  ('Aïcha Bakari',            'Éco-Gestion',            'Économie, histoire-géographie, sciences sociales.',                    ARRAY['Économie','Histoire-Géographie'],    ARRAY['Lycée','Terminale','GCE A Level'], ARRAY['fr','en'], 5000, 6, 4.72);

-- Default availability: Mon–Fri 15:00–19:00, Sat 09:00–13:00 for every tutor
INSERT INTO public.tutor_availability (tutor_id, weekday, start_time, end_time)
SELECT t.id, wd, '15:00'::time, '19:00'::time
FROM public.tutors t, generate_series(1,5) AS wd;

INSERT INTO public.tutor_availability (tutor_id, weekday, start_time, end_time)
SELECT t.id, 6, '09:00'::time, '13:00'::time FROM public.tutors t;
