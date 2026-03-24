import { casesRepo } from "@/03db/repos/cases.repo.js";
import { generateCase } from "@/03api/cases.api.js";
import { fetchDiagnoses } from "@/03api/diagnoses.api.js";
import { caseSse } from "./case.sse.js";
import { type CaseUserView } from "@/02models/Case.js";

export const casesService = {
  async getUserCases(userId: string): Promise<CaseUserView[]> {
    const cases = await casesRepo.getAllCasesMinimal(userId);
    return cases.map((c) => ({
      id: c.id,
      chiefComplaint: c.chief_complaint ?? undefined,
      createdAt: c.created_at ?? undefined,
      completedAt: c.completed_at ?? undefined,
      startedAt: c.started_at ?? undefined,
    }));
  },

  async _processGeneration(
    caseId: string,
    diagnosisName: string,
    diagnosisIcd: string | null
  ) {
    try {
      const generatedCase = await generateCase({
        name: diagnosisName,
        icd: diagnosisIcd ?? undefined,
      });

      const saved = await casesRepo.updateGeneratingCase(caseId, {
        patient: generatedCase.patient,
        chiefComplaint: generatedCase.chiefComplaint,
        anamnesis: generatedCase.anamnesis,
        procedures: generatedCase.procedures,
      });

      const completedCase: CaseUserView = {
        id: saved.id,
        chiefComplaint: saved.chief_complaint!,
        startedAt: undefined,
        createdAt: saved.created_at || undefined,
        completedAt: undefined,
      };

      caseSse.publishCaseGeneration(completedCase);
    } catch (err) {
      console.error(`Error processing case generation for ${caseId}:`, err);
    }
  },

  async resumeGeneratingCases() {
    const generatingCases = await casesRepo.getGeneratingCases();
    console.log(
      `Resuming ${generatingCases.length} interrupted case generations...`
    );
    for (const c of generatingCases) {
      this._processGeneration(c.id, c.diagnosis_name, c.diagnosis_icd);
    }
  },

  async generateCase(): Promise<CaseUserView> {
    // 1. Fetch all diagnoses from GENERATOR_URL
    const diagnoses = await fetchDiagnoses();
    const allIcds = diagnoses
      .map((d) => d.icd)
      .filter((icd): icd is string => !!icd);

    // 2. Fetch used ICD codes from our DB
    const usedIcdSet = await casesRepo
      .getAllDiagnosisIcdCodes()
      .then((icds) => new Set(icds));

    // 3. Calculate unused diagnosis
    const unusedIcd = allIcds.filter((icd) => !usedIcdSet.has(icd));

    // 4. Pick a random unused diagnosis
    const randomIcd = unusedIcd[Math.floor(Math.random() * unusedIcd.length)];
    const randomDiag = diagnoses.find((d) => d.icd === randomIcd);

    if (!randomDiag) throw new Error("No diagnoses available");

    // 5. Create scaffold case in DB
    const saved = await casesRepo.createPartial({
      diagnosisName: randomDiag.name,
      diagnosisIcd: randomDiag.icd!,
    });

    // 6. Spawn background compilation without awaiting
    this._processGeneration(saved.id, randomDiag.name, randomDiag.icd!);

    return {
      id: saved.id,
      chiefComplaint: undefined,
      startedAt: undefined,
      createdAt: undefined,
    };
  },

  async assignCaseToUser(userId: string, caseId: string) {
    await casesRepo.createUserCase(userId, caseId);
  },
};
