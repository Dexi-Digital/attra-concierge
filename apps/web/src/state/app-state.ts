import { useReducer, useCallback } from "react";
import type {
  SearchInventoryResponse,
  GetVehicleDetailsResponse,
  CompareVehiclesResponse,
  VehicleSearchResult
} from "@attra/shared";
import * as api from "../api/api-client";

// ── Views ──────────────────────────────────────────────
export type AppView = "search" | "results" | "detail" | "comparison";

// ── State ──────────────────────────────────────────────
export interface AppState {
  view: AppView;
  loading: boolean;
  error: string | null;
  searchResults: SearchInventoryResponse | null;
  vehicleDetail: GetVehicleDetailsResponse | null;
  comparison: CompareVehiclesResponse | null;
  selectedIds: string[];
}

const initialState: AppState = {
  view: "search",
  loading: false,
  error: null,
  searchResults: null,
  vehicleDetail: null,
  comparison: null,
  selectedIds: []
};

// ── Actions ────────────────────────────────────────────
type Action =
  | { type: "LOADING" }
  | { type: "ERROR"; error: string }
  | { type: "SEARCH_OK"; payload: SearchInventoryResponse }
  | { type: "DETAIL_OK"; payload: GetVehicleDetailsResponse }
  | { type: "COMPARE_OK"; payload: CompareVehiclesResponse }
  | { type: "TOGGLE_SELECT"; vehicleId: string }
  | { type: "BACK_TO_RESULTS" }
  | { type: "RESET" };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "LOADING":
      return { ...state, loading: true, error: null };
    case "ERROR":
      return { ...state, loading: false, error: action.error };
    case "SEARCH_OK":
      return {
        ...state,
        loading: false,
        view: "results",
        searchResults: action.payload,
        vehicleDetail: null,
        comparison: null
      };
    case "DETAIL_OK":
      return {
        ...state,
        loading: false,
        view: "detail",
        vehicleDetail: action.payload
      };
    case "COMPARE_OK":
      return {
        ...state,
        loading: false,
        view: "comparison",
        comparison: action.payload
      };
    case "TOGGLE_SELECT": {
      const id = action.vehicleId;
      const exists = state.selectedIds.includes(id);
      const next = exists
        ? state.selectedIds.filter((i) => i !== id)
        : state.selectedIds.length < 3
          ? [...state.selectedIds, id]
          : state.selectedIds;
      return { ...state, selectedIds: next };
    }
    case "BACK_TO_RESULTS":
      return { ...state, view: "results", vehicleDetail: null, comparison: null };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

// ── Hook ───────────────────────────────────────────────
export function useAppState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const search = useCallback(async (queryText: string) => {
    dispatch({ type: "LOADING" });
    try {
      const result = await api.searchInventory({ queryText });
      dispatch({ type: "SEARCH_OK", payload: result });
    } catch (err) {
      dispatch({ type: "ERROR", error: err instanceof Error ? err.message : "Erro na busca." });
    }
  }, []);

  const openDetail = useCallback(async (vehicleId: string) => {
    dispatch({ type: "LOADING" });
    try {
      const result = await api.getVehicleDetails({ vehicleId });
      dispatch({ type: "DETAIL_OK", payload: result });
    } catch (err) {
      dispatch({ type: "ERROR", error: err instanceof Error ? err.message : "Erro ao abrir detalhes." });
    }
  }, []);

  const compare = useCallback(async (vehicleIds: string[]) => {
    dispatch({ type: "LOADING" });
    try {
      const result = await api.compareVehicles({ vehicleIds });
      dispatch({ type: "COMPARE_OK", payload: result });
    } catch (err) {
      dispatch({ type: "ERROR", error: err instanceof Error ? err.message : "Erro na comparação." });
    }
  }, []);

  const toggleSelect = useCallback((vehicleId: string) => {
    dispatch({ type: "TOGGLE_SELECT", vehicleId });
  }, []);

  const backToResults = useCallback(() => {
    dispatch({ type: "BACK_TO_RESULTS" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return { state, search, openDetail, compare, toggleSelect, backToResults, reset };
}

