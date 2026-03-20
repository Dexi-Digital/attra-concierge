export interface ToolExecutionContext {
  requestId: string;
  sessionId?: string;
  source: "chatgpt_app" | "internal";
}
