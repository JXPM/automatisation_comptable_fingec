import type { Anomaly } from "../App";

type Props = {
  anomalies: Anomaly[] | null;
  loading: boolean;
  activeAnomaly: number | null;
  onSelectAnomaly: (index: number, rows: number[]) => void;
};

// Icônes SVG inline — pas d'emoji
function Icon({ name, size = 16, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const paths: Record<string, React.ReactNode> = {
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    check:  <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    alert:  <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    error:  <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>,
    info:   <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
    trending_down: <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>,
    balance: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    grid:   <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    repeat: <><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    receipt: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    package: <><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    bar_chart: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  };

  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      {paths[name]}
    </svg>
  );
}

// Icône et label par code — la couleur vient de la sévérité
const ANOMALY_META: Record<string, { icon: string; label: string }> = {
  NEGATIVE_SALES:    { icon: "trending_down", label: "Vente négative" },
  NEGATIVE_FEES:     { icon: "balance",       label: "Frais négatif" },
  NEGATIVE_SHIPPING: { icon: "package",       label: "Livraison négative" },
  TOTAL_MISMATCH:    { icon: "balance",       label: "Total incorrect" },
  MISSING_VALUE:     { icon: "grid",          label: "Donnée manquante" },
  VAT_INCOHERENCE:   { icon: "receipt",       label: "TVA incohérente" },
  OUTLIER:           { icon: "bar_chart",     label: "Montant inhabituel" },
  DUPLICATE:         { icon: "repeat",        label: "Doublon probable" },
  FUTURE_DATE:       { icon: "calendar",      label: "Date dans le futur" },
};

// Couleurs strictement basées sur la sévérité
const SEVERITY_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  error:   { color: "#b91c1c", bg: "#fff1f2", border: "#fecdd3" },
  warning: { color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
  info:    { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
};

export default function AnomalyConsole({ anomalies, loading, activeAnomaly, onSelectAnomaly }: Props) {
  const hasResults = anomalies !== null;
  const clean = hasResults && anomalies.length === 0;
  const errors = anomalies?.filter(a => a.severity === "error") ?? [];
  const warnings = anomalies?.filter(a => a.severity === "warning") ?? [];

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", minHeight: "calc(100vh - 57px)",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      fontSize: 13,
    }}>
      {/* En-tête */}
      <div style={{
        padding: "16px 20px",
        background: "white",
        borderBottom: "1px solid #e8e8ee",
        position: "sticky", top: 0, zIndex: 1,
      }}>
        <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", color: "#6b7280", fontWeight: 500, marginBottom: 2 }}>
          Analyse automatique
        </p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: "#1a1a2e" }}>
          Vérification des données
        </h2>
      </div>

      {/* Corps */}
      <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: 10, background: "#f9f9fb" }}>

        {/* En attente */}
        {!hasResults && !loading && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            flex: 1, gap: 12, textAlign: "center", padding: "40px 20px",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "#f0f0f4", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="search" size={22} color="#9ca3af" />
            </div>
            <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.6 }}>
              L'analyse s'affichera ici<br />après l'import du fichier.
            </p>
          </div>
        )}

        {/* Chargement */}
        {loading && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            flex: 1, gap: 14, textAlign: "center", padding: "40px 20px",
          }}>
            <div style={{
              width: 32, height: 32,
              border: "3px solid #e8e8ee", borderTopColor: "#7d1c34",
              borderRadius: "50%", animation: "spin 0.8s linear infinite",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: "#6b7280", fontSize: 13 }}>Analyse en cours…</p>
          </div>
        )}

        {/* Tout est bon */}
        {hasResults && !loading && clean && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            flex: 1, gap: 12, textAlign: "center", padding: "40px 20px",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="check" size={22} color="#16a34a" />
            </div>
            <p style={{ color: "#166534", fontWeight: 600, fontSize: 14 }}>Données correctes</p>
            <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.6 }}>
              Aucune anomalie détectée.<br />Le fichier est prêt à l'import.
            </p>
          </div>
        )}

        {/* Résumé + anomalies */}
        {hasResults && !loading && !clean && (
          <>
            {/* Compteurs */}
            <div style={{
              background: "white", border: "1px solid #e8e8ee",
              borderRadius: 10, padding: "14px 16px",
              display: "flex", gap: 0,
            }}>
              {errors.length > 0 && (
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 2 }}>
                    <Icon name="error" size={14} color="#dc2626" />
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#dc2626" }}>{errors.length}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Erreur{errors.length > 1 ? "s" : ""}
                  </div>
                </div>
              )}
              {errors.length > 0 && warnings.length > 0 && (
                <div style={{ width: 1, background: "#e8e8ee", margin: "0 4px" }} />
              )}
              {warnings.length > 0 && (
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 2 }}>
                    <Icon name="alert" size={14} color="#d97706" />
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#d97706" }}>{warnings.length}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Avertissement{warnings.length > 1 ? "s" : ""}
                  </div>
                </div>
              )}
            </div>

            {/* Cartes anomalies */}
            {anomalies.map((a, i) => {
              const meta = ANOMALY_META[a.code] ?? { icon: "alert", label: "Anomalie" };
              const cfg = { ...SEVERITY_STYLE[a.severity], ...meta };
              const isActive = activeAnomaly === i;
              return (
                <div
                  key={i}
                  onClick={() => onSelectAnomaly(i, a.rows)}
                  style={{
                    background: isActive ? cfg.bg : "white",
                    border: `1px solid ${isActive ? cfg.color : "#e8e8ee"}`,
                    borderRadius: 10,
                    padding: "12px 14px",
                    cursor: a.rows.length > 0 ? "pointer" : "default",
                    transition: "all 0.15s",
                    boxShadow: isActive ? `0 0 0 3px ${cfg.color}22` : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: isActive ? "white" : cfg.bg,
                        border: `1px solid ${cfg.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <Icon name={cfg.icon} size={14} color={cfg.color} />
                      </div>
                      <span style={{ fontWeight: 600, color: cfg.color, fontSize: 13 }}>
                        {a.message}
                      </span>
                    </div>
                    {a.rows.length > 0 && (
                      <span style={{
                        fontSize: 10, color: isActive ? cfg.color : "#9ca3af",
                        fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px",
                      }}>
                        {isActive ? "Masquer" : "Voir lignes"}
                      </span>
                    )}
                  </div>
                  <p style={{ color: "#374151", fontSize: 12, lineHeight: 1.6, marginBottom: a.rows.length > 0 ? 6 : 0 }}>
                    {a.detail || a.message}
                  </p>
                  {a.rows.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
                      <Icon name="grid" size={11} color={isActive ? cfg.color : "#9ca3af"} />
                      <p style={{ color: "#6b7280", fontSize: 11, margin: 0 }}>
                        <strong style={{ color: cfg.color }}>{a.rows.length} ligne{a.rows.length > 1 ? "s" : ""}</strong>
                        {" "}— {isActive ? "tableau filtré ci-dessous" : "cliquer pour filtrer le tableau"}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
