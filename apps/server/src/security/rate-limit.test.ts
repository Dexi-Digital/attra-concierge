import test from "node:test";
import assert from "node:assert/strict";
import { checkGlobalRateLimit, checkWriteRateLimit, getRateLimitHeaders } from "./rate-limit.js";

// Usamos IDs únicos para isolar cada teste do estado compartilhado do módulo
function uid(): string {
  return `test-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

test("checkGlobalRateLimit permite primeira requisição", () => {
  const result = checkGlobalRateLimit(uid());
  assert.equal(result.allowed, true);
  assert.equal(result.remaining, 59); // 60 - 1
  assert.ok(result.resetInMs > 0);
});

test("checkGlobalRateLimit acumula contagem na mesma janela", () => {
  const id = uid();
  checkGlobalRateLimit(id); // 1ª
  const result = checkGlobalRateLimit(id); // 2ª
  assert.equal(result.allowed, true);
  assert.equal(result.remaining, 58); // 60 - 2
});

test("checkWriteRateLimit permite primeira requisição de escrita", () => {
  const result = checkWriteRateLimit(uid());
  assert.equal(result.allowed, true);
  assert.equal(result.remaining, 9); // 10 - 1
});

test("checkWriteRateLimit bloqueia após 10 requisições na mesma janela", () => {
  const id = uid();
  for (let i = 0; i < 10; i++) {
    checkWriteRateLimit(id);
  }
  const result = checkWriteRateLimit(id);
  assert.equal(result.allowed, false);
  assert.equal(result.remaining, 0);
  assert.ok(result.resetInMs > 0);
});

test("checkGlobalRateLimit e checkWriteRateLimit usam buckets separados", () => {
  const id = uid();
  // Esgota limite de escrita (10)
  for (let i = 0; i < 10; i++) checkWriteRateLimit(id);
  const writeResult = checkWriteRateLimit(id);
  assert.equal(writeResult.allowed, false);

  // Limite global não deve ser afetado
  const globalResult = checkGlobalRateLimit(id);
  assert.equal(globalResult.allowed, true);
});

test("getRateLimitHeaders retorna headers corretos", () => {
  const headers = getRateLimitHeaders({ allowed: true, remaining: 42, resetInMs: 30_000 });
  assert.equal(headers["X-RateLimit-Remaining"], "42");
  assert.equal(headers["X-RateLimit-Reset"], "30");
});

test("getRateLimitHeaders arredonda resetInMs para cima", () => {
  const headers = getRateLimitHeaders({ allowed: true, remaining: 0, resetInMs: 59_001 });
  assert.equal(headers["X-RateLimit-Reset"], "60");
});

