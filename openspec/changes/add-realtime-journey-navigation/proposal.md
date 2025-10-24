# Real-time Journey Navigation with Live Alerts

## Why

The current `/active-journey` page provides basic tracking but lacks the sophisticated real-time navigation experience users expect from modern map applications like Google Maps or Waze. Users need:

**Current Problems:**
- Limited real-time guidance during active journeys
- Basic proximity alerts that don't account for GPS accuracy and user context
- No dynamic re-routing when delays or disruptions occur
- Minimal visual feedback on map (generic markers and polylines)
- No turn-by-turn walking directions to/from stops
- Alert system is simulated rather than based on real location proximity
- No voice guidance or haptic feedback for critical alerts
- Missing traffic and crowding updates during journey

**User Impact:**
- Uncertainty about when to get off the bus/tram
- Missing stops due to poor alert timing
- Getting lost during walking segments
- No awareness of delays or disruptions
- Anxiety during multi-leg journeys
- Poor experience compared to commercial navigation apps

## What Changes

This change transforms `/active-journey` into a production-grade real-time navigation system with Google Maps-level sophistication:

### 1. **Advanced Real-time Location Tracking**
   - High-accuracy GPS with Kalman filtering for smooth position updates
   - Adaptive polling intervals based on journey state (active transit vs. walking)
   - Battery-optimized tracking with background mode support
   - Heading/bearing calculation for direction indication
   - Speed detection for walking vs. stationary states
   - Map-matching algorithms to snap user to routes/roads

### 2. **Intelligent Alert System**
   - Geofence-based proximity alerts (not time-based simulation)
   - Multi-stage alerts: "Approaching stop" → "Prepare to alight" → "Exit now"
   - Context-aware notifications (considers vehicle speed, traffic, user movement)
   - Voice announcements for critical alerts (stop arrival, transfer needed)
   - Haptic feedback for accessibility
   - Alert suppression when user has already acted (e.g., detected walking away from bus)

### 3. **Turn-by-Turn Navigation**
   - Walking directions from current location to boarding stop
   - Visual markers and arrows on map for each turn
   - Distance and time remaining to next waypoint
   - "You are going the wrong way" detection and re-routing
   - Indoor/outdoor transition handling (GPS accuracy varies)
   - Accessibility mode with larger text and audio guidance

### 4. **Enhanced Map Visualization**
   - Animated user position marker with heading indicator
   - Real-time vehicle positions overlaid on route
   - 3D building rendering for better orientation (optional)
   - Traffic layer showing congestion on walking routes
   - POI markers near stops (coffee shops, shelters)
   - Dynamic camera following with smooth transitions
   - Pitch/tilt adjustments for 3D perspective
   - Night mode optimized colors for reduced eye strain

### 5. **Live Journey Updates**
   - Real-time delay notifications from transit API
   - Automatic re-routing when disruptions detected
   - Crowding level updates as new data arrives
   - ETA recalculation every 30 seconds
   - Alternative route suggestions if current route delayed
   - Transfer buffer time adjustments based on real-time data

### 6. **Progress & Status Indicators**
   - Progress bar showing journey completion percentage
   - Animated step-by-step UI similar to Google Maps
   - "On time" / "Running late" status with color coding
   - Distance remaining to next stop/destination
   - Countdown timer for next alert
   - Battery impact indicator

### 7. **Emergency & Safety Features**
   - Quick access to emergency services (112)
   - Live location sharing with contacts
   - "Safe arrival" confirmation to family/friends
   - Offline mode with cached route data
   - Panic button for unsafe situations
   - Night mode with safety tips

### 8. **Performance Optimizations**
   - Web Worker for GPS calculations (no UI blocking)
   - Debounced map updates to prevent jank
   - Lazy loading of map tiles
   - Memory management for long journeys
   - Progressive enhancement (works on low-end devices)

## Impact

### Affected Specs
- **NEW**: `navigation/real-time-tracking` - GPS tracking and position management
- **NEW**: `navigation/turn-by-turn` - Walking directions and guidance
- **NEW**: `alerts/proximity-alerts` - Geofence-based alert system
- **NEW**: `alerts/voice-guidance` - Audio announcements
- **MODIFIED**: `active-journey` - Enhanced journey tracking page
- **MODIFIED**: `map-visualization` - Advanced map features

### Affected Code

**Core Navigation Engine:**
- New: `lib/navigation/gps-tracker.ts` - GPS management with Kalman filter
- New: `lib/navigation/location-matcher.ts` - Map-matching algorithms
- New: `lib/navigation/proximity-detector.ts` - Geofencing and alerts
- New: `lib/navigation/route-optimizer.ts` - Dynamic re-routing
- New: `lib/navigation/heading-calculator.ts` - Bearing and direction

**Alert System:**
- New: `lib/alerts/alert-manager.ts` - Alert lifecycle and prioritization
- New: `lib/alerts/voice-engine.ts` - Text-to-speech integration
- New: `lib/alerts/haptic-feedback.ts` - Vibration patterns
- New: `lib/alerts/notification-scheduler.ts` - Progressive alerts

**Map & Visualization:**
- Modified: `src/components/ActiveJourneyMap.tsx` - Enhanced with animations, 3D
- New: `lib/map/map-camera-controller.ts` - Smooth camera movements
- New: `lib/map/marker-animator.ts` - Animated markers
- New: `lib/map/layer-manager.ts` - Dynamic layer visibility

**UI Components:**
- Modified: `src/pages/ActiveJourney.tsx` - Redesigned with turn-by-turn UI
- New: `src/components/navigation/TurnByTurnPanel.tsx` - Navigation instructions
- New: `src/components/navigation/ProgressIndicator.tsx` - Journey progress
- New: `src/components/navigation/AlertBanner.tsx` - Alert notifications
- New: `src/components/navigation/EmergencyButton.tsx` - Safety features
- New: `src/components/navigation/LocationPermissionDialog.tsx` - Permission UI

**Backend Integration:**
- Modified: `convex/journeys.ts` - Add journey tracking mutations
- New: `convex/tracking.ts` - Location logging for analytics
- New: `convex/alerts.ts` - Alert history and preferences
- Modified: `convex/transit.ts` - Real-time delay updates

**Web Workers:**
- New: `public/workers/gps-worker.js` - Background GPS processing
- New: `public/workers/route-matcher.js` - Map-matching calculations

### Dependencies
- **NEW**: `@turf/turf` - Geospatial calculations (geofencing, distance, bearing)
- **NEW**: `kalman-filter` - GPS position smoothing
- **NEW**: `leaflet-rotatedmarker` - Directional markers
- **NEW**: `leaflet-animated-marker` - Smooth marker animations
- **OPTIONAL**: `maplibre-gl` - Alternative to Leaflet with 3D support
- **OPTIONAL**: `@capacitor/text-to-speech` - Voice guidance (mobile only)
- **OPTIONAL**: `@capacitor/haptics` - Vibration feedback (mobile only)

### Breaking Changes
- **BREAKING**: Requires Geolocation permission to function
- **BREAKING**: Minimum GPS accuracy requirement (< 50m)
- **BREAKING**: Background location tracking (requires permission on iOS/Android)
- **MINOR BREAKING**: Changed ActiveJourneyMap component props structure

### User Impact
- **Positive**: Professional navigation experience matching Google Maps quality
- **Positive**: Reduced anxiety with clear turn-by-turn guidance
- **Positive**: Never miss stops with intelligent proximity alerts
- **Positive**: Voice guidance for hands-free navigation
- **Neutral**: One-time location permission request (high accuracy)
- **Neutral**: Slightly increased battery usage during active tracking
- **Negative**: Requires stable GPS signal (poor indoor/tunnel experience)

### Business Impact
- **Major Value**: Core differentiator - "Google Maps for public transit"
- **Retention**: Smooth experience drives daily usage
- **Trust**: Reliability builds user confidence in the platform
- **Competitive**: Matches or exceeds commercial navigation apps
- **Reviews**: Expected improvement in app store ratings
- **Support**: Reduced support tickets about missing stops

### Performance Considerations
- GPS tracking increases battery drain (mitigated with adaptive polling)
- Map rendering optimized to maintain 60fps on mid-range devices
- Web Workers prevent UI blocking during calculations
- Offline support ensures functionality in poor connectivity

### Accessibility
- Voice guidance for visually impaired users
- Haptic feedback for deaf/hard-of-hearing users
- High contrast mode for low vision
- Large touch targets for motor impairments
- Screen reader compatibility

### Privacy & Security
- Location data never stored permanently (session only)
- Opt-in location sharing with contacts
- Anonymous analytics (no PII tracking)
- Clear explanation of location permissions
- Ability to disable tracking at any time
