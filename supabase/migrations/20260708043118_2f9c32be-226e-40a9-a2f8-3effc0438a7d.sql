
-- 1) Switch has_role and has_active_subscription to SECURITY INVOKER.
--    RLS on user_roles/subscriptions already lets a user read their own rows,
--    which is all these helpers need.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id AND status = 'active' AND expires_at > now()
  )
$$;

-- 2) handle_new_user must remain SECURITY DEFINER (trigger inserts across tables at signup),
--    but nothing should be able to invoke it via the API. Triggers fire regardless of EXECUTE grants.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 3) Explicit INSERT restriction on user_roles: only admins can insert.
--    Also add a safety trigger so no future SECURITY DEFINER path can silently grant 'admin'
--    to a self-service caller.
DROP POLICY IF EXISTS "Only admins can insert user roles" ON public.user_roles;
CREATE POLICY "Only admins can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.prevent_self_admin_grant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin'
     AND auth.uid() IS NOT NULL
     AND auth.uid() = NEW.user_id
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Users cannot grant admin role to themselves';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_admin_grant_trg ON public.user_roles;
CREATE TRIGGER prevent_self_admin_grant_trg
BEFORE INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_admin_grant();
