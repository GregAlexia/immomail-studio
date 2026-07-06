import {
  Rocket,
  CalendarClock,
  Inbox,
  CalendarDays,
  ReceiptText,
  Play,
  Info,
} from "lucide-react";
import { Card, PageHeader, Badge, Table, Th, Td, Tr } from "@/components/ui";

function Section({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[var(--color-brand)]">{icon}</span>
        <h2 className="text-xl font-bold text-[var(--color-ink)]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[13px] font-medium text-slate-700">{children}</code>;
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-2 text-sm text-[var(--color-ink)]">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[11px] font-bold text-[var(--color-brand-dark)]">{i + 1}</span>
          <span>{it}</span>
        </li>
      ))}
    </ol>
  );
}

export default function AidePage() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Aide & guide d'utilisation"
        description="Comment piloter la démonstration et utiliser les fonctionnalités des trois espaces : Boîte de réception, Agenda & visites, Locations & quittances."
      />

      {/* Sommaire */}
      <Card className="mb-8 p-5">
        <p className="mb-2 text-sm font-semibold text-[var(--color-muted)]">Sommaire</p>
        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          {[
            ["#prise-en-main", "1. Prise en main & horloge de démo"],
            ["#reception", "2. Boîte de réception (leads)"],
            ["#agenda", "3. Agenda & visites"],
            ["#locations", "4. Locations & quittances"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="text-[var(--color-brand-dark)] hover:underline">{label}</a>
          ))}
        </div>
      </Card>

      <div className="space-y-10">
        {/* 1. PRISE EN MAIN */}
        <Section id="prise-en-main" title="1. Prise en main & horloge de démo" icon={<Rocket size={20} />}>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <h3 className="font-semibold text-[var(--color-ink)]">Choisir l'agence</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                En haut à gauche, le sélecteur isole les données d'une agence. L'agence <strong>Horizon Immobilier</strong> contient le scénario complet.
              </p>
            </Card>
            <Card className="p-5">
              <h3 className="flex items-center gap-2 font-semibold text-[var(--color-ink)]"><CalendarClock size={16} className="text-[var(--color-brand)]" /> L'horloge de démo</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Le bandeau en haut à droite pilote la « date de démo ». Choisissez une date, puis cliquez <strong>Évaluer</strong> : les automatisations dont l'échéance est atteinte se déclenchent en direct (rappels de visite, quittances mensuelles…).
              </p>
            </Card>
          </div>
          <Card className="mt-4">
            <Table head={<><Th>Contrôle</Th><Th>Effet</Th></>}>
              <Tr><Td><Chip>Date de démo</Chip></Td><Td>Affiche la date courante de la démonstration.</Td></Tr>
              <Tr><Td><Chip>Sélecteur de date</Chip></Td><Td>Choisir une nouvelle date (l'horloge n'avance que vers l'avenir, jamais en arrière).</Td></Tr>
              <Tr><Td><Chip>Évaluer</Chip></Td><Td>Déclenche toutes les automatisations échues jusqu'à la date affichée.</Td></Tr>
              <Tr><Td><Chip>Réinitialiser</Chip></Td><Td>Recharge les données d'origine et remet la date de départ (idéal entre deux rendez-vous).</Td></Tr>
            </Table>
            <p className="flex items-start gap-2 px-5 py-3 text-sm text-[var(--color-brand-dark)]">
              <Info size={16} className="mt-0.5 shrink-0" />
              À chaque évaluation, une fenêtre récapitule les automatisations déclenchées. Aucune action n'est jamais exécutée deux fois.
            </p>
          </Card>
        </Section>

        {/* 2. BOÎTE DE RÉCEPTION */}
        <Section id="reception" title="2. Boîte de réception" icon={<Inbox size={20} />}>
          <Card className="p-5">
            <p className="mb-1 text-sm font-medium text-[var(--color-brand-dark)]">Tri &amp; qualification · réponse instantanée · création de fiche CRM</p>
            <p className="mb-4 text-sm text-[var(--color-ink)]">
              C'est le cœur de la démo : chaque email brut reçu des portails (SeLoger, Leboncoin, Bien'ici, formulaire) est trié automatiquement, le spam écarté, le lead routé vers le bon négociateur, une réponse envoyée et une fiche CRM créée — le tout en vue <strong>avant / après</strong>.
            </p>
            <Steps items={[
              <>Ouvrir <strong>Boîte de réception</strong> : à gauche, les <strong>emails bruts</strong> non triés.</>,
              <>Cliquer sur <span className="inline-flex items-center gap-1 rounded bg-[var(--color-brand)] px-1.5 py-0.5 text-xs font-semibold text-white"><Play size={11} /> Trier les emails</span> (ou « Évaluer » dans le bandeau).</>,
              <>À droite apparaissent les <strong>leads qualifiés</strong> : nom, contact, type de demande, bien, négociateur assigné et horodatage de la réponse automatique.</>,
              <>Les compteurs en bas résument : <strong>spam écarté</strong>, <strong>leads créés</strong>, <strong>réponses envoyées</strong>.</>,
            ]} />
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              💡 Le tri reconnaît aussi les emails qui ne sont <em>pas</em> de nouveaux leads (suivi après visite, envoi de pièces) et ne crée pas de doublon.
            </p>
          </Card>
        </Section>

        {/* 3. AGENDA & VISITES */}
        <Section id="agenda" title="3. Agenda & visites" icon={<CalendarDays size={20} />}>
          <Card className="p-5">
            <p className="mb-1 text-sm font-medium text-[var(--color-brand-dark)]">Prise de RDV en ligne · confirmations &amp; rappels automatiques</p>
            <p className="mb-4 text-sm text-[var(--color-ink)]">
              Les prospects réservent une visite en ligne ; l'agence n'a plus d'allers-retours téléphoniques. Chaque RDV déclenche une confirmation puis des rappels automatiques pour réduire les no-shows.
            </p>
            <Steps items={[
              <>Dans <strong>Agenda & visites</strong>, consulter les visites <strong>à venir</strong> et <strong>passées</strong>, avec leur statut.</>,
              <>Pour montrer la réservation : panneau <strong>« Pages de réservation publiques »</strong> → <strong>Ouvrir la page de réservation</strong> d'un bien, choisir un créneau et valider.</>,
              <>Le RDV apparaît dans l'agenda et une <strong>confirmation</strong> part automatiquement.</>,
              <>Pour déclencher les <strong>rappels J-1 et H-2</strong> : choisissez une date proche du RDV dans le bandeau, puis cliquez <strong>Évaluer</strong>.</>,
            ]} />
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              💡 La colonne « Suivi automatique » montre les badges <Badge tone="blue">Confirmation</Badge> <Badge tone="green">Rappel J-1</Badge> <Badge tone="amber">Rappel H-2</Badge> au fur et à mesure que la date avance.
            </p>
          </Card>
        </Section>

        {/* 4. LOCATIONS & QUITTANCES */}
        <Section id="locations" title="4. Locations & quittances" icon={<ReceiptText size={20} />}>
          <Card className="p-5">
            <p className="mb-1 text-sm font-medium text-[var(--color-brand-dark)]">Quittances de loyer automatiques (PDF)</p>
            <p className="mb-4 text-sm text-[var(--color-ink)]">
              Chaque mois, au jour d'échéance du loyer, la quittance est générée en PDF et envoyée au locataire — sans intervention. Plus aucune quittance oubliée.
            </p>
            <Steps items={[
              <>Ouvrir <strong>Locations & quittances</strong> : chaque bail affiche le locataire, le loyer + charges et le jour d'échéance.</>,
              <>Choisir une date du <strong>mois suivant</strong> (après le jour d'échéance) dans le bandeau, puis cliquer <strong>Évaluer</strong> : la <strong>quittance du mois</strong> est générée pour chaque bail concerné.</>,
              <>Cliquer sur <strong>Télécharger le PDF</strong> pour montrer la quittance réelle (montant, période, bailleur, locataire, bien).</>,
            ]} />
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              💡 Le compteur « Quittances du mois » du tableau de bord se met à jour à chaque échéance franchie.
            </p>
          </Card>
        </Section>
      </div>
    </div>
  );
}
