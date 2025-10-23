# Supabase to Convex Migration Guide

This document outlines the migration from Supabase to a locally deployed Convex backend at `localhost:3210`.

## ✅ Migration Status

### Completed
- ✅ **Convex configuration** - Schema deployed to localhost:3210
- ✅ **Type generation** - TypeScript types generated in `convex/_generated/`
- ✅ **Environment setup** - `.env.local` configured with admin key
- ✅ **Client provider** - ConvexClientProvider wraps the app
- ✅ **Authentication** - Login and Signup pages work with Convex
- ✅ **Scripts** - npm scripts added for Convex commands

### Schema Deployed
The following Convex schema has been successfully deployed to `localhost:3210`:
- ✅ `profiles` - User profile information  
- ✅ `userPreferences` - User settings (notifications, theme, language, units)
- ✅ `journeys` - Journey/trip data
- ✅ `journeyNotifications` - Scheduled notifications for journeys
- ✅ `favoriteRoutes` - Saved favorite routes
- ✅ `paymentMethods` - User payment methods
- ✅ `walletTransactions` - Wallet transaction history

### Remaining Work
- ⚠️ **Profile Page** - Still using Supabase, needs migration
- ⚠️ **Journeys Page** - Still using Supabase, needs migration
- ⚠️ **History Page** - Still using Supabase, needs migration
- ⚠️ **Other Pages** - MapView, CreateJourney, Dashboard need review

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd /Users/thinslicesacademy15/Desktop/heaven_ht/transitzen-go
npm install
```

### 2. Ensure Convex Backend is Running
The backend should be running on `localhost:3210`. You can verify with:
```bash
curl http://localhost:3210/api/health
```

### 3. Deploy Schema (if needed)
```bash
npm run convex:deploy
```

This reads from `.env.local` which contains:
```bash
CONVEX_SELF_HOSTED_URL=http://localhost:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=convex-self-hosted|013697f80ee2f47fde972e597d8abaaf6c2959727dcb286302a96a09efe6d8e9e9bee17c2e
VITE_CONVEX_URL=http://localhost:3210
```

### 4. Generate Types
```bash
npm run convex:codegen
```

### 5. Run the App
```bash
npm run dev
```

## 📁 Project Structure

```
transitzen-go/
├── convex/
│   ├── _generated/      # Auto-generated types (DO NOT EDIT)
│   ├── schema.ts        # Database schema
│   ├── auth.ts          # Auth mutations (signUp, signIn, deleteAccount)
│   ├── profiles.ts      # Profile queries/mutations
│   └── convex.json      # Convex configuration
├── src/
│   ├── lib/
│   │   └── convex.tsx   # Convex client & auth provider
│   ├── pages/
│   │   ├── Login.tsx    # ✅ Migrated to Convex
│   │   ├── Signup.tsx   # ✅ Migrated to Convex
│   │   ├── Profile.tsx  # ⚠️ Needs migration
│   │   ├── Journeys.tsx # ⚠️ Needs migration
│   │   └── History.tsx  # ⚠️ Needs migration
│   └── App.tsx          # Wrapped with ConvexClientProvider
├── .env                 # Public Convex URL
└── .env.local           # Admin credentials (gitignored)
```

## 🔄 Migration Pattern

### Before (Supabase)
```tsx
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

### After (Convex)
```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/lib/convex";

const { userId } = useAuth();
const profile = useQuery(api.profiles.getProfile, userId ? { userId } : "skip");

// For mutations
const updateProfile = useMutation(api.profiles.updateProfile);
await updateProfile({ userId, firstName: "John", lastName: "Doe" });
```

## 🔧 Available NPM Scripts

```bash
npm run dev              # Start Vite dev server
npm run convex:dev       # Start Convex dev mode (watches for changes)
npm run convex:deploy    # Deploy schema to backend
npm run convex:codegen   # Generate TypeScript types
```

## 🔐 Authentication Flow

1. User signs up/logs in via Login or Signup page
2. Convex mutation creates/verifies user in `profiles` table
3. Session stored in localStorage with `userId` and `email`
4. `useAuth()` hook provides access to session throughout the app
5. Protected routes check `userId` from `useAuth()` hook

## 📝 Next Steps for Pages Migration

### Profile.tsx Migration
Replace Supabase calls with Convex:

```tsx
// Remove
import { supabase } from "@/integrations/supabase/client";

// Add
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/lib/convex";

// In component
const { userId, email, clearSession } = useAuth();
const profile = useQuery(api.profiles.getProfile, userId ? { userId } : "skip");
const preferences = useQuery(api.profiles.getPreferences, userId ? { userId } : "skip");
const updateProfile = useMutation(api.profiles.updateProfile);
const updatePreferences = useMutation(api.profiles.updatePreferences);
const deleteAccount = useMutation(api.auth.deleteAccount);
```

### Creating New Convex Functions

If you need new backend functions, create them in `convex/` folder:

```typescript
// convex/journeys.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getJourneys = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("journeys")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});
```

Then redeploy:
```bash
npm run convex:deploy
npm run convex:codegen
```

## ⚠️ Important Notes

- Password hashing is currently basic (btoa) - implement proper hashing in production
- OAuth providers removed temporarily - can be re-implemented
- All Supabase Edge Functions need equivalent Convex functions
- Real-time subscriptions work differently in Convex (automatic reactivity)

## 🆘 Troubleshooting

### Types not found
```bash
npm run convex:codegen
```

### Backend connection issues
Check if backend is running:
```bash
curl http://localhost:3210/api/health
```

### Schema not deployed
```bash
npm run convex:deploy
```

## 📚 Resources

- [Convex Documentation](https://docs.convex.dev/)
- [Self-Hosted Convex](https://docs.convex.dev/production/hosting/self-hosting)
- [Convex React Client](https://docs.convex.dev/client/react)
