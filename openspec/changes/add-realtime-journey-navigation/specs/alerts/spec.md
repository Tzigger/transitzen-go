# Alerts Capability

## ADDED Requirements

### Requirement: Proximity-based Alerts
The system SHALL trigger location-based alerts using geofencing when user approaches key waypoints during journey.

#### Scenario: Create geofence for stop arrival
- **WHEN** user boards transit vehicle
- **THEN** create circular geofence (radius 200m) around alighting stop
- **AND** monitor GPS position against geofence continuously
- **AND** prepare alert content (stop name, vehicle info, next action)

#### Scenario: Approaching stop alert
- **WHEN** user enters geofence (within 200m of alighting stop)
- **THEN** trigger "Approaching [Stop Name]" notification
- **AND** display notification banner at top of screen
- **AND** play subtle notification sound
- **AND** update map to center on stop

#### Scenario: Prepare to alight alert
- **WHEN** user is within 100m of stop and vehicle is moving
- **THEN** trigger "Prepare to alight at next stop" alert
- **AND** show alert banner with yellow background
- **AND** play more prominent sound
- **AND** vibrate device briefly (if supported)

#### Scenario: Exit now alert
- **WHEN** user is within 50m of stop and vehicle speed drops below 10 km/h
- **THEN** trigger critical "Exit now - [Stop Name]" alert
- **AND** show full-screen overlay with red accent
- **AND** play loud, distinctive alert sound
- **AND** strong vibration pattern
- **AND** auto-dismiss after 10 seconds or when user marks step complete

#### Scenario: Suppress alert if already acted
- **WHEN** system detects user walking away from vehicle (speed >3 km/h, distance increasing)
- **THEN** cancel pending alerts for that stop
- **AND** mark step as complete automatically
- **AND** transition to next journey segment

### Requirement: Multi-stage Alert System
The system SHALL progressively escalate alert intensity as user approaches critical waypoints to ensure awareness without annoyance.

#### Scenario: Stage 1 - Informational
- **WHEN** 5+ minutes from waypoint
- **THEN** show subtle, non-intrusive text notification
- **AND** no sound or vibration
- **AND** dismiss automatically after 5 seconds

#### Scenario: Stage 2 - Attention
- **WHEN** 2-5 minutes from waypoint
- **THEN** show banner notification with icon
- **AND** play soft notification sound once
- **AND** optional light vibration
- **AND** remain on screen until acknowledged

#### Scenario: Stage 3 - Urgent
- **WHEN** <2 minutes from critical action (alighting, transferring)
- **THEN** show prominent full-width banner
- **AND** play distinctive alert sound (louder, longer)
- **AND** strong vibration pattern
- **AND** require manual dismissal or auto-mark as seen after 15 seconds

#### Scenario: Stage 4 - Critical
- **WHEN** immediate action required (vehicle stopping at destination)
- **THEN** show full-screen overlay with action button
- **AND** play urgent sound continuously until dismissed
- **AND** maximum vibration
- **AND** flash screen border for visual attention

### Requirement: Voice Guidance
The system SHALL provide spoken audio instructions for key navigation events to support hands-free and accessible use.

#### Scenario: Announce next walking turn
- **WHEN** user is 30m from a turn during walking segment
- **THEN** speak instruction: "In 30 meters, turn [left/right] on [Street Name]"
- **WHEN** user reaches turn point
- **THEN** speak: "Turn [left/right] now"

#### Scenario: Announce stop arrival
- **WHEN** approaching stop proximity alert triggers
- **THEN** speak: "Approaching [Stop Name]. Prepare to exit."
- **WHEN** critical exit alert triggers
- **THEN** speak: "Exit now at [Stop Name]"

#### Scenario: Announce delays or changes
- **WHEN** route disruption detected requiring re-routing
- **THEN** speak: "Your route has changed. Follow new directions."
- **WHEN** significant delay detected
- **THEN** speak: "Your bus is delayed. New arrival time: [Time]"

#### Scenario: Respect audio preferences
- **WHEN** user has disabled voice guidance in settings
- **THEN** skip all voice announcements
- **AND** rely on visual and haptic alerts only
- **WHEN** device is in silent mode
- **THEN** automatically suppress voice guidance
- **AND** increase vibration intensity to compensate

#### Scenario: Handle language preferences
- **WHEN** user language setting is Romanian
- **THEN** deliver voice guidance in Romanian accent and vocabulary
- **WHEN** language is English
- **THEN** use English voice synthesis
- **AND** translate street and stop names appropriately

### Requirement: Haptic Feedback
The system SHALL provide tactile vibration patterns to reinforce critical alerts and improve accessibility.

#### Scenario: Stop arrival vibration
- **WHEN** user enters stop proximity geofence
- **THEN** vibrate with short single pulse (200ms)
- **WHEN** prepare to alight alert triggers
- **THEN** vibrate with double pulse (200ms, 100ms pause, 200ms)
- **WHEN** critical exit alert triggers
- **THEN** vibrate with strong triple pulse pattern

#### Scenario: Navigation turn vibration
- **WHEN** approaching turn during walking
- **THEN** vibrate once (150ms) at 30m before turn
- **WHEN** at turn point
- **THEN** vibrate twice rapidly

#### Scenario: Error or warning vibration
- **WHEN** GPS signal lost
- **THEN** vibrate with continuous low-intensity pulse
- **WHEN** going wrong way
- **THEN** vibrate with long single pulse (500ms)

#### Scenario: Success confirmation
- **WHEN** user completes journey step
- **THEN** vibrate with pleasant success pattern (short-short-long)
- **WHEN** journey fully completed
- **THEN** vibrate with celebration pattern (short bursts)

#### Scenario: Accessibility considerations
- **WHEN** user has enabled high-intensity haptics in accessibility settings
- **THEN** increase vibration strength by 50%
- **WHEN** device doesn't support haptics
- **THEN** gracefully degrade to visual-only alerts

### Requirement: Alert History and Preferences
The system SHALL allow users to customize alert behavior and review past notifications.

#### Scenario: Customize alert timing
- **WHEN** user opens alert preferences
- **THEN** show slider to adjust "Prepare to alight" alert distance (50-500m)
- **AND** show toggle for sound, vibration, and voice independently
- **AND** preview alerts with current settings

#### Scenario: Do Not Disturb mode
- **WHEN** device is in Do Not Disturb mode
- **THEN** suppress sound and vibration for non-critical alerts
- **AND** still show visual notifications
- **AND** allow critical exit alerts to break through DND

#### Scenario: View alert history
- **WHEN** user opens journey details after completion
- **THEN** display timeline of all alerts triggered
- **AND** show alert type, time, and user response (dismissed, ignored, acted)
- **AND** use history to improve future alert timing

#### Scenario: Alert fatigue prevention
- **WHEN** user repeatedly dismisses alerts without acting
- **THEN** reduce frequency of non-critical alerts
- **WHEN** user consistently misses stops despite alerts
- **THEN** suggest increasing alert intensity or enabling voice guidance

### Requirement: Context-aware Notification Timing
The system SHALL adjust alert timing based on real-time context like vehicle speed, traffic, and user behavior patterns.

#### Scenario: Adjust for vehicle speed
- **WHEN** bus is moving slowly due to traffic
- **THEN** trigger "prepare to alight" alert earlier to account for longer stop approach
- **WHEN** vehicle is at high speed
- **THEN** delay alert slightly as stop will arrive quickly

#### Scenario: Learn from user behavior
- **WHEN** user consistently acts 30 seconds after "prepare" alert
- **THEN** shift alert timing to trigger 30 seconds earlier for better fit
- **AND** store learned preference in user profile

#### Scenario: Consider GPS accuracy
- **WHEN** GPS accuracy is poor (>30m error)
- **THEN** trigger alerts earlier to account for position uncertainty
- **AND** add disclaimer: "GPS accuracy limited, alert may be early"

#### Scenario: Handle tunnel or indoor segments
- **WHEN** GPS signal lost while on underground/indoor route segment
- **THEN** estimate position from last known location and vehicle schedule
- **AND** trigger alerts based on estimated position
- **AND** show "Position estimated" indicator
