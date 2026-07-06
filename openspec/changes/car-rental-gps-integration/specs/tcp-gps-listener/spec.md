## ADDED Requirements

### Requirement: TCP server port binding
The system MUST listen on a dedicated TCP port (default: 8000) for incoming raw TCP socket connections from GPS tracker devices.

#### Scenario: GPS tracker connects successfully
- **WHEN** a GPS tracker device attempts a TCP connection on port 8000
- **THEN** the system MUST accept the connection and keep it open.

### Requirement: Decode GT06 protocol
The system MUST parse incoming binary streams in GT06 format, decoding latitude, longitude, speed, heading, timestamp, and ignition status (ACC).

#### Scenario: Parse valid location packet
- **WHEN** the GPS tracker sends a valid GT06 location data packet
- **THEN** the system MUST save the parsed location data (latitude, longitude, speed, heading, timestamp, and ACC status) into the database and broadcast the location update.
