import { useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { authFetch } from "../utils/api";
import { useToast } from "../components/Toast";
import { PasswordField } from "../components/AuthShell";
import PageHeader from "../components/PageHeader";
import Avatar from "../components/Avatar";
import { openOnboardingGuide } from "../components/OnboardingGuide";
import { fileToAvatarDataUrl } from "../utils/image";
import { B, B_DARK } from "../theme";

export default function AccountPage() {
  const { user, logout, updateUser } = useAuth();
  const { showToast } = useToast();

  // ── Profil (nom + photo) ───────────────────────────────────────────────────
  const [name, setName] = useState(user?.full_name ?? "");
  const [avatar, setAvatar] = useState<string>(user?.avatar_url ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const displayName = name || user?.email || "Utilisateur";
  const nameChanged = name.trim() !== (user?.full_name ?? "").trim();
  const avatarChanged = avatar !== (user?.avatar_url ?? "");
  const profileDirty = (nameChanged || avatarChanged) && name.trim().length > 0;

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de re-choisir le même fichier
    if (!file) return;
    try {
      setAvatar(await fileToAvatarDataUrl(file));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Image illisible.", "error");
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileDirty) return;
    setSavingProfile(true);
    try {
      const body: { full_name?: string; avatar_url?: string } = {};
      if (nameChanged) body.full_name = name.trim();
      if (avatarChanged) body.avatar_url = avatar; // "" = retirer la photo
      const res = await authFetch("/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail ?? "Échec de la mise à jour.");
      }
      updateUser(await res.json()); // rafraîchit l'avatar/nom partout (topbar…)
      showToast("Profil mis à jour.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Une erreur est survenue.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Mot de passe ────────────────────────────────────────────────────────────
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      <PageHeader
        eyebrow="Mon espace"
        title="Paramètres du compte"
        subtitle="Gérez vos informations et votre mot de passe."
      />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 360px) minmax(0, 440px)", gap: 24, alignItems: "start" }}>
        {/* Carte profil : photo + nom (e-mail verrouillé) */}
        <form onSubmit={saveProfile} style={cardStyle}>
          <h2 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 680, color: "var(--ink)" }}>Profil</h2>

          {/* Photo */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative" }}>
              <Avatar name={displayName} src={avatar} size={72} radius={18} fontSize={24} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <button type="button" onClick={() => fileRef.current?.click()} style={secondaryBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" />
                </svg>
                {avatar ? "Changer la photo" : "Ajouter une photo"}
              </button>
              {avatar && (
                <button type="button" onClick={() => setAvatar("")} style={{ ...secondaryBtn, color: "var(--muted)", border: "none", padding: "4px 6px", justifyContent: "flex-start" }}>
                  Retirer la photo
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} style={{ display: "none" }} />
            </div>
          </div>

          {/* Nom (éditable) */}
          <div style={{ marginTop: 20 }}>
            <label style={fieldLabel}>Nom affiché</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              placeholder="Votre nom"
              style={inputStyle}
            />
          </div>

          {/* E-mail (verrouillé) */}
          <div style={{ marginTop: 14 }}>
            <label style={fieldLabel}>Adresse e-mail</label>
            <div style={{ position: "relative" }}>
              <input value={user?.email ?? ""} readOnly disabled style={{ ...inputStyle, paddingRight: 38, background: "var(--surface-2, #F7F8FA)", color: "var(--muted)", cursor: "not-allowed" }} />
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "var(--muted)" }}>
              L'adresse e-mail ne peut pas être modifiée (identifiant de connexion).
            </p>
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

          <button type="submit" disabled={!profileDirty || savingProfile} style={{
            width: "100%", marginTop: 16, padding: "12px", borderRadius: 11, border: "none",
            cursor: !profileDirty || savingProfile ? "default" : "pointer",
            background: !profileDirty || savingProfile ? "var(--muted-2)" : `linear-gradient(95deg, ${B}, ${B_DARK})`,
            color: "#fff", fontSize: 14, fontWeight: 640, fontFamily: "inherit",
            boxShadow: !profileDirty || savingProfile ? "none" : "var(--shadow-glow)",
          }}>
            {savingProfile ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>

          <button type="button" onClick={openOnboardingGuide} style={{ ...logoutStyle, marginTop: 16, color: B, borderColor: "var(--line-2)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Revoir le guide de prise en main
          </button>

          <button type="button" onClick={logout} style={logoutStyle}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Se déconnecter
          </button>
        </form>

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

const fieldLabel: React.CSSProperties = {
  display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line-2)",
  background: "#fff", fontSize: 14, fontFamily: "inherit", color: "var(--ink)",
  outline: "none", boxSizing: "border-box",
};

const secondaryBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 12px",
  borderRadius: 9, border: "1px solid var(--line-2)", background: "#fff",
  cursor: "pointer", color: "var(--ink-2)", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
};

const logoutStyle: React.CSSProperties = {
  marginTop: 10, width: "100%", padding: "10px", borderRadius: 10,
  border: "1px solid var(--line-2)", background: "#fff", cursor: "pointer",
  color: "var(--ink-2)", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
};
