export type VehicleSearchToken = string;

export interface VehicleSearchFilters {
  queryText?: string;
  brand?: string;
  model?: string;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  color?: string;
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  kmMax?: number;
  armored?: boolean;
  storeUnit?: string;
  usageProfile?: string;
  positioningProfile?: string;
  /** Maximum number of results (MCP limit field) */
  limit?: number;
}
