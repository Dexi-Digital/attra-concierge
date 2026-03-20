import type { CompareVehiclesInput, CompareVehiclesResponse } from "@attra/shared";
import { vehicleRepository } from "../../domain/vehicles/vehicle.repository.js";
import { badRequest, notFound } from "../../utils/app-error.js";

export async function compareVehicles(input: CompareVehiclesInput): Promise<CompareVehiclesResponse> {
  if (input.vehicleIds.length < 2 || input.vehicleIds.length > 3) {
    throw badRequest("A comparação deve receber 2 ou 3 veículos.");
  }

  const vehicles = await vehicleRepository.findManyByIds(input.vehicleIds);

  if (vehicles.length !== input.vehicleIds.length) {
    throw notFound("Um ou mais veículos informados não foram encontrados.");
  }

  const cheapestVehicle = [...vehicles].sort((left, right) => left.price - right.price)[0];
  const premiumVehicle = [...vehicles].sort((left, right) => right.price - left.price)[0];

  return {
    vehicles,
    strengths: [
      {
        title: "Racionalidade de compra",
        summary: `${cheapestVehicle.title} entrega o menor ticket entre as opções comparadas.`
      },
      {
        title: "Presença e posicionamento",
        summary: `${premiumVehicle.title} representa a proposta mais aspiracional do grupo.`
      }
    ],
    tradeoffs: vehicles.map((vehicle) => ({
      title: vehicle.title,
      summary: vehicle.bodyType === "SUV"
        ? "Entrega praticidade maior, mas com footprint mais alto no uso urbano."
        : "Favorece imagem e dirigibilidade, com menor versatilidade familiar."
    })),
    recommendation: buildRecommendation(vehicles, input.comparisonGoal)
  };
}

function buildRecommendation(
  vehicles: CompareVehiclesResponse["vehicles"],
  comparisonGoal?: string
): string {
  const suvCandidate = vehicles.find((vehicle) => vehicle.bodyType === "SUV");

  if (comparisonGoal?.toLowerCase().includes("famil")) {
    return `${suvCandidate?.title ?? vehicles[0].title} tende a aderir melhor ao uso familiar e executivo.`;
  }

  return `${vehicles[0].title} deve ser priorizado se a busca estiver mais alinhada a emoção e posicionamento.`;
}
