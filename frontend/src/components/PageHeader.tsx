import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { B } from "../theme";

const EASE = [0.22, 1, 0.36, 1] as const;

interface PageHeaderProps {
  /** Sur-titre en capitales (catégorie de la page). */
  eyebrow: string;
  /** Titre principal de la page. */
  title: string;
  /** Phrase d'introduction optionnelle sous le titre. */
  subtitle?: string;
  /** Actions alignées à droite (boutons « Actualiser », etc.). */
  actions?: ReactNode;
  /** Surcharge de style du conteneur (ex. marges). */
  style?: CSSProperties;
}

/**
 * En-tête de page unifié : barre d'accent animée + sur-titre + titre (police display)
 * (+ sous-titre et actions optionnels). Partagé par toutes les pages de l'app
 * pour garantir un rendu cohérent.
 */
export default function PageHeader({ eyebrow, title, subtitle, actions, style }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 16, marginBottom: 28, ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.15, duration: 0.45, ease: EASE }}
          style={{
            width: 4, height: 44, borderRadius: 2, transformOrigin: "top", flexShrink: 0,
            background: `linear-gradient(180deg, ${B} 0%, #C13049 100%)`,
            boxShadow: `0 4px 12px -4px ${B}66`,
          }}
        />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase", color: B, marginBottom: 4 }}>
            {eyebrow}
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, color: "#0F1421", margin: 0, letterSpacing: "-0.5px" }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </motion.div>
  );
}
