/**
 * Input sanitization for free-text fields.
 * Strips HTML tags, script injections, and excessive whitespace.
 * MCP security requirement: never allow raw HTML/script in model-visible text.
 */

const HTML_TAG_PATTERN = /<[^>]*>/g;
const SCRIPT_EVENT_PATTERN = /on\w+\s*=/gi;
const JAVASCRIPT_PROTOCOL = /javascript\s*:/gi;
const CONTROL_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F]/g;
const EXCESSIVE_WHITESPACE = /\s{3,}/g;

export function sanitizeText(value: string): string {
  return value
    .replace(HTML_TAG_PATTERN, "")
    .replace(SCRIPT_EVENT_PATTERN, "")
    .replace(JAVASCRIPT_PROTOCOL, "")
    .replace(CONTROL_CHARS, "")
    .replace(EXCESSIVE_WHITESPACE, " ")
    .trim();
}

/** Sanitize an array of strings */
export function sanitizeTextArray(values: string[]): string[] {
  return values.map(sanitizeText);
}

/** Max lengths for free-text fields */
export const TEXT_LIMITS = {
  conversationSummary: 2_000,
  intendedUse: 500,
  tradeInDescription: 500,
  customerName: 200,
  contactValue: 200,
  city: 100,
  customerQuestion: 500,
  queryText: 300
} as const;

export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Sanitize and truncate a text field.
 * Returns the cleaned value or undefined if the result is empty.
 */
export function sanitizeField(
  value: string | undefined,
  maxLength: number
): string | undefined {
  if (!value) return undefined;
  const cleaned = sanitizeText(value);
  if (!cleaned) return undefined;
  return truncate(cleaned, maxLength);
}

