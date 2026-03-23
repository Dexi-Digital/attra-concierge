const brandDictionary = ["Porsche", "BMW", "Mercedes-Benz"];
const bodyTypeDictionary = ["SUV", "Sedan", "Coupé"];

export function inferBrand(queryText: string): string | undefined {
  const normalizedQuery = normalize(queryText);
  return brandDictionary.find((brand) => normalizedQuery.includes(normalize(brand)));
}

export function inferBodyType(queryText: string): string | undefined {
  const normalizedQuery = normalize(queryText);
  return bodyTypeDictionary.find((bodyType) => normalizedQuery.includes(normalize(bodyType)));
}

export function inferUsageProfile(queryText: string): string | undefined {
  if (queryText.includes("dia a dia") || queryText.includes("uso diario")) return "uso_diario";
  if (queryText.includes("familia")) return "familia_executiva";
  if (queryText.includes("executiv")) return "executivo";
  return undefined;
}

export function inferPositioningProfile(queryText: string): string | undefined {
  if (queryText.includes("esportivo")) return "esportivo_premium";
  if (queryText.includes("equilibrado")) return "premium_equilibrado";
  return undefined;
}

export function inferArmored(queryText: string): boolean | undefined {
  return normalize(queryText).includes("blind") ? true : undefined;
}

export function inferPriceMax(queryText: string): number | undefined {
  // "até 500 mil" / "ate 500mil" / "500k"
  const milMatch = queryText.match(/(\d[\d.,]*)\s*mil/);
  if (milMatch) return Math.round(parseFloat(milMatch[1].replace(",", ".")) * 1_000);
  const kMatch = queryText.match(/(\d[\d.,]*)\s*k\b/);
  if (kMatch) return Math.round(parseFloat(kMatch[1].replace(",", ".")) * 1_000);
  return undefined;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
