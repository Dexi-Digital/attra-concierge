import type { SearchInventoryResponse, VehicleRecord } from "@attra/shared";
import type { VehicleSearchFilters } from "./vehicle.types.js";
import { buildVehicleSearchResult } from "./vehicle-profiles.js";

const DEFAULT_RESULT_LIMIT = 6;

export function searchVehicles(
  vehicles: VehicleRecord[],
  filters: VehicleSearchFilters
): SearchInventoryResponse {
  const limit = filters.limit ?? DEFAULT_RESULT_LIMIT;

  const filteredVehicles = vehicles
    .filter((vehicle) => vehicle.available)
    .filter((vehicle) => matchesFilters(vehicle, filters))
    // MCP ordering policy: profile adherence → price fit → usage → quality → fallback
    .sort((left, right) => scoreVehicle(right, filters) - scoreVehicle(left, filters))
    .slice(0, limit);

  const results = filteredVehicles.map((vehicle) =>
    buildVehicleSearchResult(vehicle, buildMatchReason(vehicle, filters))
  );

  return {
    results,
    total: results.length,
    appliedFilters: compactFilters(filters),
    emptyReason: results.length === 0 ? "Nenhum veículo disponível combinou com os filtros informados." : undefined
  };
}

function matchesFilters(vehicle: VehicleRecord, filters: VehicleSearchFilters): boolean {
  return (
    matchesText(vehicle, filters.queryText) &&
    matchesValue(vehicle.brand, filters.brand) &&
    matchesPartial(vehicle.model, filters.model) &&
    matchesValue(vehicle.bodyType, filters.bodyType) &&
    matchesValue(vehicle.fuelType, filters.fuelType) &&
    matchesValue(vehicle.transmission, filters.transmission) &&
    matchesPartial(vehicle.color, filters.color) &&
    matchesValue(vehicle.storeUnit, filters.storeUnit) &&
    matchesValue(vehicle.usageProfile, filters.usageProfile) &&
    matchesValue(vehicle.positioningProfile, filters.positioningProfile) &&
    matchesMin(vehicle.price, filters.priceMin) &&
    matchesMax(vehicle.price, filters.priceMax) &&
    matchesMin(vehicle.yearModel, filters.yearMin) &&
    matchesMax(vehicle.yearModel, filters.yearMax) &&
    matchesMax(vehicle.mileageKm, filters.kmMax) &&
    matchesBoolean(vehicle.armored, filters.armored)
  );
}

/**
 * MCP ordering policy (from mcp-instructions.md):
 * 1. Profile adherence (positioning + usage)
 * 2. Price range compatibility
 * 3. Usage coherence (body type + query)
 * 4. Quality (year + mileage)
 * 5. Fallback (text match)
 */
function scoreVehicle(vehicle: VehicleRecord, filters: VehicleSearchFilters): number {
  let score = 0;

  // 1. Profile adherence
  if (matchesValue(vehicle.positioningProfile, filters.positioningProfile)) score += 8;
  if (matchesValue(vehicle.usageProfile, filters.usageProfile)) score += 6;

  // 2. Price range compatibility
  const midPrice = filters.priceMin !== undefined && filters.priceMax !== undefined
    ? (filters.priceMin + filters.priceMax) / 2
    : undefined;
  if (midPrice !== undefined) {
    const priceDist = Math.abs(vehicle.price - midPrice) / (midPrice || 1);
    if (priceDist < 0.1) score += 5;
    else if (priceDist < 0.2) score += 3;
    else if (priceDist < 0.3) score += 1;
  }

  // 3. Usage coherence (body type + brand)
  if (matchesValue(vehicle.bodyType, filters.bodyType)) score += 4;
  if (matchesValue(vehicle.brand, filters.brand)) score += 3;

  // 4. Quality: recency and low mileage
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - vehicle.yearModel;
  if (vehicleAge <= 1) score += 3;
  else if (vehicleAge <= 3) score += 2;
  else if (vehicleAge <= 5) score += 1;
  if (vehicle.mileageKm < 20_000) score += 2;
  else if (vehicle.mileageKm < 50_000) score += 1;

  // 5. Fallback: text match
  const queryText = normalize(filters.queryText);
  if (queryText && normalize(vehicle.title).includes(queryText)) score += 2;

  return score;
}

function buildMatchReason(vehicle: VehicleRecord, filters: VehicleSearchFilters): string {
  if (filters.queryText) {
    return `${vehicle.title} combina com a intenção "${filters.queryText}".`;
  }

  return `${vehicle.title} atende aos filtros aplicados e está disponível na unidade ${vehicle.storeUnit}.`;
}

function compactFilters(filters: VehicleSearchFilters): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(filters).filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
  );
}

// Palavras que não identificam veículos e devem ser ignoradas no match de texto
// Inclui termos que já são tratados como filtros estruturados (ex: "blindado" → armored: true)
const TEXT_STOPWORDS = new Set([
  "ate", "para", "de", "um", "uma", "no", "na", "por", "com", "sem", "e", "a", "o",
  "da", "do", "dos", "das", "em", "que", "se", "me", "te", "nos", "os", "as",
  "quero", "queria", "busco", "procuro", "mostra", "manda", "tenho", "interesse",
  "mil", "k", "reais", "r",
  "premium", "top", "bom", "boa", "otimo", "otima", "novo", "nova", "melhor",
  "mais", "menos", "muito", "pouco", "nao", "sim", "agora", "disponivel",
  // Termos tratados como filtros estruturados — não devem bloquear pelo texto
  "blindado", "blindada", "blindagem", "blindad",
  "importado", "importada"
]);

function matchesText(vehicle: VehicleRecord, queryText?: string): boolean {
  if (!queryText) return true;

  const searchableText = normalize(
    [vehicle.brand, vehicle.model, vehicle.version, vehicle.title, vehicle.bodyType, vehicle.usageProfile].join(" ")
  );

  // Filtra tokens sem significado (stopwords e números puros)
  const meaningfulTokens = normalize(queryText)
    .split(" ")
    .filter(Boolean)
    .filter((token) => !TEXT_STOPWORDS.has(token) && !/^\d+$/.test(token));

  // Se só restar stopwords, não bloqueia nenhum veículo
  if (meaningfulTokens.length === 0) return true;

  return meaningfulTokens.every((token) => searchableText.includes(token));
}

function matchesValue(source?: string, expected?: string): boolean {
  if (!expected) return true;
  if (!source) return false;
  return normalize(source) === normalize(expected);
}

/** Partial/substring match — used for model and color where partial input is common */
function matchesPartial(source?: string, expected?: string): boolean {
  if (!expected) return true;
  if (!source) return false;
  return normalize(source).includes(normalize(expected));
}

function matchesMin(value: number, min?: number): boolean {
  return min === undefined || value >= min;
}

function matchesMax(value: number, max?: number): boolean {
  return max === undefined || value <= max;
}

function matchesBoolean(value: boolean, expected?: boolean): boolean {
  return expected === undefined || value === expected;
}

function normalize(value?: string): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
