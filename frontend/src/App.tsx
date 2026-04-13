import { useState, useMemo } from "react";
import UploadForm from "./components/UploadForm";
import ResultTable from "./components/ResultTable";
import ValidationReport from "./components/ValidationReport";
import AnomalyConsole from "./components/AnomalyConsole";

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
    negative_values: number;
    rows: number;
    reliability_score: number;
    anomaly_count: number;
    errors: number;
    warnings: number;
  };
  anomalies: Anomaly[];
  preview: Record<string, string | number>[];
};

export default function App() {
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [highlightedRows, setHighlightedRows] = useState<number[]>([]);
  const [activeAnomaly, setActiveAnomaly] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  // Map rowIndex -> sévérité la plus grave parmi toutes les anomalies
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
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Colonne principale */}
        <main className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
            <img
              src="/fingec-icon.png"
              alt=""
              style={{ height: 64, width: 64, objectFit: "contain", flexShrink: 0, marginTop: 2 }}
            />
            <div>
              <p className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: "#7d1c34" }}>
                Préparation des écritures
              </p>
              <h1 className="text-2xl font-bold text-gray-900">Automatisation comptable</h1>
              <p className="text-gray-500 mt-1 text-sm">
                Importe un fichier CSV ou Excel, choisis le pays, génère le fichier Quadra.
              </p>
            </div>
          </div>

          <UploadForm
            onResult={(data) => {
              setResult(data);
              setError(null);
              setHighlightedRows([]);
              setActiveAnomaly(null);
            }}
            onError={(msg) => { setError(msg); setResult(null); }}
            onLoading={setLoading}
            loading={loading}
          />

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {result && (
            <>
              <ValidationReport report={result.report} output={result.output} />
              {result.preview.length > 0 && (
                <ResultTable
                  rows={result.preview}
                  highlightedRows={highlightedRows}
                  rowSeverityMap={rowSeverityMap}
                  activeSeverity={activeAnomaly !== null ? (result.anomalies[activeAnomaly]?.severity === "error" ? "error" : "warning") : null}
                  filtered={activeAnomaly !== null}
                />
              )}
            </>
          )}
        </main>

        {/* Bouton toggle flottant */}
        <button
          onClick={() => setPanelOpen(o => !o)}
          title={panelOpen ? "Masquer l'analyse" : "Afficher l'analyse"}
          style={{
            position: "fixed", right: panelOpen ? 348 : 8, top: "50%",
            transform: "translateY(-50%)",
            width: 24, height: 48, borderRadius: "6px 0 0 6px",
            background: "white", border: "1px solid #e8e8ee",
            borderRight: panelOpen ? "none" : "1px solid #e8e8ee",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "-2px 0 8px rgba(0,0,0,0.06)",
            transition: "right 0.25s ease",
            zIndex: 10,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {panelOpen
              ? <><polyline points="15 18 9 12 15 6"/></>
              : <><polyline points="9 18 15 12 9 6"/></>
            }
          </svg>
        </button>

        {/* Console anomalies */}
        <aside
          className="flex-shrink-0 overflow-y-auto"
          style={{
            width: panelOpen ? 340 : 0,
            background: "#f9f9fb",
            borderLeft: panelOpen ? "1px solid #e8e8ee" : "none",
            overflow: "hidden",
            transition: "width 0.25s ease",
          }}
        >
          <div style={{ width: 340 }}>
            <AnomalyConsole
              anomalies={result?.anomalies ?? null}
              loading={loading}
              activeAnomaly={activeAnomaly}
              onSelectAnomaly={handleSelectAnomaly}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
