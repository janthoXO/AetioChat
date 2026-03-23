import { casesRepo } from "@/03db/repos/cases.repo.js";
import { generateCase } from "@/03api/cases.api.js";
import { fetchDiagnoses } from "@/03api/diagnoses.api.js";
import type { CaseDTO } from "shared/models/Case.dto.js";

export const casesService = {
  async getUserCases(userId: string): Promise<CaseDTO[]> {
    const cases = await casesRepo.getAllCasesMinimal(userId);
    return cases.map(c => ({
      id: c.id,
      chiefComplaint: c.chiefComplaint || "No chief complaint provided",
      startedAt: c.startedAt || undefined,
      completed: c.completed || undefined
    }));
  },

  async generateCase(): Promise<CaseDTO> {
    // 1. Fetch all diagnoses from GENERATOR_URL
    const diagnoses = await fetchDiagnoses();
    const allIcds = diagnoses.map(d => d.icd).filter((icd): icd is string => !!icd);

    // 2. Fetch used ICD codes from our DB
    const usedIcdSet = await casesRepo.getAllDiagnosisIcdCodes().then((icds) => new Set(icds));

    // 3. Calculate unused diagnosis
    const unusedIcd = allIcds.filter((icd) => !usedIcdSet.has(icd));

    // 4. Pick a random unused diagnosis
    const randomIcd = unusedIcd[Math.floor(Math.random() * unusedIcd.length)];
    const randomDiag = diagnoses.find((d) => d.icd === randomIcd);

    if (!randomDiag) throw new Error("No diagnoses available");

    // 4. Generate the actual case hitting the generator
    const generatedCase = await generateCase(randomDiag);

    // 5. Save the generated case to our DB
    const saved = await casesRepo.create({
      patient: generatedCase.patient,
      chiefComplaint: generatedCase.chiefComplaint,
      anamnesis: generatedCase.anamnesis,
      procedures: generatedCase.procedures,
      diagnosisName: randomDiag.name,
      diagnosisIcd: randomDiag.icd!,
    });

    return {
      id: saved.id,
      chiefComplaint: saved.chief_complaint!,
      startedAt: undefined,
      createdAt: saved.created_at || undefined,
    };
  },

  async assignCaseToUser(userId: string, caseId: string) {
    await casesRepo.createUserCase(userId, caseId);
  },
};
