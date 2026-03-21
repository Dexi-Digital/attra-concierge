import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "node:fs";
import path from "node:path";
import type { AnalyticsEventType } from "@attra/shared";
import { appConfig } from "../config/app-config.js";
import { registerTools } from "../mcp/register-tools.js";
import { trackEvent, getAnalyticsSummary } from "../domain/analytics/analytics.service.js";
import { logger } from "../telemetry/logger.js";
import { badRequest } from "../utils/app-error.js";
import { sendError, sendJson } from "./error-handler.js";
import type { ToolName } from "../mcp/tool-metadata.js";

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
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
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
