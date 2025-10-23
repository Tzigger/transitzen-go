// DEPRECATED: This file has been replaced by Convex
// Supabase is no longer used in this project
// Please use the Convex client instead: import { useQuery, useMutation } from "convex/react"
// See CONVEX_MIGRATION.md for migration guide

const throwDeprecationError = () => {
  throw new Error(
    'Supabase has been replaced with Convex. ' +
    'Please use Convex hooks instead. ' +
    'See CONVEX_MIGRATION.md for migration guide.'
  );
};

// Stub export to prevent import errors during migration
export const supabase = {
  auth: {
    getSession: throwDeprecationError,
    getUser: throwDeprecationError,
    signIn: throwDeprecationError,
    signUp: throwDeprecationError,
    signOut: throwDeprecationError,
    onAuthStateChange: throwDeprecationError,
  },
  from: throwDeprecationError,
};
