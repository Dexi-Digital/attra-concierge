export type AnalyticsEventType =
  | "search_started"
  | "search_results_returned"
  | "vehicle_opened"
  | "comparison_started"
  | "handoff_created"
  | "handoff_failed";

export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  sessionId: string;
  createdAt: string;
  toolName?: string;
}
