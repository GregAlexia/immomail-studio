import {
  LayoutDashboard,
  Inbox,
  CalendarDays,
  ReceiptText,
  Zap,
  FileSpreadsheet,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/leads", label: "Boîte de réception", icon: Inbox },
  { href: "/agenda", label: "Agenda & visites", icon: CalendarDays },
  { href: "/locations", label: "Locations & quittances", icon: ReceiptText },
  { href: "/automatisations", label: "Automatisations", icon: Zap },
  { href: "/import", label: "Import / Export", icon: FileSpreadsheet },
  { href: "/aide", label: "Aide & guide", icon: HelpCircle },
];
