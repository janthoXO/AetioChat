import express from "express";

const router = express.Router();

router.use((_req, _res, next) => {
  /* #swagger.tags = ['Users'] */
  next();
});

router.post("/login", async (req, res) => {});

export default router;
