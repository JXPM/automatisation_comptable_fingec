import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import AuthShell, { Field, PasswordField, SubmitButton, Alert } from "../components/AuthShell";
import { B } from "../theme";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from ?? "/";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password, remember);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la connexion.");
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Bon retour !" subtitle="Connectez-vous à votre espace de traitement comptable.">
      <form onSubmit={submit}>
        {error && <Alert kind="error">{error}</Alert>}
        <Field
          label="Adresse e-mail"
          type="email"
          icon={Mail}
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@fingec.fr"
        />
        <PasswordField
          label="Mot de passe"
          icon={Lock}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        {/* Mot de passe oublié (sous le champ, aligné à gauche) */}
        <div style={{ marginTop: -4, marginBottom: 14 }}>
          <Link
            to="/forgot-password"
            style={{ fontSize: 13, fontWeight: 600, color: B, textDecoration: "none" }}
          >
            Mot de passe oublié ?
          </Link>
        </div>

        {/* Se souvenir de moi (interrupteur) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>Se souvenir de moi</span>
          <button
            type="button"
            role="switch"
            aria-checked={remember}
            aria-label="Se souvenir de moi"
            onClick={() => setRemember((v) => !v)}
            style={{
              position: "relative", width: 46, height: 26, borderRadius: 99, border: "none",
              cursor: "pointer", padding: 0, flexShrink: 0,
              background: remember ? B : "#D1D5DB",
              transition: "background 0.2s var(--ease)",
            }}
          >
            <span
              style={{
                position: "absolute", top: 3, left: 3, width: 20, height: 20, borderRadius: "50%",
                background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                transform: remember ? "translateX(20px)" : "translateX(0)",
                transition: "transform 0.2s var(--ease)",
              }}
            />
          </button>
        </div>

        <SubmitButton loading={loading} withArrow>
          Se connecter
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
