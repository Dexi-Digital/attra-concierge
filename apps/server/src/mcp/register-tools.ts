import type { ZodType } from "zod";
import { handleCompareVehicles } from "../tools/compare-vehicles/handler.js";
import { compareVehiclesInputSchema } from "../tools/compare-vehicles/schema.js";
import { handleGetVehicleDetails } from "../tools/get-vehicle-details/handler.js";
import { getVehicleDetailsInputSchema } from "../tools/get-vehicle-details/schema.js";
import { handlePreviewPurchasePath } from "../tools/preview-purchase-path/handler.js";
import { previewPurchasePathInputSchema } from "../tools/preview-purchase-path/schema.js";
import { handleSearchInventory } from "../tools/search-inventory/handler.js";
import { searchInventoryInputSchema } from "../tools/search-inventory/schema.js";
import { handleStartConsultantHandoff } from "../tools/start-consultant-handoff/handler.js";
import { startConsultantHandoffInputSchema } from "../tools/start-consultant-handoff/schema.js";
import { toolMetadataList, type ToolName } from "./tool-metadata.js";

export interface RegisteredTool {
  name: ToolName;
  description: string;
  inputSchema: ZodType<unknown>;
  execute: (input: unknown) => Promise<unknown>;
}

export function registerTools(): RegisteredTool[] {
  return toolMetadataList.map((metadata) => ({
    ...metadata,
    inputSchema: createInputSchema(metadata.name),
    execute: createExecutor(metadata.name)
  }));
}

function createInputSchema(toolName: ToolName): ZodType<unknown> {
  switch (toolName) {
    case "search_inventory":
      return searchInventoryInputSchema;
    case "get_vehicle_details":
      return getVehicleDetailsInputSchema;
    case "compare_vehicles":
      return compareVehiclesInputSchema;
    case "start_consultant_handoff":
      return startConsultantHandoffInputSchema;
    case "preview_purchase_path":
      return previewPurchasePathInputSchema;
  }
}

function createExecutor(toolName: ToolName): (input: unknown) => Promise<unknown> {
  switch (toolName) {
    case "search_inventory":
      return (input) => handleSearchInventory(input as never);
    case "get_vehicle_details":
      return (input) => handleGetVehicleDetails(input as never);
    case "compare_vehicles":
      return (input) => handleCompareVehicles(input as never);
    case "start_consultant_handoff":
      return (input) => handleStartConsultantHandoff(input as never);
    case "preview_purchase_path":
      return (input) => handlePreviewPurchasePath(input as never);
  }
}
