## 1. Database & Schema Migration
- [x] 1.1 Update `db/schema.js` to include the `geofences` and `alerts` PostgreSQL tables.
- [x] 1.2 Generate new Drizzle migration scripts for PostgreSQL.
- [x] 1.3 Apply migrations to the database and verify schemas using `npm run db:push` or local migrations.

## 2. Ingestion & Alerting Engine Implementation
- [x] 2.1 Implement geodetic distance utility (Haversine formula) in a utility module.
- [x] 2.2 Create alerting logic module `db/alertsEngine.js` to process speeding checks and geofence entries/exits.
- [x] 2.3 Update `POST /api/locations` route handler in `index.js` to run the alerting engine on every telemetry input.
- [x] 2.4 Add seeding script or endpoint to create a default geofence (e.g., around Jakarta central coordinate points) for simulation verification.

## 3. SSE Streaming Backend
- [x] 3.1 Implement SSE broadcast manager to handle connected clients in `index.js` or a separate helper.
- [x] 3.2 Add `GET /api/stream` endpoint to support connection from standard HTML5 EventSource clients.
- [x] 3.3 Broadcast coordinate payloads and generated alert payloads to all SSE streams immediately after ingestion.

## 4. Frontend Refactor (React + Vite + Tailwind CSS Setup)
- [x] 4.1 Scaffold a new Vite project with React and Tailwind CSS in a temporary sub-directory or merge it into the root project directory.
- [x] 4.2 Install React Map dependencies (Leaflet & React-Leaflet) and styles.
- [x] 4.3 Configure production build to target the `./public` directory so Hono serves the built SPA assets.

## 5. React Dashboard Components Development
- [x] 5.1 Implement `useSSE` hook to listen to `/api/stream` and update central state for active vehicles and notifications.
- [x] 5.2 Implement Map Component: Live tracking markers + active geofence overlay circles on Leaflet.
- [x] 5.3 Implement Alert Feeds Component: real-time slide-in toast notifications + alerts history side-panel.
- [x] 5.4 Implement Route Playback Component: controls to fetch, pause, speed up, and play simulated vehicle historical tracks.

## 6. Testing & End-to-End Verification
- [x] 6.1 Run backend Hono server and frontend dev server concurrently.
- [x] 6.2 Spin up the simulator `node simulator.js` and verify markers move in real-time on the map without browser refreshing.
- [x] 6.3 Simulate a vehicle speeding and entering/leaving the geofence, and verify alerts pop up as toast notifications.
