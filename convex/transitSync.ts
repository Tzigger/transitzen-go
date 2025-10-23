import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Tranzy API configuration for Iași transit
const resolveTransitConfig = () => {
  const baseUrl = process.env.TRANSIT_API_BASE_URL || 'https://api.tranzy.ai/v1/opendata';
  const apiKey = process.env.TRANSIT_API_KEY;
  const agencyId = process.env.TRANSIT_AGENCY_ID || "1";

  if (!apiKey) {
    throw new Error("Missing TRANSIT_API_KEY environment variable");
  }

  return { baseUrl, apiKey, agencyId } as const;
};

// Helper function to create API headers
const getApiHeaders = () => {
  const { apiKey, agencyId } = resolveTransitConfig();
  return {
    Accept: "application/json",
    "X-API-KEY": apiKey,
    "X-Agency-Id": agencyId,
  } as const;
};

// Action that runs periodically to sync transit data
export const syncTransitData = action({
  args: {},
  handler: async (ctx) => {
    try {
      const { baseUrl } = resolveTransitConfig();
      const headers = getApiHeaders();

      console.log('🔄 Syncing transit data from Tranzy.ai');


      // Fetch all data in parallel
      const [vehiclesRes, stopsRes, routesRes, shapesRes, tripsRes, stopTimesRes] = await Promise.all([
        fetch(`${baseUrl}/vehicles`, { headers }),
        fetch(`${baseUrl}/stops`, { headers }),
        fetch(`${baseUrl}/routes`, { headers }),
        fetch(`${baseUrl}/shapes`, { headers }),
        fetch(`${baseUrl}/trips`, { headers }),
        fetch(`${baseUrl}/stop_times`, { headers }),
      ]);

      // Parse responses
      const vehiclesData = vehiclesRes.ok ? await vehiclesRes.json() : [];
      const stopsData = stopsRes.ok ? await stopsRes.json() : [];
      const routesData = routesRes.ok ? await routesRes.json() : [];
      const shapesData = shapesRes.ok ? await shapesRes.json() : [];
      const tripsData = tripsRes.ok ? await tripsRes.json() : [];
      const stopTimesData = stopTimesRes.ok ? await stopTimesRes.json() : [];

      console.log(`📥 Fetched ${vehiclesData.length} vehicles, ${stopsData.length} stops, ${routesData.length} routes`);

      // Save vehicles individually (to avoid timeout)
      let vehiclesSaved = 0;
      for (const vehicle of vehiclesData) {
        try {
          await ctx.runMutation(api.transit.upsertVehicle, {
            id: String(vehicle.id),
            routeId: String(vehicle.route_id),
            label: vehicle.label ? String(vehicle.label) : 'N/A',
            latitude: parseFloat(vehicle.latitude),
            longitude: parseFloat(vehicle.longitude),
            speed: vehicle.speed ? parseFloat(vehicle.speed) : 0,
            timestamp: vehicle.timestamp || new Date().toISOString(),
            vehicle_type: vehicle.vehicle_type === 0 ? 0 : 1,
            wheelchair_accessible: vehicle.wheelchair_accessible || 'UNKNOWN',
          });
          vehiclesSaved++;
        } catch (error) {
          console.error(`Error saving vehicle ${vehicle.id}:`, error);
        }
      }

      // Save stops individually (but skip if already exist)
      let stopsSaved = 0;
      for (const stop of stopsData.slice(0, 100)) { // Limit to first 100 stops per sync
        try {
          await ctx.runMutation(api.transit.upsertStop, {
            id: String(stop.stop_id),
            name: String(stop.stop_name),
            latitude: parseFloat(stop.stop_lat),
            longitude: parseFloat(stop.stop_lon),
            code: stop.stop_code ? String(stop.stop_code) : undefined,
          });
          stopsSaved++;
        } catch (error) {
          console.error(`Error saving stop ${stop.stop_id}:`, error);
        }
      }

      // Group shapes by shape_id
      const shapesByShapeId: Record<string, any[]> = {};
      shapesData.forEach((point: any) => {
        const shapeId = point.shape_id;
        if (!shapesByShapeId[shapeId]) {
          shapesByShapeId[shapeId] = [];
        }
        shapesByShapeId[shapeId].push({
          lat: point.shape_pt_lat,
          lon: point.shape_pt_lon,
          sequence: point.shape_pt_sequence,
        });
      });

      // Sort shapes by sequence
      Object.keys(shapesByShapeId).forEach(shapeId => {
        shapesByShapeId[shapeId].sort((a, b) => a.sequence - b.sequence);
      });

      // Save routes individually with shapes
      let routesSaved = 0;
      for (const route of routesData) {
        try {
          const routeTrips = tripsData.filter((trip: any) => trip.route_id === route.route_id);
          let shapes: any[] = [];
          
          for (const trip of routeTrips) {
            if (trip.shape_id && shapesByShapeId[trip.shape_id]) {
              shapes = shapesByShapeId[trip.shape_id];
              break;
            }
          }

          await ctx.runMutation(api.transit.upsertRoute, {
            route_id: String(route.route_id),
            route_short_name: String(route.route_short_name),
            route_long_name: String(route.route_long_name),
            shapes,
          });
          routesSaved++;
        } catch (error) {
          console.error(`Error saving route ${route.route_id}:`, error);
        }
      }

      // Clean old vehicles
      await ctx.runMutation(api.transit.cleanOldVehicles, {});

      console.log(`✅ Sync completed: ${vehiclesSaved} vehicles, ${stopsSaved} stops, ${routesSaved} routes saved`);
    } catch (error) {
      console.error('❌ Error syncing transit data:', error);
    }
  },
});
