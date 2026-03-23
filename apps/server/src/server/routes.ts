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
import { validateToken } from "../security/oauth.js";
import { checkGlobalRateLimit, checkWriteRateLimit, getRateLimitHeaders } from "../security/rate-limit.js";

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

// Origins that are allowed to call the API.
// In production these are restricted to the ChatGPT domains and the app itself.
const ALLOWED_ORIGINS_PRODUCTION = [
  "https://chatgpt.com",
  "https://chat.openai.com",
  appConfig.env.appBaseUrl,
];

function setCorsHeaders(request: IncomingMessage, response: ServerResponse): void {
  const origin = (request.headers["origin"] as string | undefined) ?? "";
  const isProduction = appConfig.env.nodeEnv === "production";

  if (isProduction) {
    if (ALLOWED_ORIGINS_PRODUCTION.includes(origin)) {
      response.setHeader("Access-Control-Allow-Origin", origin);
      response.setHeader("Vary", "Origin");
    }
    // No origin header on server-to-server calls — allowed without CORS headers
  } else {
    response.setHeader("Access-Control-Allow-Origin", "*");
  }

  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function setSecurityHeaders(response: ServerResponse): void {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-XSS-Protection", "0"); // disabled — browsers should use CSP instead
  if (appConfig.env.nodeEnv === "production") {
    response.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  }
}

export async function routeRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  setCorsHeaders(request, response);
  setSecurityHeaders(response);

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
    // Protected: requires a valid Bearer token
    const analyticsAuth = validateToken(request.headers["authorization"] as string | undefined);
    if (!analyticsAuth.ok) {
      response.setHeader("WWW-Authenticate", "Bearer");
      sendJson(response, analyticsAuth.statusCode, { error: analyticsAuth.error });
      return;
    }
    sendJson(response, 200, getAnalyticsSummary());
    return;
  }

  if (method === "GET" && url.pathname === "/privacidade") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(buildPrivacyPolicyPage());
    return;
  }

  if (method === "POST" && url.pathname.startsWith("/tools/")) {
    const toolName = url.pathname.replace("/tools/", "");
    const tool = tools.find((item) => item.name === toolName);

    if (!tool) {
      sendError(response, 404, `Tool ${toolName} não encontrada.`);
      return;
    }

    // Auth enforcement — mirrors the MCP endpoint
    const authResult = validateToken(request.headers["authorization"] as string | undefined);
    if (!authResult.ok) {
      response.setHeader("WWW-Authenticate", "Bearer");
      sendJson(response, authResult.statusCode, { error: authResult.error });
      return;
    }

    // Rate limiting — write tools get stricter limits
    const isWriteTool = toolName === "start_consultant_handoff";
    const rateLimitKey = authResult.claims.sub ?? (request.headers["x-forwarded-for"] as string | undefined) ?? "anonymous";
    const rateLimitResult = isWriteTool
      ? checkWriteRateLimit(rateLimitKey)
      : checkGlobalRateLimit(rateLimitKey);

    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.setHeader(key, value);
    }

    if (!rateLimitResult.allowed) {
      sendJson(response, 429, { error: "Rate limit excedido. Tente novamente em breve." });
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

/* ─── Privacy Policy (LGPD) ─────────────────────────────────────── */

function buildPrivacyPolicyPage(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Política de Privacidade — Attra Concierge</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#f9f9f9;color:#1a1a1a;line-height:1.7;padding:2rem 1rem}
    .container{max-width:740px;margin:0 auto;background:#fff;border-radius:12px;padding:2.5rem;box-shadow:0 2px 16px rgba(0,0,0,.07)}
    h1{font-size:1.6rem;margin-bottom:.3rem}
    .updated{font-size:.82rem;color:#777;margin-bottom:2rem}
    h2{font-size:1.05rem;font-weight:700;margin:1.8rem 0 .5rem}
    p{margin-bottom:.8rem;font-size:.95rem;color:#333}
    ul{padding-left:1.4rem;margin-bottom:.8rem}
    li{font-size:.95rem;color:#333;margin-bottom:.3rem}
    a{color:#1a1a1a}
    .footer{margin-top:2rem;font-size:.82rem;color:#999;border-top:1px solid #eee;padding-top:1rem}
  </style>
</head>
<body>
  <div class="container">
    <h1>Política de Privacidade</h1>
    <p class="updated">Attra Concierge &mdash; Última atualização: março de 2026</p>

    <h2>1. Quem somos</h2>
    <p>O Attra Concierge é um assistente de inteligência artificial operado pela <strong>Attra Veículos</strong>, com sede em Uberlândia/MG, Brasil. Ele auxilia usuários na busca e avaliação de veículos premium disponíveis no estoque da Attra.</p>

    <h2>2. Dados que coletamos</h2>
    <ul>
      <li><strong>Dados de identificação voluntários:</strong> nome e e-mail fornecidos durante o fluxo de autorização OAuth, utilizados apenas para personalizar o atendimento.</li>
      <li><strong>Dados de interação:</strong> consultas realizadas ao assistente (termos de busca, filtros aplicados, veículos visualizados), armazenadas de forma anonimizada para fins de análise de uso.</li>
      <li><strong>Dados de handoff:</strong> quando o usuário solicita contato com um consultor, as informações fornecidas (nome, canal de contato, interesse em veículo) são transmitidas à equipe comercial da Attra.</li>
    </ul>

    <h2>3. Como usamos os dados</h2>
    <ul>
      <li>Responder consultas sobre o estoque de veículos em tempo real.</li>
      <li>Encaminhar solicitações de contato à equipe comercial da Attra.</li>
      <li>Melhorar a qualidade do assistente com base em padrões de uso anonimizados.</li>
    </ul>
    <p>Não utilizamos os dados para publicidade de terceiros, perfilamento comportamental ou venda a terceiros.</p>

    <h2>4. Base legal (LGPD — Lei 13.709/2018)</h2>
    <p>O tratamento dos dados se baseia em: (i) consentimento do titular, obtido no momento da autorização OAuth; e (ii) legítimo interesse da Attra Veículos na prestação do serviço de concierge.</p>

    <h2>5. Compartilhamento de dados</h2>
    <p>Os dados são compartilhados exclusivamente com:</p>
    <ul>
      <li><strong>OpenAI:</strong> operador da plataforma ChatGPT, sujeito à sua própria política de privacidade.</li>
      <li><strong>Equipe comercial da Attra:</strong> exclusivamente quando o usuário solicita um handoff para contato.</li>
    </ul>

    <h2>6. Retenção</h2>
    <p>Dados de sessão são retidos em memória apenas durante a sessão ativa. Dados de handoff ficam armazenados no sistema CRM da Attra pelo prazo necessário ao atendimento comercial, respeitados os limites legais.</p>

    <h2>7. Seus direitos</h2>
    <p>Nos termos da LGPD, você pode a qualquer momento: confirmar a existência de tratamento, acessar seus dados, solicitar correção, portabilidade ou exclusão. Envie sua solicitação para <a href="mailto:privacidade@attraveiculos.com.br">privacidade@attraveiculos.com.br</a>.</p>

    <h2>8. Contato</h2>
    <p>Attra Veículos &mdash; Uberlândia, MG, Brasil<br>
    E-mail: <a href="mailto:privacidade@attraveiculos.com.br">privacidade@attraveiculos.com.br</a></p>

    <div class="footer">Esta política é aplicável ao assistente Attra Concierge disponível no ChatGPT. Para a política geral do site Attra Veículos, acesse attraveiculos.com.br.</div>
  </div>
</body>
</html>`;
}
