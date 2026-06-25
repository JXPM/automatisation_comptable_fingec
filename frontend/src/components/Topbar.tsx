import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import Avatar from "./Avatar";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Barre supérieure : avatar en haut à droite ouvrant un menu compte.
 * Centralise l'accès aux Paramètres du compte et la déconnexion
 * (auparavant logés dans le pied de la sidebar).
 */
export default function Topbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const displayName = user?.full_name || user?.email || "Utilisateur";
  const roleLabel = user?.role === "admin" ? "Administrateur" : "Comptable";

  // Ferme le menu au clic extérieur et à la touche Échap.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 30,
      display: "flex", alignItems: "center", justifyContent: "flex-end",
      height: 60, padding: "0 28px",
      borderBottom: "1px solid rgba(15,20,33,0.06)",
      background: "rgba(246,244,242,0.72)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    }}>
      <div ref={ref} style={{ position: "relative" }}>
        <motion.button
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Menu du compte"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.18, ease: EASE }}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "6px 10px 6px 6px", borderRadius: 999,
            background: open ? "rgba(167, 34, 49,0.07)" : "rgba(255,255,255,0.6)",
            border: "1px solid rgba(15,20,33,0.07)",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(15,20,33,0.04)",
          }}
        >
          <Avatar name={displayName} src={user?.avatar_url} size={34} fontSize={13} />
          <div style={{ textAlign: "left", lineHeight: 1.2, maxWidth: 150 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: "#0F1421",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{displayName}</div>
            <div style={{ fontSize: 10.5, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.4px" }}>
              {roleLabel}
            </div>
          </div>
          <motion.svg
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#9CA3AF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ marginRight: 2 }}
          >
            <polyline points="6 9 12 15 18 9" />
          </motion.svg>
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.18, ease: EASE }}
              style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                width: 224, padding: 6, borderRadius: 14,
                background: "#fff",
                border: "1px solid rgba(15,20,33,0.08)",
                boxShadow: "0 18px 40px -12px rgba(15,20,33,0.18), 0 2px 6px rgba(15,20,33,0.05)",
                transformOrigin: "top right",
              }}
            >
              <div style={{ padding: "10px 12px 12px", borderBottom: "1px solid rgba(15,20,33,0.06)", marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F1421", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email}
                </div>
              </div>

              <Link
                to="/compte"
                role="menuitem"
                onClick={() => setOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 9,
                  textDecoration: "none", color: "#2A2F3D",
                  fontSize: 13.5, fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(15,20,33,0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Paramètres du compte
              </Link>

              <button
                role="menuitem"
                onClick={() => { setOpen(false); logout(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "10px 12px", borderRadius: 9, border: "none",
                  background: "transparent", cursor: "pointer",
                  textAlign: "left", color: "#b4233f",
                  fontSize: 13.5, fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(180,35,63,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Se déconnecter
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
