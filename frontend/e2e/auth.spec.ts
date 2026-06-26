import { test, expect } from "@playwright/test";

/**
 * Parcours d'authentification (mot de passe). Le backend est simulé via
 * page.route — ces tests valident l'UI et le câblage des appels, pas le serveur.
 */

test("la page de connexion affiche le lien « mot de passe oublié »", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /bon retour/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /mot de passe oublié/i })).toBeVisible();
});

test("le bouton afficher/masquer révèle le mot de passe", async ({ page }) => {
  await page.goto("/login");
  const pwd = page.getByPlaceholder("••••••••");
  await pwd.fill("secret123");
  await expect(pwd).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: /afficher le mot de passe/i }).click();
  await expect(pwd).toHaveAttribute("type", "text");
});

test("mot de passe oublié : message de confirmation générique", async ({ page }) => {
  await page.route("**/auth/forgot-password", (route) =>
    route.fulfill({ status: 200, json: { message: "ok" } }),
  );
  await page.goto("/forgot-password");
  await page.getByPlaceholder("vous@fingec.fr").fill("test@fingec.fr");
  await page.getByRole("button", { name: /envoyer le lien/i }).click();
  await expect(page.getByText(/un e-mail contenant un lien/i)).toBeVisible();
});

test("réinitialisation : lien invalide affiche une erreur", async ({ page }) => {
  await page.route("**/auth/reset-password/*", (route) =>
    route.fulfill({ status: 400, json: { detail: "Lien invalide ou expiré." } }),
  );
  await page.goto("/reset-password?token=mauvais");
  await expect(page.getByRole("heading", { name: /lien invalide/i })).toBeVisible();
});

test("réinitialisation : lien valide permet de définir un mot de passe", async ({ page }) => {
  await page.route("**/auth/reset-password/*", (route) =>
    route.fulfill({ status: 200, json: { email: "u@fingec.fr", purpose: "reset" } }),
  );
  await page.route("**/auth/reset-password", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({ status: 200, json: { message: "ok" } });
    }
    return route.fallback();
  });

  await page.goto("/reset-password?token=bon");
  await expect(page.getByText("Compte : u@fingec.fr")).toBeVisible();

  await page.getByPlaceholder("Au moins 12 caractères").fill("nouveau-mdp-1");
  await page.getByPlaceholder("••••••••").fill("nouveau-mdp-1");
  await page.getByRole("button", { name: /enregistrer le mot de passe/i }).click();

  await expect(page.getByRole("heading", { name: /mot de passe défini/i })).toBeVisible();
});

test("réinitialisation : mots de passe différents bloquent l'envoi", async ({ page }) => {
  await page.route("**/auth/reset-password/*", (route) =>
    route.fulfill({ status: 200, json: { email: "u@fingec.fr", purpose: "reset" } }),
  );
  await page.goto("/reset-password?token=bon");
  await page.getByPlaceholder("Au moins 12 caractères").fill("motdepasse-1");
  await page.getByPlaceholder("••••••••").fill("different-99");
  await page.getByRole("button", { name: /enregistrer le mot de passe/i }).click();
  await expect(page.getByText(/ne correspondent pas/i)).toBeVisible();
});
