import type { Metadata } from "next";

// La réservation de visite montre les biens fictifs de la démonstration :
// comme le reste de la démo, elle n'a rien à faire dans un index.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
