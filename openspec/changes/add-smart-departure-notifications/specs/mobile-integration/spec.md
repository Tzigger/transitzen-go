# Mobile Integration Specification

## ADDED Requirements

### Requirement: Capacitor Configuration
System SHALL be configured to run as a native mobile app using Capacitor.

#### Scenario: iOS app configuration
- **WHEN** building for iOS
- **THEN** Capacitor creates native iOS project in `ios/` directory
- **AND** web assets are bundled into iOS app
- **AND** app uses WKWebView for rendering
- **AND** native plugins are accessible via JavaScript bridge

#### Scenario: Android app configuration
- **WHEN** building for Android
- **THEN** Capacitor creates native Android project in `android/` directory
- **AND** web assets are bundled into Android app
- **AND** app uses WebView for rendering
- **AND** native plugins are accessible via JavaScript bridge

#### Scenario: Web fallback
- **WHEN** app runs in browser (not native)
- **THEN** Capacitor plugins gracefully degrade
- **AND** push notifications use web APIs (service worker)
- **AND** local notifications show browser notifications
- **AND** geolocation uses web Geolocation API

### Requirement: Push Notification Plugin Integration
System SHALL integrate native push notifications via Capacitor plugin.

#### Scenario: iOS push notifications setup
- **WHEN** iOS app launches
- **THEN** system requests APNs (Apple Push Notification service) token
- **AND** registers device token with Convex backend
- **AND** subscribes to user-specific notification topics
- **AND** handles notification taps to open specific journeys

#### Scenario: Android push notifications setup
- **WHEN** Android app launches
- **THEN** system requests FCM (Firebase Cloud Messaging) token
- **AND** registers device token with Convex backend
- **AND** subscribes to user-specific notification topics
- **AND** handles notification taps to open specific journeys

#### Scenario: Notification received while app in background
- **WHEN** push notification arrives and app is backgrounded
- **THEN** system shows notification in device notification tray
- **AND** plays notification sound (respecting device settings)
- **AND** updates notification badge count
- **AND** triggers background task to update journey status

#### Scenario: Notification received while app in foreground
- **WHEN** push notification arrives and app is active
- **THEN** system shows in-app toast instead of push notification
- **AND** updates journey UI immediately
- **AND** does not show notification in system tray
- **AND** does not play notification sound

### Requirement: Local Notifications Plugin Integration
System SHALL use local notifications for scheduled alerts when push is unavailable.

#### Scenario: Schedule local notification
- **WHEN** journey requires notification and push unavailable
- **THEN** system schedules local notification at departure time
- **AND** notification triggers even if app is closed
- **AND** notification persists across device reboots
- **AND** notification includes same content as push notification

#### Scenario: Cancel local notification
- **WHEN** journey is cancelled or completed
- **THEN** system cancels pending local notification
- **AND** removes notification from system tray if already shown
- **AND** cleans up notification resources

#### Scenario: Update local notification
- **WHEN** journey time changes
- **THEN** system cancels old notification
- **AND** schedules new notification with updated time
- **AND** maintains notification ID for tracking

### Requirement: Background Runner Integration
System SHALL execute background tasks for journey monitoring and updates.

#### Scenario: Periodic background task
- **WHEN** app is backgrounded or closed
- **THEN** system runs background task every 1 minute
- **AND** checks vehicle positions for active journeys
- **AND** recalculates departure times if positions changed
- **AND** updates scheduled notifications if needed

#### Scenario: Battery-efficient background execution
- **WHEN** device is in low power mode
- **THEN** system reduces background task frequency to every 5 minutes
- **AND** prioritizes critical journeys (departing within 30 minutes)
- **AND** skips updates for journeys departing in > 2 hours

#### Scenario: Background task failure handling
- **WHEN** background task fails to execute
- **THEN** system falls back to last calculated departure time
- **AND** logs failure for diagnostics
- **AND** resumes normal operation when app reopened

### Requirement: Geolocation Plugin Integration
System SHALL access device location for journey origin detection.

#### Scenario: Request location permission
- **WHEN** user creates first journey
- **THEN** system requests location permission with explanation
- **AND** explains usage: "To calculate walking time from your location"
- **AND** requests "While Using" permission (not "Always")

#### Scenario: Get current location for journey
- **WHEN** calculating journey from current location
- **THEN** system requests GPS coordinates
- **AND** uses high-accuracy mode
- **AND** times out after 10 seconds
- **AND** falls back to manual location entry if GPS unavailable

#### Scenario: Background location tracking (opt-in)
- **WHEN** user enables "Auto-detect departure" feature
- **THEN** system requests background location permission
- **AND** monitors location only when journey active
- **AND** stops tracking after journey completes
- **AND** respects battery-saving preferences

### Requirement: App Lifecycle Management
System SHALL properly handle mobile app lifecycle events.

#### Scenario: App resume from background
- **WHEN** user returns to app after backgrounding
- **THEN** system syncs journey data with backend
- **AND** refreshes vehicle positions
- **AND** updates departure time calculations
- **AND** shows any missed notifications as in-app alerts

#### Scenario: App launched from notification tap
- **WHEN** user taps notification
- **THEN** system opens app to specific journey details
- **AND** marks notification as read
- **AND** shows current journey status
- **AND** offers "Start Navigation" if departure time close

#### Scenario: App termination
- **WHEN** system terminates app (low memory, user swipe)
- **THEN** scheduled local notifications persist
- **AND** background tasks continue (within OS limits)
- **AND** next app launch resumes normal operation
- **AND** no journey data is lost

### Requirement: Native UI Components
System SHALL integrate native UI elements where appropriate for better UX.

#### Scenario: Native date/time picker
- **WHEN** user selects arrival time for journey
- **THEN** system shows native iOS/Android time picker
- **AND** respects device 12h/24h format preference
- **AND** returns selected time to web app

#### Scenario: Native share sheet
- **WHEN** user shares journey
- **THEN** system opens native share dialog
- **AND** includes journey summary text
- **AND** offers native sharing options (Messages, Email, etc.)
- **AND** generates share URL for recipients

#### Scenario: Native haptic feedback
- **WHEN** user performs important actions (save journey, start navigation)
- **THEN** system triggers haptic feedback
- **AND** uses appropriate feedback type (success, warning, error)
- **AND** respects device haptic settings

### Requirement: App Store Compliance
Mobile apps SHALL meet iOS App Store and Google Play Store requirements.

#### Scenario: iOS App Store metadata
- **WHEN** submitting to App Store
- **THEN** app includes:
  - App name: "ZeroWait - Smart Transit for Iași"
  - Privacy policy URL
  - Support URL
  - App description and screenshots
  - Required permissions explanations
  - Age rating: 4+ (suitable for all ages)

#### Scenario: Google Play Store metadata
- **WHEN** submitting to Play Store
- **THEN** app includes:
  - App name: "ZeroWait - Smart Transit for Iași"
  - Privacy policy URL
  - Feature graphic and screenshots
  - Required permissions explanations
  - Content rating: Everyone

#### Scenario: Privacy manifest (iOS)
- **WHEN** iOS 17+ privacy requirements checked
- **THEN** app includes PrivacyInfo.xcprivacy file
- **AND** declares tracking domains (none)
- **AND** declares required reasons for API usage:
  - Location: journey planning and navigation
  - Notifications: departure alerts
  - Background tasks: real-time monitoring

### Requirement: Offline Functionality
Mobile app SHALL work with limited or no internet connectivity.

#### Scenario: Offline data availability
- **WHEN** app loses internet connection
- **THEN** cached journeys remain accessible
- **AND** last calculated departure times shown with "offline" indicator
- **AND** user can view saved journeys and history

#### Scenario: Reconnection sync
- **WHEN** app reconnects to internet
- **THEN** system syncs changes made offline
- **AND** refreshes vehicle positions
- **AND** recalculates all journey times
- **AND** resolves any conflicts (user edits vs server updates)

#### Scenario: Offline journey creation
- **WHEN** user creates journey while offline
- **THEN** journey saved locally
- **AND** marked as "pending sync"
- **AND** synced when connection restored
- **AND** notifications scheduled using local time estimates

### Requirement: Deep Linking
App SHALL support deep links for navigation and sharing.

#### Scenario: Universal Links (iOS) / App Links (Android)
- **WHEN** user taps link like `ZeroWait.app/journey/abc123`
- **THEN** link opens in native app (if installed)
- **OR** falls back to web version
- **AND** navigates to specific journey

#### Scenario: Custom URL scheme
- **WHEN** app receives URL like `ZeroWait://journey/abc123`
- **THEN** app opens and navigates to journey
- **AND** handles scheme from other apps

#### Scenario: Notification deep links
- **WHEN** user taps notification
- **THEN** app opens to relevant journey
- **AND** shows current status and next steps
- **AND** marks journey as viewed

### Requirement: Security and Data Protection
Mobile app SHALL protect user data according to platform requirements.

#### Scenario: Secure storage
- **WHEN** app stores user tokens or sensitive data
- **THEN** data stored in iOS Keychain / Android Keystore
- **AND** encrypted at rest
- **AND** not accessible to other apps
- **AND** removed on app uninstall

#### Scenario: HTTPS enforcement
- **WHEN** app communicates with backend
- **THEN** all API calls use HTTPS
- **AND** certificate pinning optional for extra security
- **AND** falls back to error screen if TLS fails

#### Scenario: Biometric authentication (future)
- **WHEN** user enables biometric lock
- **THEN** app requires Face ID / Touch ID / fingerprint to open
- **AND** respects device biometric settings
- **AND** falls back to PIN if biometrics unavailable
