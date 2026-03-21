import type { CompareVehiclesResponse } from "@attra/shared";

interface ComparisonPanelProps {
  data: CompareVehiclesResponse;
  onBack: () => void;
}

export function ComparisonPanel({ data, onBack }: ComparisonPanelProps) {
  const { vehicles, strengths, tradeoffs, recommendation } = data;

  return (
    <section className="panel section-stack">
      <div>
        <button className="btn btn--ghost" onClick={onBack}>← Voltar aos resultados</button>
      </div>
      <h2 style={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
        Comparação consultiva
      </h2>

      <div className="compare-vehicles">
        {vehicles.map((v) => (
          <div key={v.id} className="compare-card">
            <p className="eyebrow">{v.brand}</p>
            <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>{v.title}</h3>
            <p className="compare-price">R$ {v.price.toLocaleString("pt-BR")}</p>
            <p className="muted">{v.yearModel} • {v.mileageKm.toLocaleString("pt-BR")} km</p>
          </div>
        ))}
      </div>

      {strengths.length > 0 && (
        <div className="section-stack" style={{ gap: "0" }}>
          <p className="detail-section-title">Pontos fortes</p>
          {strengths.map((s, i) => (
            <div key={i} className="finding">
              <strong>{s.title}</strong>
              <p>{s.summary}</p>
            </div>
          ))}
        </div>
      )}

      {tradeoffs.length > 0 && (
        <div className="section-stack" style={{ gap: "0" }}>
          <p className="detail-section-title">Trade-offs</p>
          {tradeoffs.map((t, i) => (
            <div key={i} className="finding">
              <strong>{t.title}</strong>
              <p>{t.summary}</p>
            </div>
          ))}
        </div>
      )}

      <div className="recommendation">
        <h3>Recomendação</h3>
        <p>{recommendation}</p>
      </div>
    </section>
  );
}
