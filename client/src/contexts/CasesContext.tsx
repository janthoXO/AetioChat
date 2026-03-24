import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { CaseUserViewDTO, DiagnosisDTO, ProcedureDTO } from "shared/index.js";
import { fetchCases as fetchCasesApi, generateCase as generateCaseApi } from "@/api/cases.api";
import { fetchDiagnoses } from "@/api/diagnosis.api";
import { fetchProcedures } from "@/api/procedures.api";
import { useAuth } from "./AuthContext";
import { API_URL } from "@/lib/api";

interface CasesState {
  cases: CaseUserViewDTO[];
  myCases: CaseUserViewDTO[];
  newCases: CaseUserViewDTO[];
  diagnoses: DiagnosisDTO[];
  procedures: ProcedureDTO[];
  isGenerating: boolean;
  fetchCases: () => Promise<void>;
  generateCase: () => Promise<CaseUserViewDTO | null>;
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
  const [cases, setCases] = useState<CaseUserViewDTO[]>([]);
  const [diagnoses, setDiagnoses] = useState<DiagnosisDTO[]>([]);
  const [procedures, setProcedures] = useState<ProcedureDTO[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { token } = useAuth();

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

  useEffect(() => {
    if (!token) return;

    const eventSource = new EventSource(`${API_URL}/cases/events`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "CASE_GENERATED" && data.case) {
          setCases((prev) => {
            const index = prev.findIndex((c) => c.id === data.case.id);
            if (index !== -1) {
              const newCases = [...prev];
              newCases[index] = data.case;
              return newCases;
            }
            return [data.case, ...prev];
          });
        }
      } catch (err) {
        console.error("Error parsing case generation event", err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [token]);

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
