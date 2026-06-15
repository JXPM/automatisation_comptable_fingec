import { defineConfig, devices } from "@playwright/test";

/**
 * Tests e2e de l'UI d'authentification. Le réseau est mocké (page.route) dans
 * chaque test : pas besoin du backend FastAPI ni de n8n pour les exécuter.
 *
 *   npx playwright test            # lance Vite + Chromium et exécute les specs
 *   npx playwright test --ui       # mode interactif
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "list" : "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
