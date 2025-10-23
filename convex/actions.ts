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

// Search for places using OpenStreetMap Nominatim API
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
      // Use Nominatim for place search
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
    } catch (error) {
      console.error('Error searching places:', error);
      return { results: [] };
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
