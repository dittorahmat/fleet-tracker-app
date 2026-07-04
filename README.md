# Fleet Tracking Application

A runtime-agnostic, serverless-ready Fleet Tracking Application MVP built using **Hono**, **Drizzle ORM**, and **PostgreSQL**. 

Designed to run seamlessly in both **Cloudflare Workers** (serverless) and **Node.js** (on-premise / local development) environments with zero code modifications.

---

## Architecture Design

```
                      ┌────────────────────────┐
                      │    Aplikasi Hono API   │
                      │  (Router & Query Logic)│
                      └───────────┬────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
  [ CLOUDFLARE WORKER ]                              [ ON-PREMISE NODE.JS ]
  Entrypoint: index.js                               Entrypoint: server.js
  ┌─────────────────────────┐                        ┌─────────────────────────┐
  │ fetch handler (default) │                        │ @hono/node-server       │
  │                         │                        │ (Express-like HTTP)     │
  │ DB Driver:              │                        │                         │
  │ @neondatabase/serverless│                        │ DB Driver:              │
  │ (HTTP Client)           │                        │ pg (node-postgres Pool) │
  └──────────┬──────────────┘                        └──────────┬──────────────┘
             │                                                  │
             ▼                                                  ▼
      ┌─────────────┐                                    ┌─────────────┐
      │ Neon Tech   │                                    │ PostgreSQL  │
      │ (Postgres)  │                                    │ On-Premise  │
      └─────────────┘                                    └─────────────┘
```

---

## Tech Stack

- **Framework**: [Hono](https://hono.dev/) (Cross-runtime web framework)
- **Database**: PostgreSQL (Hosted on Neon Tech or Local/On-Premise PostgreSQL)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Node.js Serve Utility**: `@hono/node-server`
- **Frontend Dashboard**: Vanilla HTML / CSS / JavaScript (located in `public/`)

---

## Local Development (Node.js / On-Premise)

### 1. Prerequisites
- Node.js (v18+)
- Running PostgreSQL database instance

### 2. Configuration Setup
Create a `.env` file in the root directory:
```env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/fleet_tracking
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Push Database Schema
Apply tables (`vehicles`, `location_logs`) to your PostgreSQL database:
```bash
npm run db:push
```

### 5. Start Development Server
```bash
npm run dev
```
The server will start running at `http://localhost:3000`. You can open this URL in your browser to view the tracking dashboard.

### 6. Run Telemetry Simulator
To simulate coordinate log ingestion, run the simulator in a separate terminal:
```bash
# Usage: node simulator.js <device_id> <interval_ms>
node simulator.js dev-truck-01 5000
```

---

## Cloudflare Workers Deployment

### 1. Prerequisite Configuration
Ensure `wrangler.toml` in the project root is configured:
```toml
name = "fleet-tracking-app"
main = "index.js"
compatibility_date = "2026-07-04"
```

### 2. Add Environment Secrets
Bind your Neon Tech or PostgreSQL connection string to the Worker:
```bash
npx wrangler secret put DATABASE_URL
```
*(Enter your production database connection string when prompted)*

### 3. Deploy
```bash
npx wrangler deploy
```

---

## API Endpoints

### 1. `POST /api/locations`
Ingest location telemetry logs for a vehicle.

- **Request Body**:
  ```json
  {
    "device_id": "dev-truck-01",
    "latitude": -6.175392,
    "longitude": 106.827153,
    "speed": 40.5,
    "heading": 180,
    "timestamp": "2026-07-04T12:00:00.000Z"
  }
  ```
- **Response** (201 Created):
  ```json
  { "message": "Location telemetry recorded successfully" }
  ```

### 2. `GET /api/vehicles`
Retrieve list of all active vehicles along with their last known location telemetry.

- **Response** (200 OK):
  ```json
  [
    {
      "id": "dev-truck-01",
      "name": "Vehicle dev-tr",
      "status": "active",
      "updatedAt": "2026-07-04T12:00:00.000Z",
      "lastLocation": {
        "id": 1,
        "vehicleId": "dev-truck-01",
        "latitude": -6.175392,
        "longitude": 106.827153,
        "speed": 40.5,
        "heading": 180,
        "timestamp": "2026-07-04T12:00:00.000Z"
      }
    }
  ]
  ```

### 3. `GET /api/vehicles/:id/history`
Retrieve historical location logs for a specific vehicle.

- **Query Parameters**:
  - `start` (Optional ISO string): Filter logs starting from this timestamp.
  - `end` (Optional ISO string): Filter logs up to this timestamp.
