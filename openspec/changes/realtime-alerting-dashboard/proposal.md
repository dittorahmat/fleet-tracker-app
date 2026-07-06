# Proposal: Real-time Telemetry, Alerting Engine, and Frontend Refactor

## 1. Objectives

This proposal outlines the next evolution of the Fleet Tracking Application. The goal is to move from a basic pull-based MVP to a fully real-time, event-driven tracking system with a modern dashboard.

Specifically, we will implement:
1. **Real-time Telemetry Streams (SSE)**: Push updates instantly to the client when a location payload is received at `POST /api/locations` without polling.
2. **Alerting & Geofencing Engine**:
   - Detect **Overspeeding** (> 80 km/h or configurable speed limit).
   - Detect **Geofence Breaches** (entering/exiting defined bounding boxes or circular zones).
   - Persist alerts in a new database table and broadcast them to connected clients.
3. **Premium Frontend Refactor**: Refactor the vanilla JS frontend into a modern React application using Vite and Tailwind CSS.
   - Real-time interactive vehicle markers.
   - Real-time toast alerts for overspeeding and geofence breaches.
   - **Route Playback** to visualize historical tracks in an animated playback style.

---

## 2. User Benefits

- **Immediate Visibility**: Fleet managers see vehicles move in real-time as coordinates are ingested.
- **Proactive Management**: Instant alerts prevent speeding and unauthorized route excursions.
- **Improved UX**: A polished dashboard design with animated route playbacks and real-time alerts.

---

## 3. Scope of Work

### In Scope
- Designing and implementing a Server-Sent Events (SSE) broadcast channel in Hono.
- Creating PostgreSQL schemas for `alerts` and `geofences` using Drizzle ORM.
- Implementing an Alerting Engine helper that evaluates incoming GPS points against speed limits and active geofences on ingestion.
- Setting up a Vite + React + Tailwind CSS project structure within the workspace.
- Creating components for Map tracking, History playback, and Alert notification feeds.

### Out of Scope
- Native push notifications (SMS, Email, APNS/FCM).
- Complex polygonal geofences (scoped to circular or rectangular/bounding-box boundaries for MVP simplicity).
- Driver behavior scoring algorithms beyond simple overspeeding.

---

## 4. Technical Constraints

- **Single Database Connection**: Leverage the existing PostgreSQL database schema.
- **Runtime Agnostic**: The SSE broadcast mechanism must work across both Node.js (`@hono/node-server`) and Cloudflare Workers.
- **Offline / Local Capabilities**: Frontend development server must run locally using Vite.
