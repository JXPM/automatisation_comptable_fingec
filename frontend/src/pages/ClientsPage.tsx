import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import { useToast } from "../components/Toast";
import { B } from "../theme";
import { avatarColor, initials, norm } from "../utils/clients";
import { authFetch } from "../utils/api";

interface Client {
  Nom: string;
  Email: string;
  Statut: string;
  Nb_relances?: number;
  Date_derniere_relance?: string;
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 12, height: 12,
      border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "white",
      borderRadius: "50%", animation: "spin 0.7s linear infinite",
    }} />
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [modal, setModal] = useState<{ email: string; nom: string } | null>(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/n8n/webhook/get-clients");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = clients.filter(c => {
    const s = norm(search);
    return (norm(c.Nom).includes(s) || norm(c.Email).includes(s)) && (filter ? c.Statut === filter : true);
  });

  const relancer = async (email: string, nom: string) => {
    setLoadingKey(email);
    try {
      const res = await authFetch("/n8n/webhook/relance-client", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      showToast(`Relance envoyée à ${nom}`);
      setTimeout(load, 1500);
    } catch {
      showToast(`Erreur lors de la relance de ${nom}`, "error");
    } finally {
      setLoadingKey(null);
    }
  };

  const marquerRecu = async (email: string, nom: string) => {
    setLoadingKey(email + "_r");
    try {
      const res = await authFetch("/n8n/webhook/marquer-recu", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      showToast(`${nom} marqué comme Reçu`);
      setTimeout(load, 1000);
    } catch {
      showToast(`Erreur pour ${nom}`, "error");
    } finally {
      setLoadingKey(null);
    }
  };

  const stats = {
    total: clients.length,
    recu: clients.filter(c => c.Statut === "Reçu").length,
    attente: clients.filter(c => c.Statut !== "Reçu").length,
  };

  return (
    <div style={{ padding: "36px 40px" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 4, height: 44, borderRadius: 2,
              background: `linear-gradient(180deg, ${B} 0%, #9d2440 100%)`,
              boxShadow: `0 4px 12px -4px ${B}66`,
            }} />
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase", color: B, marginBottom: 4 }}>
                Gestion
              </p>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "#0F1421", margin: 0, letterSpacing: "-0.5px" }}>
                Mes clients
              </h1>
            </div>
          </div>
          <button
            onClick={load}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 16px", borderRadius: 10,
              border: "1px solid #E2E5EC", background: "white",
              fontSize: 13, fontWeight: 500, color: "#374151",
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 1px 2px rgba(15,20,33,0.04)",
              transition: "all 0.15s var(--ease)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#CBD2DD"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 10px -4px rgba(15,20,33,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E2E5EC"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,20,33,0.04)"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
            Actualiser
          </button>
        </div>

        {/* Mini stats inline */}
        {!loading && !error && (
          <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
            {[
              { label: "Total", value: stats.total, color: "#6B7280", bg: "#F3F4F6" },
              { label: "Reçus", value: stats.recu, color: "#059669", bg: "#D1FAE5" },
              { label: "En attente", value: stats.attente, color: "#D97706", bg: "#FEF3C7" },
            ].map(s => (
              <div key={s.label} style={{
                background: "white", borderRadius: 10, padding: "9px 16px",
                border: "1px solid #ECEEF2", fontSize: 13,
                display: "flex", alignItems: "center", gap: 10,
                boxShadow: "0 1px 2px rgba(15,20,33,0.04)",
              }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: s.color, boxShadow: `0 0 8px ${s.color}66` }} />
                <span style={{ fontWeight: 700, color: s.color, fontSize: 17, fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
                <span style={{ color: "#9CA3AF", fontWeight: 500 }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
            style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client…"
            style={{
              padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8,
              width: 240, fontSize: 13, background: "white", outline: "none",
              fontFamily: "inherit", boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              transition: "border-color 0.15s",
            }}
            onFocus={e => (e.target.style.borderColor = B)}
            onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
          />
        </div>
        <select
          value={filter} onChange={e => setFilter(e.target.value)}
          style={{
            padding: "9px 14px", border: "1px solid #E5E7EB", borderRadius: 8,
            fontSize: 13, background: "white", outline: "none", cursor: "pointer",
            fontFamily: "inherit", color: filter ? "#111827" : "#6B7280",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="En attente">En attente</option>
          <option value="Envoyé">Envoyé</option>
          <option value="Relancé">Relancé</option>
          <option value="Reçu">Reçu</option>
        </select>
        {(search || filter) && (
          <button
            onClick={() => { setSearch(""); setFilter(""); }}
            style={{
              padding: "9px 14px", border: "1px solid #E5E7EB", borderRadius: 8,
              fontSize: 13, background: "white", cursor: "pointer",
              fontFamily: "inherit", color: "#6B7280",
            }}
          >
            Effacer
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{
        background: "white", borderRadius: 16, border: "1px solid #ECEEF2",
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(15,20,33,0.04), 0 8px 24px -8px rgba(15,20,33,0.08)",
      }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 2fr 1.2fr 0.7fr 1.3fr 1.6fr",
          padding: "11px 20px", background: "#FAFAFA",
          borderBottom: "1px solid #F3F4F6", gap: 12, alignItems: "center",
        }}>
          {["Client", "Email", "Statut", "Relances", "Dernière relance", "Actions"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.6px" }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ width: 28, height: 28, border: `3px solid #F3F4F6`, borderTopColor: B, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 13, color: "#9CA3AF" }}>Chargement…</div>
          </div>
        ) : error ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#B45309" }}>Impossible de charger les clients. Réessayez dans un instant.</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <div style={{ fontSize: 13, color: "#9CA3AF" }}>Aucun client trouvé.</div>
          </div>
        ) : filtered.map((cl, i) => {
          const isRecu = cl.Statut === "Reçu";
          const isRelanceLoading = loadingKey === cl.Email;
          const isRecuLoading = loadingKey === cl.Email + "_r";
          const ac = avatarColor(cl.Nom);

          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 1.2fr 0.7fr 1.3fr 1.6fr",
                padding: "13px 20px", gap: 12, alignItems: "center",
                borderBottom: i < filtered.length - 1 ? "1px solid #F9FAFB" : "none",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#FAFAFA"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = ""}
            >
              {/* Client avec avatar */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                  background: ac, color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.3px",
                }}>
                  {initials(cl.Nom)}
                </div>
                <span style={{ fontWeight: 500, fontSize: 13, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {cl.Nom}
                </span>
              </div>

              <span style={{ color: "#6B7280", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {cl.Email}
              </span>

              <StatusBadge statut={cl.Statut} />

              <span style={{ color: "#6B7280", fontSize: 13, textAlign: "center" }}>
                {cl.Nb_relances || 0}
              </span>

              <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                {cl.Date_derniere_relance || "—"}
              </span>

              <div style={{ display: "flex", gap: 6 }}>
                {!isRecu ? (
                  <>
                    <button
                      disabled={isRelanceLoading}
                      onClick={() => setModal({ email: cl.Email, nom: cl.Nom })}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "6px 12px", borderRadius: 7, border: "none",
                        background: isRelanceLoading ? "#C4A0A8" : B,
                        color: "white", fontSize: 12, fontWeight: 500,
                        cursor: isRelanceLoading ? "default" : "pointer",
                        fontFamily: "inherit", whiteSpace: "nowrap",
                        transition: "background 0.15s",
                      }}
                    >
                      {isRelanceLoading ? <Spinner /> : (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      )}
                      Relancer
                    </button>
                    <button
                      disabled={isRecuLoading}
                      onClick={() => marquerRecu(cl.Email, cl.Nom)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "6px 12px", borderRadius: 7,
                        border: "1px solid #E5E7EB", background: "white",
                        color: "#374151", fontSize: 12, fontWeight: 500,
                        cursor: isRecuLoading ? "default" : "pointer",
                        fontFamily: "inherit", whiteSpace: "nowrap",
                      }}
                    >
                      {isRecuLoading ? <Spinner /> : "✓ Reçu"}
                    </button>
                  </>
                ) : (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 12, fontWeight: 500, color: "#059669",
                    padding: "6px 12px",
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Documents reçus
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer count */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#9CA3AF" }}>
          {filtered.length} client{filtered.length > 1 ? "s" : ""}
          {(search || filter) && ` sur ${clients.length}`}
        </div>
      )}

      <Modal
        open={!!modal}
        text={modal ? `Envoyer une relance par email à ${modal.nom} ?` : ""}
        onConfirm={() => { if (modal) relancer(modal.email, modal.nom); setModal(null); }}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
