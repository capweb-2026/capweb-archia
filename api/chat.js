import { validateMessage } from "../public/js/brain.js";
import { repondreAvecIA } from "../server/ia.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Méthode non autorisée" });
    return;
  }
  const corps = req.body ?? {};
  const message = typeof corps === "string" ? corps : corps.message;
  const validation = validateMessage(message);
  if (!validation.ok) {
    res.status(400).json({ error: validation.error });
    return;
  }
  const resultat = await repondreAvecIA(validation.value);
  res.status(200).json(resultat);
}
