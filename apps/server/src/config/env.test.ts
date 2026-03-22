import test from "node:test";
import assert from "node:assert/strict";
import { readEnv } from "./env.js";

test("readEnv usa valores padrão quando env está vazio", () => {
  const env = readEnv({});
  assert.equal(env.nodeEnv, "development");
  assert.equal(env.appHost, "0.0.0.0");
  assert.equal(env.appPort, 3000);
  assert.equal(env.appBaseUrl, "http://localhost:3000");
  assert.equal(env.webBaseUrl, "http://localhost:5173");
  assert.equal(env.autoconfBaseUrl, "https://api.autoconf.com.br");
  assert.equal(env.autoconfAuthToken, "");
  assert.equal(env.autoconfRevendaToken, "");
  assert.equal(env.mcpAuthRequired, false);
  assert.equal(env.mcpApiKeys, undefined);
  assert.equal(env.jwtSecret, undefined);
  assert.equal(env.oauthClientId, undefined);
  assert.equal(env.oauthRedirectUri, undefined);
});

test("readEnv lê variáveis de ambiente corretamente", () => {
  const env = readEnv({
    NODE_ENV: "production",
    APP_HOST: "127.0.0.1",
    APP_PORT: "8080",
    APP_BASE_URL: "https://example.com",
    WEB_BASE_URL: "https://web.example.com",
    AUTOCONF_BASE_URL: "https://autoconf.example.com",
    AUTOCONF_AUTH_TOKEN: "token123",
    AUTOCONF_REVENDA_TOKEN: "revenda456",
    HANDOFF_WEBHOOK_URL: "https://webhook.example.com",
    MCP_API_KEYS: "key1:scope1,scope2",
    MCP_AUTH_REQUIRED: "true",
    JWT_SECRET: "supersecret",
    OAUTH_CLIENT_ID: "client-abc",
    OAUTH_REDIRECT_URI: "https://chatgpt.com/callback"
  });

  assert.equal(env.nodeEnv, "production");
  assert.equal(env.appHost, "127.0.0.1");
  assert.equal(env.appPort, 8080);
  assert.equal(env.appBaseUrl, "https://example.com");
  assert.equal(env.webBaseUrl, "https://web.example.com");
  assert.equal(env.autoconfBaseUrl, "https://autoconf.example.com");
  assert.equal(env.autoconfAuthToken, "token123");
  assert.equal(env.autoconfRevendaToken, "revenda456");
  assert.equal(env.handoffWebhookUrl, "https://webhook.example.com");
  assert.equal(env.mcpApiKeys, "key1:scope1,scope2");
  assert.equal(env.mcpAuthRequired, true);
  assert.equal(env.jwtSecret, "supersecret");
  assert.equal(env.oauthClientId, "client-abc");
  assert.equal(env.oauthRedirectUri, "https://chatgpt.com/callback");
});

test("readEnv mcpAuthRequired é false quando MCP_AUTH_REQUIRED não é 'true'", () => {
  const env = readEnv({ MCP_AUTH_REQUIRED: "false" });
  assert.equal(env.mcpAuthRequired, false);

  const env2 = readEnv({ MCP_AUTH_REQUIRED: "1" });
  assert.equal(env2.mcpAuthRequired, false);
});

test("readEnv converte APP_PORT para número", () => {
  const env = readEnv({ APP_PORT: "9090" });
  assert.equal(typeof env.appPort, "number");
  assert.equal(env.appPort, 9090);
});

