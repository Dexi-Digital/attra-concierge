import test from "node:test";
import assert from "node:assert/strict";
import type { VehicleRecord } from "@attra/shared";
import { buildVehicleHighlights, buildVehicleSearchResult } from "./vehicle-profiles.js";

const baseVehicle: VehicleRecord = {
  id: "veh-test-001",
  externalStockId: "TEST-001",
  brand: "Porsche",
  model: "Cayenne",
  version: "S",
  title: "Porsche Cayenne S 2024",
  yearModel: 2024,
  price: 750_000,
  mileageKm: 5_000,
  fuelType: "Gasolina",
  transmission: "Automático",
  bodyType: "SUV",
  armored: false,
  color: "Preto",
  storeUnit: "São Paulo",
  available: true,
  vehicleUrl: "https://attraveiculos.com.br/veiculo/test-001",
  mainImageUrl: "https://cdn.attra.com.br/test-001.jpg",
  imageUrls: ["https://cdn.attra.com.br/test-001.jpg"],
  usageProfile: "uso_diario",
  positioningProfile: "esportivo_premium"
};

test("buildVehicleHighlights retorna 4 highlights com labels corretos", () => {
  const highlights = buildVehicleHighlights(baseVehicle);
  assert.equal(highlights.length, 4);
  const labels = highlights.map((h) => h.label);
  assert.ok(labels.includes("Preço"));
  assert.ok(labels.includes("Quilometragem"));
  assert.ok(labels.includes("Uso"));
  assert.ok(labels.includes("Unidade"));
});

test("buildVehicleHighlights formata preço em Real (pt-BR)", () => {
  const highlights = buildVehicleHighlights(baseVehicle);
  const priceHL = highlights.find((h) => h.label === "Preço");
  assert.ok(priceHL !== undefined);
  assert.ok(priceHL.value.startsWith("R$ "), `Esperado começar com 'R$ ', mas foi: ${priceHL.value}`);
  assert.ok(priceHL.value.includes("750"), `Esperado conter '750', mas foi: ${priceHL.value}`);
});

test("buildVehicleHighlights formata quilometragem com 'km'", () => {
  const highlights = buildVehicleHighlights(baseVehicle);
  const kmHL = highlights.find((h) => h.label === "Quilometragem");
  assert.ok(kmHL !== undefined);
  assert.ok(kmHL.value.endsWith(" km"), `Esperado terminar com ' km', mas foi: ${kmHL.value}`);
});

test("buildVehicleHighlights usa usageProfile quando disponível", () => {
  const highlights = buildVehicleHighlights(baseVehicle);
  const usoHL = highlights.find((h) => h.label === "Uso");
  assert.ok(usoHL !== undefined);
  assert.equal(usoHL.value, "uso_diario");
});

test("buildVehicleHighlights usa fallback quando usageProfile é undefined", () => {
  const vehicle: VehicleRecord = { ...baseVehicle, usageProfile: undefined };
  const highlights = buildVehicleHighlights(vehicle);
  const usoHL = highlights.find((h) => h.label === "Uso");
  assert.ok(usoHL !== undefined);
  assert.equal(usoHL.value, "perfil não classificado");
});

test("buildVehicleHighlights exibe storeUnit corretamente", () => {
  const highlights = buildVehicleHighlights(baseVehicle);
  const unitHL = highlights.find((h) => h.label === "Unidade");
  assert.ok(unitHL !== undefined);
  assert.equal(unitHL.value, "São Paulo");
});

test("buildVehicleSearchResult retorna vehicle, matchReason e highlights corretamente", () => {
  const matchReason = "Atende critérios de SUV esportivo";
  const result = buildVehicleSearchResult(baseVehicle, matchReason);

  assert.deepEqual(result.vehicle, baseVehicle);
  assert.equal(result.matchReason, matchReason);
  assert.ok(Array.isArray(result.highlights));
  assert.ok(result.highlights.length > 0);
});

test("buildVehicleSearchResult delega highlights para buildVehicleHighlights", () => {
  const result = buildVehicleSearchResult(baseVehicle, "match reason");
  const directHighlights = buildVehicleHighlights(baseVehicle);
  assert.deepEqual(result.highlights, directHighlights);
});

