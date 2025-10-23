# Push Notifications Specification

## ADDED Requirements

### Requirement: Notification Permission Request
System SHALL request notification permissions from users in a non-intrusive manner.

#### Scenario: First-time permission request
- **WHEN** user creates their first saved journey
- **THEN** system displays permission explanation dialog
- **AND** explains benefits (timely departure alerts, delay notifications)
- **AND** requests system notification permission

#### Scenario: Permission granted
- **WHEN** user grants notification permission
- **THEN** system registers device for push notifications
- **AND** stores notification token in user preferences
- **AND** enables journey notification scheduling

#### Scenario: Permission denied
- **WHEN** user denies notification permission
- **THEN** system saves journeys without notifications
- **AND** shows in-app alerts as fallback
- **AND** provides link to re-enable in settings

#### Scenario: Permission re-request
- **WHEN** user previously denied but wants notifications
- **THEN** system detects permission status
- **AND** shows instructions to enable in device settings
- **AND** deep-links to app settings when possible

### Requirement: Departure Notification Delivery
System SHALL send timely departure notifications when it's time for user to leave.

#### Scenario: Standard departure notification
- **WHEN** calculated departure time arrives
- **THEN** system sends push notification with:
  - Title: "Time to leave for [Destination]"
  - Body: "Leave now to catch [Route] at [Stop] in [X] minutes"
  - Crowding level indicator
  - Estimated arrival time
- **AND** notification includes deep link to journey details

#### Scenario: Early departure option
- **WHEN** user preferences set to receive notification 5 minutes early
- **THEN** system sends advance notification
- **AND** indicates "Optimal departure in 5 minutes"
- **AND** allows user to start journey early if desired

#### Scenario: Notification during active journey
- **WHEN** user is on route to stop
- **THEN** system does not send duplicate notifications
- **AND** tracks journey as "active"
- **AND** shows in-app progress instead

### Requirement: Delay and Update Notifications
System SHALL alert users to significant changes in journey timing.

#### Scenario: Minor delay (< 3 minutes)
- **WHEN** vehicle delay is detected < 3 minutes
- **THEN** system updates journey calculation silently
- **AND** adjusts departure time without notification
- **AND** updates in-app display if user viewing journey

#### Scenario: Significant delay (> 3 minutes)
- **WHEN** vehicle delay is detected > 3 minutes
- **THEN** system sends immediate update notification
- **AND** notification shows: "Delay detected: Leave [X] minutes later"
- **AND** provides updated departure time

#### Scenario: Critical delay (> 10 minutes)
- **WHEN** delay prevents meeting target arrival time
- **THEN** system sends urgent notification
- **AND** offers alternative routes if available
- **AND** shows new expected arrival time
- **AND** allows user to reschedule journey

#### Scenario: Service disruption
- **WHEN** scheduled vehicle is cancelled
- **THEN** system sends immediate alert
- **AND** automatically finds alternative route
- **AND** provides new journey plan
- **AND** marks original journey as "disrupted"

### Requirement: Notification Customization
Users SHALL be able to customize notification preferences.

#### Scenario: Notification timing preference
- **WHEN** user sets notification lead time preference
- **THEN** system offers options: exact time, 5 min early, 10 min early
- **AND** applies preference to all future notifications
- **AND** allows per-journey overrides

#### Scenario: Notification sound preference
- **WHEN** user customizes notification sound (mobile only)
- **THEN** system uses selected sound for departure notifications
- **AND** uses distinct sound for urgent delay notifications
- **AND** respects device "Do Not Disturb" settings

#### Scenario: Quiet hours
- **WHEN** user sets quiet hours (e.g., 22:00 - 07:00)
- **THEN** system suppresses non-urgent notifications during these hours
- **AND** still sends critical delay notifications
- **AND** queues regular notifications for when quiet hours end

#### Scenario: Notification channel preferences (Android)
- **WHEN** Android user manages notification channels
- **THEN** system provides separate channels for:
  - Departure alerts (high priority)
  - Delay notifications (urgent)
  - Journey updates (normal)
  - Marketing (low priority, opt-in)

### Requirement: Notification Actions
Notifications SHALL include actionable buttons for quick user responses.

#### Scenario: Departure notification actions
- **WHEN** departure notification delivered
- **THEN** notification includes actions:
  - "Start Journey" - Opens live navigation
  - "Snooze 5 min" - Delays departure 5 minutes
  - "Cancel" - Cancels journey for today

#### Scenario: Delay notification actions
- **WHEN** delay notification delivered
- **THEN** notification includes actions:
  - "View Alternatives" - Shows other routes
  - "Adjust Journey" - Recalculates with new time
  - "Cancel Journey" - Cancels for today

#### Scenario: Action handling
- **WHEN** user taps notification action
- **THEN** system performs action without opening app (when possible)
- **AND** sends success confirmation
- **AND** updates journey status accordingly

### Requirement: Notification Delivery Reliability
System SHALL ensure notification delivery with fallback mechanisms.

#### Scenario: Push notification delivery
- **WHEN** departure time approaches
- **THEN** system sends push notification via FCM/APNs
- **AND** tracks delivery status
- **AND** retries once if delivery fails

#### Scenario: Fallback to local notification
- **WHEN** push notification fails to deliver
- **THEN** system triggers local notification as fallback
- **AND** schedules based on device time
- **AND** logs delivery method used

#### Scenario: No notification capability
- **WHEN** notifications unavailable (web without service worker)
- **THEN** system requires user to manually check departure time
- **AND** shows persistent in-app banner before departure
- **AND** recommends installing mobile app

### Requirement: Notification History
System SHALL maintain a log of sent notifications for troubleshooting.

#### Scenario: View notification history
- **WHEN** user accesses notification settings
- **THEN** system shows last 50 notifications sent
- **AND** displays: timestamp, journey, status (delivered/failed), user action

#### Scenario: Notification diagnostics
- **WHEN** user reports missing notification
- **THEN** system shows delivery attempt details
- **AND** indicates if push permission was granted
- **AND** shows network status at send time
- **AND** provides troubleshooting suggestions

### Requirement: Batch Notification Management
System SHALL intelligently group notifications to avoid spam.

#### Scenario: Multiple journeys same time
- **WHEN** user has multiple journeys departing within 5 minutes
- **THEN** system sends single grouped notification
- **AND** lists all affected journeys
- **AND** provides separate actions for each

#### Scenario: Rapid updates
- **WHEN** multiple delays occur within 2 minutes
- **THEN** system batches updates into single notification
- **AND** shows most recent timing
- **AND** indicates "Multiple updates received"

#### Scenario: Notification rate limiting
- **WHEN** system detects > 5 notifications in 10 minutes
- **THEN** system throttles non-urgent notifications
- **AND** prioritizes critical alerts
- **AND** logs throttling event for review

### Requirement: Cross-Platform Notification Sync
System SHALL sync notification status across user's devices.

#### Scenario: Notification dismissed on one device
- **WHEN** user dismisses notification on phone
- **THEN** system marks journey as acknowledged
- **AND** removes notification from other devices
- **AND** updates web app status

#### Scenario: Action taken on one device
- **WHEN** user starts journey on phone
- **THEN** system updates status on all devices
- **AND** prevents duplicate notifications
- **AND** shows "In progress" state on web app
