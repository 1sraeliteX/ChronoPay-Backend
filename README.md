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

| Script   | Description                    |
|----------|--------------------------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run production server         |
| `npm run dev`   | Run dev server with tsx watch  |
| `npm test`      | Run Jest tests                 |

## API (stub)

- `GET /health` — Health check; returns `{ status: "ok", service: "chronopay-backend" }`
- `GET /api/v1/slots` — List time slots (currently returns empty array)

## Rate Limiting

All API endpoints are protected by per-IP rate limiting using
[`express-rate-limit`](https://github.com/express-rate-limit/express-rate-limit).

### Default behavior

| Setting       | Default    | Description                                     |
|---------------|------------|-------------------------------------------------|
| Window        | 15 minutes | Rolling time window per IP address              |
| Max requests  | 100        | Maximum requests allowed within the window      |
| Response code | `429`      | HTTP status returned when limit is exceeded     |

### Configuration

Override defaults with environment variables:

| Variable               | Description                             | Example         |
|------------------------|-----------------------------------------|-----------------|
| `RATE_LIMIT_WINDOW_MS` | Window duration in milliseconds         | `900000` (15 m) |
| `RATE_LIMIT_MAX`       | Max requests per window per IP          | `100`           |

### 429 response format

When the rate limit is exceeded the API returns the standard error envelope:

```json
{
  "success": false,
  "error": "Too many requests, please try again later."
}
```

### Headers

All responses include a `RateLimit` header (RFC draft-7 combined format) that
exposes the current limit, remaining count, and reset time. Legacy
`X-RateLimit-*` headers are disabled.

### Trust proxy (production deployments)

When the API runs behind a reverse proxy (Nginx, a load balancer, cloud
gateway), set `TRUST_PROXY=true` in your environment. Without it, Express reads
`req.ip` from the TCP socket — which will be the proxy's address — causing all
clients to share a single rate-limit counter.

Do **not** set `TRUST_PROXY=true` when the API is directly internet-exposed
without a proxy: clients could spoof `X-Forwarded-For` and bypass per-IP
rate limiting.

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
