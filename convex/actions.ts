import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Action to fetch transit data (for polling instead of subscription)
export const fetchTransitData = action({
  args: {},
  handler: async (ctx) => {
    return await ctx.runQuery(api.transit.getTransitData);
  },
});

// Search for places using Google Maps Places API
export const searchPlaces = action({
  args: {
    query: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    try {
      // Input validation
      if (!args.query || typeof args.query !== 'string') {
        return { results: [], error: 'Valid search query is required' };
      }

      if (args.query.length > 500) {
        return { results: [], error: 'Search query too long (max 500 characters)' };
      }

      const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
      
      if (!GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key not configured');
        // Fallback to Nominatim if no API key
        const url = `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(args.query)}` +
          `&format=json` +
          `&limit=10` +
          `&addressdetails=1` +
          `&bounded=1` +
          `&viewbox=${args.location.lng - 0.5},${args.location.lat + 0.5},${args.location.lng + 0.5},${args.location.lat - 0.5}`;

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'TransitZen App'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to search places');
        }

        const data = await response.json();

        const results = data.map((place: any) => ({
          name: place.name || place.display_name.split(',')[0],
          address: place.display_name,
          location: {
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon),
          },
        }));

        return { results };
      }

      // Use Google Places API Text Search - restricted to Iasi, Romania
      const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
      placesUrl.searchParams.append('query', `${args.query} Iași Romania`);
      placesUrl.searchParams.append('location', `${args.location.lat},${args.location.lng}`);
      placesUrl.searchParams.append('radius', '20000'); // 20km radius around Iasi
      placesUrl.searchParams.append('region', 'ro'); // Bias results to Romania
      placesUrl.searchParams.append('key', GOOGLE_MAPS_API_KEY);

      const response = await fetch(placesUrl.toString());
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API error:', data);
        return { results: [], error: `Failed to search places: ${data.status}` };
      }

      // Format results - filter to only include results from Iasi
      const results = data.results
        .filter((place: any) => {
          const address = place.formatted_address?.toLowerCase() || '';
          return address.includes('iași') || address.includes('iasi');
        })
        .map((place: any) => ({
          name: place.name,
          address: place.formatted_address,
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
          types: place.types,
          placeId: place.place_id,
        }));

      return { results };
    } catch (error) {
      console.error('Error searching places:', error);
      return { results: [], error: 'Internal server error' };
    }
  },
});

// Calculate transit route with walking and public transport segments
export const calculateTransitRoute = action({
  args: {
    origin: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    destination: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    arrivalTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
      
      if (!GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key not configured');
        return { error: 'API key not configured' };
      }

      // Use Google Directions API with transit mode
      const directionsUrl = new URL('https://maps.googleapis.com/maps/api/directions/json');
      directionsUrl.searchParams.append('origin', `${args.origin.lat},${args.origin.lng}`);
      directionsUrl.searchParams.append('destination', `${args.destination.lat},${args.destination.lng}`);
      directionsUrl.searchParams.append('mode', 'transit');
      directionsUrl.searchParams.append('transit_mode', 'bus|tram');
      directionsUrl.searchParams.append('alternatives', 'true'); // Obține rute alternative
      directionsUrl.searchParams.append('region', 'ro');
      directionsUrl.searchParams.append('language', 'ro');
      directionsUrl.searchParams.append('traffic_model', 'best_guess'); // Include date despre trafic
      directionsUrl.searchParams.append('key', GOOGLE_MAPS_API_KEY);

      if (args.arrivalTime) {
        directionsUrl.searchParams.append('arrival_time', args.arrivalTime.toString());
      } else {
        directionsUrl.searchParams.append('departure_time', 'now');
      }

      const response = await fetch(directionsUrl.toString());
      const data = await response.json();

      if (data.status !== 'OK') {
        console.error('Google Directions API error:', data);
        return { error: `Failed to calculate route: ${data.status}` };
      }

      // Parse and format routes
      const routes = data.routes.map((route: any) => {
        const legs: any[] = [];
        
        // Process each leg of the route
        route.legs.forEach((leg: any) => {
          leg.steps.forEach((step: any, stepIndex: number) => {
            let coordinates: Array<{ lat: number; lng: number }> = [];
            
            // Try to get coordinates from polyline
            if (step.polyline?.points) {
              coordinates = decodePolyline(step.polyline.points);
            } else {
              // Fallback: use start and end location if no polyline
              console.log('⚠️ Step without polyline, using start/end locations');
              if (step.start_location && step.end_location) {
                coordinates = [
                  { lat: step.start_location.lat, lng: step.start_location.lng },
                  { lat: step.end_location.lat, lng: step.end_location.lng },
                ];
              }
            }

            // Skip if no coordinates
            if (coordinates.length === 0) {
              console.log('⚠️ Skipping step with no coordinates:', stepIndex);
              return;
            }

            const legData: any = {
              mode: step.travel_mode === 'WALKING' ? 'WALK' : 'TRANSIT',
              distance: step.distance?.text || '',
              duration: step.duration?.text || '',
              coordinates: coordinates,
              startLocation: step.start_location,
              endLocation: step.end_location,
            };

            if (step.travel_mode === 'TRANSIT' && step.transit_details) {
              const transit = step.transit_details;
              legData.routeShortName = transit.line?.short_name || transit.line?.name || '';
              legData.routeColor = transit.line?.color ? `#${transit.line.color}` : '#3B82F6';
              legData.from = transit.departure_stop?.name || '';
              legData.to = transit.arrival_stop?.name || '';
              legData.vehicleType = transit.line?.vehicle?.type || 'BUS';
              legData.numStops = transit.num_stops || 0;
              // Extrage timpii de plecare și sosire
              legData.departureTime = transit.departure_time?.text || '';
              legData.arrivalTime = transit.arrival_time?.text || '';
            }

            legs.push(legData);
          });
        });

        console.log(`✅ Processed route with ${legs.length} legs, total coordinates:`, 
          legs.reduce((sum, leg) => sum + (leg.coordinates?.length || 0), 0));

        // Calculate some metadata for the route
        const transitLegs = legs.filter(leg => leg.mode === 'TRANSIT');
        const walkingLegs = legs.filter(leg => leg.mode === 'WALK');
        const transferCount = Math.max(0, transitLegs.length - 1);

        // Extract departure and arrival times from the main leg (first leg of route)
        const mainLeg = route.legs[0];
        const departureTime = mainLeg?.departure_time?.text || '';
        const arrivalTime = mainLeg?.arrival_time?.text || '';

        return {
          legs: legs,
          duration: mainLeg?.duration?.text || '',
          durationValue: mainLeg?.duration?.value || 0, // în secunde
          distance: mainLeg?.distance?.text || '',
          distanceValue: mainLeg?.distance?.value || 0, // în metri
          start: args.origin,
          end: args.destination,
          summary: route.summary || '',
          transferCount: transferCount,
          walkingDistance: walkingLegs.reduce((sum, leg) => sum + (leg.distance || 0), 0),
          // Estimare crowding bazată pe număr de transferuri (mai puține = mai aglomerat)
          estimatedCrowding: transferCount === 0 ? 'high' : transferCount === 1 ? 'medium' : 'low',
          warnings: route.warnings || [],
          // Timpii reali de la Google
          departureTime: departureTime,
          arrivalTime: arrivalTime,
        };
      });

      // Sortează rutele: cea mai rapidă prima
      routes.sort((a: any, b: any) => a.durationValue - b.durationValue);

      return { routes: routes };
    } catch (error) {
      console.error('Error calculating transit route:', error);
      return { error: 'Internal server error' };
    }
  },
});

// Helper function to decode Google's polyline encoding
function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const poly: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return poly;
}

// Plan a route (simplified version - you may want to integrate with a real transit API)
export const planRoute = action({
  args: {
    origin: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    destination: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    arrivalTime: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      // For now, return a mock route
      // In production, you would integrate with a real transit API like:
      // - OpenTripPlanner
      // - Google Directions API
      // - HERE Transit API
      // - Mapbox Directions API
      
      const mockRoute = {
        departureTime: new Date(args.arrivalTime * 1000 - 30 * 60 * 1000).toLocaleTimeString('ro-RO', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        arrivalTime: new Date(args.arrivalTime * 1000).toLocaleTimeString('ro-RO', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        totalDuration: 30,
        totalDistance: 5.2,
        segments: [
          {
            mode: 'WALK',
            duration: 5,
            distance: 0.4,
            instructions: 'Mergi către stația de autobuz',
          },
          {
            mode: 'BUS',
            duration: 20,
            distance: 4.5,
            line: '3',
            instructions: 'Ia autobuzul 3',
          },
          {
            mode: 'WALK',
            duration: 5,
            distance: 0.3,
            instructions: 'Mergi către destinație',
          },
        ],
      };

      return {
        routes: [mockRoute],
      };
    } catch (error) {
      console.error('Error planning route:', error);
      return { routes: [] };
    }
  },
});
