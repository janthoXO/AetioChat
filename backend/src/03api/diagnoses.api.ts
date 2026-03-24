import { DiagnosisSchema, type Diagnosis } from "@/02models/Diagnosis.js";
import { config } from "@/config.js";

export async function fetchDiagnoses(): Promise<Diagnosis[]> {
  const res = await fetch(`${config.GENERATOR_URL}/diseases`);
  if (!res.ok) throw new Error("Failed to fetch diagnoses");
  return DiagnosisSchema.array().parse(await res.json());
}
