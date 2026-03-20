import type { VehicleRecord, VehicleSearchHighlight, VehicleSearchResult } from "@attra/shared";

export function buildVehicleSearchResult(vehicle: VehicleRecord, matchReason: string): VehicleSearchResult {
  return {
    vehicle,
    matchReason,
    highlights: buildVehicleHighlights(vehicle)
  };
}

export function buildVehicleHighlights(vehicle: VehicleRecord): VehicleSearchHighlight[] {
  return [
    { label: "Preço", value: `R$ ${vehicle.price.toLocaleString("pt-BR")}` },
    { label: "Quilometragem", value: `${vehicle.mileageKm.toLocaleString("pt-BR")} km` },
    { label: "Uso", value: vehicle.usageProfile ?? "perfil não classificado" },
    { label: "Unidade", value: vehicle.storeUnit }
  ];
}
