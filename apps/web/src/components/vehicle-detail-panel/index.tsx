import type { GetVehicleDetailsResponse } from "@attra/shared";

interface VehicleDetailPanelProps {
  data: GetVehicleDetailsResponse;
  onBack: () => void;
}

export function VehicleDetailPanel({ data, onBack }: VehicleDetailPanelProps) {
  const { vehicle, highlights, consultantSummary, officialLink } = data;

  return (
    <section className="panel section-stack">
      <div>
        <button className="btn btn--ghost" onClick={onBack}>← Voltar aos resultados</button>
      </div>

      <div className="detail-header">
        {vehicle.mainImageUrl && (
          <img className="detail-img" src={vehicle.mainImageUrl} alt={vehicle.title} />
        )}
        <div className="detail-info">
          <p className="eyebrow">{vehicle.brand} • {vehicle.bodyType}</p>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {vehicle.title}
          </h2>
          <p className="detail-price">R$ {vehicle.price.toLocaleString("pt-BR")}</p>
          {vehicle.armored && <span className="badge" style={{ marginTop: "0.25rem" }}>Blindado</span>}
        </div>
      </div>

      <div className="detail-specs">
        <span>{vehicle.yearModel}</span>
        <span>{vehicle.mileageKm.toLocaleString("pt-BR")} km</span>
        <span>{vehicle.transmission}</span>
        <span>{vehicle.fuelType}</span>
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

      {consultantSummary && (
        <p className="detail-summary">{consultantSummary}</p>
      )}

      <div className="detail-actions">
        <a className="btn btn--primary btn--lg" href={officialLink} target="_blank" rel="noopener noreferrer">
          Ver no site Attra →
        </a>
        <button className="btn" onClick={onBack}>Voltar</button>
      </div>
    </section>
  );
}
