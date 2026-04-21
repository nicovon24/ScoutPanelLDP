import { defineConfig, devices } from "@playwright/test";

// BASE_URL permite apuntar a local, producción sin cambiar el código:
//   local:      BASE_URL=http://localhost:3000 npx playwright test
//   producción: BASE_URL=https://scoutpanel.com npx playwright test --grep @smoke
const baseURL = process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./global-tests",
  timeout: 30_000,
  retries: 1,
  workers: 1,           // secuencial — evita colisiones de auth state
  reporter: "list",

  use: {
    baseURL,
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
