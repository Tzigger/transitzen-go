# Tracking Capability

## ADDED Requirements

### Requirement: Journey State Management
The system SHALL maintain real-time state of active journeys including current step, progress, and completion status.

#### Scenario: Initialize journey tracking
- **WHEN** user starts an active journey from saved or planned journey
- **THEN** create active journey record in database
- **AND** initialize state with first step marked as active
- **AND** set remaining steps as pending
- **AND** record start time and initial position

#### Scenario: Track step progression
- **WHEN** user completes current step (arrives at stop, boards vehicle, etc.)
- **THEN** mark step as completed in journey state
- **AND** advance to next step
- **AND** update progress percentage
- **AND** recalculate ETA for remaining steps

#### Scenario: Handle step transitions
- **WHEN** transitioning from walking to transit
- **THEN** update journey state to "waiting" or "onboard"
- **AND** change GPS tracking mode accordingly
- **AND** activate appropriate alerts for transit segment
- **WHEN** transitioning from transit to walking
- **THEN** mark vehicle step complete
- **AND** start walking navigation for next segment
- **AND** generate turn-by-turn directions

#### Scenario: Journey completion
- **WHEN** user arrives within 20m of final destination
- **THEN** mark journey as completed
- **AND** stop GPS tracking
- **AND** show success screen with journey summary
- **AND** save journey history with actual route taken and timings

#### Scenario: Journey cancellation
- **WHEN** user manually cancels active journey
- **THEN** stop all tracking and alerts
- **AND** mark journey as cancelled with reason
- **AND** preserve partial progress in history
- **AND** release system resources

### Requirement: Progress Calculation
The system SHALL continuously calculate and display accurate journey progress as percentage and remaining time/distance.

#### Scenario: Calculate overall progress
- **WHEN** journey state updates
- **THEN** calculate progress as (completed steps / total steps) × 100%
- **AND** weight steps by estimated duration for more accurate percentage
- **AND** display progress bar with animated transitions

#### Scenario: Estimate time remaining
- **WHEN** on each step
- **THEN** calculate time remaining for current step from GPS position and step end point
- **AND** sum time for all remaining steps
- **AND** adjust for real-time delays from transit API
- **AND** display as "X min remaining"

#### Scenario: Calculate distance remaining
- **WHEN** in walking segment
- **THEN** measure distance from current position to stop along walking route
- **AND** display in meters if <1km, kilometers if >1km
- **WHEN** on transit
- **THEN** estimate distance as stops remaining × average stop spacing
- **AND** sum with walking distance for final segment

#### Scenario: Update ETA dynamically
- **WHEN** delays detected or speed changes
- **THEN** recalculate ETA every 30 seconds
- **AND** show updated arrival time with indicator if changed
- **AND** notify user if delay >5 minutes: "Arrival delayed to [new time]"

### Requirement: Location History Logging
The system SHALL record user's GPS trail during journey for analytics, debugging, and replay features.

#### Scenario: Log position updates
- **WHEN** GPS position update received during active journey
- **THEN** store timestamped position in journey history
- **AND** include accuracy, speed, and heading metadata
- **AND** compress data to minimize storage (subsample to 1 point per 10 seconds if speed <1 m/s)

#### Scenario: Privacy protection
- **WHEN** journey completes
- **THEN** retain location history for 7 days only
- **AND** anonymize data after 24 hours (remove user identifier)
- **WHEN** user deletes journey
- **THEN** immediately purge all associated location data

#### Scenario: Replay journey
- **WHEN** user views completed journey in history
- **THEN** allow playback of actual route taken
- **AND** animate map marker along recorded GPS trail
- **AND** show timeline slider to jump to specific times
- **AND** overlay planned route to show deviations

#### Scenario: Use for route improvement
- **WHEN** analyzing journey history across users
- **THEN** identify common route deviations
- **AND** detect frequently missed stops
- **AND** improve alert timing based on aggregate data

### Requirement: Real-time Vehicle Position Integration
The system SHALL fetch and display real-time positions of transit vehicles on user's route to improve ETA accuracy and provide visual confirmation.

#### Scenario: Track boarded vehicle
- **WHEN** user boards transit vehicle
- **THEN** identify vehicle ID from route and stop proximity
- **AND** subscribe to real-time position updates for that vehicle
- **AND** display vehicle icon on map moving in real-time

#### Scenario: Show vehicle approaching stop
- **WHEN** user is waiting at stop for scheduled vehicle
- **THEN** display approaching vehicle on map
- **AND** show estimated time until arrival
- **AND** update every 5-10 seconds
- **WHEN** vehicle is <2 minutes away
- **THEN** show "Your bus is arriving" notification

#### Scenario: Detect vehicle delays
- **WHEN** vehicle position indicates slower progress than scheduled
- **THEN** calculate delay amount (actual vs scheduled)
- **AND** notify user if delay >3 minutes
- **AND** update journey ETA accordingly

#### Scenario: Confirm user on correct vehicle
- **WHEN** user location matches vehicle position closely for >30 seconds
- **THEN** auto-confirm user is onboard correct vehicle
- **AND** show "Onboard [Vehicle Line]" status
- **WHEN** positions diverge significantly
- **THEN** alert "Are you on the correct vehicle?" for confirmation

### Requirement: Offline Mode Support
The system SHALL provide degraded but functional navigation when internet connectivity is unavailable.

#### Scenario: Cache route data
- **WHEN** journey starts with connectivity
- **THEN** download and cache route polylines, stop coordinates, and walking directions
- **AND** store in local storage/IndexedDB
- **AND** include fallback transit schedule

#### Scenario: Navigate offline
- **WHEN** connectivity lost during journey
- **THEN** continue GPS tracking using cached data
- **AND** show "Offline mode" indicator
- **AND** provide turn-by-turn directions from cached walking routes
- **AND** use scheduled times for transit instead of real-time

#### Scenario: Alert limitations
- **WHEN** in offline mode
- **THEN** disable real-time delay notifications
- **AND** show disclaimer: "Using scheduled times, delays not available"
- **AND** continue proximity-based alerts normally (GPS-based)

#### Scenario: Resume when online
- **WHEN** connectivity restored
- **THEN** sync journey state with backend
- **AND** fetch latest vehicle positions and delays
- **AND** update ETA with real-time data
- **AND** show "Online mode restored" brief notification

### Requirement: Battery Monitoring
The system SHALL monitor device battery level and adjust tracking behavior to preserve power.

#### Scenario: Normal battery mode
- **WHEN** battery >20%
- **THEN** use high-accuracy GPS with 5-second intervals
- **AND** enable all features (animations, voice, haptics)

#### Scenario: Low battery mode
- **WHEN** battery 10-20%
- **THEN** reduce GPS polling to 10-second intervals
- **AND** disable non-essential animations
- **AND** show "Battery saver active" notice
- **WHEN** battery <10%
- **THEN** reduce to 30-second intervals
- **AND** disable all animations, voice, and haptics
- **AND** show critical "Low battery - navigation limited" warning

#### Scenario: Critical battery handling
- **WHEN** battery <5%
- **THEN** offer to switch to ultra-low power mode
- **AND** use only scheduled positions (no real-time)
- **AND** reduce screen brightness
- **WHEN** user declines
- **THEN** show "Risk of journey interruption if device shuts down"

#### Scenario: Battery impact reporting
- **WHEN** journey completes
- **THEN** show battery consumed during journey
- **AND** compare to typical usage
- **AND** offer tips to reduce consumption if high
