import { useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { Anomaly } from "../pages/TraitementPage";
import { B } from "../theme";

type Props = {
  anomalies: Anomaly[] | null;
  loading: boolean;
  activeAnomaly: number | null;
  onSelectAnomaly: (index: number, rows: number[]) => void;
};

const EASE = [0.22, 1, 0.36, 1] as const;

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
    scan:   <><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="3" y1="12" x2="21" y2="12"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></>,
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

const SEVERITY_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  error:   { color: "#b91c1c", bg: "#fff1f2", border: "#fecdd3" },
  warning: { color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
  info:    { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
};

/** Smooth count-up of an integer value. */
function AnimatedCount({ value, color }: { value: number; color: string }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 110, damping: 22, mass: 0.5 });
  const display = useTransform(spring, (v) => Math.round(v).toString());
  useEffect(() => { mv.set(value); }, [value, mv]);
  return <motion.span style={{ color }}>{display}</motion.span>;
}

export default function AnomalyConsole({ anomalies, loading, activeAnomaly, onSelectAnomaly }: Props) {
  const hasResults = anomalies !== null;
  const clean = hasResults && anomalies.length === 0;
  const errors = anomalies?.filter(a => a.severity === "error") ?? [];
  const warnings = anomalies?.filter(a => a.severity === "warning") ?? [];

  // Header state — drives the dynamic indicator
  const state: "idle" | "scanning" | "clean" | "issues" =
    loading ? "scanning"
    : !hasResults ? "idle"
    : clean ? "clean"
    : "issues";

  const STATE_CFG = {
    scanning: { label: "Analyse",     color: B,         dot: B },
    clean:    { label: "Validé",      color: "#16a34a", dot: "#16a34a" },
    issues:   { label: "À vérifier",  color: "#b91c1c", dot: "#b91c1c" },
  } as const;

  const cfg = state !== "idle" ? STATE_CFG[state] : null;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", minHeight: "calc(100vh - 57px)",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      fontSize: 13,
    }}>
      {/* ── HEADER (sticky, dynamique) ── */}
      <div style={{
        background: `
          linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(249,249,251,0.92) 100%),
          radial-gradient(180px 80px at 0% 0%, ${B}10, transparent 70%)
        `,
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #e8e8ee",
        position: "sticky", top: 0, zIndex: 2,
        overflow: "hidden",
      }}>
        {/* Filet d'accent en haut */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent 0%, ${B}55 30%, ${B}aa 50%, ${B}55 70%, transparent 100%)`,
          opacity: 0.55,
        }} />

        <div style={{ padding: "18px 20px 14px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              {/* Eyebrow avec petit motif */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{
                  width: 5, height: 5, borderRadius: 1.5,
                  background: `linear-gradient(135deg, ${B} 0%, #C13049 100%)`,
                  boxShadow: `0 1px 3px ${B}66`,
                  transform: "rotate(45deg)",
                }} />
                <p style={{
                  fontSize: 10, textTransform: "uppercase", letterSpacing: "1.6px",
                  color: B, fontWeight: 700, margin: 0,
                }}>
                  Analyse automatique
                </p>
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#1a1a2e",
                fontWeight: 600, letterSpacing: "-0.3px", margin: 0,
              }}>
                Vérification des données
              </h2>
            </div>

            {/* État dynamique en pill — masqué en idle */}
            <AnimatePresence mode="wait">
              {cfg && (
                <motion.div
                  key={state}
                  initial={{ opacity: 0, y: -4, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.94 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "5px 11px 5px 8px", borderRadius: 99,
                    background: `${cfg.color}10`,
                    border: `1px solid ${cfg.color}33`,
                    fontSize: 10.5, fontWeight: 600, color: cfg.color,
                    textTransform: "uppercase", letterSpacing: "0.6px",
                    whiteSpace: "nowrap", flexShrink: 0,
                    boxShadow: `0 4px 12px -4px ${cfg.color}33`,
                  }}
                >
                  <motion.span
                    animate={
                      loading
                        ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }
                        : state === "issues"
                        ? { scale: [1, 1.2, 1] }
                        : { opacity: [1, 0.55, 1] }
                    }
                    transition={{
                      duration: loading ? 1 : state === "issues" ? 1.6 : 2.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: cfg.dot,
                      boxShadow: `0 0 8px ${cfg.dot}99`,
                      display: "inline-block",
                    }}
                  />
                  {cfg.label}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Barre de progression / scan */}
        <div style={{ position: "relative", height: 2, background: "#f1f1f5" }}>
          {loading ? (
            <motion.div
              key="scan-bar"
              initial={{ x: "-40%" }}
              animate={{ x: "140%" }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              style={{
                position: "absolute", top: 0, height: "100%", width: "40%",
                background: `linear-gradient(90deg, transparent 0%, ${B} 50%, transparent 100%)`,
              }}
            />
          ) : hasResults ? (
            <motion.div
              key={`bar-${state}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, ease: EASE }}
              style={{
                position: "absolute", inset: 0, transformOrigin: "left",
                background: clean
                  ? "linear-gradient(90deg, #16a34a 0%, #4ade80 100%)"
                  : `linear-gradient(90deg, #b91c1c 0%, #f87171 100%)`,
              }}
            />
          ) : null}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{
        flex: 1, padding: "18px 16px 24px",
        display: "flex", flexDirection: "column", gap: 10,
        background: `
          radial-gradient(400px 200px at 100% 0%, ${B}08, transparent 60%),
          radial-gradient(500px 300px at 0% 100%, ${B}06, transparent 60%),
          linear-gradient(180deg, #fafafc 0%, #f4f4f7 100%)
        `,
        overflowX: "hidden",
        position: "relative",
      }}>

        <AnimatePresence mode="wait">

          {/* Idle */}
          {!hasResults && !loading && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                flex: 1, gap: 14, textAlign: "center", padding: "40px 20px",
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: "linear-gradient(140deg, #f4f4f8 0%, #e8e8ee 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 8px -2px rgba(15,20,33,0.08)",
                  position: "relative",
                }}
              >
                <motion.div
                  animate={{ opacity: [0, 0.35, 0], scale: [0.9, 1.4, 1.6] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                  style={{
                    position: "absolute", inset: 0, borderRadius: 14,
                    border: "2px solid #d1d5db",
                  }}
                />
                <Icon name="search" size={22} color="#9ca3af" />
              </motion.div>
              <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                L'analyse s'affichera ici<br />après l'import du fichier.
              </p>
            </motion.div>
          )}

          {/* Loading — scan vivant */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                flex: 1, gap: 16, textAlign: "center", padding: "40px 20px",
              }}
            >
              {/* Cadre de scan */}
              <div style={{
                position: "relative", width: 72, height: 72,
                borderRadius: 16,
                background: "white",
                border: `1px solid ${B}30`,
                boxShadow: `0 4px 14px -4px ${B}33, inset 0 1px 0 rgba(255,255,255,0.9)`,
                overflow: "hidden",
              }}>
                {/* Lignes de "données" simulées */}
                {[12, 24, 36, 48, 60].map((y, i) => (
                  <motion.div
                    key={i}
                    initial={{ width: "30%", opacity: 0.3 }}
                    animate={{ width: ["30%", "70%", "45%", "60%"], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.18 }}
                    style={{
                      position: "absolute", left: 12, top: y, height: 3,
                      borderRadius: 2, background: `${B}55`,
                    }}
                  />
                ))}
                {/* Faisceau de scan */}
                <motion.div
                  animate={{ y: [0, 72, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    position: "absolute", left: 0, right: 0, top: 0, height: 14,
                    background: `linear-gradient(180deg, transparent 0%, ${B}66 50%, transparent 100%)`,
                    pointerEvents: "none",
                  }}
                />
                {/* Icône au centre */}
                <div style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name="scan" size={20} color={B} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <p style={{ color: "#1a1a2e", fontSize: 13.5, fontWeight: 600, margin: 0 }}>Analyse en cours</p>
                <motion.p
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  style={{ color: "#6b7280", fontSize: 12, margin: 0 }}
                >
                  Vérification des montants, doublons et incohérences…
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* Clean */}
          {hasResults && !loading && clean && (
            <motion.div
              key="clean"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: EASE }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                flex: 1, gap: 14, textAlign: "center", padding: "40px 20px",
              }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.05 }}
                style={{
                  width: 60, height: 60, borderRadius: "50%",
                  background: "linear-gradient(140deg, #dcfce7 0%, #bbf7d0 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 16px -4px rgba(34,197,94,0.4)",
                  position: "relative",
                }}
              >
                <motion.div
                  animate={{ opacity: [0, 0.4, 0], scale: [0.9, 1.4, 1.6] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
                  style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    border: "2px solid #4ade80",
                  }}
                />
                <Icon name="shield" size={26} color="#16a34a" />
              </motion.div>
              <div>
                <p style={{ color: "#166534", fontWeight: 600, fontSize: 14.5, margin: 0 }}>Données validées</p>
                <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.6, marginTop: 5, marginBottom: 0 }}>
                  Aucune anomalie détectée.<br />Le fichier est prêt à l'import.
                </p>
              </div>
            </motion.div>
          )}

          {/* Issues */}
          {hasResults && !loading && !clean && (
            <motion.div
              key="issues"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              {/* Compteurs */}
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                style={{
                  background: "linear-gradient(180deg, #ffffff 0%, #fbfbfd 100%)",
                  border: "1px solid #e8e8ee",
                  borderRadius: 14, padding: "16px 16px",
                  display: "flex", gap: 0,
                  boxShadow: "0 1px 2px rgba(15,20,33,0.03), 0 8px 22px -10px rgba(15,20,33,0.10)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {errors.length > 0 && (
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 2 }}>
                      <motion.span
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        style={{ display: "inline-flex" }}
                      >
                        <Icon name="error" size={14} color="#dc2626" />
                      </motion.span>
                      <span style={{ fontSize: 22, fontWeight: 700, color: "#dc2626", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px" }}>
                        <AnimatedCount value={errors.length} color="#dc2626" />
                      </span>
                    </div>
                    <div style={{ fontSize: 10.5, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600 }}>
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
                      <span style={{ fontSize: 22, fontWeight: 700, color: "#d97706", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px" }}>
                        <AnimatedCount value={warnings.length} color="#d97706" />
                      </span>
                    </div>
                    <div style={{ fontSize: 10.5, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600 }}>
                      Avertissement{warnings.length > 1 ? "s" : ""}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Cartes anomalies */}
              {anomalies.map((a, i) => {
                const meta = ANOMALY_META[a.code] ?? { icon: "alert", label: "Anomalie" };
                const sev = SEVERITY_STYLE[a.severity];
                const isActive = activeAnomaly === i;
                const clickable = a.rows.length > 0;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 + i * 0.05, duration: 0.4, ease: EASE }}
                    whileHover={clickable ? { x: -2 } : undefined}
                    onClick={() => clickable && onSelectAnomaly(i, a.rows)}
                    style={{
                      background: isActive
                        ? `linear-gradient(180deg, ${sev.bg} 0%, ${sev.bg}cc 100%)`
                        : "linear-gradient(180deg, #ffffff 0%, #fbfbfd 100%)",
                      border: `1px solid ${isActive ? sev.color : "#e8e8ee"}`,
                      borderRadius: 12,
                      padding: "13px 14px 13px 16px",
                      cursor: clickable ? "pointer" : "default",
                      boxShadow: isActive
                        ? `0 0 0 3px ${sev.color}1f, 0 8px 20px -8px ${sev.color}55`
                        : "0 1px 2px rgba(15,20,33,0.03), 0 4px 12px -8px rgba(15,20,33,0.06)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Barre latérale active */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          exit={{ scaleY: 0 }}
                          transition={{ duration: 0.25, ease: EASE }}
                          style={{
                            position: "absolute", left: 0, top: 8, bottom: 8,
                            width: 3, borderRadius: "0 3px 3px 0",
                            background: sev.color,
                            transformOrigin: "center",
                          }}
                        />
                      )}
                    </AnimatePresence>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5, gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                        <motion.div
                          animate={isActive ? { rotate: [0, -6, 6, 0] } : { rotate: 0 }}
                          transition={{ duration: 0.4, ease: EASE }}
                          style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: isActive ? "white" : sev.bg,
                            border: `1px solid ${sev.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                            boxShadow: isActive ? `0 2px 6px -2px ${sev.color}44` : "none",
                          }}
                        >
                          <Icon name={meta.icon} size={14} color={sev.color} />
                        </motion.div>
                        <span style={{ fontWeight: 600, color: sev.color, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {a.message}
                        </span>
                      </div>
                      {clickable && (
                        <motion.span
                          animate={{ opacity: isActive ? 1 : 0.65 }}
                          style={{
                            fontSize: 10, color: isActive ? sev.color : "#9ca3af",
                            fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px",
                            whiteSpace: "nowrap", flexShrink: 0,
                          }}
                        >
                          {isActive ? "Masquer" : "Voir"}
                        </motion.span>
                      )}
                    </div>

                    <p style={{ color: "#374151", fontSize: 12, lineHeight: 1.6, marginBottom: clickable ? 6 : 0, marginTop: 0 }}>
                      {a.detail || a.message}
                    </p>

                    {clickable && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
                        <Icon name="grid" size={11} color={isActive ? sev.color : "#9ca3af"} />
                        <p style={{ color: "#6b7280", fontSize: 11, margin: 0 }}>
                          <strong style={{ color: sev.color }}>{a.rows.length} ligne{a.rows.length > 1 ? "s" : ""}</strong>
                          {" "}— {isActive ? "tableau filtré ci-dessous" : "cliquer pour filtrer"}
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
