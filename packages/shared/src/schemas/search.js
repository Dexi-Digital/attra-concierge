import { z } from "zod";
import { vehicleSearchResultSchema } from "./vehicle.js";
export const searchInventoryInputSchema = z.object({
    queryText: z.string().min(1).optional(),
    brand: z.string().min(1).optional(),
    bodyType: z.string().min(1).optional(),
    fuelType: z.string().min(1).optional(),
    priceMin: z.number().nonnegative().optional(),
    priceMax: z.number().nonnegative().optional(),
    yearMin: z.number().int().gte(1900).optional(),
    armored: z.boolean().optional(),
    usageProfile: z.string().min(1).optional(),
    positioningProfile: z.string().min(1).optional()
});
export const searchInventoryResponseSchema = z.object({
    results: z.array(vehicleSearchResultSchema),
    total: z.number().int().nonnegative(),
    appliedFilters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
    emptyReason: z.string().min(1).optional()
});
