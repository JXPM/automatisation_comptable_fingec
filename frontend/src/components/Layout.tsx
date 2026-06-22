import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import Topbar from "./Topbar";

const ADMIN_NAV = {
  to: "/admin",
  label: "Admin",
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
};

const NAV = [
  {
    to: "/",
    label: "Accueil",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5"/>
        <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"/>
        <path d="M9 21v-6h6v6"/>
      </svg>
    ),
  },
  {
    to: "/traitement",
    label: "Traitement",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
  },
  {
    to: "/clients",
    label: "Clients",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    to: "/historique",
    label: "Historique",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    to: "/mail",
    label: "Nouveau mail",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  },
  {
    to: "/logs",
    label: "Logs",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  const navItems = user?.role === "admin" ? [...NAV, ADMIN_NAV] : NAV;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 244,
        flexShrink: 0,
        background: "linear-gradient(165deg, #8C1B2A 0%, #5E1320 55%, #3A0C16 100%)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        boxShadow: "8px 0 32px -16px rgba(0,0,0,0.35)",
        overflow: "hidden",
      }}>

        {/* Animated ambient glow */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0.5 }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
            x: [0, 20, 0],
            y: [0, -15, 0],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", top: -80, left: -80,
            width: 320, height: 320,
            background: "radial-gradient(closest-side, rgba(255,210,170,0.18), transparent 70%)",
            pointerEvents: "none", filter: "blur(20px)",
          }}
        />
        <motion.div
          aria-hidden
          initial={{ opacity: 0.3 }}
          animate={{
            opacity: [0.2, 0.5, 0.2],
            x: [0, -15, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          style={{
            position: "absolute", bottom: 80, right: -60,
            width: 280, height: 280,
            background: "radial-gradient(closest-side, rgba(220,90,130,0.20), transparent 70%)",
            pointerEvents: "none", filter: "blur(18px)",
          }}
        />

        {/* Noise overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
          pointerEvents: "none", mixBlendMode: "overlay",
        }} />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{
            padding: "26px 22px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            position: "relative", zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <motion.div
              whileHover={{ scale: 1.05, rotate: -3 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              style={{
                width: 42, height: 42, borderRadius: 12,
                background: "linear-gradient(140deg, #ffffff 0%, #f5f5f7 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                overflow: "hidden",
                boxShadow: "0 6px 16px -6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.8)",
              }}
            >
              <img
                src="/fingec-logo.png" alt="Fingec"
                style={{ width: 32, height: 32, objectFit: "contain" }}
              />
            </motion.div>
            <div>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 16, fontWeight: 700,
                letterSpacing: "2px", color: "white",
              }}>FINGEC</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: "1px", marginTop: 2, textTransform: "uppercase" }}>
                Comptabilité
              </div>
            </div>
          </div>
        </motion.div>

        {/* Nav */}
        <nav style={{ padding: "16px 14px", flex: 1, position: "relative", zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.32)", letterSpacing: "1.4px", textTransform: "uppercase", padding: "6px 10px 12px" }}
          >
            Navigation
          </motion.div>

          {navItems.map(({ to, label, icon }, i) => {
            const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            return (
              <motion.div
                key={to}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + i * 0.05, duration: 0.4, ease: EASE }}
              >
                <NavLink
                  to={to}
                  end={to === "/"}
                  style={{
                    display: "flex", alignItems: "center", gap: 11,
                    padding: "10px 12px", borderRadius: 10, marginBottom: 3,
                    textDecoration: "none",
                    fontFamily: "'Inter', 'DM Sans', sans-serif",
                    fontSize: 13.5, fontWeight: isActive ? 600 : 450,
                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.62)",
                    position: "relative",
                  }}
                >
                  <AnimatePresence>
                    {isActive && (
                      <>
                        <motion.div
                          layoutId="nav-active-bg"
                          initial={false}
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          style={{
                            position: "absolute", inset: 0, borderRadius: 10,
                            background: "linear-gradient(95deg, rgba(255,255,255,0.16), rgba(255,255,255,0.07))",
                            border: "1px solid rgba(255,255,255,0.14)",
                            backdropFilter: "blur(6px)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 16px -8px rgba(0,0,0,0.4)",
                            zIndex: 0,
                          }}
                        />
                        <motion.div
                          layoutId="nav-active-bar"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          style={{
                            position: "absolute", left: -1, top: 0, bottom: 0,
                            margin: "auto 0",                       // centrage vertical sans transform
                            width: 3, height: 18, borderRadius: "0 3px 3px 0",
                            background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.55))",
                            boxShadow: "0 0 12px rgba(255,255,255,0.5)",
                            zIndex: 1,
                          }}
                        />
                      </>
                    )}
                  </AnimatePresence>
                  <motion.span
                    style={{ opacity: isActive ? 1 : 0.78, display: "flex", alignItems: "center", position: "relative", zIndex: 2 }}
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  >
                    {icon}
                  </motion.span>
                  <span style={{ position: "relative", zIndex: 2 }}>{label}</span>
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

      </aside>

      {/* ── MAIN ── */}
      <main style={{
        flex: 1,
        overflowY: "auto",
        background: "transparent",
      }}>
        <Topbar />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: EASE }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
