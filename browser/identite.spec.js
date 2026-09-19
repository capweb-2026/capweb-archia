import { test, expect } from "@playwright/test";
/* global localStorage -- callbacks exécutés dans la page */

// Tests rouges critères 1 à 5 de SPEC.md (identité ArchiA), dans un vrai navigateur.
// Ces tests échouent tant que la page affiche « Cap Web », sans #accueil ni
// #suggestions, avec des réponses préfixées « Cap Web : ».

const ACCUEIL_ATTENDU =
  "Bonjour, je suis ArchiA, votre assistant BTP. Posez-moi vos questions sur la réglementation !";
const SUGGESTIONS_ATTENDUES = [
  "Quelles sont les exigences RE2020 ?",
  "Mon bâtiment est-il accessible PMR ?",
  "Quelles obligations pour rénover un logement ?",
];

function surveiller(page) {
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  return erreurs;
}

async function pageNeuve(page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

async function envoyer(page, texte) {
  await page.locator("#message").fill(texte);
  await page.getByRole("button", { name: /envoyer/i }).click();
}

const lignes = (page) => page.locator("#messages li");

test.describe("Identité ArchiA — nom et emoji (critères 1 et 2)", () => {
  test("le titre principal affiche ArchiA", async ({ page }) => {
    const erreurs = surveiller(page);
    await pageNeuve(page);
    await expect(page.locator("h1")).toContainText("ArchiA");
    expect(erreurs).toHaveLength(0);
  });

  test("un seul emoji 🏛️ est affiché à côté du nom", async ({ page }) => {
    await pageNeuve(page);
    await expect(page.locator("header")).toContainText("🏛️");
    await expect(page.locator("header")).toContainText("ArchiA");
  });
});

test.describe("Identité ArchiA — accueil (critère 3)", () => {
  test("la conversation vide affiche l’accueil exact, hors de #messages", async ({
    page,
  }) => {
    await pageNeuve(page);
    const accueil = page.locator("#accueil");
    await expect(accueil).toBeVisible();
    await expect(accueil).toHaveText(ACCUEIL_ATTENDU);
    await expect(page.locator("#messages #accueil")).toHaveCount(0);
    const balise = await accueil.evaluate((el) => el.tagName);
    expect(balise).not.toBe("LI");
  });

  test("l’accueil disparaît dès le premier message envoyé", async ({
    page,
  }) => {
    await pageNeuve(page);
    await envoyer(page, "salut");
    await expect(lignes(page)).toHaveCount(2);
    await expect(page.locator("#accueil")).toBeHidden();
  });

  test("l’accueil revient quand la conversation est effacée", async ({
    page,
  }) => {
    await pageNeuve(page);
    await envoyer(page, "salut");
    await expect(lignes(page)).toHaveCount(2);
    page.once("dialog", (d) => d.accept());
    await page.locator("#effacer").click();
    await expect(lignes(page)).toHaveCount(0);
    await expect(page.locator("#accueil")).toBeVisible();
    await expect(page.locator("#accueil")).toHaveText(ACCUEIL_ATTENDU);
  });
});

test.describe("Identité ArchiA — suggestions (critère 4)", () => {
  test("la page propose exactement les trois questions suggérées, hors de #messages", async ({
    page,
  }) => {
    await pageNeuve(page);
    const boutons = page.locator("#suggestions button");
    await expect(boutons).toHaveCount(3);
    for (let i = 0; i < SUGGESTIONS_ATTENDUES.length; i += 1) {
      await expect(boutons.nth(i)).toHaveText(SUGGESTIONS_ATTENDUES[i]);
    }
    await expect(page.locator("#messages #suggestions")).toHaveCount(0);
  });

  test("cliquer une suggestion la place dans le champ sans l’envoyer", async ({
    page,
  }) => {
    await pageNeuve(page);
    const boutons = page.locator("#suggestions button");
    await expect(boutons).toHaveCount(3);
    for (let i = 0; i < SUGGESTIONS_ATTENDUES.length; i += 1) {
      await boutons.nth(i).click();
      await expect(page.locator("#message")).toHaveValue(
        SUGGESTIONS_ATTENDUES[i],
      );
      await expect(lignes(page)).toHaveCount(0);
    }
  });
});

test.describe("Identité ArchiA — réponses signées (critère 5)", () => {
  test("la ligne de l’assistant commence par « ArchiA : »", async ({
    page,
  }) => {
    await pageNeuve(page);
    await envoyer(page, "salut");
    await expect(lignes(page)).toHaveCount(2);
    const texte = await lignes(page)
      .nth(1)
      .evaluate((el) => el.textContent ?? "");
    expect(texte.startsWith("ArchiA : ")).toBe(true);
    expect(texte).not.toContain("Cap Web");
  });
});
