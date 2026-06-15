import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthShell, { PasswordField, SubmitButton, Alert } from "../components/AuthShell";
import { API_URL } from "../utils/api";
import { B } from "../theme";

type Status = "checking" | "valid" | "invalid" | "done";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [status, setStatus] = useState<Status>("checking");
  const [email, setEmail] = useState<string>("");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validation du lien à l'ouverture : pré-remplit l'e-mail, ou affiche « lien invalide ».
  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/reset-password/${encodeURIComponent(token)}`);
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json();
            setEmail(data.email ?? "");
            setStatus("valid");
          } else {
            setStatus("invalid");
          }
        }
      } catch {
        if (!cancelled) setStatus("invalid");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pwd.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (pwd !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: pwd }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail ?? "Impossible de définir le mot de passe.");
      }
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "checking") {
    return (
      <AuthShell title="Vérification du lien…">
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}>
          <div style={{ width: 28, height: 28, border: "3px solid var(--line)", borderTopColor: B, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      </AuthShell>
    );
  }

  if (status === "invalid") {
    return (
      <AuthShell title="Lien invalide" subtitle="Ce lien est expiré ou a déjà été utilisé.">
        <Alert kind="error">
          Demandez un nouveau lien depuis la page « Mot de passe oublié ».
        </Alert>
        <Link to="/forgot-password" style={linkStyle}>Demander un nouveau lien</Link>
      </AuthShell>
    );
  }

  if (status === "done") {
    return (
      <AuthShell title="Mot de passe défini" subtitle="Votre mot de passe a bien été enregistré.">
        <Alert kind="success">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</Alert>
        <Link to="/login" style={linkStyle}>Aller à la connexion →</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Définir un mot de passe"
      subtitle={email ? `Compte : ${email}` : "Choisissez votre nouveau mot de passe."}
    >
      <form onSubmit={submit}>
        {error && <Alert kind="error">{error}</Alert>}
        <PasswordField
          label="Nouveau mot de passe"
          required
          autoFocus
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="Au moins 8 caractères"
          hint="8 caractères minimum."
        />
        <PasswordField
          label="Confirmer le mot de passe"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
        />
        <div style={{ marginTop: 8 }}>
          <SubmitButton loading={loading}>Enregistrer le mot de passe</SubmitButton>
        </div>
      </form>
    </AuthShell>
  );
}

const linkStyle: React.CSSProperties = {
  display: "inline-block", marginTop: 4, fontSize: 13, fontWeight: 600, color: B, textDecoration: "none",
};
