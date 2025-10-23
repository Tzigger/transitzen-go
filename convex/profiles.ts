import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getProfile = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.userId);
    return profile;
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("profiles"),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      firstName: args.firstName,
      lastName: args.lastName,
    });
    return { success: true };
  },
});

export const getPreferences = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    return preferences;
  },
});

export const updatePreferences = mutation({
  args: {
    userId: v.id("profiles"),
    notificationsEnabled: v.optional(v.boolean()),
    darkModeEnabled: v.optional(v.boolean()),
    language: v.optional(v.string()),
    units: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!preferences) {
      // Create if doesn't exist
      await ctx.db.insert("userPreferences", {
        userId: args.userId,
        notificationsEnabled: args.notificationsEnabled ?? true,
        darkModeEnabled: args.darkModeEnabled ?? true,
        language: args.language ?? "ro",
        units: args.units ?? "km",
      });
    } else {
      // Update existing
      const updates: any = {};
      if (args.notificationsEnabled !== undefined) updates.notificationsEnabled = args.notificationsEnabled;
      if (args.darkModeEnabled !== undefined) updates.darkModeEnabled = args.darkModeEnabled;
      if (args.language !== undefined) updates.language = args.language;
      if (args.units !== undefined) updates.units = args.units;
      
      await ctx.db.patch(preferences._id, updates);
    }

    return { success: true };
  },
});
