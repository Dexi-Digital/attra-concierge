import test from "node:test";
import assert from "node:assert/strict";
import { seedVehicles } from "../../integrations/stock/stock-fixtures.js";
import { searchVehicles } from "./vehicle-query.service.js";

test("searchVehicles retorna apenas veículos disponíveis e limita o volume", () => {
  const response = searchVehicles(seedVehicles, {});

  assert.equal(response.results.length, 3);
  assert.equal(response.total, 3);
  assert.ok(response.results.every((item) => item.vehicle.available));
});

test("searchVehicles aplica filtros combinados", () => {
  const response = searchVehicles(seedVehicles, {
    brand: "Porsche",
    bodyType: "SUV"
  });

  assert.equal(response.total, 1);
  assert.equal(response.results[0]?.vehicle.id, "veh-porsche-cayenne-hybrid");
});

test("searchVehicles explica vazio quando não encontra match", () => {
  const response = searchVehicles(seedVehicles, {
    brand: "Ferrari"
  });

  assert.equal(response.total, 0);
  assert.equal(response.emptyReason, "Nenhum veículo disponível combinou com os filtros informados.");
});