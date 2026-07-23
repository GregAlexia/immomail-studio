import { PageHeader, Card } from "@/components/ui";
import { MenuSettingsForm } from "@/components/MenuSettingsForm";
import { PresenterForm } from "@/components/PresenterForm";
import { getMenuKeys } from "@/lib/menu-settings";
import { isPresenter, presenterProtectionEnabled } from "@/lib/admin";

export default async function ParametresPage() {
  const menuKeys = await getMenuKeys();
  const protectionEnabled = presenterProtectionEnabled();
  const unlocked = await isPresenter();

  return (
    <>
      <PageHeader
        title="Paramétrage"
        description="Choisissez les espaces visibles dans le menu de l'application. Les pages désactivées restent accessibles par leur adresse directe ; seul le menu change. Le réglage est mémorisé sur ce navigateur."
      />
      <div className="max-w-3xl space-y-6">
        <Card className="p-5">
          <h2 className="mb-3 font-semibold text-[var(--color-ink)]">Mode présentateur</h2>
          <PresenterForm protectionEnabled={protectionEnabled} unlocked={unlocked} />
        </Card>
        <MenuSettingsForm initialKeys={menuKeys} />
      </div>
    </>
  );
}
