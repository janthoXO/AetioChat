import z from "zod";
export const ICDCodePattern = /([A-Z][0-9]{2})(\.[0-9]{1,4})?/;
export const ICDCodeSchema = z.string().regex(ICDCodePattern);
export const DiagnosisSchema = z.object({
    name: z.string(),
    icd: ICDCodeSchema.optional(),
});
//# sourceMappingURL=Diagnosis.js.map