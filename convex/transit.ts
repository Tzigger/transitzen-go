import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Upsert individual vehicle
export const upsertVehicle = mutation({
  args: {
    id: v.string(),
    routeId: v.string(),
    label: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    speed: v.number(),
    timestamp: v.string(),
    vehicle_type: v.number(),
    wheelchair_accessible: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("transitVehicles")
      .withIndex("by_vehicle_id", (q) => q.eq("vehicleId", args.id))
      .first();

    const now = Date.now();
    const vehicleData = {
      vehicleId: args.id,
      routeId: args.routeId,
      label: args.label,
      latitude: args.latitude,
      longitude: args.longitude,
      speed: args.speed,
      timestamp: args.timestamp,
      vehicleType: args.vehicle_type,
      wheelchairAccessible: args.wheelchair_accessible,
      lastUpdated: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, vehicleData);
      return existing._id;
    } else {
      return await ctx.db.insert("transitVehicles", vehicleData);
    }
  },
});

// Upsert individual stop
export const upsertStop = mutation({
  args: {
    id: v.string(),
    name: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    code: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("transitStops")
      .withIndex("by_stop_id", (q) => q.eq("stopId", args.id))
      .first();

    if (existing) {
      // Stops are static - don't update if already exists
      return 'skipped';
    }

    const newId = await ctx.db.insert("transitStops", {
      stopId: args.id,
      stopName: args.name,
      stopLat: args.latitude,
      stopLon: args.longitude,
      stopCode: args.code,
    });
    
    return newId;
  },
});

// Upsert individual route
export const upsertRoute = mutation({
  args: {
    route_id: v.string(),
    route_short_name: v.string(),
    route_long_name: v.string(),
    shapes: v.array(v.object({
      lat: v.number(),
      lon: v.number(),
      sequence: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("transitRoutes")
      .withIndex("by_route_id", (q) => q.eq("routeId", args.route_id))
      .first();

    const routeData = {
      routeId: args.route_id,
      routeShortName: args.route_short_name,
      routeLongName: args.route_long_name,
      shapes: args.shapes,
    };

    if (existing) {
      await ctx.db.patch(existing._id, routeData);
      return existing._id;
    } else {
      return await ctx.db.insert("transitRoutes", routeData);
    }
  },
});

// Upsert individual trip
export const upsertTrip = mutation({
  args: {
    trip_id: v.string(),
    route_id: v.string(),
    shape_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("transitTrips")
      .withIndex("by_trip_id", (q) => q.eq("tripId", args.trip_id))
      .first();

    const tripData = {
      tripId: args.trip_id,
      routeId: args.route_id,
      shapeId: args.shape_id,
    };

    if (existing) {
      await ctx.db.patch(existing._id, tripData);
      return existing._id;
    } else {
      return await ctx.db.insert("transitTrips", tripData);
    }
  },
});

// Upsert individual stop time
export const upsertStopTime = mutation({
  args: {
    trip_id: v.string(),
    stop_id: v.string(),
    stop_sequence: v.number(),
    arrival_time: v.optional(v.string()),
    departure_time: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Delete existing stop time for this trip+stop+sequence combination
    const existing = await ctx.db
      .query("transitStopTimes")
      .withIndex("by_trip_id", (q) => q.eq("tripId", args.trip_id))
      .filter((q) => 
        q.and(
          q.eq(q.field("stopId"), args.stop_id),
          q.eq(q.field("stopSequence"), args.stop_sequence)
        )
      )
      .first();

    const stopTimeData = {
      tripId: args.trip_id,
      stopId: args.stop_id,
      stopSequence: args.stop_sequence,
      arrivalTime: args.arrival_time,
      departureTime: args.departure_time,
    };

    if (existing) {
      await ctx.db.patch(existing._id, stopTimeData);
      return existing._id;
    } else {
      return await ctx.db.insert("transitStopTimes", stopTimeData);
    }
  },
});

// Clean old vehicles (called periodically)
export const cleanOldVehicles = mutation({
  args: {},
  handler: async (ctx) => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const oldVehicles = await ctx.db
      .query("transitVehicles")
      .withIndex("by_last_updated")
      .filter((q) => q.lt(q.field("lastUpdated"), fiveMinutesAgo))
      .take(100); // Process in batches

    for (const vehicle of oldVehicles) {
      await ctx.db.delete(vehicle._id);
    }

    return { deleted: oldVehicles.length };
  },
});

// Mutation to save transit data (DEPRECATED - use individual upserts)
export const saveTransitData = mutation({
  args: {
    vehicles: v.array(v.object({
      id: v.string(),
      routeId: v.string(),
      label: v.string(),
      latitude: v.number(),
      longitude: v.number(),
      speed: v.number(),
      timestamp: v.string(),
      vehicle_type: v.number(),
      wheelchair_accessible: v.string(),
    })),
    stops: v.array(v.object({
      id: v.string(),
      name: v.string(),
      latitude: v.number(),
      longitude: v.number(),
      code: v.optional(v.string()),
    })),
    routes: v.array(v.object({
      route_id: v.string(),
      route_short_name: v.string(),
      route_long_name: v.string(),
      shapes: v.array(v.object({
        lat: v.number(),
        lon: v.number(),
        sequence: v.number(),
      })),
    })),
    trips: v.optional(v.array(v.object({
      trip_id: v.string(),
      route_id: v.string(),
      shape_id: v.optional(v.string()),
    }))),
    stopTimes: v.optional(v.array(v.object({
      trip_id: v.string(),
      stop_id: v.string(),
      stop_sequence: v.number(),
      arrival_time: v.optional(v.string()),
      departure_time: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Delete old vehicle positions (older than 5 minutes)
    const oldVehicles = await ctx.db
      .query("transitVehicles")
      .withIndex("by_last_updated")
      .filter((q) => q.lt(q.field("lastUpdated"), now - 5 * 60 * 1000))
      .collect();
    
    for (const vehicle of oldVehicles) {
      await ctx.db.delete(vehicle._id);
    }

    // Save vehicles
    for (const vehicle of args.vehicles) {
      const existing = await ctx.db
        .query("transitVehicles")
        .withIndex("by_vehicle_id", (q) => q.eq("vehicleId", vehicle.id))
        .first();

      const vehicleData = {
        vehicleId: vehicle.id,
        routeId: vehicle.routeId,
        label: vehicle.label,
        latitude: vehicle.latitude,
        longitude: vehicle.longitude,
        speed: vehicle.speed,
        timestamp: vehicle.timestamp,
        vehicleType: vehicle.vehicle_type,
        wheelchairAccessible: vehicle.wheelchair_accessible,
        lastUpdated: now,
      };

      if (existing) {
        await ctx.db.patch(existing._id, vehicleData);
      } else {
        await ctx.db.insert("transitVehicles", vehicleData);
      }
    }

    // Save stops (only if they don't exist)
    for (const stop of args.stops) {
      const existing = await ctx.db
        .query("transitStops")
        .withIndex("by_stop_id", (q) => q.eq("stopId", stop.id))
        .first();

      if (!existing) {
        await ctx.db.insert("transitStops", {
          stopId: stop.id,
          stopName: stop.name,
          stopLat: stop.latitude,
          stopLon: stop.longitude,
          stopCode: stop.code,
        });
      }
    }

    // Save routes
    for (const route of args.routes) {
      const existing = await ctx.db
        .query("transitRoutes")
        .withIndex("by_route_id", (q) => q.eq("routeId", route.route_id))
        .first();

      const routeData = {
        routeId: route.route_id,
        routeShortName: route.route_short_name,
        routeLongName: route.route_long_name,
        shapes: route.shapes,
      };

      if (existing) {
        await ctx.db.patch(existing._id, routeData);
      } else {
        await ctx.db.insert("transitRoutes", routeData);
      }
    }

    // Save trips if provided
    if (args.trips) {
      for (const trip of args.trips) {
        const existing = await ctx.db
          .query("transitTrips")
          .withIndex("by_trip_id", (q) => q.eq("tripId", trip.trip_id))
          .first();

        const tripData = {
          tripId: trip.trip_id,
          routeId: trip.route_id,
          shapeId: trip.shape_id,
        };

        if (existing) {
          await ctx.db.patch(existing._id, tripData);
        } else {
          await ctx.db.insert("transitTrips", tripData);
        }
      }
    }

    // Save stop times if provided
    if (args.stopTimes) {
      // First, delete old stop times for updated trips
      const tripIds = new Set(args.stopTimes.map(st => st.trip_id));
      for (const tripId of tripIds) {
        const oldStopTimes = await ctx.db
          .query("transitStopTimes")
          .withIndex("by_trip_id", (q) => q.eq("tripId", tripId))
          .collect();
        
        for (const oldStopTime of oldStopTimes) {
          await ctx.db.delete(oldStopTime._id);
        }
      }

      // Insert new stop times
      for (const stopTime of args.stopTimes) {
        await ctx.db.insert("transitStopTimes", {
          tripId: stopTime.trip_id,
          stopId: stopTime.stop_id,
          stopSequence: stopTime.stop_sequence,
          arrivalTime: stopTime.arrival_time,
          departureTime: stopTime.departure_time,
        });
      }
    }

    console.log(`✅ Saved ${args.vehicles.length} vehicles, ${args.stops.length} stops, ${args.routes.length} routes`);
    return { success: true };
  },
});

// Query to get all active vehicles
export const getVehicles = query({
  args: {},
  handler: async (ctx) => {
    const vehicles = await ctx.db
      .query("transitVehicles")
      .collect();

    return vehicles.map(v => ({
      id: v.vehicleId,
      routeId: v.routeId,
      label: v.label,
      latitude: v.latitude,
      longitude: v.longitude,
      speed: v.speed,
      timestamp: v.timestamp,
      vehicle_type: v.vehicleType,
      wheelchair_accessible: v.wheelchairAccessible,
    }));
  },
});

// Query to get all stops
export const getStops = query({
  args: {},
  handler: async (ctx) => {
    const stops = await ctx.db
      .query("transitStops")
      .collect();

    return stops.map(s => ({
      id: s.stopId,
      name: s.stopName,
      latitude: s.stopLat,
      longitude: s.stopLon,
      code: s.stopCode,
    }));
  },
});

// Query to get all routes
export const getRoutes = query({
  args: {},
  handler: async (ctx) => {
    const routes = await ctx.db
      .query("transitRoutes")
      .collect();

    return routes.map(r => ({
      route_id: r.routeId,
      route_short_name: r.routeShortName,
      route_long_name: r.routeLongName,
      shapes: r.shapes,
    }));
  },
});

// Query to get trip stop sequences
export const getTripStopSequences = query({
  args: {},
  handler: async (ctx) => {
    const stopTimes = await ctx.db
      .query("transitStopTimes")
      .collect();

    const tripStopSequences: Record<string, any[]> = {};
    
    for (const stopTime of stopTimes) {
      if (!tripStopSequences[stopTime.tripId]) {
        tripStopSequences[stopTime.tripId] = [];
      }
      
      tripStopSequences[stopTime.tripId].push({
        stopId: stopTime.stopId,
        sequence: stopTime.stopSequence,
        arrivalTime: stopTime.arrivalTime,
        departureTime: stopTime.departureTime,
      });
    }

    // Sort by sequence
    Object.keys(tripStopSequences).forEach(tripId => {
      tripStopSequences[tripId].sort((a, b) => a.sequence - b.sequence);
    });

    return tripStopSequences;
  },
});

// Query to get route to trip map
export const getRouteToTripMap = query({
  args: {},
  handler: async (ctx) => {
    const trips = await ctx.db
      .query("transitTrips")
      .collect();

    const routeToTripMap: Record<string, string> = {};
    
    for (const trip of trips) {
      routeToTripMap[trip.routeId] = trip.tripId;
    }

    return routeToTripMap;
  },
});

// Query to get complete transit data (for frontend)
export const getTransitData = query({
  args: {},
  handler: async (ctx) => {
    const [vehicles, stops, routes, stopTimes, trips] = await Promise.all([
      ctx.db.query("transitVehicles").collect(),
      ctx.db.query("transitStops").collect(),
      ctx.db.query("transitRoutes").collect(),
      ctx.db.query("transitStopTimes").collect(),
      ctx.db.query("transitTrips").collect(),
    ]);

    // Format trip stop sequences
    const tripStopSequences: Record<string, any[]> = {};
    for (const stopTime of stopTimes) {
      if (!tripStopSequences[stopTime.tripId]) {
        tripStopSequences[stopTime.tripId] = [];
      }
      tripStopSequences[stopTime.tripId].push({
        stopId: stopTime.stopId,
        sequence: stopTime.stopSequence,
        arrivalTime: stopTime.arrivalTime,
        departureTime: stopTime.departureTime,
      });
    }
    
    Object.keys(tripStopSequences).forEach(tripId => {
      tripStopSequences[tripId].sort((a, b) => a.sequence - b.sequence);
    });

    // Format route to trip map
    const routeToTripMap: Record<string, string> = {};
    for (const trip of trips) {
      routeToTripMap[trip.routeId] = trip.tripId;
    }

    return {
      vehicles: vehicles.map(v => ({
        id: v.vehicleId,
        routeId: v.routeId,
        label: v.label,
        latitude: v.latitude,
        longitude: v.longitude,
        speed: v.speed,
        timestamp: v.timestamp,
        vehicle_type: v.vehicleType,
        wheelchair_accessible: v.wheelchairAccessible,
      })),
      stops: stops.map(s => ({
        id: s.stopId,
        name: s.stopName,
        latitude: s.stopLat,
        longitude: s.stopLon,
        code: s.stopCode,
      })),
      routes: routes.map(r => ({
        route_id: r.routeId,
        route_short_name: r.routeShortName,
        route_long_name: r.routeLongName,
        shapes: r.shapes,
      })),
      routeToTripMap,
      tripStopSequences,
      timestamp: new Date().toISOString(),
    };
  },
});

// Query to get transit data within viewport bounds (for efficient map rendering)
export const getTransitDataInViewport = query({
  args: {
    minLat: v.number(),
    maxLat: v.number(),
    minLng: v.number(),
    maxLng: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all data but filter vehicles and stops by viewport
    const [allVehicles, allStops, routes, stopTimes, trips] = await Promise.all([
      ctx.db.query("transitVehicles").collect(),
      ctx.db.query("transitStops").collect(),
      ctx.db.query("transitRoutes").collect(),
      ctx.db.query("transitStopTimes").collect(),
      ctx.db.query("transitTrips").collect(),
    ]);

    // Filter vehicles within viewport
    const vehicles = allVehicles.filter(v => 
      v.latitude >= args.minLat && 
      v.latitude <= args.maxLat &&
      v.longitude >= args.minLng && 
      v.longitude <= args.maxLng
    );

    // Filter stops within viewport
    const stops = allStops.filter(s => 
      s.stopLat >= args.minLat && 
      s.stopLat <= args.maxLat &&
      s.stopLon >= args.minLng && 
      s.stopLon <= args.maxLng
    );

    // Get route IDs for visible vehicles
    const visibleRouteIds = new Set(vehicles.map(v => v.routeId));
    
    // Only include routes that have visible vehicles
    const visibleRoutes = routes.filter(r => visibleRouteIds.has(r.routeId));

    // Format trip stop sequences
    const tripStopSequences: Record<string, any[]> = {};
    for (const stopTime of stopTimes) {
      if (!tripStopSequences[stopTime.tripId]) {
        tripStopSequences[stopTime.tripId] = [];
      }
      tripStopSequences[stopTime.tripId].push({
        stopId: stopTime.stopId,
        sequence: stopTime.stopSequence,
        arrivalTime: stopTime.arrivalTime,
        departureTime: stopTime.departureTime,
      });
    }
    
    Object.keys(tripStopSequences).forEach(tripId => {
      tripStopSequences[tripId].sort((a, b) => a.sequence - b.sequence);
    });

    // Format route to trip map (only for visible routes)
    const routeToTripMap: Record<string, string> = {};
    for (const trip of trips) {
      if (visibleRouteIds.has(trip.routeId)) {
        routeToTripMap[trip.routeId] = trip.tripId;
      }
    }

    return {
      vehicles: vehicles.map(v => ({
        id: v.vehicleId,
        routeId: v.routeId,
        label: v.label,
        latitude: v.latitude,
        longitude: v.longitude,
        speed: v.speed,
        timestamp: v.timestamp,
        vehicle_type: v.vehicleType,
        wheelchair_accessible: v.wheelchairAccessible,
      })),
      stops: stops.map(s => ({
        id: s.stopId,
        name: s.stopName,
        latitude: s.stopLat,
        longitude: s.stopLon,
        code: s.stopCode,
      })),
      routes: visibleRoutes.map(r => ({
        route_id: r.routeId,
        route_short_name: r.routeShortName,
        route_long_name: r.routeLongName,
        shapes: r.shapes,
      })),
      routeToTripMap,
      tripStopSequences,
      timestamp: new Date().toISOString(),
    };
  },
});
