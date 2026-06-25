// Base URL of the FastAPI backend.
// - Dev: empty → Vite proxy (vite.config.ts) forwards /process, /download, /logs,
//   /auth, /n8n to localhost:8001
// - Prod: vide aussi — le frontend et l'API sont servis par le même Caddy sur le
//   VPS Hostinger (chemins relatifs). VITE_API_URL ne sert qu'à pointer un backend
//   distant si besoin. Voir docker-compose.yml / deploy/Caddyfile.fingec.snippet.
export const API_URL: string = import.meta.env.VITE_API_URL ?? "";

// Sécurité : le jeton de session N'EST PLUS stocké côté JavaScript (ni
// localStorage ni sessionStorage). Il vit dans un cookie httpOnly + Secure posé
// par le backend au login, inaccessible au JS (résistant au vol par XSS) et
// envoyé automatiquement par le navigateur (`credentials: "include"`).

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  active: boolean;
  avatar_url?: string;
  onboarded?: boolean;
  created_at: string;
}

// Le AuthProvider enregistre ici un callback pour réagir à un 401 (déconnexion).
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

/**
 * fetch() avec le cookie de session attaché et gestion automatique du 401.
 * `path` est relatif (ex: "/logs") — API_URL est préfixé.
 */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  // Appels d'API dynamiques : on désactive le cache HTTP du navigateur. Sinon il
  // revalide (If-None-Match) et reçoit un 304 — que `res.ok` (200-299) rejette.
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store", credentials: "include", ...init });

  if (res.status === 401) {
    onUnauthorized?.();
  }
  return res;
}

/** Termine la session côté serveur (efface le cookie httpOnly). */
export async function logoutRequest(): Promise<void> {
  try {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
  } catch {
    // Déconnexion best-effort : on vide l'état local quoi qu'il arrive.
  }
}

/** Télécharge un export via fetch+blob (les liens <a> ne portent pas la session). */
export async function downloadFile(filename: string): Promise<void> {
  const res = await authFetch(`/download/${filename}`);
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail ?? "Échec du téléchargement.");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(/^output_/, "");
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
