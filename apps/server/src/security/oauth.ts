/**
 * OAuth 2.1 Bearer token validation for Attra MCP Server (resource server role).
 *
 * Validation priority:
 *  1. JWT access token (HS256) — issued by /oauth/token endpoint
 *  2. API key registry (MCP_API_KEYS env var) — legacy / service-to-service
 *  3. Anonymous dev access (NODE_ENV !== production && MCP_AUTH_REQUIRED=false)
 *
 * The authorization server metadata is exposed at
 * /.well-known/oauth-authorization-server (see routes.ts).
 */

import { readEnv } from "../config/env.js";
import { verifyAccessToken } from "./oauth-server.js";
import { ALL_SCOPES, type Scope } from "./scopes.js";

export interface TokenClaims {
  sub: string;
  email?: string;
  name?: string;
  scopes: string[];
}

export type AuthResult =
  | { ok: true; claims: TokenClaims }
  | { ok: false; error: string; statusCode: number };

/** Parse the API keys registry from env */
function parseApiKeyRegistry(raw: string): Map<string, string[]> {
  const registry = new Map<string, string[]>();
  for (const entry of raw.split(";")) {
    const [token, scopeList] = entry.trim().split(":");
    if (token && scopeList) {
      registry.set(token.trim(), scopeList.split(",").map((s) => s.trim()));
    }
  }
  return registry;
}

let registry: Map<string, string[]> | null = null;

function getRegistry(): Map<string, string[]> {
  if (!registry) {
    const env = readEnv();
    registry = env.mcpApiKeys ? parseApiKeyRegistry(env.mcpApiKeys) : new Map();
  }
  return registry;
}

/** Extract Bearer token from Authorization header */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Validate a Bearer token and return its claims.
 *
 * Tries in order:
 *  1. JWT (token contains 2 dots) — validated with HS256 + JWT_SECRET
 *  2. API key registry (MCP_API_KEYS env var)
 *  3. Anonymous dev access (only when MCP_AUTH_REQUIRED=false and not production)
 */
export function validateToken(authHeader: string | undefined): AuthResult {
  const env = readEnv();
  const isDev = env.nodeEnv !== "production";
  const token = extractBearerToken(authHeader);

  // No token provided
  if (!token) {
    if (!env.mcpAuthRequired && isDev) {
      return {
        ok: true,
        claims: { sub: "anonymous_dev", scopes: ALL_SCOPES as unknown as string[] }
      };
    }
    return { ok: false, error: "Missing Bearer token.", statusCode: 401 };
  }

  // 1. Try JWT validation (HS256) — 3 base64url segments separated by dots
  if (token.split(".").length === 3) {
    try {
      const payload = verifyAccessToken(token);
      if (!payload) {
        return { ok: false, error: "Invalid or expired JWT token.", statusCode: 401 };
      }
      return {
        ok: true,
        claims: {
          sub: payload.sub,
          email: payload.email,
          name: payload.name,
          scopes: payload.scopes
        }
      };
    } catch {
      return { ok: false, error: "JWT validation failed.", statusCode: 401 };
    }
  }

  // 2. API key registry fallback
  const reg = getRegistry();
  if (reg.size === 0) {
    // No registry configured and token is not a JWT — reject.
    // Anonymous access is only available when NO token is presented in dev mode (handled above).
    // Accepting an unknown opaque token here would grant access with empty scopes, silently
    // blocking every tool call at the scope-enforcement step.
    return { ok: false, error: "Invalid or expired token.", statusCode: 401 };
  }
  const scopes = reg.get(token);
  if (!scopes) {
    return { ok: false, error: "Invalid or expired token.", statusCode: 401 };
  }
  return { ok: true, claims: { sub: "api_key", scopes } };
}

/** Check whether claims include all required scopes */
export function assertScopes(
  claims: TokenClaims,
  required: Scope[]
): { ok: boolean; missing: string[] } {
  const missing = required.filter((s) => !claims.scopes.includes(s));
  return { ok: missing.length === 0, missing };
}

