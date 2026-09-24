import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { identifiantsPresents } from "@/lib/admin-google";
import { adresseAutorisee, secretPresent, sessionAdmin } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Console Keo", robots: { index: false, follow: false } };

const MESSAGES: Record<string, string> = {
  adresse: "Ce compte Google n'est pas celui du propriétaire. Aucune session n'a été ouverte.",
  etat: "La demande de connexion n'a pas pu être rattachée à celle partie d'ici. Recommencez depuis cette page.",
  google: "Google n'a pas confirmé l'identité. Réessayez, ou vérifiez les identifiants OAuth.",
  configuration: "La connexion n'est pas configurée sur ce déploiement.",
  sortie: "Vous êtes déconnecté.",
};

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  // Déjà connecté : inutile de repasser par Google.
  if (await sessionAdmin()) redirect("/admin");

  const { erreur } = await searchParams;
  const configure = identifiantsPresents() && secretPresent();
  const message = erreur ? MESSAGES[erreur] : undefined;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        Keo — administration
      </p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--color-ink)]">
        Console du propriétaire
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Fréquentation du site, tarifs des offres, espaces et demandes de rappel. Un seul compte y
        accède : <strong className="font-medium text-[var(--color-ink)]">{adresseAutorisee()}</strong>.
      </p>

      {message && (
        <p
          className={
            erreur === "sortie"
              ? "mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              : "mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          }
        >
          {message}
        </p>
      )}

      {configure ? (
        <a
          href="/api/admin/connexion"
          className="mt-8 inline-flex items-center justify-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 font-semibold text-[var(--color-ink)] shadow-sm transition hover:bg-slate-50"
        >
          <GoogleIcon />
          Se connecter avec Google
        </a>
      ) : (
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          <p className="font-semibold">Connexion non configurée</p>
          <p className="mt-2">
            Ajoutez ces trois variables d&apos;environnement au projet Vercel, puis redéployez :
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 font-mono text-xs">
            <li>GOOGLE_CLIENT_ID</li>
            <li>GOOGLE_CLIENT_SECRET</li>
            <li>ADMIN_SESSION_SECRET</li>
          </ul>
          <p className="mt-3">
            Tant qu&apos;elles manquent, la console reste fermée — elle ne bascule jamais en accès
            libre.
          </p>
        </div>
      )}

      <p className="mt-10 text-xs leading-relaxed text-[var(--color-muted)]">
        Google nous communique uniquement votre adresse, pour la comparer à celle du propriétaire.
        Aucun compte n&apos;est créé, aucune donnée de profil n&apos;est conservée.
      </p>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
      />
    </svg>
  );
}
