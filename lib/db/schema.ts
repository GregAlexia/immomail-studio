import { pgTable, text, integer, boolean, doublePrecision } from "drizzle-orm/pg-core";

// PostgreSQL (Supabase). Dates/horodatages stockés en TEXT ISO 8601 (local-naïf)
// pour un affichage sans décalage de fuseau. Enums = TEXT (typés via lib/types.ts).

export const agencies = pgTable("agencies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city"),
  logoUrl: text("logo_url"),
  createdAt: text("created_at").notNull(),
});

export const contacts = pgTable("contacts", {
  id: text("id").primaryKey(),
  agencyId: text("agency_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull(),
  buyerCriteria: text("buyer_criteria"), // JSON
  consentMarketing: boolean("consent_marketing").notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export const properties = pgTable("properties", {
  id: text("id").primaryKey(),
  agencyId: text("agency_id").notNull(),
  ref: text("ref"),
  title: text("title").notNull(),
  type: text("type").notNull(),
  transaction: text("transaction_type").notNull(),
  price: doublePrecision("price").notNull(),
  surface: integer("surface"),
  rooms: integer("rooms"),
  city: text("city"),
  zone: text("zone"),
  negotiator: text("negotiator"),
  status: text("status").notNull().default("available"),
  createdAt: text("created_at").notNull(),
});

export const mandates = pgTable("mandates", {
  id: text("id").primaryKey(),
  agencyId: text("agency_id").notNull(),
  propertyId: text("property_id").notNull(),
  ownerId: text("owner_id").notNull(),
  type: text("type").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull(),
});

export const appointments = pgTable("appointments", {
  id: text("id").primaryKey(),
  agencyId: text("agency_id").notNull(),
  propertyId: text("property_id"),
  contactId: text("contact_id"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  type: text("type").notNull().default("visite"),
  scheduledAt: text("scheduled_at").notNull(),
  status: text("status").notNull().default("confirmed"),
  confirmationSentAt: text("confirmation_sent_at"),
  reminderJ1SentAt: text("reminder_j1_sent_at"),
  reminderH2SentAt: text("reminder_h2_sent_at"),
  createdAt: text("created_at").notNull(),
});

export const leases = pgTable("leases", {
  id: text("id").primaryKey(),
  agencyId: text("agency_id").notNull(),
  propertyId: text("property_id").notNull(),
  tenantId: text("tenant_id").notNull(),
  monthlyRent: doublePrecision("monthly_rent").notNull(),
  charges: doublePrecision("charges").notNull().default(0),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  rentDueDay: integer("rent_due_day").notNull().default(5),
  createdAt: text("created_at").notNull(),
});

export const complianceItems = pgTable("compliance_items", {
  id: text("id").primaryKey(),
  agencyId: text("agency_id").notNull(),
  propertyId: text("property_id").notNull(),
  type: text("type").notNull(),
  label: text("label").notNull(),
  dueDate: text("due_date").notNull(),
  reminderDaysBefore: integer("reminder_days_before").notNull().default(30),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull(),
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  agencyId: text("agency_id").notNull(),
  propertyId: text("property_id").notNull(),
  contactId: text("contact_id").notNull(),
  type: text("type").notNull(),
  signedDate: text("signed_date").notNull(),
  reviewRequestedAt: text("review_requested_at"),
  reviewFollowupAt: text("review_followup_at"),
  reviewCompletedAt: text("review_completed_at"),
  referralRequestedAt: text("referral_requested_at"),
  createdAt: text("created_at").notNull(),
});

export const newsletterSegments = pgTable("newsletter_segments", {
  id: text("id").primaryKey(),
  agencyId: text("agency_id").notNull(),
  name: text("name").notNull(),
  criteria: text("criteria"), // JSON
  createdAt: text("created_at").notNull(),
});

export const inboxEmails = pgTable("inbox_emails", {
  id: text("id").primaryKey(),
  agencyId: text("agency_id").notNull(),
  externalId: text("external_id"),
  source: text("source").notNull(),
  senderName: text("sender_name"),
  senderEmail: text("sender_email"),
  rawSubject: text("raw_subject"),
  rawBody: text("raw_body"),
  receivedAt: text("received_at").notNull(),
  isSpam: boolean("is_spam").notNull().default(false),
  parsedPropertyRef: text("parsed_property_ref"),
  requestType: text("request_type"),
  leadId: text("lead_id"),
  status: text("status").notNull().default("non_traite"),
  createdAt: text("created_at").notNull(),
});

export const leads = pgTable("leads", {
  id: text("id").primaryKey(),
  agencyId: text("agency_id").notNull(),
  externalId: text("external_id"),
  contactId: text("contact_id"),
  propertyId: text("property_id"),
  sourceEmailId: text("source_email_id"),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  assignedTo: text("assigned_to"),
  requestType: text("request_type"),
  priority: text("priority").default("moyenne"),
  firstResponseAt: text("first_response_at"),
  status: text("status").notNull().default("new"),
  createdAt: text("created_at").notNull(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  agencyId: text("agency_id").notNull(),
  channel: text("channel").notNull(),
  toContactId: text("to_contact_id"),
  toName: text("to_name"),
  toAddress: text("to_address"),
  subject: text("subject"),
  body: text("body").notNull(),
  attachmentUrl: text("attachment_url"),
  automationType: text("automation_type"),
  sentAt: text("sent_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const activityLog = pgTable("activity_log", {
  id: text("id").primaryKey(),
  agencyId: text("agency_id").notNull(),
  automationType: text("automation_type"),
  description: text("description").notNull(),
  refId: text("ref_id"),
  occurredAt: text("occurred_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const automationRuns = pgTable("automation_runs", {
  id: text("id").primaryKey(),
  agencyId: text("agency_id").notNull(),
  automationType: text("automation_type").notNull(),
  refId: text("ref_id"),
  runKey: text("run_key").notNull().unique(),
  executedAt: text("executed_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const demoClock = pgTable("demo_clock", {
  id: text("id").primaryKey(), // "global"
  currentDate: text("current_ts").notNull(),
  initialDate: text("initial_ts").notNull(),
  createdAt: text("created_at").notNull(),
});
