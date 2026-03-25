import express from "express";
import cors from "cors";
import { validateRequiredFields } from "./middleware/validation";
import rateLimiter from "./middleware/rateLimiter.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

// Enable trust proxy when running behind a reverse proxy (e.g. Nginx, cloud LB).
// This makes Express read req.ip from X-Forwarded-For so the rate limiter tracks
// the real client IP instead of the proxy's address.
// Do NOT enable when the API is directly internet-exposed without a proxy —
// clients could spoof X-Forwarded-For to bypass per-IP rate limiting.
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

// Middleware chain (order matters):
// cors         — must be first so 429 responses include CORS headers (browsers need them)
// json         — parse request bodies before any handler runs
// rateLimiter  — block over-limit IPs before reaching route handlers
app.use(cors());
app.use(express.json());
app.use(rateLimiter);

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: { title: "ChronoPay API", version: "1.0.0" },
  },
  apis: ["./src/routes/*.ts"], // adjust if needed
};

const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "chronopay-backend" });
});

app.get("/api/v1/slots", (_req, res) => {
  res.json({ slots: [] });
});

app.post(
  "/api/v1/slots",
  validateRequiredFields(["professional", "startTime", "endTime"]),
  (req, res) => {
    const { professional, startTime, endTime } = req.body;

    res.status(201).json({
      success: true,
      slot: {
        id: 1,
        professional,
        startTime,
        endTime,
      },
    });
  },
);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`ChronoPay API listening on http://localhost:${PORT}`);
  });
}

export default app;
