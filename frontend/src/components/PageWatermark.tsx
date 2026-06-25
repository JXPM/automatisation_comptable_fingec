import { motion } from "framer-motion";

/**
 * Filigrane discret : le logo Fingec complet, en bas à droite de la zone de
 * contenu, très estompé et en fondu. Purement décoratif (aria-hidden,
 * pointer-events: none) — n'intercepte jamais les clics.
 */
export default function PageWatermark() {
  return (
    <motion.img
      aria-hidden
      src="/fingec-logo-full.png"
      alt=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.06 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed",
        bottom: 26,
        right: 38,
        width: 300,
        maxWidth: "32vw",
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 0,
        // Léger fondu vers les bords pour intégrer le logo au fond.
        WebkitMaskImage: "radial-gradient(120% 120% at 70% 70%, #000 40%, transparent 100%)",
        maskImage: "radial-gradient(120% 120% at 70% 70%, #000 40%, transparent 100%)",
      }}
    />
  );
}
