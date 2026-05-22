# Replace Drizzle ORM with Prisma

`drizzle-orm` was still in 0.x/beta at the time of adoption and had known security vulnerabilities. We switched to Prisma, which is stable, widely used, and has a mature ecosystem. The main trade-off is losing Drizzle's lightweight feel and SQL-close query syntax; Prisma's generated client is heavier but the stability and security guarantees are worth it for a production-bound app.

## Consequences

- Query functions in `src/db/` accept a `PrismaClient` parameter (injection pattern) rather than a module-level singleton, preserving testability with per-test isolated SQLite files.
- better-auth uses `prismaAdapter` instead of `drizzleAdapter`.
- Prisma requires a file-based SQLite for tests; in-memory SQLite is not supported.
