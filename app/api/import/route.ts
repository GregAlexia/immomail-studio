import { importWorkbook } from "@/lib/excel-io";
import { isPresenter } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    if (!(await isPresenter())) {
      return Response.json(
        { ok: false, error: "Import verrouillé : déverrouillez le mode présentateur (menu Paramétrage)." },
        { status: 401 }
      );
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "Aucun fichier reçu." }, { status: 400 });
    }
    if (!/\.xlsx$/i.test(file.name)) {
      return Response.json({ ok: false, error: "Format attendu : .xlsx" }, { status: 400 });
    }
    // Garde-fou mémoire/timeout : un classeur de démo pèse quelques dizaines
    // de Ko — 5 Mo laissent une marge très large.
    const MAX_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return Response.json(
        { ok: false, error: `Fichier trop volumineux (${Math.round(file.size / 1024 / 1024)} Mo) — maximum 5 Mo.` },
        { status: 413 }
      );
    }
    const buf = await file.arrayBuffer();
    const result = await importWorkbook(buf);
    return Response.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur d'import inconnue";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
