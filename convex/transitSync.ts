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

// Helper to compute hash of object for change detection
const hashObject = (obj: any): string => {
  return JSON.stringify(obj);
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

// Action to sync ONLY vehicle positions (runs every 30s)
export const syncVehiclePositions = action({
  args: {},
  handler: async (ctx) => {
    try {
      const { baseUrl } = resolveTransitConfig();
      const headers = getApiHeaders();

      console.log('🔄 Syncing vehicle positions from Tranzy.ai');

      // Fetch only vehicles
      const vehiclesRes = await fetch(`${baseUrl}/vehicles`, { headers });
      const vehiclesData = vehiclesRes.ok ? await vehiclesRes.json() : [];

      console.log(`📥 Fetched ${vehiclesData.length} vehicles`);

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

      // Clean old vehicles (older than 5 min)
      await ctx.runMutation(api.transit.cleanOldVehicles, {});

      console.log(`✅ Vehicle sync completed: ${vehiclesSaved} vehicles saved`);
    } catch (error) {
      console.error('❌ Error syncing vehicle positions:', error);
    }
  },
});

// Action to sync static data ONCE per day (stops, routes, shapes, trips, stop_times)
// MEMORY OPTIMIZED: Processes data in smaller chunks
export const syncStaticTransitData = action({
  args: {},
  handler: async (ctx) => {
    try {
      const { baseUrl } = resolveTransitConfig();
      const headers = getApiHeaders();

      console.log('🔄 Syncing static transit data from Tranzy.ai (daily sync)');

      // MEMORY OPTIMIZATION: Fetch data one at a time instead of all at once
      console.log('📥 Fetching stops...');
      const stopsRes = await fetch(`${baseUrl}/stops`, { headers });
      const stopsData = stopsRes.ok ? await stopsRes.json() : [];
      console.log(`📥 Fetched ${stopsData.length} stops`);

      // Save ALL stops in batches
      let stopsSaved = 0;
      let stopsSkipped = 0;
      const STOP_BATCH_SIZE = 50;
      console.log(`� Processing ${stopsData.length} stops in batches...`);
      
      for (let i = 0; i < stopsData.length; i += STOP_BATCH_SIZE) {
        const batch = stopsData.slice(i, i + STOP_BATCH_SIZE);
        
        for (const stop of batch) {
          try {
            const result = await ctx.runMutation(api.transit.upsertStop, {
              id: String(stop.stop_id),
              name: String(stop.stop_name),
              latitude: parseFloat(stop.stop_lat),
              longitude: parseFloat(stop.stop_lon),
              code: stop.stop_code ? String(stop.stop_code) : undefined,
            });
            
            if (result === 'skipped') {
              stopsSkipped++;
            } else {
              stopsSaved++;
            }
          } catch (error) {
            console.error(`Error saving stop ${stop.stop_id}:`, error);
          }
        }
        
        if (i % 200 === 0 && i > 0) {
          console.log(`🚏 Processed ${i}/${stopsData.length} stops`);
        }
      }

      console.log(`🚏 Stops: ${stopsSaved} saved, ${stopsSkipped} unchanged (total: ${stopsData.length})`);

      // MEMORY OPTIMIZATION: Fetch routes and process immediately
      console.log('📥 Fetching routes...');
      const routesRes = await fetch(`${baseUrl}/routes`, { headers });
      const routesData = routesRes.ok ? await routesRes.json() : [];
      console.log(`📥 Fetched ${routesData.length} routes`);

      console.log('📥 Fetching shapes...');
      const shapesRes = await fetch(`${baseUrl}/shapes`, { headers });
      const shapesData = shapesRes.ok ? await shapesRes.json() : [];
      console.log(`📥 Fetched ${shapesData.length} shape points`);

      console.log('📥 Fetching trips...');
      const tripsRes = await fetch(`${baseUrl}/trips`, { headers });
      const tripsData = tripsRes.ok ? await tripsRes.json() : [];
      console.log(`📥 Fetched ${tripsData.length} trips`);

      // MEMORY OPTIMIZATION: Process shapes in batches to avoid loading all at once
      console.log('🗺️  Processing shapes in batches...');
      const shapesByShapeId: Record<string, any[]> = {};
      const SHAPE_BATCH_SIZE = 1000;
      
      for (let i = 0; i < shapesData.length; i += SHAPE_BATCH_SIZE) {
        const batch = shapesData.slice(i, i + SHAPE_BATCH_SIZE);
        
        batch.forEach((point: any) => {
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
        
        if (i % 5000 === 0 && i > 0) {
          console.log(`🗺️  Processed ${i}/${shapesData.length} shape points`);
        }
      }

      // Sort shapes by sequence
      Object.keys(shapesByShapeId).forEach(shapeId => {
        shapesByShapeId[shapeId].sort((a, b) => a.sequence - b.sequence);
      });

      // Save routes with shapes in batches
      let routesSaved = 0;
      const ROUTE_BATCH_SIZE = 10;
      console.log(`🚌 Processing ${routesData.length} routes in batches...`);
      
      for (let i = 0; i < routesData.length; i += ROUTE_BATCH_SIZE) {
        const batch = routesData.slice(i, i + ROUTE_BATCH_SIZE);
        
        for (const route of batch) {
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
        
        if (i % 20 === 0 && i > 0) {
          console.log(`🚌 Processed ${i}/${routesData.length} routes`);
        }
      }

      // MEMORY OPTIMIZATION: Fetch and process trips in batches
      console.log('📥 Fetching stop times...');
      const stopTimesRes = await fetch(`${baseUrl}/stop_times`, { headers });
      const stopTimesData = stopTimesRes.ok ? await stopTimesRes.json() : [];
      console.log(`📥 Fetched ${stopTimesData.length} stop times`);

      // Save trips in batches
      let tripsSaved = 0;
      const TRIP_BATCH_SIZE = 50;
      console.log(`🚆 Processing ${tripsData.length} trips in batches...`);
      
      for (let i = 0; i < tripsData.length; i += TRIP_BATCH_SIZE) {
        const batch = tripsData.slice(i, i + TRIP_BATCH_SIZE);
        
        for (const trip of batch) {
          try {
            await ctx.runMutation(api.transit.upsertTrip, {
              trip_id: String(trip.trip_id),
              route_id: String(trip.route_id),
              shape_id: trip.shape_id ? String(trip.shape_id) : undefined,
            });
            tripsSaved++;
          } catch (error) {
            console.error(`Error saving trip ${trip.trip_id}:`, error);
          }
        }
        
        if (i % 100 === 0 && i > 0) {
          console.log(`🚆 Processed ${i}/${tripsData.length} trips`);
        }
      }

      // Save stop times in smaller batches to avoid timeouts and memory issues
      let stopTimesSaved = 0;
      const STOPTIME_BATCH_SIZE = 50; // Reduced from 100
      console.log(`⏰ Processing ${stopTimesData.length} stop times in batches...`);
      
      for (let i = 0; i < stopTimesData.length; i += STOPTIME_BATCH_SIZE) {
        const batch = stopTimesData.slice(i, i + STOPTIME_BATCH_SIZE);
        
        for (const stopTime of batch) {
          try {
            await ctx.runMutation(api.transit.upsertStopTime, {
              trip_id: String(stopTime.trip_id),
              stop_id: String(stopTime.stop_id),
              stop_sequence: parseInt(stopTime.stop_sequence),
              arrival_time: stopTime.arrival_time ? String(stopTime.arrival_time) : undefined,
              departure_time: stopTime.departure_time ? String(stopTime.departure_time) : undefined,
            });
            stopTimesSaved++;
          } catch (error) {
            console.error(`Error saving stop time:`, error);
          }
        }
        
        if (i % 250 === 0 && i > 0) {
          console.log(`⏰ Processed ${i}/${stopTimesData.length} stop times`);
        }
      }

      console.log(`✅ Static data sync completed:`);
      console.log(`   - ${stopsSaved} stops saved, ${stopsSkipped} unchanged`);
      console.log(`   - ${routesSaved} routes saved`);
      console.log(`   - ${tripsSaved} trips saved`);
      console.log(`   - ${stopTimesSaved} stop times saved`);
    } catch (error) {
      console.error('❌ Error syncing static transit data:', error);
    }
  },
});
