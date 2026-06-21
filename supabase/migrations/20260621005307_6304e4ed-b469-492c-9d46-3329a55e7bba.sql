
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'student', 'tutor');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Admins can manage everyone's roles
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile and default 'student' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Subscription plans
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  price_xaf INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are public" ON public.subscription_plans FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Admins manage plans" ON public.subscription_plans FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.subscription_plans (code, name_fr, name_en, price_xaf, duration_days) VALUES
  ('monthly', 'Mensuel', 'Monthly', 5000, 30),
  ('quarterly', 'Trimestriel', 'Quarterly', 12000, 90),
  ('yearly', 'Annuel', 'Yearly', 40000, 365);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Active subscription helper
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id AND status = 'active' AND expires_at > now()
  )
$$;

-- Mobile Money payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  provider TEXT NOT NULL CHECK (provider IN ('orange','mtn')),
  phone TEXT NOT NULL,
  amount_xaf INTEGER NOT NULL,
  transaction_ref TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id)
);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins read all payments" ON public.payments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update payments" ON public.payments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Exam papers
CREATE TABLE public.exam_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  year INTEGER,
  file_url TEXT,
  meta TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exam_papers TO authenticated;
GRANT ALL ON public.exam_papers TO service_role;
ALTER TABLE public.exam_papers ENABLE ROW LEVEL SECURITY;
-- Only subscribers (or admins) can read
CREATE POLICY "Subscribers read exam papers" ON public.exam_papers FOR SELECT TO authenticated
USING (public.has_active_subscription(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage exam papers" ON public.exam_papers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public listing of exam paper titles (for the locked teaser)
CREATE TABLE public.exam_papers_public (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  meta TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
GRANT SELECT ON public.exam_papers_public TO anon, authenticated;
GRANT ALL ON public.exam_papers_public TO service_role;
ALTER TABLE public.exam_papers_public ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public teasers" ON public.exam_papers_public FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.exam_papers_public (title, meta, sort_order) VALUES
  ('Concours ENSPY 2024 — Mathématiques', 'PDF · 15 pages · Corrigé Dr. Josh', 1),
  ('FMSB CUSS 2023 — Biologie & Chimie', 'QCM · 80 questions · Explications', 2),
  ('Polytechnique 2022 — Physique I', 'PDF · 22 pages · Corrigé détaillé', 3);

-- Seed sample exam papers for subscribers
INSERT INTO public.exam_papers (title, subject, year, meta, description) VALUES
  ('Concours ENSPY 2024 — Mathématiques', 'Mathématiques', 2024, 'PDF · 15 pages · Corrigé Dr. Josh', 'Sujet complet du concours d''entrée ENSPY 2024 avec corrigé détaillé.'),
  ('FMSB CUSS 2023 — Biologie & Chimie', 'Biologie', 2023, 'QCM · 80 questions · Explications', 'QCM de la Faculté de Médecine de Yaoundé 2023, avec explications.'),
  ('Polytechnique 2022 — Physique I', 'Physique', 2022, 'PDF · 22 pages · Corrigé détaillé', 'Sujet Physique I Polytechnique 2022, corrigé complet.');
