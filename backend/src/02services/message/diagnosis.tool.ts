import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getLLM } from "@/02services/llm.service.js";
import type { Diagnosis } from "@/02models/Diagnosis.js";

export function buildDiagnosisTool(
  actualDiagnosis: Diagnosis,
  setSolved: (solved: boolean) => void
) {
  return tool(
    async ({ proposedDiagnosis }) => {
      const prompt = `You are an Attending Physician evaluating a medical student's proposed diagnosis.

=== ACTUAL DIAGNOSIS (CONFIDENTIAL) ===
${actualDiagnosis.name}
========================================

EVALUATION STATES:
- CORRECT   → The proposed diagnosis matches exactly or is a valid equivalent.
- PARTIAL   → The student is on the right track but needs more specificity.
- INCORRECT → The proposed diagnosis is wrong.

INSTRUCTIONS:
1. Think in <reasoning>...</reasoning> tags:
   - Determine which state applies.
   - If CORRECT, write the exact token [SOLVED] inside the reasoning tags.
2. After </reasoning>, write your feedback to the student (2–4 sentences):
   - CORRECT   → Congratulate them and briefly affirm their reasoning.
   - PARTIAL   → Acknowledge they're close, ask them to be more specific. 
                 Do NOT reveal the actual diagnosis.
   - INCORRECT → Tell them it's not correct. Give one small directional hint
                 without naming the condition.

Maintain the tone of a supportive attending, not a harsh examiner.
Never reveal the exact diagnosis name for PARTIAL or INCORRECT.

Student's proposed diagnosis: "${proposedDiagnosis}"`;

      const result = await getLLM()
        .withConfig({ runName: "medical_evaluator" })
        .invoke(prompt);

      // [SOLVED] is in the raw (unfiltered) text — the XMLReasoningFilter in
      // agent.service.ts strips it from the stream before the student sees it,
      // but we still need to act on it here after the full response is available.
      if (result.text.includes("[SOLVED]")) {
        setSolved(true);
      }

      return result.text;
    },
    {
      name: "make_diagnosis",
      description: `Submit a final diagnosis for the patient.
Use this ONLY when the student explicitly commits to a diagnosis with phrases like:
"My diagnosis is...", "I think this is...", "The patient has...", "This is a case of...".
Do NOT use this for exploratory questions like "could this be...?" — those go to ask_patient.`,
      schema: z.object({
        proposedDiagnosis: z
          .string()
          .describe("The student's proposed diagnosis"),
      }),
      returnDirect: true,
    }
  );
}
