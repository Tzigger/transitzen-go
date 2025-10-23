# Smart Departure Notifications

## Why

Users lose valuable time waiting at cold bus stops. Current transit apps show when buses arrive, but don't tell users when to leave their location to arrive just in time. This results in:
- Unnecessary waiting in uncomfortable weather
- Missed buses due to poor timing estimates
- Anxiety about being late to important destinations
- Wasted time that could be spent at home/work

**Core Problem**: Users need to know **when to leave**, not just when buses arrive.

## What Changes

This change introduces a comprehensive time-optimized journey planning system with smart departure notifications:

1. **Saved Journey Planning**
   - Users save frequent destinations with target arrival times
   - App calculates optimal departure time considering:
     - Walking time from current location to nearest stop
     - Real-time bus/tram schedules and positions
     - Transfer times if multiple vehicles needed
     - Walking time from final stop to destination
   - Maximum 1-minute wait time at stops (comfort optimization)

2. **Push Notifications** (**BREAKING**: Requires Capacitor mobile wrapper)
   - Timely "Time to leave!" notifications
   - Notifications sent at calculated departure time
   - Include route summary, crowding info, and ETA
   - Work on both web (PWA) and native mobile apps

3. **Mobile App Integration** (**BREAKING**: New platform)
   - Wrap Next.js app with Capacitor
   - iOS and Android native app builds
   - Background notification scheduling
   - Native push notification permissions

4. **Enhanced User Preferences**
   - Save multiple frequent destinations
   - Set recurring schedules (e.g., "Every weekday at 20:00 to Faculty")
   - Notification preferences (how early to alert)
   - Tolerance for wait time (default: 1 minute max)

5. **Real-time Journey Monitoring**
   - Continuous updates as bus positions change
   - Adjust notifications if delays detected
   - Re-route suggestions if original plan disrupted
   - Crowding level updates

## Impact

### Affected Specs
- **NEW**: `journey-planning` - Core journey optimization logic
- **NEW**: `notifications` - Push notification system
- **NEW**: `mobile-integration` - Capacitor integration
- **MODIFIED**: `user-preferences` - Extended schema for saved journeys

### Affected Code
- `convex/schema.ts` - Add `savedJourneys` and `scheduledNotifications` tables
- `convex/mutations.ts` - Add journey CRUD operations
- `convex/actions.ts` - Add notification scheduling logic
- `convex/crons.ts` - Add periodic journey monitoring cron
- New: `lib/journey-calculator.ts` - Journey optimization algorithm
- New: `lib/notifications.ts` - Notification helpers
- New: `capacitor.config.ts` - Capacitor configuration
- New: `components/journey/journey-planner.tsx` - UI for creating journeys
- New: `components/journey/saved-journeys.tsx` - Manage saved journeys
- New: `app/journeys/` - Journey management pages

### Dependencies
- **NEW**: `@capacitor/core` - Mobile wrapper framework
- **NEW**: `@capacitor/cli` - Build tools
- **NEW**: `@capacitor/push-notifications` - Push notification plugin
- **NEW**: `@capacitor/local-notifications` - Local notification fallback
- **NEW**: `@capacitor/background-runner` - Background task execution
- **NEW**: `@capacitor/geolocation` - User location tracking

### Breaking Changes
- **BREAKING**: Requires Capacitor setup for full functionality
- **BREAKING**: Push notifications require native mobile app or PWA with service worker
- **BREAKING**: iOS/Android build pipeline additions to CI/CD
- **BREAKING**: Additional environment variables for notification keys

### User Impact
- **Positive**: Dramatically improved user experience - arrive on time, minimize waiting
- **Neutral**: One-time notification permission request
- **Neutral**: First-time journey setup (5-minute onboarding)
- **Positive**: Works offline once journey cached

### Business Impact
- **Major Value**: Core differentiator from competitors
- **Retention**: Daily notifications = daily engagement
- **Growth**: Word-of-mouth ("I never wait in the cold anymore")
- **Platform**: Opens native app stores for distribution
