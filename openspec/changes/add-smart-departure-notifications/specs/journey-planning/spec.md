# Journey Planning Specification

## ADDED Requirements

### Requirement: Saved Journey Creation
Users SHALL be able to create and save journeys with a destination and target arrival time.

#### Scenario: Create journey with valid destination
- **WHEN** user provides destination coordinates and target arrival time
- **THEN** system calculates optimal route
- **AND** saves journey to user's account
- **AND** returns journey ID and departure time

#### Scenario: Create recurring journey
- **WHEN** user creates journey with recurring schedule (e.g., weekdays at 20:00)
- **THEN** system saves recurring pattern
- **AND** schedules notifications for all matching days

#### Scenario: Invalid destination
- **WHEN** user provides unreachable destination (no stops within 2km)
- **THEN** system returns error "No transit routes available to this location"
- **AND** suggests nearest reachable point

### Requirement: Optimal Departure Time Calculation
System SHALL calculate the precise departure time to minimize wait time at stops (maximum 1 minute).

#### Scenario: Direct route calculation
- **WHEN** journey requires single bus with no transfers
- **THEN** departure time = arrival time - walking_to_stop - travel_time - walking_from_stop - 1min_buffer
- **AND** walking times calculated using Haversine distance at 5 km/h
- **AND** travel time based on real-time vehicle positions and historical data

#### Scenario: Multi-leg journey calculation
- **WHEN** journey requires transfer between routes
- **THEN** system calculates each leg separately
- **AND** adds 5-minute transfer buffer at transfer stops
- **AND** ensures user arrives with maximum 1-minute wait for each vehicle

#### Scenario: Real-time adjustment
- **WHEN** vehicle position indicates delay
- **THEN** system recalculates departure time
- **AND** sends updated notification if change > 3 minutes

### Requirement: Walking Distance Calculation
System SHALL calculate walking distances and times for journey segments.

#### Scenario: Walking to origin stop
- **WHEN** calculating journey from user location
- **THEN** system finds nearest stop on required route within 1km
- **AND** calculates walking time using Haversine formula
- **AND** assumes walking speed of 5 km/h (83 m/min)

#### Scenario: Walking from destination stop
- **WHEN** calculating final segment to destination
- **THEN** system finds optimal stop balancing walking distance and arrival time
- **AND** includes walking time in total journey calculation

#### Scenario: Excessive walking distance
- **WHEN** nearest stop is > 2km from origin or destination
- **THEN** system suggests alternative starting point or destination
- **OR** recommends ride-share for first/last mile

### Requirement: Route Optimization
System SHALL select the optimal route considering time, transfers, and crowding.

#### Scenario: Multiple route options
- **WHEN** multiple routes reach destination
- **THEN** system ranks by: 1) total time, 2) fewest transfers, 3) lowest crowding
- **AND** presents top 3 options to user
- **AND** highlights recommended route

#### Scenario: Crowding consideration
- **WHEN** primary route has >80% crowding prediction
- **THEN** system suggests alternative route if available
- **AND** shows crowding level for all options

#### Scenario: No viable route
- **WHEN** no transit route can meet target arrival time
- **THEN** system shows earliest possible arrival time
- **AND** suggests leaving earlier or alternative destination

### Requirement: Journey Monitoring
System SHALL continuously monitor saved journeys and adjust notifications based on real-time conditions.

#### Scenario: Normal conditions monitoring
- **WHEN** journey is scheduled for future departure
- **THEN** system checks vehicle positions every 60 seconds
- **AND** recalculates departure time if predictions change
- **AND** maintains notification schedule if change < 3 minutes

#### Scenario: Delay detected
- **WHEN** vehicle delay causes departure time to change by > 3 minutes
- **THEN** system sends update notification immediately
- **AND** provides revised departure time
- **AND** logs delay event

#### Scenario: Vehicle breakdown or cancellation
- **WHEN** scheduled vehicle is no longer in service
- **THEN** system finds next available vehicle on route
- **OR** suggests alternative route
- **AND** sends urgent notification with new plan

### Requirement: Journey History
System SHALL maintain history of completed journeys for user reference and optimization.

#### Scenario: Journey completion tracking
- **WHEN** user completes a journey
- **THEN** system records: actual departure time, actual arrival time, route taken
- **AND** calculates accuracy of prediction
- **AND** uses data to improve future predictions

#### Scenario: History viewing
- **WHEN** user views journey history
- **THEN** system shows last 30 days of completed journeys
- **AND** displays accuracy metrics (on-time %, average wait time)
- **AND** highlights best and worst performers

### Requirement: Journey Sharing
Users SHALL be able to share journey plans with others.

#### Scenario: Share journey link
- **WHEN** user shares a journey
- **THEN** system generates shareable link with journey details
- **AND** recipient can view route without account
- **AND** recipient can import to their account

#### Scenario: Family sharing
- **WHEN** user enables family sharing
- **THEN** designated family members can view journey status
- **AND** receive notifications for shared journeys
- **AND** see real-time location during active journey

### Requirement: Offline Journey Access
System SHALL allow access to saved journeys when offline.

#### Scenario: View saved journeys offline
- **WHEN** user opens app without internet connection
- **THEN** system displays all saved journeys from cache
- **AND** shows last calculated departure times
- **AND** indicates data may be stale

#### Scenario: Journey updates when reconnected
- **WHEN** app reconnects to internet
- **THEN** system refreshes all journey calculations
- **AND** updates notifications if times changed
- **AND** syncs any changes made offline
