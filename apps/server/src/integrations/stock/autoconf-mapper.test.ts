import test from "node:test";
import assert from "node:assert/strict";
import { mapAutoConfToVehicle } from "./autoconf-mapper.js";
import type { AutoConfVeiculo } from "./autoconf-client.js";

// Helper to create a minimal AutoConfVeiculo for testing
function createMinimalVehicle(overrides?: Partial<AutoConfVeiculo>): AutoConfVeiculo {
  return {
    id: 123,
    modelo_id: 1,
    modelo_nome: "911 Carrera",
    modelo_slug: "911-carrera",
    modelopai_id: 1,
    modelopai_nome: "911",
    modelopai_slug: "911",
    marca_id: 1,
    marca_nome: "Porsche",
    marca_slug: "porsche",
    tipo_nome: "Carro",
    cor_nome: "Preto",
    cor_slug: "preto",
    combustivel_nome: "Gasolina",
    combustivel_slug: "gasolina",
    cambio_nome: "Automática",
    cambio_slug: "automatica",
    carroceria_nome: "Sedã",
    carroceria_slug: "sedan",
    revenda_nome: "São Paulo",
    revenda_slug: "sao-paulo",
    status_id: 1,
    anofabricacao: "2023",
    anomodelo: "2024",
    placa: "ABC1234",
    km: 1500,
    potencia: "450 cv",
    portas: 4,
    valorvenda: "980000",
    valorpromocao: null,
    foto: "https://example.com/main.jpg",
    fotos: [{ url: "https://example.com/photo1.jpg" }, { url: "https://example.com/photo2.jpg" }],
    acessorios: [],
    zero_km: 0,
    pericia: 0,
    filtro: "new",
    filtroTipo: "categoria",
    premium: false,
    versao_descricao: "Versão Premium",
    garantia_id: 1,
    tipo_negociacao: 1,
    publicacao: "2024-01-01",
    atualizacao: "2024-01-02",
    ...overrides
  };
}

test("mapAutoConfToVehicle - mapeamento básico", () => {
  const source = createMinimalVehicle();
  const result = mapAutoConfToVehicle(source);

  assert.equal(result.id, "ac-123");
  assert.equal(result.externalStockId, "123");
  assert.equal(result.brand, "Porsche");
  assert.equal(result.model, "911");
  assert.equal(result.version, "911 Carrera");
  assert.equal(result.title, "Porsche 911 2024");
  assert.equal(result.yearModel, 2024);
  assert.equal(result.price, 980000);
  assert.equal(result.mileageKm, 1500);
  assert.equal(result.fuelType, "Gasolina");
  assert.equal(result.transmission, "Automática");
  assert.equal(result.storeUnit, "São Paulo");
  assert.equal(result.available, true);
  assert.equal(result.armored, false);
  assert.equal(result.color, "Preto");
});

test("mapAutoConfToVehicle - preço como string vazia padrão para 0", () => {
  const source = createMinimalVehicle({ valorvenda: "" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.price, 0);
});

test("mapAutoConfToVehicle - preço inválido padrão para 0", () => {
  const source = createMinimalVehicle({ valorvenda: "abc" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.price, 0);
});

test("mapAutoConfToVehicle - ano modelo prevalece sobre ano fabricação", () => {
  const source = createMinimalVehicle({
    anofabricacao: "2023",
    anomodelo: "2024"
  });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.yearModel, 2024);
});

test("mapAutoConfToVehicle - usa ano fabricação quando modelo vazio", () => {
  const source = createMinimalVehicle({
    anofabricacao: "2023",
    anomodelo: ""
  });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.yearModel, 2023);
});

test("mapAutoConfToVehicle - padrão para 2024 quando ambos anos vazios", () => {
  const source = createMinimalVehicle({
    anofabricacao: "",
    anomodelo: ""
  });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.yearModel, 2024);
});

test("mapAutoConfToVehicle - mainImageUrl usa foto se presente", () => {
  const source = createMinimalVehicle({
    foto: "https://example.com/main.jpg",
    fotos: [{ url: "https://example.com/photo1.jpg" }]
  });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.mainImageUrl, "https://example.com/main.jpg");
});

test("mapAutoConfToVehicle - mainImageUrl usa primeira foto se foto vazio", () => {
  const source = createMinimalVehicle({
    foto: "",
    fotos: [{ url: "https://example.com/photo1.jpg" }, { url: "https://example.com/photo2.jpg" }]
  });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.mainImageUrl, "https://example.com/photo1.jpg");
});

test("mapAutoConfToVehicle - mainImageUrl undefined quando nenhuma imagem", () => {
  const source = createMinimalVehicle({
    foto: "",
    fotos: []
  });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.mainImageUrl, undefined);
});

test("mapAutoConfToVehicle - filtra URLs de fotos vazias", () => {
  const source = createMinimalVehicle({
    foto: "https://example.com/main.jpg",
    fotos: [
      { url: "https://example.com/photo1.jpg" },
      { url: "" },
      { url: "https://example.com/photo2.jpg" }
    ]
  });
  const result = mapAutoConfToVehicle(source);
  assert.deepEqual(result.imageUrls, [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg"
  ]);
});

test("mapAutoConfToVehicle - detecta blindagem por slug", () => {
  const source = createMinimalVehicle({
    acessorios: [
      { nome: "Blindagem", slug: "blindagem", id: 1, categoria: "seguranca", destaque: 1 }
    ]
  });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.armored, true);
});

test("mapAutoConfToVehicle - detecta blindagem por nome com 'blindad' pattern", () => {
  const source = createMinimalVehicle({
    acessorios: [
      { nome: "BLINDADA COMPLETA", slug: "blind-completa", id: 1, categoria: "seguranca", destaque: 0 }
    ]
  });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.armored, true);
});

test("mapAutoConfToVehicle - não detecta blindagem quando não presente", () => {
  const source = createMinimalVehicle({
    acessorios: [
      { nome: "Teto solar", slug: "teto-solar", id: 1, categoria: "conforto", destaque: 1 }
    ]
  });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.armored, false);
});

test("mapAutoConfToVehicle - URL do veículo construída corretamente", () => {
  const source = createMinimalVehicle({
    marca_slug: "porsche",
    modelopai_slug: "911",
    anomodelo: "2024",
    id: 456
  });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.vehicleUrl, "https://attraveiculos.com.br/veiculo/porsche-911-2024-456");
});

test("mapAutoConfToVehicle - URL usa anofabricacao como fallback", () => {
  const source = createMinimalVehicle({
    marca_slug: "bmw",
    modelopai_slug: "x5",
    anofabricacao: "2023",
    anomodelo: "",
    id: 789
  });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.vehicleUrl, "https://attraveiculos.com.br/veiculo/bmw-x5-2023-789");
});

// Body Type Mapping Tests

test("mapBodyType - SUV", () => {
  const source = createMinimalVehicle({ carroceria_nome: "SUV" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "SUV");
});

test("mapBodyType - SUV caseless", () => {
  const source = createMinimalVehicle({ carroceria_nome: "suv" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "SUV");
});

test("mapBodyType - SUV em texto maior", () => {
  const source = createMinimalVehicle({ carroceria_nome: "SUV Compacta" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "SUV");
});

test("mapBodyType - Sedã", () => {
  const source = createMinimalVehicle({ carroceria_nome: "Sedã" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "Sedã");
});

test("mapBodyType - Sedan (English)", () => {
  const source = createMinimalVehicle({ carroceria_nome: "Sedan" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "Sedã");
});

test("mapBodyType - Hatch", () => {
  const source = createMinimalVehicle({ carroceria_nome: "Hatchback" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "Hatch");
});

test("mapBodyType - Hatch simples", () => {
  const source = createMinimalVehicle({ carroceria_nome: "Hatch" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "Hatch");
});

test("mapBodyType - Picape", () => {
  const source = createMinimalVehicle({ carroceria_nome: "Picape" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "Picape");
});

test("mapBodyType - Pickup (English)", () => {
  const source = createMinimalVehicle({ carroceria_nome: "Pickup" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "Picape");
});

test("mapBodyType - Conversível (fallback sem match exato)", () => {
  // "Conversível" com acento não contém "conversivel" sem acento em lowercase
  const source = createMinimalVehicle({ carroceria_nome: "Conversível" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "Conversível");
});

test("mapBodyType - Conversivel (sem acento)", () => {
  const source = createMinimalVehicle({ carroceria_nome: "Conversivel" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "Coupé");
});

test("mapBodyType - Coupé", () => {
  const source = createMinimalVehicle({ carroceria_nome: "Coupé" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "Coupé");
});

test("mapBodyType - Coupe (sem acento)", () => {
  const source = createMinimalVehicle({ carroceria_nome: "Coupe" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "Coupé");
});

test("mapBodyType - Cupê (alt spelling)", () => {
  const source = createMinimalVehicle({ carroceria_nome: "Cupê" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "Coupé");
});

test("mapBodyType - Van", () => {
  const source = createMinimalVehicle({ carroceria_nome: "Van" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "Van/Minivan");
});

test("mapBodyType - Minivan", () => {
  const source = createMinimalVehicle({ carroceria_nome: "Minivan" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "Van/Minivan");
});

test("mapBodyType - Wagon", () => {
  const source = createMinimalVehicle({ carroceria_nome: "Wagon" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "Wagon");
});

test("mapBodyType - Perua (Portuguese)", () => {
  const source = createMinimalVehicle({ carroceria_nome: "Perua" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "Wagon");
});

test("mapBodyType - fallback para string original", () => {
  const source = createMinimalVehicle({ carroceria_nome: "Tipo Desconhecido" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "Tipo Desconhecido");
});

test("mapBodyType - fallback para 'Outro' quando vazio", () => {
  const source = createMinimalVehicle({ carroceria_nome: "" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "Outro");
});

test("mapBodyType - case insensitive SUV", () => {
  const source = createMinimalVehicle({ carroceria_nome: "SuV cOmPaCtA" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.bodyType, "SUV");
});

// Usage Profile Inference Tests

test("inferUsageProfile - SUV retorna uso_diario", () => {
  const source = createMinimalVehicle({ carroceria_nome: "SUV" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.usageProfile, "uso_diario");
});

test("inferUsageProfile - Sedan (English) retorna uso_diario", () => {
  // Nota: código procura "sedan" sem acento, não "sedã"
  const source = createMinimalVehicle({ carroceria_nome: "Sedan" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.usageProfile, "uso_diario");
});

test("inferUsageProfile - Picape retorna aventura", () => {
  const source = createMinimalVehicle({ carroceria_nome: "Picape" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.usageProfile, "aventura");
});

test("inferUsageProfile - Pickup retorna aventura", () => {
  const source = createMinimalVehicle({ carroceria_nome: "Pickup" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.usageProfile, "aventura");
});

test("inferUsageProfile - Van retorna undefined", () => {
  const source = createMinimalVehicle({ carroceria_nome: "Van" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.usageProfile, undefined);
});

// Positioning Profile Inference Tests

test("inferPositioningProfile - preço >= 500k retorna esportivo_premium", () => {
  const source = createMinimalVehicle({ valorvenda: "500000" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.positioningProfile, "esportivo_premium");
});

test("inferPositioningProfile - preço >= 500k retorna esportivo_premium com valor maior", () => {
  const source = createMinimalVehicle({ valorvenda: "1200000" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.positioningProfile, "esportivo_premium");
});

test("inferPositioningProfile - preço [250k, 500k) retorna premium", () => {
  const source = createMinimalVehicle({ valorvenda: "300000" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.positioningProfile, "premium");
});

test("inferPositioningProfile - preço [120k, 250k) retorna intermediario", () => {
  const source = createMinimalVehicle({ valorvenda: "180000" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.positioningProfile, "intermediario");
});

test("inferPositioningProfile - preço < 120k retorna undefined", () => {
  const source = createMinimalVehicle({ valorvenda: "45000" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.positioningProfile, undefined);
});

test("inferPositioningProfile - preço exato 120k retorna intermediario", () => {
  const source = createMinimalVehicle({ valorvenda: "120000" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.positioningProfile, "intermediario");
});

test("inferPositioningProfile - preço exato 250k retorna premium", () => {
  const source = createMinimalVehicle({ valorvenda: "250000" });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.positioningProfile, "premium");
});

// Null/Undefined Handling

test("mapAutoConfToVehicle - cor_nome undefined padrão para undefined", () => {
  const source = createMinimalVehicle({ cor_nome: undefined } as any);
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.color, undefined);
});

test("mapAutoConfToVehicle - fotos null padrão para array vazio", () => {
  const source = createMinimalVehicle({ fotos: null } as any);
  const result = mapAutoConfToVehicle(source);
  assert.deepEqual(result.imageUrls, []);
});

test("mapAutoConfToVehicle - acessorios null padrão para false em armored", () => {
  const source = createMinimalVehicle({ acessorios: null } as any);
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.armored, false);
});

test("mapAutoConfToVehicle - km padrão para 0 quando undefined", () => {
  const source = createMinimalVehicle({ km: undefined } as any);
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.mileageKm, 0);
});

// Complex validation

test("mapAutoConfToVehicle - resultado é válido VehicleRecord", () => {
  const source = createMinimalVehicle({
    id: 999,
    marca_nome: "Tesla",
    modelopai_nome: "Model S",
    modelo_nome: "Model S Plaid",
    valorvenda: "750000",
    km: 5000,
    combustivel_nome: "Eletricidade",
    cambio_nome: "Automática",
    carroceria_nome: "Sedan",
    revenda_nome: "São Paulo",
    foto: "https://example.com/tesla.jpg",
    fotos: []
  });
  const result = mapAutoConfToVehicle(source);

  assert.ok(result.id);
  assert.ok(result.id.startsWith("ac-"));
  assert.ok(result.brand);
  assert.ok(result.model);
  assert.ok(result.version);
  assert.ok(result.title);
  assert.ok(result.yearModel >= 1900);
  assert.ok(result.price >= 0);
  assert.ok(result.mileageKm >= 0);
  assert.ok(result.fuelType);
  assert.ok(result.transmission);
  assert.ok(result.bodyType);
  assert.equal(typeof result.armored, "boolean");
  assert.ok(result.storeUnit);
  assert.equal(typeof result.available, "boolean");
  assert.ok(result.vehicleUrl.startsWith("https://"));
  assert.ok(Array.isArray(result.imageUrls));
});

test("mapAutoConfToVehicle - versão trimada", () => {
  const source = createMinimalVehicle({
    modelo_nome: "  Edição Especial  "
  });
  const result = mapAutoConfToVehicle(source);
  assert.equal(result.version, "Edição Especial");
});
