import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { authFetch } from "../utils/api";
import { useToast } from "../components/Toast";
import { PasswordField } from "../components/AuthShell";
import PageHeader from "../components/PageHeader";
import { initials } from "../utils/clients";
import { B, B_DARK } from "../theme";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const displayName = user?.full_name || user?.email || "Utilisateur";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next.length < 12) {
      setError("Le nouveau mot de passe doit contenir au moins 12 caractères.");
      return;
    }
    if (next !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch("/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail ?? "Échec de la mise à jour.");
      }
      showToast("Mot de passe mis à jour.", "success");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "36px 44px" }} className="page-enter">
      {/* En-tête */}
      <PageHeader
        eyebrow="Mon espace"
        title="Paramètres du compte"
        subtitle="Gérez vos informations et votre mot de passe."
      />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 320px) minmax(0, 440px)", gap: 24, alignItems: "start" }}>
        {/* Carte identité */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, flexShrink: 0,
              background: "linear-gradient(135deg, #f5e6d3 0%, #e8c9a8 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, fontWeight: 700, color: B_DARK, fontFamily: "'Playfair Display', serif",
            }}>
              {initials(displayName)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 650, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayName}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>Rôle</span>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
              background: user?.role === "admin" ? "var(--b-tint)" : "var(--line)",
              color: user?.role === "admin" ? B_DARK : "var(--ink-2)",
            }}>
              {user?.role === "admin" ? "Administrateur" : "Comptable"}
            </span>
          </div>
          <button onClick={logout} style={logoutStyle}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Se déconnecter
          </button>
        </div>

        {/* Carte changement de mot de passe */}
        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 680, color: "var(--ink)" }}>Changer le mot de passe</h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--muted)" }}>
            Saisissez votre mot de passe actuel puis le nouveau.
          </p>
          <form onSubmit={submit}>
            {error && (
              <div role="alert" style={{ margin: "0 0 16px", padding: "11px 13px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FCA5A5", fontSize: 13, color: "#B91C1C" }}>
                {error}
              </div>
            )}
            <PasswordField label="Mot de passe actuel" required value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            <PasswordField label="Nouveau mot de passe" required value={next} onChange={(e) => setNext(e.target.value)} placeholder="Au moins 12 caractères" autoComplete="new-password" hint="12 caractères minimum, en mélangeant lettres, chiffres et symboles." />
            <PasswordField label="Confirmer le nouveau mot de passe" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            <button type="submit" disabled={loading} style={{
              width: "100%", marginTop: 8, padding: "12px", borderRadius: 11, border: "none",
              cursor: loading ? "default" : "pointer",
              background: loading ? "var(--muted-2)" : `linear-gradient(95deg, ${B}, ${B_DARK})`,
              color: "#fff", fontSize: 14, fontWeight: 640, fontFamily: "inherit", boxShadow: loading ? "none" : "var(--shadow-glow)",
            }}>
              {loading ? "Mise à jour…" : "Mettre à jour le mot de passe"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--surface)", borderRadius: 16, padding: "22px 24px",
  border: "1px solid var(--line)", boxShadow: "var(--shadow-md)",
};

const logoutStyle: React.CSSProperties = {
  marginTop: 18, width: "100%", padding: "10px", borderRadius: 10,
  border: "1px solid var(--line-2)", background: "#fff", cursor: "pointer",
  color: "var(--ink-2)", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
};
