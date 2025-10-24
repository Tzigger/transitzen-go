# Navigation Capability

## ADDED Requirements

### Requirement: Real-time GPS Tracking
The system SHALL continuously track user location with high accuracy during active journeys using native device GPS capabilities.

#### Scenario: Start tracking on journey activation
- **WHEN** user starts an active journey
- **THEN** system requests high-accuracy location permission
- **AND** initiates continuous GPS tracking with 5-second intervals
- **AND** displays current position on map with blue pulsing marker

#### Scenario: Smooth position updates
- **WHEN** GPS position updates are received
- **THEN** apply Kalman filter to smooth jittery coordinates
- **AND** animate marker movement between positions
- **AND** calculate heading/bearing from movement direction
- **AND** rotate user marker to face movement direction

#### Scenario: Adaptive polling based on journey state
- **WHEN** user is actively moving (walking or on transit)
- **THEN** poll GPS every 5 seconds for high precision
- **WHEN** user is stationary at a stop
- **THEN** reduce polling to every 15 seconds to save battery
- **WHEN** journey is paused or in background
- **THEN** switch to significant location change monitoring

#### Scenario: Handle GPS signal loss
- **WHEN** GPS accuracy drops below 50 meters
- **THEN** display "GPS signal weak" warning banner
- **AND** increase polling frequency to attempt re-acquisition
- **WHEN** GPS unavailable for >30 seconds
- **THEN** show "Waiting for GPS signal" overlay
- **AND** maintain last known position on map

#### Scenario: Battery optimization
- **WHEN** device battery is below 20%
- **THEN** automatically switch to low-power tracking mode
- **AND** notify user of reduced accuracy
- **WHEN** battery is critically low (<10%)
- **THEN** offer to pause tracking and show last known position

### Requirement: Map-matching
The system SHALL snap user position to the most likely path (road, sidewalk, or transit route) to provide accurate navigation.

#### Scenario: Snap to walking path
- **WHEN** user is in walking mode between stops
- **THEN** match GPS coordinates to nearest sidewalk or pedestrian path
- **AND** prefer paths within 20 meters of raw GPS position
- **AND** maintain continuous path without jumps

#### Scenario: Snap to transit route
- **WHEN** user is on bus or tram
- **THEN** match position to transit route polyline
- **AND** interpolate position between stops based on vehicle speed
- **AND** handle route deviations gracefully

#### Scenario: Transition between modes
- **WHEN** user boards a vehicle (transition from walking to transit)
- **THEN** detect mode change from speed and proximity to stop
- **AND** switch from sidewalk matching to route matching
- **AND** smooth transition without position jumps

### Requirement: Turn-by-Turn Walking Directions
The system SHALL provide step-by-step walking directions from current location to boarding/alighting stops with visual and textual guidance.

#### Scenario: Generate walking route
- **WHEN** user needs to walk to a stop
- **THEN** calculate shortest pedestrian path using OpenStreetMap data
- **AND** break path into turn-by-turn instructions
- **AND** display each instruction with distance and action (turn left, straight, etc.)

#### Scenario: Show next maneuver
- **WHEN** user is walking to stop
- **THEN** display large banner with next instruction
- **AND** show distance to next turn (e.g., "In 50m, turn right")
- **AND** highlight next turn on map with arrow marker
- **WHEN** within 10m of maneuver
- **THEN** emphasize instruction with bold text and icon

#### Scenario: Wrong way detection
- **WHEN** user moves >30m in opposite direction of route
- **THEN** display "You may be going the wrong way" alert
- **AND** offer to recalculate route from current position
- **WHEN** user confirms recalculation
- **THEN** generate new walking directions and update map

#### Scenario: Completed walking segment
- **WHEN** user arrives within 15m of destination stop
- **THEN** mark walking segment as complete
- **AND** show "You've arrived at [Stop Name]" confirmation
- **AND** transition to waiting/boarding mode

### Requirement: Dynamic Re-routing
The system SHALL automatically recalculate routes when disruptions, delays, or user deviations are detected.

#### Scenario: Transit delay detected
- **WHEN** real-time transit API reports delay >5 minutes on planned vehicle
- **THEN** evaluate alternative routes
- **AND** notify user "Your bus is delayed. Checking alternatives..."
- **WHEN** faster alternative exists
- **THEN** show notification with new route details and ETA comparison
- **AND** offer "Switch to new route" button

#### Scenario: User deviates from route
- **WHEN** user moves >100m away from planned route for >2 minutes
- **THEN** automatically recalculate route from current position
- **AND** show "Recalculating..." overlay during computation
- **AND** update map and instructions with new route

#### Scenario: Missed transit connection
- **WHEN** user misses planned bus/tram (vehicle departed before arrival)
- **THEN** immediately search for next available vehicle on same route
- **AND** update departure time and ETA
- **WHEN** no same-route vehicle available soon
- **THEN** offer alternative routes with different vehicles

### Requirement: Heading and Bearing Calculation
The system SHALL calculate and display user's movement direction to aid orientation and navigation accuracy.

#### Scenario: Calculate heading from GPS
- **WHEN** user moves between two GPS positions
- **THEN** calculate bearing angle from previous to current position
- **AND** smooth heading changes to avoid jitter (exponential moving average)
- **AND** rotate user marker icon to face calculated heading

#### Scenario: Display compass direction
- **WHEN** user is navigating on foot
- **THEN** show compass rose with cardinal directions (N, S, E, W)
- **AND** highlight current heading on compass
- **AND** update compass in real-time as user turns

#### Scenario: Use device compass sensor
- **WHEN** device has magnetometer (compass sensor)
- **THEN** fuse GPS-based heading with sensor data for accuracy
- **AND** prioritize sensor data when user is stationary or moving slowly
- **WHEN** device lacks compass
- **THEN** rely solely on GPS-based heading calculation
