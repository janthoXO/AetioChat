import z from "zod";

export const ChiefComplaintSchema = z.string();

export type ChiefComplaint = z.infer<typeof ChiefComplaintSchema>;
