# Switch from SQLite to PostgreSQL

SQLite's single-writer lock causes concurrency failures under simultaneous connections — a problem as soon as more than one process touches the database at once (e.g. the dev server and a test run, or future multi-process deployments). We switched to PostgreSQL, which handles concurrent readers and writers natively.

The main trade-off is operational overhead: Postgres requires a running server rather than a file. We absorb this locally via Docker Compose (`docker compose up -d`), keeping setup reproducible without a system-level install.

## Considered Options

- **Keep SQLite** — zero ops cost, but write contention is a hard limit of the engine, not something we can tune away.
- **SQLite with WAL mode** — improves read concurrency but still serialises all writes; not a real fix.

## Consequences

- `@prisma/adapter-better-sqlite3` is removed; `PrismaClient` uses the built-in Postgres connector with no driver adapter.
- `better-auth` is reconfigured with `provider: 'postgresql'`.
- Tests run against a separate `myhours_test` database (same Docker Compose instance) to avoid wiping dev data. `DATABASE_URL` for tests is set in `.env.test`.
