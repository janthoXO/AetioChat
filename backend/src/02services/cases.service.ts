import { casesRepo } from "@/03db/repos/cases.repo.js";
import { generateCase } from "@/03api/cases.api.js";
import { fetchDiagnoses } from "@/03api/diagnoses.api.js";
import type { CaseDTO } from "shared/models/Case.dto.js";
import { sseService } from "./sse.service.js";

export const casesService = {
  async getUserCases(userId: string): Promise<CaseDTO[]> {
    const cases = await casesRepo.getAllCasesMinimal(userId);
    return cases.map(c => ({
      id: c.id,
      chiefComplaint: c.chiefComplaint || "Generating...",
      startedAt: c.startedAt || undefined,
      createdAt: c.createdAt || undefined,
      completed: c.completed || undefined
    }));
  },

  async _processGeneration(caseId: string, diagnosisName: string, diagnosisIcd: string | null) {
    try {
      const generatedCase = await generateCase({ name: diagnosisName, icd: diagnosisIcd });
      
      const saved = await casesRepo.updateGeneratingCase(caseId, {
        patient: generatedCase.patient,
        chiefComplaint: generatedCase.chiefComplaint,
        anamnesis: generatedCase.anamnesis,
        procedures: generatedCase.procedures,
      });

      const completedCase: CaseDTO = {
        id: saved.id,
        chiefComplaint: saved.chief_complaint!,
        startedAt: undefined,
        createdAt: saved.created_at || undefined,
      };

      sseService.broadcastGlobal({ type: "CASE_GENERATED", case: completedCase });
    } catch (err) {
      console.error(`Error processing case generation for ${caseId}:`, err);
    }
  },

  async resumeGeneratingCases() {
    const generatingCases = await casesRepo.getGeneratingCases();
    console.log(`Resuming ${generatingCases.length} interrupted case generations...`);
    for (const c of generatingCases) {
      this._processGeneration(c.id, c.diagnosis_name, c.diagnosis_icd);
    }
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

    // 5. Create scaffold case in DB
    const saved = await casesRepo.createPartial({
      diagnosisName: randomDiag.name,
      diagnosisIcd: randomDiag.icd!,
    });

    // 6. Spawn background compilation without awaiting
    this._processGeneration(saved.id, randomDiag.name, randomDiag.icd!);

    return {
      id: saved.id,
      chiefComplaint: "Generating...",
      startedAt: undefined,
      createdAt: undefined,
    };
  },

  async assignCaseToUser(userId: string, caseId: string) {
    await casesRepo.createUserCase(userId, caseId);
  },
};
