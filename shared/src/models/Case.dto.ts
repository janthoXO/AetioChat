import z, { iso } from "zod";
import { ChiefComplaintSchema } from "./ChiefComplaint.js";

export const CaseDTOSchema = z.object({
  id: z.uuid().optional(),
  chiefComplaint: ChiefComplaintSchema.nullish(),
  startedAt: iso.datetime().nullish(),
  createdAt: iso.datetime().nullish(),
  completed: iso.datetime().nullish(),
});

export type CaseDTO = z.infer<typeof CaseDTOSchema>;
