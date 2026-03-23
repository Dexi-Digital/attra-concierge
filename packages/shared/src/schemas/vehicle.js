import { z } from "zod";
export const vehicleRecordSchema = z.object({
    id: z.string().min(1),
    externalStockId: z.string().min(1).optional(),
    brand: z.string().min(1),
    model: z.string().min(1),
    version: z.string().min(1),
    title: z.string().min(1),
    yearModel: z.number().int().gte(1900),
    price: z.number().nonnegative(),
    mileageKm: z.number().nonnegative(),
    fuelType: z.string().min(1),
    transmission: z.string().min(1),
    bodyType: z.string().min(1),
    armored: z.boolean(),
    color: z.string().min(1).optional(),
    storeUnit: z.string().min(1),
    available: z.boolean(),
    condition: z.enum(["new", "used"]).optional(),
    availability: z.enum(["in_stock", "out_of_stock", "preorder", "backorder"]).optional(),
    currency: z.string().length(3).optional(),
    vehicleUrl: z.string().url(),
    mainImageUrl: z.string().url().optional(),
    imageUrls: z.array(z.string().url()),
    usageProfile: z.string().min(1).optional(),
    positioningProfile: z.string().min(1).optional()
});
export const vehicleSearchHighlightSchema = z.object({
    label: z.string().min(1),
    value: z.string().min(1)
});
export const vehicleSearchResultSchema = z.object({
    vehicle: vehicleRecordSchema,
    highlights: z.array(vehicleSearchHighlightSchema),
    matchReason: z.string().min(1)
});
export const getVehicleDetailsInputSchema = z.object({
    vehicleId: z.string().min(1)
});
export const getVehicleDetailsResponseSchema = z.object({
    vehicle: vehicleRecordSchema,
    highlights: z.array(z.string().min(1)),
    consultantSummary: z.string().min(1),
    officialLink: z.string().url()
});
