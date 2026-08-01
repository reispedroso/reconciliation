import type { DraftExaminationCatalogPreview } from "@confession/contracts";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

const examinationSessionKey = "confession-app:examination-session:v1";

export interface ExaminationSessionState {
  activeQuestionCode: string;
  compactCriteriaHelp: boolean;
  selections: Readonly<Record<string, readonly string[]>>;
}

interface StoredExaminationSession extends ExaminationSessionState {
  catalogVersion: string;
  schemaVersion: 1;
}

function initialState(
  catalog: DraftExaminationCatalogPreview,
): ExaminationSessionState {
  const firstQuestion = catalog.questions[0];

  if (firstQuestion === undefined) {
    throw new Error("The examination catalog has no questions.");
  }

  return {
    activeQuestionCode: firstQuestion.code,
    compactCriteriaHelp: false,
    selections: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readSession(
  catalog: DraftExaminationCatalogPreview,
): ExaminationSessionState {
  const fallback = initialState(catalog);

  try {
    const storedValue = window.sessionStorage.getItem(examinationSessionKey);

    if (storedValue === null) {
      return fallback;
    }

    const parsed: unknown = JSON.parse(storedValue);

    if (
      !isRecord(parsed) ||
      parsed["schemaVersion"] !== 1 ||
      parsed["catalogVersion"] !== catalog.catalogVersion
    ) {
      return fallback;
    }

    const storedSelections = isRecord(parsed["selections"])
      ? parsed["selections"]
      : {};
    const selections: Record<string, readonly string[]> = {};

    for (const question of catalog.questions) {
      const candidate = storedSelections[question.code];

      if (!Array.isArray(candidate)) {
        continue;
      }

      const optionByCode = new Map(
        question.options.map((option) => [option.code, option]),
      );
      const validCodes = [
        ...new Set(
          candidate.filter(
            (code): code is string =>
              typeof code === "string" && optionByCode.has(code),
          ),
        ),
      ];
      const selectedExclusiveCode = validCodes.find(
        (code) => optionByCode.get(code)?.exclusive === true,
      );
      const normalizedCodes =
        selectedExclusiveCode === undefined
          ? validCodes
          : [selectedExclusiveCode];

      if (normalizedCodes.length > 0) {
        selections[question.code] = normalizedCodes;
      }
    }

    const activeQuestionCode =
      typeof parsed["activeQuestionCode"] === "string" &&
      catalog.questions.some(
        ({ code }) => code === parsed["activeQuestionCode"],
      )
        ? parsed["activeQuestionCode"]
        : fallback.activeQuestionCode;

    return {
      activeQuestionCode,
      compactCriteriaHelp: parsed["compactCriteriaHelp"] === true,
      selections,
    };
  } catch {
    return fallback;
  }
}

function persistSession(
  catalogVersion: string,
  state: ExaminationSessionState,
): void {
  const storedSession: StoredExaminationSession = {
    schemaVersion: 1,
    catalogVersion,
    ...state,
  };

  try {
    window.sessionStorage.setItem(
      examinationSessionKey,
      JSON.stringify(storedSession),
    );
  } catch {
    // The examination remains usable in memory when browser storage is blocked.
  }
}

export interface UseExaminationSessionResult {
  clearSession: () => void;
  setState: Dispatch<SetStateAction<ExaminationSessionState>>;
  state: ExaminationSessionState;
}

export function useExaminationSession(
  catalog: DraftExaminationCatalogPreview,
): UseExaminationSessionResult {
  const [state, setState] = useState<ExaminationSessionState>(() =>
    readSession(catalog),
  );
  const skipNextPersistence = useRef(false);

  useEffect(() => {
    if (skipNextPersistence.current) {
      skipNextPersistence.current = false;
      return;
    }

    persistSession(catalog.catalogVersion, state);
  }, [catalog.catalogVersion, state]);

  const clearSession = useCallback(() => {
    skipNextPersistence.current = true;

    try {
      window.sessionStorage.removeItem(examinationSessionKey);
    } catch {
      // No personal data is logged when browser storage is unavailable.
    }

    setState(initialState(catalog));
  }, [catalog]);

  return { clearSession, setState, state };
}
