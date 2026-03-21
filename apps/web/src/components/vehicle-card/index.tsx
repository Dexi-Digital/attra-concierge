import type { VehicleRecord } from "@attra/shared";

interface VehicleCardProps {
  vehicle: VehicleRecord;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onOpen?: (id: string) => void;
}

export function VehicleCard({ vehicle, selected, onSelect, onOpen }: VehicleCardProps) {
  const priceFormatted = `R$ ${vehicle.price.toLocaleString("pt-BR")}`;
  const metaLine = `${vehicle.yearModel} • ${vehicle.mileageKm.toLocaleString("pt-BR")} km`;

  return (
    <article className={`card${selected ? " card--selected" : ""}`}>

      {/* ── Imagem com badges sobrepostas ── */}
      <div className="card__media">
        {vehicle.mainImageUrl
          ? <img className="card__img" src={vehicle.mainImageUrl} alt={vehicle.title} loading="lazy" />
          : <div className="card__img-placeholder">🚗</div>
        }
        <div className="card__badges">
          {vehicle.armored && <span className="badge">Blindado</span>}
        </div>
      </div>

      {/* ── Corpo do card ── */}
      <div className="card__body">
        <p className="eyebrow">{vehicle.brand} • {vehicle.bodyType}</p>
        <h3 className="card__title">{vehicle.title}</h3>
        <p className="card__meta">{metaLine}</p>
        <p className="card__price">{priceFormatted}</p>
      </div>

      {/* ── Ações ── */}
      <div className="card__actions">
        {onSelect && (
          <button
            className={`btn btn--sm${selected ? " btn--outline" : ""}`}
            onClick={(e) => { e.stopPropagation(); onSelect(vehicle.id); }}
          >
            {selected ? "✓ Selecionado" : "Comparar"}
          </button>
        )}
        {onOpen && (
          <button
            className="btn btn--sm btn--primary"
            style={{ flex: 1 }}
            onClick={(e) => { e.stopPropagation(); onOpen(vehicle.id); }}
          >
            Ver detalhes
          </button>
        )}
      </div>

    </article>
  );
}
