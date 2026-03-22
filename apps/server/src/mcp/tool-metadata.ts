export type ToolName =
  | "search_inventory"
  | "get_vehicle_details"
  | "compare_vehicles"
  | "start_consultant_handoff"
  | "preview_purchase_path";

/** MCP canonical tool name (camelCase) → internal snake_case name */
export const MCP_TOOL_NAME_MAP: Record<string, ToolName> = {
  searchInventory: "search_inventory",
  getVehicleDetails: "get_vehicle_details",
  compareVehicles: "compare_vehicles",
  startConsultantHandoff: "start_consultant_handoff",
  previewPurchasePath: "preview_purchase_path"
};

/** Reverse map for output */
export const INTERNAL_TO_MCP_NAME: Record<ToolName, string> = {
  search_inventory: "searchInventory",
  get_vehicle_details: "getVehicleDetails",
  compare_vehicles: "compareVehicles",
  start_consultant_handoff: "startConsultantHandoff",
  preview_purchase_path: "previewPurchasePath"
};

/**
 * MCP Tool Annotations (per MCP spec 2025-03-26).
 * readOnlyHint: tool does not modify external state.
 * destructiveHint: tool could have irreversible side effects.
 * idempotentHint: same call produces same result.
 * openWorldHint: tool may fetch external data.
 */
export interface McpToolAnnotations {
  title: string;
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
}

export interface ToolMetadata {
  name: ToolName;
  description: string;
  annotations: McpToolAnnotations;
}

export const toolMetadataList: ToolMetadata[] = [
  {
    name: "search_inventory",
    description:
      "Busca veículos do estoque real da Attra com base em perfil, faixa de preço, marca, categoria e outros filtros. Use para recomendar opções reais e nunca para inventar disponibilidade.",
    annotations: {
      title: "Buscar Estoque",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: "get_vehicle_details",
    description:
      "Retorna a ficha detalhada de um veículo específico a partir do ID real do estoque. Use para aprofundar uma opção já identificada.",
    annotations: {
      title: "Detalhes do Veículo",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: "compare_vehicles",
    description:
      "Compara veículos reais da Attra por eixos práticos, como conforto, proposta de uso, presença, espaço e perfil de condução.",
    annotations: {
      title: "Comparar Veículos",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: "start_consultant_handoff",
    description:
      "Registra um handoff para consultor humano com contexto estruturado da conversa. Use apenas quando houver intenção real de avanço.",
    annotations: {
      title: "Encaminhar para Consultor",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false
    }
  },
  {
    name: "preview_purchase_path",
    description:
      "Mostra caminhos de compra, troca, visita ou financiamento sem prometer condições comerciais. Use para orientar próximos passos com segurança.",
    annotations: {
      title: "Jornada de Compra",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  }
];
