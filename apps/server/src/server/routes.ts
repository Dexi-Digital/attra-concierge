import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "node:fs";
import path from "node:path";
import type { AnalyticsEventType } from "@attra/shared";
import { appConfig } from "../config/app-config.js";
import { registerTools } from "../mcp/register-tools.js";
import { handleMcpRequest } from "../mcp/server.js";
import { trackEvent, getAnalyticsSummary } from "../domain/analytics/analytics.service.js";
import { logger } from "../telemetry/logger.js";
import { badRequest } from "../utils/app-error.js";
import { sendError, sendJson } from "./error-handler.js";
import type { ToolName } from "../mcp/tool-metadata.js";
import { generateAuthCode, exchangeAuthCode, generateAccessToken, generateIdToken, verifyAccessToken } from "../security/oauth-server.js";
import { ALL_SCOPES, ALL_SUPPORTED_SCOPES, type Scope } from "../security/scopes.js";

// Pasta do build da web app (apps/web/dist), relativa ao CWD do server (apps/server)
const WEB_DIST = path.resolve(process.cwd(), "../web/dist");

const MIME: Record<string, string> = {
  ".html":  "text/html; charset=utf-8",
  ".js":    "application/javascript; charset=utf-8",
  ".css":   "text/css; charset=utf-8",
  ".png":   "image/png",
  ".jpg":   "image/jpeg",
  ".jpeg":  "image/jpeg",
  ".svg":   "image/svg+xml",
  ".ico":   "image/x-icon",
  ".woff2": "font/woff2",
  ".woff":  "font/woff",
  ".json":  "application/json",
};

function serveStaticFile(response: ServerResponse, urlPathname: string): boolean {
  if (!fs.existsSync(WEB_DIST)) return false;

  let filePath = path.join(WEB_DIST, urlPathname);

  // Para rotas SPA sem extensão → servir index.html
  if (!path.extname(filePath) || !fs.existsSync(filePath)) {
    filePath = path.join(WEB_DIST, "index.html");
  }

  if (!fs.existsSync(filePath)) return false;

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";
  const content = fs.readFileSync(filePath);

  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
  });
  response.end(content);
  return true;
}

const tools = registerTools();

function setCorsHeaders(response: ServerResponse): void {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export async function routeRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  setCorsHeaders(response);

  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", appConfig.env.appBaseUrl);

  if (method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  // MCP Streamable HTTP endpoint (JSON-RPC 2.0)
  if (method === "POST" && url.pathname === "/mcp") {
    await handleMcpRequest(request, response);
    return;
  }

  // OAuth 2.1 Authorization Server Metadata (RFC 8414)
  if (method === "GET" && url.pathname === "/.well-known/oauth-authorization-server") {
    const base = appConfig.env.appBaseUrl;
    sendJson(response, 200, {
      issuer: base,
      authorization_endpoint: `${base}/oauth/authorize`,
      token_endpoint: `${base}/oauth/token`,
      userinfo_endpoint: `${base}/oauth/userinfo`,
      scopes_supported: ALL_SUPPORTED_SCOPES,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["HS256"],
    });
    return;
  }

  // OIDC Discovery Document (OpenID Provider Metadata — RFC 8414 + OIDC Core)
  if (method === "GET" && url.pathname === "/.well-known/openid-configuration") {
    const base = appConfig.env.appBaseUrl;
    sendJson(response, 200, {
      issuer: base,
      authorization_endpoint: `${base}/oauth/authorize`,
      token_endpoint: `${base}/oauth/token`,
      userinfo_endpoint: `${base}/oauth/userinfo`,
      scopes_supported: ALL_SUPPORTED_SCOPES,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["HS256"],
      claims_supported: ["sub", "email", "name", "iss", "aud", "iat", "exp"],
    });
    return;
  }

  // OIDC UserInfo endpoint (Bearer-protected)
  if (method === "GET" && url.pathname === "/oauth/userinfo") {
    handleOAuthUserInfo(request, response);
    return;
  }

  // OAuth 2.1 — Authorization endpoint (GET: show consent page)
  if (method === "GET" && url.pathname === "/oauth/authorize") {
    handleOAuthAuthorizeGet(url, response);
    return;
  }

  // OAuth 2.1 — Authorization endpoint (POST: user submits consent form)
  if (method === "POST" && url.pathname === "/oauth/authorize") {
    await handleOAuthAuthorizePost(request, url, response);
    return;
  }

  // OAuth 2.1 — Token endpoint (POST: exchange code for access token)
  if (method === "POST" && url.pathname === "/oauth/token") {
    await handleOAuthToken(request, response);
    return;
  }

  if (method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, {
      status: "ok",
      app: appConfig.name,
      version: appConfig.version,
      tools: tools.length
    });
    return;
  }

  if (method === "GET" && url.pathname === "/tools") {
    sendJson(response, 200, {
      tools: tools.map(({ execute, inputSchema, ...tool }) => tool)
    });
    return;
  }

  if (method === "GET" && url.pathname === "/analytics") {
    sendJson(response, 200, getAnalyticsSummary());
    return;
  }

  if (method === "POST" && url.pathname.startsWith("/tools/")) {
    const toolName = url.pathname.replace("/tools/", "");
    const tool = tools.find((item) => item.name === toolName);

    if (!tool) {
      sendError(response, 404, `Tool ${toolName} não encontrada.`);
      return;
    }

    const body = await readJsonBody(request);
    const sessionId = (typeof body === "object" && body !== null && "sessionId" in body)
      ? String((body as Record<string, unknown>).sessionId)
      : "anonymous";

    const parsedInput = tool.inputSchema.safeParse(body);

    if (!parsedInput.success) {
      sendJson(response, 400, {
        error: "Entrada inválida.",
        details: parsedInput.error.flatten()
      });
      return;
    }

    const startEvent = toolToStartEvent(tool.name as ToolName);
    if (startEvent) {
      trackEvent({ eventType: startEvent, sessionId, toolName: tool.name });
    }

    const start = Date.now();
    try {
      const result = await tool.execute(parsedInput.data);
      const durationMs = Date.now() - start;
      logger.toolCall(tool.name, durationMs, { sessionId });

      const endEvent = toolToEndEvent(tool.name as ToolName);
      if (endEvent) {
        trackEvent({ eventType: endEvent, sessionId, toolName: tool.name });
      }

      sendJson(response, 200, { tool: tool.name, result });
    } catch (err) {
      logger.toolError(tool.name, err, { sessionId });

      const failEvent = toolToFailEvent(tool.name as ToolName);
      if (failEvent) {
        trackEvent({ eventType: failEvent, sessionId, toolName: tool.name });
      }

      throw err;
    }
    return;
  }

  // Fallback: serve web app (SPA) para rotas GET não reconhecidas
  if (method === "GET" && serveStaticFile(response, url.pathname)) return;

  sendError(response, 404, "Rota não encontrada.");
}

function toolToStartEvent(toolName: ToolName): AnalyticsEventType | null {
  switch (toolName) {
    case "search_inventory": return "search_started";
    case "get_vehicle_details": return "vehicle_opened";
    case "compare_vehicles": return "comparison_started";
    default: return null;
  }
}

function toolToEndEvent(toolName: ToolName): AnalyticsEventType | null {
  switch (toolName) {
    case "search_inventory": return "search_results_returned";
    case "start_consultant_handoff": return "handoff_created";
    default: return null;
  }
}

function toolToFailEvent(toolName: ToolName): AnalyticsEventType | null {
  switch (toolName) {
    case "start_consultant_handoff": return "handoff_failed";
    default: return null;
  }
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
  } catch {
    throw badRequest("JSON inválido no corpo da requisição.");
  }
}

async function readRawBody(request: IncomingMessage): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

function parseUrlEncoded(raw: string): Record<string, string> {
  const params: Record<string, string> = {};
  for (const pair of raw.split("&")) {
    const [k, v] = pair.split("=");
    if (k) params[decodeURIComponent(k.replace(/\+/g, " "))] = decodeURIComponent((v ?? "").replace(/\+/g, " "));
  }
  return params;
}

/* ─── OAuth 2.1 Handlers ─────────────────────────────────────────── */

function handleOAuthAuthorizeGet(url: URL, response: ServerResponse): void {
  const p = url.searchParams;
  const clientId = p.get("client_id") ?? "";
  const redirectUri = p.get("redirect_uri") ?? "";
  const scope = p.get("scope") ?? "";
  const state = p.get("state") ?? "";
  const codeChallenge = p.get("code_challenge") ?? "";
  const codeChallengeMethod = p.get("code_challenge_method") ?? "S256";
  const nonce = p.get("nonce") ?? "";

  if (!clientId || !redirectUri) {
    sendError(response, 400, "Parâmetros OAuth incompletos: client_id e redirect_uri são obrigatórios.");
    return;
  }

  const configuredClientId = appConfig.env.oauthClientId;
  if (configuredClientId && clientId !== configuredClientId) {
    sendError(response, 400, "client_id não reconhecido.");
    return;
  }

  const configuredRedirectUri = appConfig.env.oauthRedirectUri;
  if (configuredRedirectUri && redirectUri !== configuredRedirectUri) {
    sendError(response, 400, "redirect_uri não permitido.");
    return;
  }

  const html = buildConsentPage({ clientId, redirectUri, scope, state, codeChallenge: codeChallenge || "", codeChallengeMethod, nonce });
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(html);
}

async function handleOAuthAuthorizePost(
  request: IncomingMessage,
  url: URL,
  response: ServerResponse
): Promise<void> {
  const raw = await readRawBody(request);
  const form = parseUrlEncoded(raw);

  const { client_id, redirect_uri, scope, state, code_challenge, code_challenge_method, name, email, nonce } = form;

  if (!client_id || !redirect_uri || !email) {
    sendError(response, 400, "Parâmetros obrigatórios ausentes.");
    return;
  }

  const configuredClientId = appConfig.env.oauthClientId;
  if (configuredClientId && client_id !== configuredClientId) {
    sendError(response, 400, "client_id não reconhecido.");
    return;
  }

  const configuredRedirectUri = appConfig.env.oauthRedirectUri;
  if (configuredRedirectUri && redirect_uri !== configuredRedirectUri) {
    sendError(response, 400, "redirect_uri não permitido.");
    return;
  }

  const method = code_challenge_method === "plain" ? "plain" : "S256";
  const scopes = (scope ?? "").split(" ").filter((s) => ALL_SCOPES.includes(s as Scope)) as Scope[];

  const code = generateAuthCode({
    clientId: client_id,
    redirectUri: redirect_uri,
    scopes,
    codeChallenge: code_challenge || undefined,
    codeChallengeMethod: method,
    sub: email,
    email,
    name: name || undefined,
    nonce: nonce || undefined,
  });

  logger.info("oauth: authorization code gerado", { sub: email, clientId: client_id });

  const redirect = new URL(redirect_uri);
  redirect.searchParams.set("code", code);
  if (state) redirect.searchParams.set("state", state);
  response.writeHead(302, { Location: redirect.toString() });
  response.end();
  void url; // suppress unused warning
}

async function handleOAuthToken(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const raw = await readRawBody(request);
  const form = parseUrlEncoded(raw);

  const { grant_type, code, redirect_uri, code_verifier, client_id } = form;

  if (grant_type !== "authorization_code") {
    sendJson(response, 400, { error: "unsupported_grant_type" });
    return;
  }
  if (!code || !redirect_uri || !client_id) {
    sendJson(response, 400, { error: "invalid_request", error_description: "Missing required parameters." });
    return;
  }

  const result = exchangeAuthCode({ code, redirectUri: redirect_uri, codeVerifier: code_verifier || undefined, clientId: client_id });
  if (!result) {
    sendJson(response, 400, { error: "invalid_grant", error_description: "Code invalid, expired, or PKCE mismatch." });
    return;
  }

  if (!appConfig.env.jwtSecret) {
    logger.error("oauth: JWT_SECRET não configurado, não é possível emitir token");
    sendJson(response, 500, { error: "server_error" });
    return;
  }

  const accessToken = generateAccessToken({ sub: result.sub, email: result.email, name: result.name, scopes: result.scopes as string[] });
  logger.info("oauth: access token emitido", { sub: result.sub, scopes: result.scopes });

  // Emit id_token when openid scope was requested (OIDC Core 1.0)
  const requestedOpenId = (result.scopes as string[]).includes("openid");
  const idToken = requestedOpenId
    ? generateIdToken({ sub: result.sub, email: result.email, name: result.name, aud: result.clientId, nonce: result.nonce })
    : undefined;

  sendJson(response, 200, {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    scope: result.scopes.join(" "),
    ...(idToken ? { id_token: idToken } : {}),
  });
}

function handleOAuthUserInfo(request: IncomingMessage, response: ServerResponse): void {
  const authHeader = (request.headers["authorization"] as string | undefined) ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    response.writeHead(401, { "WWW-Authenticate": "Bearer", "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "unauthorized" }));
    return;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    response.writeHead(401, { "WWW-Authenticate": 'Bearer error="invalid_token"', "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "invalid_token" }));
    return;
  }

  sendJson(response, 200, {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
  });
}

function buildConsentPage(params: {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  nonce?: string;
}): string {
  const { clientId, redirectUri, scope, state, codeChallenge, codeChallengeMethod, nonce } = params;
  const scopeList = scope.split(" ").filter(Boolean);
  const scopeItems = scopeList.map((s) => `<li>${s}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attra Veículos — Autorização</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh}
    .card{background:#fff;border-radius:12px;padding:2rem;max-width:420px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,.10)}
    .logo{font-size:1.4rem;font-weight:700;color:#1a1a1a;margin-bottom:.5rem}
    .subtitle{color:#666;font-size:.9rem;margin-bottom:1.5rem}
    label{display:block;font-size:.85rem;font-weight:600;color:#333;margin-bottom:.3rem}
    input{width:100%;padding:.65rem .9rem;border:1px solid #ddd;border-radius:8px;font-size:.95rem;margin-bottom:1rem}
    input:focus{outline:none;border-color:#1a1a1a}
    .scopes{background:#f9f9f9;border-radius:8px;padding:.8rem 1rem;margin-bottom:1.2rem}
    .scopes p{font-size:.8rem;font-weight:600;color:#555;margin-bottom:.4rem}
    .scopes ul{padding-left:1.2rem;color:#444;font-size:.82rem}
    .scopes li{margin-bottom:.2rem}
    .consent{font-size:.78rem;color:#888;margin-bottom:1.2rem;line-height:1.5}
    button{width:100%;padding:.8rem;background:#1a1a1a;color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;font-weight:600}
    button:hover{background:#333}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Attra Veículos</div>
    <p class="subtitle">O assistente precisa da sua identificação para continuar.</p>
    <form method="POST" action="/oauth/authorize">
      <input type="hidden" name="client_id" value="${esc(clientId)}">
      <input type="hidden" name="redirect_uri" value="${esc(redirectUri)}">
      <input type="hidden" name="scope" value="${esc(scope)}">
      <input type="hidden" name="state" value="${esc(state)}">
      <input type="hidden" name="code_challenge" value="${esc(codeChallenge)}">
      <input type="hidden" name="code_challenge_method" value="${esc(codeChallengeMethod)}">
      ${nonce ? `<input type="hidden" name="nonce" value="${esc(nonce)}">` : ""}
      <label for="name">Seu nome</label>
      <input id="name" name="name" type="text" placeholder="Nome completo" autocomplete="name">
      <label for="email">E-mail *</label>
      <input id="email" name="email" type="email" placeholder="seuemail@exemplo.com" required autocomplete="email">
      <div class="scopes">
        <p>Permissões solicitadas:</p>
        <ul>${scopeItems}</ul>
      </div>
      <p class="consent">Ao continuar, você autoriza o assistente Attra a usar suas informações para consultas de veículos e eventual contato por um consultor. Seus dados são tratados conforme a LGPD.</p>
      <button type="submit">Autorizar acesso</button>
    </form>
  </div>
</body>
</html>`;
}

function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
