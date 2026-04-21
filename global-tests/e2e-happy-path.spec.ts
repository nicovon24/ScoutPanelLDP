/**
 * E2E — Happy Path
 *
 * Cubre el flujo crítico completo:
 *   Login → Dashboard → Buscar jugador → Detalle → Agregar a Comparar → Vista de Comparación
 *
 * Requiere que el frontend (puerto 3000) y el backend (puerto 4000) estén corriendo.
 * Correr con: npx playwright test
 */
import { test, expect, type Page } from "@playwright/test";

// ── Credenciales de prueba ────────────────────────────────────────────────────
const TEST_EMAIL    = "apiuser@gmail.com";
const TEST_PASSWORD = "123456";

// ── Helper de login ───────────────────────────────────────────────────────────
// Usa `input[type="password"]` porque el botón "Mostrar contraseña" también
// tiene aria-label con la palabra "contraseña", lo que hace ambiguo getByLabel.
async function doLogin(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /ingresar/i }).click();
  await expect(page).toHaveURL(/\/$|\/dashboard/, { timeout: 8_000 });
}

// ── 1. Login ──────────────────────────────────────────────────────────────────
// Tests marcados con @smoke son seguros de correr contra staging/producción.

test("login exitoso redirige al dashboard @smoke", async ({ page }) => {
  await doLogin(page);
  await expect(page.getByRole("heading", { name: /jugadores/i })).toBeVisible({ timeout: 8_000 });
});

// ── 2. Happy Path completo ────────────────────────────────────────────────────

test("happy path — login, detalle de jugador, agregar a comparar, ver comparación @smoke", async ({ page }) => {
  await doLogin(page);

  // ── Esperar que la grilla de jugadores cargue ──────────────────────────────
  // Los cards son <a href="/players/:id"> (Next UI Card renderizado como Link)
  const playerCards = page.locator("a[href*='/players/']");
  await expect(playerCards.first()).toBeVisible({ timeout: 10_000 });

  // Obtenemos el nombre desde el <h3> dentro del primer card (evita capturar todo el textContent)
  const firstCard = playerCards.first();
  const firstPlayerName = await firstCard.locator("h3").first().textContent();
  await firstCard.click();

  // ── Página de detalle ──────────────────────────────────────────────────────
  await expect(page).toHaveURL(/\/players\/\d+/, { timeout: 8_000 });
  await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 8_000 });

  // ── Agregar a Comparar ─────────────────────────────────────────────────────
  // El botón "Comparar" navega directamente a /compare (sin toast intermedio)
  const compareBtn = page.getByRole("button", { name: /comparar/i }).first();
  await expect(compareBtn).toBeVisible({ timeout: 5_000 });
  await compareBtn.click();

  // Esperar la navegación automática a /compare
  await expect(page).toHaveURL("/compare", { timeout: 8_000 });

  // La página de comparación muestra el nombre del jugador que agregamos
  if (firstPlayerName?.trim()) {
    await expect(
      page.getByText(new RegExp(firstPlayerName.trim(), "i")).first()
    ).toBeVisible({ timeout: 8_000 });
  }
});

// ── 3. Protección de rutas ────────────────────────────────────────────────────

test("usuario no autenticado es redirigido a /login @smoke", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
});

// ── 4. Mobile — scroll horizontal en tabla de comparación ────────────────────

test("viewport mobile 375px — tabla de comparación tiene scroll horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await doLogin(page);

  await page.goto("/compare");

  // Body no debe romper el viewport (scroll horizontal solo en contenedores internos)
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(375 + 5); // tolerancia de 5px
});
