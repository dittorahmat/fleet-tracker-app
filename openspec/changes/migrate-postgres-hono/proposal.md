## Why

The current application uses Express.js and local SQLite via `better-sqlite3`, which cannot be deployed natively on Cloudflare Workers due to dependencies on Node.js-specific C++ native binaries and filesystem access. Moving to PostgreSQL (hosted on Neon Tech) and Hono allows the application to run serverless on Cloudflare Workers while remaining 100% compatible with an on-premise Node.js deployment.

## What Changes

- **Framework Migration**: Migrate from Express.js to Hono for cross-runtime capability (Cloudflare Workers, Node.js, Bun, etc.).
- **Database Engine Migration**: Migrate from local SQLite (`better-sqlite3`) to PostgreSQL (Neon Tech / general Postgres).
- **ORM Configuration**: Update Drizzle ORM configuration and schemas to target PostgreSQL (`pg-core` instead of `sqlite-core`).
- **Environment Management**: Implement runtime-agnostic environment variable resolution for `DATABASE_URL` and port configurations.
- **Project Structure**: Create entrypoints for both Cloudflare Workers (`index.js`) and Node.js (`server.js`).

## Capabilities

### New Capabilities
- `api-gateway`: A Hono-based routing gateway capable of handling HTTP requests and serving static assets in both Cloudflare Workers and Node.js environments.
- `database-layer`: A PostgreSQL database connection abstraction and Drizzle schemas that dynamically resolve the appropriate driver depending on the running runtime.

### Modified Capabilities
<!-- None -->

## Impact

- **Database**: Local SQLite database `sqlite.db` will be replaced by a PostgreSQL instance (Neon Tech in production, Neon/local Postgres in development).
- **Express App**: `index.js` will be refactored to use Hono.
- **Entrypoints**: A new `server.js` will be introduced for Node.js (on-premise) deployment.
- **Configuration**: `package.json` scripts and dependencies will change. A `wrangler.toml` file will be added for Cloudflare Worker deployment.
- **ORM migrations**: Drizzle schema and migrations will be recreated for PostgreSQL.
