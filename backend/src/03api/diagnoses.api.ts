import { config } from "@/config.js";
import { DiagnosisSchema, type Diagnosis } from "shared/index.js";

export async function fetchDiagnoses(): Promise<Diagnosis[]> {
  const res = await fetch(`${config.GENERATOR_URL}/diseases`);
  if (!res.ok) throw new Error("Failed to fetch diagnoses");
  return DiagnosisSchema.array().parse(await res.json());
}
