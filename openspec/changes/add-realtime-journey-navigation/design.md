# Technical Design: Real-time Journey Navigation

## Context

The current `/active-journey` implementation provides basic journey tracking but lacks the sophisticated real-time navigation users expect. This design addresses how to build a production-grade navigation system with:
- Sub-10m GPS accuracy in urban environments
- <100ms UI response time for position updates
- Battery consumption <15% per hour of navigation
- Graceful degradation in poor signal conditions

**Constraints:**
- Must work on web (PWA) and native mobile (Capacitor)
- Limited to device GPS capabilities (no augmented positioning hardware)
- Transit API rate limits: max 1 request per 5 seconds per vehicle
- Target devices: iPhone 8+, Android 8.0+, mid-range specs

**Stakeholders:**
- End users: Daily commuters needing reliable navigation
- Product: Differentiation from competitors
- Engineering: Maintainable, scalable architecture
- Business: App store presence, user retention

## Goals / Non-Goals

### Goals
1. **Accuracy**: <15m position error in open sky, <30m in urban canyons
2. **Responsiveness**: UI updates within 100ms of GPS fix
3. **Reliability**: 99% alert delivery rate for critical stop notifications
4. **Battery efficiency**: <15% battery drain per hour of active navigation
5. **Accessibility**: Full voice guidance and haptic support
6. **Performance**: 60fps map rendering on target devices

### Non-Goals
- Indoor navigation (building interiors, malls) - GPS insufficient
- Augmented reality overlays - future consideration
- Multi-modal journey planning - already handled by existing route planner
- Real-time traffic data integration - OpenStreetMap data only for now
- Wearable device support (smartwatch) - mobile app focus

## Decisions

### Decision 1: GPS Processing Architecture - Web Workers

**Choice:** Offload GPS processing to Web Workers to prevent UI blocking.

**Why:**
- Kalman filtering and map-matching are CPU-intensive (10-30ms per update)
- Main thread must remain responsive for 60fps UI
- Workers supported in all target browsers/platforms
- Easy to fall back to main thread if workers unavailable

**Implementation:**
```typescript
// Main thread
const gpsWorker = new Worker('/workers/gps-worker.js');
gpsWorker.postMessage({ 
  type: 'UPDATE_POSITION',
  lat, lng, accuracy, timestamp 
});

// Worker processes and returns smoothed position
gpsWorker.onmessage = (e) => {
  const { smoothedLat, smoothedLng, heading } = e.data;
  updateMapMarker(smoothedLat, smoothedLng, heading);
};
```

**Alternatives considered:**
- **Main thread processing:** Simpler but causes jank. Rejected due to UX impact.
- **Native module (Capacitor plugin):** Better performance but adds complexity and platform-specific code. Defer unless workers prove insufficient.

### Decision 2: Kalman Filter for GPS Smoothing

**Choice:** Implement 2D Kalman filter to smooth noisy GPS positions.

**Why:**
- Raw GPS data has 5-20m jitter even when stationary
- Kalman filter reduces noise while maintaining responsiveness
- Industry standard (used by Google Maps, Waze)
- Library available: `kalman-filter` npm package

**Configuration:**
```typescript
const kalman = new KalmanFilter({
  observation: 2, // lat/lng
  dynamic: 'constant-acceleration',
  noiseObservation: accuracy || 10, // meters
});
```

**Tuning:**
- Higher `noiseObservation` → smoother but laggier
- Lower → more responsive but jittery
- Dynamically adjust based on reported GPS accuracy

**Alternatives considered:**
- **Moving average:** Too laggy, creates visible delay. Rejected.
- **No filtering:** Unacceptable jitter. Rejected.
- **Particle filter:** More accurate but 10x computational cost. Overkill for our use case.

### Decision 3: Geofencing Library - Turf.js

**Choice:** Use @turf/turf for geospatial calculations (distance, inside polygon, bearing).

**Why:**
- Comprehensive, battle-tested geospatial library
- Covers all our needs: distance, point-in-polygon, bearing
- Modular imports keep bundle size manageable (~15KB gzipped for our needs)
- Well-documented, actively maintained

**Usage examples:**
```typescript
import { distance, booleanPointInPolygon, bearing } from '@turf/turf';

// Check if within geofence
const inGeofence = booleanPointInPolygon(
  point([userLng, userLat]),
  circle([stopLng, stopLat], 0.2, { units: 'kilometers' })
);

// Calculate distance to stop
const distMeters = distance(
  point([userLng, userLat]),
  point([stopLng, stopLat]),
  { units: 'meters' }
);

// Calculate heading
const headingDeg = bearing(
  point([prevLng, prevLat]),
  point([curLng, curLat])
);
```

**Alternatives considered:**
- **Custom implementation:** Error-prone, reinventing wheel. Rejected.
- **Geolib:** Less comprehensive. Turf is more feature-complete.

### Decision 4: Map Library - Stick with Leaflet (defer MapLibre)

**Choice:** Enhance existing Leaflet implementation. Evaluate MapLibre only if 3D features become requirements.

**Why:**
- Already using Leaflet, minimal migration cost
- Leaflet plugins available for rotation, animation
- 2D navigation sufficient for MVP
- MapLibre adds 200KB+ to bundle for features we don't need yet

**Enhancements to Leaflet:**
- `leaflet-rotatedmarker` for directional user icon
- `leaflet-animated-marker` for smooth marker transitions
- Custom CSS animations for pulsing effects

**When to reconsider:**
- User feedback requests 3D tilt view
- Need vector tiles for better styling control
- Performance issues with complex polylines (MapLibre has GPU acceleration)

**Alternatives considered:**
- **Mapbox GL JS:** Excellent but costs $$$ after free tier. Rejected for budget.
- **MapLibre GL:** Open-source Mapbox fork, great for 3D. Defer until needed.

### Decision 5: Alert System - Three-tier Architecture

**Choice:** Implement progressive alert system with stages: Informational → Attention → Urgent → Critical.

**Why:**
- Prevents alert fatigue from constant notifications
- Matches user mental model (approaching → prepare → act now)
- Allows customization of notification intensity per stage

**Implementation:**
```typescript
type AlertStage = 'info' | 'attention' | 'urgent' | 'critical';

interface AlertConfig {
  distance: number;      // meters from waypoint
  stage: AlertStage;
  sound: boolean;
  vibration: boolean;
  voiceAnnouncement: string | null;
  dismissable: boolean;
}

const stopAlerts: AlertConfig[] = [
  { distance: 500, stage: 'info', sound: false, vibration: false, voiceAnnouncement: null, dismissable: true },
  { distance: 200, stage: 'attention', sound: true, vibration: true, voiceAnnouncement: "Approaching stop", dismissable: true },
  { distance: 100, stage: 'urgent', sound: true, vibration: true, voiceAnnouncement: "Prepare to exit", dismissable: false },
  { distance: 50, stage: 'critical', sound: true, vibration: true, voiceAnnouncement: "Exit now", dismissable: false },
];
```

**Tuning strategy:**
- Monitor user response times (alert shown → action taken)
- Adjust distances to minimize missed stops and false alarms
- Allow user customization in settings

**Alternatives considered:**
- **Single alert at fixed distance:** Too simplistic, users miss it. Rejected.
- **Time-based alerts:** Less accurate than distance-based. Rejected.

### Decision 6: Voice Guidance - Capacitor TTS Plugin

**Choice:** Use `@capacitor/text-to-speech` for voice announcements on mobile, Web Speech API on PWA.

**Why:**
- Native TTS quality superior to web (especially on iOS)
- Capacitor plugin provides unified API
- Web Speech API adequate for PWA fallback
- No external service costs (uses on-device TTS)

**Implementation:**
```typescript
import { TextToSpeech } from '@capacitor/text-to-speech';

async function announceAlert(text: string, locale: string = 'ro-RO') {
  if (Capacitor.isNativePlatform()) {
    await TextToSpeech.speak({
      text,
      lang: locale,
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
    });
  } else {
    // Fallback to Web Speech API
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    window.speechSynthesis.speak(utterance);
  }
}
```

**Language support:**
- Romanian (ro-RO) as primary
- English (en-US) as fallback
- Use user's device language preference

**Alternatives considered:**
- **Cloud TTS (Google, AWS):** Better quality but costs $$$, requires connectivity. Rejected.
- **Pre-recorded audio files:** Inflexible, large download. Rejected.

### Decision 7: Battery Optimization - Adaptive GPS Polling

**Choice:** Dynamically adjust GPS polling interval based on journey state and battery level.

**Why:**
- GPS is #1 battery consumer (50-70% of navigation battery drain)
- Polling frequency can be reduced without UX impact during low-activity phases
- Users prioritize battery life on long journeys

**Strategy:**
| Journey State | Battery Level | Polling Interval | Accuracy Mode |
|---------------|---------------|------------------|---------------|
| Walking actively | >20% | 5 seconds | High |
| Onboard transit | >20% | 10 seconds | High |
| Stationary at stop | >20% | 15 seconds | Balanced |
| Any state | 10-20% | 15 seconds | Balanced |
| Any state | <10% | 30 seconds | Low |

**Implementation:**
```typescript
function calculatePollingInterval(state: JourneyState, battery: number): number {
  if (battery < 10) return 30000; // 30s
  if (battery < 20) return 15000; // 15s
  
  switch (state) {
    case 'walking': return 5000;  // 5s
    case 'onboard': return 10000; // 10s
    case 'waiting': return 15000; // 15s
    default: return 10000;
  }
}
```

**Alternatives considered:**
- **Fixed interval:** Simpler but wastes battery. Rejected.
- **Significant location change API:** Not granular enough for navigation. Rejected.

### Decision 8: Location History Storage - Convex with TTL

**Choice:** Store GPS trails in Convex with automatic 7-day TTL and 24-hour anonymization.

**Why:**
- Privacy-first: location data is sensitive
- Convex supports scheduled cleanup via crons
- Subsample data (1 point/10s when stationary) to reduce storage
- Sufficient for journey replay and analytics

**Schema:**
```typescript
// convex/schema.ts
locationHistory: defineTable({
  journeyId: v.id("journeys"),
  userId: v.optional(v.id("profiles")), // Removed after 24h
  timestamp: v.number(),
  lat: v.number(),
  lng: v.number(),
  accuracy: v.number(),
  speed: v.optional(v.number()),
  heading: v.optional(v.number()),
}).index("by_journey", ["journeyId"])
  .index("by_timestamp", ["timestamp"]), // For TTL cleanup
```

**Cleanup cron:**
```typescript
// convex/crons.ts
{
  name: "cleanup-old-location-data",
  schedule: "0 2 * * *", // Daily at 2am
  handler: async (ctx) => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const oldRecords = await ctx.db
      .query("locationHistory")
      .withIndex("by_timestamp", q => q.lt("timestamp", sevenDaysAgo))
      .collect();
    
    for (const record of oldRecords) {
      await ctx.db.delete(record._id);
    }
  },
}
```

**Alternatives considered:**
- **Client-only storage:** Lost on app uninstall, no server analytics. Rejected.
- **Permanent storage:** Privacy risk, GDPR non-compliant. Rejected.

### Decision 9: Map-matching Algorithm - Greedy Nearest Neighbor

**Choice:** Implement greedy nearest-neighbor map-matching (snap to closest road within 30m).

**Why:**
- Simple, fast (<5ms per update)
- Good enough for typical GPS accuracy (5-20m)
- Avoid complexity of Hidden Markov Model (HMM) until proven necessary

**Algorithm:**
```typescript
function matchToPath(lat: number, lng: number, paths: Path[]): Coordinate {
  let minDist = Infinity;
  let matched = { lat, lng };
  
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const segmentPoint = nearestPointOnSegment(
        { lat, lng },
        path[i],
        path[i + 1]
      );
      const dist = distance({ lat, lng }, segmentPoint);
      
      if (dist < minDist && dist < 30) { // 30m threshold
        minDist = dist;
        matched = segmentPoint;
      }
    }
  }
  
  return matched;
}
```

**When to upgrade to HMM:**
- User feedback about poor snapping in complex intersections
- Analytics show >10% incorrect road matching
- Performance headroom allows (HMM is 10-50x slower)

**Alternatives considered:**
- **No map-matching:** Positions jump around erratically. Rejected.
- **HMM-based matching:** Best accuracy but CPU-intensive. Defer until needed.

## Risks / Trade-offs

### Risk 1: GPS Accuracy Variance
**Description:** GPS accuracy varies 5-50m depending on environment (open sky vs urban canyon vs indoor).

**Mitigation:**
- Display accuracy circle on map so users understand uncertainty
- Increase geofence radii when accuracy is poor
- Add disclaimer when accuracy >30m: "Position approximate"
- Use Kalman filter to smooth out jitter

**Residual Risk:** Indoor/tunnel navigation will always be poor. Acceptable for transit app.

### Risk 2: Battery Drain Complaints
**Description:** Continuous GPS tracking consumes significant battery (10-20% per hour).

**Mitigation:**
- Adaptive polling intervals reduce consumption by ~40%
- Battery saver mode for low-battery scenarios
- Display battery impact estimate before journey starts
- Allow users to disable tracking and use schedule-based alerts only

**Residual Risk:** Some users may still complain. Monitor reviews and iterate.

### Risk 3: Alert Timing Errors
**Description:** Alerts may fire too early/late due to GPS lag, traffic, or vehicle speed variability.

**Mitigation:**
- Progressive alert stages provide buffer
- User feedback collection to tune distances
- Machine learning (future) to personalize timing based on user behavior

**Residual Risk:** Impossible to be perfect 100% of time. Aim for 95%+ satisfaction.

### Risk 4: Web Worker Browser Compatibility
**Description:** Some older browsers may not support Web Workers or have buggy implementations.

**Mitigation:**
- Feature detection: fallback to main-thread processing if workers unavailable
- Target browsers (Chrome 80+, Safari 13+, Firefox 78+) all support workers well
- Test on actual target devices

**Residual Risk:** Very low. Workers widely supported.

### Risk 5: Privacy Concerns
**Description:** Users may worry about location tracking and data retention.

**Mitigation:**
- Clear privacy policy explaining data use
- Location permission dialog with explanation
- Ability to delete journey history anytime
- Automatic data purge after 7 days
- Anonymization after 24 hours
- Never sell or share location data

**Residual Risk:** Some users inherently distrust location tracking. Transparency is key.

## Migration Plan

### Phase 1: Infrastructure (Week 1-2)
1. Install dependencies and configure build
2. Create navigation utilities and Web Workers
3. Set up Convex schema and mutations
4. Build geofencing and alert system (without UI)

### Phase 2: UI Components (Week 3-4)
5. Enhance ActiveJourneyMap with animations
6. Build turn-by-turn UI components
7. Implement alert banners and notifications
8. Add progress indicators and ETA display

### Phase 3: Integration (Week 5)
9. Wire up GPS tracker to Active Journey page
10. Connect alert system to UI
11. Integrate real-time transit data
12. End-to-end testing on test routes

### Phase 4: Mobile Features (Week 6)
13. Add voice guidance (Capacitor TTS)
14. Implement haptic feedback
15. Test on iOS and Android devices
16. Build and submit app updates to stores

### Phase 5: Polish and Launch (Week 7-8)
17. Performance optimization
18. Accessibility audit
19. User acceptance testing in Iași
20. Gradual rollout with feature flag
21. Monitor analytics and iterate

### Rollback Plan
- Feature flag allows instant disable of new navigation
- Old ActiveJourney component preserved as fallback
- Database migrations backward-compatible
- No data loss if rollback needed

**Rollback triggers:**
- Crash rate >2%
- User retention drops >10%
- Critical bugs in GPS tracking

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| GPS update latency | <100ms | Time from position fix to UI update |
| Map frame rate | 60fps | requestAnimationFrame consistency |
| Alert delivery | 99% | Logs: alert triggered vs geofence crossed |
| Battery drain | <15%/hr | Device battery API telemetry |
| Bundle size increase | <100KB | Gzipped JS increase from new code |
| Position accuracy | <15m (95th percentile) | Compare GPS to known stop locations |

**Monitoring:**
- Real User Monitoring (RUM) in production
- Crash reporting (Sentry or similar)
- Custom events for key user actions (journey start, step complete, alert shown)

## Open Questions

1. **Q: Should we implement route caching for offline navigation?**
   - A: YES - High value for users with poor connectivity. Include in Phase 1-2.

2. **Q: Do we need server-side geofencing or client-side sufficient?**
   - A: Client-side sufficient for MVP. Server-side geofencing (push notifications when not in app) is nice-to-have for future.

3. **Q: Should alerts work when app is backgrounded/screen locked?**
   - A: YES - Critical feature. Use Capacitor Background Runner + Local Notifications. Implement in Phase 4.

4. **Q: Do we support landscape orientation for larger map view?**
   - A: YES - Low effort, high value. Add responsive layout in Phase 2.

5. **Q: Should we show other users' real-time positions (crowdsourced traffic)?**
   - A: NO for MVP - Privacy complex, infrastructure heavy. Consider for v2.

6. **Q: Voice guidance in Romanian or English?**
   - A: Both. Detect device language and use appropriate TTS voice.

7. **Q: Integrate with system navigation (Apple Maps, Google Maps)?**
   - A: Optional - Provide "Open in Maps" button for walking segments. Low priority, nice-to-have.

8. **Q: Machine learning for personalized alert timing?**
   - A: Future iteration - Collect data first, then train models. Not MVP.

---

**Last Updated:** 2025-10-24  
**Authors:** AI Development Team  
**Status:** Draft - Pending Review
