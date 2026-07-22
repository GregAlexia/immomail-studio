import {
  Rocket,
  CalendarClock,
  Inbox,
  CalendarDays,
  ReceiptText,
  Play,
  Info,
  FileSignature,
  ShieldCheck,
  Megaphone,
  History,
  Send,
  Settings,
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
        description="Comment piloter la démonstration et utiliser chaque espace de l'application — des trois espaces principaux aux espaces complémentaires activables depuis le menu Paramétrage."
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
            ["#mandats", "5. Mandats"],
            ["#conformite", "6. Conformité"],
            ["#marketing", "7. Marketing"],
            ["#journal", "8. Journal d'activité"],
            ["#envoi", "9. Boîte d'envoi"],
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

        {/* Note : espaces complémentaires */}
        <Card className="border-violet-200 bg-violet-50 p-4">
          <p className="flex items-start gap-2 text-sm text-violet-900">
            <Settings size={16} className="mt-0.5 shrink-0" />
            <span>
              Les espaces ci-dessous (<strong>Mandats, Conformité, Marketing, Journal d'activité, Boîte d'envoi</strong>) sont
              masqués du menu par défaut. Pour les afficher : menu <strong>Paramétrage</strong> → activer l'interrupteur de
              chaque espace → <strong>Enregistrer</strong>. Ils restent aussi accessibles par leur adresse directe.
            </span>
          </p>
        </Card>

        {/* 5. MANDATS */}
        <Section id="mandats" title="5. Mandats" icon={<FileSignature size={20} />}>
          <Card className="p-5">
            <p className="mb-1 text-sm font-medium text-[var(--color-brand-dark)]">Alerte d'expiration &amp; relance propriétaire automatique</p>
            <p className="mb-4 text-sm text-[var(--color-ink)]">
              Un mandat qui expire sans relance, c'est un bien qui part chez le concurrent. Cet espace liste tous les mandats
              (exclusifs ou simples) avec leurs dates, et <strong>30 jours avant l'échéance</strong> une relance de
              renouvellement part automatiquement au propriétaire.
            </p>
            <Steps items={[
              <>Ouvrir <strong>Mandats</strong> : chaque ligne montre le bien, le propriétaire, le type de mandat et la <strong>date d'échéance</strong>.</>,
              <>Repérer un mandat dont l'échéance est proche, puis choisir dans le bandeau une date à <strong>moins de 30 jours</strong> de celle-ci et cliquer <strong>Évaluer</strong>.</>,
              <>Le mandat passe en <strong>« À relancer »</strong> et la <strong>relance email au propriétaire</strong> est envoyée (visible dans la Boîte d'envoi).</>,
            ]} />
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              💡 La relance n'est envoyée qu'<strong>une seule fois</strong> par mandat, même si vous ré-évaluez plusieurs fois.
            </p>
          </Card>
        </Section>

        {/* 6. CONFORMITÉ */}
        <Section id="conformite" title="6. Conformité" icon={<ShieldCheck size={20} />}>
          <Card className="p-5">
            <p className="mb-1 text-sm font-medium text-[var(--color-brand-dark)]">Suivi des diagnostics &amp; échéances réglementaires</p>
            <p className="mb-4 text-sm text-[var(--color-ink)]">
              DPE, assurance PNO, renouvellement de bail… chaque obligation a sa date limite. Le tableau code chaque échéance
              par couleur — <Badge tone="green">À venir</Badge> <Badge tone="amber">Imminent</Badge> <Badge tone="red">Dépassé</Badge> —
              et un <strong>rappel interne</strong> est déclenché automatiquement avant l'échéance (délai propre à chaque ligne, 30 jours par défaut).
            </p>
            <Steps items={[
              <>Ouvrir <strong>Conformité</strong> : chaque ligne montre le bien, le type d'obligation, la date limite et le délai de rappel.</>,
              <>Avancer l'horloge à l'intérieur de la fenêtre de rappel d'une échéance, puis cliquer <strong>Évaluer</strong>.</>,
              <>Le statut passe à <strong>« Rappelé »</strong> et l'événement apparaît dans le Journal d'activité.</>,
            ]} />
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              💡 Le délai de rappel se règle <em>par échéance</em> (colonne « Rappel (jours avant) » du fichier Excel d'import).
            </p>
          </Card>
        </Section>

        {/* 7. MARKETING */}
        <Section id="marketing" title="7. Marketing" icon={<Megaphone size={20} />}>
          <Card className="p-5">
            <p className="mb-1 text-sm font-medium text-[var(--color-brand-dark)]">Newsletter segmentée · avis Google · parrainage</p>
            <p className="mb-4 text-sm text-[var(--color-ink)]">
              Trois automatisations de fidélisation réunies : la <strong>newsletter</strong> qui envoie à chaque acheteur les
              biens correspondant à ses critères, la <strong>collecte d'avis Google</strong> (demande 2 jours après une
              signature, relance au 5ᵉ jour), et la <strong>demande de parrainage</strong> un mois après la signature.
            </p>
            <Steps items={[
              <>Ouvrir <strong>Marketing</strong> : les segments d'acheteurs sont listés avec leurs critères (budget, type, zones).</>,
              <>Cliquer <strong>« Envoyer la newsletter »</strong> sur un segment : chaque contact reçoit <em>sa</em> sélection personnalisée de biens.</>,
              <>Pour les avis : avancer l'horloge à <strong>J+2</strong> d'une signature → Évaluer → la demande part (email + SMS). À <strong>J+5</strong> sans avis, une relance unique part.</>,
              <>Cliquer <strong>« Simuler : avis laissé »</strong> sur une transaction pour stopper la relance (c'est ce que ferait la détection réelle).</>,
              <>À <strong>J+30</strong> de la signature : la proposition de <strong>parrainage</strong> (bon de 200 €) part automatiquement.</>,
            ]} />
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              💡 Seuls les contacts <strong>opt-in marketing</strong> avec des critères renseignés reçoivent la newsletter — et jamais deux fois la même semaine.
            </p>
          </Card>
        </Section>

        {/* 8. JOURNAL D'ACTIVITÉ */}
        <Section id="journal" title="8. Journal d'activité" icon={<History size={20} />}>
          <Card className="p-5">
            <p className="mb-1 text-sm font-medium text-[var(--color-brand-dark)]">La preuve horodatée de tout ce qui s'exécute</p>
            <p className="mb-4 text-sm text-[var(--color-ink)]">
              C'est l'écran de preuve de la démo : une <strong>timeline horodatée</strong> (à la date de démo) de chaque action
              exécutée par les automatisations — tri d'un email, envoi d'un rappel, génération d'une quittance, relance de
              mandat… Rien ne se passe « dans l'ombre ».
            </p>
            <Steps items={[
              <>Ouvrir <strong>Journal d'activité</strong> : les événements sont listés du plus récent au plus ancien.</>,
              <>Utiliser les <strong>pastilles de filtre</strong> (A1, A2, A4…) pour n'afficher que les événements d'une automatisation.</>,
              <>Après chaque clic sur <strong>Évaluer</strong>, revenir ici pour montrer la trace exacte de ce qui vient de se déclencher.</>,
            ]} />
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              💡 Chaque événement porte la <strong>date de démo</strong> à laquelle il s'est produit — pas la date réelle — pour un scénario cohérent.
            </p>
          </Card>
        </Section>

        {/* 9. BOÎTE D'ENVOI */}
        <Section id="envoi" title="9. Boîte d'envoi" icon={<Send size={20} />}>
          <Card className="p-5">
            <p className="mb-1 text-sm font-medium text-[var(--color-brand-dark)]">L'aperçu fidèle de chaque message envoyé</p>
            <p className="mb-4 text-sm text-[var(--color-ink)]">
              Tous les <strong>SMS, emails et PDF</strong> générés par les automatisations, présentés <strong>tels que le client
              les recevrait</strong> : objet, corps personnalisé, pièce jointe. En démo, aucun envoi réel ne part — c'est la
              vitrine du rendu final.
            </p>
            <Steps items={[
              <>Ouvrir <strong>Boîte d'envoi</strong> : les compteurs en haut distinguent <strong>emails</strong> et <strong>SMS</strong>.</>,
              <>Filtrer par automatisation avec les pastilles (A2 pour les rappels, A4 pour les quittances…).</>,
              <>Ouvrir un message pour montrer le <strong>texte exact</strong> reçu par le client ; les quittances offrent le <strong>téléchargement du PDF</strong> joint.</>,
            ]} />
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              💡 Argument clé en rendez-vous : « voilà précisément ce que reçoivent vos clients, sans que personne n'ait rien rédigé ».
            </p>
          </Card>
        </Section>
      </div>
    </div>
  );
}
