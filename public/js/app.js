import { validateMessage, replyTo } from "./brain.js";
import { renderMessages } from "./view.js";

const formulaire = document.querySelector("#chat-form");
const statut = document.querySelector("#status");
const versionElt = document.querySelector("#version");

const champ = document.querySelector("#message");
const liste = document.querySelector("#messages");
const btnEffacer = document.querySelector("#effacer");

const CLE_STOCKAGE = "capweb.historique";
const historique = [];

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
});

fetch("/version.json", { headers: { accept: "application/json" } })
  .then((reponse) => (reponse.ok ? reponse.json() : null))
  .then((donnees) => {
    if (donnees && typeof donnees.version === "string" && versionElt) {
      versionElt.textContent = `version ${donnees.version}`;
    }
  })
  .catch(() => {});
