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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      setActiveFilter("");
      search(q);
    }
  };

  const handleFilter = (filterQuery: string, label: string) => {
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

  return (
    <main className="page-shell">

      {/* ── Header ── */}
      <header className="page-header">
        <div className="header-brand">
          <div className="header-logo">
            <img src="/logo-white.png" alt="Attra Veículos" className="logo-img" />
          </div>
          <div className="header-divider" />
          <span className="header-tagline">Concierge de Veículos Premium</span>
        </div>
        <div className="header-badge">
          <span className="header-badge-dot" />
          Estoque ao vivo
        </div>
      </header>

      {/* ── Search bar ── */}
      <form className="search-bar" onSubmit={handleSearch}>
        <div className="search-input-wrap">
          <span className="search-icon">⌕</span>
          <input
            className="search-input"
            type="text"
            placeholder="Ex: SUV blindado até 500 mil, Porsche esportivo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="btn btn--primary btn--lg" type="submit" disabled={state.loading}>
          {state.loading ? "Buscando…" : "Buscar"}
        </button>
        {state.view === "results" && !state.loading && (
          <button className="btn btn--ghost" type="button" onClick={handleReset}>
            Limpar
          </button>
        )}
      </form>

      {/* ── Quick filters ── */}
      <div className="filter-chips">
        {QUICK_FILTERS.map((f) => (
          <button
            key={f.label}
            className={`filter-chip${activeFilter === f.label ? " filter-chip--active" : ""}`}
            onClick={() => handleFilter(f.query, f.label)}
            disabled={state.loading}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Loading ── */}
      {state.loading && <LoadingState />}

      {/* ── Error ── */}
      {state.error && <ErrorState message={state.error} />}

      {/* ── Results grid ── */}
      {state.view === "results" && state.searchResults && !state.loading && (
        state.searchResults.results.length > 0
          ? <VehicleGrid
              results={state.searchResults.results}
              total={state.searchResults.total}
              selectedIds={state.selectedIds}
              onSelect={toggleSelect}
              onOpen={openDetail}
              onCompare={() => compare(state.selectedIds)}
            />
          : <EmptyState message={state.searchResults.emptyReason ?? "Nenhum veículo encontrado."} />
      )}

      {/* ── Detail ── */}
      {state.view === "detail" && state.vehicleDetail && !state.loading && (
        <VehicleDetailPanel data={state.vehicleDetail} onBack={backToResults} />
      )}

      {/* ── Comparison ── */}
      {state.view === "comparison" && state.comparison && !state.loading && (
        <ComparisonPanel data={state.comparison} onBack={backToResults} />
      )}

    </main>
  );
}
