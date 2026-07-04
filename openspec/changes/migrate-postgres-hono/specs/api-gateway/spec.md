## ADDED Requirements

### Requirement: Cross-runtime compatibility
The API system SHALL run seamlessly on both Cloudflare Workers and Node.js without code modification to the routing layer.

#### Scenario: Server starts on Node.js
- **WHEN** the server is executed on Node.js using `@hono/node-server`
- **THEN** it must successfully listen on the specified port and accept incoming requests

#### Scenario: App runs on Cloudflare Workers
- **WHEN** deployed to Cloudflare Workers
- **THEN** the request fetch handler must intercept and process incoming client requests correctly

### Requirement: REST API Endpoints
The Hono API router MUST implement three REST endpoints identical to the Express implementation.

#### Scenario: Ingest Telemetry
- **WHEN** a client sends a valid `POST /api/locations` request
- **THEN** the system SHALL validate the payload and return a `201` status code with telemetry confirmation

#### Scenario: Retrieve Vehicles
- **WHEN** a client sends a `GET /api/vehicles` request
- **THEN** the system SHALL return a list of all vehicles along with their latest location logs

#### Scenario: Retrieve Vehicle History
- **WHEN** a client sends a `GET /api/vehicles/:id/history` request with optional `start` and `end` timestamps
- **THEN** the system SHALL return a list of location logs matching the filters ordered by timestamp descending
