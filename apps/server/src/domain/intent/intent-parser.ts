import type { SearchInventoryInput } from "@attra/shared";
import type { ParsedIntent } from "./intent.types.js";
import {
  inferArmored,
  inferBodyType,
  inferBrand,
  inferPositioningProfile,
  inferPriceMax,
  inferUsageProfile
} from "./intent-mappers.js";

export function parseSearchIntent(input: SearchInventoryInput): ParsedIntent {
  const normalizedQuery = normalize(input.queryText);
  const inferredFromQuery: string[] = [];

  const filters = {
    ...input,
    brand: input.brand ?? capture(inferBrand(normalizedQuery), inferredFromQuery, "brand"),
    bodyType: input.bodyType ?? capture(inferBodyType(normalizedQuery), inferredFromQuery, "bodyType"),
    usageProfile:
      input.usageProfile ?? capture(inferUsageProfile(normalizedQuery), inferredFromQuery, "usageProfile"),
    positioningProfile:
      input.positioningProfile ??
      capture(inferPositioningProfile(normalizedQuery), inferredFromQuery, "positioningProfile"),
    armored: input.armored ?? capture(inferArmored(normalizedQuery), inferredFromQuery, "armored"),
    priceMax: input.priceMax ?? capture(inferPriceMax(normalizedQuery), inferredFromQuery, "priceMax")
  };

  return { filters, inferredFromQuery };
}

function capture<T>(value: T | undefined, bucket: string[], label: string): T | undefined {
  if (value !== undefined) {
    bucket.push(label);
  }

  return value;
}

function normalize(value?: string): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
