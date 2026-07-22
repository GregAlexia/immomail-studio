import {
  LayoutDashboard,
  Inbox,
  CalendarDays,
  ReceiptText,
  Zap,
  FileSpreadsheet,
  HelpCircle,
  FileSignature,
  ShieldCheck,
  Megaphone,
  History,
  Send,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  /** Description affichée dans la page Paramétrage. */
  description?: string;
}

// Catalogue COMPLET des espaces de l'application, y compris les pages
// masquées par défaut (elles existent dans le code — voir README).
// L'ordre ici est l'ordre d'affichage dans la navigation.
export const NAV: NavItem[] = [
  { key: "dashboard", href: "/", label: "Tableau de bord", icon: LayoutDashboard, description: "Vue d'ensemble du jour (toujours actif)." },
  { key: "leads", href: "/leads", label: "Boîte de réception", icon: Inbox, description: "Tri des emails, leads qualifiés, réponses automatiques (A9 · A10 · A11)." },
  { key: "agenda", href: "/agenda", label: "Agenda & visites", icon: CalendarDays, description: "Rendez-vous, confirmations et rappels (A1 · A2)." },
  { key: "locations", href: "/locations", label: "Locations & quittances", icon: ReceiptText, description: "Baux et quittances PDF (A4)." },
  { key: "mandats", href: "/mandats", label: "Mandats", icon: FileSignature, description: "Alertes d'expiration et relances propriétaires (A3)." },
  { key: "conformite", href: "/conformite", label: "Conformité", icon: ShieldCheck, description: "DPE, PNO, échéances de bail (A5)." },
  { key: "marketing", href: "/marketing", label: "Marketing", icon: Megaphone, description: "Newsletter, avis Google, parrainage (A6 · A7 · A8)." },
  { key: "journal", href: "/journal", label: "Journal d'activité", icon: History, description: "Timeline horodatée de toutes les automatisations." },
  { key: "messages", href: "/messages", label: "Boîte d'envoi", icon: Send, description: "Aperçu fidèle des SMS, emails et PDF envoyés." },
  { key: "automatisations", href: "/automatisations", label: "Automatisations", icon: Zap, description: "Les automatisations actives et leurs compteurs." },
  { key: "import", href: "/import", label: "Import / Export", icon: FileSpreadsheet, description: "Pilotage complet par fichier Excel." },
  { key: "aide", href: "/aide", label: "Aide & guide", icon: HelpCircle, description: "Guide intégré de la démo." },
  { key: "parametres", href: "/parametres", label: "Paramétrage", icon: Settings, description: "Choix des menus actifs (toujours actif)." },
];

// Menus impossibles à désactiver (navigation minimale garantie).
export const LOCKED_KEYS: string[] = ["dashboard", "parametres"];

// Menus actifs par défaut (l'interface épurée historique + Paramétrage).
export const DEFAULT_KEYS: string[] = [
  "dashboard",
  "leads",
  "agenda",
  "locations",
  "automatisations",
  "import",
  "aide",
  "parametres",
];
