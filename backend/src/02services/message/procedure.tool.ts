import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getLLM } from "@/02services/llm.service.js";
import type { ProcedureWithRelevance } from "@/02models/Procedure.js";

function formatProcedures(procedures: ProcedureWithRelevance[]): string {
  if (!procedures.length) return "None defined for this case.";
  return procedures
    .map(
      (p) =>
        `- ${p.name} | relevance: ${p.relevance}` +
        (p.result ? ` | finding: ${p.result}` : "")
    )
    .join("\n");
}

export function buildProcedureTool(procedures: ProcedureWithRelevance[]) {
  return tool(
    async ({ procedureName }) => {
      const prompt = `You are a Lab Technician and Radiology AI in a medical training simulator.
A doctor has ordered a procedure. Return the appropriate finding.

=== PROCEDURE LIST ===
${formatProcedures(procedures)}
======================

INSTRUCTIONS:
1. Think in <reasoning>...</reasoning> tags first:
   - Fuzzy-match the requested procedure to the list above.
     ("CBC" = "complete blood count", "CXR" = "chest X-ray", etc.)
   - If relevance is "high" or "medium" → report the specific finding.
   - If relevance is "low" or no match → report a normal finding for a healthy person.
2. After </reasoning>, write a brief, realistic clinical report (2–5 sentences).
   - State objective findings only. Do NOT name or imply the diagnosis.
   - If abnormal, describe the measurable values, not their clinical meaning.

Requested procedure: "${procedureName}"`;

      return getLLM()
        .withConfig({ runName: "lab_technician" })
        .invoke(prompt)
        .then((r) => r.text);
    },
    {
      name: "schedule_procedure",
      description: `Order a medical procedure, lab test, or imaging study.
Use this when the student orders ANYTHING like: blood test, CBC, X-ray, MRI, CT scan,
ultrasound, ECG, urinalysis, biopsy, or any other diagnostic test or physical examination.`,
      schema: z.object({
        procedureName: z
          .string()
          .describe("The name of the procedure or test being ordered"),
      }),
      returnDirect: true,
    }
  );
}
