-- Add scheduling metadata to journeys
ALTER TABLE public.journeys
  ADD COLUMN IF NOT EXISTS status TEXT;

UPDATE public.journeys
SET status = 'scheduled'
WHERE status IS NULL;

ALTER TABLE public.journeys
  ALTER COLUMN status SET DEFAULT 'scheduled';

ALTER TABLE public.journeys
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.journeys
  DROP CONSTRAINT IF EXISTS journeys_status_check;

ALTER TABLE public.journeys
  ADD CONSTRAINT journeys_status_check CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled'));

ALTER TABLE public.journeys
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

ALTER TABLE public.journeys
  ADD COLUMN IF NOT EXISTS pre_departure_notified_at TIMESTAMPTZ;

ALTER TABLE public.journeys
  ADD COLUMN IF NOT EXISTS departure_notified_at TIMESTAMPTZ;

-- Log journey notifications to support push delivery
CREATE TABLE IF NOT EXISTS public.journey_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pre_departure', 'departure')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS journey_notifications_user_id_idx ON public.journey_notifications(user_id);
CREATE INDEX IF NOT EXISTS journey_notifications_journey_id_idx ON public.journey_notifications(journey_id);
CREATE INDEX IF NOT EXISTS journey_notifications_type_idx ON public.journey_notifications(type);
