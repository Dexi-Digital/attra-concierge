export type ToolName =
  | "search_inventory"
  | "get_vehicle_details"
  | "compare_vehicles"
  | "start_consultant_handoff"
  | "preview_purchase_path";

export interface ToolMetadata {
  name: ToolName;
  description: string;
}

export const toolMetadataList: ToolMetadata[] = [
  {
    name: "search_inventory",
    description:
      "Busca no estoque real da Attra veículos premium por intenção e filtros (marca, carroceria, preço, ano, blindagem e perfil)."
  },
  {
    name: "get_vehicle_details",
    description: "Retorna a ficha detalhada de um veículo específico do estoque real (inclui link oficial e resumo consultivo)."
  },
  {
    name: "compare_vehicles",
    description: "Compara 2 a 3 veículos com lógica consultiva, deixando claros pontos fortes, trade-offs e recomendação por perfil."
  },
  {
    name: "start_consultant_handoff",
    description: "Cria um handoff comercial estruturado para um consultor humano, com contexto (orçamento, uso, intenção) e veículos de interesse."
  },
  {
    name: "preview_purchase_path",
    description:
      "Orienta próximos passos de compra/troca/financiamento sem prometer aprovação, taxa, parcela ou condição comercial."
  }
];
