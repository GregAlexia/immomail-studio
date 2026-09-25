import {
  Rocket,
  Inbox,
  CalendarDays,
  ReceiptText,
  Info,
  FileSignature,
  ShieldCheck,
  Megaphone,
  History,
  Send,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Card, PageHeader, Table, Th, Td, Tr } from "@/components/ui";
import { getLangue } from "@/lib/i18n";
import { AIDE_FR } from "@/lib/i18n/aide-fr";
import { AIDE_EN } from "@/lib/i18n/aide-en";
import type { Encadre, SectionAide } from "@/lib/i18n/aide";

const ICONES: Record<SectionAide["icone"], LucideIcon> = {
  rocket: Rocket,
  inbox: Inbox,
  agenda: CalendarDays,
  quittance: ReceiptText,
  mandat: FileSignature,
  conformite: ShieldCheck,
  marketing: Megaphone,
  journal: History,
  envoi: Send,
};

/**
 * Rend le balisage léger du guide : `**gras**` et `` `code` ``.
 *
 * Une expression régulière à deux alternatives suffit, et c'est volontairement
 * tout ce qui est reconnu : le guide a besoin d'insister sur un nom d'écran ou
 * de citer un chemin, pas d'un moteur Markdown.
 */
function Riche({ texte }: { texte: string }) {
  const morceaux = texte.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return (
    <>
      {morceaux.map((m, i) => {
        if (m.startsWith("**") && m.endsWith("**")) return <strong key={i}>{m.slice(2, -2)}</strong>;
        if (m.startsWith("`") && m.endsWith("`")) {
          return (
            <code
              key={i}
              className="rounded bg-slate-100 px-1.5 py-0.5 text-[13px] font-medium text-slate-700"
            >
              {m.slice(1, -1)}
            </code>
          );
        }
        if (m.startsWith("*") && m.endsWith("*") && m.length > 2) return <em key={i}>{m.slice(1, -1)}</em>;
        return m;
      })}
    </>
  );
}

function BlocEncadre({ encadre }: { encadre: Encadre }) {
  if (encadre.ton === "info") {
    return (
      <p className="flex items-start gap-2 px-5 py-3 text-sm text-[var(--color-brand-dark)]">
        <Info size={16} className="mt-0.5 shrink-0" />
        <span>
          <Riche texte={encadre.texte} />
        </span>
      </p>
    );
  }
  return (
    <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
      <Riche texte={encadre.texte} />
    </p>
  );
}

export default async function AidePage() {
  const langue = await getLangue();
  const c = langue === "en" ? AIDE_EN : AIDE_FR;

  return (
    <div className="max-w-4xl">
      <PageHeader title={c.titre} description={c.description} />

      <Card className="mb-8 p-5">
        <p className="mb-2 text-sm font-semibold text-[var(--color-muted)]">{c.sommaire}</p>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {c.sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="text-[var(--color-brand-dark)] hover:underline">
              {s.titre}
            </a>
          ))}
        </div>
      </Card>

      <div className="space-y-10">
        {c.sections.map((s, index) => (
          <div key={s.id} className="space-y-10">
            {/* L'avertissement sur les espaces masqués s'intercale avant la
                première section qui en fait partie — « Mandats ». */}
            {s.id === "mandats" && (
              <Card className="border-violet-200 bg-violet-50 p-4">
                <p className="flex items-start gap-2 text-sm text-violet-900">
                  <Settings size={16} className="mt-0.5 shrink-0" />
                  <span>
                    <Riche texte={c.espacesMasques} />
                  </span>
                </p>
              </Card>
            )}

            <Bloc section={s} premier={index === 0} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Bloc({ section: s, premier }: { section: SectionAide; premier: boolean }) {
  const Icone = ICONES[s.icone];
  return (
    <section id={s.id} className="scroll-mt-24">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[var(--color-brand)]">
          <Icone size={20} />
        </span>
        <h2 className="text-xl font-bold text-[var(--color-ink)]">{s.titre}</h2>
      </div>

      {s.cartes && (
        <div className="grid gap-4 md:grid-cols-2">
          {s.cartes.map((carte) => (
            <Card key={carte.titre} className="p-5">
              <h3 className="font-semibold text-[var(--color-ink)]">{carte.titre}</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                <Riche texte={carte.texte} />
              </p>
            </Card>
          ))}
        </div>
      )}

      {s.tableau && (
        <Card className={premier ? "mt-4" : undefined}>
          <Table
            head={
              <>
                <Th>{s.tableau.colonnes[0]}</Th>
                <Th>{s.tableau.colonnes[1]}</Th>
              </>
            }
          >
            {s.tableau.lignes.map((l) => (
              <Tr key={l.controle}>
                <Td>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[13px] font-medium text-slate-700">
                    {l.controle}
                  </code>
                </Td>
                <Td>{l.effet}</Td>
              </Tr>
            ))}
          </Table>
          {s.encadres?.map((e, i) => (
            <div key={i} className={i > 0 ? "border-t border-[var(--color-border)]" : undefined}>
              <BlocEncadre encadre={e} />
            </div>
          ))}
        </Card>
      )}

      {!s.tableau && (s.chapeau || s.intro || s.etapes) && (
        <Card className="p-5">
          {s.chapeau && (
            <p className="mb-1 text-sm font-medium text-[var(--color-brand-dark)]">{s.chapeau}</p>
          )}
          {s.intro && (
            <p className="mb-4 text-sm text-[var(--color-ink)]">
              <Riche texte={s.intro} />
            </p>
          )}
          {s.etapes && (
            <ol className="space-y-2 text-sm text-[var(--color-ink)]">
              {s.etapes.map((etape, i) => (
                <li key={i} className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[11px] font-bold text-[var(--color-brand-dark)]">
                    {i + 1}
                  </span>
                  <span>
                    <Riche texte={etape} />
                  </span>
                </li>
              ))}
            </ol>
          )}
          {s.encadres?.map((e, i) => (
            <BlocEncadre key={i} encadre={e} />
          ))}
        </Card>
      )}
    </section>
  );
}
