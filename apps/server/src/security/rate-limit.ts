/**
 * In-memory rate limiter for MCP endpoints.
 * Tracks requests per key (IP address or token) within a sliding window.
 * MCP security requirement: limit abuse by IP, token and user.
 */

interface RateLimitBucket {
  count: number;
  windowStartMs: number;
}

interface RateLimitConfig {
  /** Maximum requests allowed within the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

const DEFAULT_GLOBAL_CONFIG: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60_000 // 60 req / min per key
};

const WRITE_TOOL_CONFIG: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60_000 // 10 req / min for write tools
};

const buckets = new Map<string, RateLimitBucket>();

/** Periodically clean stale buckets to prevent memory leaks */
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.windowStartMs > DEFAULT_GLOBAL_CONFIG.windowMs * 2) {
      buckets.delete(key);
    }
  }
}, 120_000).unref();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

function checkLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStartMs >= config.windowMs) {
    // Start new window
    buckets.set(key, { count: 1, windowStartMs: now });
    return { allowed: true, remaining: config.maxRequests - 1, resetInMs: config.windowMs };
  }

  if (bucket.count >= config.maxRequests) {
    const resetInMs = config.windowMs - (now - bucket.windowStartMs);
    return { allowed: false, remaining: 0, resetInMs };
  }

  bucket.count += 1;
  const remaining = config.maxRequests - bucket.count;
  const resetInMs = config.windowMs - (now - bucket.windowStartMs);
  return { allowed: true, remaining, resetInMs };
}

/**
 * Check rate limit for a general MCP request.
 * @param identifier - IP address or token hash
 */
export function checkGlobalRateLimit(identifier: string): RateLimitResult {
  return checkLimit(`global:${identifier}`, DEFAULT_GLOBAL_CONFIG);
}

/**
 * Check rate limit for write operations (e.g. startConsultantHandoff).
 * @param identifier - IP address or token hash
 */
export function checkWriteRateLimit(identifier: string): RateLimitResult {
  return checkLimit(`write:${identifier}`, WRITE_TOOL_CONFIG);
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetInMs / 1000))
  };
}

