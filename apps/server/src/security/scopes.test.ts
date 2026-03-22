import test from "node:test";
import assert from "node:assert/strict";
import {
  SCOPES,
  TOOL_REQUIRED_SCOPES,
  ALL_SCOPES,
  ALL_SUPPORTED_SCOPES,
  OIDC_SCOPES,
  hasRequiredScopes
} from "./scopes.js";

test("SCOPES contém todos os escopos esperados", () => {
  assert.equal(SCOPES.INVENTORY_READ, "attra.inventory.read");
  assert.equal(SCOPES.VEHICLE_READ, "attra.vehicle.read");
  assert.equal(SCOPES.COMPARE_READ, "attra.compare.read");
  assert.equal(SCOPES.PURCHASE_PATH_READ, "attra.purchase_path.read");
  assert.equal(SCOPES.HANDOFF_WRITE, "attra.handoff.write");
});

test("TOOL_REQUIRED_SCOPES mapeia todas as tools", () => {
  assert.deepEqual(TOOL_REQUIRED_SCOPES.searchInventory, [SCOPES.INVENTORY_READ]);
  assert.deepEqual(TOOL_REQUIRED_SCOPES.getVehicleDetails, [SCOPES.VEHICLE_READ]);
  assert.deepEqual(TOOL_REQUIRED_SCOPES.compareVehicles, [SCOPES.COMPARE_READ]);
  assert.deepEqual(TOOL_REQUIRED_SCOPES.previewPurchasePath, [SCOPES.PURCHASE_PATH_READ]);
  assert.deepEqual(TOOL_REQUIRED_SCOPES.startConsultantHandoff, [SCOPES.HANDOFF_WRITE]);
});

test("ALL_SCOPES contém exatamente os 5 escopos de negócio", () => {
  assert.equal(ALL_SCOPES.length, 5);
  assert.ok(ALL_SCOPES.includes(SCOPES.INVENTORY_READ));
  assert.ok(ALL_SCOPES.includes(SCOPES.VEHICLE_READ));
  assert.ok(ALL_SCOPES.includes(SCOPES.COMPARE_READ));
  assert.ok(ALL_SCOPES.includes(SCOPES.PURCHASE_PATH_READ));
  assert.ok(ALL_SCOPES.includes(SCOPES.HANDOFF_WRITE));
});

test("ALL_SUPPORTED_SCOPES inclui escopos OIDC além dos de negócio", () => {
  for (const scope of ALL_SCOPES) {
    assert.ok(ALL_SUPPORTED_SCOPES.includes(scope));
  }
  for (const scope of OIDC_SCOPES) {
    assert.ok(ALL_SUPPORTED_SCOPES.includes(scope));
  }
});

test("hasRequiredScopes retorna true quando todos os escopos estão presentes", () => {
  const granted = [SCOPES.INVENTORY_READ, SCOPES.VEHICLE_READ, SCOPES.HANDOFF_WRITE];
  assert.equal(hasRequiredScopes(granted, [SCOPES.INVENTORY_READ]), true);
  assert.equal(hasRequiredScopes(granted, [SCOPES.INVENTORY_READ, SCOPES.VEHICLE_READ]), true);
});

test("hasRequiredScopes retorna false quando algum escopo está faltando", () => {
  const granted = [SCOPES.INVENTORY_READ];
  assert.equal(hasRequiredScopes(granted, [SCOPES.VEHICLE_READ]), false);
  assert.equal(hasRequiredScopes(granted, [SCOPES.INVENTORY_READ, SCOPES.HANDOFF_WRITE]), false);
});

test("hasRequiredScopes retorna true para lista vazia de escopos requeridos", () => {
  assert.equal(hasRequiredScopes([], []), true);
  assert.equal(hasRequiredScopes([SCOPES.INVENTORY_READ], []), true);
});

