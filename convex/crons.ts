import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Update transit data every 30 seconds
crons.interval(
  "update-transit-data",
  { seconds: 30 },
  api.transitSync.syncTransitData
);

export default crons;
