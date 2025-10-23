import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getFavoriteRoutes = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("favoriteRoutes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const createFavoriteRoute = mutation({
  args: {
    userId: v.id("profiles"),
    name: v.string(),
    origin: v.string(),
    originLat: v.number(),
    originLng: v.number(),
    destination: v.string(),
    destinationLat: v.number(),
    destinationLng: v.number(),
    routeInfo: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const routeId = await ctx.db.insert("favoriteRoutes", {
      userId: args.userId,
      name: args.name,
      origin: args.origin,
      originLat: args.originLat,
      originLng: args.originLng,
      destination: args.destination,
      destinationLat: args.destinationLat,
      destinationLng: args.destinationLng,
      routeInfo: args.routeInfo,
    });
    
    return routeId;
  },
});

export const deleteFavoriteRoute = mutation({
  args: { routeId: v.id("favoriteRoutes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.routeId);
    return { success: true };
  },
});
