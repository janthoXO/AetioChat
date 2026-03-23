import z, { iso } from "zod";
import { ChiefComplaintSchema } from "./ChiefComplaint.js";

export const CaseDTOSchema = z.object({
  id: z.uuid().optional(),
  chiefComplaint: ChiefComplaintSchema,
  startedAt: iso.datetime().optional(),
  createdAt: iso.datetime().optional(),
  completed: iso.datetime().optional(),
});

export type CaseDTO = z.infer<typeof CaseDTOSchema>;
