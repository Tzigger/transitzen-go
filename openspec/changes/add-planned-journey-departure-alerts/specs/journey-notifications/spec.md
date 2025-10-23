## ADDED Requirements
### Requirement: Planned Journey Departure Alerts
The system SHALL send proactive push notifications for scheduled journeys that approach their departure time and SHALL automatically start the journey when the departure threshold is reached.

#### Scenario: Five minute warning
- **GIVEN** the user has a scheduled journey with a calculated departure time `ora X`
- **WHEN** the current time is five minutes before `ora X`
- **THEN** the system SHALL send a push notification with the message "Pregătește-te de plecare, trebuie să pleci la ora X" that references the journey destination

#### Scenario: Departure time reached
- **GIVEN** the user has a scheduled journey with a calculated departure time `ora X`
- **WHEN** the current time equals `ora X`
- **THEN** the system SHALL send a push notification telling the user to leave now and referencing the destination
- **AND** the system SHALL mark the journey as active and begin live tracking
