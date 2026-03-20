import { z } from "zod";

export const handoffContactChannelSchema = z.enum(["whatsapp", "crm", "email"]);

export const handoffIntentStageSchema = z.enum(["exploring", "shortlist", "ready"]);
export const handoffTimelineSchema = z.enum(["immediate", "7d", "30d", "60d", "90d", "unknown"]);
export const handoffPrimaryUseSchema = z.enum([
  "daily",
  "executive",
  "family",
  "weekend",
  "performance",
  "offroad",
  "mixed",
  "unknown"
]);

export const handoffContextSchema = z
  .object({
    budget: z
      .object({
        min: z.number().nonnegative().optional(),
        max: z.number().nonnegative().optional(),
        notes: z.string().min(1).optional()
      })
      .optional(),
    usage: z
      .object({
        primaryUse: handoffPrimaryUseSchema.optional(),
        needsArmoring: z.boolean().optional(),
        passengers: z.number().int().nonnegative().optional(),
        notes: z.string().min(1).optional()
      })
      .optional(),
    location: z
      .object({
        city: z.string().min(1).optional(),
        region: z.string().min(1).optional()
      })
      .optional(),
    tradeIn: z
      .object({
        hasTradeIn: z.boolean().optional(),
        vehicleDescription: z.string().min(1).optional(),
        notes: z.string().min(1).optional()
      })
      .optional(),
    intent: z
      .object({
        stage: handoffIntentStageSchema.optional(),
        timeline: handoffTimelineSchema.optional(),
        notes: z.string().min(1).optional()
      })
      .optional(),
    priorities: z.array(z.string().min(1)).max(8).optional(),
    objections: z.array(z.string().min(1)).max(6).optional()
  })
  .optional();

export const startConsultantHandoffInputSchema = z
  .object({
    // Backwards-compatible: allow either a single id (vehicleId) or a shortlist (vehicleIds)
    vehicleId: z.string().min(1).optional(),
    vehicleIds: z.array(z.string().min(1)).min(1).max(3).optional(),

    interestSummary: z.string().min(1),
    preferredStore: z.string().min(1).optional(),
    contactChannel: handoffContactChannelSchema,
    userName: z.string().min(1).optional(),

    // Structured context for a commercially useful handoff
    context: handoffContextSchema
  })
  .superRefine((value, ctx) => {
    const ids = [
      ...(value.vehicleIds ?? []),
      ...(value.vehicleId ? [value.vehicleId] : [])
    ];
    const uniqueIds = Array.from(new Set(ids));

    if (uniqueIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe vehicleId ou vehicleIds (1 a 3).",
        path: ["vehicleIds"]
      });
    }

    if (uniqueIds.length > 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe no máximo 3 veículos no handoff.",
        path: ["vehicleIds"]
      });
    }

    const min = value.context?.budget?.min;
    const max = value.context?.budget?.max;
    if (typeof min === "number" && typeof max === "number" && min > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "context.budget.min não pode ser maior que context.budget.max.",
        path: ["context", "budget"]
      });
    }
  });

export type StartConsultantHandoffInput = z.infer<typeof startConsultantHandoffInputSchema>;

export const handoffVehicleSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  version: z.string().min(1),
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
  vehicleUrl: z.string().url(),
  mainImageUrl: z.string().url().optional()
});

export type HandoffVehicleSummary = z.infer<typeof handoffVehicleSummarySchema>;

export const startConsultantHandoffPayloadSchema = z.object({
  origin: z.literal("chatgpt_app"),
  createdAt: z.string().min(1),
  requestedVehicleIds: z.array(z.string().min(1)).min(1).max(3),
  vehicles: z.array(handoffVehicleSummarySchema).min(1).max(3),
  contactChannel: handoffContactChannelSchema,
  preferredStore: z.string().min(1).nullable(),
  userName: z.string().min(1).nullable(),
  interestSummary: z.string().min(1),
  context: handoffContextSchema.nullable()
});

export type StartConsultantHandoffPayload = z.infer<typeof startConsultantHandoffPayloadSchema>;

export const startConsultantHandoffResponseSchema = z.object({
  status: z.enum(["accepted", "failed"]),
  destination: z.string().min(1),
  message: z.string().min(1),
  payload: startConsultantHandoffPayloadSchema
});

export type StartConsultantHandoffResponse = z.infer<typeof startConsultantHandoffResponseSchema>;

export const previewPurchasePathInputSchema = z.object({
  vehicleId: z.string().min(1),
  purchaseMode: z.enum(["cash", "trade_in", "financing"]),
  budgetContext: z.string().min(1).optional()
});

export type PreviewPurchasePathInput = z.infer<typeof previewPurchasePathInputSchema>;

export const previewPurchasePathResponseSchema = z.object({
  nextSteps: z.array(z.string().min(1)).min(1),
  disclaimer: z.string().min(1)
});

export type PreviewPurchasePathResponse = z.infer<typeof previewPurchasePathResponseSchema>;
