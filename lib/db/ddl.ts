// DDL PostgreSQL appliqué au runtime (CREATE TABLE IF NOT EXISTS) — pas de
// dépendance à drizzle-kit/migrations à l'exécution.
// Doit rester synchronisé avec lib/db/schema.ts.

export const DDL_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS agencies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT,
    logo_url TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL,
    buyer_criteria TEXT,
    consent_marketing BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    ref TEXT,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    surface INTEGER,
    rooms INTEGER,
    city TEXT,
    zone TEXT,
    negotiator TEXT,
    status TEXT NOT NULL DEFAULT 'available',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS mandates (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    type TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    property_id TEXT,
    contact_id TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    type TEXT NOT NULL DEFAULT 'visite',
    scheduled_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    confirmation_sent_at TEXT,
    reminder_j1_sent_at TEXT,
    reminder_h2_sent_at TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS leases (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    monthly_rent DOUBLE PRECISION NOT NULL,
    charges DOUBLE PRECISION NOT NULL DEFAULT 0,
    start_date TEXT NOT NULL,
    end_date TEXT,
    rent_due_day INTEGER NOT NULL DEFAULT 5,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS compliance_items (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    due_date TEXT NOT NULL,
    reminder_days_before INTEGER NOT NULL DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    contact_id TEXT NOT NULL,
    type TEXT NOT NULL,
    signed_date TEXT NOT NULL,
    review_requested_at TEXT,
    review_followup_at TEXT,
    review_completed_at TEXT,
    referral_requested_at TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS newsletter_segments (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    name TEXT NOT NULL,
    criteria TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS inbox_emails (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    external_id TEXT,
    source TEXT NOT NULL,
    sender_name TEXT,
    sender_email TEXT,
    raw_subject TEXT,
    raw_body TEXT,
    received_at TEXT NOT NULL,
    is_spam BOOLEAN NOT NULL DEFAULT FALSE,
    parsed_property_ref TEXT,
    request_type TEXT,
    lead_id TEXT,
    status TEXT NOT NULL DEFAULT 'non_traite',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    external_id TEXT,
    contact_id TEXT,
    property_id TEXT,
    source_email_id TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    assigned_to TEXT,
    request_type TEXT,
    priority TEXT DEFAULT 'moyenne',
    first_response_at TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    to_contact_id TEXT,
    to_name TEXT,
    to_address TEXT,
    subject TEXT,
    body TEXT NOT NULL,
    attachment_url TEXT,
    automation_type TEXT,
    sent_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    automation_type TEXT,
    description TEXT NOT NULL,
    ref_id TEXT,
    occurred_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS automation_runs (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    automation_type TEXT NOT NULL,
    ref_id TEXT,
    run_key TEXT NOT NULL UNIQUE,
    executed_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS demo_clock (
    id TEXT PRIMARY KEY,
    current_ts TEXT NOT NULL,
    initial_ts TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  // Toutes les requêtes de l'app filtrent par agence (isolation multi-agences) :
  // sans index, chaque lecture fait un scan complet de table.
  `CREATE INDEX IF NOT EXISTS idx_contacts_agency ON contacts(agency_id)`,
  `CREATE INDEX IF NOT EXISTS idx_properties_agency ON properties(agency_id)`,
  `CREATE INDEX IF NOT EXISTS idx_mandates_agency_status ON mandates(agency_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_agency ON appointments(agency_id)`,
  // Page publique /book/[id] : créneaux cherchés par bien, pas par agence.
  `CREATE INDEX IF NOT EXISTS idx_appointments_property_slot ON appointments(property_id, scheduled_at)`,
  `CREATE INDEX IF NOT EXISTS idx_leases_agency ON leases(agency_id)`,
  `CREATE INDEX IF NOT EXISTS idx_compliance_items_agency_status ON compliance_items(agency_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_agency ON transactions(agency_id)`,
  `CREATE INDEX IF NOT EXISTS idx_newsletter_segments_agency ON newsletter_segments(agency_id)`,
  `CREATE INDEX IF NOT EXISTS idx_inbox_emails_agency_status ON inbox_emails(agency_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_agency ON leads(agency_id)`,
  // Composites : ces deux tables grossissent à chaque avancement d'horloge et
  // les pages Journal / Boîte d'envoi filtrent par automatisation.
  `CREATE INDEX IF NOT EXISTS idx_messages_agency_type ON messages(agency_id, automation_type)`,
  `CREATE INDEX IF NOT EXISTS idx_activity_log_agency_type ON activity_log(agency_id, automation_type)`,
  `CREATE INDEX IF NOT EXISTS idx_automation_runs_agency ON automation_runs(agency_id)`,
];

export const TABLE_NAMES: string[] = [
  "automation_runs",
  "activity_log",
  "messages",
  "leads",
  "inbox_emails",
  "newsletter_segments",
  "transactions",
  "compliance_items",
  "leases",
  "appointments",
  "mandates",
  "properties",
  "contacts",
  "agencies",
  "demo_clock",
];
