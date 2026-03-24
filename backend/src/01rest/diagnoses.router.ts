import express from "express";
import { fetchDiagnoses } from "@/03api/diagnoses.api.js";
import { diagnosisToDTO } from "@/01dto/Diagnosis.dto.js";

const router = express.Router();

router.use((_req, _res, next) => {
  /* #swagger.tags = ['Diagnoses'] */
  next();
});

router.get("/", async (_req, res) => {
  try {
    const data = await fetchDiagnoses();
    console.debug(`Fetched ${data.length} diagnoses`);

    res.json(data.map(diagnosisToDTO));
  } catch (err) {
    console.error("Error fetching diagnoses:", err);
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Unknown error" });
  }
});

export default router;
