import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getPaymentMethods = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paymentMethods")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const addPaymentMethod = mutation({
  args: {
    userId: v.id("profiles"),
    cardNumber: v.string(),
    cardHolderName: v.string(),
    expiryDate: v.string(),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    // If this is set as default, unset other defaults
    if (args.isDefault) {
      const existingMethods = await ctx.db
        .query("paymentMethods")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
      
      for (const method of existingMethods) {
        if (method.isDefault) {
          await ctx.db.patch(method._id, { isDefault: false });
        }
      }
    }
    
    const paymentMethodId = await ctx.db.insert("paymentMethods", {
      userId: args.userId,
      cardNumber: args.cardNumber,
      cardHolderName: args.cardHolderName,
      expiryDate: args.expiryDate,
      isDefault: args.isDefault,
    });
    
    return paymentMethodId;
  },
});

export const deletePaymentMethod = mutation({
  args: { paymentMethodId: v.id("paymentMethods") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.paymentMethodId);
    return { success: true };
  },
});

export const setDefaultPaymentMethod = mutation({
  args: {
    userId: v.id("profiles"),
    paymentMethodId: v.id("paymentMethods"),
  },
  handler: async (ctx, args) => {
    // Unset all defaults
    const methods = await ctx.db
      .query("paymentMethods")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const method of methods) {
      await ctx.db.patch(method._id, { isDefault: false });
    }
    
    // Set the new default
    await ctx.db.patch(args.paymentMethodId, { isDefault: true });
    
    return { success: true };
  },
});
