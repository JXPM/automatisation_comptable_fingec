import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AuthShell, { Field, PasswordField, SubmitButton, Alert } from "../components/AuthShell";
import { B } from "../theme";

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
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Connexion" subtitle="Accédez à votre espace de traitement comptable.">
      <form onSubmit={submit}>
        {error && <Alert kind="error">{error}</Alert>}
        <Field
          label="Adresse e-mail"
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@fingec.fr"
        />
        <PasswordField
          label="Mot de passe"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -4, marginBottom: 20 }}>
          <Link
            to="/forgot-password"
            style={{ fontSize: 12.5, fontWeight: 600, color: B, textDecoration: "none" }}
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <SubmitButton loading={loading}>Se connecter</SubmitButton>
      </form>
    </AuthShell>
  );
}
