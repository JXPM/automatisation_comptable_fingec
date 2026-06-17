import { useEffect, useState } from "react";
import { B } from "../theme";
import { authFetch, type User } from "../utils/api";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";
import PageHeader from "../components/PageHeader";

export default function AdminPage() {
  const { user: me } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Formulaire de création
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/auth/users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await authFetch("/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), full_name: fullName.trim(), password, role }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        showToast(detail?.detail ?? "Échec de la création.", "error");
        return;
      }
      const created = await res.json().catch(() => null);
      if (created?.setup_email_sent === true) {
        showToast("Utilisateur créé — e-mail d'invitation envoyé.", "success");
      } else if (created?.setup_email_sent === false) {
        showToast("Utilisateur créé, mais l'e-mail d'invitation n'a pas pu partir (voir logs).", "error");
      } else {
        showToast("Utilisateur créé.", "success");
      }
      setEmail(""); setFullName(""); setPassword(""); setRole("user");
      load();
    } finally {
      setCreating(false);
    }
  };

  const patchUser = async (id: number, body: Record<string, unknown>, okMsg: string) => {
    const res = await authFetch(`/auth/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      showToast(detail?.detail ?? "Échec de la modification.", "error");
      return;
    }
    showToast(okMsg, "success");
    load();
  };

  const resetPassword = async (u: User) => {
    const pwd = window.prompt(`Nouveau mot de passe pour ${u.email} (min. 8 caractères) :`);
    if (!pwd) return;
    patchUser(u.id, { password: pwd }, "Mot de passe réinitialisé.");
  };

  const deleteUser = async (u: User) => {
    if (!window.confirm(`Supprimer définitivement ${u.email} ?`)) return;
    const res = await authFetch(`/auth/users/${u.id}`, { method: "DELETE" });
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      showToast(detail?.detail ?? "Échec de la suppression.", "error");
      return;
    }
    showToast("Utilisateur supprimé.", "success");
    load();
  };

  return (
    <div style={{ padding: "36px 44px" }}>
      {/* Header */}
      <PageHeader eyebrow="Administration" title="Utilisateurs" />

      {/* Création */}
      <form onSubmit={createUser} style={{
        background: "white", borderRadius: 16, border: "1px solid #ECEEF2",
        padding: 20, marginBottom: 24, display: "grid",
        gridTemplateColumns: "1.4fr 1.2fr 0.8fr auto", gap: 12, alignItems: "end",
        boxShadow: "0 1px 2px rgba(15,20,33,0.04), 0 8px 24px -8px rgba(15,20,33,0.06)",
      }}>
        <Field label="E-mail">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom@fingec.fr" style={inputStyle} />
        </Field>
        <Field label="Nom complet">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Prénom Nom" style={inputStyle} />
        </Field>
        <Field label="Rôle">
          <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
            <option value="user">Utilisateur</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
        <button type="submit" disabled={creating} style={{
          padding: "11px 18px", borderRadius: 10, border: "none",
          background: creating ? "#9CA3AF" : `linear-gradient(95deg, ${B}, #7E1626)`,
          color: "white", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          whiteSpace: "nowrap", height: 40,
        }}>
          {creating ? "…" : "Ajouter"}
        </button>
      </form>

      {/* Liste */}
      <div style={{
        background: "white", borderRadius: 16, border: "1px solid #ECEEF2",
        overflow: "hidden", boxShadow: "0 1px 2px rgba(15,20,33,0.04), 0 8px 24px -8px rgba(15,20,33,0.08)",
      }}>
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1.6fr 0.8fr 0.8fr 1.8fr",
          padding: "11px 20px", background: "#FAFAFA", borderBottom: "1px solid #F3F4F6", gap: 12,
        }}>
          {["E-mail", "Nom", "Rôle", "Statut", "Actions"].map((h) => (
            <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.6px" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>Chargement…</div>
        ) : users.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>Aucun utilisateur.</div>
        ) : users.map((u, i) => (
          <div key={u.id} style={{
            display: "grid", gridTemplateColumns: "2fr 1.6fr 0.8fr 0.8fr 1.8fr",
            padding: "12px 20px", gap: 12, alignItems: "center",
            borderBottom: i < users.length - 1 ? "1px solid #F9FAFB" : "none",
            opacity: u.active ? 1 : 0.55,
          }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
              {u.email}{u.id === me?.id && <span style={{ color: "#9CA3AF", fontWeight: 400 }}> (vous)</span>}
            </span>
            <span style={{ fontSize: 13, color: "#6B7280" }}>{u.full_name || "—"}</span>
            <span style={{
              fontSize: 11.5, fontWeight: 600, padding: "2px 8px", borderRadius: 6, justifySelf: "start",
              background: u.role === "admin" ? "#EDE9FE" : "#F3F4F6",
              color: u.role === "admin" ? "#6D28D9" : "#6B7280",
            }}>
              {u.role === "admin" ? "Admin" : "User"}
            </span>
            <span style={{
              fontSize: 11.5, fontWeight: 600, padding: "2px 8px", borderRadius: 6, justifySelf: "start",
              background: u.active ? "#D1FAE5" : "#FEE2E2",
              color: u.active ? "#065F46" : "#B91C1C",
            }}>
              {u.active ? "Actif" : "Inactif"}
            </span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ActionBtn onClick={() => patchUser(u.id, { active: !u.active }, u.active ? "Compte désactivé." : "Compte réactivé.")}>
                {u.active ? "Désactiver" : "Réactiver"}
              </ActionBtn>
              <ActionBtn onClick={() => patchUser(u.id, { role: u.role === "admin" ? "user" : "admin" }, "Rôle modifié.")}>
                {u.role === "admin" ? "→ User" : "→ Admin"}
              </ActionBtn>
              <ActionBtn onClick={() => resetPassword(u)}>Mot de passe</ActionBtn>
              {u.id !== me?.id && (
                <ActionBtn danger onClick={() => deleteUser(u)}>Supprimer</ActionBtn>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#6B7280", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

function ActionBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontFamily: "inherit",
      fontSize: 12, fontWeight: 500,
      border: `1px solid ${danger ? "#FCA5A5" : "#E5E7EB"}`,
      background: danger ? "#FEF2F2" : "white",
      color: danger ? "#DC2626" : "#374151",
    }}>
      {children}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 11px", borderRadius: 9,
  border: "1px solid #E5E7EB", fontSize: 13, fontFamily: "inherit",
  color: "#111827", outline: "none", boxSizing: "border-box", height: 40,
};
