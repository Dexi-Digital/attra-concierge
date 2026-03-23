import type { VehicleRecord } from "@attra/shared";
import type { AutoConfVeiculo } from "./autoconf-client.js";

/**
 * Maps an AutoConf vehicle record to the internal VehicleRecord format.
 */
export function mapAutoConfToVehicle(v: AutoConfVeiculo): VehicleRecord {
  const price = parseFloat(v.valorvenda) || 0;
  const yearModel = parseInt(v.anomodelo, 10) || parseInt(v.anofabricacao, 10) || 2024;

  const imageUrls = (v.fotos ?? [])
    .map((f) => f.url)
    .filter((url): url is string => typeof url === "string" && url.length > 0);

  const mainImageUrl = v.foto || imageUrls[0] || undefined;

  const hasBlindagem = (v.acessorios ?? []).some(
    (acc) => acc.slug === "blindagem" || acc.nome.toLowerCase().includes("blindad")
  );

  const title = buildTitle(v);
  const vehicleUrl = buildVehicleUrl(v);

  const mileageKm = v.km ?? 0;

  return {
    id: `ac-${v.id}`,
    externalStockId: String(v.id),
    brand: v.marca_nome,
    model: v.modelopai_nome,
    version: v.modelo_nome.trim(),
    title,
    yearModel,
    price,
    mileageKm,
    fuelType: v.combustivel_nome,
    transmission: v.cambio_nome,
    bodyType: mapBodyType(v.carroceria_nome),
    armored: hasBlindagem,
    color: v.cor_nome || undefined,
    storeUnit: v.revenda_nome,
    available: true,
    // OpenAI Product Feed Spec fields
    condition: mileageKm === 0 ? "new" : "used",
    availability: "in_stock",
    currency: "BRL",
    vehicleUrl,
    mainImageUrl,
    imageUrls,
    usageProfile: inferUsageProfile(v),
    positioningProfile: inferPositioningProfile(v, price)
  };
}

function buildTitle(v: AutoConfVeiculo): string {
  const year = v.anomodelo || v.anofabricacao;
  return `${v.marca_nome} ${v.modelopai_nome} ${year}`.trim();
}

function buildVehicleUrl(v: AutoConfVeiculo): string {
  const year = v.anomodelo || v.anofabricacao;
  return `https://attraveiculos.com.br/veiculo/${v.marca_slug}-${v.modelopai_slug}-${year}-${v.id}`;
}

function mapBodyType(carroceria: string): string {
  const normalized = (carroceria ?? "").toLowerCase();
  if (normalized.includes("suv")) return "SUV";
  if (normalized.includes("sedan")) return "Sedã";
  if (normalized.includes("hatch")) return "Hatch";
  if (normalized.includes("picape") || normalized.includes("pickup")) return "Picape";
  if (normalized.includes("conversivel") || normalized.includes("cupe") || normalized.includes("cupê") || normalized.includes("coupe"))
    return "Coupé";
  if (normalized.includes("van") || normalized.includes("minivan")) return "Van/Minivan";
  if (normalized.includes("wagon") || normalized.includes("perua")) return "Wagon";
  return carroceria || "Outro";
}

function inferUsageProfile(v: AutoConfVeiculo): string | undefined {
  const body = (v.carroceria_nome ?? "").toLowerCase();
  if (body.includes("suv") || body.includes("sedan")) return "uso_diario";
  if (body.includes("picape") || body.includes("pickup")) return "aventura";
  return undefined;
}

function inferPositioningProfile(v: AutoConfVeiculo, price: number): string | undefined {
  if (price >= 500_000) return "esportivo_premium";
  if (price >= 250_000) return "premium";
  if (price >= 120_000) return "intermediario";
  return undefined;
}

