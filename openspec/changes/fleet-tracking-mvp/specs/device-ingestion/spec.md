## ADDED Requirements

### Requirement: Receive telemetry data from devices
The system SHALL provide a public REST API endpoint `POST /api/locations` to receive location and telemetry updates from tracking devices. The endpoint MUST accept a JSON payload containing `device_id` (string), `latitude` (number), `longitude` (number), `speed` (number), `heading` (number), and `timestamp` (ISO-8601 string).

#### Scenario: Successful telemetry ingestion
- **WHEN** a client sends a POST request to `/api/locations` with a valid telemetry JSON payload
- **THEN** the system SHALL return a status code of 201 Created and save the location log in the database.

#### Scenario: Invalid telemetry payload
- **WHEN** a client sends a POST request to `/api/locations` with missing required fields (e.g., missing latitude or longitude)
- **THEN** the system SHALL return a status code of 400 Bad Request and reject the payload.
