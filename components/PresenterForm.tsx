"use client";

import { useState, useTransition } from "react";
import { Lock, Unlock, Check, X } from "lucide-react";
import { unlockPresenter, lockPresenter } from "@/app/actions";

export function PresenterForm({
  protectionEnabled,
  unlocked,
}: {
  protectionEnabled: boolean;
  unlocked: boolean;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!protectionEnabled) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        Protection désactivée : aucune variable <code className="rounded bg-slate-100 px-1">DEMO_ADMIN_PASSWORD</code> n'est
        configurée sur le serveur. Tous les visiteurs peuvent piloter l'horloge, réinitialiser la démo et importer des
        données. Pour protéger la démo publique, définissez cette variable (sur Vercel : Settings → Environment
        Variables) puis redéployez.
      </p>
    );
  }

  if (unlocked) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
          <Unlock size={14} /> Mode présentateur déverrouillé
        </span>
        <span className="text-sm text-[var(--color-muted)]">Horloge, réinitialisation et import sont utilisables depuis ce navigateur.</span>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => { await lockPresenter(); })}
          className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-muted)] transition hover:text-[var(--color-ink)] disabled:opacity-60"
        >
          Verrouiller
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(false);
        startTransition(async () => {
          const res = await unlockPresenter(password);
          if (!res.ok) setError(true);
        });
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
        <Lock size={14} /> Démo verrouillée
      </span>
      <input
        type="password"
        value={password}
        onChange={(e) => { setPassword(e.target.value); setError(false); }}
        placeholder="Mot de passe présentateur"
        autoComplete="current-password"
        className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm shadow-sm focus:border-[var(--color-brand)] focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending || password.length === 0}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "…" : <><Check size={14} /> Déverrouiller</>}
      </button>
      {error && (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-rose-600">
          <X size={14} /> Mot de passe incorrect
        </span>
      )}
    </form>
  );
}
