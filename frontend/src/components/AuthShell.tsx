import {
  useState,
  type ReactNode,
  type InputHTMLAttributes,
  type ComponentType,
} from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { B, B_DARK } from "../theme";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Coquille d'authentification (login / mot de passe oublié / réinitialisation).
 * Mise en page SaaS : grande photo réelle à gauche (logo + citation en
 * surimpression), formulaire à droite. Inspiré de la référence fournie, à la
 * charte Fingec.
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
      {/* ── Volet visuel (gauche) : photo réelle ── */}
      <div className="auth-brand">
        <div className="auth-art-card">
          <img className="auth-cover" src="/login-cover.jpg" alt="" aria-hidden />
          <div className="auth-cover-tint" aria-hidden />

          {/* Logo en haut à gauche */}
          <div style={{ position: "absolute", top: 26, left: 28, display: "flex", alignItems: "center", gap: 11, zIndex: 2 }}>
            <div
              style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                background: "linear-gradient(140deg, #fff, #f4f4f6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 6px 18px -8px rgba(0,0,0,0.5)",
              }}
            >
              <img src="/fingec-logo.png" alt="Fingec" style={{ width: 26, height: 26, objectFit: "contain" }} />
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, letterSpacing: "2px", color: "#fff" }}>
              FINGEC
            </span>
          </div>

          {/* Citation en bas */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
            style={{ position: "relative", zIndex: 2, padding: "0 38px 40px" }}
          >
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 26, lineHeight: 1.32, fontWeight: 600, letterSpacing: "-0.3px", maxWidth: 420 }}>
              « Toute la comptabilité e‑commerce, du fichier brut à l'écriture Quadra. »
            </p>
            <div style={{ marginTop: 18, fontSize: 14, fontWeight: 600, color: "#fff" }}>Cabinet Fingec</div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)" }}>Expertise comptable · e‑commerce</div>
          </motion.div>
        </div>
      </div>

      {/* ── Volet formulaire (droite) ── */}
      <div className="auth-form-col">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          style={{ width: "100%", maxWidth: 392 }}
        >
          {/* Logo replié pour mobile (la photo est masquée sous 980px) */}
          <div className="auth-form-logo" style={{ justifyContent: "center", marginBottom: 22 }}>
            <div
              style={{
                width: 52, height: 52, borderRadius: 15,
                background: "linear-gradient(140deg, #fff, #f4f4f6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 10px 26px -12px rgba(167,34,49,0.45), inset 0 0 0 1px var(--line)",
              }}
            >
              <img src="/fingec-logo.png" alt="Fingec" style={{ width: 34, height: 34, objectFit: "contain" }} />
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 740, color: "var(--ink)", letterSpacing: "-0.5px" }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ margin: "8px auto 0", fontSize: 14, lineHeight: 1.55, color: "var(--muted)", maxWidth: 320 }}>
                {subtitle}
              </p>
            )}
          </div>

          <div style={{ marginTop: 30 }}>{children}</div>

          {/* Pied : note d'accès + liens légaux */}
          <p style={{ marginTop: 26, textAlign: "center", fontSize: 11.5, lineHeight: 1.6, color: "var(--muted-2)" }}>
            Espace réservé aux collaborateurs Fingec.
            <br />
            En vous connectant, vous acceptez nos{" "}
            <Link to="/mentions-legales" style={{ color: "var(--muted)", fontWeight: 600 }}>
              mentions légales
            </Link>{" "}
            et notre{" "}
            <Link to="/confidentialite" style={{ color: "var(--muted)", fontWeight: 600 }}>
              politique de confidentialité
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ── Champ étiqueté (icône optionnelle en tête) ───────────────────────────────
export function Field({
  label,
  hint,
  icon: Icon,
  ...props
}: {
  label: string;
  hint?: ReactNode;
  icon?: ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", marginBottom: 7 }}>
        {label}
      </span>
      <div style={{ position: "relative" }}>
        {Icon && (
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--muted-2)", display: "flex" }}>
            <Icon size={17} strokeWidth={1.8} />
          </span>
        )}
        <input className="auth-field" style={Icon ? { paddingLeft: 40 } : undefined} {...props} />
      </div>
      {hint && <span style={{ display: "block", marginTop: 6, fontSize: 11.5, color: "var(--muted)" }}>{hint}</span>}
    </label>
  );
}

// ── Champ mot de passe (icône cadenas + bascule afficher/masquer) ────────────
export function PasswordField({
  label,
  hint,
  icon: Icon,
  ...props
}: {
  label: string;
  hint?: ReactNode;
  icon?: ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
} & InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", marginBottom: 7 }}>
        {label}
      </span>
      <div style={{ position: "relative" }}>
        {Icon && (
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--muted-2)", display: "flex" }}>
            <Icon size={17} strokeWidth={1.8} />
          </span>
        )}
        <input
          className="auth-field"
          type={show ? "text" : "password"}
          style={{ paddingLeft: Icon ? 40 : 14, paddingRight: 44 }}
          {...props}
        />
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
          {show ? <EyeOff size={17} strokeWidth={1.8} /> : <Eye size={17} strokeWidth={1.8} />}
        </button>
      </div>
      {hint && <span style={{ display: "block", marginTop: 6, fontSize: 11.5, color: "var(--muted)" }}>{hint}</span>}
    </label>
  );
}

// ── Bouton principal (flèche optionnelle) ────────────────────────────────────
export function SubmitButton({
  loading,
  children,
  withArrow,
}: {
  loading?: boolean;
  children: ReactNode;
  withArrow?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="auth-submit"
      style={{
        width: "100%", padding: "13px", borderRadius: 12, border: "none",
        cursor: loading ? "default" : "pointer",
        background: loading ? "var(--muted-2)" : `linear-gradient(95deg, ${B}, ${B_DARK})`,
        color: "#fff", fontSize: 14.5, fontWeight: 640, fontFamily: "inherit",
        boxShadow: loading ? "none" : "var(--shadow-glow)",
        transition: "transform 0.12s var(--ease), box-shadow 0.15s var(--ease)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >
      {loading ? "Veuillez patienter…" : children}
      {!loading && withArrow && <ArrowRight size={17} strokeWidth={2.1} />}
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
