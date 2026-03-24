import z from "zod";

export const ChiefComplaintDTOSchema = z
  .string()
  .describe("The chief complaint of the patient");

export type ChiefComplaintDTO = z.infer<typeof ChiefComplaintDTOSchema>;
