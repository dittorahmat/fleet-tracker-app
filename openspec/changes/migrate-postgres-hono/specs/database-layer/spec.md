## ADDED Requirements

### Requirement: Database Driver Resolution
The database layer SHALL dynamically resolve the correct PostgreSQL connection method (HTTP Client or TCP connection pool) based on the target runtime.

#### Scenario: Running on Cloudflare Worker
- **WHEN** in a Cloudflare Worker environment
- **THEN** it SHALL initialize the database using the Neon serverless HTTP client and binding credentials

#### Scenario: Running on On-Premise Node.js
- **WHEN** in a standard Node.js environment
- **THEN** it SHALL initialize the database using a standard `pg` TCP pool with the connection string

### Requirement: Schema Compatibility
The database schema SHALL define the `vehicles` and `location_logs` relations using PostgreSQL-compatible syntax with proper types.

#### Scenario: Migrate database
- **WHEN** running Drizzle migration push
- **THEN** the schema MUST create tables with equivalent constraints as the previous SQLite implementation (e.g. `vehicles.id` as primary key, `location_logs.vehicleId` as reference)
