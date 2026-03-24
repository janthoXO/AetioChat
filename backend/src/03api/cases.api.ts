import { AnamnesisSchema } from "@/02models/Anamnesis.js";
import { ChiefComplaintSchema } from "@/02models/ChiefComplaint.js";
import type { Diagnosis } from "@/02models/Diagnosis.js";
import { PatientSchema } from "@/02models/Patient.js";
import { ProcedureWithRelevanceSchema } from "@/02models/Procedure.js";
import { config } from "@/config.js";
import z from "zod";

const CaseGenerationDTOSchema = z.object({
  patient: PatientSchema,
  chiefComplaint: ChiefComplaintSchema,
  anamnesis: AnamnesisSchema,
  procedures: z.array(ProcedureWithRelevanceSchema),
});

type CaseGenerationDTO = z.infer<typeof CaseGenerationDTOSchema>;

export async function generateCase(
  diagnosis: Diagnosis
): Promise<CaseGenerationDTO> {
  const res = await fetch(`${config.GENERATOR_URL}/cases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      diagnosis: diagnosis.name,
      icd: diagnosis.icd,
    }),
  });
  if (!res.ok) throw new Error("Failed to fetch case");

  return CaseGenerationDTOSchema.parse(await res.json());
}
