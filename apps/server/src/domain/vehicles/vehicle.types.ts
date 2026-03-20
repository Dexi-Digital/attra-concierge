export type VehicleSearchToken = string;

export interface VehicleSearchFilters {
  queryText?: string;
  brand?: string;
  bodyType?: string;
  fuelType?: string;
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  armored?: boolean;
  usageProfile?: string;
  positioningProfile?: string;
}
