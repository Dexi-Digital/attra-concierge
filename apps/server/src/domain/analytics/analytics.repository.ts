import type { AnalyticsEvent } from "@attra/shared";

/**
 * Repositório de eventos in-memory.
 * Substituível por Postgres/Redis quando necessário.
 */
class AnalyticsRepository {
  private events: AnalyticsEvent[] = [];

  push(event: AnalyticsEvent): void {
    this.events.push(event);
  }

  list(): AnalyticsEvent[] {
    return [...this.events];
  }

  countByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const event of this.events) {
      counts[event.eventType] = (counts[event.eventType] ?? 0) + 1;
    }
    return counts;
  }

  uniqueSessions(): number {
    return new Set(this.events.map((e) => e.sessionId)).size;
  }

  recent(limit = 20): AnalyticsEvent[] {
    return this.events.slice(-limit);
  }

  clear(): void {
    this.events = [];
  }
}

export const analyticsRepository = new AnalyticsRepository();

