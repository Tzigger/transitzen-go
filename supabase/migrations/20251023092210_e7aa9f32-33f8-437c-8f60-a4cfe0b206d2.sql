-- Add columns to journeys table for route planning
ALTER TABLE public.journeys 
ADD COLUMN IF NOT EXISTS origin text,
ADD COLUMN IF NOT EXISTS origin_lat numeric,
ADD COLUMN IF NOT EXISTS origin_lng numeric,
ADD COLUMN IF NOT EXISTS destination_lat numeric,
ADD COLUMN IF NOT EXISTS destination_lng numeric,
ADD COLUMN IF NOT EXISTS departure_time time without time zone,
ADD COLUMN IF NOT EXISTS estimated_duration integer, -- duration in minutes
ADD COLUMN IF NOT EXISTS route_details jsonb; -- detailed route info

-- Add comment for better documentation
COMMENT ON COLUMN public.journeys.route_details IS 'JSON object containing route segments, vehicles, stops, and transfer information';