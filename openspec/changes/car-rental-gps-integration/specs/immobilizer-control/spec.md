## ADDED Requirements

### Requirement: API engine cut-off commands
The system MUST provide HTTP API endpoints to send commands to the GPS tracker via the active TCP socket connection to disable or enable the vehicle engine.

#### Scenario: Send disable engine command
- **WHEN** the user calls `POST /api/vehicles/:id/immobilize` with `status: true`
- **THEN** the system MUST find the active TCP connection for the vehicle and send the "Cut-off Engine" protocol packet to the device.

### Requirement: Safety speed lock for immobilizer
The system MUST refuse to send the engine cut-off packet if the vehicle's last known speed is above 20 km/h.

#### Scenario: Speed lock protection active
- **WHEN** the user calls `POST /api/vehicles/:id/immobilize` while speed is 35 km/h
- **THEN** the system MUST return a 400 Bad Request error stating that the vehicle is moving too fast for a safe shutdown.
