## 1. Database Schema Extension

- [x] 1.1 Add ACC ignition status, relay status, and battery level fields to the schema in `db/schema.ts`.
- [x] 1.2 Generate migration scripts and apply schema changes to the PostgreSQL database.

## 2. TCP Socket Listener & Parser

- [x] 2.1 Create a TCP Socket Server module in `db/tcpServer.ts` to listen on port 8000.
- [x] 2.2 Implement the active socket connections map to associate `device_id` with TCP sockets in memory.
- [x] 2.3 Implement the GT06 binary parser module in `db/gt06Parser.ts` to decode position and state packets.
- [x] 2.4 Integrate and start the TCP Socket Server in `server.ts` alongside the Hono Node server.

## 3. Immobilizer REST API

- [x] 3.1 Implement the `POST /api/vehicles/:id/immobilize` REST API route in Hono.
- [x] 3.2 Implement safety lock checks on the backend (check if last known speed is under 20 km/h before issuing immobilizer).
- [x] 3.3 Add TCP socket transmission logic to send the cut-off command to the corresponding active socket.

## 4. UI Dashboard & Drawing Controls

- [x] 4.1 Add Leaflet Draw or Geoman library to React frontend for interactive circular geofence creation.
- [x] 4.2 Implement UI indicators for ACC status (Engine ON/OFF) and battery status in the vehicle details sidebar.
- [x] 4.3 Add the "Immobilize" toggle control button in the dashboard (guarded by password/PIN input).
