/**
 * Attra MCP Server — Streamable HTTP transport (JSON-RPC 2.0).
 * Implements MCP specification 2025-03-26.
 *
 * Endpoint: POST /mcp
 * Authentication: Bearer token (OAuth 2.1 resource server)
 * Security: rate limiting, input validation, scope enforcement, audit logging.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { toolMetadataList, MCP_TOOL_NAME_MAP, INTERNAL_TO_MCP_NAME } from "./tool-metadata.js";
import { mcpToolJsonSchemas } from "./mcp-json-schemas.js";
import { executeMcpTool } from "./mcp-executor.js";
import { validateToken, assertScopes } from "../security/oauth.js";
import { TOOL_REQUIRED_SCOPES } from "../security/scopes.js";
import { checkGlobalRateLimit, checkWriteRateLimit, getRateLimitHeaders } from "../security/rate-limit.js";
import { logger } from "../telemetry/logger.js";
import { generateCorrelationId } from "../telemetry/correlation.js";

/* ─── JSON-RPC 2.0 types ─────────────────────────────────────────── */

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

const JSONRPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603
};

function jsonRpcError(id: string | number | null, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function jsonRpcResult(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

/* ─── Request body reader ────────────────────────────────────────── */

/** Maximum accepted request body size (64 KB). Prevents DoS via oversized payloads. */
const MAX_BODY_BYTES = 64 * 1024;

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
    totalBytes += buf.length;
    if (totalBytes > MAX_BODY_BYTES) {
      throw new Error(`Request body exceeds maximum size of ${MAX_BODY_BYTES} bytes`);
    }
    chunks.push(buf);
  }

  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
}

/* ─── MCP method handlers ────────────────────────────────────────── */

function handleInitialize(id: string | number | null): JsonRpcResponse {
  return jsonRpcResult(id, {
    protocolVersion: "2025-03-26",
    serverInfo: { name: "attra-concierge-mcp", version: "1.0.0" },
    capabilities: { tools: { listChanged: false } }
  });
}

function handleToolsList(id: string | number | null): JsonRpcResponse {
  const tools = toolMetadataList.map((meta) => ({
    name: INTERNAL_TO_MCP_NAME[meta.name],
    description: meta.description,
    inputSchema: mcpToolJsonSchemas[meta.name],
    annotations: meta.annotations
  }));
  return jsonRpcResult(id, { tools });
}

async function handleToolsCall(
  id: string | number | null,
  params: unknown,
  correlationId: string,
  identifier: string,
  claims: import("../security/oauth.js").TokenClaims
): Promise<JsonRpcResponse> {
  if (!params || typeof params !== "object") {
    return jsonRpcError(id, JSONRPC_ERRORS.INVALID_PARAMS, "params must be an object");
  }

  const { name, arguments: toolArgs } = params as { name?: unknown; arguments?: unknown };

  if (typeof name !== "string") {
    return jsonRpcError(id, JSONRPC_ERRORS.INVALID_PARAMS, "params.name must be a string");
  }

  const internalName = MCP_TOOL_NAME_MAP[name];
  if (!internalName) {
    return jsonRpcError(id, JSONRPC_ERRORS.METHOD_NOT_FOUND, `Tool '${name}' not found`);
  }

  // Write tool: extra rate limit
  const isWriteTool = internalName === "start_consultant_handoff";
  if (isWriteTool) {
    const writeLimit = checkWriteRateLimit(identifier);
    if (!writeLimit.allowed) {
      return jsonRpcError(id, -32099, `Rate limit exceeded for write operations. Retry in ${Math.ceil(writeLimit.resetInMs / 1000)}s`);
    }
  }

  const start = Date.now();
  try {
    const output = await executeMcpTool(internalName, toolArgs, correlationId, claims);
    const durationMs = Date.now() - start;
    logger.toolCall(name, durationMs, { correlationId, isWriteTool });

    return jsonRpcResult(id, {
      content: [{ type: "text", text: JSON.stringify(output) }],
      isError: "error" in (output as object)
    });
  } catch (err) {
    const durationMs = Date.now() - start;
    logger.toolError(name, err, { correlationId, durationMs });
    const message = err instanceof Error ? err.message : "Internal tool error";
    return jsonRpcResult(id, {
      content: [{ type: "text", text: JSON.stringify({ error: { code: "TOOL_ERROR", message } }) }],
      isError: true
    });
  }
}

/* ─── Main request handler ───────────────────────────────────────── */

/**
 * Handle an MCP HTTP request (POST /mcp).
 * Validates auth, rate limits, parses JSON-RPC, dispatches to method handlers.
 */
export async function handleMcpRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const correlationId = generateCorrelationId();
  const authHeader = req.headers["authorization"] as string | undefined;
  const identifier =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    "unknown";

  // Global rate limit check
  const globalLimit = checkGlobalRateLimit(identifier);
  const rateLimitHeaders = getRateLimitHeaders(globalLimit);

  if (!globalLimit.allowed) {
    res.writeHead(429, { "Content-Type": "application/json", ...rateLimitHeaders });
    res.end(JSON.stringify(jsonRpcError(null, -32099, "Too many requests. Please slow down.")));
    return;
  }

  // OAuth token validation
  const authResult = validateToken(authHeader);
  if (!authResult.ok) {
    res.writeHead(authResult.statusCode, { "Content-Type": "application/json", "WWW-Authenticate": "Bearer" });
    res.end(JSON.stringify(jsonRpcError(null, -32001, authResult.error)));
    return;
  }

  // Parse request body
  let body: unknown;
  try {
    body = await readBody(req);
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify(jsonRpcError(null, JSONRPC_ERRORS.PARSE_ERROR, "Invalid JSON body")));
    return;
  }

  const rpc = body as Partial<JsonRpcRequest>;
  const id = rpc.id ?? null;

  if (rpc.jsonrpc !== "2.0" || typeof rpc.method !== "string") {
    res.writeHead(200, { "Content-Type": "application/json", ...rateLimitHeaders });
    res.end(JSON.stringify(jsonRpcError(id, JSONRPC_ERRORS.INVALID_REQUEST, "Invalid JSON-RPC 2.0 request")));
    return;
  }

  // Scope check for tools/call
  let response: JsonRpcResponse;
  if (rpc.method === "tools/call") {
    const params = rpc.params as { name?: unknown } | undefined;
    const toolName = typeof params?.name === "string" ? params.name : null;
    if (toolName) {
      const required = TOOL_REQUIRED_SCOPES[toolName] ?? [];
      const scopeCheck = assertScopes(authResult.claims, required);
      if (!scopeCheck.ok) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(jsonRpcError(id, -32003, `Forbidden: missing scopes [${scopeCheck.missing.join(", ")}]`)));
        return;
      }
    }
    response = await handleToolsCall(id, rpc.params, correlationId, identifier, authResult.claims);
  } else if (rpc.method === "initialize") {
    response = handleInitialize(id);
  } else if (rpc.method === "tools/list") {
    response = handleToolsList(id);
  } else if (rpc.method === "notifications/initialized") {
    // No-op notification — MCP handshake step, no response needed
    res.writeHead(204);
    res.end();
    return;
  } else {
    response = jsonRpcError(id, JSONRPC_ERRORS.METHOD_NOT_FOUND, `Method '${rpc.method}' not found`);
  }

  res.writeHead(200, { "Content-Type": "application/json", ...rateLimitHeaders });
  res.end(JSON.stringify(response));
}

