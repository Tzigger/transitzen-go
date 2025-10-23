import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Simple password hashing (in production, use proper hashing like bcrypt)
function hashPassword(password: string): string {
  // This is a placeholder - in production use proper password hashing
  return btoa(password);
}

function verifyPassword(password: string, hash: string): boolean {
  return btoa(password) === hash;
}

export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("User already exists");
    }

    // Create profile
    const userId = await ctx.db.insert("profiles", {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
    });

    // Create default preferences
    await ctx.db.insert("userPreferences", {
      userId,
      notificationsEnabled: true,
      darkModeEnabled: true,
      language: "ro",
      units: "km",
    });

    // Store password hash (in a real app, use a separate auth table)
    // For this demo, we'll return the userId as the session token
    return { userId, email: args.email };
  },
});

export const signIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // In production, verify password hash
    // For now, just return the user
    return { userId: user._id, email: user.email };
  },
});

export const getSession = query({
  args: { userId: v.optional(v.id("profiles")) },
  handler: async (ctx, args) => {
    if (!args.userId) {
      return null;
    }

    const user = await ctx.db.get(args.userId);
    return user;
  },
});

export const deleteAccount = mutation({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    // Delete user preferences
    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const pref of preferences) {
      await ctx.db.delete(pref._id);
    }

    // Delete journeys
    const journeys = await ctx.db
      .query("journeys")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const journey of journeys) {
      await ctx.db.delete(journey._id);
    }

    // Delete favorite routes
    const routes = await ctx.db
      .query("favoriteRoutes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const route of routes) {
      await ctx.db.delete(route._id);
    }

    // Delete payment methods
    const payments = await ctx.db
      .query("paymentMethods")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const payment of payments) {
      await ctx.db.delete(payment._id);
    }

    // Delete wallet transactions
    const transactions = await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const transaction of transactions) {
      await ctx.db.delete(transaction._id);
    }

    // Finally delete the profile
    await ctx.db.delete(args.userId);

    return { success: true };
  },
});
