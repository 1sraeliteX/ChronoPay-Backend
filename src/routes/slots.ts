import { Router } from "express";
import { validateRequiredFields } from "../middleware/validation.js";

const router = Router();

/**
 * @openapi
 * /api/v1/slots:
 *   get:
 *     summary: Get all available slots
 *     responses:
 *       200:
 *         description: A list of slots
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 slots:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/", (_req, res) => {
  res.json({ slots: [] });
});

/**
 * @openapi
 * /api/v1/slots:
 *   post:
 *     summary: Create a new slot
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - professional
 *               - startTime
 *               - endTime
 *             properties:
 *               professional:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Created slot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 slot:
 *                   type: object
 *       400:
 *         description: Bad request
 */
router.post(
  "/",
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

export default router;
