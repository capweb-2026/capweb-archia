export const persona = {
  nom: 'ArchiA',
  emoji: '🏛️',
  accueil:
    'Bonjour, je suis ArchiA, votre assistant BTP. Posez-moi vos questions sur la réglementation !',
  suggestions: [
    'Quelles sont les exigences RE2020 ?',
    'Mon bâtiment est-il accessible PMR ?',
    'Quelles obligations pour rénover un logement ?',
  ],
};

export function validatePersona(candidate) {
  const erreurs = [];
  const cible = candidate ?? {};

  if (typeof cible.nom !== 'string' || cible.nom.length < 2 || cible.nom.length > 20) {
    erreurs.push('Le nom doit faire de 2 à 20 caractères.');
  }

  if (cible.emoji !== '🏛️') {
    erreurs.push('L’emoji doit être exactement 🏛️.');
  }

  if (typeof cible.accueil !== 'string' || !cible.accueil.includes(cible.nom)) {
    erreurs.push('L’accueil doit contenir le nom.');
  }

  if (!Array.isArray(cible.suggestions) || cible.suggestions.length !== 3) {
    erreurs.push('Il faut exactement trois suggestions.');
  } else {
    const vides = cible.suggestions.some(
      (suggestion) => typeof suggestion !== 'string' || suggestion.trim().length === 0,
    );
    if (vides) {
      erreurs.push('Chaque suggestion doit être un texte non vide.');
    }
  }

  if (erreurs.length > 0) {
    return { ok: false, erreurs };
  }
  return { ok: true };
}
