import type { DraftExaminationCatalogPreview } from "@confession/contracts";
import { useEffect, useState } from "react";

import { fetchDraftCatalog } from "../api/fetchDraftCatalog.js";

type DraftCatalogState =
  | { status: "loading" }
  | { status: "loaded"; catalog: DraftExaminationCatalogPreview }
  | { status: "error"; message: string };

export function useDraftCatalog(): DraftCatalogState {
  const [state, setState] = useState<DraftCatalogState>({
    status: "loading",
  });

  useEffect(() => {
    const controller = new AbortController();

    void fetchDraftCatalog(controller.signal)
      .then((catalog) => {
        setState({ status: "loaded", catalog });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o catálogo.",
        });
      });

    return () => {
      controller.abort();
    };
  }, []);

  return state;
}

