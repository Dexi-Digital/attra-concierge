import type { CompareVehiclesInput } from "@attra/shared";
import { presentComparison } from "./presenter.js";
import { compareVehicles } from "./service.js";

export async function handleCompareVehicles(input: CompareVehiclesInput) {
  return presentComparison(await compareVehicles(input));
}
