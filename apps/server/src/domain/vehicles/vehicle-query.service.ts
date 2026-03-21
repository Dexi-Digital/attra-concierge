import type { SearchInventoryResponse, VehicleRecord } from "@attra/shared";
import type { VehicleSearchFilters } from "./vehicle.types.js";
import { buildVehicleSearchResult } from "./vehicle-profiles.js";

const RESULT_LIMIT = 6;

export function searchVehicles(
  vehicles: VehicleRecord[],
  filters: VehicleSearchFilters
): SearchInventoryResponse {
  const filteredVehicles = vehicles
    .filter((vehicle) => vehicle.available)
    .filter((vehicle) => matchesFilters(vehicle, filters))
    .sort((left, right) => scoreVehicle(right, filters) - scoreVehicle(left, filters))
    .slice(0, RESULT_LIMIT);

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
    matchesValue(vehicle.bodyType, filters.bodyType) &&
    matchesValue(vehicle.fuelType, filters.fuelType) &&
    matchesValue(vehicle.usageProfile, filters.usageProfile) &&
    matchesValue(vehicle.positioningProfile, filters.positioningProfile) &&
    matchesMin(vehicle.price, filters.priceMin) &&
    matchesMax(vehicle.price, filters.priceMax) &&
    matchesMin(vehicle.yearModel, filters.yearMin) &&
    matchesBoolean(vehicle.armored, filters.armored)
  );
}

function scoreVehicle(vehicle: VehicleRecord, filters: VehicleSearchFilters): number {
  let score = 0;
  const queryText = normalize(filters.queryText);

  if (queryText && normalize(vehicle.title).includes(queryText)) score += 4;
  if (matchesValue(vehicle.brand, filters.brand)) score += 2;
  if (matchesValue(vehicle.bodyType, filters.bodyType)) score += 1;
  if (matchesValue(vehicle.usageProfile, filters.usageProfile)) score += 1;
  if (matchesValue(vehicle.positioningProfile, filters.positioningProfile)) score += 1;

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
