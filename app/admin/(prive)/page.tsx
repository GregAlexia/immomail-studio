import {
  dernieresVues,
  nombreDeVues,
  vuesParChemin,
  vuesParCommercial,
  vuesParJour,
  vuesParPays,
  vuesParVille,
  type Total,
} from "@/lib/db/audience";
import { listerInscriptions } from "@/lib/db/inscriptions";
import { listerEspaces } from "@/lib/db/espaces";
import { nomDuPays } from "@/lib/geo";
import { Card, CardHeader, EmptyState, StatCard, Table, Td, Th, Tr } from "@/components/ui";

// La console lit des compteurs qui bougent en permanence : rien à mettre en cache.
export const dynamic = "force-dynamic";

const FENETRE = 30;

export default async function PageFrequentation() {
  const [vues7, vues30, jours, chemins, commerciaux, pays, villes, recentes, inscrits, espaces] =
    await Promise.all([
      nombreDeVues(7),
      nombreDeVues(FENETRE),
      vuesParJour(FENETRE),
      vuesParChemin(FENETRE),
      vuesParCommercial(FENETRE),
      vuesParPays(FENETRE),
      vuesParVille(FENETRE),
      dernieresVues(25),
      listerInscriptions(500),
      listerEspaces(),
    ]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">Fréquentation</h1>
        <p className="mt-1 max-w-2xl text-[var(--color-muted)]">
          Journal maison : chaque page ouverte, avec le pays, la région et la ville fournis par
          Vercel. Aucune adresse IP n&apos;est lue ni conservée.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pages vues · 7 jours" value={vues7.toLocaleString("fr-FR")} />
        <StatCard label={`Pages vues · ${FENETRE} jours`} value={vues30.toLocaleString("fr-FR")} />
        <StatCard
          label="Demandes de rappel"
          value={inscrits.length.toLocaleString("fr-FR")}
          hint="Depuis la page de vente"
        />
        <StatCard
          label="Espaces ouverts"
          value={espaces.length.toLocaleString("fr-FR")}
          hint="Un par commercial, plus l'espace partagé"
        />
      </div>

      <Card className="mt-6 p-5">
        <HistogrammeQuotidien jours={jours} />
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Classement titre="Pages les plus ouvertes" lignes={chemins} vide="Aucune page enregistrée." />
        <Classement
          titre="Liens de commerciaux"
          sousTitre="Ouvertures venues d'un lien /c/…"
          lignes={commerciaux}
          vide="Aucun lien nominatif utilisé sur la période."
        />
        <Classement
          titre="Pays"
          lignes={pays.map((p) => ({ ...p, libelle: nomDuPays(p.libelle) }))}
          vide="Aucune localisation connue."
        />
        <Classement titre="Villes" lignes={villes} vide="Aucune localisation connue." />
      </div>

      <Card className="mt-6">
        <CardHeader title="Dernières visites" subtitle="Les 25 plus récentes, du plus récent au plus ancien" />
        {recentes.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Rien à afficher pour l'instant"
              hint="Le journal se remplit dès la prochaine ouverture d'une page."
            />
          </div>
        ) : (
          <Table
            head={
              <>
                <Th>Quand</Th>
                <Th>Page</Th>
                <Th>Commercial</Th>
                <Th>D&apos;où</Th>
              </>
            }
          >
            {recentes.map((v, i) => (
              <Tr key={`${v.vuLe}-${i}`}>
                <Td className="whitespace-nowrap text-[var(--color-muted)]">{quand(v.vuLe)}</Td>
                <Td className="font-medium">{v.chemin}</Td>
                <Td>{v.commercial ?? "—"}</Td>
                <Td>{lieu(v.ville, v.region, v.pays)}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

/**
 * Fréquentation quotidienne.
 *
 * Une seule série, donc pas de légende : le titre la nomme. Une seule valeur est
 * écrite — celle du jour de pointe — plutôt qu'un nombre sur chaque barre, qui
 * transformerait le graphique en tableau illisible.
 */
function HistogrammeQuotidien({ jours }: { jours: { jour: string; total: number }[] }) {
  const maximum = Math.max(1, ...jours.map((j) => j.total));
  const indexPointe = jours.reduce((max, j, i) => (j.total > jours[max].total ? i : max), 0);
  const total = jours.reduce((s, j) => s + j.total, 0);

  return (
    <figure className="m-0">
      <figcaption className="mb-1 font-semibold text-[var(--color-ink)]">
        Pages vues par jour
      </figcaption>
      <p className="mb-5 text-sm text-[var(--color-muted)]">
        {FENETRE} derniers jours · {total.toLocaleString("fr-FR")} au total · pointe à{" "}
        {maximum.toLocaleString("fr-FR")}
      </p>

      <div className="relative h-44">
        {/* Grille récessive : deux repères suffisent à donner l'échelle. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-[var(--color-border)]" />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-[var(--color-border)]" />
        {/* Le graphique est une redite visuelle du tableau dépliable : on le
            retire de l'arbre d'accessibilité plutôt que d'annoncer trente barres. */}
        <div className="absolute inset-0 flex items-end gap-[2px]" aria-hidden="true">
          {jours.map((j, i) => (
            <div
              key={j.jour}
              title={`${dateLongue(j.jour)} — ${j.total.toLocaleString("fr-FR")} page${j.total > 1 ? "s" : ""} vue${j.total > 1 ? "s" : ""}`}
              className="relative flex-1 rounded-t-[4px] bg-[var(--color-brand)] transition-colors hover:bg-[var(--color-brand-dark)]"
              style={{ height: `${Math.max((j.total / maximum) * 100, j.total > 0 ? 3 : 1)}%` }}
            >
              {i === indexPointe && j.total > 0 && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold tabular-nums text-[var(--color-ink)]">
                  {j.total}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-[var(--color-border)]" />
      </div>

      <div className="mt-2 flex justify-between text-xs text-[var(--color-muted)]">
        <span>{dateCourte(jours[0]?.jour)}</span>
        <span>{dateCourte(jours[jours.length - 1]?.jour)}</span>
      </div>

      {/* Le graphique n'est pas la seule lecture possible : le détail chiffré
          reste accessible, au clavier comme au lecteur d'écran. */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-[var(--color-muted)]">
          Voir les chiffres
        </summary>
        <div className="mt-3">
          <Table
            head={
              <>
                <Th>Jour</Th>
                <Th className="text-right">Pages vues</Th>
              </>
            }
          >
            {jours.map((j) => (
              <Tr key={j.jour}>
                <Td>{dateLongue(j.jour)}</Td>
                <Td className="text-right tabular-nums">{j.total.toLocaleString("fr-FR")}</Td>
              </Tr>
            ))}
          </Table>
        </div>
      </details>
    </figure>
  );
}

function Classement({
  titre,
  sousTitre,
  lignes,
  vide,
}: {
  titre: string;
  sousTitre?: string;
  lignes: Total[];
  vide: string;
}) {
  const maximum = Math.max(1, ...lignes.map((l) => l.total));
  return (
    <Card>
      <CardHeader title={titre} subtitle={sousTitre} />
      {lignes.length === 0 ? (
        <div className="p-5">
          <EmptyState title={vide} />
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-border)]">
          {lignes.map((l) => (
            <li key={l.libelle} className="px-5 py-3">
              <div className="flex items-baseline justify-between gap-4">
                <span className="truncate font-medium text-[var(--color-ink)]">{l.libelle}</span>
                <span className="tabular-nums text-[var(--color-muted)]">
                  {l.total.toLocaleString("fr-FR")}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
                <div
                  className="h-1.5 rounded-full bg-[var(--color-brand)]"
                  style={{ width: `${(l.total / maximum) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function quand(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(d);
}

function dateLongue(jour: string | undefined): string {
  if (!jour) return "—";
  const [a, m, j] = jour.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "full" }).format(new Date(a, m - 1, j));
}

function dateCourte(jour: string | undefined): string {
  if (!jour) return "";
  const [a, m, j] = jour.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(
    new Date(a, m - 1, j)
  );
}

function lieu(ville: string | null, region: string | null, pays: string | null): string {
  const parties = [ville, region && region !== ville ? region : null, nomDuPays(pays)].filter(
    (p): p is string => Boolean(p)
  );
  return parties.length > 1 ? parties.join(" · ") : (parties[0] ?? "Inconnu");
}
