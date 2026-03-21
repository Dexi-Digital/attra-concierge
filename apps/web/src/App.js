import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { ComparisonPanel } from "./components/comparison-panel";
import { EmptyState } from "./components/empty-state";
import { ErrorState } from "./components/error-state";
import { LoadingState } from "./components/loading-state";
import { VehicleDetailPanel } from "./components/vehicle-detail-panel";
import { VehicleGrid } from "./components/vehicle-grid";
import { useAppState } from "./state/app-state";
const QUICK_FILTERS = [
    { label: "✦ Todos", query: "todos" },
    { label: "SUV", query: "SUV" },
    { label: "Esportivo", query: "esportivo coupé" },
    { label: "Blindado", query: "blindado" },
    { label: "Até R$ 500k", query: "até 500 mil" },
    { label: "Importado", query: "importado premium" },
];
export function App() {
    const { state, search, openDetail, compare, toggleSelect, backToResults, reset } = useAppState();
    const [query, setQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("todos");
    // Auto-load: mostra estoque sem o usuário precisar pesquisar
    useEffect(() => {
        search("todos");
    }, []);
    const handleSearch = (e) => {
        e.preventDefault();
        const q = query.trim();
        if (q) {
            setActiveFilter("");
            search(q);
        }
    };
    const handleFilter = (filterQuery, label) => {
        setActiveFilter(label);
        setQuery("");
        search(filterQuery);
    };
    const handleReset = () => {
        reset();
        setQuery("");
        setActiveFilter("todos");
        search("todos");
    };
    return (_jsxs("main", { className: "page-shell", children: [_jsxs("header", { className: "page-header", children: [_jsxs("div", { className: "header-brand", children: [_jsx("div", { className: "header-logo", children: _jsx("img", { src: "/logo-white.png", alt: "Attra Ve\u00EDculos", className: "logo-img" }) }), _jsx("div", { className: "header-divider" }), _jsx("span", { className: "header-tagline", children: "Concierge de Ve\u00EDculos Premium" })] }), _jsxs("div", { className: "header-badge", children: [_jsx("span", { className: "header-badge-dot" }), "Estoque ao vivo"] })] }), _jsxs("form", { className: "search-bar", onSubmit: handleSearch, children: [_jsxs("div", { className: "search-input-wrap", children: [_jsx("span", { className: "search-icon", children: "\u2315" }), _jsx("input", { className: "search-input", type: "text", placeholder: "Ex: SUV blindado at\u00E9 500 mil, Porsche esportivo\u2026", value: query, onChange: (e) => setQuery(e.target.value) })] }), _jsx("button", { className: "btn btn--primary btn--lg", type: "submit", disabled: state.loading, children: state.loading ? "Buscando…" : "Buscar" }), state.view === "results" && !state.loading && (_jsx("button", { className: "btn btn--ghost", type: "button", onClick: handleReset, children: "Limpar" }))] }), _jsx("div", { className: "filter-chips", children: QUICK_FILTERS.map((f) => (_jsx("button", { className: `filter-chip${activeFilter === f.label ? " filter-chip--active" : ""}`, onClick: () => handleFilter(f.query, f.label), disabled: state.loading, children: f.label }, f.label))) }), state.loading && _jsx(LoadingState, {}), state.error && _jsx(ErrorState, { message: state.error }), state.view === "results" && state.searchResults && !state.loading && (state.searchResults.results.length > 0
                ? _jsx(VehicleGrid, { results: state.searchResults.results, total: state.searchResults.total, selectedIds: state.selectedIds, onSelect: toggleSelect, onOpen: openDetail, onCompare: () => compare(state.selectedIds) })
                : _jsx(EmptyState, { message: state.searchResults.emptyReason ?? "Nenhum veículo encontrado." })), state.view === "detail" && state.vehicleDetail && !state.loading && (_jsx(VehicleDetailPanel, { data: state.vehicleDetail, onBack: backToResults })), state.view === "comparison" && state.comparison && !state.loading && (_jsx(ComparisonPanel, { data: state.comparison, onBack: backToResults }))] }));
}
