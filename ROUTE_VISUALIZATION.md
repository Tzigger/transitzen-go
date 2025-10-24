# 🗺️ Vizualizare Rută pe Hartă - Transit Route Display

## 📋 Funcționalitate Implementată

Când utilizatorul caută o destinație pe `/map`, aplicația calculează și afișează cea mai rapidă rută de transport public cu vizualizare intuitivă:

### 🎨 Stiluri de Linie:
- **Linie DISCONTINUĂ (dashArray)** = 🚶 Mers pe jos
- **Linie CONTINUĂ colorată** = 🚌 Transport public (autobuz/tramvai)

### 🎯 Markere Speciale:
- **🟢 Marker verde** = Punctul de pornire
- **🔴 Marker roșu** = Destinația

## 🔧 Implementare Tehnică

### 1. Backend - Calculare Rută (Convex)

**Fișier:** `convex/actions.ts`

Adăugat acțiune nouă `calculateTransitRoute`:

```typescript
export const calculateTransitRoute = action({
  args: {
    origin: v.object({ lat: v.number(), lng: v.number() }),
    destination: v.object({ lat: v.number(), lng: v.number() }),
    arrivalTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Folosește Google Directions API cu mode=transit
    // Decodifică polyline-urile Google
    // Returnează segmente: WALK sau TRANSIT
  }
});
```

**Caracteristici:**
- Integrare cu Google Directions API
- Mode: `transit` (autobuze + tramvaie)
- Decodare polyline Google (encoded strings → coordonate)
- Suport pentru multiple alternative de rută
- Informații detaliate: nume rută, culoare, stații

### 2. Frontend - Desenare pe Hartă

**Fișier:** `src/components/Map.tsx`

Adăugat funcții noi:

```typescript
// Desenează întreaga călătorie cu segmente diferite
const drawJourneyRoute = (routeData: any) => {
  routeData.legs.forEach((leg) => {
    if (leg.mode === 'WALK') {
      // Linie discontinuă roșie
      polyline = L.polyline(coordinates, {
        color: '#FF6B6B',
        weight: 4,
        dashArray: '10, 10', // DISCONTINUU
      });
    } else if (leg.mode === 'TRANSIT') {
      // Linie continuă colorată (din date API)
      polyline = L.polyline(coordinates, {
        color: leg.routeColor || '#3B82F6',
        weight: 6,
        opacity: 0.9, // CONTINUU
      });
    }
  });
  
  // Adaugă markere start/end
  // Ajustează camera să arate toată ruta
}
```

**Export prin MapRef:**
```typescript
export interface MapRef {
  centerOnUser: () => void;
  drawJourneyRoute: (routeData: any) => void;  // NOU
  clearJourneyRoute: () => void;               // NOU
}
```

### 3. Apelare din MapView

**Fișier:** `src/pages/MapView.tsx`

```typescript
const calculateAndDisplayRoute = async (destination) => {
  const result = await calculateRouteAction({
    origin: USER_LOCATION,
    destination: destination,
  });
  
  if (result.routes && result.routes.length > 0) {
    const bestRoute = result.routes[0];
    
    // Desenează pe hartă
    mapRef.current.drawJourneyRoute(bestRoute);
    
    // Actualizează UI cu durată/distanță
    setRouteInfo({
      duration: bestRoute.duration,
      distance: bestRoute.distance,
    });
  }
};
```

**Trigger:** Când utilizatorul selectează un rezultat din căutare:
```typescript
const handleSelectPlace = (place) => {
  calculateAndDisplayRoute(place.location);
};
```

## 📊 Structura Datelor

### Route Data Format:
```typescript
{
  legs: [
    {
      mode: 'WALK',                    // sau 'TRANSIT'
      coordinates: [                    // Array de {lat, lng}
        { lat: 47.158, lng: 27.601 },
        { lat: 47.159, lng: 27.602 },
      ],
      distance: '400 m',
      duration: '5 min',
    },
    {
      mode: 'TRANSIT',
      coordinates: [...],
      routeShortName: '3',              // Numărul autobuzului
      routeColor: '#3B82F6',            // Culoarea liniei
      from: 'Stația Copou',             // Stație pornire
      to: 'Stația Podu Roș',            // Stație destinație
      vehicleType: 'BUS',               // sau 'TRAM'
      distance: '4.5 km',
      duration: '20 min',
    },
    {
      mode: 'WALK',
      coordinates: [...],
      distance: '300 m',
      duration: '5 min',
    }
  ],
  start: { lat: 47.158, lng: 27.601 },
  end: { lat: 47.165, lng: 27.610 },
  duration: '30 min',                   // Total
  distance: '5.2 km',                   // Total
  summary: 'Via Strada Copou',
}
```

## 🎨 Vizualizare

### Exemplu Călătorie:
```
🟢 START (Locația ta)
  |
  | 🚶 Linie roșie discontinuă (400m, 5 min)
  |
📍 Stația Copou
  |
  | 🚌 Linie albastră continuă (4.5km, 20 min)
  | Autobuz 3
  |
📍 Stația Podu Roș
  |
  | 🚶 Linie roșie discontinuă (300m, 5 min)
  |
🔴 DESTINAȚIE
```

### Culori:
- **Mers pe jos:** `#FF6B6B` (roșu)
- **Transport public:** Culoare specifică liniei (din API) sau `#3B82F6` (albastru default)
- **Marker start:** Verde (`#10B981`)
- **Marker end:** Roșu (`#EF4444`)

## 🔄 Flow Utilizator

1. **Utilizatorul caută** destinația în bara de căutare
2. **Selectează** un rezultat din listă
3. **Aplicația calculează** ruta optimă (backend)
4. **Harta afișează** ruta cu:
   - Segmente colorate diferit
   - Linii discontinue pentru mers pe jos
   - Linii continue pentru transport public
   - Markere la start și sfârșit
5. **Camera se ajustează** automat pentru a arăta toată ruta
6. **Popup-uri** cu detalii la click pe segmente

## 🎯 Features Suplimentare

### Popup-uri Interactive:
```typescript
// La click pe segment mers pe jos
🚶 Mers pe jos
📏 400 m
⏱️ 5 min

// La click pe segment transport public
🚌 Autobuz 3
📍 Copou → Podu Roș
⏱️ 20 min
```

### Cleanup:
```typescript
// Șterge ruta când utilizatorul
// - Apasă butonul X din search
// - Caută altă destinație
mapRef.current.clearJourneyRoute();
```

## 📝 Configurare Necesară

### Environment Variables:
```bash
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### API Permissions Required:
- Google Directions API
- Transit mode enabled
- Polyline decoding support

## 🚀 Deploy

```bash
# Build frontend
npm run build

# Deploy backend
npx convex deploy
```

## 🎉 Rezultat Final

Utilizatorul vede pe hartă:
- ✅ Rută optimă calculată automat
- ✅ Segmente vizuale distincte (mers pe jos vs transport)
- ✅ Informații despre autobuze/tramvaie
- ✅ Durată totală și distanță
- ✅ Interacțiune intuitivă cu harta

---

**Status:** ✅ Implementat și funcțional  
**Testat:** ✅ Build reușit  
**Ready to deploy:** ✅ Da
