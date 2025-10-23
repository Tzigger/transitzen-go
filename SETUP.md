# TransitZen Go - Convex Backend Setup

This guide helps you connect the TransitZen Go mobile app to the locally hosted Convex backend running on `localhost:3210`.

## ✅ Completed Setup

Your project is now configured to work with the local Convex backend! Here's what has been done:

### 1. Configuration Files Created
- ✅ `convex/convex.json` - Points to `http://localhost:3210`
- ✅ `.env` - Contains public Convex URL
- ✅ `.env.local` - Contains admin credentials (gitignored)

### 2. Schema Deployed
The Convex schema matching your Supabase tables has been deployed to the local backend:
- profiles
- userPreferences
- journeys
- journeyNotifications
- favoriteRoutes
- paymentMethods
- walletTransactions

### 3. TypeScript Types Generated
All Convex API types are available in `convex/_generated/`

### 4. Client Integration
- ConvexClientProvider wraps your app
- Auth hooks available via `useAuth()`
- Login and Signup pages already migrated

## 🚀 How to Run

### Prerequisites
Ensure the Convex backend is running on `localhost:3210`:
```bash
curl http://localhost:3210/api/health
```

### Start the App
```bash
npm install   # Install dependencies (if not done)
npm run dev   # Start Vite dev server
```

The app will connect to the Convex backend at `http://localhost:3210`.

## 📋 NPM Scripts Available

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run convex:dev` | Watch mode - redeploys on file changes |
| `npm run convex:deploy` | Deploy schema to backend |
| `npm run convex:codegen` | Regenerate TypeScript types |

## 🔧 Making Schema Changes

1. Edit `convex/schema.ts` to add/modify tables
2. Deploy the changes:
   ```bash
   npm run convex:deploy
   npm run convex:codegen
   ```

## 🔐 Authentication

The app uses a custom Convex-based auth system:
- Session stored in localStorage
- `useAuth()` hook provides: `userId`, `email`, `setSession()`, `clearSession()`
- Already working in Login and Signup pages

## 🔄 Migrating Additional Pages

Some pages still use Supabase and need migration:
- Profile.tsx
- Journeys.tsx
- History.tsx

See `CONVEX_MIGRATION.md` for detailed migration patterns.

## 📱 Testing

1. **Sign Up**: Create a new account
2. **Login**: Sign in with credentials
3. **Profile**: View and edit profile (needs migration)
4. **Journeys**: Create and manage journeys (needs migration)

## 🆘 Troubleshooting

### "Cannot find module convex/_generated/api"
```bash
npm run convex:codegen
```

### Backend connection errors
1. Check if backend is running: `curl http://localhost:3210/api/health`
2. Verify VITE_CONVEX_URL in `.env` matches backend URL

### Schema not found
```bash
npm run convex:deploy
```

## 📂 Project Structure

```
transitzen-go/
├── convex/
│   ├── _generated/          # Auto-generated (DO NOT EDIT)
│   ├── schema.ts            # Database schema
│   ├── auth.ts              # Auth functions
│   ├── profiles.ts          # Profile functions
│   └── convex.json          # Backend configuration
├── src/
│   ├── lib/
│   │   └── convex.tsx       # Client provider & auth hooks
│   ├── pages/
│   │   ├── Login.tsx        # ✅ Using Convex
│   │   ├── Signup.tsx       # ✅ Using Convex
│   │   ├── Profile.tsx      # ⚠️ Still using Supabase
│   │   └── ...
│   └── App.tsx              # Wrapped with provider
├── .env                     # Public URL
├── .env.local               # Admin key (gitignored)
└── package.json             # NPM scripts
```

## 🎯 Next Steps

1. ✅ Backend is connected and working
2. ✅ Login/Signup work with Convex
3. ⚠️ Migrate Profile page (see CONVEX_MIGRATION.md)
4. ⚠️ Migrate Journeys page
5. ⚠️ Migrate History page
6. Add journey management functions to Convex
7. Add wallet transaction functions

## 📚 Learn More

- [Convex Documentation](https://docs.convex.dev/)
- [Self-Hosted Convex](https://docs.convex.dev/production/hosting/self-hosting)
- [React Convex Client](https://docs.convex.dev/client/react)
