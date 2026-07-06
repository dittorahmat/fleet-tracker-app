# Design: Real-time Telemetry, Alerting Engine, and Frontend Refactor

## 1. Database Schema Additions

We will add two new tables to `db/schema.js` using Drizzle ORM PostgreSQL dialect:

### `geofences`
- `id`: `uuid` or `serial` (primary key)
- `name`: `varchar` (name of the area)
- `centerLatitude`: `doublePrecision`
- `centerLongitude`: `doublePrecision`
- `radiusMeters`: `doublePrecision`
- `createdAt`: `timestamp`

### `alerts`
- `id`: `uuid` or `serial` (primary key)
- `vehicleId`: `varchar` (references `vehicles.id`)
- `type`: `varchar` (`overspeeding`, `geofence_exit`, `geofence_enter`)
- `message`: `text`
- `severity`: `varchar` (`low`, `medium`, `high`)
- `timestamp`: `timestamp`
- `resolved`: `boolean` (default `false`)

---

## 2. Real-Time SSE Architecture

We will implement an event broadcast system in Hono that works across both Node.js and Cloudflare Workers.
Hono provides a built-in helper for Server-Sent Events stream: `hono/streaming`.

### SSE Stream Endpoint: `GET /api/stream`
When a client connects:
1. We keep the connection open using `streamSSE`.
2. We register the client's connection callback to a global active client registry or an event emitter.

### Event Broadcast
On successful ingest at `POST /api/locations`:
1. Save the coordinate to `locationLogs`.
2. Run the Alerting Engine (see section 3).
3. Broadcast a JSON payload to all active SSE client streams:
   - For location update: `{ type: "location", data: { vehicleId, latitude, longitude, speed, heading, timestamp } }`
   - For alert update: `{ type: "alert", data: { vehicleId, type, message, severity, timestamp } }`

---

## 3. Alerting Engine Logic

Within the `POST /api/locations` route handler, after saving the new coordinate point:

```javascript
// Pseudocode for Alerting Engine Check
async function processAlerts(db, telemetry) {
  const { device_id, latitude, longitude, speed, timestamp } = telemetry;

  // 1. Check Speeding
  const SPEED_LIMIT_KMH = 80;
  if (speed > SPEED_LIMIT_KMH) {
    await db.insert(alerts).values({
      vehicleId: device_id,
      type: 'overspeeding',
      message: `Speed limit exceeded: ${speed} km/h (Limit: ${SPEED_LIMIT_KMH} km/h)`,
      severity: 'high',
      timestamp: new Date(timestamp)
    });
    // Trigger broadcast for alert
  }

  // 2. Check Geofences
  const activeGeofences = await db.select().from(geofences);
  for (const gf of activeGeofences) {
    const distance = calculateDistanceInMeters(
      latitude, longitude, 
      gf.centerLatitude, gf.centerLongitude
    );
    const isInside = distance <= gf.radiusMeters;
    
    // We can query the last location log of the vehicle to check transitions
    const lastLog = await getLastLocationLog(db, device_id);
    if (lastLog) {
      const prevDistance = calculateDistanceInMeters(
        lastLog.latitude, lastLog.longitude,
        gf.centerLatitude, gf.centerLongitude
      );
      const wasInside = prevDistance <= gf.radiusMeters;

      if (wasInside && !isInside) {
        // Exited geofence
        await db.insert(alerts).values({
          vehicleId: device_id,
          type: 'geofence_exit',
          message: `Vehicle exited geofence: ${gf.name}`,
          severity: 'medium',
          timestamp: new Date(timestamp)
        });
      } else if (!wasInside && isInside) {
        // Entered geofence
        await db.insert(alerts).values({
          vehicleId: device_id,
          type: 'geofence_enter',
          message: `Vehicle entered geofence: ${gf.name}`,
          severity: 'low',
          timestamp: new Date(timestamp)
        });
      }
    }
  }
}
```

---

## 4. Frontend Refactor (React, Vite, & Tailwind CSS)

Currently, the frontend is served as a static asset from `public/index.html`. We will refactor this to use a modern React single-page application structure located under `frontend/` and built into `public/`.

### App Structure
- `src/App.jsx`: Main dashboard layout with grid panels.
- `src/components/MapPanel.jsx`: Leaflet component. Manages live markers and polyline playback state.
- `src/components/AlertsPanel.jsx`: Scrollable feed of active/resolved alerts with severity colors.
- `src/components/Sidebar.jsx`: Active vehicle status dashboard (speed, status, last update time).
- `src/hooks/useSSE.js`: Custom hook to connect to `EventSource('/api/stream')`, dispatching location updates and alerts to state.

### Route Playback UI State
- Maintain a list of coordinates for history tracking.
- Use a local step index + timer (`requestAnimationFrame` or `setInterval`) to move a dummy marker along the polyline path smoothly, with playback controls (Speed, Play/Pause/Restart).
