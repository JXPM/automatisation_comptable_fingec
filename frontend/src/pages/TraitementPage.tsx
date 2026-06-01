import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UploadForm from "../components/UploadForm";
import ResultTable from "../components/ResultTable";
import ValidationReport from "../components/ValidationReport";
import AnomalyConsole from "../components/AnomalyConsole";
import { B } from "../theme";

const EASE = [0.22, 1, 0.36, 1] as const;

export type Anomaly = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  rows: number[];
  detail: string;
};

export type ProcessResult = {
  message: string;
  output: string;
  report: {
    missing_values: number;
    rows: number;
    reliability_score: number;
    anomaly_count: number;
    errors: number;
    warnings: number;
  };
  anomalies: Anomaly[];
  preview: Record<string, string | number>[];
};

const SESSION_KEY = "fingec_traitement";

function loadSession(): { result: ProcessResult; filename: string; country: string } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function TraitementPage() {
  // Lazy initializers — la session n'est lue qu'au montage, pas à chaque render.
  const [result, setResult] = useState<ProcessResult | null>(() => loadSession()?.result ?? null);
  const [uploadedFilename, setUploadedFilename] = useState(() => loadSession()?.filename ?? "");
  const [uploadedCountry, setUploadedCountry] = useState(() => loadSession()?.country ?? "France");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Persist result in sessionStorage whenever it changes
  useEffect(() => {
    if (result) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ result, filename: uploadedFilename, country: uploadedCountry }));
    }
  }, [result, uploadedFilename, uploadedCountry]);
  const [highlightedRows, setHighlightedRows] = useState<number[]>([]);
  const [activeAnomaly, setActiveAnomaly] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  const rowSeverityMap = useMemo(() => {
    const map: Record<number, "error" | "warning"> = {};
    for (const a of result?.anomalies ?? []) {
      for (const r of a.rows) {
        if (a.severity === "error" || map[r] !== "error") {
          map[r] = a.severity === "error" ? "error" : "warning";
        }
      }
    }
    return map;
  }, [result]);

  const handleSelectAnomaly = (index: number, rows: number[]) => {
    if (activeAnomaly === index) {
      setActiveAnomaly(null);
      setHighlightedRows([]);
    } else {
      setActiveAnomaly(index);
      setHighlightedRows(rows);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>

      {/* Colonne principale — scroll géré par le main du Layout */}
      <div style={{ flex: 1, padding: "36px 40px", display: "flex", flexDirection: "column", gap: 22 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{ display: "flex", alignItems: "center", gap: 14 }}
        >
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.15, duration: 0.45, ease: EASE }}
            style={{
              width: 4, height: 44, borderRadius: 2, transformOrigin: "top",
              background: `linear-gradient(180deg, ${B} 0%, #9d2440 100%)`,
              boxShadow: `0 4px 12px -4px ${B}66`,
            }}
          />
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase", color: B, marginBottom: 4 }}>
              Préparation des écritures
            </p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "#0F1421", margin: 0, letterSpacing: "-0.5px" }}>
              Automatisation comptable
            </h1>
            <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>
              Importe un fichier TikTok ou Shopify, choisis le pays, génère l'export Quadra.
            </p>
          </div>
        </motion.div>

        {/* Upload card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5, ease: EASE }}
          style={{
            background: "white", borderRadius: 16, border: "1px solid #ECEEF2",
            padding: "26px 28px",
            boxShadow: "0 1px 2px rgba(15,20,33,0.04), 0 8px 24px -8px rgba(15,20,33,0.08)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Animated gradient top bar */}
          <motion.div
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, ${B} 0%, #c0395a 25%, #9d2440 50%, #c0395a 75%, ${B} 100%)`,
              backgroundSize: "200% 100%",
            }}
          />
          <UploadForm
            onResult={(data, filename, country) => {
              setResult(data);
              setUploadedFilename(filename);
              setUploadedCountry(country);
              setError(null);
              setHighlightedRows([]);
              setActiveAnomaly(null);
            }}
            onError={(msg) => { setError(msg); setResult(null); }}
            onLoading={setLoading}
            loading={loading}
          />
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              key="err"
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              style={{
                padding: "13px 18px", borderRadius: 12,
                background: "linear-gradient(180deg, #FEF2F2, #FEE9E9)",
                border: "1px solid #FECACA",
                fontSize: 13, color: "#B91C1C",
                display: "flex", alignItems: "center", gap: 10,
                boxShadow: "0 2px 8px -2px rgba(185,28,28,0.12)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease: EASE }}
              style={{ display: "flex", flexDirection: "column", gap: 22 }}
            >
              <ValidationReport
                report={result.report}
                output={result.output}
                filename={uploadedFilename}
                country={uploadedCountry}
                anomalies={result.anomalies}
                preview={result.preview}
              />
              {result.preview.length > 0 && (
                <ResultTable
                  rows={result.preview}
                  highlightedRows={highlightedRows}
                  rowSeverityMap={rowSeverityMap}
                  activeSeverity={activeAnomaly !== null ? (result.anomalies[activeAnomaly]?.severity === "error" ? "error" : "warning") : null}
                  filtered={activeAnomaly !== null}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Panneau anomalies — sticky : reste visible pendant le scroll */}
      <motion.aside
        animate={{ width: panelOpen ? 348 : 0 }}
        transition={{ duration: 0.32, ease: EASE }}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          flexShrink: 0,
          background: "linear-gradient(180deg, #FAFBFC 0%, #F4F5F7 100%)",
          borderLeft: panelOpen ? "1px solid #ECEEF2" : "none",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <div style={{ width: 348 }}>
          <AnomalyConsole
            anomalies={result?.anomalies ?? null}
            loading={loading}
            activeAnomaly={activeAnomaly}
            onSelectAnomaly={handleSelectAnomaly}
          />
        </div>
      </motion.aside>

      {/* Bouton toggle — fixed pour ne pas être clippé par overflow */}
      <motion.button
        onClick={() => setPanelOpen(o => !o)}
        title={panelOpen ? "Masquer le panneau" : "Afficher le panneau"}
        animate={{ right: panelOpen ? 348 : 0 }}
        transition={{ duration: 0.32, ease: EASE }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        style={{
          position: "fixed",
          top: "50%",
          transform: "translateY(-50%)",
          width: 28, height: 56, borderRadius: "10px 0 0 10px",
          background: "linear-gradient(180deg, #ffffff 0%, #f8f8fa 100%)",
          border: "1px solid #ECEEF2", borderRight: "none",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "-6px 0 18px -6px rgba(15,20,33,0.14), inset 1px 0 0 rgba(255,255,255,0.7)",
          zIndex: 30,
          padding: 0,
        }}
      >
        <motion.svg
          animate={{ rotate: panelOpen ? 0 : 180 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6"/>
        </motion.svg>
      </motion.button>
    </div>
  );
}
