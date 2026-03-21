// Em dev, o proxy do Vite encaminha /tools → localhost:3000.
// Em prod (build servido pelo server), a URL é relativa ao mesmo host.
const BASE = import.meta.env.VITE_API_BASE ?? "";
async function callTool(toolName, input) {
    const response = await fetch(`${BASE}/tools/${toolName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
    });
    const json = await response.json();
    if (!response.ok) {
        throw new Error(json.error ?? json.message ?? `Erro ${response.status}`);
    }
    return json.result;
}
export function searchInventory(input) {
    return callTool("search_inventory", input);
}
export function getVehicleDetails(input) {
    return callTool("get_vehicle_details", input);
}
export function compareVehicles(input) {
    return callTool("compare_vehicles", input);
}
export function startConsultantHandoff(input) {
    return callTool("start_consultant_handoff", input);
}
export function previewPurchasePath(input) {
    return callTool("preview_purchase_path", input);
}
