/**
 * MCP Tool Executor — bridges MCP input schemas to domain services.
 *
 * Each tool adapter:
 *  1. Validates MCP input with its Zod schema
 *  2. Maps MCP fields to domain service input
 *  3. Calls the domain service
 *  4. Maps domain output to MCP output format
 */
import type { ToolName } from "./tool-metadata.js";
import type { TokenClaims } from "../security/oauth.js";
import { mcpSearchInventoryInputSchema } from "./schemas/inventory.js";
import { mcpGetVehicleDetailsInputSchema } from "./schemas/vehicle.js";
import { mcpCompareVehiclesInputSchema } from "./schemas/vehicle.js";
import { mcpPreviewPurchasePathInputSchema, mcpStartConsultantHandoffInputSchema } from "./schemas/handoff.js";
import { sanitizeField, TEXT_LIMITS } from "../security/sanitize.js";
import { vehicleRepository } from "../domain/vehicles/vehicle.repository.js";
import { searchVehicles } from "../domain/vehicles/vehicle-query.service.js";
import type { VehicleSearchFilters } from "../domain/vehicles/vehicle.types.js";
import { handleGetVehicleDetails } from "../tools/get-vehicle-details/handler.js";
import { handleCompareVehicles } from "../tools/compare-vehicles/handler.js";
import { handleStartConsultantHandoff } from "../tools/start-consultant-handoff/handler.js";

export async function executeMcpTool(
  toolName: ToolName,
  rawArgs: unknown,
  correlationId: string,
  claims?: TokenClaims
): Promise<unknown> {
  switch (toolName) {
    case "search_inventory": return executeSearchInventory(rawArgs, correlationId);
    case "get_vehicle_details": return executeGetVehicleDetails(rawArgs);
    case "compare_vehicles": return executeCompareVehicles(rawArgs);
    case "preview_purchase_path": return executePreviewPurchasePath(rawArgs);
    case "start_consultant_handoff": return executeStartConsultantHandoff(rawArgs, correlationId, claims);
  }
}

/* ─── searchInventory ──────────────────────────────────────────────── */

async function executeSearchInventory(rawArgs: unknown, _correlationId: string) {
  const parsed = mcpSearchInventoryInputSchema.safeParse(rawArgs ?? {});
  if (!parsed.success) {
    return { error: { code: "INVALID_INPUT", message: parsed.error.message } };
  }

  const input = parsed.data;
  const filters: VehicleSearchFilters = {
    queryText: sanitizeField(input.query, TEXT_LIMITS.queryText),
    brand: input.brand,
    model: input.model,
    bodyType: input.bodyType,
    fuelType: input.fuelType,
    transmission: input.transmission,
    color: input.color,
    priceMin: input.priceMin,
    priceMax: input.priceMax,
    yearMin: input.yearMin,
    yearMax: input.yearMax,
    kmMax: input.kmMax,
    armored: input.blindageRequired,
    storeUnit: input.storeUnit,
    limit: input.limit
  };

  try {
    const vehicles = await vehicleRepository.list();
    const domainResult = searchVehicles(vehicles, filters);

    return {
      results: domainResult.results.map((r) => ({
        vehicleId: r.vehicle.id,
        title: r.vehicle.title,
        brand: r.vehicle.brand,
        model: r.vehicle.model,
        year: r.vehicle.yearModel,
        price: r.vehicle.price,
        mileage: r.vehicle.mileageKm,
        fuelType: r.vehicle.fuelType,
        transmission: r.vehicle.transmission,
        color: r.vehicle.color ?? null,
        bodyType: r.vehicle.bodyType,
        storeUnit: r.vehicle.storeUnit,
        vehicleUrl: r.vehicle.vehicleUrl,
        heroImageUrl: r.vehicle.mainImageUrl ?? null,
        reasonTags: [r.matchReason, ...r.highlights.map((h) => `${h.label}: ${h.value}`)]
      })),
      totalFound: domainResult.total,
      searchSummary: {
        queryApplied: input.query ?? "(filtros estruturados)",
        fallbackApplied: false
      }
    };
  } catch {
    return { error: { code: "INVENTORY_UNAVAILABLE", message: "Estoque temporariamente indisponível." } };
  }
}

/* ─── getVehicleDetails ────────────────────────────────────────────── */

async function executeGetVehicleDetails(rawArgs: unknown) {
  const parsed = mcpGetVehicleDetailsInputSchema.safeParse(rawArgs);
  if (!parsed.success) {
    return { error: { code: "INVALID_INPUT", message: parsed.error.message } };
  }

  try {
    const details = await handleGetVehicleDetails(parsed.data);
    const v = details.vehicle;
    return {
      vehicleId: v.id,
      title: v.title,
      brand: v.brand,
      model: v.model,
      year: v.yearModel,
      price: v.price,
      mileage: v.mileageKm,
      fuelType: v.fuelType,
      transmission: v.transmission,
      color: v.color ?? null,
      bodyType: v.bodyType,
      storeUnit: v.storeUnit,
      vehicleUrl: v.vehicleUrl,
      heroImageUrl: v.mainImageUrl ?? null,
      galleryImages: v.imageUrls ?? [],
      features: details.highlights,
      description: details.consultantSummary,
      availabilityStatus: v.available ? "available" : "unavailable",
      lastSyncedAt: new Date().toISOString()
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Veículo não encontrado.";
    return { error: { code: "VEHICLE_NOT_FOUND", message: msg } };
  }
}

/* ─── compareVehicles ──────────────────────────────────────────────── */

async function executeCompareVehicles(rawArgs: unknown) {
  const parsed = mcpCompareVehiclesInputSchema.safeParse(rawArgs);
  if (!parsed.success) {
    return { error: { code: "INVALID_INPUT", message: parsed.error.message } };
  }

  try {
    const result = await handleCompareVehicles({ vehicleIds: parsed.data.vehicleIds });
    return {
      vehicles: result.vehicles.map((v) => ({
        vehicleId: v.id,
        title: v.title,
        year: v.yearModel,
        price: v.price,
        mileage: v.mileageKm,
        bodyType: v.bodyType,
        summaryTags: [`${v.fuelType}`, `${v.transmission}`, v.armored ? "Blindado" : "Sem blindagem"]
      })),
      comparisonAxes: [
        ...result.strengths.map((s) => ({ axis: s.title, detail: s.summary })),
        ...result.tradeoffs.map((t) => ({ axis: t.title, detail: t.summary })),
        { axis: "Recomendação", detail: result.recommendation }
      ]
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Falha ao comparar veículos.";
    return { error: { code: "COMPARE_FAILED", message: msg } };
  }
}

/* ─── previewPurchasePath ──────────────────────────────────────────── */

const INTEREST_TYPE_GUIDANCE: Record<string, string[]> = {
  purchase: [
    "Solicite uma proposta formal com o consultor Attra.",
    "Informe ao consultor o veículo e condições desejadas.",
    "Reserve uma visita para conhecer o veículo pessoalmente."
  ],
  trade_in: [
    "Informe o modelo atual ao consultor para avaliação prévia.",
    "A Attra pode incluir seu veículo como parte do pagamento (sujeito à avaliação).",
    "Traga documentos do veículo atual para a visita."
  ],
  financing: [
    "Consulte as condições de financiamento diretamente com o consultor.",
    "Tenha em mãos dados de renda e documentos pessoais.",
    "A Attra trabalha com múltiplas opções de crédito."
  ],
  visit: [
    "Agende uma visita à unidade Attra para ver o veículo pessoalmente.",
    "Confirme disponibilidade com o consultor antes de se deslocar."
  ],
  reservation: [
    "Entre em contato com o consultor para verificar condições de reserva.",
    "A reserva está sujeita às políticas vigentes da Attra."
  ],
  proposal: [
    "Solicite uma proposta personalizada ao consultor com o veículo de interesse.",
    "Informe orçamento e condições preferidas para agilizar o atendimento."
  ]
};

const DISALLOWED_CLAIMS = [
  "O assistente não confirma aprovação de crédito ou financiamento.",
  "O assistente não garante disponibilidade nem preço final.",
  "Todas as condições comerciais são confirmadas exclusivamente pelo consultor Attra."
];

async function executePreviewPurchasePath(rawArgs: unknown) {
  const parsed = mcpPreviewPurchasePathInputSchema.safeParse(rawArgs);
  if (!parsed.success) {
    return { error: { code: "INVALID_INPUT", message: parsed.error.message } };
  }

  const { interestType } = parsed.data;
  return {
    interestType,
    allowedGuidance: INTEREST_TYPE_GUIDANCE[interestType] ?? [],
    disallowedClaims: DISALLOWED_CLAIMS,
    nextStepOptions: ["Falar com consultor", "Agendar visita", "Solicitar proposta"]
  };
}

/* ─── startConsultantHandoff ───────────────────────────────────────── */

async function executeStartConsultantHandoff(rawArgs: unknown, correlationId: string, claims?: TokenClaims) {
  const parsed = mcpStartConsultantHandoffInputSchema.safeParse(rawArgs);
  if (!parsed.success) {
    return { error: { code: "INVALID_INPUT", message: parsed.error.message } };
  }

  const input = parsed.data;

  // Prefer authenticated identity (OAuth claims) over LLM-provided fields
  const authenticatedEmail = claims?.email;
  const authenticatedName = claims?.name;
  const authenticatedSub = claims?.sub !== "anonymous_dev" && claims?.sub !== "api_key"
    ? claims?.sub
    : undefined;

  // Map MCP flat input → existing domain StartConsultantHandoffInput (nested context)
  const domainInput = {
    vehicleIds: input.vehicleIds ?? [],
    interestSummary: sanitizeField(input.conversationSummary, TEXT_LIMITS.conversationSummary) ?? input.conversationSummary,
    contactChannel: mapChannel(input.preferredChannel),
    // Use authenticated name/email when available; fall back to LLM-provided customerName
    userName: authenticatedName ?? sanitizeField(input.customerName, TEXT_LIMITS.customerName),
    context: {
      budget: (input.budgetMin !== undefined || input.budgetMax !== undefined)
        ? { min: input.budgetMin, max: input.budgetMax }
        : undefined,
      usage: input.intendedUse
        ? { notes: sanitizeField(input.intendedUse, TEXT_LIMITS.intendedUse) }
        : undefined,
      location: input.city
        ? { city: sanitizeField(input.city, TEXT_LIMITS.city) }
        : undefined,
      tradeIn: input.hasTradeIn !== undefined
        ? {
            hasTradeIn: input.hasTradeIn,
            vehicleDescription: sanitizeField(input.tradeInDescription, TEXT_LIMITS.tradeInDescription)
          }
        : undefined,
      intent: { notes: input.intentLevel },
      // LGPD traceability: authenticated identity from OAuth token
      authenticatedUser: authenticatedSub
        ? { sub: authenticatedSub, email: authenticatedEmail, name: authenticatedName }
        : undefined
    }
  };

  try {
    await handleStartConsultantHandoff(domainInput as never);
    return {
      handoffId: correlationId,
      status: "created" as const,
      message: "Handoff registrado com sucesso. Um consultor Attra entrará em contato.",
      nextStep: "consultant_followup" as const
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Falha ao registrar handoff.";
    return { error: { code: "HANDOFF_FAILED", message: msg } };
  }
}

function mapChannel(channel: string): "whatsapp" | "crm" | "email" {
  if (channel === "whatsapp") return "whatsapp";
  if (channel === "email") return "email";
  return "crm"; // phone / unspecified → crm
}

