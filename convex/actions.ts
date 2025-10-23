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
