# Implementation Tasks

## 1. Database Schema & Backend

- [ ] 1.1 Extend `convex/schema.ts` with `savedJourneys` table
- [ ] 1.2 Extend `convex/schema.ts` with `scheduledNotifications` table
- [ ] 1.3 Update `userPreferences` table with notification settings
- [ ] 1.4 Create `convex/journey-queries.ts` for journey operations
- [ ] 1.5 Create `convex/journey-mutations.ts` for CRUD operations
- [ ] 1.6 Create `convex/notification-actions.ts` for scheduling logic
- [ ] 1.7 Add cron job in `convex/crons.ts` for journey monitoring (every 1 minute)
- [ ] 1.8 Create `convex/helpers/journey-calculator.ts` for optimization algorithm

## 2. Journey Planning Algorithm

- [ ] 2.1 Implement walking time calculation (using Haversine distance)
- [ ] 2.2 Implement stop-to-stop travel time estimation
- [ ] 2.3 Implement transfer time calculation
- [ ] 2.4 Implement total journey time optimization
- [ ] 2.5 Add comfort constraint (max 1-minute wait at stops)
- [ ] 2.6 Handle multi-leg journeys (transfers between routes)
- [ ] 2.7 Add real-time adjustment based on vehicle positions
- [ ] 2.8 Implement fallback routing if primary route delayed

## 3. Capacitor Mobile Integration

- [ ] 3.1 Install Capacitor dependencies
- [ ] 3.2 Create `capacitor.config.ts` configuration
- [ ] 3.3 Initialize iOS project (`npx cap add ios`)
- [ ] 3.4 Initialize Android project (`npx cap add android`)
- [ ] 3.5 Set up push notification plugin
- [ ] 3.6 Set up local notifications plugin (fallback)
- [ ] 3.7 Set up background runner plugin
- [ ] 3.8 Set up geolocation plugin
- [ ] 3.9 Configure app icons and splash screens
- [ ] 3.10 Update `package.json` with mobile build scripts

## 4. Notification System

- [ ] 4.1 Create `lib/notifications/push-handler.ts`
- [ ] 4.2 Create `lib/notifications/local-handler.ts`
- [ ] 4.3 Implement notification permission request flow
- [ ] 4.4 Create notification templates (departure, delay, arrival)
- [ ] 4.5 Implement notification scheduling logic
- [ ] 4.6 Add notification action handlers (tap to open journey)
- [ ] 4.7 Create PWA service worker for web push
- [ ] 4.8 Add Firebase Cloud Messaging configuration (iOS/Android)
- [ ] 4.9 Implement notification badge management
- [ ] 4.10 Add notification history/logging

## 5. Frontend Components

- [ ] 5.1 Create `components/journey/journey-planner.tsx` (main form)
- [ ] 5.2 Create `components/journey/destination-search.tsx` (autocomplete)
- [ ] 5.3 Create `components/journey/time-picker.tsx` (arrival time selection)
- [ ] 5.4 Create `components/journey/recurring-schedule.tsx` (weekday selection)
- [ ] 5.5 Create `components/journey/saved-journeys-list.tsx`
- [ ] 5.6 Create `components/journey/journey-card.tsx` (display saved journey)
- [ ] 5.7 Create `components/journey/journey-preview.tsx` (route visualization)
- [ ] 5.8 Create `components/notifications/permission-prompt.tsx`
- [ ] 5.9 Create `components/notifications/notification-settings.tsx`
- [ ] 5.10 Update `components/dashboard/dashboard-page.tsx` with journey shortcuts

## 6. Pages & Routing

- [ ] 6.1 Create `app/journeys/page.tsx` (journey list)
- [ ] 6.2 Create `app/journeys/new/page.tsx` (create journey)
- [ ] 6.3 Create `app/journeys/[id]/page.tsx` (journey details)
- [ ] 6.4 Create `app/journeys/[id]/edit/page.tsx` (edit journey)
- [ ] 6.5 Create `app/settings/notifications/page.tsx` (notification settings)
- [ ] 6.6 Update `app/page.tsx` with journey quick-add
- [ ] 6.7 Add navigation links to journey section

## 7. User Onboarding

- [ ] 7.1 Create `components/onboarding/welcome-modal.tsx`
- [ ] 7.2 Create `components/onboarding/notification-permission-step.tsx`
- [ ] 7.3 Create `components/onboarding/first-journey-step.tsx`
- [ ] 7.4 Create `components/onboarding/location-permission-step.tsx`
- [ ] 7.5 Add onboarding flow to first-time user experience
- [ ] 7.6 Create skip/later options for optional steps
- [ ] 7.7 Track onboarding completion in user preferences

## 8. Real-time Monitoring

- [ ] 8.1 Implement Convex subscription for vehicle position updates
- [ ] 8.2 Create background task to recalculate departure times
- [ ] 8.3 Detect delays and send updated notifications
- [ ] 8.4 Implement journey status tracking (scheduled, active, completed, cancelled)
- [ ] 8.5 Add journey history logging
- [ ] 8.6 Create alert system for significant delays (>5 minutes)
- [ ] 8.7 Implement alternative route suggestions

## 9. Testing & Validation

- [ ] 9.1 Test notification delivery on iOS
- [ ] 9.2 Test notification delivery on Android
- [ ] 9.3 Test PWA notifications on web
- [ ] 9.4 Test journey calculation accuracy
- [ ] 9.5 Test background task execution
- [ ] 9.6 Test with poor network conditions
- [ ] 9.7 Test with GPS disabled
- [ ] 9.8 Validate notification timing accuracy
- [ ] 9.9 Test multi-leg journey calculations
- [ ] 9.10 Load test with 100+ concurrent users

## 10. Mobile Build & Deployment

- [ ] 10.1 Configure iOS signing certificates
- [ ] 10.2 Configure Android keystore
- [ ] 10.3 Set up Apple Developer account
- [ ] 10.4 Set up Google Play Console account
- [ ] 10.5 Create iOS App Store listing
- [ ] 10.6 Create Google Play Store listing
- [ ] 10.7 Configure CI/CD for mobile builds
- [ ] 10.8 Create TestFlight beta distribution
- [ ] 10.9 Create Google Play internal testing track
- [ ] 10.10 Submit for app store review

## 11. Documentation

- [ ] 11.1 Document journey planning algorithm
- [ ] 11.2 Document notification system architecture
- [ ] 11.3 Create user guide for journey setup
- [ ] 11.4 Create troubleshooting guide for notifications
- [ ] 11.5 Document mobile build process
- [ ] 11.6 Update API documentation with new endpoints
- [ ] 11.7 Create architecture diagrams
- [ ] 11.8 Document environment variables

## 12. Performance & Optimization

- [ ] 12.1 Optimize journey calculation algorithm (<500ms)
- [ ] 12.2 Add caching for frequent route calculations
- [ ] 12.3 Minimize battery usage on mobile
- [ ] 12.4 Reduce notification payload size
- [ ] 12.5 Implement lazy loading for journey list
- [ ] 12.6 Add database indexes for journey queries
- [ ] 12.7 Profile and optimize cron job execution

## 13. Polish & UX

- [ ] 13.1 Add loading states to all journey actions
- [ ] 13.2 Add error handling with user-friendly messages
- [ ] 13.3 Add success toasts for journey actions
- [ ] 13.4 Implement haptic feedback on mobile
- [ ] 13.5 Add micro-interactions (animations)
- [ ] 13.6 Ensure accessibility (ARIA labels, keyboard navigation)
- [ ] 13.7 Add dark mode support for all new components
- [ ] 13.8 Test responsive design on various screen sizes
