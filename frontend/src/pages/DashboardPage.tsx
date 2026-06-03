import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import StatusBadge from "../components/StatusBadge";
import { B } from "../theme";
import { avatarColor, initials } from "../utils/clients";
import { authFetch } from "../utils/api";

interface Client {
  Nom: string;
  Email: string;
  Statut: string;
  Nb_relances?: number;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/** Animated counter that smoothly tweens to its target value. */
function AnimatedCount({ value, loading }: { value: number; loading: boolean }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 90, damping: 20, mass: 0.6 });
  const display = useTransform(spring, (v) => Math.round(v).toString());

  useEffect(() => {
    mv.set(value);
  }, [value, mv]);

  if (loading) {
    return <span className="skeleton" style={{ display: "inline-block", width: 44, height: 34 }} />;
  }
  return <motion.span>{display}</motion.span>;
}

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/clients");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const envoye  = clients.filter(c => c.Statut === "Envoyé").length;
  const relance = clients.filter(c => c.Statut === "Relancé").length;
  const recu    = clients.filter(c => c.Statut === "Reçu").length;
  const taux    = clients.length > 0 ? Math.round((recu / clients.length) * 100) : 0;
  const nonRepondants = clients.filter(c => c.Statut !== "Reçu");

  const STATS = [
    {
      label: "Total clients",
      value: clients.length,
      accent: "#7C3AED",
      bg: "#F5F3FF",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label: "Envoyés",
      value: envoye,
      accent: "#6D28D9",
      bg: "#EDE9FE",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      ),
    },
    {
      label: "Relancés",
      value: relance,
      accent: "#D97706",
      bg: "#FEF3C7",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10"/>
          <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
        </svg>
      ),
    },
    {
      label: "Reçus",
      value: recu,
      accent: "#059669",
      bg: "#D1FAE5",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{ padding: "28px 44px 44px" }}>

      {/* ── HERO with animated gradient ── */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        style={{
          position: "relative",
          borderRadius: 18,
          overflow: "hidden",
          padding: "32px 38px 34px",
          marginBottom: 28,
          color: "white",
          background: "linear-gradient(135deg, #4a1020 0%, #6e1828 50%, #2a0913 100%)",
          boxShadow:
            "0 1px 2px rgba(15,20,33,0.05), 0 24px 60px -20px rgba(125,28,52,0.40)",
          isolation: "isolate",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Animated mesh gradient orbs — refined burgundy / champagne palette */}
        <motion.div
          aria-hidden
          animate={{
            x: [0, 60, -30, 0],
            y: [0, -25, 30, 0],
            scale: [1, 1.10, 0.95, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", top: "-30%", left: "-10%",
            width: 440, height: 440,
            background: "radial-gradient(closest-side, rgba(212,175,140,0.32), transparent 70%)",
            filter: "blur(48px)",
            zIndex: 0,
          }}
        />
        <motion.div
          aria-hidden
          animate={{
            x: [0, -50, 40, 0],
            y: [0, 35, -15, 0],
            scale: [1, 0.92, 1.08, 1],
          }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          style={{
            position: "absolute", top: "15%", right: "-12%",
            width: 480, height: 480,
            background: "radial-gradient(closest-side, rgba(180,55,90,0.42), transparent 70%)",
            filter: "blur(54px)",
            zIndex: 0,
          }}
        />
        <motion.div
          aria-hidden
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.12, 0.92, 1],
          }}
          transition={{ duration: 32, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          style={{
            position: "absolute", bottom: "-40%", left: "35%",
            width: 380, height: 380,
            background: "radial-gradient(closest-side, rgba(125,28,52,0.55), transparent 70%)",
            filter: "blur(56px)",
            zIndex: 0,
          }}
        />

        {/* Subtle moving sheen */}
        <motion.div
          aria-hidden
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear", repeatDelay: 6 }}
          style={{
            position: "absolute", top: 0, left: 0, width: "40%", height: "100%",
            background: "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
            pointerEvents: "none", zIndex: 1,
          }}
        />

        {/* Grain */}
        <div aria-hidden style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
          mixBlendMode: "overlay", pointerEvents: "none",
        }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 28 }}>
          <div style={{ flex: "1 1 360px", minWidth: 0 }}>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
              style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}
            >
              <span style={{
                width: 26, height: 1, background: "rgba(212,175,140,0.6)",
              }} />
              <span style={{
                fontSize: 10.5, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase",
                color: "rgba(212,175,140,0.92)",
              }}>
                Tableau de bord
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.55, ease: EASE }}
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 36, fontWeight: 600,
                color: "white", margin: 0, letterSpacing: "-0.4px",
                lineHeight: 1.15,
              }}
            >
              Vue d'ensemble du cabinet
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.32, duration: 0.5 }}
              style={{
                color: "rgba(255,255,255,0.66)", fontSize: 14, marginTop: 12, maxWidth: 540,
                lineHeight: 1.6, fontWeight: 400,
              }}
            >
              Suivi des relances clients, taux de collecte documentaire et état des dossiers en cours, mis à jour en continu.
            </motion.p>

            {/* Date line — discreet, formal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                marginTop: 18, padding: "6px 12px", borderRadius: 7,
                background: "rgba(0,0,0,0.22)",
                border: "1px solid rgba(255,255,255,0.07)",
                fontSize: 11.5, color: "rgba(255,255,255,0.62)", fontWeight: 500,
                letterSpacing: "0.2px", textTransform: "capitalize",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </motion.div>
          </div>

          {/* Inline KPI capsule */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.28, duration: 0.5, ease: EASE }}
            style={{
              display: "flex", alignItems: "center", gap: 18,
              padding: "16px 22px", borderRadius: 14,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(14px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 10px 30px -10px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{
              width: 54, height: 54, borderRadius: "50%",
              background: `conic-gradient(rgba(212,175,140,0.95) ${taux * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: "50%",
                background: "rgba(42,9,19,0.95)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12.5, fontWeight: 700, color: "rgba(212,175,140,1)", fontVariantNumeric: "tabular-nums",
              }}>
                {taux}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
                Taux de réception
              </div>
              <div style={{ fontSize: 21, fontWeight: 700, color: "white", marginTop: 3, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.3px" }}>
                {recu}<span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}> / {clients.length}</span>
              </div>
            </div>
            <motion.button
              onClick={load}
              whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.14)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              style={{
                marginLeft: 6, display: "inline-flex", alignItems: "center", gap: 7,
                padding: "9px 14px", borderRadius: 9,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.08)",
                fontSize: 12, fontWeight: 500, color: "white",
                cursor: "pointer", fontFamily: "inherit",
                backdropFilter: "blur(8px)",
              }}
            >
              <motion.svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                animate={loading ? { rotate: 360 } : { rotate: 0 }}
                transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.4 }}
              >
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
              </motion.svg>
              Actualiser
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* Section eyebrow — Activité */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}
      >
        <span style={{ width: 22, height: 1, background: B }} />
        <span style={{
          fontSize: 10.5, fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase",
          color: B,
        }}>
          Indicateurs
        </span>
        <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #ECEEF2 0%, transparent 100%)" }} />
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: "12px 16px", borderRadius: 10, marginBottom: 24,
            background: "#FEF3C7", border: "1px solid #FCD34D",
            fontSize: 13, color: "#92400E",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Impossible de charger les données. Vérifiez la connexion au service.
        </motion.div>
      )}

      {/* Stat cards */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
        }}
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}
      >
        {STATS.map(({ label, value, accent, bg, icon }) => (
          <motion.div
            key={label}
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
            }}
            whileHover={{ y: -4, transition: { duration: 0.2, ease: EASE } }}
            style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid #ECEEF2",
              overflow: "hidden",
              boxShadow: "0 1px 2px rgba(15,20,33,0.04), 0 8px 24px -8px rgba(15,20,33,0.06)",
              position: "relative",
              cursor: "default",
            }}
          >
            <div style={{ height: 3, background: `linear-gradient(90deg, ${accent} 0%, ${accent}aa 100%)` }} />
            <div style={{ padding: "20px 22px 22px" }}>
              <motion.div
                whileHover={{ rotate: -4, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 380, damping: 18 }}
                style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: `linear-gradient(140deg, ${bg} 0%, ${bg}cc 100%)`,
                  color: accent,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 8px -2px ${accent}33`,
                }}
              >
                {icon}
              </motion.div>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#0F1421", lineHeight: 1, marginBottom: 7, fontVariantNumeric: "tabular-nums", letterSpacing: "-1px" }}>
                <AnimatedCount value={value} loading={loading} />
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.7px" }}>
                {label}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Section eyebrow — Suivi */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}
      >
        <span style={{ width: 22, height: 1, background: B }} />
        <span style={{
          fontSize: 10.5, fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase",
          color: B,
        }}>
          Suivi des dossiers
        </span>
        <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #ECEEF2 0%, transparent 100%)" }} />
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>

        {/* Progress card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: EASE }}
          style={{
            background: "white", borderRadius: 16, border: "1px solid #ECEEF2",
            padding: "24px 26px",
            boxShadow: "0 1px 2px rgba(15,20,33,0.04), 0 8px 24px -8px rgba(15,20,33,0.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 3 }}>
                Taux de réception
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#111827" }}>
                <AnimatedCount value={taux} loading={loading} />
                <span style={{ fontSize: 18, fontWeight: 500, color: "#6B7280" }}>%</span>
              </div>
            </div>
            <motion.div
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.6, ease: EASE }}
              style={{
                width: 52, height: 52, borderRadius: "50%",
                background: `conic-gradient(${B} ${taux * 3.6}deg, #F3F4F6 0deg)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "white" }} />
            </motion.div>
          </div>
          <div style={{ height: 8, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${taux}%` }}
              transition={{ delay: 0.6, duration: 0.9, ease: EASE }}
              style={{
                height: "100%",
                background: `linear-gradient(90deg, ${B}, #c0395a)`,
                borderRadius: 99,
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, color: "#9CA3AF" }}>
            <span>{recu} reçus</span>
            <span>{clients.length} total</span>
          </div>
        </motion.div>

        {/* En attente card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5, ease: EASE }}
          style={{
            background: "white", borderRadius: 16, border: "1px solid #ECEEF2",
            boxShadow: "0 1px 2px rgba(15,20,33,0.04), 0 8px 24px -8px rgba(15,20,33,0.06)",
            overflow: "hidden",
          }}
        >
          <div style={{
            padding: "16px 20px 12px",
            borderBottom: "1px solid #F3F4F6",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              Clients en attente
            </div>
            {nonRepondants.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 380, damping: 18 }}
                style={{
                  background: "#FEE2E2", color: "#B91C1C",
                  fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                }}
              >
                {nonRepondants.length}
              </motion.span>
            )}
          </div>
          <div style={{ maxHeight: 190, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>Chargement…</div>
            ) : nonRepondants.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: EASE }}
                style={{ padding: "24px 20px", textAlign: "center" }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>✓</div>
                <div style={{ fontSize: 13, color: "#059669", fontWeight: 500 }}>Tous les clients ont répondu</div>
              </motion.div>
            ) : nonRepondants.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.04, duration: 0.35, ease: EASE }}
                whileHover={{ backgroundColor: "#FAFAFA" }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 20px",
                  borderBottom: i < nonRepondants.length - 1 ? "1px solid #F9FAFB" : "none",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: avatarColor(c.Nom),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "white",
                }}>
                  {initials(c.Nom)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.Nom}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>{c.Nb_relances || 0} relance(s)</div>
                </div>
                <StatusBadge statut={c.Statut} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
