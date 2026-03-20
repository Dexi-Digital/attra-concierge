type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

function formatEntry(entry: LogEntry): string {
  const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
  return `[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.message}${ctx}`;
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context
  };

  const formatted = formatEntry(entry);

  switch (level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "debug":
      if (process.env.NODE_ENV !== "production") {
        console.debug(formatted);
      }
      break;
    default:
      console.log(formatted);
  }
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => log("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => log("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => log("error", message, context),
  debug: (message: string, context?: Record<string, unknown>) => log("debug", message, context),

  toolCall: (toolName: string, durationMs: number, context?: Record<string, unknown>) => {
    log("info", `Tool ${toolName} executada em ${durationMs}ms`, { toolName, durationMs, ...context });
  },

  toolError: (toolName: string, error: unknown, context?: Record<string, unknown>) => {
    const message = error instanceof Error ? error.message : String(error);
    log("error", `Erro na tool ${toolName}: ${message}`, { toolName, ...context });
  }
};

