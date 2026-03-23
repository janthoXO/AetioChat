import express from "express";
import { fetchProcedures } from "@/03api/procedures.api.js";

const router = express.Router();

router.use((_req, _res, next) => {
  /* #swagger.tags = ['Procedures'] */
  next();
});

router.get("/", async (_req, res) => {
  try {
    const data = await fetchProcedures();
    console.debug("Fetched procedures:", data);
    res.json(data);
  } catch (err: any) {
    console.error("Error fetching procedures:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
