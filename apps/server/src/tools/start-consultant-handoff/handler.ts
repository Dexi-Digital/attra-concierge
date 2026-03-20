import type { StartConsultantHandoffInput } from "@attra/shared";
import { presentConsultantHandoff } from "./presenter.js";
import { startConsultantHandoff } from "./service.js";

export async function handleStartConsultantHandoff(input: StartConsultantHandoffInput) {
  return presentConsultantHandoff(await startConsultantHandoff(input));
}
