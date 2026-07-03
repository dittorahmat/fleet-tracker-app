## ADDED Requirements

### Requirement: Show live locations of vehicles on map
The dashboard interface SHALL display a map containing markers for all active vehicles, showcasing their last reported location.

#### Scenario: Displaying active vehicle markers
- **WHEN** the dashboard page loads
- **THEN** the system SHALL fetch the last known position of all active vehicles and render them on the Leaflet.js map.

### Requirement: Playback vehicle historical route
The dashboard interface SHALL allow the user to select a vehicle and a time range to view and animate its historical movement path on the map.

#### Scenario: Viewing historical route on map
- **WHEN** the user selects a vehicle, inputs a start and end time range, and clicks "Show Route"
- **THEN** the system SHALL fetch historical coordinate logs for that vehicle and draw a polyline path along with markers on the map.
