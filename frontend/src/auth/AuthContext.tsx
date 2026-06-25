import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  API_URL,
  authFetch,
  logoutRequest,
  setUnauthorizedHandler,
  type User,
} from "../utils/api";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Déconnexion automatique si l'API renvoie 401 (cookie expiré/invalide).
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  // Au montage, on demande au backend qui nous sommes : le cookie httpOnly est
  // envoyé automatiquement. 200 → session valide ; 401 → pas de session.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/auth/me");
        if (!cancelled && res.ok) {
          setUser(await res.json());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string, remember = true) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include", // reçoit et stocke le cookie de session httpOnly
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, remember }),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      throw new Error(detail?.detail ?? "Échec de la connexion.");
    }
    const data = await res.json();
    setUser(data.user);
    return data.user as User;
  };

  const logout = () => {
    logoutRequest(); // efface le cookie côté serveur (best-effort)
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
