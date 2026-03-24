import test from "node:test";
import assert from "node:assert/strict";
import { extractBearerToken, validateToken, assertScopes } from "./oauth.js";
import type { TokenClaims } from "./oauth.js";
import { SCOPES } from "./scopes.js";

// Garante ambiente de dev (não-production) para testes de token anônimo
process.env.NODE_ENV = "development";
process.env.MCP_AUTH_REQUIRED = "false";
delete process.env.MCP_API_KEYS;

test("extractBearerToken retorna null quando sem header", () => {
  assert.equal(extractBearerToken(undefined), null);
  assert.equal(extractBearerToken(""), null);
});

test("extractBearerToken extrai token de header Bearer válido", () => {
  assert.equal(extractBearerToken("Bearer my-token-123"), "my-token-123");
  assert.equal(extractBearerToken("bearer lowercase-token"), "lowercase-token");
});

test("extractBearerToken retorna null para header sem prefixo Bearer", () => {
  assert.equal(extractBearerToken("Basic user:pass"), null);
  assert.equal(extractBearerToken("my-token-without-prefix"), null);
});

test("validateToken permite acesso anônimo em dev sem auth obrigatória", () => {
  const result = validateToken(undefined);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.claims.sub, "anonymous_dev");
    assert.ok(result.claims.scopes.length > 0);
  }
});

test("validateToken rejeita JWT inválido", () => {
  // JWT com 3 segmentos mas assinatura inválida
  const fakeJwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.invalidsignature";
  const result = validateToken(`Bearer ${fakeJwt}`);
  assert.equal(result.ok, false);
});

test("validateToken rejeita token opaco quando não há registry configurado", () => {
  // Sem MCP_API_KEYS: tokens não-JWT devem ser rejeitados.
  // Aceitar com scopes:[] causaria falha silenciosa no scope-check de todas as tools.
  // Acesso anônimo só é liberado quando NENHUM token é enviado (modo dev, sem auth obrigatória).
  const result = validateToken("Bearer simple-api-key-not-jwt");
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.statusCode, 401);
  }
});

test("assertScopes retorna ok=true quando todos os escopos estão presentes", () => {
  const claims: TokenClaims = {
    sub: "user",
    scopes: [SCOPES.INVENTORY_READ, SCOPES.VEHICLE_READ, SCOPES.HANDOFF_WRITE]
  };
  const result = assertScopes(claims, [SCOPES.INVENTORY_READ, SCOPES.VEHICLE_READ]);
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
});

test("assertScopes retorna ok=false com escopos faltando", () => {
  const claims: TokenClaims = {
    sub: "user",
    scopes: [SCOPES.INVENTORY_READ]
  };
  const result = assertScopes(claims, [SCOPES.INVENTORY_READ, SCOPES.HANDOFF_WRITE]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, [SCOPES.HANDOFF_WRITE]);
});

test("assertScopes retorna ok=true para lista vazia de required", () => {
  const claims: TokenClaims = { sub: "user", scopes: [] };
  const result = assertScopes(claims, []);
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
});

