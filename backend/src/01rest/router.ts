import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger-output.json" with { type: "json" };
import morgan from "morgan";
import cors from "cors";

import casesRouter from "./cases.router.js";
import usersRouter from "./users.router.js";
import diagnosesRouter from "./diagnoses.router.js";
import proceduresRouter from "./procedures.router.js";
import { authMiddleware } from "./auth.middleware.js";
import { config } from "@/config.js";

export function initRouter(): Promise<void> {
  const app = express();

  app.use(express.json());
  if (config.DEBUG === true) {
    app.use(cors({
      origin: true,
      credentials: true
    }));
    app.use(morgan("dev"));
  }

  const apiRouter = express.Router();

  apiRouter.get("/hello", async (_req, res) => {
    res.status(200).json({ msg: "Hello World" });
  });

  // Public routes
  apiRouter.use("/users", usersRouter);

  // Swagger docs
  apiRouter.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Protected routes
  apiRouter.use("/cases", authMiddleware, casesRouter);
  apiRouter.use("/diagnoses", authMiddleware, diagnosesRouter);
  apiRouter.use("/procedures", authMiddleware, proceduresRouter);

  app.use("/api", apiRouter);
  app.listen(config.PORT, () => {
    console.log(`[REST] Server is running on port ${config.PORT}`);
  });

  return Promise.resolve();
}
