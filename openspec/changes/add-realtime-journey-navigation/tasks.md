# Implementation Tasks

## 1. Dependencies and Setup
- [ ] 1.1 Install @turf/turf for geospatial calculations
- [ ] 1.2 Install kalman-filter for GPS smoothing
- [ ] 1.3 Install leaflet-rotatedmarker for directional markers
- [ ] 1.4 Install leaflet-animated-marker for smooth animations
- [ ] 1.5 Evaluate and optionally install maplibre-gl for 3D support
- [ ] 1.6 Install @capacitor/text-to-speech for voice guidance (mobile)
- [ ] 1.7 Install @capacitor/haptics for vibration (mobile)
- [ ] 1.8 Configure TypeScript types for new dependencies

## 2. Core Navigation Engine
- [ ] 2.1 Create `lib/navigation/gps-tracker.ts` with high-accuracy tracking
- [ ] 2.2 Implement Kalman filter in `lib/navigation/kalman-filter-helper.ts`
- [ ] 2.3 Create `lib/navigation/location-matcher.ts` for map-matching
- [ ] 2.4 Implement `lib/navigation/proximity-detector.ts` with geofencing
- [ ] 2.5 Build `lib/navigation/route-optimizer.ts` for dynamic re-routing
- [ ] 2.6 Create `lib/navigation/heading-calculator.ts` for bearing computation
- [ ] 2.7 Implement `lib/navigation/speed-detector.ts` to detect movement vs stationary
- [ ] 2.8 Add unit tests for navigation utilities

## 3. Alert System
- [ ] 3.1 Create `lib/alerts/alert-manager.ts` for alert lifecycle
- [ ] 3.2 Implement `lib/alerts/alert-types.ts` with alert priority levels
- [ ] 3.3 Build `lib/alerts/voice-engine.ts` with TTS integration
- [ ] 3.4 Create `lib/alerts/haptic-feedback.ts` for vibration patterns
- [ ] 3.5 Implement `lib/alerts/notification-scheduler.ts` for progressive alerts
- [ ] 3.6 Add `lib/alerts/alert-history.ts` for logging and analytics
- [ ] 3.7 Create alert preference storage in Convex
- [ ] 3.8 Test alert timing and escalation

## 4. Map Enhancements
- [ ] 4.1 Update `src/components/ActiveJourneyMap.tsx` with animation support
- [ ] 4.2 Create `lib/map/map-camera-controller.ts` for smooth camera movements
- [ ] 4.3 Implement `lib/map/marker-animator.ts` for animated markers
- [ ] 4.4 Build `lib/map/layer-manager.ts` for dynamic layer visibility
- [ ] 4.5 Add custom marker styles with rotation and heading indicators
- [ ] 4.6 Implement 3D tilt and pitch controls (optional)
- [ ] 4.7 Add traffic layer support
- [ ] 4.8 Optimize map rendering for 60fps performance

## 5. Turn-by-Turn UI Components
- [ ] 5.1 Create `src/components/navigation/TurnByTurnPanel.tsx`
- [ ] 5.2 Build `src/components/navigation/ProgressIndicator.tsx`
- [ ] 5.3 Implement `src/components/navigation/AlertBanner.tsx` with animations
- [ ] 5.4 Create `src/components/navigation/EmergencyButton.tsx`
- [ ] 5.5 Build `src/components/navigation/LocationPermissionDialog.tsx`
- [ ] 5.6 Implement `src/components/navigation/StepIndicator.tsx` for journey steps
- [ ] 5.7 Create `src/components/navigation/ETADisplay.tsx` with dynamic updates
- [ ] 5.8 Add `src/components/navigation/CompassIndicator.tsx`

## 6. Active Journey Page Redesign
- [ ] 6.1 Refactor `src/pages/ActiveJourney.tsx` structure
- [ ] 6.2 Integrate GPS tracker initialization
- [ ] 6.3 Connect real-time location updates to map
- [ ] 6.4 Wire up alert system with geofencing
- [ ] 6.5 Implement turn-by-turn instruction display
- [ ] 6.6 Add progress calculation and display
- [ ] 6.7 Handle journey state transitions (walking → transit → walking)
- [ ] 6.8 Implement step completion logic
- [ ] 6.9 Add emergency and safety features
- [ ] 6.10 Test end-to-end journey flow

## 7. Backend Integration
- [ ] 7.1 Add location logging mutations to `convex/journeys.ts`
- [ ] 7.2 Create `convex/tracking.ts` for journey history
- [ ] 7.3 Implement `convex/alerts.ts` for alert preferences and history
- [ ] 7.4 Update `convex/transit.ts` with real-time delay fetching
- [ ] 7.5 Add journey state management queries and mutations
- [ ] 7.6 Implement vehicle position subscription
- [ ] 7.7 Create cleanup job for old location data (privacy)
- [ ] 7.8 Add analytics events for navigation usage

## 8. Web Workers for Performance
- [ ] 8.1 Create `public/workers/gps-worker.js` for background GPS processing
- [ ] 8.2 Implement `public/workers/route-matcher.js` for map-matching calculations
- [ ] 8.3 Set up worker message passing interface
- [ ] 8.4 Test worker performance vs main thread
- [ ] 8.5 Add fallback for browsers without worker support

## 9. Offline Support
- [ ] 9.1 Implement route caching in IndexedDB
- [ ] 9.2 Add offline detection and mode switching
- [ ] 9.3 Store fallback schedule data locally
- [ ] 9.4 Test navigation in airplane mode
- [ ] 9.5 Implement online/offline sync mechanism

## 10. Battery Optimization
- [ ] 10.1 Add battery level monitoring
- [ ] 10.2 Implement adaptive GPS polling intervals
- [ ] 10.3 Create battery saver mode
- [ ] 10.4 Add battery consumption reporting
- [ ] 10.5 Test battery impact on real devices

## 11. Voice Guidance (Mobile)
- [ ] 11.1 Integrate Capacitor Text-to-Speech plugin
- [ ] 11.2 Implement voice announcement queue
- [ ] 11.3 Add Romanian language support
- [ ] 11.4 Create voice preference settings
- [ ] 11.5 Test voice guidance on iOS and Android

## 12. Haptic Feedback (Mobile)
- [ ] 12.1 Integrate Capacitor Haptics plugin
- [ ] 12.2 Define vibration patterns for each alert type
- [ ] 12.3 Implement haptic preferences
- [ ] 12.4 Test on devices with different haptic capabilities

## 13. Accessibility
- [ ] 13.1 Add ARIA labels to all navigation components
- [ ] 13.2 Implement screen reader announcements
- [ ] 13.3 Create high contrast mode for map
- [ ] 13.4 Enlarge touch targets for accessibility
- [ ] 13.5 Test with VoiceOver (iOS) and TalkBack (Android)

## 14. Error Handling and Edge Cases
- [ ] 14.1 Handle GPS permission denial gracefully
- [ ] 14.2 Manage poor GPS signal scenarios
- [ ] 14.3 Handle app backgrounding during journey
- [ ] 14.4 Test tunnel/indoor GPS loss recovery
- [ ] 14.5 Implement network timeout handling
- [ ] 14.6 Add retry logic for failed API calls
- [ ] 14.7 Test with mock locations for automation

## 15. Testing and Quality Assurance
- [ ] 15.1 Write unit tests for navigation utilities
- [ ] 15.2 Create integration tests for journey flow
- [ ] 15.3 Add E2E tests with simulated GPS data
- [ ] 15.4 Perform real-world testing on Iași routes
- [ ] 15.5 Test on low-end Android devices
- [ ] 15.6 Verify 60fps performance on map
- [ ] 15.7 Load test with many concurrent active journeys
- [ ] 15.8 Security audit for location data handling

## 16. Documentation and Polish
- [ ] 16.1 Update user-facing documentation
- [ ] 16.2 Create tutorial for first-time navigation
- [ ] 16.3 Add tooltips and onboarding for new features
- [ ] 16.4 Polish animations and transitions
- [ ] 16.5 Optimize bundle size
- [ ] 16.6 Add performance monitoring
- [ ] 16.7 Create demo video of navigation in action

## 17. Privacy and Security
- [ ] 17.1 Implement location data retention policy (7 days)
- [ ] 17.2 Add data anonymization after 24 hours
- [ ] 17.3 Create location permission explanation screen
- [ ] 17.4 Add ability to delete location history
- [ ] 17.5 Implement location sharing consent flow
- [ ] 17.6 Add privacy policy updates for location tracking

## 18. Analytics and Monitoring
- [ ] 18.1 Track navigation feature usage
- [ ] 18.2 Monitor GPS accuracy distribution
- [ ] 18.3 Log alert effectiveness (dismissed vs acted)
- [ ] 18.4 Track journey completion rates
- [ ] 18.5 Measure battery impact across devices
- [ ] 18.6 Monitor API error rates
- [ ] 18.7 Set up alerts for degraded performance

## 19. Deployment Preparation
- [ ] 19.1 Test on staging environment
- [ ] 19.2 Create feature flag for gradual rollout
- [ ] 19.3 Prepare rollback plan
- [ ] 19.4 Update mobile app builds (iOS/Android)
- [ ] 19.5 Submit updated apps to stores
- [ ] 19.6 Coordinate launch communication

## 20. Post-Launch
- [ ] 20.1 Monitor real-world usage and errors
- [ ] 20.2 Collect user feedback
- [ ] 20.3 Tune alert timing based on data
- [ ] 20.4 Optimize battery usage based on analytics
- [ ] 20.5 Address any critical bugs
- [ ] 20.6 Plan iteration based on learnings
