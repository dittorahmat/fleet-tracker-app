## 1. Setup and Dependencies

- [x] 1.1 Install Hono and PostgreSQL dependencies (e.g., `hono`, `@hono/node-server`, `pg`, `@neondatabase/serverless`) and uninstall `express`, `cors`, and `better-sqlite3`.
- [x] 1.2 Add `wrangler.toml` configuration for Cloudflare Workers deployment.
- [x] 1.3 Update `package.json` scripts to support Hono node server (`server.js`) for local/on-premise deployment.

## 2. Database Migration to PostgreSQL

- [x] 2.1 Refactor `db/schema.js` using `drizzle-orm/pg-core` to define tables (`vehicles` and `location_logs`) with PostgreSQL-compatible data types.
- [x] 2.2 Refactor `db/connection.js` to export a runtime-agnostic `getDb(env)` function that chooses the Neon HTTP driver or standard TCP driver based on the environment.
- [x] 2.3 Update `drizzle.config.js` to use the `postgresql` dialect and point to the `DATABASE_URL` connection.
- [x] 2.4 Re-generate Drizzle migrations for PostgreSQL.

## 3. Web API Framework Migration (Express to Hono)

- [x] 3.1 Refactor `index.js` to use Hono router instead of Express, preserving the routing logic and route parameters.
- [x] 3.2 Implement runtime-agnostic static file serving for the `public/` directory (using `@hono/node-server/serve-static` on Node.js).
- [x] 3.3 Create a Node.js entrypoint file `server.js` to bootstrap the Hono app on a local PORT.

## 4. Verification and Testing

- [x] 4.1 Run local development server using Node.js and verify all REST endpoints and telemetry ingestion.
- [x] 4.2 Test the static dashboard interface to verify it correctly fetches vehicle data from Hono endpoints.
