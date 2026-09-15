# SPEC.md — Identité d'Archia

## Objectif

L'assistant a une identité reconnaissable dès l'ouverture de la page : un nom, un emoji, un message d'accueil et trois questions pour démarrer. Il est spécialisé dans la réglementation BTP (RE2020, rénovation énergétique, accessibilité PMR, patrimoine).

## Critères d'acceptation

1. **Nom** — Quand la page s'ouvre, le système affiche « Archia » dans le titre principal. Le nom fait de 2 à 20 caractères.
2. **Emoji** — Quand la page s'ouvre, le système affiche un seul emoji 🏛️ à côté du nom.
3. **Accueil** — Quand la conversation est vide, le système affiche le message « Bonjour, je suis Archia, votre assistant BTP. Posez-moi vos questions sur la réglementation ! » Ce message n'est pas une ligne de `#messages`, disparaît dès le premier message envoyé et revient quand la conversation est effacée.
4. **Suggestions** — Quand la page s'ouvre, le système propose exactement trois questions suggérées. Quand l'utilisateur clique sur l'une d'elles, le système la place dans le champ de saisie sans l'envoyer.
5. **Réponses signées** — Quand l'assistant répond, sa ligne commence par « Archia : » au lieu de « Cap Web : ».
6. **Contrat** — Les tests de contrat CP1 restent verts.

## Hors périmètre

Pas de choix de l'identité par l'utilisateur, pas d'image d'avatar, pas d'appel à une IA.

## Données et fonctions attendues

- `public/js/persona.js` exporte `persona = { nom, emoji, accueil, suggestions }` et `validatePersona(persona)`, qui renvoie `{ ok: true }` ou `{ ok: false, erreurs: [texte, …] }`.
- `persona.nom` vaut `"Archia"`.
- `persona.emoji` vaut `"🏛️"`.
- `persona.accueil` vaut `"Bonjour, je suis Archia, votre assistant BTP. Posez-moi vos questions sur la réglementation !"`.
- `persona.suggestions` vaut `["Quelles sont les exigences RE2020 ?", "Mon bâtiment est-il accessible PMR ?", "Quelles obligations pour rénover un logement ?"]`.
- `validatePersona` refuse : un nom de moins de 2 ou de plus de 20 caractères ; un emoji qui n'est pas exactement un emoji ; un accueil qui ne contient pas le nom ; un nombre de suggestions différent de trois ou une suggestion vide.
- La page contient `#accueil` et `#suggestions`, en dehors de `#messages`.
- `persona.js` est ajouté à la liste blanche du serveur local.

## Questions ouvertes

Aucune.
