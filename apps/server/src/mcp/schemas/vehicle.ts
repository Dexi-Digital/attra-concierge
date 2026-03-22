/**
 * MCP-aligned schemas for getVehicleDetails and compareVehicles tools.
 * Field names and structure match mcp-instructions.md specification.
 */
import { z } from "zod";

/* ─── getVehicleDetails ─────────────────────────────────────────── */

export const mcpGetVehicleDetailsInputSchema = z.object({
  vehicleId: z.string().min(1)
}).strict();

export type McpGetVehicleDetailsInput = z.infer<typeof mcpGetVehicleDetailsInputSchema>;

export const mcpVehicleDetailsOutputSchema = z.object({
  vehicleId: z.string(),
  title: z.string(),
  brand: z.string(),
  model: z.string(),
  year: z.number().int(),
  price: z.number(),
  mileage: z.number().int(),
  fuelType: z.string(),
  transmission: z.string(),
  color: z.string().nullable(),
  bodyType: z.string(),
  storeUnit: z.string(),
  vehicleUrl: z.string().url(),
  heroImageUrl: z.string().url().nullable(),
  galleryImages: z.array(z.string().url()),
  features: z.array(z.string()),
  description: z.string().nullable(),
  availabilityStatus: z.enum(["available", "unavailable", "unknown"]),
  lastSyncedAt: z.string()
});

export type McpVehicleDetailsOutput = z.infer<typeof mcpVehicleDetailsOutputSchema>;

/* ─── compareVehicles ───────────────────────────────────────────── */

export const mcpCompareVehiclesInputSchema = z.object({
  vehicleIds: z.array(z.string().min(1)).min(2).max(3)
}).strict();

export type McpCompareVehiclesInput = z.infer<typeof mcpCompareVehiclesInputSchema>;

export const mcpCompareVehicleSummarySchema = z.object({
  vehicleId: z.string(),
  title: z.string(),
  year: z.number().int(),
  price: z.number(),
  mileage: z.number().int(),
  bodyType: z.string(),
  summaryTags: z.array(z.string())
});

export const mcpComparisonAxisSchema = z.object({
  axis: z.string()
}).catchall(z.string());

export const mcpCompareVehiclesOutputSchema = z.object({
  vehicles: z.array(mcpCompareVehicleSummarySchema),
  comparisonAxes: z.array(mcpComparisonAxisSchema)
});

export type McpCompareVehiclesOutput = z.infer<typeof mcpCompareVehiclesOutputSchema>;

