import type { VehicleSearchResult } from "@attra/shared";
import { VehicleCard } from "../vehicle-card";

interface VehicleGridProps {
  results: VehicleSearchResult[];
  total: number;
  selectedIds: string[];
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onCompare: () => void;
}

export function VehicleGrid({ results, total, selectedIds, onSelect, onOpen, onCompare }: VehicleGridProps) {
  return (
    <section className="section-stack">
      <div className="section-header">
        <h2>Resultados ({total})</h2>
        {selectedIds.length >= 2 && (
          <button className="btn btn--primary" onClick={onCompare}>
            Comparar {selectedIds.length} veículos
          </button>
        )}
      </div>
      <div className="grid">
        {results.map(({ vehicle }) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            selected={selectedIds.includes(vehicle.id)}
            onSelect={onSelect}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  );
}
