import type { SearchInventoryInput, SearchInventoryResponse } from "@attra/shared";
import { parseSearchIntent } from "../../domain/intent/intent-parser.js";
import { vehicleRepository } from "../../domain/vehicles/vehicle.repository.js";
import { searchVehicles } from "../../domain/vehicles/vehicle-query.service.js";

export async function searchInventory(input: SearchInventoryInput): Promise<SearchInventoryResponse> {
  const { filters } = parseSearchIntent(input);
  const vehicles = await vehicleRepository.list();
  return searchVehicles(vehicles, filters);
}
