import { createServer } from "node:http";
import { routeRequest } from "./routes.js";
import { sendError } from "./error-handler.js";
import { AppError } from "../utils/app-error.js";

export function createAppServer() {
  return createServer(async (request, response) => {
    try {
      await routeRequest(request, response);
    } catch (error) {
      if (error instanceof AppError) {
        sendError(response, error.statusCode, error.message);
        return;
      }

      const message = error instanceof Error ? error.message : "Erro interno inesperado.";
      sendError(response, 500, message);
    }
  });
}
