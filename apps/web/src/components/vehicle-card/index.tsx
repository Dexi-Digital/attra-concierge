import type { VehicleRecord } from "@attra/shared";

interface VehicleCardProps {
  vehicle: VehicleRecord;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onOpen?: (id: string) => void;
}

export function VehicleCard({ vehicle, selected, onSelect, onOpen }: VehicleCardProps) {
  return (
    <article className={`card${selected ? " card--selected" : ""}`}>
      {vehicle.mainImageUrl && (
        <img className="card__img" src={vehicle.mainImageUrl} alt={vehicle.title} />
      )}
      <div className="card__body">
        <p className="eyebrow">{vehicle.brand} • {vehicle.bodyType}</p>
        <h3 className="card__title">{vehicle.title}</h3>
        <p className="muted">{vehicle.yearModel} • {vehicle.mileageKm.toLocaleString("pt-BR")} km</p>
        <p className="card__price">R$ {vehicle.price.toLocaleString("pt-BR")}</p>
        {vehicle.armored && <span className="badge">Blindado</span>}
      </div>
      <div className="card__actions">
        {onSelect && (
          <button
            className={`btn btn--sm${selected ? " btn--outline" : ""}`}
            onClick={() => onSelect(vehicle.id)}
          >
            {selected ? "Remover" : "Comparar"}
          </button>
        )}
        {onOpen && (
          <button className="btn btn--sm btn--primary" onClick={() => onOpen(vehicle.id)}>
            Ver detalhes
          </button>
        )}
      </div>
    </article>
  );
}
