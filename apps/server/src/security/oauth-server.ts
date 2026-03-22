/**
 * OAuth 2.1 Authorization Server core logic.
 *
 * Provides:
 *  - Authorization code grant with PKCE (required by OAuth 2.1)
 *  - JWT access token generation and verification (HS256 via node:crypto)
 *  - In-memory auth code store with TTL
 *
 * No external JWT library required — uses built-in node:crypto.
 */
import { createHmac, randomBytes, createHash } from "node:crypto";
import { readEnv } from "../config/env.js";
import type { Scope } from "./scopes.js";

/* ─── Auth Code Store ─────────────────────────────────────────────── */

export interface AuthCodeEntry {
  code: string;
  clientId: string;
  redirectUri: string;
  scopes: Scope[];
  codeChallenge: string;
  codeChallengeMethod: "S256" | "plain";
  sub: string;
  email: string;
  name?: string;
  nonce?: string;
  expiresAt: number;
}

const authCodeStore = new Map<string, AuthCodeEntry>();

// Cleanup expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, entry] of authCodeStore) {
    if (entry.expiresAt < now) authCodeStore.delete(code);
  }
}, 5 * 60 * 1_000).unref();

/* ─── PKCE ────────────────────────────────────────────────────────── */

export function verifyPkce(
  codeVerifier: string,
  codeChallenge: string,
  method: "S256" | "plain"
): boolean {
  if (method === "S256") {
    const computed = createHash("sha256").update(codeVerifier).digest("base64url");
    return computed === codeChallenge;
  }
  return codeVerifier === codeChallenge;
}

/* ─── Auth Code Generation ────────────────────────────────────────── */

export function generateAuthCode(params: {
  clientId: string;
  redirectUri: string;
  scopes: Scope[];
  codeChallenge: string;
  codeChallengeMethod: "S256" | "plain";
  sub: string;
  email: string;
  name?: string;
  nonce?: string;
}): string {
  const code = randomBytes(32).toString("base64url");
  authCodeStore.set(code, {
    code,
    ...params,
    expiresAt: Date.now() + 5 * 60 * 1_000, // 5 minutes
  });
  return code;
}

/* ─── Auth Code Exchange ──────────────────────────────────────────── */

export interface CodeExchangeResult {
  sub: string;
  email: string;
  name?: string;
  scopes: Scope[];
  nonce?: string;
  clientId: string;
}

export function exchangeAuthCode(params: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
  clientId: string;
}): CodeExchangeResult | null {
  const entry = authCodeStore.get(params.code);
  if (!entry) return null;

  authCodeStore.delete(params.code); // one-time use

  if (entry.expiresAt < Date.now()) return null;
  if (entry.clientId !== params.clientId) return null;
  if (entry.redirectUri !== params.redirectUri) return null;
  if (!verifyPkce(params.codeVerifier, entry.codeChallenge, entry.codeChallengeMethod)) return null;

  return { sub: entry.sub, email: entry.email, name: entry.name, scopes: entry.scopes, nonce: entry.nonce, clientId: entry.clientId };
}

/* ─── JWT (HS256) ─────────────────────────────────────────────────── */

export interface JwtPayload {
  iss: string;
  sub: string;
  email: string;
  name?: string;
  scopes: string[];
  iat: number;
  exp: number;
}

function getJwtSecret(): string {
  const { jwtSecret } = readEnv();
  if (!jwtSecret) throw new Error("JWT_SECRET environment variable is not configured.");
  return jwtSecret;
}

function encodeSegment(obj: object): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

export function generateAccessToken(claims: {
  sub: string;
  email: string;
  name?: string;
  scopes: string[];
}): string {
  const env = readEnv();
  const secret = getJwtSecret();
  const now = Math.floor(Date.now() / 1_000);
  const payload: JwtPayload = {
    iss: env.appBaseUrl,
    sub: claims.sub,
    email: claims.email,
    name: claims.name,
    scopes: claims.scopes,
    iat: now,
    exp: now + 3_600, // 1 hour
  };
  const headerB64 = encodeSegment({ alg: "HS256", typ: "JWT" });
  const payloadB64 = encodeSegment(payload);
  const sig = createHmac("sha256", secret).update(`${headerB64}.${payloadB64}`).digest("base64url");
  return `${headerB64}.${payloadB64}.${sig}`;
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const secret = getJwtSecret();
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [hdr, pay, sig] = parts;
    const expected = createHmac("sha256", secret).update(`${hdr}.${pay}`).digest("base64url");
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(pay, "base64url").toString()) as JwtPayload;
    if (payload.exp < Math.floor(Date.now() / 1_000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ─── OIDC ID Token (HS256) ───────────────────────────────────────── */

export interface IdTokenPayload {
  iss: string;
  sub: string;
  aud: string;
  email: string;
  name?: string;
  nonce?: string;
  iat: number;
  exp: number;
}

/**
 * Generate an OIDC ID Token.
 * The `aud` claim is the OAuth client_id, as required by the OIDC spec.
 * The `nonce` claim is included when provided by the client during authorization.
 */
export function generateIdToken(claims: {
  sub: string;
  email: string;
  name?: string;
  aud: string;
  nonce?: string;
}): string {
  const env = readEnv();
  const secret = getJwtSecret();
  const now = Math.floor(Date.now() / 1_000);
  const payload: IdTokenPayload = {
    iss: env.appBaseUrl,
    sub: claims.sub,
    aud: claims.aud,
    email: claims.email,
    name: claims.name,
    nonce: claims.nonce,
    iat: now,
    exp: now + 3_600,
  };
  const headerB64 = encodeSegment({ alg: "HS256", typ: "JWT" });
  const payloadB64 = encodeSegment(payload);
  const sig = createHmac("sha256", secret).update(`${headerB64}.${payloadB64}`).digest("base64url");
  return `${headerB64}.${payloadB64}.${sig}`;
}

