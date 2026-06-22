// Base URL of the FastAPI backend.
// - Dev: empty → Vite proxy (vite.config.ts) forwards /process, /download, /logs,
//   /auth, /n8n to localhost:8000
// - Prod: vide aussi — le frontend et l'API sont servis par le même Caddy sur le
//   VPS Hostinger (chemins relatifs). VITE_API_URL ne sert qu'à pointer un backend
//   distant si besoin. Voir docker-compose.yml / deploy/Caddyfile.fingec.snippet.
export const API_URL: string = import.meta.env.VITE_API_URL ?? "";

const TOKEN_KEY = "fingec_token";
const USER_KEY = "fingec_user";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  active: boolean;
  created_at: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

// `remember` vrai → session persistante (localStorage) ; faux → durée de l'onglet
// (sessionStorage, effacé à la fermeture du navigateur). On purge l'autre store
// pour éviter qu'un ancien jeton ne subsiste.
export function setSession(token: string, user: User, remember = true): void {
  const store = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  other.removeItem(TOKEN_KEY);
  other.removeItem(USER_KEY);
  store.setItem(TOKEN_KEY, token);
  store.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

// Le AuthProvider enregistre ici un callback pour réagir à un 401 (déconnexion).
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

/**
 * fetch() avec le jeton Bearer attaché et gestion automatique du 401.
 * `path` est relatif (ex: "/logs") — API_URL est préfixé.
 */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers ?? {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // Appels d'API dynamiques : on désactive le cache HTTP du navigateur. Sinon il
  // revalide (If-None-Match) et reçoit un 304 — que `res.ok` (200-299) rejette.
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store", ...init, headers });

  if (res.status === 401) {
    clearSession();
    onUnauthorized?.();
  }
  return res;
}

/** Télécharge un export via fetch+blob (les liens <a> ne portent pas le header Bearer). */
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
