import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getJourneys = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("journeys")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getActiveJourneys = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("journeys")
      .withIndex("by_user_and_status", (q) => 
        q.eq("userId", args.userId).eq("status", "active")
      )
      .collect();
  },
});

export const getCompletedJourneys = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("journeys")
      .withIndex("by_user_and_status", (q) => 
        q.eq("userId", args.userId).eq("status", "completed")
      )
      .order("desc")
      .collect();
  },
});

export const createJourney = mutation({
  args: {
    userId: v.id("profiles"),
    origin: v.optional(v.string()),
    originLat: v.optional(v.number()),
    originLng: v.optional(v.number()),
    destination: v.string(),
    destinationLat: v.optional(v.number()),
    destinationLng: v.optional(v.number()),
    arrivalDate: v.string(),
    arrivalTime: v.string(),
    departureTime: v.optional(v.string()),
    estimatedDuration: v.optional(v.number()),
    notifyDeparture: v.boolean(),
    notifyDelays: v.boolean(),
    notifyCrowding: v.boolean(),
    notifyRouteChanges: v.boolean(),
    recurringDays: v.optional(v.any()),
    routeDetails: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const journeyId = await ctx.db.insert("journeys", {
      userId: args.userId,
      origin: args.origin,
      originLat: args.originLat,
      originLng: args.originLng,
      destination: args.destination,
      destinationLat: args.destinationLat,
      destinationLng: args.destinationLng,
      arrivalDate: args.arrivalDate,
      arrivalTime: args.arrivalTime,
      departureTime: args.departureTime,
      estimatedDuration: args.estimatedDuration,
      status: "scheduled",
      isActive: false,
      notifyDeparture: args.notifyDeparture,
      notifyDelays: args.notifyDelays,
      notifyCrowding: args.notifyCrowding,
      notifyRouteChanges: args.notifyRouteChanges,
      recurringDays: args.recurringDays,
      routeDetails: args.routeDetails,
    });
    
    return journeyId;
  },
});

export const updateJourneyStatus = mutation({
  args: {
    journeyId: v.id("journeys"),
    status: v.union(
      v.literal("scheduled"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.journeyId, {
      status: args.status,
      isActive: args.isActive ?? (args.status === "active"),
    });
    
    return { success: true };
  },
});

export const deleteJourney = mutation({
  args: { journeyId: v.id("journeys") },
  handler: async (ctx, args) => {
    // Delete associated notifications
    const notifications = await ctx.db
      .query("journeyNotifications")
      .withIndex("by_journey", (q) => q.eq("journeyId", args.journeyId))
      .collect();
    
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }
    
    // Delete the journey
    await ctx.db.delete(args.journeyId);
    
    return { success: true };
  },
});
