import { useEffect, useState } from "react";
import { B } from "../theme";
import { API_URL } from "../utils/api";

interface LogEntry {
  id: string;
  timestamp: string;
  filename: string;
  country: string;
  rows: number;
  reliability_score: number;
  errors: number;
  warnings: number;
  anomaly_count: number;
  output_file: string;
}

function ScoreBadge({ score }: { score: number }) {
  const [bg, color] =
    score >= 90 ? ["#D1FAE5", "#065F46"] :
    score >= 70 ? ["#FEF3C7", "#92400E"] :
                  ["#FEE2E2", "#B91C1C"];
  return (
    <span style={{
      display: "inline-block", padding: "2px 9px", borderRadius: 99,
      fontSize: 11.5, fontWeight: 600, background: bg, color,
    }}>
      {score}%
    </span>
  );
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/logs`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const clearLogs = async () => {
    const token = window.prompt("Jeton d'administration requis pour effacer les logs :");
    if (!token) { setConfirmClear(false); return; }
    setClearing(true);
    try {
      const res = await fetch(`${API_URL}/logs`, {
        method: "DELETE",
        headers: { "X-Admin-Token": token },
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        window.alert(detail?.detail ?? "Échec de l'effacement des logs.");
        return;
      }
      setLogs([]);
    } finally {
      setClearing(false);
      setConfirmClear(false);
    }
  };

  const totalFichiers = logs.length;
  const totalLignes   = logs.reduce((s, l) => s + l.rows, 0);
  const scoresMoyen   = logs.length > 0
    ? Math.round(logs.reduce((s, l) => s + l.reliability_score, 0) / logs.length)
    : 0;
  const totalErreurs  = logs.reduce((s, l) => s + l.errors, 0);

  return (
    <div style={{ padding: "36px 44px" }}>

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
                Traçabilité
              </p>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "#0F1421", margin: 0, letterSpacing: "-0.5px" }}>
                Logs d'activité
              </h1>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={load}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8,
                border: "1px solid #E5E7EB", background: "white",
                fontSize: 13, fontWeight: 500, color: "#374151",
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
              Actualiser
            </button>
            {logs.length > 0 && !confirmClear && (
              <button
                onClick={() => setConfirmClear(true)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 8,
                  border: "1px solid #FCA5A5", background: "#FEF2F2",
                  fontSize: 13, fontWeight: 500, color: "#DC2626",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                Effacer les logs
              </button>
            )}
            {confirmClear && (
              <>
                <span style={{ fontSize: 13, color: "#6B7280", alignSelf: "center" }}>Confirmer ?</span>
                <button
                  onClick={clearLogs}
                  disabled={clearing}
                  style={{
                    padding: "8px 14px", borderRadius: 8, border: "none",
                    background: "#DC2626", color: "white",
                    fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {clearing ? "…" : "Oui, effacer"}
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  style={{
                    padding: "8px 14px", borderRadius: 8,
                    border: "1px solid #E5E7EB", background: "white",
                    fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "#374151",
                  }}
                >
                  Annuler
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {!loading && logs.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Fichiers traités", value: totalFichiers, color: "#6D28D9", bg: "#EDE9FE" },
            { label: "Lignes totales", value: totalLignes.toLocaleString("fr-FR"), color: "#0369A1", bg: "#E0F2FE" },
            { label: "Score moyen", value: `${scoresMoyen}%`, color: scoresMoyen >= 90 ? "#059669" : scoresMoyen >= 70 ? "#D97706" : "#DC2626", bg: "#F9FAFB" },
            { label: "Erreurs totales", value: totalErreurs, color: totalErreurs > 0 ? "#DC2626" : "#059669", bg: totalErreurs > 0 ? "#FEF2F2" : "#D1FAE5" },
          ].map(s => (
            <div key={s.label} style={{
              background: "white", borderRadius: 14, border: "1px solid #ECEEF2",
              padding: "16px 20px", boxShadow: "0 1px 2px rgba(15,20,33,0.04), 0 8px 24px -8px rgba(15,20,33,0.06)",
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{
        background: "white", borderRadius: 16, border: "1px solid #ECEEF2",
        overflow: "hidden", boxShadow: "0 1px 2px rgba(15,20,33,0.04), 0 8px 24px -8px rgba(15,20,33,0.08)",
      }}>
        {/* Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.8fr 2.2fr 0.9fr 0.7fr 0.9fr 0.7fr 0.7fr 1.2fr",
          padding: "11px 20px", background: "#FAFAFA",
          borderBottom: "1px solid #F3F4F6", gap: 12,
        }}>
          {["Date & heure", "Fichier", "Pays", "Lignes", "Score", "Erreurs", "Alertes", "Export"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.6px" }}>
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ width: 28, height: 28, border: `3px solid #F3F4F6`, borderTopColor: B, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 13, color: "#9CA3AF" }}>Chargement…</div>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "64px 20px", textAlign: "center" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: "#F3F4F6",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#6B7280", marginBottom: 4 }}>Aucun log pour le moment</div>
            <div style={{ fontSize: 13, color: "#9CA3AF" }}>Les traitements de fichiers apparaîtront ici automatiquement.</div>
          </div>
        ) : logs.map((log, i) => (
          <div
            key={log.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1.8fr 2.2fr 0.9fr 0.7fr 0.9fr 0.7fr 0.7fr 1.2fr",
              padding: "12px 20px", gap: 12, alignItems: "center",
              borderBottom: i < logs.length - 1 ? "1px solid #F9FAFB" : "none",
              transition: "background 0.1s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#FAFAFA"}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = ""}
          >
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: "#111827" }}>{fmtDate(log.timestamp)}</div>
            </div>

            <div style={{ overflow: "hidden" }}>
              <div style={{
                fontSize: 13, fontWeight: 500, color: "#111827",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }} title={log.filename}>
                {log.filename}
              </div>
            </div>

            <span style={{
              display: "inline-block", padding: "2px 8px", borderRadius: 6,
              fontSize: 11.5, fontWeight: 500,
              background: log.country === "France" ? "#EDE9FE" : "#E0F2FE",
              color: log.country === "France" ? "#6D28D9" : "#0369A1",
            }}>
              {log.country === "France" ? "🇫🇷 FR" : "🌍 Intl"}
            </span>

            <span style={{ fontSize: 13, color: "#6B7280" }}>{log.rows}</span>

            <ScoreBadge score={log.reliability_score} />

            <span style={{ fontSize: 13, fontWeight: 600, color: log.errors > 0 ? "#DC2626" : "#9CA3AF" }}>
              {log.errors > 0 ? log.errors : "—"}
            </span>

            <span style={{ fontSize: 13, fontWeight: 600, color: log.warnings > 0 ? "#D97706" : "#9CA3AF" }}>
              {log.warnings > 0 ? log.warnings : "—"}
            </span>

            <a
              href={`${API_URL}/download/${log.output_file}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 12, fontWeight: 500, color: B,
                textDecoration: "none",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {log.output_file.replace("output_", "")}
            </a>
          </div>
        ))}
      </div>

      {!loading && logs.length > 0 && (
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#9CA3AF" }}>
          {logs.length} entrée{logs.length > 1 ? "s" : ""} — 500 maximum conservées
        </div>
      )}
    </div>
  );
}
