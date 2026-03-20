import type { PreviewPurchasePathInput } from "@attra/shared";
import { presentPurchasePath } from "./presenter.js";
import { previewPurchasePath } from "./service.js";

export async function handlePreviewPurchasePath(input: PreviewPurchasePathInput) {
  return presentPurchasePath(await previewPurchasePath(input));
}
