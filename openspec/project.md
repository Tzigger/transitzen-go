# Project Context

## Purpose
ZeroWait is an AI-powered public transport assistant for Iași, Romania. The application provides real-time vehicle tracking, predictive arrival times, crowding estimation, and intelligent route planning to improve the public transportation experience for residents and visitors.

## Business Goals

### Core Value Proposition
**"We buy you time by giving you the fastest way to get somewhere"**

ZeroWait ensures users arrive exactly on time, never late, by:
- Calculating precise departure times from their location
- Sending smart notifications when to leave
- Minimizing waiting time in cold weather (max 1 minute wait at stop)
- Providing real-time crowding information
- Optimizing the entire journey from door to destination

### Key Objectives
- **Time Precision**: Users arrive at destination exactly on time, never late
- **Comfort Optimization**: Minimize outdoor waiting time (especially in cold weather)
- **Crowding Awareness**: Show bus/tram occupancy before boarding
- **Seamless Experience**: Remember users, saved locations, and preferences
- **Multi-Platform**: Progressive Web App + Native mobile (via Capacitor)
- **Push Notifications**: Timely departure alerts synced with real-time transit data
- **Living Documentation**: Maintain specs that evolve with codebase using SpecDrive

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Authentication**: Clerk (persistent sessions)
- **Backend/Database**: Convex (real-time serverless)
- **Maps**: Leaflet + OpenStreetMap, MapLibre GL
- **Icons**: Lucide React
- **Mobile Wrapper**: Capacitor (PWA to native iOS/Android)
- **Push Notifications**: Capacitor Push Notifications plugin
- **Background Tasks**: Capacitor Background Runner (for notification scheduling)
- **Documentation**: OpenSpec + SpecDrive workflow
- **Build Tool**: Turbopack

## Project Conventions

### Code Style
- TypeScript strict mode enabled
- ESLint for code quality
- Functional components with hooks (React)
- Kebab-case for file names
- PascalCase for component names
- camelCase for functions and variables
- Use `const` over `let`, avoid `var`
- Prefer arrow functions for consistency

### Architecture Patterns
- **App Router**: Next.js 15 app directory structure
- **Server Components**: Default to server components, use `'use client'` only when needed
- **Convex Backend**: Queries for reads, Mutations for writes, Actions for external APIs
- **Component Organization**: Group by feature in `components/[feature]/`
- **Type Safety**: All Convex functions use generated types from schema
- **Real-time First**: Leverage Convex subscriptions for live updates
- **API Integration**: External transit API calls happen via Convex Actions

### File Organization
```
app/                    # Next.js pages and layouts
components/
  ├── dashboard/        # Dashboard-specific components
  ├── map/             # Map-related components
  └── ui/              # shadcn/ui components
convex/
  ├── schema.ts        # Database schema definitions
  ├── queries.ts       # Read operations
  ├── mutations.ts     # Write operations
  └── actions.ts       # External API integrations
lib/                   # Utility functions
specs/                 # OpenSpec specifications
generated/             # Auto-generated types from specs
```

### Testing Strategy
- TBD: Test framework to be determined
- Priority: API contract testing against specs
- Real-time data validation
- Component testing for UI interactions

### Git Workflow
- Feature branches from `main`
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- Spec changes committed alongside implementation
- PRs require spec validation to pass

## Domain Context

### Transit Domain Knowledge
- **GTFS**: General Transit Feed Specification (industry standard)
- **Vehicles**: Active buses with real-time GPS positions
- **Routes**: Predefined paths buses follow (e.g., Route 28)
- **Stops**: Physical locations where buses pick up passengers
- **Trips**: Specific instances of a route at a scheduled time
- **Crowding**: Passenger occupancy estimation without physical sensors
- **Headway**: Time between consecutive buses on same route

### Iași Context
- City in northeastern Romania
- Population: ~300,000
- Public transport operated by local authority
- Mix of buses and trams
- Real-time data available via transit API

### User Personas

#### Primary: Daily Commuters
**Example**: Student going to Facultatea de Automatică și Calculatoare
- Wants to arrive at 20:00 exactly
- Hates waiting in cold weather
- Needs to know if bus is crowded
- Values consistent, reliable timing
- Uses app multiple times daily

**Needs**:
- Save frequent destinations
- Receive departure notifications
- Real-time crowding info
- Optimal route with minimal wait time
- "Set it and forget it" - app remembers preferences

#### Secondary: Occasional Users
- Need route discovery and trip planning
- One-time journey optimization
- Clear walking directions to/from stops

#### Future: Tourists
- Simple navigation in unfamiliar city
- Multi-language support
- Point-of-interest integration

## Important Constraints

### Technical
- Must work on mobile devices (responsive design required)
- Real-time updates critical (use Convex subscriptions)
- Map performance on low-end devices
- API rate limits from transit authority
- Authentication required for certain features

### Data Quality
- GPS accuracy varies by vehicle
- Schedule data may be outdated
- Some buses lack real-time tracking
- API response structure may change

### Privacy & Security
- No personal location tracking without consent
- Secure authentication via Clerk
- No storage of sensitive user data
- GDPR compliance for EU users

## External Dependencies

### Critical Services
- **Iași Transit API**: Real-time vehicle positions, routes, stops, schedules
  - Base URL: Configured via `TRANSIT_API_URL`
  - Endpoints: `/Vehicles`, `/Routes`, `/Stops`, `/Trips`
  - Auth: TBD (may require API key)
- **Clerk**: User authentication and session management
- **Convex**: Backend infrastructure, real-time database, serverless functions
- **OpenStreetMap**: Base map tiles (via Leaflet/MapLibre)

### Development Tools
- OpenSpec: Specification-driven documentation
- Vercel: Deployment platform
- GitHub: Version control and CI/CD

## SpecDrive Workflow

This project follows the SpecDrive methodology:

1. **Specs are source of truth**: All APIs defined in `specs/` directory
2. **Changes are proposals**: New features start as proposals in `changes/`
3. **Types are generated**: TypeScript interfaces auto-generated from OpenAPI specs
4. **Validation is automated**: CI checks implementation matches specifications
5. **Docs stay current**: Documentation auto-updates from specs

### Key Documents
- `SPECDRIVE.md`: Workflow guide and best practices
- `openspec/AGENTS.md`: Instructions for AI assistants
- `specs/`: Current implemented capabilities
- `changes/`: Proposed changes awaiting implementation
