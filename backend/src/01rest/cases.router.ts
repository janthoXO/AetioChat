import express from "express";
import { MessageDTOSchema } from "@/01dto/Message.dto.js";
import { casesService } from "@/02services/cases.service.js";
import { caseSse } from "@/02services/case.sse.js";
import { messageSse } from "@/02services/message.sse.js";
import { messagesRepo } from "@/03db/repos/messages.repo.js";
import { authMiddleware } from "./auth.middleware.js";
import type { Request } from "express";
import { handleMessage } from "@/02services/message/message.service.js";

// Ensure AuthRequest is defined here if it wasn't exported properly
interface AuthRequest extends Request {
  userId?: string;
}

const router = express.Router();

router.use((_req, _res, next) => {
  /* #swagger.tags = ['Cases'] */
  next();
});

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const data = await casesService.getUserCases(req.userId);
    res.json(data);
  } catch (err) {
    console.error("Error fetching cases:", err);

    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Unknown error" });
  }
});

router.post("/generate", authMiddleware, async (_req: AuthRequest, res) => {
  try {
    const newCase = await casesService.generateCase();
    res.json(newCase);
  } catch (err) {
    console.error("Error generating case:", err);

    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Unknown error" });
  }
});

router.get("/events", async (_, res) => {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    caseSse.subscribeToGeneration(res);
  } catch (err) {
    console.error("SSE /events Auth Error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

router.get(
  "/:caseId/messages",
  authMiddleware,
  async (req: AuthRequest, res) => {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      const msgs = await messagesRepo.findByCaseAndUser(
        req.params.caseId as string,
        req.userId
      );
      res.json(msgs);
    } catch (err) {
      console.error("Error fetching messages:", err);
      if (err instanceof Error) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: "Unknown error" });
    }
  }
);

router.get("/:caseId/messages/events", (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Add to active clients
    messageSse.subscribeToCaseMessages(
      userId,
      req.params.caseId as string,
      res
    );

    // Initial ping
    res.write(`data: ${JSON.stringify({ type: "ping" })}\n\n`);
  } catch (err) {
    console.error("SSE /:caseId/messages/events Auth Error:", err);
    res.status(401).end();
  }
});

router.post(
  "/:caseId/message",
  authMiddleware,
  async (req: AuthRequest, res) => {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const bodyResult = MessageDTOSchema.pick({ content: true }).safeParse(
      req.body
    );
    if (!bodyResult.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }

    try {
      const caseId = req.params.caseId as string;
      // 1. Assign to user if first time
      await casesService.assignCaseToUser(req.userId, caseId);

      // 2. Save user message immediately to DB
      await messagesRepo.create({
        userId: req.userId,
        caseId,
        role: "user",
        content: bodyResult.data.content,
      });

      // 3. Return 200 immediately to UI before LLM completes
      res.status(200).json({ status: "processing" });

      // 4. Trigger ASYNC agent response
      handleMessage(req.userId, caseId, bodyResult.data.content).catch((e) =>
        console.error("Agent failed:", e)
      );
    } catch (err) {
      console.error("Error handling message:", err);
      if (err instanceof Error) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: "Unknown error" });
    }
  }
);

export default router;
