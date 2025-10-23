# Planned Journey Departure Alerts

## Why

Users with scheduled journeys can miss their departure window if they are not reminded ahead of time. We need proactive alerts that prepare them to leave and start the journey at the right moment without manual intervention.

## What Changes

- Send a "Pregătește-te de plecare" push notification 5 minutes before the calculated departure time for planned journeys.
- Send a "Trebuie să pleci" push notification at the exact departure time and automatically mark the journey as started.
- Ensure notifications include the planned departure time (`ora X`) and destination context.
- Update journey state transitions so scheduled journeys move to active when departure time is reached.

## Impact

- Affected specs: `journey-notifications`
- Affected code: Convex scheduled notification logic, push notification templates, journey state management, background workers that evaluate departure times.
- No new external dependencies.
