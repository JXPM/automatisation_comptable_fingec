import {
  useEffect,
  useState,
  type ReactNode,
  type InputHTMLAttributes,
  type ComponentType,
} from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  ArrowRight,
  LineChart,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { B, B_DARK } from "../theme";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Coquille d'authentification (login / mot de passe oublié / réinitialisation).
 * Mise en page SaaS : formulaire à gauche (carte blanche, logo + titre centrés),
 * panneau de marque « onboarding » à droite (carte dégradée bordeaux, lampe
 * suspendue, aperçu de tableau de bord flottant et carrousel de messages).
 * Adapté de la référence Dribbble fournie, à la charte Fingec.
 */

// ── Diaporama du volet de marque ─────────────────────────────────────────────
const SLIDES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: LineChart,
    title: "La compta, sans la saisie manuelle.",
    text: "Import Shopify & TikTok, contrôle qualité et export Quadra réunis dans une seule interface.",
  },
  {
    icon: ShieldCheck,
    title: "Vos dossiers, en sécurité.",
    text: "Hébergement en France, accès chiffré et conforme RGPD pour les données de vos clients.",
  },
  {
    icon: Sparkles,
    title: "Des relances qui partent seules.",
    text: "Suivi des clients et e-mails de relance automatisés, à la charte du cabinet.",
  },
];

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  const active = SLIDES[slide];
  const ActiveIcon = active.icon;

  return (
    <div className="auth-split">
      {/* ── Volet formulaire (gauche) ── */}
      <div className="auth-form-col">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          style={{ width: "100%", maxWidth: 392 }}
        >
          {/* Logo + titre, centrés (comme la référence) */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
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
            <h2 style={{ margin: "20px 0 0", fontSize: 24, fontWeight: 720, color: "var(--ink)", letterSpacing: "-0.4px" }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55, color: "var(--muted)", maxWidth: 320 }}>
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

      {/* ── Volet de marque (droite) ── */}
      <div className="auth-brand">
        <div className="auth-art-card">
          {/* Trame + halos en arrière-plan */}
          <div
            aria-hidden
            style={{
              position: "absolute", inset: 0,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "46px 46px",
              maskImage: "radial-gradient(130% 90% at 50% 0%, #000 35%, transparent 78%)",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute", top: "-12%", right: "-18%",
              width: 360, height: 360, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.16), transparent 70%)",
            }}
          />

          {/* Lampe suspendue + scène de tableau de bord flottant */}
          <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Lamp />
            <Dashboard />
          </div>

          {/* Légende + carrousel */}
          <div style={{ position: "relative" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <div
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 38, height: 38, borderRadius: 11, marginBottom: 16,
                    background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)",
                  }}
                >
                  <ActiveIcon size={19} strokeWidth={1.9} color="#fff" />
                </div>
                <h3
                  style={{
                    margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 27, lineHeight: 1.2,
                    fontWeight: 600, letterSpacing: "-0.3px", maxWidth: 340,
                  }}
                >
                  {active.title}
                </h3>
                <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.7)", maxWidth: 360 }}>
                  {active.text}
                </p>
              </motion.div>
            </AnimatePresence>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 26 }}>
              <div className="auth-dots" role="tablist" aria-label="Diaporama">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === slide}
                    aria-label={`Message ${i + 1}`}
                    onClick={() => setSlide(i)}
                    className={`auth-dot${i === slide ? " is-active" : ""}`}
                    style={{ border: "none", cursor: "pointer", padding: 0 }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", letterSpacing: "0.3px" }}>
                © {new Date().getFullYear()} Fingec
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Lampe suspendue (motif de la référence) ─────────────────────────────────
function Lamp() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute", top: -44, left: "50%", transformOrigin: "top center",
        animation: "lampSway 6s ease-in-out infinite",
      }}
    >
      <div style={{ width: 2, height: 96, margin: "0 auto", background: "linear-gradient(rgba(255,255,255,0.45), rgba(255,255,255,0.15))" }} />
      <div
        style={{
          width: 96, height: 48, marginTop: -1, borderRadius: "0 0 96px 96px",
          background: "linear-gradient(#2a0810, #160206)",
          boxShadow: "inset 0 -8px 14px rgba(255,255,255,0.08)",
        }}
      />
      <div
        style={{
          width: 200, height: 200, marginTop: -8, marginLeft: -52, borderRadius: "50%",
          background: "radial-gradient(circle at 50% 0%, rgba(255,236,210,0.22), transparent 62%)",
        }}
      />
    </div>
  );
}

// ── Aperçu de tableau de bord flottant (verre dépoli) ───────────────────────
function Dashboard() {
  const bars = [38, 58, 46, 72, 60, 88, 70];
  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
      style={{ position: "relative", animation: "floatY 7s ease-in-out infinite" }}
    >
      {/* Carte secondaire en retrait (profondeur) */}
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0, transform: "translate(16px, 18px) rotate(3deg)",
          borderRadius: 20, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
        }}
      />
      {/* Carte principale */}
      <div
        style={{
          position: "relative", width: 290, borderRadius: 20, padding: 22,
          background: "linear-gradient(150deg, rgba(255,255,255,0.18), rgba(255,255,255,0.07))",
          border: "1px solid rgba(255,255,255,0.28)",
          boxShadow: "0 24px 50px -22px rgba(0,0,0,0.55)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Chiffre traité</span>
          <span
            style={{
              fontSize: 11, fontWeight: 700, color: "#fff", padding: "3px 8px", borderRadius: 99,
              background: "rgba(74,222,128,0.22)", border: "1px solid rgba(74,222,128,0.4)",
            }}
          >
            +18,4 %
          </span>
        </div>
        <div style={{ marginTop: 8, fontSize: 28, fontWeight: 760, letterSpacing: "-0.5px" }}>128 450 €</div>

        {/* Mini histogramme */}
        <div style={{ marginTop: 20, display: "flex", alignItems: "flex-end", gap: 9, height: 84 }}>
          {bars.map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.35 + i * 0.06 }}
              style={{
                flex: 1, borderRadius: 5,
                background:
                  i === bars.length - 1
                    ? "linear-gradient(#fff, rgba(255,255,255,0.7))"
                    : "linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.18))",
              }}
            />
          ))}
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          {["Shopify", "TikTok", "Quadra"].map((t) => (
            <span
              key={t}
              style={{
                fontSize: 10.5, fontWeight: 600, color: "rgba(255,255,255,0.82)",
                padding: "4px 9px", borderRadius: 7,
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.16)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
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
