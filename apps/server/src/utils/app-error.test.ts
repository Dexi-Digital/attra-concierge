import test from "node:test";
import assert from "node:assert/strict";
import { AppError, badRequest, notFound } from "./app-error.js";

test("AppError cria instância com statusCode e mensagem corretos", () => {
  const err = new AppError(500, "Internal Server Error");
  assert.equal(err.statusCode, 500);
  assert.equal(err.message, "Internal Server Error");
  assert.equal(err.name, "AppError");
  assert.ok(err instanceof Error);
  assert.ok(err instanceof AppError);
});

test("badRequest retorna AppError com statusCode 400", () => {
  const err = badRequest("Entrada inválida");
  assert.ok(err instanceof AppError);
  assert.equal(err.statusCode, 400);
  assert.equal(err.message, "Entrada inválida");
});

test("notFound retorna AppError com statusCode 404", () => {
  const err = notFound("Recurso não encontrado");
  assert.ok(err instanceof AppError);
  assert.equal(err.statusCode, 404);
  assert.equal(err.message, "Recurso não encontrado");
});

test("AppError.name é sempre 'AppError'", () => {
  const err = new AppError(422, "Unprocessable");
  assert.equal(err.name, "AppError");
});

