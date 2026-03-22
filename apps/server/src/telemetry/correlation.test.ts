import test from "node:test";
import assert from "node:assert/strict";
import { generateCorrelationId } from "./correlation.js";

test("generateCorrelationId retorna string não vazia", () => {
  const id = generateCorrelationId();
  assert.ok(typeof id === "string" && id.length > 0);
});

test("generateCorrelationId começa com 'mcp-'", () => {
  const id = generateCorrelationId();
  assert.ok(id.startsWith("mcp-"), `Esperado começar com 'mcp-', mas foi: ${id}`);
});

test("generateCorrelationId tem formato mcp-<ts>-<rand>-<counter>", () => {
  const id = generateCorrelationId();
  const parts = id.split("-");
  // "mcp", timestamp-base36, rand-hex, counter
  assert.ok(parts.length >= 4, `Formato inesperado: ${id}`);
  assert.equal(parts[0], "mcp");
});

test("generateCorrelationId gera IDs únicos em chamadas consecutivas", () => {
  const ids = new Set(Array.from({ length: 100 }, () => generateCorrelationId()));
  assert.ok(ids.size > 90, "Esperava pelo menos 90 IDs únicos em 100 chamadas");
});

test("generateCorrelationId incrementa o counter corretamente", () => {
  // Verifica que IDs gerados em sequência têm counters crescentes (exceto ao dar overflow)
  const a = generateCorrelationId();
  const b = generateCorrelationId();
  const counterA = parseInt(a.split("-").at(-1)!, 10);
  const counterB = parseInt(b.split("-").at(-1)!, 10);
  // B deve ser exatamente 1 a mais que A (ou ambos perto de 0 devido ao módulo)
  assert.ok(
    counterB === counterA + 1 || (counterA === 99_999 && counterB === 0),
    `Contadores fora de ordem: ${counterA}, ${counterB}`
  );
});

