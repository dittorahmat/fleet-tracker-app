# Project Style Guide & Conventions

This project is a Serverless-ready Fleet Tracking Application. All coding agents collaborating on this workspace MUST follow these rules and conventions.

## 1. Tech Stack Overview

- **Backend**: Hono (run via `tsx` on Node.js locally, deployable to Cloudflare Workers).
- **Database**: PostgreSQL (Neon Tech or on-premise) with **Drizzle ORM**.
- **Frontend**: Single-Page App (SPA) built with React, Vite, Tailwind CSS v4, and Leaflet Maps.
- **Testing**: Vitest for unit and integration testing.
- **Language**: TypeScript (strict mode) is used across both frontend and backend.

---

## 2. Rules & Coding Conventions

### A. TypeScript & Code Style
- Always write code in TypeScript.
- Strictly avoid `any` types where possible. Use explicit interface definitions for data structures (`Vehicle`, `LocationTelemetry`, `Geofence`, `Alert`).
- Keep function signatures fully typed.
- Run `npm run type-check` (both at root and in `./frontend`) to verify type safety before completing tasks.
- Keep linter clean by running `npm run lint` in `./frontend`.

### B. Database & Drizzle ORM
- Database schemas reside in [db/schema.ts](file:///C:/backup/fleet-tracking-app/db/schema.ts).
- For any schema changes:
  1. Modify `db/schema.ts`.
  2. Generate migration scripts using `npx drizzle-kit generate`.
  3. Apply migration to the database using `npm run db:push`.
- Never modify files in `db/migrations/` manually.

### C. Backend Telemetry & Alerts
- Standard location logs ingestion endpoint is `POST /api/locations`.
- The alerting logic is contained in [db/alertsEngine.ts](file:///C:/backup/fleet-tracking-app/db/alertsEngine.ts). Any updates to speeding limits or geofence boundary transition rules must be refactored there.
- SSE broadcast is handled in [db/sseManager.ts](file:///C:/backup/fleet-tracking-app/db/sseManager.ts) and exposed via `GET /api/stream`.

### D. Testing & Quality Assurance
- Tests are written using **Vitest** and located in `*.test.ts` files.
- Always run the test suite with `npm run test` after any modifications to the backend utility or engine files.
- If you add new core utilities or alerts engine logic, you **MUST** create a corresponding unit test file.

### E. Frontend Development
- Frontend source files are located in the [frontend/](file:///C:/backup/fleet-tracking-app/frontend) directory.
- Styles are handled using Tailwind CSS v4 (`@import "tailwindcss";` in `index.css`). Avoid adding custom Vanilla CSS classes unless strictly necessary.
- Leaflet map rendering must use `react-leaflet` components.
- Always build the production bundle (`npm run build` in `frontend/` directory) before ending your work, so the built assets are copied to `./public/` for Hono static file serving.
