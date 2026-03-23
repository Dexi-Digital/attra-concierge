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
  /** OpenAI Product Feed Spec — condição do veículo */
  condition: z.enum(["new", "used"]).optional(),
  /** OpenAI Product Feed Spec — status de disponibilidade padronizado */
  availability: z.enum(["in_stock", "out_of_stock", "preorder", "backorder"]).optional(),
  /** OpenAI Product Feed Spec — código de moeda ISO 4217 */
  currency: z.string().length(3).optional(),
  vehicleUrl: z.string().url(),
  mainImageUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()),
  usageProfile: z.string().min(1).optional(),
  positioningProfile: z.string().min(1).optional()
});

export type VehicleRecord = z.infer<typeof vehicleRecordSchema>;

export const vehicleSearchHighlightSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1)
});

export type VehicleSearchHighlight = z.infer<typeof vehicleSearchHighlightSchema>;

export const vehicleSearchResultSchema = z.object({
  vehicle: vehicleRecordSchema,
  highlights: z.array(vehicleSearchHighlightSchema),
  matchReason: z.string().min(1)
});

export type VehicleSearchResult = z.infer<typeof vehicleSearchResultSchema>;

export const getVehicleDetailsInputSchema = z.object({
  vehicleId: z.string().min(1)
});

export type GetVehicleDetailsInput = z.infer<typeof getVehicleDetailsInputSchema>;

export const getVehicleDetailsResponseSchema = z.object({
  vehicle: vehicleRecordSchema,
  highlights: z.array(z.string().min(1)),
  consultantSummary: z.string().min(1),
  officialLink: z.string().url()
});

export type GetVehicleDetailsResponse = z.infer<typeof getVehicleDetailsResponseSchema>;
