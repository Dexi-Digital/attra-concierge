import { useState } from "react";
import { ComparisonPanel } from "./components/comparison-panel";
import { EmptyState } from "./components/empty-state";
import { ErrorState } from "./components/error-state";
import { LoadingState } from "./components/loading-state";
import { VehicleDetailPanel } from "./components/vehicle-detail-panel";
import { VehicleGrid } from "./components/vehicle-grid";
import { useAppState } from "./state/app-state";

export function App() {
  const { state, search, openDetail, compare, toggleSelect, backToResults, reset } = useAppState();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      search(query.trim());
    }
  };

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Attra Concierge</p>
          <h1>Descubra o veículo ideal</h1>
        </div>
      </header>

      {/* Search bar — always visible */}
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          className="search-input"
          type="text"
          placeholder="Ex: SUV blindado até 500 mil, Porsche esportivo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn btn--primary" type="submit" disabled={state.loading}>
          {state.loading ? "Buscando…" : "Buscar"}
        </button>
        {state.view !== "search" && (
          <button className="btn btn--ghost" type="button" onClick={reset}>
            Nova busca
          </button>
        )}
      </form>

      {/* Loading */}
      {state.loading && <LoadingState />}

      {/* Error */}
      {state.error && <ErrorState message={state.error} />}

      {/* Results grid */}
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

      {/* Detail */}
      {state.view === "detail" && state.vehicleDetail && !state.loading && (
        <VehicleDetailPanel data={state.vehicleDetail} onBack={backToResults} />
      )}

      {/* Comparison */}
      {state.view === "comparison" && state.comparison && !state.loading && (
        <ComparisonPanel data={state.comparison} onBack={backToResults} />
      )}
    </main>
  );
}
