-- Create journeys table for storing user journey alerts
CREATE TABLE public.journeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  destination TEXT NOT NULL,
  arrival_date DATE NOT NULL,
  arrival_time TIME NOT NULL,
  recurring_days JSONB DEFAULT '[]'::jsonb,
  notify_departure BOOLEAN NOT NULL DEFAULT true,
  notify_delays BOOLEAN NOT NULL DEFAULT true,
  notify_crowding BOOLEAN NOT NULL DEFAULT false,
  notify_route_changes BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own journeys" 
ON public.journeys 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journeys" 
ON public.journeys 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journeys" 
ON public.journeys 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journeys" 
ON public.journeys 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_journeys_updated_at
BEFORE UPDATE ON public.journeys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();