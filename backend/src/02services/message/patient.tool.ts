import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getLLM } from "@/02services/llm.service.js";
import type { Anamnesis } from "@/02models/Anamnesis.js";
import type { Patient } from "@/02models/Patient.js";
import type { ChiefComplaint } from "@/02models/ChiefComplaint.js";

export function buildPatientTool(
  patient: Patient,
  chiefComplaint: ChiefComplaint,
  anamnesis: Anamnesis
) {
  return tool(
    async ({ question }) => {
      const prompt = `You are a patient in a medical training simulator.
A medical student is asking you a question. Answer ONLY as the patient — never break character.

=== YOUR IDENTITY ===
${JSON.stringify(patient, null, 2)}

=== CHIEF COMPLAINT ===
${chiefComplaint}

=== YOUR HISTORY & SYMPTOMS ===
${JSON.stringify(anamnesis, null, 2)}
================================

RULES:
1. Speak in first person ("I feel...", "My...") matching your age and background.
2. Use layman's terms — never medical jargon.
3. Answer ONLY what the student asked. Do not volunteer your full history unprompted.
4. If asked about a symptom not in your history, say you don't experience that.
5. Show realistic emotion: worry, confusion, relief — whatever fits.
6. Never name or hint at the diagnosis, even if you suspect it.

Student's question: "${question}"`;

      return getLLM()
        .withConfig({ runName: "patient_model" })
        .invoke(prompt)
        .then((r) => r.text);
    },
    {
      name: "ask_patient",
      description: `Ask the patient a question about their symptoms, medical history, lifestyle,
family history, chief complaint, or anything a doctor would ask during a clinical interview.
Use this for ALL conversational messages directed at the patient.`,
      schema: z.object({
        question: z.string().describe("The question to ask the patient"),
      }),
      returnDirect: true,
    }
  );
}
