import { useState } from "react";
import { B } from "../theme";

type RowSeverity = "error" | "warning" | null;

type Props = {
  rows: Record<string, string | number>[];
  highlightedRows: number[];
  rowSeverityMap: Record<number, RowSeverity>;
  activeSeverity?: "error" | "warning" | null;
  filtered?: boolean;
};

const COLUMNS: { key: string; label: string }[] = [
  { key: "date",             label: "Date" },
  { key: "sales_ht",         label: "Ventes HT" },
  { key: "vat",              label: "TVA" },
  { key: "fees",             label: "Fees" },
  { key: "shipping",         label: "Shipping" },
  { key: "adjustments",      label: "Ajustements" },
  { key: "total_settlement", label: "Total settlement" },
];

const PAGE_SIZES = [10, 20, 30, 50];

const SEVERITY_STYLE: Record<string, { bg: string; border: string; color: string; badge: string }> = {
  error:   { bg: "#fff1f2", border: "#fecdd3", color: "#b91c1c", badge: "Erreur" },
  warning: { bg: "#fffbeb", border: "#fde68a", color: "#92400e", badge: "Attention" },
};

function fmt(value: string | number, key: string): string {
  if (key === "date") return String(value).split("T")[0];
  if (typeof value === "number") {
    return value.toLocaleString("fr-FR", {
      style: "currency", currency: "EUR",
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
  }
  return String(value);
}

type SortDir = "asc" | "desc" | null;

export default function ResultTable({ rows, highlightedRows, rowSeverityMap, activeSeverity, filtered = false }: Props) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      const next = sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc";
      setSortDir(next);
      if (next === null) setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const isFiltering = filtered && highlightedRows.length > 0;

  type Row = Record<string, string | number> & { _i: number };

  // Base : toutes les lignes avec leur index d'origine
  let working: Row[] = rows.map((r, i) => ({ ...r, _i: i }));

  // Si filtre actif : lignes concernées en tête, reste dessous
  if (isFiltering) {
    const affected = working.filter(r => highlightedRows.includes(r._i));
    const rest = working.filter(r => !highlightedRows.includes(r._i));
    working = [...affected, ...rest];
  }

  // Tri colonne
  if (sortKey && sortDir) {
    working.sort((a, b) => {
      const va = a[sortKey] ?? "";
      const vb = b[sortKey] ?? "";
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  const displayed = working.slice(0, pageSize);

  return (
    <div style={{
      background: "white",
      border: `1px solid ${isFiltering ? "#fca5a5" : "#e8e8ee"}`,
      borderRadius: 10, overflow: "hidden",
      boxShadow: isFiltering ? "0 0 0 3px #fee2e2" : "0 2px 12px rgba(167, 34, 49,0.08)",
      transition: "all 0.2s",
    }}>
      {/* En-tête */}
      <div style={{
        padding: "16px 20px", borderBottom: "1px solid #e8e8ee",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
      }}>
        <div>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.8px", color: isFiltering ? "#b91c1c" : "#6b7280", fontWeight: 500, marginBottom: 2 }}>
            {isFiltering ? "Filtre actif — anomalie sélectionnée" : "Aperçu"}
          </p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "#1a1a2e" }}>
            Données traitées{" "}
            <span style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: "#6b7280" }}>
              {isFiltering
                ? `${highlightedRows.length} ligne${highlightedRows.length > 1 ? "s" : ""} concernée${highlightedRows.length > 1 ? "s" : ""} — affichées en premier`
                : `${displayed.length} / ${rows.length} lignes`}
            </span>
          </h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Sélecteur de lignes */}
          <span style={{ fontSize: 12, color: "#6b7280" }}>Afficher</span>
          {PAGE_SIZES.map(n => (
            <button
              key={n}
              onClick={() => setPageSize(n)}
              style={{
                padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                border: `1px solid ${pageSize === n ? B : "#e8e8ee"}`,
                background: pageSize === n ? B : "white",
                color: pageSize === n ? "white" : "#374151",
                fontWeight: pageSize === n ? 600 : 400,
                transition: "all 0.15s",
              }}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPageSize(rows.length)}
            style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer",
              border: `1px solid ${pageSize === rows.length ? B : "#e8e8ee"}`,
              background: pageSize === rows.length ? B : "white",
              color: pageSize === rows.length ? "white" : "#374151",
              fontWeight: pageSize === rows.length ? 600 : 400,
              transition: "all 0.15s",
            }}
          >
            Tout
          </button>

          {isFiltering && (
            <span style={{
              fontSize: 11, color: "#b91c1c",
              background: "#fff1f2", border: "1px solid #fecdd3",
              borderRadius: 99, padding: "4px 10px",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/>
              </svg>
              Cliquer sur l'anomalie pour tout réafficher
            </span>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid #e8e8ee" }}>
              {/* Colonne indicateur sévérité */}
              <th style={{ width: 6, padding: 0 }} />
              {COLUMNS.map(col => {
                const active = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      padding: "10px 16px", textAlign: "left",
                      fontSize: 11, fontWeight: 500,
                      color: active ? B : "#6b7280",
                      textTransform: "uppercase", letterSpacing: "0.8px",
                      cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {col.label}
                      <SortIcon active={active} dir={sortDir} />
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {displayed.map((row) => {
              const idx = row._i;
              const isHighlighted = isFiltering && highlightedRows.includes(idx);
              // Coloration SEULEMENT si filtre actif ET ligne concernée
              // La couleur suit la sévérité de l'anomalie sélectionnée, pas la pire globale
              const severity = isHighlighted ? (activeSeverity ?? rowSeverityMap[idx] ?? "error") : null;
              const sty = severity ? SEVERITY_STYLE[severity] : null;

              return (
                <tr
                  key={idx}
                  style={{
                    borderBottom: "1px solid #f0f0f4",
                    background: sty ? sty.bg : "transparent",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Barre latérale de sévérité */}
                  <td style={{ width: 4, padding: 0, background: sty ? sty.color : "transparent" }} />
                  {COLUMNS.map(col => (
                    <td
                      key={col.key}
                      style={{
                        padding: "9px 16px",
                        color: sty ? sty.color : col.key === "date" ? B : "#1a1a2e",
                        fontWeight: sty || col.key === "date" ? 500 : 400,
                        fontVariantNumeric: "tabular-nums",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row[col.key] !== undefined ? fmt(row[col.key], col.key) : "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {working.length > pageSize && (
        <div style={{
          padding: "10px 20px", borderTop: "1px solid #e8e8ee",
          fontSize: 12, color: "#6b7280", textAlign: "center",
        }}>
          {working.length - pageSize} ligne{working.length - pageSize > 1 ? "s" : ""} supplémentaire{working.length - pageSize > 1 ? "s" : ""} — augmenter le nombre affiché ci-dessus
        </div>
      )}
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
      stroke={active ? B : "#d1d5db"} strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1 }}>
      {!active || dir === null ? (
        <><polyline points="12 4 12 20"/><polyline points="6 10 12 4 18 10"/><polyline points="6 14 12 20 18 14"/></>
      ) : dir === "asc" ? (
        <><line x1="12" y1="20" x2="12" y2="4"/><polyline points="6 10 12 4 18 10"/></>
      ) : (
        <><line x1="12" y1="4" x2="12" y2="20"/><polyline points="6 14 12 20 18 14"/></>
      )}
    </svg>
  );
}
