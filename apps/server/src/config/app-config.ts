import { readEnv } from "./env.js";

export const env = readEnv();

export const appConfig = {
  name: "Attra Concierge",
  version: "1.0.0",
  description: "Attra Concierge — assistente de descoberta e comparação de veículos premium da Attra Veículos.",
  env
};
