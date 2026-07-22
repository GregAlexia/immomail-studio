import { PageHeader } from "@/components/ui";
import { MenuSettingsForm } from "@/components/MenuSettingsForm";
import { getMenuKeys } from "@/lib/menu-settings";

export default async function ParametresPage() {
  const menuKeys = await getMenuKeys();

  return (
    <>
      <PageHeader
        title="Paramétrage"
        description="Choisissez les espaces visibles dans le menu de l'application. Les pages désactivées restent accessibles par leur adresse directe ; seul le menu change. Le réglage est mémorisé sur ce navigateur."
      />
      <div className="max-w-3xl">
        <MenuSettingsForm initialKeys={menuKeys} />
      </div>
    </>
  );
}
