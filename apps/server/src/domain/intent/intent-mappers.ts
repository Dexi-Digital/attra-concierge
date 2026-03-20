const brandDictionary = ["Porsche", "BMW", "Mercedes-Benz"];
const bodyTypeDictionary = ["SUV", "Sedan", "Coupé"];

export function inferBrand(queryText: string): string | undefined {
  return brandDictionary.find((brand) => queryText.includes(normalize(brand)));
}

export function inferBodyType(queryText: string): string | undefined {
  return bodyTypeDictionary.find((bodyType) => queryText.includes(normalize(bodyType)));
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
  return queryText.includes("blindad") ? true : undefined;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
