import { useState } from "react";
import type { Anomaly, ProcessResult } from "../pages/TraitementPage";
import { B } from "../theme";
import { API_URL } from "../utils/api";

type Props = {
  report: ProcessResult["report"];
  output: string;
  filename: string;
  country: string;
  anomalies: Anomaly[];
  preview: ProcessResult["preview"];
};

export default function ValidationReport({ report, output, filename, country, anomalies, preview }: Props) {
  const [exporting, setExporting] = useState(false);

  const scoreColor =
    report.reliability_score >= 90 ? "#059669"
    : report.reliability_score >= 70 ? "#D97706"
    : "#DC2626";

  const scoreBarColor =
    report.reliability_score >= 90 ? "#10B981"
    : report.reliability_score >= 70 ? "#F59E0B"
    : "#EF4444";

  const handlePdf = async () => {
    setExporting(true);
    try {
      const { exportValidationPdf } = await import("../utils/exportPdf");
      exportValidationPdf(report, anomalies, preview, filename, country);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{
      background: "white", borderRadius: 16,
      border: "1px solid #ECEEF2", padding: "24px 26px",
      boxShadow: "0 1px 2px rgba(15,20,33,0.04), 0 8px 24px -8px rgba(15,20,33,0.08)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: B, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 5 }}>
            Résultats
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#0F1421", margin: 0, letterSpacing: "-0.3px" }}>Rapport de validation</h2>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {/* Bouton PDF */}
          <button
            onClick={handlePdf}
            disabled={exporting}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 16px", borderRadius: 10,
              border: "1px solid #E2E5EC", background: "white",
              fontSize: 13, fontWeight: 500, color: "#374151",
              cursor: exporting ? "default" : "pointer",
              fontFamily: "inherit",
              boxShadow: "0 1px 2px rgba(15,20,33,0.05)",
              opacity: exporting ? 0.6 : 1,
              transition: "all 0.15s var(--ease)",
            }}
            onMouseEnter={(e) => { if (!exporting) { e.currentTarget.style.borderColor = "#CBD2DD"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px -4px rgba(15,20,33,0.12)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E2E5EC"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,20,33,0.05)"; }}
          >
            {exporting ? (
              <span style={{ width: 14, height: 14, border: "2px solid #D1D5DB", borderTopColor: B, borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            )}
            {exporting ? "Génération…" : "Exporter PDF"}
          </button>

          {/* Bouton Excel */}
          <a
            href={`${API_URL}/download/${output}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 10,
              border: "none",
              background: `linear-gradient(135deg, ${B} 0%, #9d2440 100%)`,
              fontSize: 13, fontWeight: 600, color: "white",
              textDecoration: "none", fontFamily: "inherit",
              boxShadow: "0 6px 16px -6px rgba(125,28,52,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
              transition: "transform 0.15s var(--ease), box-shadow 0.2s var(--ease)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 10px 22px -6px rgba(125,28,52,0.55), inset 0 1px 0 rgba(255,255,255,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 6px 16px -6px rgba(125,28,52,0.5), inset 0 1px 0 rgba(255,255,255,0.15)"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Télécharger Excel
          </a>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Lignes traitées", value: report.rows, color: "#0F1421" },
          { label: "Erreurs", value: report.errors, color: report.errors > 0 ? "#DC2626" : "#0F1421" },
          { label: "Avertissements", value: report.warnings, color: report.warnings > 0 ? "#D97706" : "#0F1421" },
          { label: "Score de fiabilité", value: `${report.reliability_score}%`, color: scoreColor },
        ].map(s => (
          <div key={s.label} style={{
            background: "linear-gradient(180deg, #FAFBFC 0%, #F4F6F8 100%)",
            borderRadius: 12,
            border: "1px solid #ECEEF2", padding: "14px 16px",
            transition: "transform 0.15s var(--ease)",
          }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ height: 7, background: "#F1F2F5", borderRadius: 99, overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(15,20,33,0.06)" }}>
        <div style={{
          height: "100%", borderRadius: 99,
          background: `linear-gradient(90deg, ${scoreBarColor}, ${scoreBarColor}cc)`,
          width: `${report.reliability_score}%`,
          transition: "width 1s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: `0 0 12px ${scoreBarColor}66`,
        }} />
      </div>
    </div>
  );
}
