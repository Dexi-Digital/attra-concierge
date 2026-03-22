import test from "node:test";
import assert from "node:assert/strict";
import { analyticsRepository } from "./analytics.repository.js";
import { trackEvent, getAnalyticsSummary } from "./analytics.service.js";

// Limpa o repositório antes de cada teste usando clear()
function fresh() {
  analyticsRepository.clear();
}

test("analyticsRepository.push e list funcionam corretamente", () => {
  fresh();
  analyticsRepository.push({ eventType: "search_started", sessionId: "s1", createdAt: new Date().toISOString() });
  analyticsRepository.push({ eventType: "vehicle_opened", sessionId: "s2", createdAt: new Date().toISOString() });

  const events = analyticsRepository.list();
  assert.equal(events.length, 2);
  assert.equal(events[0].eventType, "search_started");
  assert.equal(events[1].eventType, "vehicle_opened");
});

test("analyticsRepository.list retorna cópia (não a referência interna)", () => {
  fresh();
  analyticsRepository.push({ eventType: "search_started", sessionId: "s1", createdAt: new Date().toISOString() });
  const list1 = analyticsRepository.list();
  list1.push({ eventType: "handoff_created", sessionId: "s999", createdAt: new Date().toISOString() });
  const list2 = analyticsRepository.list();
  assert.equal(list2.length, 1, "Modificar a lista retornada não deve afetar o repositório interno");
});

test("analyticsRepository.countByType conta eventos por tipo", () => {
  fresh();
  analyticsRepository.push({ eventType: "search_started", sessionId: "s1", createdAt: new Date().toISOString() });
  analyticsRepository.push({ eventType: "search_started", sessionId: "s2", createdAt: new Date().toISOString() });
  analyticsRepository.push({ eventType: "vehicle_opened", sessionId: "s1", createdAt: new Date().toISOString() });

  const counts = analyticsRepository.countByType();
  assert.equal(counts["search_started"], 2);
  assert.equal(counts["vehicle_opened"], 1);
});

test("analyticsRepository.uniqueSessions conta sessões únicas", () => {
  fresh();
  analyticsRepository.push({ eventType: "search_started", sessionId: "s1", createdAt: new Date().toISOString() });
  analyticsRepository.push({ eventType: "vehicle_opened", sessionId: "s1", createdAt: new Date().toISOString() });
  analyticsRepository.push({ eventType: "search_started", sessionId: "s2", createdAt: new Date().toISOString() });

  assert.equal(analyticsRepository.uniqueSessions(), 2);
});

test("analyticsRepository.recent retorna os últimos N eventos", () => {
  fresh();
  for (let i = 0; i < 25; i++) {
    analyticsRepository.push({ eventType: "search_started", sessionId: `s${i}`, createdAt: new Date().toISOString() });
  }
  const recent = analyticsRepository.recent(10);
  assert.equal(recent.length, 10);
  assert.equal(recent[recent.length - 1].sessionId, "s24");
});

test("analyticsRepository.recent retorna até 20 por padrão", () => {
  fresh();
  for (let i = 0; i < 30; i++) {
    analyticsRepository.push({ eventType: "search_started", sessionId: `s${i}`, createdAt: new Date().toISOString() });
  }
  const recent = analyticsRepository.recent();
  assert.equal(recent.length, 20);
});

test("analyticsRepository.clear esvazia os eventos", () => {
  analyticsRepository.push({ eventType: "search_started", sessionId: "s1", createdAt: new Date().toISOString() });
  analyticsRepository.clear();
  assert.equal(analyticsRepository.list().length, 0);
});

// ── analytics.service ──────────────────────────────────────────────
test("trackEvent registra evento com campos corretos", () => {
  fresh();
  const event = trackEvent({ eventType: "search_started", sessionId: "sess-abc", toolName: "search_inventory" });

  assert.equal(event.eventType, "search_started");
  assert.equal(event.sessionId, "sess-abc");
  assert.equal(event.toolName, "search_inventory");
  assert.ok(typeof event.createdAt === "string" && event.createdAt.length > 0);
});

test("trackEvent persiste evento no repositório", () => {
  fresh();
  trackEvent({ eventType: "handoff_created", sessionId: "sess-xyz" });
  const list = analyticsRepository.list();
  assert.equal(list.length, 1);
  assert.equal(list[0].eventType, "handoff_created");
});

test("getAnalyticsSummary retorna estrutura correta", () => {
  fresh();
  trackEvent({ eventType: "search_started", sessionId: "s1" });
  trackEvent({ eventType: "vehicle_opened", sessionId: "s1" });
  trackEvent({ eventType: "search_started", sessionId: "s2" });

  const summary = getAnalyticsSummary();
  assert.equal(summary.totalEvents, 3);
  assert.equal(summary.uniqueSessions, 2);
  assert.equal(summary.eventCounts["search_started"], 2);
  assert.equal(summary.eventCounts["vehicle_opened"], 1);
  assert.ok(Array.isArray(summary.recentEvents));
});

