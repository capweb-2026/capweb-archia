import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { persona, validatePersona } from "../public/js/persona.js";
import { createApp } from "../server/app.js";

const NOM_ATTENDU = "ArchiA";
const EMOJI_ATTENDU = "🏛️";
const ACCUEIL_ATTENDU =
  "Bonjour, je suis ArchiA, votre assistant BTP. Posez-moi vos questions sur la réglementation !";
const SUGGESTIONS_ATTENDUES = [
  "Quelles sont les exigences RE2020 ?",
  "Mon bâtiment est-il accessible PMR ?",
  "Quelles obligations pour rénover un logement ?",
];

const sansCommentaires = (code) =>
  code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const lire = async (fichier) =>
  sansCommentaires(
    await readFile(new URL(`../public/js/${fichier}`, import.meta.url), "utf8"),
  );

describe("Identité ArchiA — persona", () => {
  it("expose un nom qui vaut ArchiA", () => {
    assert.equal(persona.nom, NOM_ATTENDU);
  });

  it("a un nom de 2 à 20 caractères", () => {
    assert.ok(persona.nom.length >= 2, "nom trop court");
    assert.ok(persona.nom.length <= 20, "nom trop long");
  });

  it("expose un seul emoji qui vaut 🏛️", () => {
    assert.equal(persona.emoji, EMOJI_ATTENDU);
  });

  it("expose le message d’accueil exact, qui contient le nom", () => {
    assert.equal(persona.accueil, ACCUEIL_ATTENDU);
    assert.ok(
      persona.accueil.includes(persona.nom),
      "l’accueil doit contenir le nom",
    );
  });

  it("expose exactement les trois suggestions attendues", () => {
    assert.deepEqual(persona.suggestions, SUGGESTIONS_ATTENDUES);
  });

  it("validatePersona accepte la persona attendue", () => {
    assert.deepEqual(validatePersona(persona), { ok: true });
  });

  it("validatePersona refuse un nom de moins de 2 caractères", () => {
    for (const nom of ["", "A"]) {
      const r = validatePersona({ ...persona, nom });
      assert.equal(r.ok, false);
      assert.ok(Array.isArray(r.erreurs) && r.erreurs.length > 0);
    }
  });

  it("validatePersona refuse un nom de plus de 20 caractères", () => {
    const r = validatePersona({ ...persona, nom: "A".repeat(21) });
    assert.equal(r.ok, false);
    assert.ok(Array.isArray(r.erreurs) && r.erreurs.length > 0);
  });

  it("validatePersona refuse un emoji qui n’est pas exactement 🏛️", () => {
    for (const emoji of ["", "A", "🏛️🏛️", "😀"]) {
      const r = validatePersona({ ...persona, emoji });
      assert.equal(r.ok, false, `emoji refusé attendu pour ${emoji}`);
      assert.ok(Array.isArray(r.erreurs) && r.erreurs.length > 0);
    }
  });

  it("validatePersona refuse un accueil qui ne contient pas le nom", () => {
    const r = validatePersona({
      ...persona,
      accueil: "Bonjour, posez vos questions !",
    });
    assert.equal(r.ok, false);
    assert.ok(Array.isArray(r.erreurs) && r.erreurs.length > 0);
  });

  it("validatePersona refuse un nombre de suggestions différent de trois", () => {
    for (const suggestions of [
      [],
      SUGGESTIONS_ATTENDUES.slice(0, 2),
      [...SUGGESTIONS_ATTENDUES, "Une quatrième ?"],
    ]) {
      const r = validatePersona({ ...persona, suggestions });
      assert.equal(
        r.ok,
        false,
        `attendu refus pour ${suggestions.length} suggestions`,
      );
      assert.ok(Array.isArray(r.erreurs) && r.erreurs.length > 0);
    }
  });

  it("validatePersona refuse une suggestion vide", () => {
    for (const suggestions of [
      ["", SUGGESTIONS_ATTENDUES[1], SUGGESTIONS_ATTENDUES[2]],
      ["   ", SUGGESTIONS_ATTENDUES[1], SUGGESTIONS_ATTENDUES[2]],
    ]) {
      const r = validatePersona({ ...persona, suggestions });
      assert.equal(r.ok, false);
      assert.ok(Array.isArray(r.erreurs) && r.erreurs.length > 0);
    }
  });

  it("persona.js ne touche pas à la page et n’injecte jamais de HTML", async () => {
    const code = await lire("persona.js");
    assert.doesNotMatch(
      code,
      /\bdocument\b|\bwindow\b|localStorage/,
      "persona.js reste pur : aucun accès à la page",
    );
    assert.doesNotMatch(
      code,
      /innerHTML|outerHTML|insertAdjacentHTML/,
      "le texte reste du texte, dans persona.js aussi",
    );
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");

let serveur;
let baseUrl;

before(async () => {
  const app = createApp({ publicDir, version: "test-identite" });
  await new Promise((resolve) => {
    serveur = app.listen(0, "127.0.0.1", resolve);
  });
  const adresse = serveur.address();
  const port =
    typeof adresse === "object" && adresse !== null ? adresse.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
});

after(
  () =>
    new Promise((resolve, reject) => {
      if (!serveur) {
        resolve();
        return;
      }
      serveur.close((erreur) => (erreur ? reject(erreur) : resolve()));
    }),
);

describe("Identité ArchiA — serveur", () => {
  it("GET /js/persona.js sert le module en JavaScript", async () => {
    const reponse = await fetch(`${baseUrl}/js/persona.js`);
    assert.equal(reponse.status, 200);
    const mime = reponse.headers.get("content-type") ?? "";
    assert.ok(
      mime.includes("javascript"),
      `MIME JavaScript attendu, reçu : ${mime}`,
    );
    const corps = await reponse.text();
    assert.ok(
      corps.trim().length > 0,
      "le module persona ne doit pas être vide",
    );
  });
});
