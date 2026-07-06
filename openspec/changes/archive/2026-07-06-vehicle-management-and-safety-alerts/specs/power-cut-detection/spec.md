## ADDED Requirements

### Requirement: Parse power cut status
The GPRS TCP listener MUST parse GPRS/TCP binary status packets or text alerts to detect when the main battery connection is cut off.

#### Scenario: Parse binary power cut alarm
- **WHEN** the GPS tracker sends a packet indicating main power source cut-off
- **THEN** the system MUST save a critical alert of type "power_cut" in the database.

### Requirement: Broadcast power cut alert
The system MUST broadcast "power_cut" alerts to all connected consoles via SSE immediately.

#### Scenario: Visual critical alert toast
- **WHEN** the dashboard receives a "power_cut" alert via SSE stream
- **THEN** it MUST display a persistent flashing red notification warning the admin of potential sabotage.
