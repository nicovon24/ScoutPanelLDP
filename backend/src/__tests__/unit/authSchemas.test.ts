import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "../../routes/auth";

// ── loginSchema ───────────────────────────────────────────────────────────────

describe("loginSchema", () => {
  it("acepta credenciales válidas", () => {
    const r = loginSchema.safeParse({ email: "user@test.com", password: "pass" });
    expect(r.success).toBe(true);
  });

  it("normaliza el email a lowercase", () => {
    const r = loginSchema.safeParse({ email: "USER@TEST.COM", password: "x" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("user@test.com");
  });

  it("rechaza email con formato inválido", () => {
    const r = loginSchema.safeParse({ email: "no-es-un-email", password: "x" });
    expect(r.success).toBe(false);
  });

  it("rechaza email vacío", () => {
    const r = loginSchema.safeParse({ email: "", password: "x" });
    expect(r.success).toBe(false);
  });

  it("rechaza password vacío (min 1)", () => {
    const r = loginSchema.safeParse({ email: "u@t.com", password: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("La contraseña es requerida");
  });

  it("rechaza body completamente vacío", () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
  });
});

// ── registerSchema ────────────────────────────────────────────────────────────

describe("registerSchema", () => {
  it("acepta un registro válido", () => {
    const r = registerSchema.safeParse({
      email: "apiuser@scoutpanel.com",
      password: "123456",
      name: "Scout Pro",
    });
    expect(r.success).toBe(true);
  });

  it("normaliza el email a lowercase", () => {
    const r = registerSchema.safeParse({
      email: "APIUSER@SCOUTPANEL.COM",
      password: "123456",
      name: "Scout",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("apiuser@scoutpanel.com");
  });

  it("recorta espacios del nombre", () => {
    const r = registerSchema.safeParse({
      email: "a@b.com",
      password: "123456",
      name: "  Pedro  ",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe("Pedro");
  });

  it("rechaza password menor a 6 caracteres", () => {
    const r = registerSchema.safeParse({ email: "a@b.com", password: "12345", name: "X" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toContain("6");
  });

  it("rechaza nombre vacío", () => {
    const r = registerSchema.safeParse({ email: "a@b.com", password: "123456", name: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("El nombre es requerido");
  });

  it("rechaza email sin dominio", () => {
    const r = registerSchema.safeParse({ email: "sin-arroba", password: "123456", name: "X" });
    expect(r.success).toBe(false);
  });

  it("rechaza password mayor a 72 caracteres (límite bcrypt)", () => {
    const r = registerSchema.safeParse({
      email: "a@b.com",
      password: "a".repeat(73),
      name: "X",
    });
    expect(r.success).toBe(false);
  });
});
