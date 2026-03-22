/**
 * JSON Schema representations of MCP tool input schemas.
 * Used in tools/list response (MCP spec 2025-03-26).
 * Manually aligned with the Zod schemas in mcp/schemas/*.
 */
import type { ToolName } from "./tool-metadata.js";

type JsonSchema = Record<string, unknown>;

const searchInventorySchema: JsonSchema = {
  type: "object",
  properties: {
    query: { type: "string", maxLength: 300, description: "Busca livre, ex.: SUV premium até 400 mil" },
    bodyType: { type: "string", enum: ["SUV", "SEDAN", "HATCH", "COUPE", "CONVERTIBLE", "PICKUP", "SPORT", "OTHER"] },
    brand: { type: "string", maxLength: 100 },
    model: { type: "string", maxLength: 100 },
    priceMin: { type: "number", minimum: 0 },
    priceMax: { type: "number", minimum: 0 },
    yearMin: { type: "integer", minimum: 1900, maximum: 2100 },
    yearMax: { type: "integer", minimum: 1900, maximum: 2100 },
    kmMax: { type: "integer", minimum: 0 },
    fuelType: { type: "string", maxLength: 50 },
    transmission: { type: "string", maxLength: 50 },
    color: { type: "string", maxLength: 50 },
    blindageRequired: { type: "boolean" },
    storeUnit: { type: "string", maxLength: 100 },
    limit: { type: "integer", minimum: 1, maximum: 10, default: 5 }
  },
  additionalProperties: false
};

const getVehicleDetailsSchema: JsonSchema = {
  type: "object",
  required: ["vehicleId"],
  properties: {
    vehicleId: { type: "string", minLength: 1 }
  },
  additionalProperties: false
};

const compareVehiclesSchema: JsonSchema = {
  type: "object",
  required: ["vehicleIds"],
  properties: {
    vehicleIds: {
      type: "array",
      items: { type: "string", minLength: 1 },
      minItems: 2,
      maxItems: 3
    }
  },
  additionalProperties: false
};

const previewPurchasePathSchema: JsonSchema = {
  type: "object",
  required: ["interestType"],
  properties: {
    vehicleId: { type: "string", minLength: 1 },
    interestType: {
      type: "string",
      enum: ["purchase", "trade_in", "financing", "visit", "reservation", "proposal"]
    }
  },
  additionalProperties: false
};

const startConsultantHandoffSchema: JsonSchema = {
  type: "object",
  required: ["preferredChannel", "intentLevel", "conversationSummary", "source"],
  properties: {
    customerName: { type: "string", maxLength: 200 },
    preferredChannel: { type: "string", enum: ["whatsapp", "email", "phone", "unspecified"] },
    contactValue: { type: "string", maxLength: 200 },
    vehicleIds: { type: "array", items: { type: "string", minLength: 1 }, maxItems: 5 },
    budgetMin: { type: "number", minimum: 0 },
    budgetMax: { type: "number", minimum: 0 },
    intendedUse: { type: "string", maxLength: 500 },
    city: { type: "string", maxLength: 100 },
    hasTradeIn: { type: "boolean" },
    tradeInDescription: { type: "string", maxLength: 500 },
    customerQuestions: { type: "array", items: { type: "string", maxLength: 500 } },
    intentLevel: { type: "string", enum: ["low", "medium", "high"] },
    conversationSummary: { type: "string", minLength: 1, maxLength: 2000 },
    source: { type: "string", enum: ["chatgpt_app"] }
  },
  additionalProperties: false
};

export const mcpToolJsonSchemas: Record<ToolName, JsonSchema> = {
  search_inventory: searchInventorySchema,
  get_vehicle_details: getVehicleDetailsSchema,
  compare_vehicles: compareVehiclesSchema,
  preview_purchase_path: previewPurchasePathSchema,
  start_consultant_handoff: startConsultantHandoffSchema
};

