import Link from "next/link";
import { actionCreerOffre, actionModifierOffre, actionSupprimerOffre } from "@/app/admin/actions";
import {
  formaterDate,
  formaterPrix,
  listerOffres,
  prixAffiche,
  reductionActive,
  type Offre,
} from "@/lib/db/offres";
import { Card, CardHeader, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, { ton: "ok" | "erreur"; texte: string }> = {
  creee: { ton: "ok", texte: "Offre créée." },
  modifiee: { ton: "ok", texte: "Offre enregistrée." },
  supprimee: { ton: "ok", texte: "Offre supprimée." },
  nom: { ton: "erreur", texte: "Le nom de l'offre est obligatoire." },
  prix: { ton: "erreur", texte: "Prix illisible. Attendu : 149, 149,50 ou 149.50." },
  date: { ton: "erreur", texte: "Date de fin illisible." },
  introuvable: { ton: "erreur", texte: "Offre introuvable." },
};

export default async function PageTarifs({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string; supprimer?: string }>;
}) {
  const { ok, erreur, supprimer } = await searchParams;
  const offres = await listerOffres();
  const message = MESSAGES[ok ?? erreur ?? ""];
  const aSupprimer = supprimer ? offres.find((o) => o.id === supprimer) : undefined;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">Tarifs</h1>
        <p className="mt-1 max-w-2xl text-[var(--color-muted)]">
          Ce que vous réglez ici s&apos;affiche sur{" "}
          <Link href="/presentation" className="underline underline-offset-4">
            la page de vente
          </Link>
          . Une réduction dont la date de fin est passée cesse d&apos;elle-même : le prix plein
          reprend, sans intervention. Les prix sont affichés tels quels, sans mention « HT » —
          AgenIA relève de la franchise en base de TVA.
        </p>
      </div>

      {message && (
        <p
          className={
            message.ton === "ok"
              ? "mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              : "mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          }
        >
          {message.texte}
        </p>
      )}

      {aSupprimer && (
        <Card className="mb-6 border-rose-200 bg-rose-50">
          <div className="p-5">
            <p className="font-semibold text-rose-900">
              Supprimer l&apos;offre « {aSupprimer.nom} » ?
            </p>
            <p className="mt-1 text-sm text-rose-800">
              Elle disparaîtra immédiatement de la page de vente. Rien n&apos;est conservé.
            </p>
            <div className="mt-4 flex gap-3">
              <form action={actionSupprimerOffre}>
                <input type="hidden" name="id" value={aSupprimer.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                >
                  Supprimer définitivement
                </button>
              </form>
              <Link
                href="/admin/tarifs"
                className="rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-slate-50"
              >
                Annuler
              </Link>
            </div>
          </div>
        </Card>
      )}

      {offres.length === 0 ? (
        <EmptyState
          title="Aucune offre pour l'instant"
          hint="Tant qu'aucune offre n'est publiée, la page de vente n'affiche pas de section tarifs — elle renvoie vers un échange."
        />
      ) : (
        <div className="space-y-4">
          {offres.map((offre) => (
            <BlocOffre key={offre.id} offre={offre} />
          ))}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader
          title="Nouvelle offre"
          subtitle="Le rang décide de l'ordre d'affichage, du plus petit au plus grand."
        />
        <form action={actionCreerOffre} className="p-5">
          <ChampsOffre />
          <button
            type="submit"
            className="mt-5 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-dark)]"
          >
            Créer l&apos;offre
          </button>
        </form>
      </Card>
    </>
  );
}

function BlocOffre({ offre }: { offre: Offre }) {
  const prix = prixAffiche(offre);
  const enPromotion = reductionActive(offre);

  return (
    <Card>
      <CardHeader
        title={offre.nom}
        subtitle={
          enPromotion
            ? `Affiché ${formaterPrix(prix.centimes)} au lieu de ${formaterPrix(offre.prixCentimes)}` +
              (prix.finOffre ? ` — jusqu'au ${formaterDate(prix.finOffre)}` : " — sans date de fin")
            : `Affiché ${formaterPrix(offre.prixCentimes)}`
        }
        action={
          <div className="flex items-center gap-2">
            {!offre.publiee && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                Non publiée
              </span>
            )}
            {offre.miseEnAvant && (
              <span className="rounded-full bg-[var(--color-brand-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-brand-dark)]">
                Mise en avant
              </span>
            )}
          </div>
        }
      />
      <form action={actionModifierOffre} className="p-5">
        <input type="hidden" name="id" value={offre.id} />
        <ChampsOffre offre={offre} />
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-dark)]"
          >
            Enregistrer
          </button>
          <Link
            href={`/admin/tarifs?supprimer=${offre.id}`}
            className="text-sm font-medium text-rose-700 underline underline-offset-4 hover:text-rose-900"
          >
            Supprimer
          </Link>
        </div>
      </form>
    </Card>
  );
}

const CHAMP =
  "mt-1 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-brand)]";
const ETIQUETTE = "block text-sm font-medium text-[var(--color-ink)]";
const AIDE = "mt-1 text-xs text-[var(--color-muted)]";

function ChampsOffre({ offre }: { offre?: Offre }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="sm:col-span-1">
        <span className={ETIQUETTE}>Nom de l&apos;offre</span>
        <input name="nom" defaultValue={offre?.nom} required maxLength={80} className={CHAMP} />
      </label>

      <label className="sm:col-span-1">
        <span className={ETIQUETTE}>Sous-titre</span>
        <input
          name="detail"
          defaultValue={offre?.detail ?? ""}
          maxLength={160}
          placeholder="Une agence · par mois"
          className={CHAMP}
        />
      </label>

      <label>
        <span className={ETIQUETTE}>Prix</span>
        <input
          name="prix"
          defaultValue={offre ? (offre.prixCentimes / 100).toString().replace(".", ",") : ""}
          required
          inputMode="decimal"
          placeholder="149"
          className={CHAMP}
        />
        <span className={AIDE}>En euros. « 149 » ou « 149,50 ».</span>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label>
          <span className={ETIQUETTE}>Réduction</span>
          <input
            name="reductionPct"
            type="number"
            min={0}
            max={90}
            defaultValue={offre?.reductionPct ?? 0}
            className={CHAMP}
          />
          <span className={AIDE}>En %. 0 = pas d&apos;offre.</span>
        </label>
        <label>
          <span className={ETIQUETTE}>Fin de l&apos;offre</span>
          <input name="finOffre" type="date" defaultValue={offre?.finOffre ?? ""} className={CHAMP} />
          <span className={AIDE}>Vide = sans terme.</span>
        </label>
      </div>

      <label className="sm:col-span-2">
        <span className={ETIQUETTE}>Ce que comprend l&apos;offre</span>
        <textarea
          name="points"
          defaultValue={offre?.points ?? ""}
          rows={4}
          maxLength={1000}
          placeholder={"Les onze automatisations\nFactures illimitées\nAssistance incluse"}
          className={CHAMP}
        />
        <span className={AIDE}>Une ligne par argument affiché.</span>
      </label>

      <details className="sm:col-span-2 rounded-lg border border-[var(--color-border)] bg-white px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-[var(--color-ink)]">
          Version anglaise <span className="font-normal text-[var(--color-muted)]">— facultative</span>
        </summary>
        <p className={`${AIDE} mb-4`}>
          Ce qui reste vide reprend le français sur{" "}
          <Link href="/en/presentation" className="underline underline-offset-4">
            /en/presentation
          </Link>
          . Le prix, la réduction et la date de fin sont communs aux deux langues.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <label>
            <span className={ETIQUETTE}>Nom (EN)</span>
            <input name="nomEn" defaultValue={offre?.nomEn ?? ""} maxLength={80} className={CHAMP} />
          </label>
          <label>
            <span className={ETIQUETTE}>Sous-titre (EN)</span>
            <input
              name="detailEn"
              defaultValue={offre?.detailEn ?? ""}
              maxLength={160}
              placeholder="One agency · per month"
              className={CHAMP}
            />
          </label>
          <label className="sm:col-span-2">
            <span className={ETIQUETTE}>Ce que comprend l&apos;offre (EN)</span>
            <textarea
              name="pointsEn"
              defaultValue={offre?.pointsEn ?? ""}
              rows={4}
              maxLength={1000}
              placeholder={"All eleven automations\nUnlimited enquiries\nSupport included"}
              className={CHAMP}
            />
            <span className={AIDE}>Une ligne par argument, comme en français.</span>
          </label>
        </div>
      </details>

      <label>
        <span className={ETIQUETTE}>Rang d&apos;affichage</span>
        <input
          name="rang"
          type="number"
          min={0}
          max={99}
          defaultValue={offre?.rang ?? 0}
          className={CHAMP}
        />
      </label>

      <div className="flex flex-col justify-end gap-2">
        <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
          <input
            type="checkbox"
            name="publiee"
            defaultChecked={offre ? offre.publiee : true}
            className="size-4 accent-[var(--color-brand)]"
          />
          Visible sur la page de vente
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
          <input
            type="checkbox"
            name="miseEnAvant"
            defaultChecked={offre?.miseEnAvant ?? false}
            className="size-4 accent-[var(--color-brand)]"
          />
          Mise en avant (cadre appuyé)
        </label>
      </div>
    </div>
  );
}
