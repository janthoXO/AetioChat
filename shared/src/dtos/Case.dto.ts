import z, { iso } from "zod";
import { ChiefComplaintDTOSchema } from "./ChiefComplaint.dto.js";

export const CaseUserViewDTOSchema = z.object({
  id: z.uuid().optional(),
  chiefComplaint: ChiefComplaintDTOSchema.optional(),
  startedAt: iso.datetime().optional(),
  createdAt: iso.datetime().optional(),
  completed: iso.datetime().optional(),
});

export type CaseUserViewDTO = z.infer<typeof CaseUserViewDTOSchema>;
