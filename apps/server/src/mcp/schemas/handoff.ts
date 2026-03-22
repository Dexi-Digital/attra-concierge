/**
 * MCP-aligned schemas for previewPurchasePath and startConsultantHandoff tools.
 * Field names, enums and required fields match mcp-instructions.md exactly.
 */
import { z } from "zod";

/* ─── previewPurchasePath ───────────────────────────────────────── */

export const mcpInterestTypeEnum = z.enum([
  "purchase",
  "trade_in",
  "financing",
  "visit",
  "reservation",
  "proposal"
]);

export const mcpPreviewPurchasePathInputSchema = z.object({
  vehicleId: z.string().min(1).optional(),
  interestType: mcpInterestTypeEnum
}).strict();

export type McpPreviewPurchasePathInput = z.infer<typeof mcpPreviewPurchasePathInputSchema>;

export const mcpPreviewPurchasePathOutputSchema = z.object({
  interestType: mcpInterestTypeEnum,
  allowedGuidance: z.array(z.string()),
  disallowedClaims: z.array(z.string()),
  nextStepOptions: z.array(z.string())
});

export type McpPreviewPurchasePathOutput = z.infer<typeof mcpPreviewPurchasePathOutputSchema>;

/* ─── startConsultantHandoff ────────────────────────────────────── */

export const mcpPreferredChannelEnum = z.enum([
  "whatsapp",
  "email",
  "phone",
  "unspecified"
]);

export const mcpIntentLevelEnum = z.enum(["low", "medium", "high"]);

export const mcpStartConsultantHandoffInputSchema = z.object({
  customerName: z.string().max(200).optional(),
  preferredChannel: mcpPreferredChannelEnum,
  contactValue: z.string().max(200).optional(),
  vehicleIds: z.array(z.string().min(1)).max(5).optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  intendedUse: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  hasTradeIn: z.boolean().optional(),
  tradeInDescription: z.string().max(500).optional(),
  customerQuestions: z.array(z.string().max(500)).optional(),
  intentLevel: mcpIntentLevelEnum,
  conversationSummary: z.string().min(1).max(2000),
  source: z.enum(["chatgpt_app"])
}).strict().superRefine((value, ctx) => {
  if (
    typeof value.budgetMin === "number" &&
    typeof value.budgetMax === "number" &&
    value.budgetMin > value.budgetMax
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "budgetMin não pode ser maior que budgetMax.",
      path: ["budgetMin"]
    });
  }
});

export type McpStartConsultantHandoffInput = z.infer<
  typeof mcpStartConsultantHandoffInputSchema
>;

export const mcpHandoffOutputSchema = z.object({
  handoffId: z.string(),
  status: z.literal("created"),
  message: z.string(),
  nextStep: z.literal("consultant_followup")
});

export type McpHandoffOutput = z.infer<typeof mcpHandoffOutputSchema>;

