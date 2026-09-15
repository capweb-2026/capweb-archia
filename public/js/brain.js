/**
 * @file brain.js — Moteur de règles BTP pour chatbot d'aide à la décision.
 */

/* ------------------------------------------------------------------ */
/*  BASE DE CONNAISSANCES BTP                                         */
/* ------------------------------------------------------------------ */

/** @type {Array<{motsCles: string[], texte: string, schema: string}>} */
const REGLES = [
  /* -------- RE2020 / Construction Neuve -------- */
  {
    motsCles: [
      "re2020",
      "re 2020",
      "construction neuve",
      "bbio",
      "ic construction",
    ],
    texte:
      "RE2020 (Décret n° 2026-16 du 15/01/2026) — Trois indicateurs clés :\n" +
      "• Bbio : besoin bioclimatique maximal du bâtiment.\n" +
      "• Cep : consommation en énergie primaire.\n" +
      "• IC Construction : impact carbone sur le cycle de vie.\n" +
      "Objectif : réduire de 30 % les émissions carbone d'ici 2031.",
    schema:
      "graph TD\n" +
      "  A[Projet Construction Neuve] --> B[Calcul Bbio]\n" +
      "  A --> C[Calcul Cep]\n" +
      "  A --> D[Calcul IC Construction]\n" +
      "  B --> E{Bbio <= Seuil ?}\n" +
      "  C --> F{Cep <= Seuil ?}\n" +
      "  D --> G{IC <= Seuil ?}\n" +
      "  E -- Oui --> H[Conforme RE2020]\n" +
      "  F -- Oui --> H\n" +
      "  G -- Oui --> H\n" +
      "  E -- Non --> I[Reprise conception]\n" +
      "  F -- Non --> I\n" +
      "  G -- Non --> I",
  },

  /* -------- Rénovation -------- */
  {
    motsCles: [
      "renovation",
      "rénovation",
      "rt existant",
      "isolation",
      "climat resilience",
      "climat résilience",
      "travaux embarques",
      "travaux embarqués",
    ],
    texte:
      "Rénovation énergétique — Cadre réglementaire :\n" +
      "• RT Existant : performance minimale lors de travaux lourds.\n" +
      "• Loi Climat & Résilience : interdiction de location des passoires thermiques (DPE G dès 2025, F dès 2028).\n" +
      "• Isolation par travaux embarqués : obligation d'isoler lors de ravalement, réfection de toiture ou aménagement de pièces.\n" +
      "Conseil : réaliser un audit énergétique avant tout chantier.",
    schema:
      "graph TD\n" +
      "  A[Bâtiment existant] --> B{Type de travaux ?}\n" +
      "  B -- Ravalement --> C[Isolation extérieure obligatoire]\n" +
      "  B -- Toiture --> D[Isolation combles obligatoire]\n" +
      "  B -- Aménagement --> E[Isolation pièce concernée]\n" +
      "  C --> F[Vérification RT Existant]\n" +
      "  D --> F\n" +
      "  E --> F\n" +
      "  F --> G{DPE >= E ?}\n" +
      "  G -- Oui --> H[Logement louable]\n" +
      "  G -- Non --> I[Travaux complémentaires requis]",
  },

  /* -------- Accessibilité PMR -------- */
  {
    motsCles: [
      "pmr",
      "accessibilite",
      "accessibilité",
      "erp",
      "handicap",
      "fauteuil",
    ],
    texte:
      "Accessibilité PMR — Normes ERP essentielles :\n" +
      "• Largeur minimale de couloir : 1,40 m (1,20 m toléré sur courte distance).\n" +
      "• Aire de retournement fauteuil : diamètre 1,50 m minimum.\n" +
      "• Pente de rampe : 5 % max (tolérance 8 % sur 2 m, 10 % sur 0,50 m).\n" +
      "• Porte d'entrée : passage libre >= 0,90 m.\n" +
      "Tout ERP neuf doit être accessible ; l'existant suit un Ad'AP.",
    schema:
      "graph TD\n" +
      "  A[Vérification PMR] --> B{ERP neuf ou existant ?}\n" +
      "  B -- Neuf --> C[Conformité totale obligatoire]\n" +
      "  B -- Existant --> D[Ad AP programmé]\n" +
      "  C --> E[Couloir >= 1.40m]\n" +
      "  C --> F[Retournement >= 1.50m]\n" +
      "  C --> G[Rampe <= 5%]\n" +
      "  C --> H[Porte >= 0.90m]\n" +
      "  D --> E\n" +
      "  D --> F\n" +
      "  E --> I{Conforme ?}\n" +
      "  I -- Oui --> J[Validation]\n" +
      "  I -- Non --> K[Mise en conformité]",
  },

  /* -------- Patrimoine / Réhabilitation -------- */
  {
    motsCles: [
      "patrimoine",
      "abf",
      "rehabilitation",
      "réhabilitation",
      "monument",
      "nf en 16883",
      "16883",
    ],
    texte:
      "Patrimoine & Réhabilitation :\n" +
      "• Avis ABF (Architecte des Bâtiments de France) : obligatoire en périmètre protégé (500 m autour d'un monument historique).\n" +
      "• Norme NF EN 16883 : guide la conservation des bâtiments historiques lors de travaux d'amélioration énergétique.\n" +
      "• Principe : toute intervention doit être réversible et respecter l'authenticité du bâti.\n" +
      "Délai moyen d'instruction ABF : 2 à 4 mois.",
    schema:
      "graph TD\n" +
      "  A[Projet Réhabilitation] --> B{Périmètre protégé ?}\n" +
      "  B -- Oui --> C[Consultation ABF obligatoire]\n" +
      "  B -- Non --> D[Permis classique]\n" +
      "  C --> E{Avis ABF}\n" +
      "  E -- Favorable --> F[Travaux autorisés]\n" +
      "  E -- Défavorable --> G[Modification du projet]\n" +
      "  F --> H[Respect NF EN 16883]\n" +
      "  H --> I[Réversibilité des interventions]\n" +
      "  G --> C",
  },
];

/* ------------------------------------------------------------------ */
/*  COMMANDES SPÉCIALES                                               */
/* ------------------------------------------------------------------ */

/** @type {Object<string, {texte: string, schema: string}>} */
const COMMANDES = {
  aide: {
    texte:
      "Commandes disponibles : aide, salut, bonjour.\n" +
      "Thèmes reconnus : re2020, bbio, rénovation, isolation, pmr, accessibilité, erp, patrimoine, abf, réhabilitation.\n" +
      "Posez votre question en langage naturel !",
    schema:
      "graph LR\n" +
      "  U[Utilisateur] --> B[Brain.js]\n" +
      "  B --> R1[RE2020]\n" +
      "  B --> R2[Rénovation]\n" +
      "  B --> R3[PMR]\n" +
      "  B --> R4[Patrimoine]",
  },
  salut: {
    texte:
      'Bonjour ! Je suis votre assistant BTP. Tapez "aide" pour voir les thèmes disponibles.',
    schema: "",
  },
  bonjour: {
    texte:
      'Bonjour ! Je suis votre assistant BTP. Tapez "aide" pour voir les thèmes disponibles.',
    schema: "",
  },
  test: {
    texte: "Système opérationnel. Moteur de règles BTP prêt.",
    schema: "",
  },
};

/* ------------------------------------------------------------------ */
/*  FONCTIONS EXPORTÉES                                               */
/* ------------------------------------------------------------------ */

/**
 * Valide un message brut saisi par l'utilisateur.
 * @param {*} raw — Valeur brute du champ de saisie.
 * @returns {{ ok: true, value: string } | { ok: false, error: string }}
 */
export function validateMessage(raw) {
  if (typeof raw !== "string" || raw.trim() === "") {
    return { ok: false, error: "Le message ne doit pas être vide." };
  }
  const value = raw.trim();
  if (value.length > 280) {
    return {
      ok: false,
      error: "Le message ne doit pas dépasser 280 caractères.",
    };
  }
  return { ok: true, value };
}

/**
 * Analyse le message et retourne la réponse enrichie (texte + schéma Mermaid).
 * @param {string} message — Texte validé de l'utilisateur.
 * @returns {{ texte: string, schema: string }}
 */
export function repondre(message) {
  const normalise = message.trim().toLowerCase();

  // 1. Vérifier les commandes exactes
  if (COMMANDES[normalise]) {
    return COMMANDES[normalise];
  }

  // 2. Chercher un mot-clé dans le message
  for (const regle of REGLES) {
    for (const mot of regle.motsCles) {
      if (normalise.includes(mot)) {
        return { texte: regle.texte, schema: regle.schema };
      }
    }
  }

  // 3. Réponse de repli
  return {
    texte:
      "Je n'ai pas trouvé de règle correspondante.\n" +
      'Essayez : re2020, rénovation, pmr, patrimoine — ou tapez "aide".',
    schema: "",
  };
}

/**
 * Renvoie la réponse texte pour un message (contrat TP08).
 * @param {string} message — Texte validé de l'utilisateur.
 * @returns {string}
 */
export function replyTo(message) {
  return repondre(message).texte;
}

/* ------------------------------------------------------------------ */
/*  ALIAS FRANCOPHONES                                                */
/* ------------------------------------------------------------------ */

/** Alias de validateMessage pour usage francophone. */
export const isMessageValide = validateMessage;

/* ------------------------------------------------------------------ */
/*  EXPORT CommonJS (Node.js / tests unitaires)                       */
/* ------------------------------------------------------------------ */

const Brain = {
  validateMessage,
  isMessageValide,
  replyTo,
  repondre,
  REGLES,
  COMMANDES,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = Brain;
}
