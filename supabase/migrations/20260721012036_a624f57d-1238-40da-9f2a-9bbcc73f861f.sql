
-- Prevent double-booking a tutor at the exact same start time (for active bookings)
CREATE UNIQUE INDEX IF NOT EXISTS bookings_tutor_starts_active_uniq
  ON public.bookings (tutor_id, starts_at)
  WHERE status IN ('pending','confirmed');

-- Link a payment optionally to a specific booking (course payments)
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS payments_booking_id_idx ON public.payments(booking_id);

-- Idempotent webhook event log
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  external_id text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, external_id)
);

GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (via admin client / webhook handler) touches it.

-- Helper: compute overlapping active bookings
CREATE OR REPLACE FUNCTION public.tutor_has_conflict(_tutor_id uuid, _starts_at timestamptz, _ends_at timestamptz)
RETURNS boolean
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE tutor_id = _tutor_id
      AND status IN ('pending','confirmed')
      AND tstzrange(starts_at, ends_at, '[)') && tstzrange(_starts_at, _ends_at, '[)')
  );
$$;
