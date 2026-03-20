import type { AnalyticsEvent, AnalyticsEventType } from "@attra/shared";
import { analyticsRepository } from "./analytics.repository.js";

export interface TrackEventInput {
  eventType: AnalyticsEventType;
  sessionId: string;
  toolName?: string;
  meta?: Record<string, unknown>;
}

export function trackEvent(input: TrackEventInput): AnalyticsEvent {
  const event: AnalyticsEvent = {
    eventType: input.eventType,
    sessionId: input.sessionId,
    createdAt: new Date().toISOString(),
    toolName: input.toolName
  };

  analyticsRepository.push(event);
  return event;
}

export interface AnalyticsSummary {
  totalEvents: number;
  uniqueSessions: number;
  eventCounts: Record<string, number>;
  recentEvents: AnalyticsEvent[];
}

export function getAnalyticsSummary(): AnalyticsSummary {
  return {
    totalEvents: analyticsRepository.list().length,
    uniqueSessions: analyticsRepository.uniqueSessions(),
    eventCounts: analyticsRepository.countByType(),
    recentEvents: analyticsRepository.recent(20)
  };
}

