/**
 * MCP-aligned schemas for searchInventory tool.
 * Field names and enums match exactly the mcp-instructions.md specification.
 */
import { z } from "zod";

export const mcpBodyTypeEnum = z.enum([
  "SUV", "SEDAN", "HATCH", "COUPE", "CONVERTIBLE", "PICKUP", "SPORT", "OTHER"
]);

export const mcpSearchInventoryInputSchema = z.object({
  query: z.string().max(300).optional()
    .describe("Busca livre, ex.: SUV premium até 400 mil"),
  bodyType: mcpBodyTypeEnum.optional(),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  yearMin: z.number().int().min(1900).max(2100).optional(),
  yearMax: z.number().int().min(1900).max(2100).optional(),
  kmMax: z.number().int().min(0).optional(),
  fuelType: z.string().max(50).optional(),
  transmission: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  blindageRequired: z.boolean().optional(),
  storeUnit: z.string().max(100).optional(),
  limit: z.number().int().min(1).max(10).default(5)
}).strict();

export type McpSearchInventoryInput = z.infer<typeof mcpSearchInventoryInputSchema>;

/** Single vehicle entry in searchInventory results */
export const mcpInventoryVehicleSchema = z.object({
  vehicleId: z.string(),
  title: z.string(),
  brand: z.string(),
  model: z.string(),
  year: z.number().int(),
  price: z.number(),
  mileage: z.number().int(),
  fuelType: z.string(),
  transmission: z.string(),
  color: z.string().optional(),
  bodyType: z.string(),
  storeUnit: z.string(),
  vehicleUrl: z.string().url(),
  heroImageUrl: z.string().url().optional(),
  reasonTags: z.array(z.string())
});

export type McpInventoryVehicle = z.infer<typeof mcpInventoryVehicleSchema>;

export const mcpSearchInventoryOutputSchema = z.object({
  results: z.array(mcpInventoryVehicleSchema),
  totalFound: z.number().int(),
  searchSummary: z.object({
    queryApplied: z.string(),
    fallbackApplied: z.boolean()
  })
});

export type McpSearchInventoryOutput = z.infer<typeof mcpSearchInventoryOutputSchema>;

/** Error output when inventory API is unavailable */
export const mcpInventoryErrorSchema = z.object({
  error: z.object({
    code: z.literal("INVENTORY_UNAVAILABLE"),
    message: z.string()
  })
});

