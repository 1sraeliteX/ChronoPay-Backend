import request from "supertest";
import app from "../index.js";
import { slotService } from "../services/slotService.js";

describe("ChronoPay API", () => {
  beforeEach(() => {
    slotService.reset();
  });

  it("GET /health returns 200 and status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("chronopay-backend");
  });

  it("GET /api/v1/slots returns slots array", async () => {
    const res = await request(app).get("/api/v1/slots");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.slots)).toBe(true);
    expect(res.body.meta.cache).toBe("miss");
  });
});
