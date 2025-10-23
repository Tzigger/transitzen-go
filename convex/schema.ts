import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  }).index("by_email", ["email"]),

  userPreferences: defineTable({
    userId: v.id("profiles"),
    notificationsEnabled: v.boolean(),
    darkModeEnabled: v.boolean(),
    language: v.string(),
    units: v.string(),
  }).index("by_user", ["userId"]),

  journeys: defineTable({
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
    status: v.union(
      v.literal("scheduled"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    isActive: v.boolean(),
    notifyDeparture: v.boolean(),
    notifyDelays: v.boolean(),
    notifyCrowding: v.boolean(),
    notifyRouteChanges: v.boolean(),
    recurringDays: v.optional(v.any()),
    routeDetails: v.optional(v.any()),
    startedAt: v.optional(v.string()),
    departureNotifiedAt: v.optional(v.string()),
    preDepartureNotifiedAt: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_and_status", ["userId", "status"]),

  journeyNotifications: defineTable({
    userId: v.id("profiles"),
    journeyId: v.id("journeys"),
    type: v.union(v.literal("pre_departure"), v.literal("departure")),
    title: v.string(),
    body: v.string(),
    scheduledAt: v.string(),
    sentAt: v.optional(v.string()),
  }).index("by_journey", ["journeyId"])
    .index("by_user", ["userId"]),

  favoriteRoutes: defineTable({
    userId: v.id("profiles"),
    name: v.string(),
    origin: v.string(),
    originLat: v.number(),
    originLng: v.number(),
    destination: v.string(),
    destinationLat: v.number(),
    destinationLng: v.number(),
    routeInfo: v.optional(v.any()),
  }).index("by_user", ["userId"]),

  paymentMethods: defineTable({
    userId: v.id("profiles"),
    cardNumber: v.string(),
    cardHolderName: v.string(),
    expiryDate: v.string(),
    isDefault: v.boolean(),
  }).index("by_user", ["userId"]),

  walletTransactions: defineTable({
    userId: v.id("profiles"),
    amount: v.number(),
    type: v.union(v.literal("credit"), v.literal("debit")),
    description: v.string(),
    balance: v.number(),
  }).index("by_user", ["userId"]),

  tickets: defineTable({
    userId: v.id("profiles"),
    ticketId: v.string(),
    ticketType: v.union(v.literal("simple"), v.literal("day"), v.literal("month")),
    price: v.number(),
    paymentStatus: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
    paymentMethod: v.string(),
    expiresAt: v.string(),
    qrData: v.any(),
  }).index("by_user", ["userId"])
    .index("by_ticket_id", ["ticketId"]),

  // Transit data tables
  transitVehicles: defineTable({
    vehicleId: v.string(),
    routeId: v.string(),
    label: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    speed: v.number(),
    timestamp: v.string(),
    vehicleType: v.number(), // 0=tram, 1=bus
    wheelchairAccessible: v.string(),
    lastUpdated: v.number(),
  }).index("by_vehicle_id", ["vehicleId"])
    .index("by_route_id", ["routeId"])
    .index("by_last_updated", ["lastUpdated"]),

  transitStops: defineTable({
    stopId: v.string(),
    stopName: v.string(),
    stopLat: v.number(),
    stopLon: v.number(),
    stopCode: v.optional(v.string()),
  }).index("by_stop_id", ["stopId"]),

  transitRoutes: defineTable({
    routeId: v.string(),
    routeShortName: v.string(),
    routeLongName: v.string(),
    shapes: v.array(v.object({
      lat: v.number(),
      lon: v.number(),
      sequence: v.number(),
    })),
  }).index("by_route_id", ["routeId"]),

  transitTrips: defineTable({
    tripId: v.string(),
    routeId: v.string(),
    shapeId: v.optional(v.string()),
  }).index("by_trip_id", ["tripId"])
    .index("by_route_id", ["routeId"]),

  transitStopTimes: defineTable({
    tripId: v.string(),
    stopId: v.string(),
    stopSequence: v.number(),
    arrivalTime: v.optional(v.string()),
    departureTime: v.optional(v.string()),
  }).index("by_trip_id", ["tripId"])
    .index("by_stop_id", ["stopId"]),
});
