import type { GetVehicleDetailsInput } from "./schema.js";
import { presentVehicleDetails } from "./presenter.js";
import { getVehicleDetails } from "./service.js";

export async function handleGetVehicleDetails(input: GetVehicleDetailsInput) {
  return presentVehicleDetails(await getVehicleDetails(input));
}
