import express from "express";
import { fetchProcedures } from "@/03api/procedures.api.js";
import { procedureToDTO } from "@/01dto/Procedure.dto.js";

const router = express.Router();

router.use((_req, _res, next) => {
  /* #swagger.tags = ['Procedures'] */
  next();
});

router.get("/", async (_req, res) => {
  try {
    const data = await fetchProcedures();
    console.debug(`Fetched ${data.length} procedures`);

    res.json(data.map(procedureToDTO));
  } catch (err) {
    console.error("Error fetching procedures:", err);

    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
      return;
    }

    res.status(500).json({ error: "Unknown error" });
  }
});

export default router;
