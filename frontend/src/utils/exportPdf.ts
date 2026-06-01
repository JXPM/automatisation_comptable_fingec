import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Anomaly, ProcessResult } from "../pages/TraitementPage";
import { BURGUNDY_RGB } from "../theme";

const BURGUNDY = BURGUNDY_RGB;
const DARK: [number, number, number] = [31, 41, 55];

function fmtNum(v: string | number, key: string): string {
  if (key === "date") return String(v).split("T")[0];
  if (typeof v === "number") return v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return String(v);
}

export function exportValidationPdf(
  report: ProcessResult["report"],
  anomalies: Anomaly[],
  preview: ProcessResult["preview"],
  filename: string,
  country: string,
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  // ── HEADER BANNER ─────────────────────────────────────────
  doc.setFillColor(...BURGUNDY);
  doc.rect(0, 0, 210, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("FINGEC", 14, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Rapport de validation comptable", 14, 21);

  doc.setFontSize(8.5);
  doc.text(today, 196, 12, { align: "right" });
  doc.text(filename, 196, 20, { align: "right" });

  // ── META LINE ─────────────────────────────────────────────
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8.5);
  doc.text(`Pays : ${country}   ·   Lignes traitées : ${report.rows}   ·   Score de fiabilité : ${report.reliability_score}%`, 14, 38);

  // ── STATS TABLE ───────────────────────────────────────────
  autoTable(doc, {
    startY: 43,
    head: [["Lignes traitées", "Score de fiabilité", "Erreurs", "Avertissements", "Valeurs manquantes"]],
    body: [[
      report.rows,
      `${report.reliability_score}%`,
      report.errors,
      report.warnings,
      report.missing_values,
    ]],
    headStyles: { fillColor: BURGUNDY, textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 11, fontStyle: "bold", halign: "center" },
    columnStyles: {
      1: { textColor: report.reliability_score >= 90 ? [5, 150, 105] : report.reliability_score >= 70 ? [180, 83, 9] : [185, 28, 28] },
      2: { textColor: report.errors > 0 ? [185, 28, 28] : [31, 41, 55] },
      3: { textColor: report.warnings > 0 ? [180, 83, 9] : [31, 41, 55] },
    },
    margin: { left: 14, right: 14 },
    theme: "grid",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let y: number = (doc as any).lastAutoTable.finalY + 12;

  // ── ANOMALIES ─────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  if (anomalies.length === 0) {
    doc.setTextColor(5, 150, 105);
    doc.text("✓  Aucune anomalie détectée — données conformes", 14, y);
    y += 12;
  } else {
    doc.setTextColor(...BURGUNDY);
    doc.text(`Anomalies détectées (${anomalies.length})`, 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [["Sévérité", "Code", "Description", "Lignes concernées"]],
      body: anomalies.map(a => [
        a.severity.toUpperCase(),
        a.code,
        a.detail || a.message,
        a.rows.length > 0
          ? a.rows.slice(0, 12).join(", ") + (a.rows.length > 12 ? ` (+${a.rows.length - 12})` : "")
          : "—",
      ]),
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 24, fontStyle: "bold", halign: "center" },
        1: { cellWidth: 40 },
        3: { cellWidth: 36 },
      },
      willDrawCell: (data) => {
        if (data.section === "body" && data.column.index === 0) {
          const val = String(data.cell.text[0]);
          if (val === "ERROR")   data.cell.styles.textColor = [185, 28, 28];
          if (val === "WARNING") data.cell.styles.textColor = [180, 83, 9];
          if (val === "INFO")    data.cell.styles.textColor = [37, 99, 235];
        }
      },
      margin: { left: 14, right: 14 },
      theme: "striped",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // ── DATA PREVIEW ──────────────────────────────────────────
  if (preview.length > 0) {
    doc.setTextColor(...BURGUNDY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Aperçu des données (${Math.min(preview.length, 50)} premières lignes)`, 14, y);
    y += 5;

    const cols = Object.keys(preview[0]);
    const rows = preview.slice(0, 50).map(r => cols.map(c => fmtNum(r[c], c)));

    autoTable(doc, {
      startY: y,
      head: [cols.map(c => c.replace(/_/g, " ").toUpperCase())],
      body: rows,
      headStyles: { fillColor: BURGUNDY, textColor: [255, 255, 255], fontSize: 7, fontStyle: "bold" },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: cols.reduce((acc, _, i) => ({ ...acc, [i]: { halign: i === 0 ? "left" : "right" } }), {}),
      margin: { left: 14, right: 14 },
      theme: "striped",
    });
  }

  // ── FOOTER ────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(170, 170, 170);
    doc.line(14, 286, 196, 286);
    doc.text("Fingec — Document confidentiel — Usage interne", 14, 291);
    doc.text(`Page ${i} / ${totalPages}`, 196, 291, { align: "right" });
  }

  const safeName = filename.replace(/\.[^.]+$/, "");
  doc.save(`rapport_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
