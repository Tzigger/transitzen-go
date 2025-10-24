import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Update vehicle positions every 30 seconds (real-time tracking)
crons.interval(
  "update-vehicle-positions",
  { seconds: 30 },
  api.transitSync.syncVehiclePositions
);

// Sync static data (stops, routes, shapes) once per day at 3 AM
crons.daily(
  "sync-static-transit-data",
  { hourUTC: 3, minuteUTC: 0 }, // 3 AM UTC
  api.transitSync.syncStaticTransitData
);

export default crons;
