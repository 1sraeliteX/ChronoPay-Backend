import request from "supertest";
import app from "../index.js";
import { slotService } from "../services/slotService.js";

describe("Input validation middleware", () => {
  beforeEach(() => {
    slotService.reset();
  });

  it("should allow valid slot creation", async () => {
    const res = await request(app).post("/api/v1/slots").send({
      professional: "alice",
      startTime: 1000,
      endTime: 2000,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.meta.invalidatedKeys).toContain("slots:list:all");
  });

  it("should reject missing professional", async () => {
    const res = await request(app).post("/api/v1/slots").send({
      startTime: 1000,
      endTime: 2000,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject missing startTime", async () => {
    const res = await request(app).post("/api/v1/slots").send({
      professional: "alice",
      endTime: 2000,
    });

    expect(res.status).toBe(400);
  });

  it("should reject empty values", async () => {
    const res = await request(app).post("/api/v1/slots").send({
      professional: "",
      startTime: 1000,
      endTime: 2000,
    });

    expect(res.status).toBe(400);
  });

  it("should reject reversed time ranges", async () => {
    const res = await request(app).post("/api/v1/slots").send({
      professional: "alice",
      startTime: 2000,
      endTime: 1000,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("endTime must be greater than startTime");
  });
});