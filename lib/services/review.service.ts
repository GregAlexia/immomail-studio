import "server-only";

// Implémentation MOCKÉE de la collecte d'avis (remplaçable par Google Business
// Profile). Fournit le lien d'avis fictif et les gabarits de message.
export function reviewLink(agencyName: string): string {
  const slug = agencyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `https://g.page/r/${slug}/review`;
}

export function reviewEmailBody(clientName: string, agencyName: string, link: string): string {
  return `Bonjour ${clientName},

Merci de votre confiance pour votre projet immobilier avec ${agencyName}.
Votre avis compte énormément pour nous et aide d'autres familles à nous faire confiance.

Pourriez-vous prendre 30 secondes pour laisser un avis ?
👉 ${link}

Merci infiniment,
L'équipe ${agencyName}`;
}

export function reviewSmsBody(clientName: string, link: string): string {
  return `${clientName}, merci pour votre confiance ! Un avis Google nous aiderait beaucoup : ${link} (30 sec). Merci 🙏`;
}

export function reviewFollowupBody(clientName: string, agencyName: string, link: string): string {
  return `Bonjour ${clientName},

Petit rappel amical : votre avis sur ${agencyName} compterait beaucoup pour nous 🙏
👉 ${link}

Sans réponse de votre part, nous ne vous solliciterons plus.
L'équipe ${agencyName}`;
}
