import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RouteSegment {
  mode: string;
  vehicle?: {
    type: string;
    line: string;
    name: string;
  };
  from: string;
  to: string;
  duration: string;
  durationMinutes: number;
  stops?: number;
  distance: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { origin, destination, arrivalTime } = await req.json();

    if (!origin || !destination) {
      return new Response(
        JSON.stringify({ error: 'Origin and destination are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const directionsUrl = new URL('https://maps.googleapis.com/maps/api/directions/json');
    directionsUrl.searchParams.append('origin', `${origin.lat},${origin.lng}`);
    directionsUrl.searchParams.append('destination', destination);
    directionsUrl.searchParams.append('mode', 'transit');
    directionsUrl.searchParams.append('transit_mode', 'bus|rail|tram');
    directionsUrl.searchParams.append('alternatives', 'true');
    
    if (arrivalTime) {
      directionsUrl.searchParams.append('arrival_time', arrivalTime);
    } else {
      directionsUrl.searchParams.append('departure_time', 'now');
    }
    
    directionsUrl.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    console.log('Fetching route from Google Maps...');
    const response = await fetch(directionsUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Maps API error:', data);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to calculate route', 
          details: data.status,
          message: data.error_message || 'No routes found'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process all route alternatives
    const routes = data.routes.map((route: any) => {
      const leg = route.legs[0];
      const segments: RouteSegment[] = [];

      leg.steps.forEach((step: any) => {
        if (step.travel_mode === 'TRANSIT' && step.transit_details) {
          const transit = step.transit_details;
          segments.push({
            mode: 'TRANSIT',
            vehicle: {
              type: transit.line.vehicle.type,
              line: transit.line.short_name || transit.line.name,
              name: transit.line.name,
            },
            from: transit.departure_stop.name,
            to: transit.arrival_stop.name,
            duration: step.duration.text,
            durationMinutes: Math.round(step.duration.value / 60),
            stops: transit.num_stops,
            distance: step.distance.text,
          });
        } else if (step.travel_mode === 'WALKING') {
          segments.push({
            mode: 'WALKING',
            from: '',
            to: '',
            duration: step.duration.text,
            durationMinutes: Math.round(step.duration.value / 60),
            distance: step.distance.text,
          });
        }
      });

      const totalDurationMinutes = Math.round(leg.duration.value / 60);
      
      // Calculate departure time based on arrival time
      let departureTime = '';
      if (leg.departure_time?.text) {
        departureTime = leg.departure_time.text;
      }

      return {
        totalDuration: totalDurationMinutes,
        totalDistance: leg.distance.text,
        segments,
        departureTime,
        arrivalTime: leg.arrival_time?.text || '',
      };
    });

    console.log(`Found ${routes.length} route(s)`);

    return new Response(
      JSON.stringify({ routes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in plan-route function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
