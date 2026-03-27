# chronopay-backend

API backend for **ChronoPay** — time tokenization and scheduling marketplace on Stellar.

## What's in this repo

- **Express** API with TypeScript
- Health and stub API routes (e.g. `/api/v1/slots`)
- Ready for Stellar Horizon integration, token service, and scheduling logic

## Prerequisites

- Node.js 20+
- npm

## Setup

```bash
# Clone the repo (or use your fork)
git clone <repo-url>
cd chronopay-backend

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Start dev server (with hot reload)
npm run dev

# Start production server
npm run start
```

## Scripts

| Script                      | Description                          |
|-----------------------------|--------------------------------------|
| `npm run build`             | Compile TypeScript to `dist/`        |
| `npm run start`             | Run production server                |
| `npm run dev`               | Run dev server with tsx watch        |
| `npm test`                  | Run Jest tests                       |
| `npm run migrate status`    | Show which migrations are applied    |
| `npm run migrate validate`  | Validate migration definitions       |
| `npm run migrate up`        | Apply all pending migrations         |
| `npm run migrate up <n>`    | Apply next n pending migrations      |
| `npm run migrate down`      | Roll back the most recent migration  |
| `npm run migrate down <n>`  | Roll back the last n migrations      |

## Database Migrations

ChronoPay uses a custom migration framework built on top of PostgreSQL (`pg`).

### Environment

Copy `.env.example` to `.env` and set `DATABASE_URL`:

```bash
cp .env.example .env
# Edit .env and set DATABASE_URL=postgresql://user:password@localhost:5432/chronopay
```

### Running migrations

```bash
# Check which migrations have been applied
npm run migrate status

# Validate migration definitions (no DB required)
npm run migrate validate

# Apply all pending migrations
npm run migrate up

# Apply next 1 pending migration only
npm run migrate up 1

# Roll back the most recently applied migration
npm run migrate down

# Roll back the last 2 migrations
npm run migrate down 2
```

### Architecture

```
src/db/
├── connection.ts          # pg.Pool singleton + withTransaction helper
├── migrationRepository.ts # CRUD on schema_migrations tracking table
├── migrationRunner.ts     # Core engine: up / down / status / validate
└── migrations/
    ├── index.ts           # Ordered migration registry
    ├── 001_create_users_table.ts
    └── 002_create_slots_table.ts
src/scripts/
└── migrate.ts             # CLI entry point
```

### Adding a new migration

1. Create `src/db/migrations/NNN_describe_change.ts` implementing the `Migration` interface:

```typescript
import { Migration } from "../migrationRunner.js";

export const migration: Migration = {
  id: "003",
  name: "add_timezone_to_users",
  async up(client) {
    await client.query(`ALTER TABLE users ADD COLUMN timezone VARCHAR(64)`);
  },
  async down(client) {
    await client.query(`ALTER TABLE users DROP COLUMN timezone`);
  },
};
```

2. Register it in `src/db/migrations/index.ts` (append to the array in order).

### Design principles

- **Stop on first failure** — a broken migration halts the run; subsequent migrations are never attempted.
- **Transactional** — each migration's SQL changes and the tracking record update share a single transaction; a partial failure is fully rolled back.
- **Idempotent bootstrap** — `schema_migrations` is created with `CREATE TABLE IF NOT EXISTS`, so running migrations against a fresh database always works.
- **Duplicate-ID guard** — the migration registry throws at module load time if two migrations share the same `id`.

## API (stub)

- `GET /health` — Health check; returns `{ status: "ok", service: "chronopay-backend" }`
- `GET /api/v1/slots` — List time slots (currently returns empty array)

## Contributing

1. Fork the repo and create a branch from `main`.
2. Install deps and run tests: `npm install && npm test`.
3. Make changes; keep the build passing: `npm run build`.
4. Open a pull request. CI must pass (install, build, test).

## CI/CD

On every push and pull request to `main`, GitHub Actions runs:

- **Install**: `npm ci`
- **Build**: `npm run build`
- **Tests**: `npm test`

## License

MIT
