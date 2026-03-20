import type { SearchInventoryInput } from "@attra/shared";
import { presentSearchInventory } from "./presenter.js";
import { searchInventory } from "./service.js";

export async function handleSearchInventory(input: SearchInventoryInput) {
  return presentSearchInventory(await searchInventory(input));
}
