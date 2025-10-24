# 🎯 Proposal Created: Real-time Journey Navigation

## ✅ Status: Ready for Review

Am creat un proposal complet pentru transformarea paginii `/active-journey` într-un sistem de navigație în timp real similar cu Google Maps.

## 📁 Fișiere Create

```
openspec/changes/add-realtime-journey-navigation/
├── proposal.md          ✅ Documentație completă (Why, What, Impact)
├── tasks.md            ✅ 20 secțiuni, 100+ task-uri detaliate
├── design.md           ✅ Decizii tehnice și arhitectură
└── specs/
    ├── navigation/spec.md  ✅ 5 requirements, 25+ scenarios
    ├── alerts/spec.md      ✅ 6 requirements, 30+ scenarios  
    └── tracking/spec.md    ✅ 5 requirements, 20+ scenarios
```

## 🎯 Caracteristici Principale

### 1. **Tracking GPS Avansat** 🛰️
- Kalman filtering pentru poziții smooth (fără jitter)
- Polling adaptiv bazat pe starea călătoriei (5-30s)
- Map-matching pe drumuri/rute
- Detectare heading și direcție de mers
- Optimizare baterie (15% baterie/oră maximum)

### 2. **Sistem Inteligent de Alerte** 🔔
- **Geofencing real** (nu simulat ca acum)
- Alerte progresive: Info → Attention → Urgent → Critical
- **Distanțe configurabile:**
  - 500m: "Approaching stop" (info)
  - 200m: "Prepare to alight" (attention + sunet)
  - 100m: "Get ready" (urgent + vibrație)
  - 50m: "EXIT NOW" (critical + sunet puternic)
- Context-aware (detectează dacă ai coborât deja)
- Vibrații haptic pentru accessibility

### 3. **Turn-by-Turn Navigation** 🧭
- Direcții walking de la poziția curentă la stație
- "In 50m, turn right" cu marcaje pe hartă
- Detectare "wrong way" și recalculare automată
- Animații smooth pentru marker-ul utilizatorului

### 4. **Voice Guidance** 🔊
- Anunțuri vocale: "Approaching [Stop Name]"
- Suport Română și Engleză
- Capacitor TTS pentru mobile + Web Speech API pentru PWA
- Configurabil (on/off per user)

### 5. **Enhanced Map** 🗺️
- Marker animat cu heading indicator
- Poziții real-time ale vehiculelor pe rută
- Camera follow smooth cu transitions
- Pulsing effects pentru current location
- Night mode optimized

### 6. **Dynamic Re-routing** 🔄
- Detectare întârzieri din Transit API
- Recalculare automată la deviere de la rută
- Sugestii rute alternative la delay >5 min
- Update ETA la fiecare 30s

### 7. **Progress & Status** 📊
- Progress bar animat (% completare)
- "On time" / "Running late" indicators
- Distance și time remaining
- Battery impact monitor

### 8. **Safety Features** 🆘
- Emergency button (call 112)
- Live location sharing
- Safe arrival confirmation
- Panic button
- Offline mode cu cached data

## 🏗️ Arhitectură Tehnică

### Core Stack
```typescript
// GPS Processing (Web Worker)
@turf/turf          // Geospatial calculations
kalman-filter       // Position smoothing
leaflet-rotatedmarker // Directional icons
leaflet-animated-marker // Smooth animations

// Voice & Haptics (Mobile)
@capacitor/text-to-speech  // Voice guidance
@capacitor/haptics         // Vibrations

// Backend
Convex              // Real-time state management
Location history    // 7-day TTL, 24h anonymization
```

### Key Technical Decisions

1. **Web Workers** pentru GPS processing → 60fps UI
2. **Kalman Filter** pentru smooth positions → reduce jitter de la 10-20m la 3-5m
3. **Turf.js** pentru geofencing → battle-tested, 15KB gzipped
4. **Leaflet** păstrat (defer MapLibre) → minimize bundle size
5. **Progressive Alerts** (4 stages) → prevent alert fatigue
6. **Adaptive GPS polling** → save 40% battery
7. **7-day location TTL** → privacy-first

## 📋 Implementation Plan (8 săptămâni)

### Week 1-2: Infrastructure
- Dependencies + Web Workers
- Navigation utilities (GPS, Kalman, geofencing)
- Convex schema updates

### Week 3-4: UI Components  
- Enhanced ActiveJourneyMap
- Turn-by-turn panels
- Alert banners
- Progress indicators

### Week 5: Integration
- Wire GPS to Active Journey page
- Connect alerts to UI
- Real-time transit data
- E2E testing

### Week 6: Mobile Features
- Voice guidance (TTS)
- Haptic feedback
- iOS/Android testing
- App store submissions

### Week 7-8: Polish & Launch
- Performance optimization
- Accessibility audit
- User testing în Iași
- Gradual rollout cu feature flag

## 🎯 Success Metrics

| Metric | Target |
|--------|--------|
| GPS Update Latency | <100ms |
| Map Frame Rate | 60fps |
| Alert Delivery | 99% |
| Battery Drain | <15%/hour |
| Position Accuracy | <15m (95th percentile) |
| Bundle Size Increase | <100KB gzipped |

## ⚠️ Risks & Mitigations

1. **GPS Accuracy Varies** (5-50m)
   - → Show accuracy circle, increase geofences when poor

2. **Battery Drain Complaints**
   - → Adaptive polling, battery saver mode, impact warnings

3. **Alert Timing Errors**
   - → Progressive stages, user feedback tuning, ML future

4. **Privacy Concerns**
   - → Clear policy, 7-day TTL, anonymization, delete option

## 🚀 Next Steps

1. **Review Proposal** - Team review design decisions
2. **Approve Architecture** - Confirm technical approach
3. **Start Implementation** - Begin Phase 1 (Dependencies)
4. **Iterative Development** - Follow 8-week plan
5. **Testing & Launch** - Gradual rollout with monitoring

## 📊 Validation

```bash
✅ openspec validate add-realtime-journey-navigation --strict
   Change 'add-realtime-journey-navigation' is valid
```

Toate requirements au scenarii complete, deltas sunt well-formed, și propunerea e gata de review!

---

## 🔗 Quick Links

- **Proposal**: `openspec/changes/add-realtime-journey-navigation/proposal.md`
- **Tasks**: `openspec/changes/add-realtime-journey-navigation/tasks.md`
- **Design**: `openspec/changes/add-realtime-journey-navigation/design.md`
- **Specs**: `openspec/changes/add-realtime-journey-navigation/specs/`

**View proposal**: `npx openspec show add-realtime-journey-navigation`

---

**Created**: 2025-10-24  
**Status**: ✅ Valid - Ready for Review  
**Complexity**: High (8 weeks, 100+ tasks)  
**Impact**: 🔥 Major - Core differentiator feature
