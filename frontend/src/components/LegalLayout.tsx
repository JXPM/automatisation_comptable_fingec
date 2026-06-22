import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const NAV: { to: string; label: string }[] = [
  { to: "/mentions-legales", label: "Mentions légales" },
  { to: "/confidentialite", label: "Politique de confidentialité" },
  { to: "/cgu", label: "CGU" },
];

/**
 * Coquille des pages légales publiques (mentions légales, confidentialité, CGU).
 * Accessible sans authentification ; renvoie vers la connexion et les autres
 * documents du pack légal.
 */
export default function LegalLayout({
  title,
  updated,
  current,
  children,
}: {
  title: string;
  updated: string;
  current: string;
  children: ReactNode;
}) {
  return (
    <div className="legal-page">
      <header className="legal-topbar">
        <Link to="/login" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
          <div
            style={{
              width: 38, height: 38, borderRadius: 11,
              background: "linear-gradient(140deg, #fff, #f4f4f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "inset 0 0 0 1px var(--line)",
            }}
          >
            <img src="/fingec-logo.png" alt="Fingec" style={{ width: 24, height: 24, objectFit: "contain" }} />
          </div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, letterSpacing: "2px", color: "var(--ink)" }}>
            FINGEC
          </span>
        </Link>
        <Link
          to="/login"
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--muted)", textDecoration: "none" }}
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Retour à la connexion
        </Link>
      </header>

      <main className="legal-main">
        <motion.article
          className="legal-card"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 600, letterSpacing: "-0.4px", color: "var(--ink)" }}>
            {title}
          </h1>
          <p style={{ margin: "10px 0 28px", fontSize: 12.5, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            Dernière mise à jour : {updated}
          </p>

          <div className="legal-doc">{children}</div>

          {/* Liens croisés vers les autres documents */}
          <nav style={{ marginTop: 40, paddingTop: 22, borderTop: "1px solid var(--line)", display: "flex", flexWrap: "wrap", gap: 10 }}>
            {NAV.filter((n) => n.to !== current).map((n) => (
              <Link
                key={n.to}
                to={n.to}
                style={{
                  fontSize: 13, fontWeight: 600, color: "var(--b)", textDecoration: "none",
                  padding: "7px 14px", borderRadius: 9, border: "1px solid var(--b-tint)", background: "var(--b-soft)",
                }}
              >
                {n.label}
              </Link>
            ))}
            <a
              href="mailto:expert@fingec.fr"
              style={{
                fontSize: 13, fontWeight: 600, color: "var(--muted)", textDecoration: "none",
                padding: "7px 14px", borderRadius: 9, border: "1px solid var(--line-2)",
              }}
            >
              expert@fingec.fr
            </a>
          </nav>
        </motion.article>
      </main>
    </div>
  );
}
