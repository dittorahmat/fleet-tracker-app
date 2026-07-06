## ADDED Requirements

### Requirement: Peta Dashboard Draw Control
The system MUST allow users to draw circular shapes on the map to define a geofence.

#### Scenario: Add geofence by drawing
- **WHEN** the user draws a circle on the dashboard map and hits save
- **THEN** the system MUST send a `POST /api/geofences` request to create the geofence with center coordinates and radius in meters.
