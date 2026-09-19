import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readdir, readFile } from "node:fs/promises";
import { createApp } from "../server/app.js";
import { validateMessage, replyTo } from "../public/js/brain.js";

// Tests rouges CP3 — module serveur server/ia.js + route POST /api/chat.
// Contrat attendu (le futur server/ia.js devra le respecter) :
// - `repondreAvecIA(message, { fournisseur, delaiMaxMs } = {})` (export nommé,
//   `default` accepté en repli) ;
// - `fournisseur` : fonction fictive injectée `(messageValide) => Promise<string>` ;
// - `delaiMaxMs` : délai maximal injectable, défaut 4000 (export DELAI_MAX_MS) ;
// - succès IA -> `{ source: "ia", texte }`, échec/lenteur -> `{ source: "regles", texte: replyTo(message) }` ;
// - message invalide -> `{ ok: false, error: validateMessage(message).error }` ou levée avec ce texte,
//   sans appeler le fournisseur.
// Ne pas créer server/ia.js ni la route : ces tests doivent échouer (module manquant + 405 sur POST).

const MESSAGE = "salut";
const TEXTE_IA = "Réponse IA fictive pour test CP3.";

let moduleIA;
let erreurChargement;

before(async () => {
  try {
    moduleIA = await import("../server/ia.js");
  } catch (erreur) {
    erreurChargement = erreur;
  }
});

function exigerModuleIA() {
  assert.equal(
    erreurChargement,
    undefined,
    `server/ia.js doit exister (chargement : ${erreurChargement})`,
  );
  assert.ok(moduleIA, "server/ia.js doit exister");
}

function obtenirRepondre() {
  exigerModuleIA();
  const fn =
    moduleIA.repondreAvecIA ??
    moduleIA.default ??
    moduleIA.repondreAvecIa ??
    moduleIA.demanderIA;
  assert.equal(
    typeof fn,
    "function",
    'server/ia.js doit exporter repondreAvecIA (nommé) ou "default"',
  );
  return fn;
}

function delaiDefaut() {
  exigerModuleIA();
  return (
    moduleIA.DELAI_MAX_MS ??
    moduleIA.DELAI_MAX ??
    moduleIA.TIMEOUT_MS ??
    moduleIA.delaiMaxMs
  );
}

describe("CP3 — IA avec succès (fournisseur fictif)", () => {
  it("renvoie { source: 'ia', texte } avec la réponse fournie", async () => {
    const repondre = obtenirRepondre();
    const fournisseur = async () => TEXTE_IA;
    const resultat = await repondre(MESSAGE, { fournisseur });
    assert.deepEqual(resultat, { source: "ia", texte: TEXTE_IA });
  });
});

describe("CP3 — IA en échec (fournisseur fictif)", () => {
  it("401 : ne lève pas, bascule en { source: 'regles', texte: replyTo }", async () => {
    const repondre = obtenirRepondre();
    const echec401 = Object.assign(new Error("401 Unauthorized"), {
      status: 401,
    });
    const fournisseur = async () => {
      throw echec401;
    };
    const resultat = await repondre(MESSAGE, { fournisseur });
    assert.deepEqual(resultat, {
      source: "regles",
      texte: replyTo(MESSAGE),
    });
  });

  it("exception réseau : ne lève pas, bascule en { source: 'regles', texte: replyTo }", async () => {
    const repondre = obtenirRepondre();
    const fournisseur = async () => {
      throw new Error("panne réseau fictive");
    };
    const resultat = await repondre(MESSAGE, { fournisseur });
    assert.deepEqual(resultat, {
      source: "regles",
      texte: replyTo(MESSAGE),
    });
  });
});

describe("CP3 — IA trop lente (délai maximal 10s)", () => {
  it("le délai maximal par défaut vaut 10000 ms", () => {
    assert.equal(delaiDefaut(), 10000, "délai maximal attendu : 10000 ms (10s)");
  });

  it("fournisseur trop lent : bascule en { source: 'regles', texte: replyTo }", async () => {
    const repondre = obtenirRepondre();
    const fournisseurLent = async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return "réponse trop tardive";
    };
    const resultat = await repondre(MESSAGE, {
      fournisseur: fournisseurLent,
      delaiMaxMs: 20,
    });
    assert.deepEqual(resultat, {
      source: "regles",
      texte: replyTo(MESSAGE),
    });
  });
});

describe("CP3 — message vide ou invalide refusé", () => {
  it("refuse en cohérence avec validateMessage, sans appeler le fournisseur", async () => {
    const repondre = obtenirRepondre();
    for (const invalide of ["", "   ", "a".repeat(281), 42, null]) {
      const attendu = validateMessage(invalide);
      assert.equal(attendu.ok, false);
      let appele = false;
      const fournisseur = async () => {
        appele = true;
        return "ne doit pas servir";
      };
      let resultat;
      let levee = null;
      try {
        resultat = await repondre(invalide, { fournisseur });
      } catch (erreur) {
        levee = erreur;
      }
      assert.equal(
        appele,
        false,
        `fournisseur non appelé pour ${JSON.stringify(invalide)}`,
      );
      if (levee !== null) {
        const texte = String(levee.message ?? levee);
        assert.ok(
          texte.includes(attendu.error),
          `l'erreur levée reprend validateMessage : ${attendu.error}`,
        );
      } else {
        assert.equal(
          resultat?.ok,
          false,
          "un message invalide est refusé avec { ok: false }",
        );
        assert.equal(resultat?.error, attendu.error);
      }
    }
  });
});

describe("CP3 — serveur : POST /api/chat sans clé", () => {
  const nomFichier = fileURLToPath(import.meta.url);
  const dossier = path.dirname(nomFichier);
  const dossierPublic = path.join(dossier, "..", "public");
  let serveur;
  let baseUrl;

  before(async () => {
    const app = createApp({ publicDir: dossierPublic, version: "test-ia" });
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

  it("POST /api/chat répond 200 { source: 'regles', texte: replyTo } sans clé", async () => {
    const reponse = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: MESSAGE }),
    });
    assert.equal(reponse.status, 200);
    const mime = reponse.headers.get("content-type") ?? "";
    assert.ok(mime.includes("application/json"), `MIME JSON attendu : ${mime}`);
    const donnees = await reponse.json();
    assert.deepEqual(donnees, {
      source: "regles",
      texte: replyTo(MESSAGE),
    });
  });

  it("POST /api/chat refuse un message vide avec 400 et l'erreur validateMessage", async () => {
    const attendu = validateMessage("");
    const reponse = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "" }),
    });
    assert.equal(reponse.status, 400);
    const donnees = await reponse.json();
    assert.equal(donnees?.error, attendu.error);
  });
});

describe("CP3 — serveur : ia.js reste pur (aucun accès page)", () => {
  it("server/ia.js ne touche ni document, ni window, ni localStorage", async () => {
    const chemin = new URL("../server/ia.js", import.meta.url);
    const code = await readFile(chemin, "utf8");
    assert.doesNotMatch(
      code,
      /\bdocument\b|\bwindow\b|localStorage/,
      "server/ia.js reste côté serveur : aucun accès à la page",
    );
    assert.doesNotMatch(
      code,
      /innerHTML|outerHTML|insertAdjacentHTML/,
      "le texte reste du texte, dans server/ia.js aussi",
    );
  });
});

describe("CP3 — absence de secret côté public/", () => {
  const MOTIFS_INTERDITS = [
    /openai/i,
    /anthropic/i,
    /mistral/i,
    /cohere/i,
    /huggingface/i,
    /generativelanguage/i,
    /passerelle/i,
    /\bgateway\b/i,
    /bearer/i,
    /sk-[A-Za-z0-9]{8,}/,
    /api[_-]?key/i,
    /x-api-key/i,
  ];

  async function lister(chemin) {
    const entrees = await readdir(chemin, { withFileTypes: true });
    const fichiers = [];
    for (const entree of entrees) {
      const cible = path.join(chemin, entree.name);
      if (entree.isDirectory()) {
        fichiers.push(...(await lister(cible)));
      } else if (entree.isFile()) {
        fichiers.push(cible);
      }
    }
    return fichiers;
  }

  it("aucun fichier sous public/ ne contient l'URL de la passerelle ni de token", async () => {
    const racine = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "public",
    );
    const fichiers = await lister(racine);
    assert.ok(fichiers.length > 0, "public/ doit contenir des fichiers");
    for (const fichier of fichiers) {
      const contenu = await readFile(fichier, "utf8");
      const relatif = path.relative(racine, fichier).replaceAll("\\", "/");
      for (const motif of MOTIFS_INTERDITS) {
        assert.ok(
          !motif.test(contenu),
          `${relatif} ne doit contenir ni URL de passerelle ni token (${motif})`,
        );
      }
    }
  });
});
