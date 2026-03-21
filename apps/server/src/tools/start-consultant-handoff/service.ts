import type { StartConsultantHandoffInput, StartConsultantHandoffResponse } from "@attra/shared";
import { readEnv } from "../../config/env.js";
import { vehicleRepository } from "../../domain/vehicles/vehicle.repository.js";
import { logger } from "../../telemetry/logger.js";
import { notFound } from "../../utils/app-error.js";

async function dispatchWebhook(
  url: string,
  payload: StartConsultantHandoffResponse["payload"]
): Promise<void> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000)
    });
    if (!res.ok) {
      logger.warn("handoff: webhook retornou status inesperado", {
        status: res.status,
        url
      });
    } else {
      logger.info("handoff: webhook disparado com sucesso", { status: res.status, url });
    }
  } catch (err) {
    logger.error("handoff: falha ao disparar webhook", {
      url,
      error: err instanceof Error ? err.message : String(err)
    });
    // Não propaga o erro — o handoff foi aceito independente do webhook
  }
}

export async function startConsultantHandoff(
  input: StartConsultantHandoffInput
): Promise<StartConsultantHandoffResponse> {
  const requestedVehicleIds = Array.from(
    new Set([...(input.vehicleIds ?? []), ...(input.vehicleId ? [input.vehicleId] : [])])
  );

  const vehicles = await vehicleRepository.findManyByIds(requestedVehicleIds);
  const missingIds = requestedVehicleIds.filter((id) => !vehicles.some((v) => v.id === id));

  if (missingIds.length > 0) {
    throw notFound(`Veículo(s) não encontrado(s) para handoff: ${missingIds.join(", ")}.`);
  }

  // Preserve request order
  const orderedVehicles = requestedVehicleIds
    .map((id) => vehicles.find((v) => v.id === id)!)
    .slice(0, 3);

  const primaryVehicle = orderedVehicles[0];

  const response: StartConsultantHandoffResponse = {
    status: "accepted",
    destination: input.contactChannel,
    message: `Interesse em ${primaryVehicle.title} preparado para continuidade comercial.`,
    payload: {
      origin: "chatgpt_app",
      createdAt: new Date().toISOString(),
      requestedVehicleIds,
      vehicles: orderedVehicles.map((vehicle) => ({
        id: vehicle.id,
        title: vehicle.title,
        brand: vehicle.brand,
        model: vehicle.model,
        version: vehicle.version,
        yearModel: vehicle.yearModel,
        price: vehicle.price,
        mileageKm: vehicle.mileageKm,
        fuelType: vehicle.fuelType,
        transmission: vehicle.transmission,
        bodyType: vehicle.bodyType,
        armored: vehicle.armored,
        color: vehicle.color,
        storeUnit: vehicle.storeUnit,
        available: vehicle.available,
        vehicleUrl: vehicle.vehicleUrl,
        mainImageUrl: vehicle.mainImageUrl
      })),
      interestSummary: input.interestSummary,
      contactChannel: input.contactChannel,
      preferredStore: input.preferredStore ?? null,
      userName: input.userName ?? null,
      context: input.context ?? null
    }
  };

  const { handoffWebhookUrl } = readEnv();
  void dispatchWebhook(handoffWebhookUrl, response.payload);

  return response;
}
