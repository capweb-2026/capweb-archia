import { validateMessage, replyTo } from "./brain.js";
import { persona } from "./persona.js";
import { renderMessages } from "./view.js";

const formulaire = document.querySelector("#chat-form");
const statut = document.querySelector("#status");
const versionElt = document.querySelector("#version");

const champ = document.querySelector("#message");
const liste = document.querySelector("#messages");
const btnEffacer = document.querySelector("#effacer");
const accueil = document.querySelector("#accueil");
const suggestions = document.querySelector("#suggestions");

const CLE_STOCKAGE = "capweb.historique";
const historique = [];

function actualiserAccueil() {
  if (!accueil) return;
  accueil.textContent = persona.accueil;
  accueil.hidden = historique.length > 0;
}

function construireSuggestions() {
  if (!suggestions || !champ) return;
  suggestions.replaceChildren(
    ...persona.suggestions.map((texte) => {
      const bouton = document.createElement("button");
      bouton.type = "button";
      bouton.textContent = texte;
      bouton.addEventListener("click", () => {
        champ.value = texte;
        champ.focus();
      });
      return bouton;
    }),
  );
}

construireSuggestions();

try {
  const sauvegarde = localStorage.getItem(CLE_STOCKAGE);
  if (sauvegarde) {
    const donnees = JSON.parse(sauvegarde);
    if (Array.isArray(donnees)) {
      historique.push(...donnees);
      if (liste) renderMessages(historique, liste);
    }
  }
} catch {
  if (statut)
    statut.textContent = "Conversation précédente illisible, repartie de zéro.";
}

actualiserAccueil();

function sauvegarder() {
  localStorage.setItem(CLE_STOCKAGE, JSON.stringify(historique));
}

formulaire?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!champ || !liste || !statut) return;

  const result = validateMessage(champ.value);

  if (!result.ok) {
    statut.textContent = result.error;
    champ.focus();
    return;
  }

  historique.push({ role: "user", text: result.value });

  const botReply = replyTo(result.value);
  historique.push({ role: "assistant", text: botReply });

  renderMessages(historique, liste);
  actualiserAccueil();
  sauvegarder();

  champ.value = "";
  statut.textContent = "";
  champ.focus();
});

btnEffacer?.addEventListener("click", () => {
  if (!confirm("Effacer toute la conversation ?")) return;
  historique.length = 0;
  localStorage.removeItem(CLE_STOCKAGE);
  if (liste) renderMessages(historique, liste);
  actualiserAccueil();
});

fetch("/version.json", { headers: { accept: "application/json" } })
  .then((reponse) => (reponse.ok ? reponse.json() : null))
  .then((donnees) => {
    if (donnees && typeof donnees.version === "string" && versionElt) {
      versionElt.textContent = `version ${donnees.version}`;
    }
  })
  .catch(() => {});
