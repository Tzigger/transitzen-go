/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as favoriteRoutes from "../favoriteRoutes.js";
import type * as journeys from "../journeys.js";
import type * as paymentMethods from "../paymentMethods.js";
import type * as profiles from "../profiles.js";
import type * as tickets from "../tickets.js";
import type * as transit from "../transit.js";
import type * as transitSync from "../transitSync.js";
import type * as wallet from "../wallet.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  auth: typeof auth;
  crons: typeof crons;
  favoriteRoutes: typeof favoriteRoutes;
  journeys: typeof journeys;
  paymentMethods: typeof paymentMethods;
  profiles: typeof profiles;
  tickets: typeof tickets;
  transit: typeof transit;
  transitSync: typeof transitSync;
  wallet: typeof wallet;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
