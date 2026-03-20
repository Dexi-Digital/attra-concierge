import type { GetVehicleDetailsResponse } from "@attra/shared";

interface VehicleDetailPanelProps {
  data: GetVehicleDetailsResponse;
  onBack: () => void;
}

export function VehicleDetailPanel({ data, onBack }: VehicleDetailPanelProps) {
  const { vehicle, highlights, consultantSummary, officialLink } = data;

  return (
    <section className="panel section-stack">
      <button className="btn btn--ghost" onClick={onBack}>← Voltar</button>

      <div className="detail-header">
        {vehicle.mainImageUrl && (
          <img className="detail-img" src={vehicle.mainImageUrl} alt={vehicle.title} />
        )}
        <div>
          <p className="eyebrow">{vehicle.brand} • {vehicle.bodyType}</p>
          <h2>{vehicle.title}</h2>
          <p className="card__price">R$ {vehicle.price.toLocaleString("pt-BR")}</p>
        </div>
      </div>

      <div className="detail-specs">
        <span>{vehicle.yearModel}</span>
        <span>{vehicle.mileageKm.toLocaleString("pt-BR")} km</span>
        <span>{vehicle.transmission}</span>
        <span>{vehicle.fuelType}</span>
        {vehicle.armored && <span className="badge">Blindado</span>}
        <span>{vehicle.storeUnit}</span>
      </div>

      {highlights.length > 0 && (
        <div className="detail-highlights">
          <h3>Destaques</h3>
          <ul>
            {highlights.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </div>
      )}

      <p className="detail-summary">{consultantSummary}</p>

      <div className="detail-actions">
        <a className="btn btn--primary" href={officialLink} target="_blank" rel="noopener noreferrer">
          Ver no site Attra
        </a>
      </div>
    </section>
  );
}
