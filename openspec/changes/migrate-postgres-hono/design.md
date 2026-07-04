## Context

The current fleet tracking application uses Express.js and `better-sqlite3` with a local SQLite database (`sqlite.db`). It serves static files from `public/` and exposes REST API endpoints:
- `POST /api/locations`
- `GET /api/vehicles`
- `GET /api/vehicles/:id/history`

Deploying to Cloudflare Workers requires a serverless runtime (V8 isolate), meaning native binary packages like `better-sqlite3` and filesystem operations are not supported. We need to migrate the database to PostgreSQL (hosted on Neon Tech or locally on-premise) and change the framework to Hono to achieve environment-agnostic deployment.

## Goals / Non-Goals

**Goals:**
- Enable deployment of the fleet tracking application to Cloudflare Workers.
- Support deploying the same application code to on-premise Node.js servers.
- Migrate database engine from SQLite to PostgreSQL.
- Keep the REST API routes and business logic 100% compatible.
- Support serving static frontend dashboard assets in both environments.

**Non-Goals:**
- Rewrite the frontend dashboard (remains vanilla JS/HTML).
- Introduce new REST API endpoints.

## Decisions

### 1. Web Framework: Hono instead of Express.js
- **Decision**: Replace `express` with `hono` and run it on-premise via `@hono/node-server`.
- **Rationale**: Express has extensive dependencies on Node.js core APIs which are not natively supported in serverless V8 runtimes without large wrappers. Hono is specifically designed for Cloudflare Workers, Node.js, and standard Web APIs. Using `@hono/node-server` allows the exact same routing logic to run on Node.js (on-premise) with zero code modifications.
- **Alternative considered**: Keeping Express and using `@cloudflare/node-compat`. *Rejected* because compatibility shim increases bundle size and is prone to runtime errors in pure V8 isolates.

### 2. Database Connection Abstraction
- **Decision**: Implement a database adapter function `getDb(env)` that dynamically instantiates the correct Drizzle DB driver based on the environment.
  - In a Node.js (on-premise) environment: Use `drizzle-orm/node-postgres` with `pg` (TCP pool).
  - In a Cloudflare Workers environment: Use `drizzle-orm/neon-http` with `@neondatabase/serverless` for fast serverless queries over HTTP/Websockets.
- **Rationale**: Since Cloudflare Workers does not support persistent TCP pools natively (without Hyperdrive), Neon HTTP driver is significantly faster. On-premise installations, however, require standard TCP pools (`pg` client). By abstracting `getDb(env)`, we use a single `DATABASE_URL` connection string in both setups.
- **Alternative considered**: Using standard `pg` over Websockets everywhere. *Rejected* because HTTP connections are faster and more reliable in short-lived serverless functions.

### 3. Static File Serving
- **Decision**: 
  - On-premise: Serve files from the `public/` folder using Hono's Node.js static serving middleware (`@hono/node-server/serve-static`).
  - Cloudflare Workers: Serve files using Cloudflare Pages / Workers Assets.
- **Rationale**: Minimizes dependencies and leverages the optimal CDN delivery platform for each target environment.

## Risks / Trade-offs

- **[Risk]** PostgreSQL schema differences → SQLite uses integers for dates/timestamps, whereas PostgreSQL supports native `timestamp` types. Drizzle Core definitions must be updated to `timestamp` or `timestamp(3)`.
  - *Mitigation*: Re-create and test Drizzle schema definitions and migrations specifically for PostgreSQL dialect.
- **[Risk]** Neon connection limits on spikes → If deployed on serverless without pooling, Postgres connection exhaustion may occur.
  - *Mitigation*: Neon HTTP client runs over REST (stateless) which inherently avoids connection exhaustion, and Hyperdrive can be configured for Cloudflare Workers.
