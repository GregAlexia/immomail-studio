import Link from "next/link";
import { FileSpreadsheet, Info } from "lucide-react";
import { PageHeader, Card } from "@/components/ui";
import { ImportPanel } from "@/components/ImportPanel";

export default function ImportPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Import / Export Excel"
        description="Pilotez la démo avec vos propres données : téléchargez le modèle, modifiez-le, ré-importez-le. Le contenu affiché reflète directement le fichier."
      />

      <ImportPanel />

      <Card className="mt-6 p-5">
        <div className="flex items-start gap-2">
          <Info size={18} className="mt-0.5 shrink-0 text-[var(--color-brand)]" />
          <div className="text-sm text-[var(--color-muted)]">
            <p className="font-medium text-[var(--color-ink)]">Onglets reconnus dans le classeur</p>
            <p className="mt-1">
              <strong>Agences</strong> (nom + ville), <strong>Paramètres</strong> (date de démo), <strong>Stock de biens</strong>, <strong>Acheteurs</strong>, <strong>Boîte de réception</strong>, <strong>Leads qualifiés</strong>, <strong>Rendez-vous</strong>, <strong>Suivi des visites</strong>, <strong>Mandats</strong>, <strong>Baux</strong>, <strong>Conformité</strong>, <strong>Transactions</strong>, <strong>Segments newsletter</strong>.
            </p>
            <p className="mt-2">
              <strong>Multi-agences :</strong> listez vos agences dans l'onglet <strong>Agences</strong>, puis indiquez l'agence de chaque ligne via la colonne <strong>Agence</strong> (présente sur chaque onglet de données). Une ligne sans agence est rattachée à la première agence listée.
            </p>
            <p className="mt-2">
              Le détail des colonnes, valeurs acceptées et exemples est dans l'
              <Link href="/aide#excel" className="font-medium text-[var(--color-brand-dark)] hover:underline">aide → Fichier Excel source</Link>.
              Les onglets absents sont simplement ignorés.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
