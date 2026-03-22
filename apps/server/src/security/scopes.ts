/**
 * OAuth 2.1 scope definitions for Attra MCP Server.
 * Read scopes cover inventory/vehicle/comparison operations.
 * Write scope is required only for startConsultantHandoff.
 */

export const SCOPES = {
  INVENTORY_READ: "attra.inventory.read",
  VEHICLE_READ: "attra.vehicle.read",
  COMPARE_READ: "attra.compare.read",
  PURCHASE_PATH_READ: "attra.purchase_path.read",
  HANDOFF_WRITE: "attra.handoff.write"
} as const;

export type Scope = (typeof SCOPES)[keyof typeof SCOPES];

/** MCP tool name → required OAuth scopes */
export const TOOL_REQUIRED_SCOPES: Record<string, Scope[]> = {
  searchInventory: [SCOPES.INVENTORY_READ],
  getVehicleDetails: [SCOPES.VEHICLE_READ],
  compareVehicles: [SCOPES.COMPARE_READ],
  previewPurchasePath: [SCOPES.PURCHASE_PATH_READ],
  startConsultantHandoff: [SCOPES.HANDOFF_WRITE]
};

/** All Attra-specific scopes a fully-authorized token should carry */
export const ALL_SCOPES: Scope[] = Object.values(SCOPES);

/**
 * OIDC standard scopes — handled separately from Attra business scopes.
 * These control what claims appear in the id_token and userinfo response.
 */
export const OIDC_SCOPES = ["openid", "email", "profile"] as const;
export type OidcScope = (typeof OIDC_SCOPES)[number];

/** All scopes supported by this server (Attra + OIDC) */
export const ALL_SUPPORTED_SCOPES: string[] = [...ALL_SCOPES, ...OIDC_SCOPES];

export function hasRequiredScopes(
  grantedScopes: string[],
  requiredScopes: Scope[]
): boolean {
  return requiredScopes.every((s) => grantedScopes.includes(s));
}

