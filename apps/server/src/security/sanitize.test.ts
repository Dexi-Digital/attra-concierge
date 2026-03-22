import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeText, sanitizeTextArray, truncate, sanitizeField, TEXT_LIMITS } from "./sanitize.js";

test("sanitizeText remove tags HTML", () => {
  assert.equal(sanitizeText("<b>negrito</b>"), "negrito");
  assert.equal(sanitizeText("<script>alert(1)</script>texto"), "texto");
  assert.equal(sanitizeText("<img src='x' onerror='bad'>"), "");
});

test("sanitizeText remove event handlers inline", () => {
  assert.equal(sanitizeText("texto onclick=alert(1)"), "texto alert(1)");
  assert.equal(sanitizeText("botão onmouseover='hack()'"), "botão 'hack()'");
});

test("sanitizeText remove protocolo javascript:", () => {
  assert.equal(sanitizeText("javascript:alert(1)"), "alert(1)");
  assert.equal(sanitizeText("JAVASCRIPT: void(0)"), "void(0)");
});

test("sanitizeText remove caracteres de controle", () => {
  const withControl = "texto\u0000invalido\u001Ffim";
  const result = sanitizeText(withControl);
  assert.ok(!result.includes("\u0000"));
  assert.ok(!result.includes("\u001F"));
  assert.equal(result, "textoinvalidofim");
});

test("sanitizeText normaliza espaços excessivos", () => {
  assert.equal(sanitizeText("texto    com   espaços"), "texto com espaços");
  assert.equal(sanitizeText("  leading and trailing  "), "leading and trailing");
});

test("sanitizeText preserva texto limpo sem modificações", () => {
  const clean = "Quero um Porsche SUV até 500 mil";
  assert.equal(sanitizeText(clean), clean);
});

test("sanitizeTextArray sanitiza cada elemento do array", () => {
  const result = sanitizeTextArray(["<b>bold</b>", "texto limpo", "javascript:void"]);
  assert.equal(result[0], "bold");
  assert.equal(result[1], "texto limpo");
  assert.equal(result[2], "void");
});

test("truncate retorna string original quando dentro do limite", () => {
  assert.equal(truncate("curto", 100), "curto");
  assert.equal(truncate("exato", 5), "exato");
});

test("truncate corta string e adiciona reticências quando excede limite", () => {
  const result = truncate("string muito longa para o limite", 10);
  assert.ok(result.endsWith("…"));
  assert.ok(result.length <= 11); // 10 chars + ellipsis
});

test("sanitizeField retorna undefined para valor vazio", () => {
  assert.equal(sanitizeField(undefined, 100), undefined);
  assert.equal(sanitizeField("", 100), undefined);
  assert.equal(sanitizeField("   ", 100), undefined);
});

test("sanitizeField retorna undefined para valor que vira vazio após sanitização", () => {
  assert.equal(sanitizeField("<b></b>", 100), undefined);
});

test("sanitizeField sanitiza e trunca corretamente", () => {
  const result = sanitizeField("<b>texto válido</b>", 100);
  assert.equal(result, "texto válido");

  const long = sanitizeField("a".repeat(500), 10);
  assert.ok(long !== undefined && long.length <= 11);
});

test("TEXT_LIMITS possui todos os campos esperados", () => {
  assert.ok(typeof TEXT_LIMITS.conversationSummary === "number");
  assert.ok(typeof TEXT_LIMITS.intendedUse === "number");
  assert.ok(typeof TEXT_LIMITS.tradeInDescription === "number");
  assert.ok(typeof TEXT_LIMITS.customerName === "number");
  assert.ok(typeof TEXT_LIMITS.contactValue === "number");
  assert.ok(typeof TEXT_LIMITS.city === "number");
  assert.ok(typeof TEXT_LIMITS.customerQuestion === "number");
  assert.ok(typeof TEXT_LIMITS.queryText === "number");
});

