import Link from "next/link";
import { Info } from "lucide-react";
import { PageHeader, Card } from "@/components/ui";
import { ImportPanel } from "@/components/ImportPanel";
import { traducteur } from "@/lib/i18n";

export default async function ImportPage() {
  const t = await traducteur();
  return (
    <div className="max-w-3xl">
      <PageHeader
        title={t("Import / Export Excel")}
        description={t(
          "Pilotez la démo avec vos propres données : téléchargez le modèle, modifiez-le, ré-importez-le. Le contenu affiché reflète directement le fichier."
        )}
      />

      <ImportPanel />

      <Card className="mt-6 p-5">
        <div className="flex items-start gap-2">
          <Info size={18} className="mt-0.5 shrink-0 text-[var(--color-brand)]" />
          <div className="text-sm text-[var(--color-muted)]">
            <p className="font-medium text-[var(--color-ink)]">{t("Onglets reconnus dans le classeur")}</p>
            <p className="mt-1">
              {t("Les onglets du classeur portent des noms français — ce sont les clés de lecture du fichier, elles ne changent pas avec la langue de l'interface : Agences, Paramètres, Stock de biens, Acheteurs, Boîte de réception, Leads qualifiés, Rendez-vous, Suivi des visites, Mandats, Baux, Conformité, Transactions, Segments newsletter.")}
            </p>
            <p className="mt-2">
              <strong>{t("Multi-agences :")}</strong>{" "}
              {t("listez vos agences dans l'onglet Agences, puis indiquez l'agence de chaque ligne via la colonne Agence (présente sur chaque onglet de données). Une ligne sans agence est rattachée à la première agence listée.")}
            </p>
            <p className="mt-2">
              {t("Le détail des colonnes, valeurs acceptées et exemples est dans l'")}
              <Link href="/aide#excel" className="font-medium text-[var(--color-brand-dark)] hover:underline">
                {t("aide → Fichier Excel source")}
              </Link>
              . {t("Les onglets absents sont simplement ignorés.")}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
