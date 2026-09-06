/**
 * Seed scénarisé (§10 du PRD) — données 100 % fictives.
 *
 * Agence "Horizon Immobilier" (Lyon) = scénario complet, fidèle au classeur de
 * données de test (REF-001…007, emails EM-1001…1008). Agence "Artik"
 * (Charleville-Mézières) = second scénario complet sur un marché de province
 * (AM-001…302, emails AM-EM-1…8). Azur et Capitale, plus légères, démontrent
 * l'isolation multi-agences.
 *
 * Date de démo initiale : 23 juin 2026, 14 h. En avançant l'horloge de quelques
 * jours/semaines, chaque automatisation se déclenche au moins une fois.
 */
import { addDays } from "date-fns";
import { client, db, ensureSchema } from "./db/client";
import { TABLE_NAMES } from "./db/ddl";
import {
  agencies,
  appointments,
  complianceItems,
  contacts,
  demoClock,
  inboxEmails,
  leases,
  mandates,
  newsletterSegments,
  properties,
  transactions,
} from "./db/schema";

const uid = () => crypto.randomUUID();
const stamp = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}:00`;
const day = (d: Date) => stamp(d).slice(0, 10);

export const INITIAL_DEMO_DATE = new Date(2026, 5, 23, 14, 0, 0); // 23/06/2026 14:00

type Row = Record<string, unknown>;

export interface SeedCounts {
  agencies: number;
  properties: number;
  contacts: number;
  mandates: number;
  leases: number;
  transactions: number;
  appointments: number;
  inbox: number;
  compliance: number;
  initialDate: string;
}

export async function seedDatabase(): Promise<SeedCounts> {
  const INITIAL = INITIAL_DEMO_DATE;
  const at = (days: number, h = 9, m = 0) => {
    const x = addDays(INITIAL, days);
    x.setHours(h, m, 0, 0);
    return stamp(x);
  };
  const dDay = (days: number) => day(addDays(INITIAL, days));
  const createdAt = stamp(INITIAL);

  const C: Row[] = [];
  const P: Row[] = [];
  const M: Row[] = [];
  const L: Row[] = [];
  const CI: Row[] = [];
  const TX: Row[] = [];
  const NS: Row[] = [];
  const AP: Row[] = [];
  const IE: Row[] = [];

  const contact = (
    agencyId: string,
    firstName: string,
    lastName: string,
    role: string,
    opts: Partial<Row> = {}
  ): string => {
    const id = uid();
    C.push({
      id, agencyId, firstName, lastName,
      email: opts.email ?? null, phone: opts.phone ?? null, role,
      buyerCriteria: opts.buyerCriteria ?? null,
      consentMarketing: opts.consentMarketing ?? true, createdAt,
    });
    return id;
  };
  const property = (
    agencyId: string,
    r: Partial<Row> & { ref: string; title: string; type: string; transaction: string; price: number }
  ): string => {
    const id = uid();
    P.push({
      id, agencyId, ref: r.ref, title: r.title, type: r.type, transaction: r.transaction,
      price: r.price, surface: r.surface ?? null, rooms: r.rooms ?? null,
      city: r.city ?? null, zone: r.zone ?? null, negotiator: r.negotiator ?? null,
      status: r.status ?? "available", createdAt,
    });
    return id;
  };
  const crit = (o: object) => JSON.stringify(o);

  // ===================== AGENCE 1 — HORIZON (Lyon) =====================
  const A1 = uid();
  const horizon = { id: A1, name: "Agence Horizon Immobilier", city: "Lyon", logoUrl: null, createdAt };

  const p001 = property(A1, { ref: "REF-001", title: "T3 lumineux Lyon 6e", type: "apartment", transaction: "sale", price: 320000, surface: 65, rooms: 3, city: "Lyon", zone: "Lyon 6e", negotiator: "Marie Dupont", status: "available" });
  const p002 = property(A1, { ref: "REF-002", title: "Maison familiale Villeurbanne", type: "house", transaction: "sale", price: 485000, surface: 120, rooms: 5, city: "Villeurbanne", zone: "Villeurbanne", negotiator: "Karim Benali", status: "available" });
  const p003 = property(A1, { ref: "REF-003", title: "Studio Lyon 3e", type: "studio", transaction: "sale", price: 159000, surface: 28, rooms: 1, city: "Lyon", zone: "Lyon 3e", negotiator: "Marie Dupont", status: "under_offer" });
  property(A1, { ref: "REF-004", title: "T2 Lyon 7e", type: "apartment", transaction: "sale", price: 245000, surface: 52, rooms: 2, city: "Lyon", zone: "Lyon 7e", negotiator: "Sophie Martin", status: "available" });
  const p005 = property(A1, { ref: "REF-005", title: "Maison Caluire-et-Cuire", type: "house", transaction: "sale", price: 620000, surface: 145, rooms: 6, city: "Caluire-et-Cuire", zone: "Caluire-et-Cuire", negotiator: "Karim Benali", status: "available" });
  property(A1, { ref: "REF-006", title: "T2 Lyon 2e (location)", type: "apartment", transaction: "rental", price: 1150, surface: 45, rooms: 2, city: "Lyon", zone: "Lyon 2e", negotiator: "Sophie Martin", status: "available" });
  const p007 = property(A1, { ref: "REF-007", title: "Local commercial Lyon 1er", type: "commercial", transaction: "sale", price: 290000, surface: 80, rooms: 0, city: "Lyon", zone: "Lyon 1er", negotiator: "Marie Dupont", status: "available" });
  const p101 = property(A1, { ref: "REF-101", title: "T2 loué Lyon 6e", type: "apartment", transaction: "rental", price: 980, surface: 42, rooms: 2, city: "Lyon", zone: "Lyon 6e", negotiator: "Sophie Martin", status: "rented" });
  const p102 = property(A1, { ref: "REF-102", title: "Studio loué Villeurbanne", type: "studio", transaction: "rental", price: 650, surface: 26, rooms: 1, city: "Villeurbanne", zone: "Villeurbanne", negotiator: "Karim Benali", status: "rented" });
  const p103 = property(A1, { ref: "REF-103", title: "Maison louée Lyon 8e", type: "house", transaction: "rental", price: 1450, surface: 110, rooms: 5, city: "Lyon", zone: "Lyon 8e", negotiator: "Marie Dupont", status: "rented" });
  const p202 = property(A1, { ref: "REF-202", title: "T3 vendu Lyon 3e", type: "apartment", transaction: "sale", price: 280000, surface: 58, rooms: 3, city: "Lyon", zone: "Lyon 3e", negotiator: "Karim Benali", status: "sold" });
  const p203 = property(A1, { ref: "REF-203", title: "Maison vendue Lyon 9e", type: "house", transaction: "sale", price: 540000, surface: 130, rooms: 6, city: "Lyon", zone: "Lyon 9e", negotiator: "Marie Dupont", status: "sold" });
  property(A1, { ref: "REF-301", title: "T4 Lyon 6e", type: "apartment", transaction: "sale", price: 410000, surface: 78, rooms: 4, city: "Lyon", zone: "Lyon 6e", negotiator: "Sophie Martin", status: "available" });
  property(A1, { ref: "REF-302", title: "T2 Lyon 7e (location)", type: "apartment", transaction: "rental", price: 890, surface: 38, rooms: 2, city: "Lyon", zone: "Lyon 7e", negotiator: "Marie Dupont", status: "available" });

  const oRobert = contact(A1, "Robert", "Lemoine", "owner", { email: "r.lemoine@gmail.com", phone: "06 11 22 33 44" });
  const oHelene = contact(A1, "Hélène", "Fabre", "owner", { email: "helene.fabre@gmail.com", phone: "06 22 33 44 55" });
  const oJacques = contact(A1, "Jacques", "Morel", "owner", { email: "j.morel@orange.fr", phone: "06 33 44 55 66" });
  const oInes = contact(A1, "Inès", "Roche", "owner", { email: "ines.roche@gmail.com", phone: "06 44 55 66 77" });
  M.push(
    { id: uid(), agencyId: A1, propertyId: p001, ownerId: oRobert, type: "exclusive", startDate: dDay(-340), endDate: dDay(25), status: "active", createdAt },
    { id: uid(), agencyId: A1, propertyId: p002, ownerId: oHelene, type: "exclusive", startDate: dDay(-300), endDate: dDay(10), status: "active", createdAt },
    { id: uid(), agencyId: A1, propertyId: p005, ownerId: oJacques, type: "simple", startDate: dDay(-200), endDate: dDay(45), status: "active", createdAt },
    { id: uid(), agencyId: A1, propertyId: p007, ownerId: oInes, type: "exclusive", startDate: dDay(-100), endDate: dDay(60), status: "active", createdAt }
  );

  const tLea = contact(A1, "Léa", "Moreau", "tenant", { email: "lea.moreau@gmail.com", phone: "06 55 66 77 88" });
  const tAntoine = contact(A1, "Antoine", "Bernard", "tenant", { email: "antoine.bernard@free.fr", phone: "06 66 77 88 99" });
  const tMariam = contact(A1, "Mariam", "Diallo", "tenant", { email: "mariam.diallo@gmail.com", phone: "06 77 88 99 00" });
  L.push(
    { id: uid(), agencyId: A1, propertyId: p101, tenantId: tLea, monthlyRent: 980, charges: 60, startDate: dDay(-400), endDate: dDay(330), rentDueDay: 5, createdAt },
    { id: uid(), agencyId: A1, propertyId: p102, tenantId: tAntoine, monthlyRent: 650, charges: 40, startDate: dDay(-250), endDate: dDay(115), rentDueDay: 10, createdAt },
    { id: uid(), agencyId: A1, propertyId: p103, tenantId: tMariam, monthlyRent: 1450, charges: 120, startDate: dDay(-500), endDate: dDay(230), rentDueDay: 28, createdAt }
  );

  CI.push(
    { id: uid(), agencyId: A1, propertyId: p001, type: "dpe", label: "DPE à renouveler", dueDate: dDay(20), reminderDaysBefore: 30, status: "pending", createdAt },
    { id: uid(), agencyId: A1, propertyId: p005, type: "dpe", label: "DPE à renouveler", dueDate: dDay(12), reminderDaysBefore: 15, status: "pending", createdAt },
    { id: uid(), agencyId: A1, propertyId: p101, type: "pno_insurance", label: "Assurance PNO à renouveler", dueDate: dDay(40), reminderDaysBefore: 30, status: "pending", createdAt },
    { id: uid(), agencyId: A1, propertyId: p103, type: "lease_renewal", label: "Renouvellement de bail", dueDate: dDay(50), reminderDaysBefore: 15, status: "pending", createdAt }
  );

  const cClaire = contact(A1, "Claire", "Petit", "buyer", { email: "claire.petit@gmail.com", phone: "06 12 13 14 15" });
  const cHugo = contact(A1, "Hugo", "Lefèvre", "buyer", { email: "hugo.lefevre@gmail.com", phone: "06 23 24 25 26" });
  const cNadia = contact(A1, "Nadia", "Cherif", "buyer", { email: "nadia.cherif@gmail.com", phone: "06 34 35 36 37" });
  TX.push(
    { id: uid(), agencyId: A1, propertyId: p003, contactId: cClaire, type: "sale", signedDate: dDay(-1), reviewRequestedAt: null, reviewFollowupAt: null, reviewCompletedAt: null, referralRequestedAt: null, createdAt },
    { id: uid(), agencyId: A1, propertyId: p202, contactId: cHugo, type: "sale", signedDate: dDay(-4), reviewRequestedAt: null, reviewFollowupAt: null, reviewCompletedAt: null, referralRequestedAt: null, createdAt },
    { id: uid(), agencyId: A1, propertyId: p203, contactId: cNadia, type: "sale", signedDate: dDay(-31), reviewRequestedAt: null, reviewFollowupAt: null, reviewCompletedAt: null, referralRequestedAt: null, createdAt }
  );

  contact(A1, "Paul", "Girard", "buyer", { email: "paul.girard@gmail.com", phone: "06 40 41 42 43", buyerCriteria: crit({ transaction: "sale", type: "apartment", budgetMax: 350000, zones: ["Lyon 6e", "Lyon 3e"], minRooms: 3 }) });
  contact(A1, "Sarah", "Benali", "buyer", { email: "sarah.benali@gmail.com", phone: "06 50 51 52 53", buyerCriteria: crit({ transaction: "sale", type: "apartment", budgetMax: 300000, zones: ["Lyon 7e"], minRooms: 2 }) });
  contact(A1, "Marc", "Olivier", "buyer", { email: "marc.olivier@orange.fr", phone: "06 60 61 62 63", buyerCriteria: crit({ transaction: "sale", type: "house", budgetMax: 500000, zones: ["Villeurbanne", "Caluire-et-Cuire"], minRooms: 4 }) });
  contact(A1, "Léa", "Dubois", "buyer", { email: "lea.dubois@gmail.com", phone: "06 70 71 72 73", buyerCriteria: crit({ transaction: "sale", type: "apartment", budgetMax: 350000, zones: ["Lyon 6e"], minRooms: 3 }) });
  contact(A1, "Élodie", "Faure", "tenant", { email: "elodie.faure@gmail.com", phone: "06 80 81 82 83", buyerCriteria: crit({ transaction: "rental", type: "apartment", budgetMax: 1200, zones: ["Lyon 2e"], minRooms: 2 }) });

  NS.push({
    id: uid(), agencyId: A1, name: "Acheteurs appartement Lyon ≤ 350 000 €",
    criteria: crit({ transaction: "sale", type: "apartment", budgetMax: 350000, zones: ["Lyon 6e", "Lyon 3e", "Lyon 7e"] }),
    createdAt,
  });

  AP.push(
    { id: uid(), agencyId: A1, propertyId: p001, contactId: null, contactName: "Julien Faure", contactEmail: "julien.faure@gmail.com", contactPhone: null, type: "visite", scheduledAt: at(1, 18, 0), status: "confirmed", confirmationSentAt: null, reminderJ1SentAt: null, reminderH2SentAt: null, createdAt },
    { id: uid(), agencyId: A1, propertyId: p002, contactId: null, contactName: "Aïcha Benkacem", contactEmail: "aicha.benkacem@outlook.fr", contactPhone: "06 12 34 56 78", type: "visite", scheduledAt: at(2, 11, 0), status: "confirmed", confirmationSentAt: null, reminderJ1SentAt: null, reminderH2SentAt: null, createdAt },
    { id: uid(), agencyId: A1, propertyId: null, contactId: null, contactName: "Thomas Lecomte", contactEmail: "t.lecomte@free.fr", contactPhone: null, type: "estimation", scheduledAt: at(3, 14, 30), status: "requested", confirmationSentAt: null, reminderJ1SentAt: null, reminderH2SentAt: null, createdAt },
    { id: uid(), agencyId: A1, propertyId: p005, contactId: null, contactName: "Pierre Garnier", contactEmail: "p.garnier@laposte.net", contactPhone: "06 98 76 54 32", type: "visite", scheduledAt: at(5, 10, 0), status: "confirmed", confirmationSentAt: null, reminderJ1SentAt: null, reminderH2SentAt: null, createdAt }
  );

  // `agencyId` en dernier avec A1 par défaut : les huit appels du scénario
  // Horizon restent inchangés, les autres agences passent le leur.
  const email = (
    externalId: string, source: string, senderName: string, senderEmail: string,
    rawSubject: string, rawBody: string, receivedAt: string, parsedPropertyRef: string | null,
    agencyId: string = A1
  ) => IE.push({
    id: uid(), agencyId, externalId, source, senderName, senderEmail, rawSubject, rawBody,
    receivedAt, isSpam: false, parsedPropertyRef, requestType: null, leadId: null, status: "non_traite", createdAt,
  });
  email("EM-1001", "seloger", "Julien Faure", "julien.faure@gmail.com", "Demande d'info - Appartement Lyon 6e", "Bonjour, je suis intéressé par votre T3 à Lyon 6e à 320 000 €. Possible de visiter cette semaine ? Cordialement", at(-1, 9, 14), "REF-001");
  email("EM-1002", "leboncoin", "Aïcha Benkacem", "aicha.benkacem@outlook.fr", "Maison Villeurbanne - visite", "Bonjour, la maison de Villeurbanne est-elle toujours disponible ? Nous cherchons pour une famille de 4. Tel : 06 12 34 56 78", at(-1, 10, 2), "REF-002");
  email("EM-1003", "site", "Thomas Lecomte", "t.lecomte@free.fr", "Estimation appartement", "Bonjour, je souhaite faire estimer mon appartement de 70 m² à Lyon 8e en vue d'une vente. Quand seriez-vous disponible ?", at(-1, 11, 47), null);
  email("EM-1004", "bienici", "Camille Rey", "camille.rey@gmail.com", "Location T2 Lyon 2e", "Bonjour, le T2 à 1 150 €/mois Lyon 2e est-il libre ? Je suis en CDI, dossier complet. Merci", at(-1, 14, 23), "REF-006");
  email("EM-1005", "autre", "Marc Olivier", "marc.olivier@orange.fr", "Re: Visite REF-004", "Merci pour la visite d'hier. Je réfléchis encore, je vous redis d'ici la fin de semaine.", at(-1, 16, 38), "REF-004");
  email("EM-1006", "autre", "Sophie Nguyen", "sophie.nguyen@gmail.com", "Pièces dossier location", "Bonjour, voici en pièce jointe ma fiche de paie et mon avis d'imposition pour le dossier. Manque-t-il quelque chose ?", at(0, 8, 9), "REF-006");
  email("EM-1007", "seloger", "Pierre Garnier", "p.garnier@laposte.net", "Maison Caluire 620k", "Bonjour, je serais intéressé par une visite de la maison de Caluire. Plutôt disponible le week-end. 06 98 76 54 32", at(0, 9, 55), "REF-005");
  email("EM-1008", "spam", "Newsletter Pôle", "noreply@partenaire-pub.com", "Boostez vos annonces immobilières !", "Profitez de -50% sur votre abonnement publicitaire ce mois-ci...", at(0, 12, 30), null);

  // ===================== AGENCE 2 — AZUR (Marseille) =====================
  const A2 = uid();
  const azur = { id: A2, name: "Agence Azur Méditerranée", city: "Marseille", logoUrl: null, createdAt };
  const a2p1 = property(A2, { ref: "AZ-001", title: "T3 Marseille 6e", type: "apartment", transaction: "sale", price: 295000, surface: 60, rooms: 3, city: "Marseille", zone: "Marseille 6e", negotiator: "Léa Fontaine", status: "available" });
  const a2p2 = property(A2, { ref: "AZ-002", title: "T2 loué Marseille 8e", type: "apartment", transaction: "rental", price: 850, surface: 40, rooms: 2, city: "Marseille", zone: "Marseille 8e", negotiator: "Yanis Roux", status: "rented" });
  const a2owner = contact(A2, "Famille", "Sanchez", "owner", { email: "sanchez@gmail.com", phone: "06 01 02 03 04" });
  const a2tenant = contact(A2, "Omar", "Haddad", "tenant", { email: "omar.haddad@gmail.com", phone: "06 05 06 07 08" });
  const a2client = contact(A2, "Marc", "Lopez", "buyer", { email: "marc.lopez@gmail.com", phone: "06 09 10 11 12" });
  contact(A2, "Inès", "Marchand", "buyer", { email: "ines.marchand@gmail.com", phone: "06 13 14 15 16", buyerCriteria: crit({ transaction: "sale", type: "apartment", budgetMax: 320000, zones: ["Marseille 6e"], minRooms: 3 }) });
  M.push({ id: uid(), agencyId: A2, propertyId: a2p1, ownerId: a2owner, type: "exclusive", startDate: dDay(-200), endDate: dDay(15), status: "active", createdAt });
  L.push({ id: uid(), agencyId: A2, propertyId: a2p2, tenantId: a2tenant, monthlyRent: 850, charges: 50, startDate: dDay(-300), endDate: dDay(60), rentDueDay: 7, createdAt });
  TX.push({ id: uid(), agencyId: A2, propertyId: a2p1, contactId: a2client, type: "sale", signedDate: dDay(-3), reviewRequestedAt: null, reviewFollowupAt: null, reviewCompletedAt: null, referralRequestedAt: null, createdAt });
  CI.push({ id: uid(), agencyId: A2, propertyId: a2p2, type: "pno_insurance", label: "Assurance PNO à renouveler", dueDate: dDay(18), reminderDaysBefore: 30, status: "pending", createdAt });
  AP.push({ id: uid(), agencyId: A2, propertyId: a2p1, contactId: null, contactName: "Lucas Blanc", contactEmail: "lucas.blanc@gmail.com", contactPhone: "06 17 18 19 20", type: "visite", scheduledAt: at(2, 15, 0), status: "confirmed", confirmationSentAt: null, reminderJ1SentAt: null, reminderH2SentAt: null, createdAt });
  IE.push({ id: uid(), agencyId: A2, externalId: "AZ-EM-1", source: "seloger", senderName: "Sophie Aubert", senderEmail: "sophie.aubert@gmail.com", rawSubject: "Info T3 Marseille 6e", rawBody: "Bonjour, je suis intéressée par le T3 à Marseille 6e. Possible de visiter ? Merci. 06 21 22 23 24", receivedAt: at(0, 10, 0), isSpam: false, parsedPropertyRef: "AZ-001", requestType: null, leadId: null, status: "non_traite", createdAt });

  // ===================== AGENCE 3 — CAPITALE (Paris) =====================
  const A3 = uid();
  const capitale = { id: A3, name: "Agence Capitale Paris", city: "Paris", logoUrl: null, createdAt };
  const a3p1 = property(A3, { ref: "CP-001", title: "T2 Paris 11e", type: "apartment", transaction: "sale", price: 520000, surface: 55, rooms: 2, city: "Paris", zone: "Paris 11e", negotiator: "Thomas Mercier", status: "available" });
  const a3p2 = property(A3, { ref: "CP-002", title: "Studio loué Paris 18e", type: "studio", transaction: "rental", price: 1100, surface: 22, rooms: 1, city: "Paris", zone: "Paris 18e", negotiator: "Thomas Mercier", status: "rented" });
  const a3owner = contact(A3, "Philippe", "Rousseau", "owner", { email: "p.rousseau@gmail.com", phone: "06 25 26 27 28" });
  const a3tenant = contact(A3, "Julie", "Lambert", "tenant", { email: "julie.lambert@gmail.com", phone: "06 29 30 31 32" });
  M.push({ id: uid(), agencyId: A3, propertyId: a3p1, ownerId: a3owner, type: "exclusive", startDate: dDay(-150), endDate: dDay(8), status: "active", createdAt });
  L.push({ id: uid(), agencyId: A3, propertyId: a3p2, tenantId: a3tenant, monthlyRent: 1100, charges: 80, startDate: dDay(-220), endDate: dDay(140), rentDueDay: 3, createdAt });
  CI.push({ id: uid(), agencyId: A3, propertyId: a3p1, type: "dpe", label: "DPE à renouveler", dueDate: dDay(10), reminderDaysBefore: 30, status: "pending", createdAt });
  AP.push({ id: uid(), agencyId: A3, propertyId: a3p1, contactId: null, contactName: "Camille Noel", contactEmail: "camille.noel@gmail.com", contactPhone: "06 33 34 35 36", type: "visite", scheduledAt: at(1, 16, 0), status: "confirmed", confirmationSentAt: null, reminderJ1SentAt: null, reminderH2SentAt: null, createdAt });
  IE.push({ id: uid(), agencyId: A3, externalId: "CP-EM-1", source: "bienici", senderName: "Antoine Girard", senderEmail: "antoine.girard@gmail.com", rawSubject: "Visite T2 Paris 11e", rawBody: "Bonjour, le T2 Paris 11e est-il disponible à la visite cette semaine ? Cordialement", receivedAt: at(0, 11, 0), isSpam: false, parsedPropertyRef: "CP-001", requestType: null, leadId: null, status: "non_traite", createdAt });

  // ================= AGENCE 4 — ARTIK M. (Charleville-Mézières) =================
  // Second scénario complet, sur un marché volontairement différent : dans les
  // Ardennes, une maison familiale vaut le prix d'un studio lyonnais. Utile
  // pour vérifier que rien — seuils de budget acheteur, montants de quittance,
  // libellés — n'est calé sur des ordres de grandeur de métropole.
  const A4 = uid(); // identifiant d'agence, sans rapport avec l'automatisation A4
  const artik = { id: A4, name: "Agence Artik", city: "Charleville-Mézières", logoUrl: null, createdAt };

  const am001 = property(A4, { ref: "AM-001", title: "Maison de ville près de la Place Ducale", type: "house", transaction: "sale", price: 168000, surface: 95, rooms: 4, city: "Charleville-Mézières", zone: "Centre-ville", negotiator: "Céline Warnier", status: "available" });
  const am002 = property(A4, { ref: "AM-002", title: "Maison familiale avec jardin à Warcq", type: "house", transaction: "sale", price: 239000, surface: 135, rooms: 6, city: "Warcq", zone: "Warcq", negotiator: "Damien Poncelet", status: "available" });
  const am003 = property(A4, { ref: "AM-003", title: "T3 rénové quartier Manchester", type: "apartment", transaction: "sale", price: 118000, surface: 68, rooms: 3, city: "Charleville-Mézières", zone: "Manchester", negotiator: "Nathalie Thiry", status: "under_offer" });
  property(A4, { ref: "AM-004", title: "T2 bords de Meuse", type: "apartment", transaction: "sale", price: 84000, surface: 48, rooms: 2, city: "Charleville-Mézières", zone: "Centre-ville", negotiator: "Nathalie Thiry", status: "available" });
  const am005 = property(A4, { ref: "AM-005", title: "Maison de maître à Mohon", type: "house", transaction: "sale", price: 275000, surface: 180, rooms: 8, city: "Charleville-Mézières", zone: "Mohon", negotiator: "Damien Poncelet", status: "available" });
  property(A4, { ref: "AM-006", title: "T3 centre-ville (location)", type: "apartment", transaction: "rental", price: 620, surface: 70, rooms: 3, city: "Charleville-Mézières", zone: "Centre-ville", negotiator: "Nathalie Thiry", status: "available" });
  const am007 = property(A4, { ref: "AM-007", title: "Local commercial Place Ducale", type: "commercial", transaction: "sale", price: 189000, surface: 75, rooms: 0, city: "Charleville-Mézières", zone: "Centre-ville", negotiator: "Céline Warnier", status: "available" });
  const am101 = property(A4, { ref: "AM-101", title: "T2 loué Ronde Couture", type: "apartment", transaction: "rental", price: 480, surface: 52, rooms: 2, city: "Charleville-Mézières", zone: "Ronde Couture", negotiator: "Nathalie Thiry", status: "rented" });
  const am102 = property(A4, { ref: "AM-102", title: "Studio loué centre-ville", type: "studio", transaction: "rental", price: 355, surface: 26, rooms: 1, city: "Charleville-Mézières", zone: "Centre-ville", negotiator: "Céline Warnier", status: "rented" });
  const am103 = property(A4, { ref: "AM-103", title: "Maison louée à Villers-Semeuse", type: "house", transaction: "rental", price: 780, surface: 105, rooms: 5, city: "Villers-Semeuse", zone: "Villers-Semeuse", negotiator: "Damien Poncelet", status: "rented" });
  const am202 = property(A4, { ref: "AM-202", title: "T3 vendu Manchester", type: "apartment", transaction: "sale", price: 112000, surface: 65, rooms: 3, city: "Charleville-Mézières", zone: "Manchester", negotiator: "Nathalie Thiry", status: "sold" });
  const am203 = property(A4, { ref: "AM-203", title: "Maison vendue à Nouzonville", type: "house", transaction: "sale", price: 156000, surface: 110, rooms: 5, city: "Nouzonville", zone: "Nouzonville", negotiator: "Damien Poncelet", status: "sold" });
  property(A4, { ref: "AM-301", title: "T4 centre-ville", type: "apartment", transaction: "sale", price: 145000, surface: 88, rooms: 4, city: "Charleville-Mézières", zone: "Centre-ville", negotiator: "Céline Warnier", status: "available" });
  property(A4, { ref: "AM-302", title: "T2 Mohon (location)", type: "apartment", transaction: "rental", price: 495, surface: 44, rooms: 2, city: "Charleville-Mézières", zone: "Mohon", negotiator: "Nathalie Thiry", status: "available" });

  const amoDidier = contact(A4, "Didier", "Lallemand", "owner", { email: "d.lallemand@orange.fr", phone: "06 24 51 63 07" });
  const amoMartine = contact(A4, "Martine", "Piérard", "owner", { email: "martine.pierard@gmail.com", phone: "06 35 72 18 09" });
  const amoBernard = contact(A4, "Bernard", "Colin", "owner", { email: "bernard.colin@wanadoo.fr", phone: "06 46 83 29 10" });
  const amoFatima = contact(A4, "Fatima", "Zerrouki", "owner", { email: "fatima.zerrouki@gmail.com", phone: "06 57 94 30 21" });
  // Le mandat d'AM-002 expire à J+6 : A3 se déclenche dès les premiers jours.
  M.push(
    { id: uid(), agencyId: A4, propertyId: am001, ownerId: amoDidier, type: "exclusive", startDate: dDay(-320), endDate: dDay(18), status: "active", createdAt },
    { id: uid(), agencyId: A4, propertyId: am002, ownerId: amoMartine, type: "exclusive", startDate: dDay(-280), endDate: dDay(6), status: "active", createdAt },
    { id: uid(), agencyId: A4, propertyId: am005, ownerId: amoBernard, type: "simple", startDate: dDay(-180), endDate: dDay(52), status: "active", createdAt },
    { id: uid(), agencyId: A4, propertyId: am007, ownerId: amoFatima, type: "exclusive", startDate: dDay(-90), endDate: dDay(70), status: "active", createdAt }
  );

  const amtSamir = contact(A4, "Samir", "Bouchard", "tenant", { email: "samir.bouchard@gmail.com", phone: "06 68 15 42 33" });
  const amtAurelie = contact(A4, "Aurélie", "Deville", "tenant", { email: "aurelie.deville@free.fr", phone: "06 79 26 53 44" });
  const amtKevin = contact(A4, "Kévin", "Gérard", "tenant", { email: "kevin.gerard@laposte.net", phone: "06 80 37 64 55" });
  // Trois jours d'échéance distincts (3, 8, 15) : A4 émet ses quittances à trois
  // dates différentes dans le mois, au lieu d'une seule salve.
  L.push(
    { id: uid(), agencyId: A4, propertyId: am101, tenantId: amtSamir, monthlyRent: 480, charges: 35, startDate: dDay(-380), endDate: dDay(350), rentDueDay: 3, createdAt },
    { id: uid(), agencyId: A4, propertyId: am102, tenantId: amtAurelie, monthlyRent: 355, charges: 25, startDate: dDay(-210), endDate: dDay(155), rentDueDay: 8, createdAt },
    { id: uid(), agencyId: A4, propertyId: am103, tenantId: amtKevin, monthlyRent: 780, charges: 90, startDate: dDay(-450), endDate: dDay(280), rentDueDay: 15, createdAt }
  );

  CI.push(
    { id: uid(), agencyId: A4, propertyId: am005, type: "dpe", label: "DPE à renouveler", dueDate: dDay(9), reminderDaysBefore: 15, status: "pending", createdAt },
    { id: uid(), agencyId: A4, propertyId: am001, type: "dpe", label: "DPE à renouveler", dueDate: dDay(16), reminderDaysBefore: 30, status: "pending", createdAt },
    { id: uid(), agencyId: A4, propertyId: am103, type: "pno_insurance", label: "Assurance PNO à renouveler", dueDate: dDay(35), reminderDaysBefore: 30, status: "pending", createdAt },
    { id: uid(), agencyId: A4, propertyId: am101, type: "lease_renewal", label: "Renouvellement de bail", dueDate: dDay(44), reminderDaysBefore: 15, status: "pending", createdAt }
  );

  // Signatures échelonnées comme chez Horizon : J-2 (demande d'avis à venir),
  // J-6 (relance A7 due) et J-33 (parrainage A8 dû).
  const amcLaurent = contact(A4, "Laurent", "Mangin", "buyer", { email: "laurent.mangin@gmail.com", phone: "06 91 48 75 66" });
  const amcSophie = contact(A4, "Sophie", "Renard", "buyer", { email: "sophie.renard@orange.fr", phone: "06 02 59 86 77" });
  const amcYoussef = contact(A4, "Youssef", "Amrani", "buyer", { email: "youssef.amrani@gmail.com", phone: "06 13 60 97 88" });
  TX.push(
    { id: uid(), agencyId: A4, propertyId: am003, contactId: amcLaurent, type: "sale", signedDate: dDay(-2), reviewRequestedAt: null, reviewFollowupAt: null, reviewCompletedAt: null, referralRequestedAt: null, createdAt },
    { id: uid(), agencyId: A4, propertyId: am202, contactId: amcSophie, type: "sale", signedDate: dDay(-6), reviewRequestedAt: null, reviewFollowupAt: null, reviewCompletedAt: null, referralRequestedAt: null, createdAt },
    { id: uid(), agencyId: A4, propertyId: am203, contactId: amcYoussef, type: "sale", signedDate: dDay(-33), reviewRequestedAt: null, reviewFollowupAt: null, reviewCompletedAt: null, referralRequestedAt: null, createdAt }
  );

  // Budgets calés sur le marché local : le plus gros acheteur du fichier vise
  // 300 000 €, soit moins que la maison la moins chère du portefeuille lyonnais.
  contact(A4, "Élise", "Colinet", "buyer", { email: "elise.colinet@gmail.com", phone: "06 24 71 08 99", buyerCriteria: crit({ transaction: "sale", type: "apartment", budgetMax: 150000, zones: ["Centre-ville", "Manchester"], minRooms: 3 }) });
  contact(A4, "Grégory", "Thomas", "buyer", { email: "gregory.thomas@gmail.com", phone: "06 35 82 19 00", buyerCriteria: crit({ transaction: "sale", type: "house", budgetMax: 250000, zones: ["Warcq", "Villers-Semeuse"], minRooms: 5 }) });
  contact(A4, "Nadège", "Hubert", "buyer", { email: "nadege.hubert@orange.fr", phone: "06 46 93 20 11", buyerCriteria: crit({ transaction: "sale", type: "apartment", budgetMax: 130000, zones: ["Centre-ville"], minRooms: 4 }) });
  contact(A4, "Mehdi", "Ouali", "buyer", { email: "mehdi.ouali@gmail.com", phone: "06 57 04 31 22", buyerCriteria: crit({ transaction: "sale", type: "house", budgetMax: 300000, zones: ["Mohon"], minRooms: 6 }) });
  contact(A4, "Charlotte", "Lambin", "tenant", { email: "charlotte.lambin@free.fr", phone: "06 68 15 42 33", buyerCriteria: crit({ transaction: "rental", type: "apartment", budgetMax: 650, zones: ["Centre-ville", "Mohon"], minRooms: 2 }) });

  NS.push(
    { id: uid(), agencyId: A4, name: "Acheteurs appartement Charleville ≤ 150 000 €", criteria: crit({ transaction: "sale", type: "apartment", budgetMax: 150000, zones: ["Centre-ville", "Manchester", "Mohon"] }), createdAt },
    { id: uid(), agencyId: A4, name: "Maisons familiales périphérie ≤ 250 000 €", criteria: crit({ transaction: "sale", type: "house", budgetMax: 250000, zones: ["Warcq", "Villers-Semeuse", "Nouzonville"] }), createdAt }
  );

  AP.push(
    { id: uid(), agencyId: A4, propertyId: am001, contactId: null, contactName: "Vincent Maréchal", contactEmail: "v.marechal@gmail.com", contactPhone: "06 44 90 12 34", type: "visite", scheduledAt: at(1, 17, 30), status: "confirmed", confirmationSentAt: null, reminderJ1SentAt: null, reminderH2SentAt: null, createdAt },
    { id: uid(), agencyId: A4, propertyId: am002, contactId: null, contactName: "Sandrine Leroy", contactEmail: "sandrine.leroy@orange.fr", contactPhone: "06 55 01 23 45", type: "visite", scheduledAt: at(2, 10, 30), status: "confirmed", confirmationSentAt: null, reminderJ1SentAt: null, reminderH2SentAt: null, createdAt },
    { id: uid(), agencyId: A4, propertyId: null, contactId: null, contactName: "Patrick Guillaume", contactEmail: "p.guillaume@wanadoo.fr", contactPhone: null, type: "estimation", scheduledAt: at(4, 15, 0), status: "requested", confirmationSentAt: null, reminderJ1SentAt: null, reminderH2SentAt: null, createdAt },
    { id: uid(), agencyId: A4, propertyId: am005, contactId: null, contactName: "Amandine Roussel", contactEmail: "amandine.roussel@gmail.com", contactPhone: "06 66 12 34 56", type: "visite", scheduledAt: at(6, 9, 30), status: "confirmed", confirmationSentAt: null, reminderJ1SentAt: null, reminderH2SentAt: null, createdAt }
  );

  email("AM-EM-1", "seloger", "Vincent Maréchal", "v.marechal@gmail.com", "Maison centre-ville Charleville", "Bonjour, votre maison de ville près de la Place Ducale à 168 000 € m'intéresse. Serait-il possible de la visiter en fin de semaine ? Cordialement", at(-1, 8, 41), "AM-001", A4);
  email("AM-EM-2", "leboncoin", "Sandrine Leroy", "sandrine.leroy@orange.fr", "Maison Warcq avec jardin", "Bonjour, la maison de Warcq est-elle toujours en vente ? Nous sommes une famille de 5 et le jardin nous intéresse beaucoup. 06 55 01 23 45", at(-1, 10, 27), "AM-002", A4);
  email("AM-EM-3", "site", "Patrick Guillaume", "p.guillaume@wanadoo.fr", "Estimation maison Aiglemont", "Bonjour, je souhaite faire estimer ma maison de 120 m² à Aiglemont avant une mise en vente au printemps. Quelles sont vos disponibilités ?", at(-1, 13, 15), null, A4);
  email("AM-EM-4", "bienici", "Julie Wathelet", "julie.wathelet@gmail.com", "Location T3 centre-ville", "Bonjour, le T3 à 620 €/mois en centre-ville est-il encore libre ? Je suis infirmière au CH de Charleville, CDI. Merci d'avance", at(-1, 15, 52), "AM-006", A4);
  email("AM-EM-5", "autre", "Amandine Roussel", "amandine.roussel@gmail.com", "Maison de maître Mohon", "Bonjour, nous aimerions visiter la maison de maître de Mohon. Nous sommes disponibles en semaine après 17 h. 06 66 12 34 56", at(0, 9, 8), "AM-005", A4);
  email("AM-EM-6", "autre", "Karim Belaïd", "karim.belaid@gmail.com", "Pièces dossier location T3", "Bonjour, je vous joins mes trois derniers bulletins de salaire et mon avis d'imposition pour le dossier de location. Dites-moi s'il manque quelque chose.", at(0, 11, 33), "AM-006", A4);
  email("AM-EM-7", "seloger", "Damien Charpentier", "d.charpentier@orange.fr", "Local commercial Place Ducale", "Bonjour, je cherche un local pour ouvrir un salon de thé. Les 75 m² de la Place Ducale conviendraient. Quelle est la surface de vitrine ?", at(0, 14, 6), "AM-007", A4);
  email("AM-EM-8", "spam", "Immo Booster", "contact@immo-booster-pro.com", "Vendez 3x plus vite dans les Ardennes !", "Notre logiciel révolutionnaire garantit des ventes en moins de 30 jours. Offre de lancement -70%...", at(0, 16, 20), null, A4);

  // ============================ INSERTION ============================
  await ensureSchema();
  for (const t of TABLE_NAMES) await client.unsafe(`DELETE FROM ${t}`);

  await db.insert(agencies).values([horizon, azur, capitale, artik] as never);
  await db.insert(contacts).values(C as never);
  await db.insert(properties).values(P as never);
  await db.insert(mandates).values(M as never);
  await db.insert(leases).values(L as never);
  await db.insert(complianceItems).values(CI as never);
  await db.insert(transactions).values(TX as never);
  await db.insert(newsletterSegments).values(NS as never);
  await db.insert(appointments).values(AP as never);
  await db.insert(inboxEmails).values(IE as never);
  await db.insert(demoClock).values({ id: "global", currentDate: createdAt, initialDate: createdAt, createdAt });

  return {
    agencies: 4, properties: P.length, contacts: C.length, mandates: M.length,
    leases: L.length, transactions: TX.length, appointments: AP.length,
    inbox: IE.length, compliance: CI.length, initialDate: createdAt,
  };
}
