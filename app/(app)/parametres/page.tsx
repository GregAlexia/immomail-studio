import { PageHeader, Card } from "@/components/ui";
import { MenuSettingsForm } from "@/components/MenuSettingsForm";
import { PresenterForm } from "@/components/PresenterForm";
import { getMenuKeys } from "@/lib/menu-settings";
import { isPresenter, presenterProtectionEnabled } from "@/lib/admin";
import { traducteur } from "@/lib/i18n";
import { NAV } from "@/components/app-shell/nav-items";

export default async function ParametresPage() {
  const t = await traducteur();
  const menuKeys = await getMenuKeys();
  const protectionEnabled = presenterProtectionEnabled();
  const unlocked = await isPresenter();

  return (
    <>
      <PageHeader
        title={t("Paramétrage")}
        description={t(
          "Choisissez les espaces visibles dans le menu de l'application. Les pages désactivées restent accessibles par leur adresse directe ; seul le menu change. Le réglage est mémorisé sur ce navigateur."
        )}
      />
      <div className="max-w-3xl space-y-6">
        <Card className="p-5">
          <h2 className="mb-3 font-semibold text-[var(--color-ink)]">{t("Mode présentateur")}</h2>
          <PresenterForm
            protectionEnabled={protectionEnabled}
            unlocked={unlocked}
            textes={{
              protectionDesactivee: [
                t("Protection désactivée : aucune variable"),
                t(
                  "n'est configurée sur le serveur. Tous les visiteurs peuvent piloter l'horloge, réinitialiser la démo et importer des données. Pour protéger la démo publique, définissez cette variable (sur Vercel : Settings → Environment Variables) puis redéployez."
                ),
              ],
              deverrouille: t("Mode présentateur déverrouillé"),
              deverrouilleDetail: t(
                "Horloge, réinitialisation et import sont utilisables depuis ce navigateur."
              ),
              verrouiller: t("Verrouiller"),
              verrouillee: t("Démo verrouillée"),
              motDePasse: t("Mot de passe présentateur"),
              deverrouiller: t("Déverrouiller"),
              incorrect: t("Mot de passe incorrect"),
            }}
          />
        </Card>
        <MenuSettingsForm
          initialKeys={menuKeys}
          textes={{
            libelles: Object.fromEntries(NAV.map((n) => [n.key, t(n.label)])),
            descriptions: Object.fromEntries(
              NAV.map((n) => [n.key, n.description ? t(n.description) : ""])
            ),
            enregistrement: t("Enregistrement…"),
            enregistrer: t("Enregistrer"),
            retablir: t("Rétablir les menus par défaut"),
            enregistre: t("Enregistré — la navigation est à jour"),
          }}
        />
      </div>
    </>
  );
}
