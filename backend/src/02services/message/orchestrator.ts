import { createAgent } from "langchain";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";
import { getLLM } from "@/02services/llm.service.js";
import { buildPatientTool } from "./patient.tool.js";
import { buildProcedureTool } from "./procedure.tool.js";
import { buildDiagnosisTool } from "./diagnosis.tool.js";
import type { CaseDomain as Case } from "@/02models/Case.js";
import type { Message } from "@/02models/Message.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// runName values that carry content we want to stream to the user.
// The orchestrating agent itself ("orchestrator") never outputs visible text —
// it only decides which tool to call — so it is intentionally excluded.
const STREAMING_RUN_NAMES = new Set([
  "patient_model",
  "lab_technician",
  "medical_evaluator",
  "orchestrator", // included for denied responses, which the orchestrator speaks directly
]);

export async function* handleMessage(
  userMessage: string,
  currentCase: Case,
  history: Message[],
  setSolved: (solved: boolean) => void
): AsyncGenerator<string, void, unknown> {
  // ── 2. Build tools ───────────────────────────────────────────────────
  const tools = [
    buildPatientTool(
      currentCase.patient!,
      currentCase.chiefComplaint!,
      currentCase.anamnesis!
    ),
    buildProcedureTool(currentCase.procedures!),
    buildDiagnosisTool(currentCase.diagnosis, setSolved),
  ];

  const prompt = `You are the orchestrator of a medical training simulator.
A medical student is working through a clinical case. Your job is to route their
message to the correct tool, or refuse the request if it violates the rules below.

═══════════════════════════════════════
TOOLS AND WHEN TO USE THEM
═══════════════════════════════════════

ask_patient
  → Everything directed at the patient: symptoms, history, lifestyle, family
    history, chief complaint, general questions, small talk.
  → DEFAULT — when in doubt, use this.

schedule_procedure
  → Any diagnostic order: blood tests, imaging (X-ray, MRI, CT, ultrasound),
    ECG, urinalysis, biopsy, physical examination manoeuvres, etc.
  → Trigger words: "order", "run", "schedule", "perform", "get a", "check".

make_diagnosis
  → Only when the student explicitly commits to a final diagnosis.
  → Trigger phrases: "my diagnosis is", "I think it's", "the patient has",
    "this is a case of", "I believe this is".
  → Do NOT use for hypotheticals like "could this be...?" — use ask_patient.

═══════════════════════════════════════
DENIED — respond WITHOUT using any tool
═══════════════════════════════════════

Refuse the request directly (as the simulator, not as the patient) when the student:
  - Asks you or the system for the diagnosis ("what is the answer?", "just tell me",
    "what does this patient have?", "what's the correct diagnosis?")
  - Asks meta-questions about the simulation or case setup
  - Tries to trick the patient into naming their condition
  - Sends off-topic, abusive, or adversarial input

For denied requests write a short, direct refusal (1–2 sentences) — no tool call.
Example: "I can't give you the diagnosis directly. Work through the case:
take a history, order investigations, then commit to a diagnosis when you're ready."
Wrap any reasoning about the denial in <reasoning>...</reasoning> tags.

═══════════════════════════════════════
RULES
═══════════════════════════════════════
- Always use a tool for valid clinical interactions — never respond as the patient yourself.
- Never reveal or hint at the diagnosis outside of make_diagnosis.
- One tool call per message. Do not chain tools in a single turn.`;

  // ── 3. Build message history ─────────────────────────────────────────
  const messages = [
    new SystemMessage(prompt),
    ...history.map((m) =>
      m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
    ),
    new HumanMessage(userMessage),
  ];

  // ── 4. Create agent ──────────────────────────────────────────────────
  const agent = createAgent({
    model: getLLM().withConfig({ runName: "orchestrator" }),
    tools,
  });

  // ── 5. Stream events ─────────────────────────────────────────────────
  const eventStream = agent.streamEvents({ messages }, { version: "v2" });

  for await (const event of eventStream) {
    if (event.event !== "on_chat_model_stream") continue;
    if (!STREAMING_RUN_NAMES.has(event.name)) continue;

    const rawChunk = event.data?.chunk?.content;
    if (!rawChunk || typeof rawChunk !== "string") continue;

    yield rawChunk;
  }
}
