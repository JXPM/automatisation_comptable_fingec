import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import { useToast } from "../components/Toast";
import { B } from "../theme";
import { avatarColor, initials, norm } from "../utils/clients";
import { authFetch } from "../utils/api";

interface HistoEntry {
  Mois: string;
  Nom: string;
  Email: string;
  Statut_final: string;
  Nb_relances?: number;
}

export default function HistoriquePage() {
  const [historique, setHistorique] = useState<HistoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [filterMois, setFilterMois] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [modal, setModal] = useState<{ email: string; nom: string; mois: string } | null>(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/n8n/webhook/get-historique");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHistorique(Array.isArray(data) ? data : []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const moisList = [...new Set(historique.map(h => h.Mois).filter(Boolean))];
  const dernierMois = moisList[moisList.length - 1] || "";
  const nonRecusDernierMois = historique.filter(h => h.Mois === dernierMois && h.Statut_final !== "Reçu");

  const filtered = historique.filter(h => {
    const s = norm(search);
    const matchS = norm(h.Nom).includes(s) || norm(h.Email).includes(s);
    const matchM = filterMois ? h.Mois === filterMois : true;
    const matchSt = filterStatut === "non-recu" ? h.Statut_final !== "Reçu"
                  : filterStatut ? h.Statut_final === filterStatut : true;
    return matchS && matchM && matchSt;
  });

  const envoyerRelance = async () => {
    if (!modal) return;
    const { email, nom, mois } = modal;
    setModal(null);
    setLoadingKey(email + mois);
    try {
      const res = await authFetch("/n8n/webhook/relance-historique", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nom, mois }),
      });
      if (!res.ok) throw new Error();
      showToast(`Relance envoyée à ${nom} pour ${mois}`);
    } catch {
      showToast(`Erreur pour ${nom}`, "error");
    } finally {
      setLoadingKey(null);
    }
  };

  // Group by month for section headers
  const monthGroups = filtered.reduce<Record<string, HistoEntry[]>>((acc, h) => {
    const m = h.Mois || "—";
    if (!acc[m]) acc[m] = [];
    acc[m].push(h);
    return acc;
  }, {});

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
                Mois précédents
              </p>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "#0F1421", margin: 0, letterSpacing: "-0.5px" }}>
                Historique
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
      </div>

      {/* Alert banner */}
      {!loading && nonRecusDernierMois.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px", borderRadius: 10, marginBottom: 20,
          background: "#FEF3C7", border: "1px solid #FCD34D",
          fontSize: 13, color: "#92400E",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>
            <strong>{nonRecusDernierMois.length} client{nonRecusDernierMois.length > 1 ? "s" : ""}</strong> n'ont pas envoyé leurs documents en <strong>{dernierMois}</strong> — pensez à les relancer.
          </span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
            style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            style={{
              padding: "9px 12px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 8,
              width: 220, fontSize: 13, background: "white", outline: "none",
              fontFamily: "inherit", boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
            onFocus={e => (e.target.style.borderColor = B)}
            onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
          />
        </div>
        <select
          value={filterMois} onChange={e => setFilterMois(e.target.value)}
          style={{
            padding: "9px 14px", border: "1px solid #E5E7EB", borderRadius: 8,
            fontSize: 13, background: "white", outline: "none", cursor: "pointer",
            fontFamily: "inherit", boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <option value="">Tous les mois</option>
          {moisList.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
          style={{
            padding: "9px 14px", border: "1px solid #E5E7EB", borderRadius: 8,
            fontSize: 13, background: "white", outline: "none", cursor: "pointer",
            fontFamily: "inherit", boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="Reçu">Reçu</option>
          <option value="non-recu">Non reçu uniquement</option>
        </select>
      </div>

      {/* Table grouped by month */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <div style={{ width: 28, height: 28, border: `3px solid #F3F4F6`, borderTopColor: B, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <div style={{ fontSize: 13, color: "#9CA3AF" }}>Chargement…</div>
        </div>
      ) : error ? (
        <div style={{
          background: "white", borderRadius: 14, border: "1px solid #E5E7EB",
          padding: "48px 20px", textAlign: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontSize: 13, color: "#B45309" }}>Impossible de charger l'historique. Réessayez dans un instant.</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: "white", borderRadius: 14, border: "1px solid #E5E7EB",
          padding: "48px 20px", textAlign: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div style={{ fontSize: 13, color: "#9CA3AF" }}>Aucune donnée.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {Object.entries(monthGroups).map(([mois, rows]) => {
            const recuCount = rows.filter(r => r.Statut_final === "Reçu").length;
            const moisTaux = rows.length > 0 ? Math.round((recuCount / rows.length) * 100) : 0;

            return (
              <div key={mois} style={{
                background: "white", borderRadius: 16, border: "1px solid #ECEEF2",
                overflow: "hidden",
                boxShadow: "0 1px 2px rgba(15,20,33,0.04), 0 8px 24px -8px rgba(15,20,33,0.08)",
              }}>
                {/* Month header */}
                <div style={{
                  padding: "13px 20px",
                  background: "#FAFAFA",
                  borderBottom: "1px solid #F3F4F6",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span style={{ fontWeight: 600, fontSize: 13, color: B }}>{mois}</span>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>{rows.length} client{rows.length > 1 ? "s" : ""}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 5, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${moisTaux}%`, background: moisTaux === 100 ? "#10B981" : B, borderRadius: 99, transition: "width 0.5s ease" }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: moisTaux === 100 ? "#059669" : "#6B7280" }}>{moisTaux}%</span>
                  </div>
                </div>

                {/* Column headers */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 2fr 1.2fr 0.8fr 1fr",
                  padding: "8px 20px",
                  borderBottom: "1px solid #F3F4F6",
                  gap: 12,
                }}>
                  {["Client", "Email", "Statut", "Relances", "Action"].map(h => (
                    <span key={h} style={{ fontSize: 10.5, fontWeight: 600, color: "#C0C4CC", textTransform: "uppercase", letterSpacing: "0.6px" }}>{h}</span>
                  ))}
                </div>

                {/* Rows */}
                {rows.map((h, i) => {
                  const nonRecu = h.Statut_final !== "Reçu";
                  const key = h.Email + h.Mois;
                  const isLoading = loadingKey === key;
                  const ac = avatarColor(h.Nom);

                  return (
                    <div
                      key={i}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 2fr 1.2fr 0.8fr 1fr",
                        padding: "12px 20px", gap: 12, alignItems: "center",
                        borderBottom: i < rows.length - 1 ? "1px solid #F9FAFB" : "none",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#FAFAFA"}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = ""}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                          background: ac, color: "white",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10.5, fontWeight: 700,
                        }}>
                          {initials(h.Nom)}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {h.Nom || "—"}
                        </span>
                      </div>

                      <span style={{ color: "#6B7280", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {h.Email || "—"}
                      </span>

                      <StatusBadge statut={h.Statut_final || "—"} />

                      <span style={{ color: "#6B7280", fontSize: 13 }}>{h.Nb_relances || 0}</span>

                      {nonRecu ? (
                        <button
                          disabled={isLoading}
                          onClick={() => setModal({ email: h.Email, nom: h.Nom, mois: h.Mois })}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "5px 12px", borderRadius: 7,
                            border: `1px solid ${isLoading ? "#E5E7EB" : B}`,
                            background: "transparent",
                            color: isLoading ? "#9CA3AF" : B,
                            fontSize: 12, fontWeight: 500,
                            cursor: isLoading ? "default" : "pointer",
                            fontFamily: "inherit", whiteSpace: "nowrap",
                            transition: "all 0.15s",
                          }}
                        >
                          {isLoading ? "Envoi…" : (
                            <>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                              Relancer
                            </>
                          )}
                        </button>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500, color: "#059669" }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          OK
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!modal}
        text={modal ? `Envoyer une relance à ${modal.nom} pour les documents de ${modal.mois} ?` : ""}
        onConfirm={envoyerRelance}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
