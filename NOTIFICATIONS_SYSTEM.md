# Sistema de Notificări - ZeroWait

## Prezentare Generală

Sistemul de notificări din ZeroWait oferă alerte inteligente pentru călătorii, ajutând utilizatorii să nu întârzie niciodată. Folosește **Capacitor Local Notifications** pentru notificări native pe iOS și Android, și **Web Notifications API** pentru browser.

## Caracteristici

### 1. **Notificări de Plecare** 🚀
- **Pre-departure (30 min înainte)**: Reamintire inițială pentru pregătirea călătoriei
- **Departure (10 min înainte)**: Alertă finală când trebuie să pleci

### 2. **Alerte în Timp Real** ⚠️
- **Întârzieri**: Notificări când există întârzieri pe rută
- **Aglomerație**: Alertă când vehiculele sunt aglomerate
- **Modificări rute**: Notificări pentru schimbări în rutele favorite

### 3. **Notificări de Proximitate** 📍
- Alertă când te apropii de oprire (300m)
- Alertă când ești foarte aproape (100m)
- Alertă când ai ajuns la destinație

## Arhitectură

```
src/lib/notifications/
└── notification-service.ts       # Service principal pentru notificări
```

### NotificationService

Service singleton care gestionează toate notificările aplicației.

#### Metode Principale

```typescript
// Cere permisiune pentru notificări
await notificationService.requestPermission();

// Trimite notificare imediată
await notificationService.sendNotification({
  id: 'unique-id',
  title: 'Titlu',
  body: 'Mesaj',
});

// Programează notificare pentru viitor
await notificationService.scheduleNotification({
  id: 'unique-id',
  title: 'Titlu',
  body: 'Mesaj',
  scheduledAt: new Date('2025-10-25T10:00:00'),
});

// Programează notificare de plecare
await notificationService.scheduleDepartureNotification(
  journeyId,
  departureTime,
  origin,
  destination,
  advanceMinutes
);

// Anulează notificare
await notificationService.cancelNotification(notificationId);
```

## Integrare în CreateJourney

Notificările sunt programate automat când utilizatorul salvează o călătorie cu opțiunea "Alerte de plecare" activată:

```typescript
// 1. Cerere permisiune la încărcarea paginii
useEffect(() => {
  const requestNotificationPermission = async () => {
    const hasPermission = await notificationService.checkPermission();
    if (!hasPermission) {
      await notificationService.requestPermission();
    }
  };
  requestNotificationPermission();
}, []);

// 2. Programare notificări la salvarea călătoriei
if (notifyDeparture && departureTime) {
  // Notificare 10 min înainte de plecare
  await notificationService.scheduleDepartureNotification(
    journeyId.toString(),
    departureDateTime,
    origin,
    destination,
    10
  );

  // Notificare 30 min înainte (pre-departure)
  await notificationService.schedulePreDepartureNotification(
    journeyId.toString(),
    departureDateTime,
    destination,
    30
  );
}
```

## Tipuri de Notificări

### 1. Departure Notification
```typescript
{
  title: '🚀 Timp de plecare!',
  body: 'Pleacă în 10 minute spre Universitate',
  data: {
    type: 'departure',
    journeyId: 'journey-123',
    origin: 'Acasă',
    destination: 'Universitate'
  }
}
```

### 2. Pre-Departure Notification
```typescript
{
  title: '⏰ Nu uita!',
  body: 'Plecare în 30 minute spre Universitate',
  data: {
    type: 'pre-departure',
    journeyId: 'journey-123',
    destination: 'Universitate'
  }
}
```

### 3. Delay Alert
```typescript
{
  title: '⚠️ Întârziere detectată',
  body: 'Autobuz 28 întârzie cu 5 minute',
  data: {
    type: 'delay',
    routeName: 'Autobuz 28',
    delayMinutes: 5
  }
}
```

### 4. Crowding Alert
```typescript
{
  title: '👥 Aglomerație',
  body: 'Autobuz 28 este foarte aglomerat',
  data: {
    type: 'crowding',
    routeName: 'Autobuz 28',
    crowdingLevel: 'foarte aglomerat'
  }
}
```

## Permisiuni

### iOS
Adaugă în `Info.plist`:
```xml
<key>NSUserNotificationsUsageDescription</key>
<string>This app needs notification access to send journey alerts</string>
```

### Android
Permisiunile sunt gestionate automat de Capacitor.

## Testare

### Test Manual

1. **Test Notificare Imediată**:
```typescript
await notificationService.sendNotification({
  id: 'test-1',
  title: 'Test',
  body: 'Notificare de test',
});
```

2. **Test Notificare Programată** (5 secunde):
```typescript
await notificationService.scheduleNotification({
  id: 'test-2',
  title: 'Test Programat',
  body: 'Această notificare a fost programată',
  scheduledAt: new Date(Date.now() + 5000),
});
```

3. **Test Notificare de Plecare**:
```typescript
const departureTime = new Date(Date.now() + 2 * 60 * 1000); // 2 min în viitor
await notificationService.scheduleDepartureNotification(
  'test-journey',
  departureTime,
  'Test Origin',
  'Test Destination',
  1 // 1 min advance
);
```

### Verificare Notificări Programate

```typescript
const pending = await notificationService.getPendingNotifications();
console.log('Notificări programate:', pending);
```

## Limitări

### Web Browser
- Notificările web necesită permisiune explicită de la utilizator
- Notificările programate pe web sunt limitate la 24 ore (folosim `setTimeout`)
- Notificările nu funcționează dacă browser-ul este închis

### Native (iOS/Android)
- Notificările programate funcționează chiar dacă aplicația este închisă
- iOS poate limita numărul de notificări pe zi
- Android poate grupa notificările automat

## Best Practices

1. **Cere permisiune la momentul potrivit**: Nu cere permisiune imediat la deschiderea aplicației. Așteaptă până când utilizatorul înțelege valoarea notificărilor.

2. **Verifică permisiunea înainte de programare**:
```typescript
const hasPermission = await notificationService.checkPermission();
if (!hasPermission) {
  // Explică utilizatorului de ce sunt necesare notificările
  await notificationService.requestPermission();
}
```

3. **Anulează notificările vechi**:
```typescript
// Anulează notificările pentru o călătorie finalizată
await notificationService.cancelNotification(`departure-${journeyId}`);
await notificationService.cancelNotification(`pre-departure-${journeyId}`);
```

4. **Oferă control utilizatorului**: Permite utilizatorului să dezactiveze notificările pentru fiecare tip separat.

## Troubleshooting

### Notificările nu apar pe iOS

1. Verifică permisiunile în Settings > ZeroWait > Notifications
2. Asigură-te că `Info.plist` conține cheia pentru notificări
3. Rebuild aplicația după modificări în `Info.plist`

### Notificările nu apar pe Android

1. Verifică permisiunile în Settings > Apps > ZeroWait > Notifications
2. Dezactivează "Battery Optimization" pentru aplicație
3. Run `npx cap sync` după instalarea plugin-ului

### Notificările web nu funcționează

1. Verifică dacă browser-ul suportă Web Notifications API
2. Testează în Chrome/Firefox/Safari modern
3. Verifică dacă site-ul este servit prin HTTPS (cerință pentru notificări)

## Viitor

### Planificat pentru implementare:

- [ ] **Rich Notifications**: Imagini, acțiuni inline (ex: "Pornește călătoria", "Renunță")
- [ ] **Notificări recurente**: Pentru călătorii recurente (ex: în fiecare zi la 8:00)
- [ ] **Notificări bazate pe locație**: Alertă când utilizatorul ajunge la oprire
- [ ] **Notificări pentru grup**: Partajează călătoria cu prietenii
- [ ] **Statistici notificări**: Vezi câte notificări ai primit și care au fost utile

## Resurse

- [Capacitor Local Notifications Docs](https://capacitorjs.com/docs/apis/local-notifications)
- [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [iOS Notification Programming Guide](https://developer.apple.com/documentation/usernotifications)
- [Android Notifications Guide](https://developer.android.com/develop/ui/views/notifications)

