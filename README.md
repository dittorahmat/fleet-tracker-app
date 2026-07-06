# Fleet Tracking Application

A runtime-agnostic, serverless-ready Fleet Tracking Application MVP built using **Hono**, **Drizzle ORM**, **Tailwind CSS**, and **PostgreSQL**. 

Designed to run seamlessly in both **Cloudflare Workers** (serverless) and **Node.js** (on-premise / local development) environments with zero code modifications.

It features a dual-mode ingestion server (HTTP REST API + raw TCP Sockets) to support both simulator streams and standard commercial GPS Tracker hardware (Concox GT06/Jimi protocols).

---

## Technical Stack

- **Backend**: [Hono](https://hono.dev/) (run via `tsx` on Node.js locally, deployable to Cloudflare Workers).
- **Database**: PostgreSQL (Neon Tech or on-premise) with **Drizzle ORM**.
- **TCP Socket Server**: Node.js `net` library listener running on port `8000` (handles GT06 handshake, logins, location telemetry, heartbeat, and alarms).
- **Frontend**: React SPA built with Vite, Tailwind CSS v4, and Leaflet Maps.
- **SSE Manager**: In-memory manager broadcasting telemetry updates, metadata updates, and critical alarms dynamically.

---

## Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL database instance

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
Apply tables (`vehicles`, `location_logs`, `geofences`, `alerts`) and columns (including extended rental metadata, odometer, etc.) to your PostgreSQL database:
```bash
npm run db:push
```

### 5. Compile & Build Frontend Assets
Make sure to build the React production bundle before running the app. The static assets are copied to `./public/` for Hono static file serving.
```bash
# Compile and build frontend assets
npm run build --prefix frontend
```

### 6. Start Development Server
```bash
npm run dev
```
- **Web Dashboard URL**: `http://localhost:3000`
- **TCP Socket GPS Port**: `8000`

---

## How to Setup & Configure GPS Tracker Hardware

To connect a commercial GPS tracker (such as Concox GT06N, Jimi JM-VL03, or similar) to the application:

1. **Obtain IMEI Number**:
   Find the unique 15-digit IMEI number printed on the sticker of the GPS tracker hardware. This IMEI acts as the unique `id` (or `deviceId`) in the database.
2. **Install SIM Card**:
   Insert a cellular SIM card (ideally Telkomsel IoT/M2M or similar with an active data package) into the GPS tracker.
3. **Configure Tracker via SMS**:
   Send the following SMS commands from your phone to the tracker's cellular number:
   - **Configure APN** (depending on your SIM card operator):
     ```text
     APN,internet#
     ```
   - **Set Target IP and Port**:
     Point the tracker to the public IP/Domain of your server and the TCP port `8000`:
     ```text
     SERVER,0,YOUR_SERVER_IP,8000,0#
     ```
   - **Configure Tracking Interval** (e.g., upload every 10 seconds):
     ```text
     TIMER,10#
     ```
Once configured, the GPS tracker will automatically log in to the TCP server, auto-create a vehicle record under the database, and begin transmitting live telemetry logs.

---

## How to Test & Simulate Telemetry Logs Locally

If you don't have access to physical GPS hardware, you can test all features using text-based simulator commands via **Netcat (`nc`)** or **Telnet**:

1. Open a new terminal and connect to the TCP socket listener:
   ```bash
   nc localhost 8000
   ```
2. **Simulate Login**:
   Register your device on the active socket stream:
   ```text
   login:my-truck-01
   ```
   *Response from server:* `login:ok`
3. **Simulate GPS Coordinates**:
   Send coordinates in the format: `gps:lat,lng,speed,heading,acc,battery`:
   ```text
   gps:-6.175392,106.827153,45.0,180,true,88
   ```
   *Response from server:* `gps:ok`
4. **Simulate Aki/Power Sabotage Alarm**:
   Trigger a critical power cut alert to test anti-theft workflows:
   ```text
   alarm:power_cut
   ```
   *Response from server:* `alarm:ok`

---

## Using Dashboard Features

- **Edit Vehicle Information**:
  In the sidebar fleet list, select a vehicle, click **Edit Details**, and a modal will open. You can input plate numbers, type (e.g., Toyota Avanza), rental status, odometer, next oil change interval, and tax due date.
- **Engine Power Control (Immobilizer)**:
  Toggle the **Disable Engine** button in the vehicle's actions drawer. You will be prompted to enter the Admin PIN: **`1234`**. 
  *Note:* To ensure safety, engine cut-off commands are automatically blocked by the server if the vehicle's live speed is greater than `20 km/h`.
- **Draw Geofences**:
  Double-click anywhere on the Leaflet map to trigger the geofence builder. Input the zone name and radius in meters, then click save. Live vehicle movements will trigger entering/exiting alerts dynamically.
- **Real-Time Alarms Panel**:
  The right sidebar displays a real-time feed of alerts (overspeeding, geofence exit, and critical power cut alarms). The critical power cut alert triggers a red flashing indicator and a bouncing toast notification.
