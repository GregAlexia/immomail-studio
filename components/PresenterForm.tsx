"use client";

import { useState, useTransition } from "react";
import { Lock, Unlock, Check, X } from "lucide-react";
import { unlockPresenter, lockPresenter } from "@/app/actions";

/** Intitulés déjà traduits : un composant client ne lit pas le cookie de langue. */
export type TextesPresentateur = {
  protectionDesactivee: [string, string];
  deverrouille: string;
  deverrouilleDetail: string;
  verrouiller: string;
  verrouillee: string;
  motDePasse: string;
  deverrouiller: string;
  incorrect: string;
};

export function PresenterForm({
  protectionEnabled,
  unlocked,
  textes: tx,
}: {
  protectionEnabled: boolean;
  unlocked: boolean;
  textes: TextesPresentateur;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!protectionEnabled) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        {tx.protectionDesactivee[0]} <code className="rounded bg-slate-100 px-1">DEMO_ADMIN_PASSWORD</code>{" "}
        {tx.protectionDesactivee[1]}
      </p>
    );
  }

  if (unlocked) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
          <Unlock size={14} /> {tx.deverrouille}
        </span>
        <span className="text-sm text-[var(--color-muted)]">{tx.deverrouilleDetail}</span>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => { await lockPresenter(); })}
          className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-muted)] transition hover:text-[var(--color-ink)] disabled:opacity-60"
        >
          {tx.verrouiller}
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
        <Lock size={14} /> {tx.verrouillee}
      </span>
      <input
        type="password"
        value={password}
        onChange={(e) => { setPassword(e.target.value); setError(false); }}
        placeholder={tx.motDePasse}
        autoComplete="current-password"
        className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm shadow-sm focus:border-[var(--color-brand)] focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending || password.length === 0}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "…" : <><Check size={14} /> {tx.deverrouiller}</>}
      </button>
      {error && (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-rose-600">
          <X size={14} /> {tx.incorrect}
        </span>
      )}
    </form>
  );
}
