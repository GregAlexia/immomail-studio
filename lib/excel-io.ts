import "server-only";
import ExcelJS from "exceljs";
import { format, parse as parseDateFns, isValid } from "date-fns";
import { db, ensureSchema, client } from "./db/client";
import { TABLE_NAMES } from "./db/ddl";
import * as S from "./db/schema";

// ============================================================================
// Onglets attendus dans le classeur Excel
// ============================================================================
export const TABS = {
  agencies: "Agences",
  params: "Paramètres",
  properties: "Stock de biens",
  buyers: "Acheteurs",
  inbox: "Boîte de réception",
  leads: "Leads qualifiés",
  appointments: "Rendez-vous",
  visits: "Suivi des visites",
  mandates: "Mandats",
  leases: "Baux",
  compliance: "Conformité",
  transactions: "Transactions",
  segments: "Segments newsletter",
};

const uid = () => crypto.randomUUID();
const norm = (s: unknown): string =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

// ---- enums FR -> interne ----
const M_TYPE: Record<string, string> = { appartement: "apartment", maison: "house", studio: "studio", terrain: "land", "local commercial": "commercial" };
const M_TRANSAC: Record<string, string> = { vente: "sale", location: "rental" };
const M_PSTATUS: Record<string, string> = { disponible: "available", "sous compromis": "under_offer", vendu: "sold", loue: "rented" };
const M_REQ: Record<string, string> = { "achat - visite": "purchase", achat: "purchase", "achat-visite": "purchase", location: "rental", estimation: "valuation" };
const M_PRIO: Record<string, string> = { haute: "haute", moyenne: "moyenne", basse: "basse" };
const M_SOURCE: Record<string, string> = { seloger: "seloger", leboncoin: "leboncoin", "bien'ici": "bienici", bienici: "bienici", "bien ici": "bienici", "formulaire site": "site", site: "site", "email direct": "autre", autre: "autre", spam: "spam" };
const M_APPTTYPE: Record<string, string> = { visite: "visite", "estimation a domicile": "estimation", estimation: "estimation" };
const M_APPTSTATUS: Record<string, string> = { confirme: "confirmed", "en attente confirmation": "requested", "en attente": "requested", demande: "requested", effectue: "done", annule: "cancelled" };
const M_MANDATE: Record<string, string> = { exclusif: "exclusive", simple: "simple" };
const M_COMP: Record<string, string> = { dpe: "dpe", "assurance pno": "pno_insurance", pno: "pno_insurance", "renouvellement bail": "lease_renewal", "renouvellement de bail": "lease_renewal", autre: "other" };

const mapEnum = (v: unknown, m: Record<string, string>, fallback = ""): string => m[norm(v)] ?? fallback;

// ---- reverse (interne -> FR) pour l'export ----
const rev = (m: Record<string, string>) => Object.fromEntries(Object.entries(m).map(([k, val]) => [val, k]));
const R_TYPE = rev(M_TYPE), R_TRANSAC = rev(M_TRANSAC), R_PSTATUS = rev(M_PSTATUS),
  R_REQ: Record<string, string> = { purchase: "Achat - visite", rental: "Location", valuation: "Estimation" },
  R_SOURCE: Record<string, string> = { seloger: "SeLoger", leboncoin: "Leboncoin", bienici: "Bien'ici", site: "Formulaire site", autre: "Email direct", spam: "Spam" },
  R_APPTTYPE: Record<string, string> = { visite: "Visite", estimation: "Estimation à domicile" },
  R_APPTSTATUS: Record<string, string> = { confirmed: "Confirmé", requested: "En attente confirmation", reminded: "Confirmé", done: "Effectué", no_show: "No-show", cancelled: "Annulé" },
  R_MANDATE: Record<string, string> = { exclusive: "Exclusif", simple: "Simple" },
  R_COMP: Record<string, string> = { dpe: "DPE", pno_insurance: "Assurance PNO", lease_renewal: "Renouvellement de bail", other: "Autre" };

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ============================================================================
// Dates (ISO "local-naïf")
// ============================================================================
const stampOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;

function cellVal(v: unknown): unknown {
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("text" in o) return o.text;
    if ("result" in o) return o.result;
    if ("richText" in o && Array.isArray(o.richText)) return (o.richText as { text: string }[]).map((r) => r.text).join("");
  }
  return v;
}

function parseStamp(v: unknown, fallbackYear = 2026): string | null {
  const raw = cellVal(v);
  if (raw == null || String(raw).trim() === "") return null;
  if (raw instanceof Date) {
    const d = raw;
    return stampOf(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()));
  }
  const s = String(raw).trim();
  for (const fmt of ["dd/MM/yyyy HH:mm", "dd/MM/yyyy", "yyyy-MM-dd'T'HH:mm:ss", "yyyy-MM-dd HH:mm", "yyyy-MM-dd"]) {
    const d = parseDateFns(s, fmt, new Date(fallbackYear, 0, 1));
    if (isValid(d)) return stampOf(d);
  }
  const m = s.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) {
    const [, dd, mm, yy, hh, mi] = m;
    const d = new Date(yy ? +yy : fallbackYear, +mm - 1, +dd, hh ? +hh : 9, mi ? +mi : 0);
    if (isValid(d)) return stampOf(d);
  }
  return null;
}

const dayOf = (iso: string | null) => (iso ? iso.slice(0, 10) : null);
const str = (v: unknown): string => String(cellVal(v) ?? "").trim();
const numOf = (v: unknown): number => {
  const s = str(v).replace(/[^\d.,-]/g, "").replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

function sheetRows(ws: ExcelJS.Worksheet | undefined): Record<string, unknown>[] {
  if (!ws) return [];
  const headerRow = ws.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell, col) => { headers[col] = norm(cellVal(cell.value)); });
  const out: Record<string, unknown>[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const obj: Record<string, unknown> = {};
    let any = false;
    row.eachCell((cell, col) => {
      const h = headers[col];
      if (!h) return;
      const val = cellVal(cell.value);
      obj[h] = val;
      if (val != null && String(val).trim() !== "") any = true;
    });
    if (any) out.push(obj);
  });
  return out;
}

const pick = (o: Record<string, unknown>, ...cands: string[]): unknown => {
  for (const c of cands) if (c in o && String(o[c] ?? "").trim() !== "") return o[c];
  for (const c of cands) {
    const k = Object.keys(o).find((key) => key.includes(c));
    if (k && String(o[k] ?? "").trim() !== "") return o[k];
  }
  return undefined;
};

function getSheet(wb: ExcelJS.Workbook, name: string): ExcelJS.Worksheet | undefined {
  const target = norm(name);
  return (
    wb.worksheets.find((w) => norm(w.name) === target) ??
    wb.worksheets.find((w) => norm(w.name).includes(target.split(" ")[0]))
  );
}

// ============================================================================
// IMPORT (multi-agences)
// ============================================================================
export interface ImportResult {
  ok: boolean;
  agencies: string[];
  counts: Record<string, number>;
  warnings: string[];
}

export async function importWorkbook(buffer: ArrayBuffer): Promise<ImportResult> {
  await ensureSchema();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const warnings: string[] = [];
  const createdAt = stampOf(new Date());

  // ---- Paramètres globaux ----
  const params: Record<string, string> = {};
  for (const r of sheetRows(getSheet(wb, TABS.params))) {
    const k = norm(pick(r, "cle", "clé", "parametre", "paramètre", "champ"));
    const v = str(pick(r, "valeur", "value"));
    if (k) params[k] = v;
  }
  const initialStamp = parseStamp(params["date de demo"] || params["date de démo"] || params["date demo"]) || "2026-06-23T14:00:00";
  const fbYear = +initialStamp.slice(0, 4);

  // ---- Agences ----
  const agencyRows: (typeof S.agencies.$inferInsert)[] = [];
  const agencyByName = new Map<string, string>(); // nom normalisé -> id
  const ensureAgency = (name: string, city = ""): string => {
    const key = norm(name);
    const found = agencyByName.get(key);
    if (found) return found;
    const id = uid();
    agencyRows.push({ id, name: name.trim() || "Agence", city: city || null, logoUrl: null, createdAt });
    agencyByName.set(key, id);
    return id;
  };
  for (const r of sheetRows(getSheet(wb, TABS.agencies))) {
    const name = str(pick(r, "nom agence", "agence", "nom"));
    if (name) ensureAgency(name, str(pick(r, "ville")));
  }
  // Compatibilité : pas d'onglet Agences -> agence unique depuis Paramètres
  if (agencyRows.length === 0) {
    ensureAgency(str(params["nom agence"] || params["agence"] || params["nom"]) || "Agence importée", str(params["ville"]));
  }
  const defaultAgencyId = agencyRows[0].id;
  const unmatched = new Set<string>();
  const resolveAgency = (row: Record<string, unknown>): string => {
    const raw = str(pick(row, "agence", "agency"));
    if (!raw) return defaultAgencyId;
    const id = agencyByName.get(norm(raw));
    if (id) return id;
    // agence citée mais absente de l'onglet Agences : on la crée à la volée
    if (!unmatched.has(norm(raw))) unmatched.add(norm(raw));
    return ensureAgency(raw);
  };

  // ---- Contacts (dédup par agence + email) ----
  const contactByKey = new Map<string, string>();
  const contactRows: (typeof S.contacts.$inferInsert)[] = [];
  function contact(agencyId: string, name: string, email: string, role: string, phone?: string, criteria?: object): string {
    const key = `${agencyId}|${email ? email.toLowerCase() : `name:${name.toLowerCase()}:${role}`}`;
    const found = contactByKey.get(key);
    if (found) return found;
    const id = uid();
    const parts = name.trim().split(" ");
    contactRows.push({
      id, agencyId, firstName: parts[0] || name || "Contact", lastName: parts.slice(1).join(" ") || "—",
      email: email || null, phone: phone || null, role, buyerCriteria: criteria ? JSON.stringify(criteria) : null,
      consentMarketing: true, createdAt,
    });
    contactByKey.set(key, id);
    return id;
  }

  // ---- Stock de biens (réfs résolues par agence) ----
  type PropInfo = { id: string; type: string; price: number; rooms: number | null; zone: string | null; transaction: string; negotiator: string };
  const propByAgencyRef = new Map<string, PropInfo>(); // `${agencyId}|REF` -> info
  const getProp = (agencyId: string, ref: string) => (ref ? propByAgencyRef.get(`${agencyId}|${ref.toUpperCase()}`) : undefined);
  const propertyRows: (typeof S.properties.$inferInsert)[] = [];
  for (const r of sheetRows(getSheet(wb, TABS.properties))) {
    const ref = str(pick(r, "ref bien", "reference", "ref"));
    if (!ref) continue;
    const agencyId = resolveAgency(r);
    const id = uid();
    const type = mapEnum(pick(r, "type"), M_TYPE, "apartment");
    const transaction = mapEnum(pick(r, "transaction"), M_TRANSAC, "sale");
    const price = numOf(pick(r, "prix (€ / loyer €/mois)", "prix", "loyer"));
    const surface = Math.round(numOf(pick(r, "surface (m²)", "surface"))) || null;
    const rooms = Math.round(numOf(pick(r, "pieces", "pièces"))) || null;
    const cityZone = str(pick(r, "ville / secteur", "ville/secteur", "ville", "secteur"));
    const negotiator = str(pick(r, "negociateur", "négociateur"));
    const status = mapEnum(pick(r, "statut"), M_PSTATUS, "available");
    const title = str(pick(r, "titre", "intitule")) || `${titleCase(R_TYPE[type] ?? type)} ${cityZone}`.trim();
    propertyRows.push({ id, agencyId, ref, title, type, transaction, price, surface, rooms, city: cityZone || null, zone: cityZone || null, negotiator: negotiator || null, status, createdAt });
    propByAgencyRef.set(`${agencyId}|${ref.toUpperCase()}`, { id, type, price, rooms, zone: cityZone || null, transaction, negotiator });
  }

  // ---- Acheteurs (contacts avec critères, pour la newsletter A6) ----
  for (const r of sheetRows(getSheet(wb, TABS.buyers))) {
    const agencyId = resolveAgency(r);
    const name = str(pick(r, "nom"));
    const email = str(pick(r, "email"));
    if (!name && !email) continue;
    const transaction = mapEnum(pick(r, "transaction recherchee", "transaction recherchée", "transaction"), M_TRANSAC, "");
    const zones = str(pick(r, "zones")).split(/[;,]/).map((z) => z.trim()).filter(Boolean);
    const criteria = {
      transaction: transaction || undefined,
      type: mapEnum(pick(r, "type recherche", "type recherché", "type bien", "type"), M_TYPE, "") || undefined,
      budgetMax: numOf(pick(r, "budget max", "budget")) || undefined,
      zones,
      minRooms: Math.round(numOf(pick(r, "pieces min", "pièces min", "min pieces"))) || undefined,
    };
    contact(agencyId, name, email, transaction === "rental" ? "tenant" : "buyer", str(pick(r, "telephone", "téléphone")) || undefined, criteria);
  }

  // ---- Boîte de réception (id pré-attribués, clés par agence) ----
  const inboxByKey = new Map<string, { id: string; receivedAt: string }>(); // `${agencyId}|EXT`
  const inboxParsed = sheetRows(getSheet(wb, TABS.inbox)).map((r) => {
    const agencyId = resolveAgency(r);
    const ext = str(pick(r, "id email", "id"));
    const id = uid();
    const receivedAt = parseStamp(pick(r, "date reception", "date réception", "date"), fbYear) || initialStamp;
    if (ext) inboxByKey.set(`${agencyId}|${ext.toUpperCase()}`, { id, receivedAt });
    return {
      id, agencyId, ext, receivedAt,
      senderName: str(pick(r, "expediteur", "expéditeur", "nom")),
      senderEmail: str(pick(r, "email expediteur", "email expéditeur", "email")),
      subject: str(pick(r, "objet du mail", "objet", "sujet")),
      source: mapEnum(pick(r, "portail source", "portail", "source"), M_SOURCE, "autre"),
      ref: str(pick(r, "ref bien citee", "ref bien citée", "ref bien", "ref")).toUpperCase(),
      body: str(pick(r, "extrait du corps du message", "extrait du corps", "extrait", "corps", "message")),
    };
  });

  // ---- Leads ----
  const leadRows: (typeof S.leads.$inferInsert)[] = [];
  for (const r of sheetRows(getSheet(wb, TABS.leads))) {
    const agencyId = resolveAgency(r);
    const id = uid();
    const extEmail = str(pick(r, "id email source", "id email", "email source")).toUpperCase();
    const ref = str(pick(r, "ref bien", "ref")).toUpperCase();
    const prop = getProp(agencyId, ref);
    const name = str(pick(r, "nom"));
    const email = str(pick(r, "email"));
    const phoneRaw = str(pick(r, "telephone", "téléphone"));
    const phone = /non communiqu/i.test(phoneRaw) ? null : phoneRaw || null;
    const requestType = mapEnum(pick(r, "type de demande", "demande"), M_REQ, "purchase");
    const assignedTo = str(pick(r, "negociateur assigne", "négociateur assigné", "negociateur")) || prop?.negotiator || "Accueil agence";
    const priority = mapEnum(pick(r, "priorite", "priorité"), M_PRIO, "moyenne");
    const respRaw = str(pick(r, "reponse auto envoyee", "réponse auto envoyée", "reponse auto"));
    const inboxRef = extEmail ? inboxByKey.get(`${agencyId}|${extEmail}`) : undefined;
    const firstResponseAt = /oui|^\d|:/i.test(respRaw) ? (parseStamp(respRaw, fbYear) ?? inboxRef?.receivedAt ?? null) : null;
    const role = requestType === "rental" ? "tenant" : requestType === "valuation" ? "owner" : "buyer";
    const contactId = contact(agencyId, name, email, role, phone ?? undefined, prop ? { transaction: prop.transaction, type: prop.type, budgetMax: prop.price, zones: prop.zone ? [prop.zone] : [], minRooms: prop.rooms ?? undefined } : undefined);
    leadRows.push({
      id, agencyId, externalId: str(pick(r, "id lead", "id")) || null, contactId,
      propertyId: prop?.id ?? null, sourceEmailId: inboxRef?.id ?? null,
      name: name || null, email: email || null, phone, assignedTo, requestType, priority,
      firstResponseAt, status: firstResponseAt ? "contacted" : "new", createdAt,
    });
  }

  // ---- Emails : statut + lien lead ----
  const leadByEmailId = new Map(leadRows.filter((l) => l.sourceEmailId).map((l) => [l.sourceEmailId as string, l]));
  const inboxInsert: (typeof S.inboxEmails.$inferInsert)[] = inboxParsed.map((e) => {
    const lead = e.ext ? leadByEmailId.get(e.id) : undefined;
    let status = "non_traite";
    let isSpam = false;
    if (e.source === "spam") { status = "spam"; isSpam = true; }
    else if (lead) status = "qualifie";
    return {
      id: e.id, agencyId: e.agencyId, externalId: e.ext || null, source: e.source, senderName: e.senderName || null,
      senderEmail: e.senderEmail || null, rawSubject: e.subject || null, rawBody: e.body || null,
      receivedAt: e.receivedAt, isSpam, parsedPropertyRef: e.ref || null,
      requestType: lead?.requestType ?? null, leadId: lead?.id ?? null, status, createdAt,
    };
  });

  // ---- Rendez-vous + suivi des visites ----
  const apptRows: (typeof S.appointments.$inferInsert)[] = [];
  for (const r of sheetRows(getSheet(wb, TABS.appointments))) {
    const agencyId = resolveAgency(r);
    const ref = str(pick(r, "ref bien", "ref")).toUpperCase();
    apptRows.push({
      id: uid(), agencyId, propertyId: getProp(agencyId, ref)?.id ?? null,
      contactId: null, contactName: str(pick(r, "contact", "nom")) || "Contact",
      contactEmail: str(pick(r, "email")) || null, contactPhone: str(pick(r, "telephone", "téléphone")) || null,
      type: mapEnum(pick(r, "type de rdv", "type"), M_APPTTYPE, "visite"),
      scheduledAt: parseStamp(pick(r, "date / heure", "date/heure", "date", "date visite"), fbYear) || initialStamp,
      status: mapEnum(pick(r, "statut"), M_APPTSTATUS, "confirmed"),
      confirmationSentAt: null, reminderJ1SentAt: null, reminderH2SentAt: null, createdAt,
    });
  }
  for (const r of sheetRows(getSheet(wb, TABS.visits))) {
    const agencyId = resolveAgency(r);
    const ref = str(pick(r, "ref bien", "ref")).toUpperCase();
    const when = parseStamp(pick(r, "date visite", "date"), fbYear);
    if (!when) continue;
    apptRows.push({
      id: uid(), agencyId, propertyId: getProp(agencyId, ref)?.id ?? null, contactId: null,
      contactName: str(pick(r, "contact", "nom")) || "Contact", contactEmail: str(pick(r, "email")) || null,
      contactPhone: null, type: "visite", scheduledAt: when, status: "done",
      confirmationSentAt: when, reminderJ1SentAt: when, reminderH2SentAt: null, createdAt,
    });
  }

  // ---- Mandats ----
  const mandateRows: (typeof S.mandates.$inferInsert)[] = [];
  for (const r of sheetRows(getSheet(wb, TABS.mandates))) {
    const agencyId = resolveAgency(r);
    const ref = str(pick(r, "ref bien", "ref")).toUpperCase();
    const prop = getProp(agencyId, ref);
    if (!prop) { if (ref) warnings.push(`Mandat ignoré : bien ${ref} introuvable.`); continue; }
    mandateRows.push({
      id: uid(), agencyId, propertyId: prop.id,
      ownerId: contact(agencyId, str(pick(r, "proprietaire", "propriétaire", "nom")), str(pick(r, "email proprietaire", "email propriétaire", "email")), "owner"),
      type: mapEnum(pick(r, "type"), M_MANDATE, "simple"),
      startDate: dayOf(parseStamp(pick(r, "date debut", "date début", "debut"), fbYear)) || dayOf(initialStamp)!,
      endDate: dayOf(parseStamp(pick(r, "date echeance", "date échéance", "echeance", "fin"), fbYear)) || dayOf(initialStamp)!,
      status: "active", createdAt,
    });
  }

  // ---- Baux ----
  const leaseRows: (typeof S.leases.$inferInsert)[] = [];
  for (const r of sheetRows(getSheet(wb, TABS.leases))) {
    const agencyId = resolveAgency(r);
    const ref = str(pick(r, "ref bien", "ref")).toUpperCase();
    const prop = getProp(agencyId, ref);
    if (!prop) { if (ref) warnings.push(`Bail ignoré : bien ${ref} introuvable.`); continue; }
    leaseRows.push({
      id: uid(), agencyId, propertyId: prop.id,
      tenantId: contact(agencyId, str(pick(r, "locataire", "nom")), str(pick(r, "email locataire", "email")), "tenant"),
      monthlyRent: numOf(pick(r, "loyer")), charges: numOf(pick(r, "charges")),
      startDate: dayOf(parseStamp(pick(r, "date debut", "date début", "debut"), fbYear)) || dayOf(initialStamp)!,
      endDate: null, rentDueDay: Math.min(28, Math.max(1, Math.round(numOf(pick(r, "jour echeance loyer", "jour échéance loyer", "jour"))) || 5)),
      createdAt,
    });
  }

  // ---- Conformité ----
  const compRows: (typeof S.complianceItems.$inferInsert)[] = [];
  for (const r of sheetRows(getSheet(wb, TABS.compliance))) {
    const agencyId = resolveAgency(r);
    const ref = str(pick(r, "ref bien", "ref")).toUpperCase();
    const prop = getProp(agencyId, ref);
    if (!prop) { if (ref) warnings.push(`Conformité ignorée : bien ${ref} introuvable.`); continue; }
    compRows.push({
      id: uid(), agencyId, propertyId: prop.id, type: mapEnum(pick(r, "type"), M_COMP, "other"),
      label: str(pick(r, "libelle", "libellé", "label")) || "Échéance",
      dueDate: dayOf(parseStamp(pick(r, "date echeance", "date échéance", "echeance"), fbYear)) || dayOf(initialStamp)!,
      reminderDaysBefore: Math.round(numOf(pick(r, "rappel (jours avant)", "rappel jours avant", "rappel", "jours avant"))) || 30,
      status: "pending", createdAt,
    });
  }

  // ---- Transactions ----
  const txRows: (typeof S.transactions.$inferInsert)[] = [];
  for (const r of sheetRows(getSheet(wb, TABS.transactions))) {
    const agencyId = resolveAgency(r);
    const ref = str(pick(r, "ref bien", "ref")).toUpperCase();
    const prop = getProp(agencyId, ref);
    if (!prop) { if (ref) warnings.push(`Transaction ignorée : bien ${ref} introuvable.`); continue; }
    txRows.push({
      id: uid(), agencyId, propertyId: prop.id,
      contactId: contact(agencyId, str(pick(r, "client", "nom")), str(pick(r, "email client", "email")), "buyer"),
      type: mapEnum(pick(r, "type"), M_TRANSAC, "sale"),
      signedDate: dayOf(parseStamp(pick(r, "date signature", "signature", "date"), fbYear)) || dayOf(initialStamp)!,
      reviewRequestedAt: null, reviewFollowupAt: null, reviewCompletedAt: null, referralRequestedAt: null, createdAt,
    });
  }

  // ---- Segments ----
  const segRows: (typeof S.newsletterSegments.$inferInsert)[] = [];
  for (const r of sheetRows(getSheet(wb, TABS.segments))) {
    const agencyId = resolveAgency(r);
    const name = str(pick(r, "nom segment", "nom", "segment"));
    if (!name) continue;
    const zones = str(pick(r, "zones")).split(/[;,]/).map((z) => z.trim()).filter(Boolean);
    segRows.push({
      id: uid(), agencyId, name,
      criteria: JSON.stringify({
        transaction: mapEnum(pick(r, "transaction"), M_TRANSAC, "") || undefined,
        type: mapEnum(pick(r, "type bien", "type"), M_TYPE, "") || undefined,
        budgetMax: numOf(pick(r, "budget max", "budget")) || undefined,
        zones,
      }),
      createdAt,
    });
  }

  if (unmatched.size > 0) warnings.push(`Agence(s) citée(s) mais absente(s) de l'onglet « Agences », créée(s) automatiquement : ${[...unmatched].join(", ")}.`);

  // ---- Écriture ----
  for (const t of TABLE_NAMES) await client.unsafe(`DELETE FROM ${t}`);
  await db.insert(S.agencies).values(agencyRows);
  if (contactRows.length) await db.insert(S.contacts).values(contactRows);
  if (propertyRows.length) await db.insert(S.properties).values(propertyRows);
  if (mandateRows.length) await db.insert(S.mandates).values(mandateRows);
  if (leaseRows.length) await db.insert(S.leases).values(leaseRows);
  if (compRows.length) await db.insert(S.complianceItems).values(compRows);
  if (txRows.length) await db.insert(S.transactions).values(txRows);
  if (segRows.length) await db.insert(S.newsletterSegments).values(segRows);
  if (apptRows.length) await db.insert(S.appointments).values(apptRows);
  if (leadRows.length) await db.insert(S.leads).values(leadRows);
  if (inboxInsert.length) await db.insert(S.inboxEmails).values(inboxInsert);
  await db.insert(S.demoClock).values({ id: "global", currentDate: initialStamp, initialDate: initialStamp, createdAt });

  return {
    ok: true, agencies: agencyRows.map((a) => a.name), warnings,
    counts: {
      Agences: agencyRows.length, Biens: propertyRows.length, Contacts: contactRows.length,
      Acheteurs: contactRows.filter((c) => c.buyerCriteria).length, "Emails reçus": inboxInsert.length,
      Leads: leadRows.length, "Rendez-vous": apptRows.length, Mandats: mandateRows.length,
      Baux: leaseRows.length, Conformité: compRows.length, Transactions: txRows.length, Segments: segRows.length,
    },
  };
}

// ============================================================================
// EXPORT (toutes les agences) — sert aussi de modèle éditable
// ============================================================================
const fmtDT = (iso?: string | null) => (iso ? format(new Date(iso), "dd/MM/yyyy HH:mm") : "");
const fmtD = (iso?: string | null) => (iso ? format(new Date(iso), "dd/MM/yyyy") : "");

export async function buildWorkbook(): Promise<ArrayBuffer> {
  await ensureSchema();
  const wb = new ExcelJS.Workbook();
  wb.creator = "ImmoMail Studio";

  const agencies = await db.select().from(S.agencies);
  const clock = (await db.select().from(S.demoClock))[0];
  const props = await db.select().from(S.properties);
  const contacts = await db.select().from(S.contacts);
  const inbox = await db.select().from(S.inboxEmails);
  const leads = await db.select().from(S.leads);
  const appts = await db.select().from(S.appointments);
  const mandates = await db.select().from(S.mandates);
  const leases = await db.select().from(S.leases);
  const compliance = await db.select().from(S.complianceItems);
  const txs = await db.select().from(S.transactions);
  const segments = await db.select().from(S.newsletterSegments);

  const agencyName = new Map(agencies.map((a) => [a.id, a.name]));
  const propById = new Map(props.map((p) => [p.id, p]));
  const cById = new Map(contacts.map((c) => [c.id, c]));
  const eById = new Map(inbox.map((e) => [e.id, e]));
  const AG = (id: string) => agencyName.get(id) ?? "";
  const fullName = (id?: string | null) => { const c = id ? cById.get(id) : null; return c ? `${c.firstName} ${c.lastName}` : ""; };
  const refOf = (id?: string | null) => (id ? propById.get(id)?.ref ?? "" : "");

  const sheet = (name: string, headers: string[], rows: (string | number)[][]) => {
    const ws = wb.addWorksheet(name);
    ws.addRow(headers);
    ws.getRow(1).font = { bold: true };
    rows.forEach((r) => ws.addRow(r));
    ws.columns.forEach((c) => { c.width = 20; });
  };

  sheet(TABS.agencies, ["Nom agence", "Ville"], agencies.map((a) => [a.name, a.city ?? ""]));
  sheet(TABS.params, ["Clé", "Valeur"], [["Date de démo", fmtDT(clock?.initialDate)]]);

  sheet(TABS.properties, ["Agence", "Réf bien", "Type", "Transaction", "Ville / Secteur", "Prix (€ / loyer €/mois)", "Surface (m²)", "Pièces", "Négociateur", "Statut"],
    props.map((p) => [AG(p.agencyId), p.ref ?? "", R_TYPE[p.type] ?? p.type, R_TRANSAC[p.transaction] ?? p.transaction, p.zone ?? p.city ?? "", p.price, p.surface ?? "", p.rooms ?? "", p.negotiator ?? "", R_PSTATUS[p.status] ?? p.status]));

  sheet(TABS.buyers, ["Agence", "Nom", "Email", "Téléphone", "Transaction recherchée", "Type recherché", "Budget max", "Zones"],
    contacts.filter((c) => c.buyerCriteria).map((c) => {
      const bc = JSON.parse(c.buyerCriteria as string);
      return [AG(c.agencyId), `${c.firstName} ${c.lastName}`, c.email ?? "", c.phone ?? "", bc.transaction ? R_TRANSAC[bc.transaction] ?? "" : "", bc.type ? R_TYPE[bc.type] ?? "" : "", bc.budgetMax ?? "", (bc.zones ?? []).join("; ")];
    }));

  sheet(TABS.inbox, ["Agence", "ID Email", "Date réception", "Expéditeur", "Email expéditeur", "Objet du mail", "Portail source", "Réf bien citée", "Extrait du corps du message", "Statut traitement"],
    inbox.map((e) => [AG(e.agencyId), e.externalId ?? "", fmtDT(e.receivedAt), e.senderName ?? "", e.senderEmail ?? "", e.rawSubject ?? "", R_SOURCE[e.source] ?? e.source, e.parsedPropertyRef ?? "", e.rawBody ?? "", e.isSpam ? "Spam" : e.status === "qualifie" ? "Qualifié" : "Non traité"]));

  sheet(TABS.leads, ["Agence", "ID Lead", "ID Email source", "Nom", "Email", "Téléphone", "Type de demande", "Réf bien", "Négociateur assigné", "Priorité", "Réponse auto envoyée", "Statut CRM"],
    leads.map((l) => [AG(l.agencyId), l.externalId ?? "", l.sourceEmailId ? eById.get(l.sourceEmailId)?.externalId ?? "" : "", l.name ?? "", l.email ?? "", l.phone ?? "Non communiqué", R_REQ[l.requestType ?? "purchase"] ?? "", refOf(l.propertyId), l.assignedTo ?? "", titleCase(l.priority ?? "moyenne"), l.firstResponseAt ? `Oui - ${fmtDT(l.firstResponseAt)}` : "Non", l.status === "contacted" ? "Nouveau" : titleCase(l.status)]));

  sheet(TABS.appointments, ["Agence", "Contact", "Email", "Type de RDV", "Réf bien", "Date / heure", "Lien réservation envoyé", "Rappel J-1 envoyé", "Statut"],
    appts.filter((a) => a.status !== "done").map((a) => [AG(a.agencyId), a.contactName ?? "", a.contactEmail ?? "", R_APPTTYPE[a.type] ?? a.type, refOf(a.propertyId), fmtDT(a.scheduledAt), a.confirmationSentAt ? "Oui" : "", a.reminderJ1SentAt ? "Oui" : "", R_APPTSTATUS[a.status] ?? a.status]));

  sheet(TABS.visits, ["Agence", "Contact", "Email", "Réf bien", "Date visite", "Retour client", "Prochaine action"],
    appts.filter((a) => a.status === "done").map((a) => [AG(a.agencyId), a.contactName ?? "", a.contactEmail ?? "", refOf(a.propertyId), fmtD(a.scheduledAt), "", ""]));

  sheet(TABS.mandates, ["Agence", "Réf bien", "Propriétaire", "Email propriétaire", "Type", "Date début", "Date échéance", "Statut"],
    mandates.map((m) => [AG(m.agencyId), refOf(m.propertyId), fullName(m.ownerId), cById.get(m.ownerId)?.email ?? "", R_MANDATE[m.type] ?? m.type, fmtD(m.startDate), fmtD(m.endDate), titleCase(m.status)]));

  sheet(TABS.leases, ["Agence", "Réf bien", "Locataire", "Email locataire", "Loyer", "Charges", "Date début", "Jour échéance loyer"],
    leases.map((l) => [AG(l.agencyId), refOf(l.propertyId), fullName(l.tenantId), cById.get(l.tenantId)?.email ?? "", l.monthlyRent, l.charges, fmtD(l.startDate), l.rentDueDay]));

  sheet(TABS.compliance, ["Agence", "Réf bien", "Type", "Libellé", "Date échéance", "Rappel (jours avant)", "Statut"],
    compliance.map((c) => [AG(c.agencyId), refOf(c.propertyId), R_COMP[c.type] ?? c.type, c.label, fmtD(c.dueDate), c.reminderDaysBefore, titleCase(c.status)]));

  sheet(TABS.transactions, ["Agence", "Réf bien", "Client", "Email client", "Type", "Date signature"],
    txs.map((t) => [AG(t.agencyId), refOf(t.propertyId), fullName(t.contactId), cById.get(t.contactId)?.email ?? "", R_TRANSAC[t.type] ?? t.type, fmtD(t.signedDate)]));

  sheet(TABS.segments, ["Agence", "Nom segment", "Transaction", "Type bien", "Budget max", "Zones"],
    segments.map((s) => {
      const c = s.criteria ? JSON.parse(s.criteria) : {};
      return [AG(s.agencyId), s.name, c.transaction ? R_TRANSAC[c.transaction] ?? "" : "", c.type ? R_TYPE[c.type] ?? "" : "", c.budgetMax ?? "", (c.zones ?? []).join("; ")];
    }));

  return wb.xlsx.writeBuffer();
}
