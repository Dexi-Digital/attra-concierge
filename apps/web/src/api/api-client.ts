import type {
  SearchInventoryInput,
  SearchInventoryResponse,
  GetVehicleDetailsInput,
  GetVehicleDetailsResponse,
  CompareVehiclesInput,
  CompareVehiclesResponse,
  StartConsultantHandoffInput,
  StartConsultantHandoffResponse,
  PreviewPurchasePathInput,
  PreviewPurchasePathResponse
} from "@attra/shared";

// Em dev, o proxy do Vite encaminha /tools → localhost:3000.
// Em prod (build servido pelo server), a URL é relativa ao mesmo host.
const BASE = import.meta.env.VITE_API_BASE ?? "";

async function callTool<TInput, TResponse>(
  toolName: string,
  input: TInput
): Promise<TResponse> {
  const response = await fetch(`${BASE}/tools/${toolName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error ?? json.message ?? `Erro ${response.status}`);
  }

  return json.result as TResponse;
}

export function searchInventory(
  input: SearchInventoryInput
): Promise<SearchInventoryResponse> {
  return callTool("search_inventory", input);
}

export function getVehicleDetails(
  input: GetVehicleDetailsInput
): Promise<GetVehicleDetailsResponse> {
  return callTool("get_vehicle_details", input);
}

export function compareVehicles(
  input: CompareVehiclesInput
): Promise<CompareVehiclesResponse> {
  return callTool("compare_vehicles", input);
}

export function startConsultantHandoff(
  input: StartConsultantHandoffInput
): Promise<StartConsultantHandoffResponse> {
  return callTool("start_consultant_handoff", input);
}

export function previewPurchasePath(
  input: PreviewPurchasePathInput
): Promise<PreviewPurchasePathResponse> {
  return callTool("preview_purchase_path", input);
}

