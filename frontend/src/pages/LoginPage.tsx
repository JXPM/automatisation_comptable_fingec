import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { B, B_DARK } from "../theme";
import { useAuth } from "../auth/AuthContext";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from ?? "/";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(165deg, ${B} 0%, ${B_DARK} 55%, #320a17 100%)`,
      padding: 20,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{
          width: "100%", maxWidth: 380,
          background: "white", borderRadius: 20, padding: "40px 36px",
          boxShadow: "0 24px 64px -16px rgba(0,0,0,0.45)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, marginBottom: 16,
            background: "linear-gradient(140deg, #ffffff 0%, #f5f5f7 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 20px -8px rgba(0,0,0,0.3)",
          }}>
            <img src="/fingec-logo.png" alt="Fingec" style={{ width: 40, height: 40, objectFit: "contain" }} />
          </div>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700,
            letterSpacing: "2px", color: "#0F1421",
          }}>FINGEC</div>
          <div style={{ fontSize: 12, color: "#9CA3AF", letterSpacing: "0.5px", marginTop: 4 }}>
            Espace comptabilité
          </div>
        </div>

        <form onSubmit={submit}>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            Adresse e-mail
          </label>
          <input
            type="email" required autoFocus value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@fingec.fr"
            style={inputStyle}
          />

          <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", margin: "16px 0 6px" }}>
            Mot de passe
          </label>
          <input
            type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={inputStyle}
          />

          {error && (
            <div style={{
              marginTop: 16, padding: "10px 12px", borderRadius: 8,
              background: "#FEF2F2", border: "1px solid #FCA5A5",
              fontSize: 13, color: "#B91C1C",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: "100%", marginTop: 24, padding: "12px",
              borderRadius: 10, border: "none", cursor: loading ? "default" : "pointer",
              background: loading ? "#9CA3AF" : `linear-gradient(95deg, ${B}, ${B_DARK})`,
              color: "white", fontSize: 14.5, fontWeight: 600, fontFamily: "inherit",
              boxShadow: `0 8px 20px -8px ${B}88`,
            }}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 13px", borderRadius: 10,
  border: "1px solid #E5E7EB", fontSize: 14, fontFamily: "inherit",
  color: "#111827", outline: "none", boxSizing: "border-box",
};
