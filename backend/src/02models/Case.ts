import z from "zod";
import { AnamnesisSchema } from "./Anamnesis.js";
import { ChiefComplaintSchema, DiagnosisSchema } from "shared/index.js";
import { ProcedureWithRelevanceSchema } from "./Procedure.js";
import { PatientSchema } from "./Patient.js";

/**
 * Zod schema for a complete medical case
 */
export const CaseSchema = z.object({
  id: z.uuid().optional(),
  patient: PatientSchema,
  diagnosis: DiagnosisSchema,
  chiefComplaint: ChiefComplaintSchema,
  anamnesis: AnamnesisSchema,
  procedures: z.array(ProcedureWithRelevanceSchema),
  createdAt: z.iso.datetime().optional(),
});

export type Case = z.infer<typeof CaseSchema>;
