/**
 * Correlation ID generation for request tracing.
 * Used in MCP audit logs to correlate tool calls end-to-end.
 */

let counter = 0;

/**
 * Generate a lightweight correlation ID.
 * Format: mcp-<timestamp-base36>-<random-hex>-<counter>
 */
export function generateCorrelationId(): string {
  counter = (counter + 1) % 100_000;
  const ts = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
  return `mcp-${ts}-${rand}-${counter}`;
}

