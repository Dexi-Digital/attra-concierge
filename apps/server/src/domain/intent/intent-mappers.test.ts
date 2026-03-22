import test from "node:test";
import assert from "node:assert/strict";
import {
  inferBrand,
  inferBodyType,
  inferUsageProfile,
  inferPositioningProfile,
  inferArmored,
  inferPriceMax
} from "./intent-mappers.js";

// ── inferBrand ──────────────────────────────────────────────────────
test("inferBrand detecta Porsche na query", () => {
  assert.equal(inferBrand("quero um Porsche SUV"), "Porsche");
});

test("inferBrand detecta BMW na query", () => {
  assert.equal(inferBrand("procuro um BMW série 5"), "BMW");
});

test("inferBrand detecta Mercedes-Benz na query", () => {
  assert.equal(inferBrand("Mercedes-Benz GLE 2024"), "Mercedes-Benz");
});

test("inferBrand retorna undefined para marca desconhecida", () => {
  assert.equal(inferBrand("quero um carro econômico"), undefined);
});

test("inferBrand é case-insensitive via normalização", () => {
  assert.equal(inferBrand("porsche 911"), "Porsche");
  assert.equal(inferBrand("bmw x5"), "BMW");
});

// ── inferBodyType ───────────────────────────────────────────────────
test("inferBodyType detecta SUV", () => {
  assert.equal(inferBodyType("quero um SUV espaçoso"), "SUV");
});

test("inferBodyType detecta Sedan", () => {
  assert.equal(inferBodyType("preciso de um Sedan executivo"), "Sedan");
});

test("inferBodyType detecta Coupé via normalização", () => {
  assert.equal(inferBodyType("gosto de Coupe esportivo"), "Coupé");
});

test("inferBodyType retorna undefined para carroceria não reconhecida", () => {
  assert.equal(inferBodyType("carro qualquer"), undefined);
});

// ── inferUsageProfile ───────────────────────────────────────────────
test("inferUsageProfile detecta uso diario", () => {
  assert.equal(inferUsageProfile("preciso para dia a dia"), "uso_diario");
  assert.equal(inferUsageProfile("uso diario para trabalho"), "uso_diario");
});

test("inferUsageProfile detecta familia executiva", () => {
  assert.equal(inferUsageProfile("carro para a familia"), "familia_executiva");
});

test("inferUsageProfile detecta executivo", () => {
  assert.equal(inferUsageProfile("carro executivo de luxo"), "executivo");
  assert.equal(inferUsageProfile("perfil executiva premium"), "executivo");
});

test("inferUsageProfile retorna undefined quando não há match", () => {
  assert.equal(inferUsageProfile("quero um carro esportivo"), undefined);
});

// ── inferPositioningProfile ─────────────────────────────────────────
test("inferPositioningProfile detecta esportivo premium", () => {
  assert.equal(inferPositioningProfile("carro esportivo de alta performance"), "esportivo_premium");
});

test("inferPositioningProfile detecta premium equilibrado", () => {
  assert.equal(inferPositioningProfile("quero algo equilibrado"), "premium_equilibrado");
});

test("inferPositioningProfile retorna undefined quando não há match", () => {
  assert.equal(inferPositioningProfile("algo simples"), undefined);
});

// ── inferArmored ────────────────────────────────────────────────────
test("inferArmored retorna true quando menciona blindagem", () => {
  assert.equal(inferArmored("quero carro blindado"), true);
  assert.equal(inferArmored("blindagem nivel 3"), true);
});

test("inferArmored retorna undefined sem menção a blindagem", () => {
  assert.equal(inferArmored("carro seguro"), undefined);
});

// ── inferPriceMax ───────────────────────────────────────────────────
test("inferPriceMax detecta 'X mil'", () => {
  assert.equal(inferPriceMax("até 500 mil"), 500_000);
  assert.equal(inferPriceMax("ate 250mil"), 250_000);
});

test("inferPriceMax detecta '500k'", () => {
  assert.equal(inferPriceMax("até 500k"), 500_000);
  assert.equal(inferPriceMax("budget de 300k"), 300_000);
});

test("inferPriceMax detecta valores com vírgula decimal", () => {
  assert.equal(inferPriceMax("até 1,5 mil"), 1_500);
});

test("inferPriceMax retorna undefined quando não há preço na query", () => {
  assert.equal(inferPriceMax("quero um SUV"), undefined);
});

