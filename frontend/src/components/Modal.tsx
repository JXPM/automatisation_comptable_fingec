import { B } from "../theme";

interface Props {
  open: boolean;
  text: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function Modal({ open, text, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15, 20, 33, 0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
        animation: "fadeUp 0.2s var(--ease)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 16,
          padding: "30px 32px", width: 400,
          boxShadow: "0 30px 80px -20px rgba(15,20,33,0.45), 0 0 0 1px rgba(15,20,33,0.04)",
          fontFamily: "inherit",
        }}
      >
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700, marginBottom: 10, color: "#0F1421", letterSpacing: "-0.3px" }}>
          Confirmer la relance
        </h3>
        <p style={{ fontSize: 13.5, color: "#6B7280", marginBottom: 24, lineHeight: 1.55 }}>{text}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "9px 18px", borderRadius: 10,
              border: "1px solid #E2E5EC", background: "white",
              fontSize: 13, cursor: "pointer", color: "#374151",
              fontFamily: "inherit", fontWeight: 500,
              transition: "all 0.15s var(--ease)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#CBD2DD"; e.currentTarget.style.background = "#FAFBFC"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E2E5EC"; e.currentTarget.style.background = "white"; }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "9px 20px", borderRadius: 10,
              border: "none",
              background: `linear-gradient(135deg, ${B} 0%, #C13049 100%)`,
              color: "white", fontSize: 13,
              cursor: "pointer", fontWeight: 600,
              fontFamily: "inherit",
              boxShadow: "0 6px 16px -6px rgba(167, 34, 49,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
              transition: "transform 0.15s var(--ease)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
