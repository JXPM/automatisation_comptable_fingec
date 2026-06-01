import { norm } from "../utils/clients";

const MAP: Record<string, { bg: string; color: string; dot: string }> = {
  "en-attente": { bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF" },
  "envoye":     { bg: "#EDE9FE", color: "#6D28D9", dot: "#7C3AED" },
  "relance":    { bg: "#FEF3C7", color: "#92400E", dot: "#D97706" },
  "recu":       { bg: "#D1FAE5", color: "#065F46", dot: "#10B981" },
};

export default function StatusBadge({ statut }: { statut: string }) {
  const s = MAP[norm(statut)] ?? MAP["en-attente"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 99,
      fontSize: 11.5, fontWeight: 500,
      background: s.bg, color: s.color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {statut || "—"}
    </span>
  );
}
