import { useState, type ReactNode, type InputHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { B, B_DARK } from "../theme";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Coquille d'authentification : panneau de marque éditorial à gauche, contenu à
 * droite. Volontairement sobre (peu d'animation, typographie soignée) pour un
 * rendu « fait main » plutôt que gabarit générique.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-split">
      {/* ── Volet marque ── */}
      <div
        className="auth-brand"
        style={{
          position: "relative",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 52px",
          background: `linear-gradient(160deg, ${B} 0%, ${B_DARK} 60%, #2c0913 100%)`,
          color: "#fff",
          overflow: "hidden",
        }}
      >
        {/* Trame fine en arrière-plan (discrète, pas de glow tape-à-l'œil) */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(120% 80% at 20% 0%, #000 30%, transparent 75%)",
          }}
        />

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 13 }}>
          <div
            style={{
              width: 44, height: 44, borderRadius: 13,
              background: "linear-gradient(140deg, #fff, #f4f4f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 22px -10px rgba(0,0,0,0.5)",
            }}
          >
            <img src="/fingec-logo.png" alt="Fingec" style={{ width: 30, height: 30, objectFit: "contain" }} />
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 19, letterSpacing: "3px" }}>
            FINGEC
          </div>
        </div>

        <div style={{ position: "relative", maxWidth: 380 }}>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 34, lineHeight: 1.18, fontWeight: 600, margin: 0,
              letterSpacing: "-0.3px",
            }}
          >
            L'espace comptabilité,
            <br />
            <span style={{ fontStyle: "italic", color: "rgba(255,255,255,0.85)" }}>sans la saisie manuelle.</span>
          </h1>
          <p style={{ marginTop: 18, fontSize: 14.5, lineHeight: 1.6, color: "rgba(255,255,255,0.62)" }}>
            Import Shopify &amp; TikTok, contrôle qualité et export Quadra — réunis
            dans une interface unique pour les comptables Fingec.
          </p>
        </div>

        <div style={{ position: "relative", fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "0.3px" }}>
          © {new Date().getFullYear()} Fingec · Espace réservé aux collaborateurs
        </div>
      </div>

      {/* ── Volet formulaire ── */}
      <div className="auth-form-col">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          style={{ width: "100%", maxWidth: 384 }}
        >
          {/* Logo visible uniquement quand le volet marque est masqué (mobile) */}
          <div className="auth-brand" style={{ display: "none" }} />
          <h2 style={{ margin: 0, fontSize: 23, fontWeight: 680, color: "var(--ink)", letterSpacing: "-0.2px" }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55, color: "var(--muted)" }}>{subtitle}</p>
          )}
          <div style={{ marginTop: 28 }}>{children}</div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Champ étiqueté ─────────────────────────────────────────────────────────
export function Field({
  label,
  hint,
  ...props
}: { label: string; hint?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", marginBottom: 7 }}>
        {label}
      </span>
      <input className="auth-field" {...props} />
      {hint && <span style={{ display: "block", marginTop: 6, fontSize: 11.5, color: "var(--muted)" }}>{hint}</span>}
    </label>
  );
}

// ── Champ mot de passe avec bascule afficher/masquer ───────────────────────
export function PasswordField({
  label,
  hint,
  ...props
}: { label: string; hint?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", marginBottom: 7 }}>
        {label}
      </span>
      <div style={{ position: "relative" }}>
        <input className="auth-field" type={show ? "text" : "password"} style={{ paddingRight: 44 }} {...props} />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          style={{
            position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
            width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent",
            cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {show ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <path d="M1 1l22 22" /><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3 8 10 8a9.74 9.74 0 0 0 5.39-1.61" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" /><circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {hint && <span style={{ display: "block", marginTop: 6, fontSize: 11.5, color: "var(--muted)" }}>{hint}</span>}
    </label>
  );
}

// ── Bouton principal ────────────────────────────────────────────────────────
export function SubmitButton({ loading, children }: { loading?: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: "100%", padding: "12.5px", borderRadius: 11, border: "none",
        cursor: loading ? "default" : "pointer",
        background: loading ? "var(--muted-2)" : `linear-gradient(95deg, ${B}, ${B_DARK})`,
        color: "#fff", fontSize: 14.5, fontWeight: 640, fontFamily: "inherit",
        boxShadow: loading ? "none" : "var(--shadow-glow)",
        transition: "transform 0.12s var(--ease), box-shadow 0.15s var(--ease)",
      }}
    >
      {loading ? "Veuillez patienter…" : children}
    </button>
  );
}

// ── Bandeaux d'alerte ───────────────────────────────────────────────────────
export function Alert({ kind, children }: { kind: "error" | "success"; children: ReactNode }) {
  const palette =
    kind === "error"
      ? { bg: "#FEF2F2", border: "#FCA5A5", fg: "#B91C1C" }
      : { bg: "#F0FDF4", border: "#86EFAC", fg: "#15803D" };
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      style={{
        margin: "4px 0 16px", padding: "11px 13px", borderRadius: 10,
        background: palette.bg, border: `1px solid ${palette.border}`,
        fontSize: 13, lineHeight: 1.5, color: palette.fg,
      }}
    >
      {children}
    </div>
  );
}
