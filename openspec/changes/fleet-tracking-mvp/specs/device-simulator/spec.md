## ADDED Requirements

### Requirement: Periodically simulate GPS coordinate stream
The system SHALL include a standalone simulator utility that reads a route coordinates file and sends periodic HTTP requests to the ingestion endpoint to simulate vehicle movement.

#### Scenario: Running the vehicle route simulation
- **WHEN** the simulator utility is started with a target device ID and route path
- **THEN** it SHALL send location telemetry updates to `POST /api/locations` at a configurable interval (defaulting to every 5 seconds) until the route coordinates are exhausted.
