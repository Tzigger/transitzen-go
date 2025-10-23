import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all tickets for a user
export const getTickets = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return tickets;
  },
});

// Get a specific ticket by ticket ID
export const getTicket = query({
  args: { ticketId: v.string() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ticket_id", (q) => q.eq("ticketId", args.ticketId))
      .first();
    return ticket;
  },
});

// Get active (non-expired) tickets
export const getActiveTickets = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const now = new Date().toISOString();
    return tickets.filter(ticket => ticket.expiresAt > now && ticket.paymentStatus === "completed");
  },
});

// Create a new ticket
export const createTicket = mutation({
  args: {
    userId: v.id("profiles"),
    ticketId: v.string(),
    ticketType: v.union(v.literal("simple"), v.literal("day"), v.literal("month")),
    price: v.number(),
    paymentMethod: v.string(),
    expiresAt: v.string(),
    qrData: v.any(),
  },
  handler: async (ctx, args) => {
    const ticketId = await ctx.db.insert("tickets", {
      userId: args.userId,
      ticketId: args.ticketId,
      ticketType: args.ticketType,
      price: args.price,
      paymentStatus: "completed",
      paymentMethod: args.paymentMethod,
      expiresAt: args.expiresAt,
      qrData: args.qrData,
    });
    return ticketId;
  },
});

// Delete a ticket
export const deleteTicket = mutation({
  args: { id: v.id("tickets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
