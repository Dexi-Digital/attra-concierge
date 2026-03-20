import type { GetVehicleDetailsInput, GetVehicleDetailsResponse } from "./schema.js";
import { buildVehicleHighlights } from "../../domain/vehicles/vehicle-profiles.js";
import { vehicleRepository } from "../../domain/vehicles/vehicle.repository.js";
import { notFound } from "../../utils/app-error.js";

export async function getVehicleDetails(input: GetVehicleDetailsInput): Promise<GetVehicleDetailsResponse> {
  const vehicle = await vehicleRepository.findById(input.vehicleId);

  if (!vehicle) {
    throw notFound(`Veículo ${input.vehicleId} não encontrado.`);
  }

  return {
    vehicle,
    highlights: buildVehicleHighlights(vehicle).map((highlight) => `${highlight.label}: ${highlight.value}`),
    consultantSummary:
      `${vehicle.title} é uma opção ${vehicle.positioningProfile ?? "premium"} indicada para ` +
      `${vehicle.usageProfile ?? "uso versátil"} na unidade ${vehicle.storeUnit}.`,
    officialLink: vehicle.vehicleUrl
  };
}
