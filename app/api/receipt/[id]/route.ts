import { eq } from "drizzle-orm";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { db, ensureSchema } from "@/lib/db/client";
import { agencies, contacts, leases, properties } from "@/lib/db/schema";
import { generateReceipt } from "@/lib/services/pdf.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSchema();
  const { id } = await params;
  const url = new URL(request.url);
  const period = url.searchParams.get("period") ?? format(new Date(), "yyyy-MM");

  const lease = (await db.select().from(leases).where(eq(leases.id, id)))[0];
  if (!lease) return new Response("Bail introuvable", { status: 404 });

  const prop = (await db.select().from(properties).where(eq(properties.id, lease.propertyId)))[0];
  const tenant = (await db.select().from(contacts).where(eq(contacts.id, lease.tenantId)))[0];
  const agency = (await db.select().from(agencies).where(eq(agencies.id, lease.agencyId)))[0];

  const periodDate = parse(period, "yyyy-MM", new Date());
  const issued = new Date(periodDate.getFullYear(), periodDate.getMonth(), lease.rentDueDay);

  const pdf = await generateReceipt({
    agencyName: agency?.name ?? "Agence",
    ownerName: agency?.name ?? "Le bailleur",
    tenantName: tenant ? `${tenant.firstName} ${tenant.lastName}` : "Le locataire",
    propertyTitle: prop?.title ?? "Bien loué",
    propertyAddress: prop ? `${prop.city ?? ""}${prop.zone ? ` — ${prop.zone}` : ""}` : "",
    periodLabel: format(periodDate, "MMMM yyyy", { locale: fr }),
    monthlyRent: lease.monthlyRent,
    charges: lease.charges,
    issuedOn: format(issued, "d MMMM yyyy", { locale: fr }),
    city: prop?.city ?? agency?.city ?? "",
  });

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="quittance-${period}.pdf"`,
    },
  });
}
