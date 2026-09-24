import { listerEspaces } from "@/lib/db/espaces";
import { listerInscriptions } from "@/lib/db/inscriptions";
import { nomDuPays } from "@/lib/geo";
import { Card, CardHeader, EmptyState, Table, Td, Th, Tr } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PageComptes() {
  const [espaces, inscriptions] = await Promise.all([listerEspaces(), listerInscriptions(200)]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">Comptes</h1>
        <p className="mt-1 max-w-2xl text-[var(--color-muted)]">
          Keo n&apos;a pas d&apos;authentification : ce qui tient lieu de compte, c&apos;est
          l&apos;espace de démonstration ouvert par un lien <code>/c/…</code>. En dessous, les
          personnes qui ont demandé à être rappelées depuis la page de vente.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Espaces de démonstration"
          subtitle="Un espace par commercial, plus l'espace partagé des visiteurs sans lien nominatif"
        />
        {espaces.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Aucun espace"
              hint="Le premier s'ouvre dès qu'un lien /c/… est utilisé."
            />
          </div>
        ) : (
          <Table
            head={
              <>
                <Th>Espace</Th>
                <Th>Lien</Th>
                <Th className="text-right">Agences</Th>
                <Th className="text-right">Pages vues</Th>
                <Th>Horloge de démo</Th>
                <Th>Dernière visite</Th>
              </>
            }
          >
            {espaces.map((e) => (
              <Tr key={e.id}>
                <Td className="font-medium">{e.nom}</Td>
                <Td className="whitespace-nowrap font-mono text-xs text-[var(--color-muted)]">
                  {e.id === "demo" ? "/" : `/c/${e.id}`}
                </Td>
                <Td className="text-right tabular-nums">{e.agences}</Td>
                <Td className="text-right tabular-nums">{e.vues.toLocaleString("fr-FR")}</Td>
                <Td className="whitespace-nowrap text-[var(--color-muted)]">
                  {e.horloge ? horodatage(e.horloge) : "Par défaut"}
                </Td>
                <Td className="whitespace-nowrap text-[var(--color-muted)]">
                  {e.derniereVue ? horodatage(e.derniereVue) : "—"}
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader
          title="Demandes de rappel"
          subtitle={`${inscriptions.length} demande${inscriptions.length > 1 ? "s" : ""} depuis la page de vente`}
        />
        {inscriptions.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Aucune demande pour l'instant"
              hint="Le formulaire se trouve en bas de /presentation."
            />
          </div>
        ) : (
          <Table
            head={
              <>
                <Th>Reçue</Th>
                <Th>Nom</Th>
                <Th>Agence</Th>
                <Th>Coordonnées</Th>
                <Th>Venu par</Th>
                <Th>D&apos;où</Th>
              </>
            }
          >
            {inscriptions.map((i) => (
              <Tr key={i.id}>
                <Td className="whitespace-nowrap text-[var(--color-muted)]">{horodatage(i.creeLe)}</Td>
                <Td className="font-medium">{i.nom}</Td>
                <Td>{i.agence ?? "—"}</Td>
                <Td>
                  <a href={`mailto:${i.email}`} className="underline underline-offset-4">
                    {i.email}
                  </a>
                  {i.telephone && (
                    <span className="block text-[var(--color-muted)]">{i.telephone}</span>
                  )}
                </Td>
                <Td>{i.commercial ?? "—"}</Td>
                <Td>
                  {[i.ville, nomDuPays(i.pays)].filter(Boolean).join(" · ")}
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      <p className="mt-6 max-w-2xl text-xs leading-relaxed text-[var(--color-muted)]">
        Les demandes de rappel contiennent des coordonnées réelles, confiées volontairement. Elles
        ne servent qu&apos;à rappeler la personne, ne partent vers aucun service tiers, et doivent
        être supprimées lorsqu&apos;elles ne servent plus.
      </p>
    </>
  );
}

function horodatage(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}
