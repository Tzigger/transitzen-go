import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getWalletBalance = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Get the latest balance from the most recent transaction
    if (transactions.length === 0) {
      return { balance: 0, transactions: [] };
    }
    
    // Sort by creation time descending to get latest first
    const sorted = transactions.sort((a, b) => b._creationTime - a._creationTime);
    
    return {
      balance: sorted[0].balance,
      transactions: sorted,
    };
  },
});

export const getTransactions = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const addTransaction = mutation({
  args: {
    userId: v.id("profiles"),
    amount: v.number(),
    type: v.union(v.literal("credit"), v.literal("debit")),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current balance
    const transactions = await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const currentBalance = transactions.length > 0
      ? transactions.sort((a, b) => b._creationTime - a._creationTime)[0].balance
      : 0;
    
    // Calculate new balance
    const newBalance = args.type === "credit"
      ? currentBalance + args.amount
      : currentBalance - args.amount;
    
    // Create transaction
    const transactionId = await ctx.db.insert("walletTransactions", {
      userId: args.userId,
      amount: args.amount,
      type: args.type,
      description: args.description,
      balance: newBalance,
    });
    
    return { transactionId, balance: newBalance };
  },
});
