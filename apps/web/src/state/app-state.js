import { useReducer, useCallback } from "react";
import * as api from "../api/api-client";
const initialState = {
    view: "search",
    loading: false,
    error: null,
    searchResults: null,
    vehicleDetail: null,
    comparison: null,
    selectedIds: []
};
function reducer(state, action) {
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
    const search = useCallback(async (queryText) => {
        dispatch({ type: "LOADING" });
        try {
            const result = await api.searchInventory({ queryText });
            dispatch({ type: "SEARCH_OK", payload: result });
        }
        catch (err) {
            dispatch({ type: "ERROR", error: err instanceof Error ? err.message : "Erro na busca." });
        }
    }, []);
    const openDetail = useCallback(async (vehicleId) => {
        dispatch({ type: "LOADING" });
        try {
            const result = await api.getVehicleDetails({ vehicleId });
            dispatch({ type: "DETAIL_OK", payload: result });
        }
        catch (err) {
            dispatch({ type: "ERROR", error: err instanceof Error ? err.message : "Erro ao abrir detalhes." });
        }
    }, []);
    const compare = useCallback(async (vehicleIds) => {
        dispatch({ type: "LOADING" });
        try {
            const result = await api.compareVehicles({ vehicleIds });
            dispatch({ type: "COMPARE_OK", payload: result });
        }
        catch (err) {
            dispatch({ type: "ERROR", error: err instanceof Error ? err.message : "Erro na comparação." });
        }
    }, []);
    const toggleSelect = useCallback((vehicleId) => {
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
