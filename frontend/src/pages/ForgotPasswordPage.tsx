import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell, { Field, SubmitButton, Alert } from "../components/AuthShell";
import { API_URL } from "../utils/api";
import { B } from "../theme";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail ?? "Une erreur est survenue.");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Saisissez votre adresse e-mail : nous vous enverrons un lien pour définir un nouveau mot de passe."
    >
      {sent ? (
        <>
          <Alert kind="success">
            Si un compte existe pour <strong>{email.trim()}</strong>, un e-mail contenant un lien de
            réinitialisation vient d'être envoyé. Pensez à vérifier vos courriers indésirables.
          </Alert>
          <Link to="/login" style={backLinkStyle}>← Retour à la connexion</Link>
        </>
      ) : (
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
          <div style={{ marginTop: 8 }}>
            <SubmitButton loading={loading}>Envoyer le lien</SubmitButton>
          </div>
          <div style={{ textAlign: "center", marginTop: 18 }}>
            <Link to="/login" style={backLinkStyle}>← Retour à la connexion</Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}

const backLinkStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: B, textDecoration: "none",
};
