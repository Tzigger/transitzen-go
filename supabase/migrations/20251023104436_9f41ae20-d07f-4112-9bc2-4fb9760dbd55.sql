-- Create favorite_routes table for saved route presets
CREATE TABLE public.favorite_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  origin TEXT NOT NULL,
  origin_lat NUMERIC NOT NULL,
  origin_lng NUMERIC NOT NULL,
  destination TEXT NOT NULL,
  destination_lat NUMERIC NOT NULL,
  destination_lng NUMERIC NOT NULL,
  route_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.favorite_routes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own favorite routes" 
ON public.favorite_routes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorite routes" 
ON public.favorite_routes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite routes" 
ON public.favorite_routes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite routes" 
ON public.favorite_routes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_favorite_routes_updated_at
BEFORE UPDATE ON public.favorite_routes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();