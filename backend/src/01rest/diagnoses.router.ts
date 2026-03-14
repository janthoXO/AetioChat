import express from "express";

const router = express.Router();

router.use((_req, _res, next) => {
  /* #swagger.tags = ['Diagnoses'] */
  next();
});

router.get("/", async (req, res) => {});

export default router;
