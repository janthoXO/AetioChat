import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Diagnosis, Procedure } from "shared/index.js";
import { fetchCases as fetchCasesApi, generateCase as generateCaseApi } from "@/api/cases.api";
import { fetchDiagnoses } from "@/api/diagnosis.api";
import { fetchProcedures } from "@/api/procedures.api";
import type { CaseDTO } from "shared/models/Case.dto";

interface CasesState {
  cases: CaseDTO[];
  myCases: CaseDTO[];
  newCases: CaseDTO[];
  diagnoses: Diagnosis[];
  procedures: Procedure[];
  isGenerating: boolean;
  fetchCases: () => Promise<void>;
  generateCase: () => Promise<CaseDTO | null>;
  loadOptions: () => Promise<void>;
}

const CasesContext = createContext<CasesState>({
  cases: [],
  myCases: [],
  newCases: [],
  diagnoses: [],
  procedures: [],
  isGenerating: false,
  fetchCases: async () => {},
  generateCase: async () => null,
  loadOptions: async () => {},
});

export function CasesProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<CaseDTO[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchCases = async () => {
    await fetchCasesApi().then((data) => setCases(data));
  };

  const generateCase = async () => {
    setIsGenerating(true);
    return await generateCaseApi()
      .then((data) => {
        if (data) {
          setCases((prev) => [data, ...prev]);
        }
        return data;
      })
      .finally(() => {
        setIsGenerating(false);
      });
  };

  const loadOptions = async () => {
    if (diagnoses.length > 0 && procedures.length > 0) return;

    await Promise.all([
      fetchDiagnoses().then((data) => setDiagnoses(data)),
      fetchProcedures().then((data) => setProcedures(data)),
    ]);
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const myCases = cases.filter((c) => !!c.startedAt);
  const newCases = cases.filter((c) => !c.startedAt);

  return (
    <CasesContext.Provider
      value={{
        cases,
        myCases,
        newCases,
        diagnoses,
        procedures,
        isGenerating,
        fetchCases,
        generateCase,
        loadOptions,
      }}
    >
      {children}
    </CasesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCases = () => useContext(CasesContext);
