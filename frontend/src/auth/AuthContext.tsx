import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  authFetch,
  clearSession,
  getStoredUser,
  getToken,
  setSession,
  setUnauthorizedHandler,
  type User,
} from "../utils/api";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [loading, setLoading] = useState<boolean>(!!getToken());

  // Déconnexion automatique si l'API renvoie 401 (jeton expiré/invalide).
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  // Au montage, si un jeton existe, on revalide la session auprès du backend.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
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

  const login = async (email: string, password: string) => {
    const res = await fetch(`${(import.meta.env.VITE_API_URL ?? "")}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      throw new Error(detail?.detail ?? "Échec de la connexion.");
    }
    const data = await res.json();
    setSession(data.access_token, data.user);
    setUser(data.user);
  };

  const logout = () => {
    clearSession();
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
