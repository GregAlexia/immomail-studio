import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_KEYS, LOCKED_KEYS, NAV } from "@/components/app-shell/nav-items";

export const MENU_COOKIE = "menu_keys";

// Clés de menus actives pour la session (cookie), verrouillées incluses.
// Cookie absent ou illisible → configuration par défaut.
export async function getMenuKeys(): Promise<string[]> {
  const store = await cookies();
  const raw = store.get(MENU_COOKIE)?.value;
  let keys = DEFAULT_KEYS;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((k) => typeof k === "string")) {
        const valid = new Set(NAV.map((n) => n.key));
        keys = parsed.filter((k) => valid.has(k));
      }
    } catch {
      // cookie corrompu → défauts
    }
  }
  return [...new Set([...keys, ...LOCKED_KEYS])];
}
