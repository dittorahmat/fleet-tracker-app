## ADDED Requirements

### Requirement: PUT vehicle details endpoint
The system MUST provide a REST API endpoint `PUT /api/vehicles/:id` to update vehicle details such as name.

#### Scenario: Update vehicle name successfully
- **WHEN** user sends a `PUT /api/vehicles/:id` request with `{ name: "Avanza B 1234 CD" }`
- **THEN** the system MUST update the name of the vehicle in the database and return the updated vehicle object.

### Requirement: Inline name editing in Dashboard
The dashboard UI MUST allow users to edit the vehicle's name in the vehicle details sidebar and reflect the updated name immediately.

#### Scenario: Click edit name and save
- **WHEN** user clicks the edit button next to the vehicle name and enters a new name
- **THEN** the system MUST send a PUT request to the server and update the name in the vehicles list.
