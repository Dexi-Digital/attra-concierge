import test from "node:test";
import assert from "node:assert/strict";
import { parseSearchIntent } from "./intent-parser.js";

test("parseSearchIntent infere marca, carroceria e perfis pela query", () => {
  const parsed = parseSearchIntent({
    queryText: "quero um porsche suv para dia a dia"
  });

  assert.equal(parsed.filters.brand, "Porsche");
  assert.equal(parsed.filters.bodyType, "SUV");
  assert.equal(parsed.filters.usageProfile, "uso_diario");
  assert.deepEqual(parsed.inferredFromQuery.sort(), ["bodyType", "brand", "usageProfile"]);
});

test("parseSearchIntent preserva filtros explícitos quando já informados", () => {
  const parsed = parseSearchIntent({
    queryText: "quero um bmw blindado",
    brand: "Porsche",
    armored: false
  });

  assert.equal(parsed.filters.brand, "Porsche");
  assert.equal(parsed.filters.armored, false);
});