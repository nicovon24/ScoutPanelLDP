import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: err.errors[0]?.message ?? "Datos inválidos",
    });
    return;
  }

  console.error("[error]", err);
  res.status(500).json({ error: "Error interno del servidor" });
}
