import express from "express";
import jwt from "jsonwebtoken";
import { MessageDTOSchema } from "@/01dto/message.js";
import { casesService } from "@/02services/cases.service.js";
import { sseService } from "@/02services/sse.service.js";
import { messagesRepo } from "@/03db/repos/messages.repo.js";
import { authMiddleware } from "./auth.middleware.js";
import type { Request } from "express";
import { config } from "@/config.js";
import { agentService } from "@/02services/agent.service.js";

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
  if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const data = await casesService.getUserCases(req.userId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/generate", authMiddleware, async (_req: AuthRequest, res) => {
  try {
    const newCase = await casesService.generateCase();
    res.json({
      id: newCase.id,
      chiefComplaint: newCase.chiefComplaint,
      startedAt: undefined,
      completed: false,
    });
  } catch (err: any) {
    console.error("Error generating case:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:caseId/messages", authMiddleware, async (req: AuthRequest, res) => {
  if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const msgs = await messagesRepo.findByCaseAndUser(req.params.caseId as string, req.userId);
    res.json(msgs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:caseId/events", (req, res) => {
  // SSE uses query param for auth due to EventSource limitations
  const token = req.query.token as string;
  if (!token) { res.status(401).end(); return; }

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Add to active clients
    sseService.addClient(req.params.caseId as string, payload.userId, res);

    // Initial ping
    res.write("data: {\"type\": \"ping\"}\n\n");
  } catch {
    res.status(401).end();
  }
});

router.post("/:caseId/message", authMiddleware, async (req: AuthRequest, res) => {
  if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const bodyResult = MessageDTOSchema.safeParse(req.body);
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
    agentService.handleMessage(req.userId, caseId, bodyResult.data.content)
      .catch(e => console.error("Agent failed:", e));

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
