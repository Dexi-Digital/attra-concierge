import type { AppEnv } from "../../config/env.js";

/** Raw vehicle record from AutoConf API */
export interface AutoConfVeiculo {
  id: number;
  modelo_id: number;
  modelo_nome: string;
  modelo_slug: string;
  modelopai_id: number;
  modelopai_nome: string;
  modelopai_slug: string;
  marca_id: number;
  marca_nome: string;
  marca_slug: string;
  tipo_nome: string;
  cor_nome: string;
  cor_slug: string;
  combustivel_nome: string;
  combustivel_slug: string;
  cambio_nome: string;
  cambio_slug: string;
  carroceria_nome: string;
  carroceria_slug: string;
  revenda_nome: string;
  revenda_slug: string;
  status_id: number;
  anofabricacao: string;
  anomodelo: string;
  placa: string;
  km: number;
  potencia: string | null;
  portas: number;
  valorvenda: string;
  valorpromocao: string | null;
  foto: string;
  fotos: { url: string }[];
  acessorios: { nome: string; id: number; categoria: string; destaque: number; slug: string }[];
  zero_km: number;
  pericia: number;
  filtro: string;
  filtroTipo: string;
  premium: boolean;
  versao_descricao: string | null;
  garantia_id: number;
  tipo_negociacao: number;
  publicacao: string;
  atualizacao: string;
}

export interface AutoConfResponse {
  count: number;
  registros_por_pagina: number;
  pagina_atual: number;
  ultima_pagina: number;
  veiculos: AutoConfVeiculo[];
}

export interface AutoConfClient {
  fetchVeiculos(page?: number): Promise<AutoConfResponse>;
  fetchAllVeiculos(): Promise<AutoConfVeiculo[]>;
}

export function createAutoConfClient(env: AppEnv): AutoConfClient {
  const { autoconfBaseUrl, autoconfAuthToken, autoconfRevendaToken } = env;

  async function fetchVeiculos(page = 1): Promise<AutoConfResponse> {
    const url = `${autoconfBaseUrl}/api/v1/veiculos`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: autoconfAuthToken,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ token: autoconfRevendaToken, pagina: page })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AutoConf API error: ${res.status} ${res.statusText} – ${text.slice(0, 200)}`);
    }

    return res.json() as Promise<AutoConfResponse>;
  }

  async function fetchAllVeiculos(): Promise<AutoConfVeiculo[]> {
    const firstPage = await fetchVeiculos(1);
    const allVeiculos = [...firstPage.veiculos];

    for (let page = 2; page <= firstPage.ultima_pagina; page++) {
      const nextPage = await fetchVeiculos(page);
      allVeiculos.push(...nextPage.veiculos);
    }

    return allVeiculos;
  }

  return { fetchVeiculos, fetchAllVeiculos };
}

