import express from "express";
import { fetchDiagnoses } from "@/03api/diagnoses.api.js";

const router = express.Router();

router.use((_req, _res, next) => {
  /* #swagger.tags = ['Diagnoses'] */
  next();
});

router.get("/", async (_req, res) => {
  try {
    const data = await fetchDiagnoses();
    console.debug("Fetched diagnoses:", data);
    res.json(data);
  } catch (err: any) {
    console.error("Error fetching diagnoses:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
