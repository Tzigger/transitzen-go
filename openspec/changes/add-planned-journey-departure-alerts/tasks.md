# Implementation Tasks

## 1. Scheduling Logic
- [x] 1.1 Add background job to detect planned journeys whose departure time is within 5 minutes.
- [x] 1.2 Queue push notification payloads for the 5-minute warning.
- [x] 1.3 Trigger push notification and journey state change at exact departure time.

## 2. Notifications
- [x] 2.1 Create notification templates for "Pregătește-te" and "Trebuie să pleci" messages.
- [x] 2.2 Ensure notifications include destination and departure time context.

## 3. Journey State Management
- [x] 3.1 Update journey model to store scheduling metadata needed for the alerts.
- [x] 3.2 Automatically mark journey as active when departure notification is sent.

## 4. Validation
- [ ] 4.1 Add unit/integration tests covering both notifications firing and journey state transition.
