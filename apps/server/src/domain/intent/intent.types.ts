import type { VehicleSearchFilters } from "../vehicles/vehicle.types.js";

export interface ParsedIntent {
  filters: VehicleSearchFilters;
  inferredFromQuery: string[];
}
