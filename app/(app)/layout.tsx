import { getAgencies, getSelectedAgency } from "@/lib/agency";
import { getClock } from "@/lib/demo-clock";
import { getMenuKeys } from "@/lib/menu-settings";
import { fmtDayLong } from "@/lib/date";
import { Sidebar } from "@/components/app-shell/Sidebar";
import { MobileNav } from "@/components/app-shell/MobileNav";
import { AgencySelector } from "@/components/app-shell/AgencySelector";
import { DemoClockBar } from "@/components/app-shell/DemoClockBar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const agencies = await getAgencies();
  const selected = await getSelectedAgency();

  if (!selected) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="max-w-md rounded-xl border border-[var(--color-border)] bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[var(--color-ink)]">Base de données vide</h1>
          <p className="mt-2 text-[var(--color-muted)]">
            Chargez les données de démonstration avec&nbsp;:
          </p>
          <pre className="mt-4 rounded-lg bg-slate-900 px-4 py-3 text-left text-sm text-emerald-300">npm run seed</pre>
          <p className="mt-3 text-sm text-[var(--color-muted)]">puis rechargez cette page.</p>
        </div>
      </div>
    );
  }

  const clock = await getClock();
  const menuKeys = await getMenuKeys();

  return (
    <div className="flex min-h-screen">
      <Sidebar enabledKeys={menuKeys} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-3 backdrop-blur sm:px-5">
          <div className="flex items-center gap-2">
            <MobileNav enabledKeys={menuKeys} />
            <AgencySelector
              agencies={agencies.map((a) => ({ id: a.id, name: a.name, city: a.city }))}
              selectedId={selected.id}
            />
          </div>
          <DemoClockBar currentISO={clock.current} currentLabel={fmtDayLong(clock.current)} />
        </header>
        <main className="flex-1 px-4 py-6 sm:px-5 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
