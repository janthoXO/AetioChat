import { z } from "zod/v4";
import { AnamnesisSchema } from "./Anamnesis.js";
import { ChiefComplaintSchema } from "./ChiefComplaint.js";
import { ProcedureSchema } from "./Procedure.js";
import { DiagnosisSchema } from "./Diagnosis.js";

/**
 * Zod schema for a complete medical case
 */
export const CaseSchema = z.object({
  diagnosis: DiagnosisSchema,
  chiefComplaint: ChiefComplaintSchema,
  anamnesis: AnamnesisSchema,
  procedures: z.array(ProcedureSchema),
});

export type Case = z.infer<typeof CaseSchema>;
