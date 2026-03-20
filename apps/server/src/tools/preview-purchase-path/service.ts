import type { PreviewPurchasePathInput, PreviewPurchasePathResponse } from "@attra/shared";
import { vehicleRepository } from "../../domain/vehicles/vehicle.repository.js";
import { notFound } from "../../utils/app-error.js";

export async function previewPurchasePath(
  input: PreviewPurchasePathInput
): Promise<PreviewPurchasePathResponse> {
  const vehicle = await vehicleRepository.findById(input.vehicleId);

  if (!vehicle) {
    throw notFound(`Veículo ${input.vehicleId} não encontrado para orientar a jornada.`);
  }

  return {
    nextSteps: [
      `Confirmar interesse no veículo ${vehicle.title}.`,
      `Validar disponibilidade atual na unidade ${vehicle.storeUnit}.`,
      buildPurchaseModeStep(input.purchaseMode),
      "Encaminhar para atendimento humano com contexto consolidado."
    ],
    disclaimer: "O MVP não realiza simulação financeira nem aprovação automática."
  };
}

function buildPurchaseModeStep(purchaseMode: PreviewPurchasePathInput["purchaseMode"]): string {
  switch (purchaseMode) {
    case "cash":
      return "Preparar proposta para compra à vista com atendimento consultivo humano.";
    case "trade_in":
      return "Coletar dados do veículo de troca para avaliação manual posterior.";
    case "financing":
      return "Explicar que a análise financeira seguirá com suporte humano, sem promessa antecipada.";
  }
}
