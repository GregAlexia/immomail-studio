import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { sessionAdmin } from "@/lib/admin-session";

export const metadata: Metadata = {
  title: "Console Keo",
  // La console n'a rien à faire dans un index, même protégée.
  robots: { index: false, follow: false },
};

/**
 * Barrière de la console.
 *
 * Elle vaut pour l'affichage. Les Server Actions, elles, se protègent
 * **chacune** par `exigerAdmin()` : une action est appelable par POST direct,
 * sans jamais passer par ce layout.
 *
 * La page de connexion vit hors de ce groupe de routes (`app/admin/connexion`),
 * sans quoi elle se redirigerait vers elle-même à l'infini.
 */
export default async function LayoutConsole({ children }: { children: React.ReactNode }) {
  const email = await sessionAdmin();
  if (!email) redirect("/admin/connexion");

  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
          <Link href="/admin" className="text-lg font-bold tracking-tight text-[var(--color-ink)]">
            Console Keo
          </Link>
          <nav className="flex gap-1 text-sm">
            <Onglet href="/admin">Fréquentation</Onglet>
            <Onglet href="/admin/tarifs">Tarifs</Onglet>
            <Onglet href="/admin/comptes">Comptes</Onglet>
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden text-sm text-[var(--color-muted)] sm:inline">{email}</span>
            <form action="/api/admin/sortie" method="post">
              <button
                type="submit"
                className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] transition hover:bg-slate-50"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

function Onglet({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1.5 font-medium text-[var(--color-muted)] transition hover:bg-slate-100 hover:text-[var(--color-ink)]"
    >
      {children}
    </Link>
  );
}
