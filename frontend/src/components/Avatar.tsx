import type { CSSProperties } from "react";
import { initials } from "../utils/clients";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  /** Coin : rond par défaut ; un nombre = radius en px (carré arrondi). */
  radius?: number | "circle";
  fontSize?: number;
  style?: CSSProperties;
}

/**
 * Avatar utilisateur : affiche la photo si elle existe, sinon les initiales
 * sur un dégradé bordeaux. Réutilisé dans la topbar et la page compte.
 */
export default function Avatar({ name, src, size = 40, radius = "circle", fontSize, style }: AvatarProps) {
  const borderRadius = radius === "circle" ? "50%" : radius;
  const base: CSSProperties = {
    width: size, height: size, borderRadius, flexShrink: 0,
    overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
    ...style,
  };

  if (src) {
    return <img src={src} alt={name} style={{ ...base, objectFit: "cover" }} />;
  }

  return (
    <div style={{
      ...base,
      background: "linear-gradient(135deg, #A72231 0%, #7E1626 100%)",
      color: "#fff", fontWeight: 700, fontSize: fontSize ?? Math.round(size * 0.38),
      fontFamily: "var(--font-display)", letterSpacing: "0.5px",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
    }}>
      {initials(name)}
    </div>
  );
}
