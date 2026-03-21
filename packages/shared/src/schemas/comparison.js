import { z } from "zod";
import { vehicleRecordSchema } from "./vehicle.js";
export const compareVehiclesInputSchema = z.object({
    vehicleIds: z.array(z.string().min(1)).min(2).max(3),
    comparisonGoal: z.string().min(1).optional()
});
export const vehicleComparisonFindingSchema = z.object({
    title: z.string().min(1),
    summary: z.string().min(1)
});
export const compareVehiclesResponseSchema = z.object({
    vehicles: z.array(vehicleRecordSchema),
    strengths: z.array(vehicleComparisonFindingSchema),
    tradeoffs: z.array(vehicleComparisonFindingSchema),
    recommendation: z.string().min(1)
});
