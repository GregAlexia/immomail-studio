import { importWorkbook } from "@/lib/excel-io";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "Aucun fichier reçu." }, { status: 400 });
    }
    if (!/\.xlsx$/i.test(file.name)) {
      return Response.json({ ok: false, error: "Format attendu : .xlsx" }, { status: 400 });
    }
    const buf = await file.arrayBuffer();
    const result = await importWorkbook(buf);
    return Response.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur d'import inconnue";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
