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
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: -2, marginBottom: 22,
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ width: 15, height: 15, accentColor: B, cursor: "pointer" }}
            />
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Se souvenir de moi</span>
          </label>
          <Link
            to="/forgot-password"
            style={{ fontSize: 13, fontWeight: 600, color: B, textDecoration: "none" }}
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <SubmitButton loading={loading} withArrow>
          Se connecter
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
