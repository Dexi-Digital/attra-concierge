import { readEnv } from "./env.js";

export const env = readEnv();

export const appConfig = {
  name: "Attra Concierge",
  version: "0.1.0",
  description: "MVP backend do app Attra Concierge para ChatGPT.",
  env
};
