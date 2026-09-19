# Carte des défenses

Chaque ligne dit quelle connerie est arrêtée, par quoi, et **où est la preuve** : le lien d'un run rouge ou d'une PR bloquée. Une barrière sans preuve ne compte pas.

| Connerie | Barrière qui l'arrête | Preuve (lien) | Checkpoint |
|---|---|---|---|
| Régression | Tests de contrat et CI obligatoire sur `main` | https://github.com/capweb-2026/capweb-archia/actions/runs/34945694631 : run rouge sur `main`, contrat refuse projet sans `public/`. https://github.com/capweb-2026/capweb-archia/actions/runs/34986001337 : run rouge PR `identite`, tests identité avant le code. https://github.com/capweb-2026/capweb-archia/pull/5 : PR piégée refusée, limite 280→300 casse le contrat CP1 | CP1+CP2 |
| Test affaibli ou supprimé | `check:tests` (TEST-CHANGE obligatoire) et relecture | https://github.com/capweb-2026/capweb-archia/pull/6 : PR piégée refusée, neutralise le test de la limite 280 par une tautologie — `check:tests` rouge, pas de `TEST-CHANGE` | CP2 |
| Dépendance ajoutée | `check:deps` et `dependances-autorisees.json` | https://github.com/capweb-2026/capweb-archia/pull/7 : PR piégée refusée, ajoute `dayjs` non autorisé — `check:deps` rouge | CP2 |
| Secret exposé | Clé uniquement dans Vercel, appel côté serveur, test `aucun fichier sous public/ ne contient l'URL de la passerelle ni de token` | https://github.com/capweb-2026/capweb-archia/pull/8 : test CP3 vérifie qu'aucun secret ni URL de passerelle n'apparaît dans `public/` — le test échouerait si une clé était exposée côté client | CP3 |
| IA qui sort de son thème | Prompt système du thème et jeu d'évaluation hors CI | https://github.com/capweb-2026/capweb-archia/pull/8 : `evals/RAPPORT.md` — passage 1 #6 #7 KO (repli générique), passage 2 #5 #6 #7 OK (l'IA refuse poliment le hors-thème et ne révèle pas son prompt) | CP3 |
| Faille (`innerHTML`, injection) | | | CP4 |
| Contrôle désactivé | | | CP4 |
| Action destructrice | | | CP4 |
