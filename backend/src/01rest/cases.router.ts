import express from "express";
import { MessageDTOSchema, type MessageDTO } from "@/01dto/message.js";

const router = express.Router();

router.use((_req, _res, next) => {
  /* #swagger.tags = ['Cases'] */
  next();
});

router.get("/", async (_req, res) => {});

router.post("/generate", async (req, res) => {
});

router.post(
  "/:caseId/message",
  async (req: express.Request<MessageDTO>, res) => {
    const bodyResult = MessageDTOSchema.safeParse(req.body);

    if (!bodyResult.success) {
      res.status(400).json({
        error: {
          code: "INVALID_REQUEST_BODY",
          message: "Invalid request body",
          details: JSON.stringify(bodyResult.error.issues),
        },
      });
      return;
    }

    const message = bodyResult.data;


    res.status(200).json();
  }
);

export default router;
