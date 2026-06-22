import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UploadForm from "../components/UploadForm";
import ResultTable from "../components/ResultTable";
import ValidationReport from "../components/ValidationReport";
import AnomalyConsole from "../components/AnomalyConsole";
import PageHeader from "../components/PageHeader";
import { B } from "../theme";

const EASE = [0.22, 1, 0.36, 1] as const;

export type Anomaly = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  rows: number[];
  detail: string;
};

export type JournalLine = {
  code: string;
  date: string;
  compte: string;
  libelle: string;
  debit: number | null;
  credit: number | null;
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
  journal: string | null;
  journal_preview: JournalLine[];
  journal_balance: { debit: number; credit: number; balanced: boolean; lines: number } | null;
  journal_notes: string[];
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
        <PageHeader
          eyebrow="Préparation des écritures"
          title="Automatisation comptable"
          subtitle="Importe un fichier TikTok ou Shopify, choisis le pays, génère l'export Quadra."
          style={{ marginBottom: 0 }}
        />

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
              background: `linear-gradient(90deg, ${B} 0%, #D6435C 25%, #C13049 50%, #D6435C 75%, ${B} 100%)`,
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: EASE }}
              style={{ display: "flex", flexDirection: "column", gap: 22 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <ValidationReport
                  report={result.report}
                  output={result.output}
                  filename={uploadedFilename}
                  country={uploadedCountry}
                  anomalies={result.anomalies}
                  preview={result.preview}
                  journal={result.journal}
                  journalBalance={result.journal_balance}
                  journalNotes={result.journal_notes}
                />
              </motion.div>
              {result.preview.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.12 }}
                >
                  <ResultTable
                    rows={result.preview}
                    highlightedRows={highlightedRows}
                    rowSeverityMap={rowSeverityMap}
                    activeSeverity={activeAnomaly !== null ? (result.anomalies[activeAnomaly]?.severity === "error" ? "error" : "warning") : null}
                    filtered={activeAnomaly !== null}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* État vide — guide de prise en main, masqué dès qu'un traitement démarre */}
        <AnimatePresence>
          {!result && !loading && !error && (
            <motion.div
              key="howto"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 11, margin: "4px 0 14px" }}>
                <span style={{ width: 4, height: 16, borderRadius: 2, background: B }} />
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#141A26" }}>Comment ça marche</h2>
              </div>
              <div style={{
                background: "white", border: "1px solid #E9EBF0", borderRadius: 16,
                boxShadow: "0 1px 2px rgba(15,20,33,0.03)",
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)", overflow: "hidden",
              }}>
                {[
                  { n: 1, title: "Importer le fichier", desc: "Dépose ton export TikTok (.xlsx) ou Shopify (.csv) et choisis le pays.",
                    icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></> },
                  { n: 2, title: "Contrôle qualité", desc: "Détection automatique des anomalies et calcul d'un score de fiabilité.",
                    icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></> },
                  { n: 3, title: "Export Quadra", desc: "Télécharge le journal d'écritures (.xlsx) prêt à importer dans Quadra.",
                    icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></> },
                ].map((s, i) => (
                  <div key={s.title} style={{
                    padding: "22px 24px", borderRight: i < 2 ? "1px solid #E9EBF0" : "none",
                    display: "flex", flexDirection: "column", gap: 13,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <span style={{
                        width: 30, height: 30, borderRadius: "50%", background: B, color: "white",
                        fontSize: 13, fontWeight: 700, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{s.n}</span>
                      <span style={{
                        width: 32, height: 32, borderRadius: 9, background: "#F3F4F7", color: "#9CA3AF",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#141A26", marginBottom: 4 }}>{s.title}</div>
                      <div style={{ fontSize: 12.5, color: "#6B7280", lineHeight: 1.5 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: "#9CA3AF" }}>
                Formats acceptés : TikTok .xlsx (feuille «&nbsp;Statement&nbsp;») · Shopify .csv
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Panneau de vérification — n'apparaît qu'une fois un traitement lancé */}
      {(result || loading) && (
        <>
      {/* Panneau anomalies — sticky : reste visible pendant le scroll */}
      <motion.aside
        initial={{ opacity: 0, x: 48 }}
        animate={{ opacity: 1, x: 0, width: panelOpen ? 348 : 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{
          position: "sticky",
          top: 24,
          alignSelf: "flex-start",          // hauteur = contenu, pas pleine hauteur
          maxHeight: "calc(100vh - 48px)",  // borne : défilement interne au-delà
          marginTop: 36,                    // démarre au niveau du contenu (pas collé en haut)
          marginBottom: 24,
          flexShrink: 0,
          background: "linear-gradient(180deg, #FAFBFC 0%, #F4F5F7 100%)",
          border: panelOpen ? "1px solid #ECEEF2" : "none",
          borderRadius: panelOpen ? "16px 0 0 16px" : 0,
          boxShadow: panelOpen ? "0 1px 2px rgba(15,20,33,0.04), 0 8px 24px -10px rgba(15,20,33,0.10)" : "none",
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
        </>
      )}
    </div>
  );
}
