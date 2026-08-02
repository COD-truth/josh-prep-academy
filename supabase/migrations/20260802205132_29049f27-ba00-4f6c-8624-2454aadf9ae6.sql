CREATE UNIQUE INDEX IF NOT EXISTS payments_transaction_ref_key
  ON public.payments (transaction_ref);

CREATE INDEX IF NOT EXISTS subscriptions_user_active_idx
  ON public.subscriptions (user_id, status, expires_at DESC);

CREATE OR REPLACE FUNCTION public.grant_subscription(_user_id uuid, _plan_id uuid, _days integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing public.subscriptions%ROWTYPE;
  _id uuid;
BEGIN
  SELECT * INTO _existing
  FROM public.subscriptions
  WHERE user_id = _user_id AND status = 'active' AND expires_at > now()
  ORDER BY expires_at DESC
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.subscriptions
    SET expires_at = _existing.expires_at + make_interval(days => _days),
        plan_id = _plan_id
    WHERE id = _existing.id
    RETURNING id INTO _id;
  ELSE
    INSERT INTO public.subscriptions (user_id, plan_id, status, starts_at, expires_at)
    VALUES (_user_id, _plan_id, 'active', now(), now() + make_interval(days => _days))
    RETURNING id INTO _id;
  END IF;

  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_subscription(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_subscription(uuid, uuid, integer) TO service_role;