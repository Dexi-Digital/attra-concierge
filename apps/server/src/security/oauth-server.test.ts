import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  verifyPkce,
  generateAuthCode,
  exchangeAuthCode,
  generateAccessToken,
  verifyAccessToken,
  generateIdToken
} from "./oauth-server.js";
import type { Scope } from "./scopes.js";

// Configurar JWT_SECRET para os testes
process.env.JWT_SECRET = "test-secret-for-unit-tests";
process.env.APP_BASE_URL = "http://localhost:3000";

const TEST_SCOPES: Scope[] = ["attra.inventory.read", "attra.vehicle.read"];

test("verifyPkce valida corretamente com método S256", () => {
  const verifier = "my-code-verifier-random-string-abc123";
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  assert.equal(verifyPkce(verifier, challenge, "S256"), true);
});

test("verifyPkce falha com verifier incorreto (S256)", () => {
  const challenge = createHash("sha256").update("correct-verifier").digest("base64url");
  assert.equal(verifyPkce("wrong-verifier", challenge, "S256"), false);
});

test("verifyPkce valida corretamente com método plain", () => {
  assert.equal(verifyPkce("my-verifier", "my-verifier", "plain"), true);
  assert.equal(verifyPkce("my-verifier", "wrong", "plain"), false);
});

test("generateAuthCode e exchangeAuthCode funcionam corretamente com PKCE S256", () => {
  const verifier = "code-verifier-test-abc123xyz";
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  const code = generateAuthCode({
    clientId: "test-client",
    redirectUri: "https://example.com/callback",
    scopes: TEST_SCOPES,
    codeChallenge: challenge,
    codeChallengeMethod: "S256",
    sub: "user@test.com",
    email: "user@test.com",
    name: "Usuário Teste"
  });

  assert.ok(typeof code === "string" && code.length > 0);

  const result = exchangeAuthCode({
    code,
    redirectUri: "https://example.com/callback",
    codeVerifier: verifier,
    clientId: "test-client"
  });

  assert.ok(result !== null);
  assert.equal(result!.sub, "user@test.com");
  assert.equal(result!.email, "user@test.com");
  assert.equal(result!.name, "Usuário Teste");
  assert.deepEqual(result!.scopes, TEST_SCOPES);
});

test("exchangeAuthCode retorna null para code inválido", () => {
  const result = exchangeAuthCode({
    code: "invalid-code-that-doesnt-exist",
    redirectUri: "https://example.com/callback",
    codeVerifier: "any-verifier",
    clientId: "test-client"
  });
  assert.equal(result, null);
});

test("exchangeAuthCode é single-use (code é consumido)", () => {
  const verifier = "single-use-verifier-abc";
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  const code = generateAuthCode({
    clientId: "client1",
    redirectUri: "https://example.com/cb",
    scopes: TEST_SCOPES,
    codeChallenge: challenge,
    codeChallengeMethod: "S256",
    sub: "u1",
    email: "u1@test.com"
  });

  const r1 = exchangeAuthCode({ code, redirectUri: "https://example.com/cb", codeVerifier: verifier, clientId: "client1" });
  const r2 = exchangeAuthCode({ code, redirectUri: "https://example.com/cb", codeVerifier: verifier, clientId: "client1" });

  assert.ok(r1 !== null);
  assert.equal(r2, null);
});

test("generateAccessToken e verifyAccessToken funcionam corretamente", () => {
  const token = generateAccessToken({
    sub: "user123",
    email: "user@example.com",
    name: "Test User",
    scopes: ["attra.inventory.read"]
  });

  assert.ok(typeof token === "string");
  assert.equal(token.split(".").length, 3);

  const payload = verifyAccessToken(token);
  assert.ok(payload !== null);
  assert.equal(payload!.sub, "user123");
  assert.equal(payload!.email, "user@example.com");
  assert.equal(payload!.name, "Test User");
  assert.deepEqual(payload!.scopes, ["attra.inventory.read"]);
});

test("verifyAccessToken retorna null para token inválido", () => {
  assert.equal(verifyAccessToken("invalid.token.here"), null);
  assert.equal(verifyAccessToken("not-a-jwt"), null);
});

test("generateIdToken gera token OIDC com aud e nonce", () => {
  const token = generateIdToken({
    sub: "user@example.com",
    email: "user@example.com",
    name: "Test",
    aud: "my-client-id",
    nonce: "random-nonce"
  });
  assert.ok(typeof token === "string");
  assert.equal(token.split(".").length, 3);

  // Decodifica payload (não verifica assinatura aqui, apenas estrutura)
  const payloadRaw = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  assert.equal(payloadRaw.sub, "user@example.com");
  assert.equal(payloadRaw.aud, "my-client-id");
  assert.equal(payloadRaw.nonce, "random-nonce");
});

