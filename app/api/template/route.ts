import { buildWorkbook } from "@/lib/excel-io";

export const dynamic = "force-dynamic";

export async function GET() {
  const buf = await buildWorkbook();
  return new Response(Buffer.from(buf as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="immomail-donnees.xlsx"`,
    },
  });
}
