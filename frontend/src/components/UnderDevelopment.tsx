import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { B } from "../theme";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  children: ReactNode;
  /** Optional hint about what this section will offer once shipped. */
  hint?: string;
};

/**
 * Renders the page content blurred & disabled, with a centered "En développement"
 * card on top. Used to preview upcoming sections during V1.
 */
export default function UnderDevelopment({ children, hint }: Props) {
  return (
    <div style={{
      position: "relative",
      height: "100%",
      minHeight: "calc(100vh)",
      overflow: "hidden",
    }}>
      {/* Page floutée en dessous */}
      <div
        aria-hidden
        style={{
          filter: "blur(7px) saturate(0.85)",
          opacity: 0.55,
          pointerEvents: "none",
          userSelect: "none",
          height: "100%",
          maxHeight: "100vh",
          overflow: "hidden",
        }}
      >
        {children}
      </div>

      {/* Voile + carte centrale */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 32,
        zIndex: 5,
        background: "linear-gradient(180deg, rgba(246,244,242,0.45) 0%, rgba(246,244,242,0.65) 100%)",
        backdropFilter: "blur(2px)",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{
            position: "relative",
            background: "linear-gradient(180deg, #ffffff 0%, #fcfbfa 100%)",
            border: "1px solid #ECEEF2",
            borderRadius: 22,
            padding: "38px 44px 36px",
            maxWidth: 460,
            textAlign: "center",
            boxShadow: "0 1px 2px rgba(15,20,33,0.04), 0 30px 80px -20px rgba(167, 34, 49,0.20), 0 60px 120px -40px rgba(15,20,33,0.18)",
            overflow: "hidden",
          }}
        >
          {/* Filet animé en haut */}
          <motion.div
            animate={{ backgroundPosition: ["0% 50%", "200% 50%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, ${B} 0%, #D6435C 25%, #C13049 50%, #D6435C 75%, ${B} 100%)`,
              backgroundSize: "200% 100%",
            }}
          />

          {/* Orbe de fond */}
          <motion.div
            aria-hidden
            animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute", top: -60, right: -60,
              width: 220, height: 220,
              background: `radial-gradient(closest-side, ${B}22, transparent 70%)`,
              filter: "blur(20px)", pointerEvents: "none",
            }}
          />

          {/* Icône animée */}
          <div style={{ position: "relative", display: "flex", justifyContent: "center", marginBottom: 22 }}>
            <motion.div
              animate={{ rotate: [0, 8, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: 64, height: 64, borderRadius: 18,
                background: `linear-gradient(140deg, ${B} 0%, #C13049 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 14px 32px -10px ${B}88, inset 0 1px 0 rgba(255,255,255,0.25)`,
                position: "relative",
              }}
            >
              {/* Anneau pulsant */}
              <motion.div
                aria-hidden
                animate={{ scale: [1, 1.5, 1.7], opacity: [0.55, 0.15, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                style={{
                  position: "absolute", inset: 0, borderRadius: 18,
                  border: `2px solid ${B}`,
                }}
              />
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </motion.div>
          </div>

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}
          >
            <span style={{ width: 18, height: 1, background: B, opacity: 0.5 }} />
            <span style={{
              fontSize: 10.5, fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase",
              color: B,
            }}>
              Bientôt disponible
            </span>
            <span style={{ width: 18, height: 1, background: B, opacity: 0.5 }} />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.5, ease: EASE }}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28, fontWeight: 600,
              color: "#0F1421", margin: "0 0 10px",
              letterSpacing: "-0.4px", lineHeight: 1.2,
            }}
          >
            En développement
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28, duration: 0.5 }}
            style={{
              color: "#6B7280", fontSize: 14, lineHeight: 1.6,
              margin: "0 auto", maxWidth: 340,
            }}
          >
            {hint ?? "Cette section sera disponible dans une prochaine version. La V1 se concentre sur le traitement des fichiers comptables."}
          </motion.p>

          {/* Pill version */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5, ease: EASE }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              marginTop: 22, padding: "6px 12px", borderRadius: 99,
              background: "#FAFAFB", border: "1px solid #ECEEF2",
              fontSize: 11, fontWeight: 600, color: "#6B7280", letterSpacing: "0.4px",
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: B, boxShadow: `0 0 6px ${B}99`,
              }}
            />
            V1 · disponible prochainement
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
