import express from "express";
import cors from "cors";
import { validateRequiredFields } from "./middleware/validation.js";
import {
  SLOT_LIST_CACHE_KEY,
  SLOT_LIST_CACHE_TTL_MS,
  SlotValidationError,
  slotService,
} from "./services/slotService.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "chronopay-backend" });
});

app.get("/api/v1/slots", async (_req, res) => {
  const result = await slotService.listSlots();

  // Slot availability is dynamic, so only the backend cache is allowed to retain it.
  res.set("Cache-Control", "no-store");
  res.set("X-Cache", result.cache);

  res.json({
    slots: result.slots,
    meta: {
      cache: result.cache,
      ttlMs: SLOT_LIST_CACHE_TTL_MS,
    },
  });
});

app.post(
  "/api/v1/slots",
  validateRequiredFields(["professional", "startTime", "endTime"]),
  (req, res) => {
    try {
      const slot = slotService.createSlot(req.body);

      res.set("Cache-Control", "no-store");
      res.status(201).json({
        success: true,
        slot,
        meta: {
          invalidatedKeys: [SLOT_LIST_CACHE_KEY],
        },
      });
    } catch (error) {
      if (error instanceof SlotValidationError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: "Slot creation failed",
      });
    }
  },
);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`ChronoPay API listening on http://localhost:${PORT}`);
  });
}

export default app;
