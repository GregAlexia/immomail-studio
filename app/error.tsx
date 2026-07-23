"use client";

// Écran d'erreur applicatif : affiché à la place de la page d'erreur brute du
// navigateur quand un rendu serveur échoue (cas typique : base Supabase en
// pause automatique — plan Free — qui met ~30 s à se réveiller).
import { useEffect } from "react";
import { RotateCcw, Database } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg,#f1f5f9)] p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <Database size={22} />
        </span>
        <h1 className="text-xl font-bold text-slate-900">Un instant…</h1>
        <p className="mt-2 text-sm text-slate-600">
          La démonstration n'a pas pu charger ses données. La base de données est peut-être
          en train de se réveiller (cela prend ~30 secondes après une période d'inactivité).
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          <RotateCcw size={15} /> Réessayer
        </button>
        {error.digest && (
          <p className="mt-4 text-[11px] text-slate-400">Code : {error.digest}</p>
        )}
      </div>
    </div>
  );
}
