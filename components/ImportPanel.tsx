"use client";

import { useState, useRef } from "react";
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

interface ImportResult {
  ok: boolean;
  agencies?: string[];
  counts?: Record<string, number>;
  warnings?: string[];
  error?: string;
}

export function ImportPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleImport() {
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: fd });
      const data: ImportResult = await res.json();
      setResult(data);
      if (data.ok) setTimeout(() => window.location.assign("/"), 1800);
    } catch {
      setResult({ ok: false, error: "Échec de l'envoi du fichier." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Étape 1 : modèle */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand-dark)] text-sm font-bold">1</span>
          <h3 className="font-semibold text-[var(--color-ink)]">Récupérer le modèle Excel</h3>
        </div>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Téléchargez le classeur pré-rempli avec les données actuelles. Il contient tous les onglets au bon format — modifiez-le, ajoutez vos biens, leads, RDV… puis ré-importez-le.
        </p>
        <a
          href="/api/template"
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-brand-dark)] shadow-sm transition hover:bg-[var(--color-brand-soft)]"
        >
          <Download size={16} /> Télécharger le modèle (.xlsx)
        </a>
      </div>

      {/* Étape 2 : import */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand-dark)] text-sm font-bold">2</span>
          <h3 className="font-semibold text-[var(--color-ink)]">Importer votre fichier</h3>
        </div>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          L'import <strong>remplace toutes les données</strong> de la démo par le contenu du fichier. L'affichage reflètera alors directement votre classeur.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink)] shadow-sm hover:bg-slate-50"
          >
            <FileSpreadsheet size={16} /> {file ? file.name : "Choisir un fichier .xlsx"}
          </button>
          <button
            type="button"
            disabled={!file || busy}
            onClick={handleImport}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-brand-dark)] disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {busy ? "Import en cours…" : "Importer et remplacer les données"}
          </button>
        </div>

        {result && (
          <div className={`mt-4 rounded-lg border p-4 ${result.ok ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
            {result.ok ? (
              <>
                <p className="flex items-center gap-2 font-semibold text-emerald-900">
                  <CheckCircle2 size={18} /> Import réussi — {(result.agencies ?? []).length} agence(s) : {(result.agencies ?? []).join(", ")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(result.counts ?? {}).map(([k, v]) => (
                    <span key={k} className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                      {k} : {v}
                    </span>
                  ))}
                </div>
                {result.warnings && result.warnings.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-amber-700">
                    {result.warnings.map((w, i) => (
                      <li key={i} className="flex items-start gap-1.5"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> {w}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-sm text-emerald-800">Redirection vers le tableau de bord…</p>
              </>
            ) : (
              <p className="flex items-center gap-2 font-semibold text-rose-800">
                <AlertTriangle size={18} /> {result.error ?? "Échec de l'import."}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
