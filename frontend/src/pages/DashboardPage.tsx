import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../auth/AuthContext";
import { B } from "../theme";
import { avatarColor, initials } from "../utils/clients";
import { authFetch } from "../utils/api";

interface Client {
  Nom: string;
  Email: string;
  Statut: string;
  Nb_relances?: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  filename: string;
  country: string;
  rows: number;
  reliability_score: number;
  errors: number;
  warnings: number;
  anomaly_count: number;
  output_file: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

// Palette neutre unique pour les pictos (pas de couleurs « arc-en-ciel »).
const INK = "#141A26";
const MUTED = "#6B7280";
const FAINT = "#9CA3AF";
const LINE = "#E9EBF0";
const ICON_BG = "#F3F4F7";

/** Compteur qui s'anime en douceur vers sa valeur cible. */
function AnimatedCount({ value, loading, suffix }: { value: number; loading: boolean; suffix?: string }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 90, damping: 20, mass: 0.6 });
  const display = useTransform(spring, (v) => Math.round(v).toString());
  useEffect(() => { mv.set(value); }, [value, mv]);

  if (loading) {
    return <span className="skeleton" style={{ display: "inline-block", width: 46, height: 26, borderRadius: 6 }} />;
  }
  return <span style={{ fontVariantNumeric: "tabular-nums" }}><motion.span>{display}</motion.span>{suffix}</span>;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
    + " · " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function Icon({ d, size = 16, stroke = "currentColor", width = 1.8 }: { d: ReactNode; size?: number; stroke?: string; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
  );
}

/** Titre de section : filet d'accent + libellé + action optionnelle à droite. */
function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", margin: "40px 0 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <span style={{ width: 4, height: 16, borderRadius: 2, background: B }} />
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: INK, letterSpacing: "-0.1px" }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

const panel: React.CSSProperties = {
  background: "white", borderRadius: 16, border: `1px solid ${LINE}`,
  boxShadow: "0 1px 2px rgba(15,20,33,0.03)", overflow: "hidden",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, lRes] = await Promise.all([
        authFetch("/api/clients").catch(() => null),
        authFetch("/logs").catch(() => null),
      ]);
      const cData = cRes && cRes.ok ? await cRes.json() : [];
      const lData = lRes && lRes.ok ? await lRes.json() : [];
      setClients(Array.isArray(cData) ? cData : []);
      setLogs(Array.isArray(lData) ? lData : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Salutation selon l'heure ──────────────────────────────────────────────
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour >= 5 && hour < 18 ? "Bonjour" : "Bonsoir";
  const firstName = (user?.full_name || "").trim().split(/\s+/)[0] || "";
  const monthLabel = now.toLocaleDateString("fr-FR", { month: "long" });
  const monthCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  // ── Indicateurs clients ───────────────────────────────────────────────────
  const recu = clients.filter(c => c.Statut === "Reçu").length;
  const relance = clients.filter(c => c.Statut === "Relancé").length;
  const nonRecus = clients.filter(c => c.Statut !== "Reçu");
  const taux = clients.length > 0 ? Math.round((recu / clients.length) * 100) : 0;

  // ── Indicateurs traitements (mois en cours) ───────────────────────────────
  const sameMonth = (iso: string) => {
    const d = new Date(iso);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };
  const logsMois = logs.filter(l => sameMonth(l.timestamp));
  const fichiersMois = logsMois.length;
  const lignesMois = logsMois.reduce((s, l) => s + (l.rows || 0), 0);
  const fichiersAnomalies = logs.filter(l => (l.errors || 0) > 0).length;
  const recentLogs = [...logs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  // ── Raccourcis ────────────────────────────────────────────────────────────
  const shortcuts = [
    { to: "/traitement", label: "Traiter un fichier", primary: true,
      icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></> },
    { to: "/clients", label: "Relancer un client",
      icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></> },
    { to: "/mail", label: "Nouveau mail",
      icon: <><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/></> },
  ];

  // ── Chiffres clés (un seul panneau divisé en cellules) ────────────────────
  const KPIS = [
    { label: "Clients suivis", value: clients.length,
      icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></> },
    { label: "Taux de réception", value: taux, suffix: "%", goodWhen: taux >= 80,
      icon: <polyline points="20 6 9 17 4 12"/> },
    { label: `Fichiers traités · ${monthCap}`, value: fichiersMois,
      icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></> },
    { label: `Lignes générées · ${monthCap}`, value: lignesMois,
      icon: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></> },
  ];

  // ── Actions à faire ───────────────────────────────────────────────────────
  const todos = [
    { label: "Documents en attente", count: nonRecus.length, unit: "client" + (nonRecus.length > 1 ? "s" : ""), cta: "Relancer", to: "/clients", tone: nonRecus.length > 0 ? "warn" : "ok" },
    { label: "Traitements à vérifier", count: fichiersAnomalies, unit: "fichier" + (fichiersAnomalies > 1 ? "s" : ""), cta: "Voir les logs", to: "/logs", tone: fichiersAnomalies > 0 ? "warn" : "ok" },
    { label: "Relances en cours", count: relance, unit: "client" + (relance > 1 ? "s" : ""), cta: "Suivre", to: "/clients", tone: "neutral" },
  ];

  return (
    <div style={{ maxWidth: 1500, margin: "0 auto", padding: "30px 40px 56px" }}>

      {/* ── Salutation + raccourcis ── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}
      >
        <div>
          <div style={{ fontSize: 12.5, color: FAINT, fontWeight: 500, textTransform: "capitalize", marginBottom: 7 }}>
            {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 31, fontWeight: 700, color: INK, margin: 0, letterSpacing: "-0.5px" }}>
            {greeting}{firstName ? " " : ""}<span style={{ color: B }}>{firstName}</span>
          </h1>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {shortcuts.map((s, i) => (
            <motion.div key={s.to + s.label}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.05, duration: 0.4, ease: EASE }}
            >
              <Link to={s.to}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 9,
                  padding: "10px 16px", borderRadius: 10, textDecoration: "none",
                  fontSize: 13.5, fontWeight: 600,
                  ...(s.primary
                    ? { background: B, color: "white", border: `1px solid ${B}`, boxShadow: "0 6px 16px -8px rgba(167,34,49,0.55)" }
                    : { background: "white", color: "#2A2F3D", border: `1px solid ${LINE}`, boxShadow: "0 1px 2px rgba(15,20,33,0.04)" }),
                  transition: "transform 0.15s var(--ease), box-shadow 0.15s var(--ease)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
              >
                <Icon d={s.icon} stroke={s.primary ? "white" : B} />
                {s.label}
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Chiffres clés — panneau unique divisé ── */}
      <SectionHeader title={`Chiffres clés · ${monthCap}`}
        action={<Link to="/historique" style={{ fontSize: 12.5, fontWeight: 600, color: B, textDecoration: "none" }}>Voir l'historique →</Link>} />
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}
        style={{ ...panel, display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        {KPIS.map(({ label, value, suffix, goodWhen, icon }, i) => (
          <div key={label} style={{ padding: "22px 26px", borderRight: i < KPIS.length - 1 ? `1px solid ${LINE}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: ICON_BG, color: FAINT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon d={icon} size={15} width={1.9} />
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: MUTED }}>{label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: INK, lineHeight: 1, letterSpacing: "-0.8px" }}>
                <AnimatedCount value={value} loading={loading} suffix={suffix} />
              </div>
              {goodWhen !== undefined && !loading && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11.5, fontWeight: 600,
                  color: goodWhen ? "#067A57" : "#B4233F",
                }}>
                  <Icon d={goodWhen ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>} size={12} width={2.4} />
                  {recu}/{clients.length}
                </span>
              )}
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Actions à faire — panneau unique divisé ── */}
      <SectionHeader title="Actions à faire" />
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}
        style={{ ...panel, display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        {todos.map((t, i) => {
          const isDone = t.tone === "ok" && t.count === 0;
          const toneColor = t.tone === "warn" ? "#B4671F" : t.tone === "ok" ? "#067A57" : B;
          return (
            <div key={t.label} style={{
              padding: "20px 26px", borderRight: i < todos.length - 1 ? `1px solid ${LINE}` : "none",
              display: "flex", flexDirection: "column", gap: 14, minHeight: 132,
            }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: MUTED }}>{t.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flex: 1 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: isDone ? "#067A57" : INK, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.6px" }}>
                  {loading ? "—" : t.count}
                </span>
                {!isDone && <span style={{ fontSize: 13, color: FAINT }}>{t.unit}</span>}
              </div>
              {isDone ? (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#067A57", fontWeight: 600 }}>
                  <Icon d={<polyline points="20 6 9 17 4 12"/>} size={15} width={2.4} /> À jour
                </div>
              ) : (
                <Link to={t.to} style={{
                  alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 8, textDecoration: "none",
                  background: `${toneColor}12`, color: toneColor, fontSize: 13, fontWeight: 600,
                }}>
                  {t.cta}
                  <Icon d={<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>} size={13} width={2.4} />
                </Link>
              )}
            </div>
          );
        })}
      </motion.div>

      {/* ── Activités récentes ── */}
      <SectionHeader title="Activités récentes" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Derniers traitements */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }} style={panel}>
          <div style={{ padding: "15px 22px 13px", borderBottom: `1px solid ${LINE}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>Derniers traitements</span>
            <Link to="/historique" style={{ fontSize: 12, fontWeight: 600, color: B, textDecoration: "none" }}>Voir tout</Link>
          </div>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center", color: FAINT, fontSize: 13 }}>Chargement…</div>
          ) : recentLogs.length === 0 ? (
            <div style={{ padding: "28px 22px", textAlign: "center", color: FAINT, fontSize: 13 }}>Aucun traitement pour le moment.</div>
          ) : recentLogs.map((l, i) => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 22px", borderBottom: i < recentLogs.length - 1 ? `1px solid ${LINE}` : "none" }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: ICON_BG, color: FAINT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>} size={15} width={1.9} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.filename}</div>
                <div style={{ fontSize: 11.5, color: FAINT, fontVariantNumeric: "tabular-nums" }}>{fmtDate(l.timestamp)} · {l.rows} lignes</div>
              </div>
              <span style={{
                flexShrink: 0, padding: "2px 9px", borderRadius: 99, fontSize: 11.5, fontWeight: 600, fontVariantNumeric: "tabular-nums",
                ...(l.reliability_score >= 90 ? { background: "#E6F6EF", color: "#067A57" }
                  : l.reliability_score >= 70 ? { background: "#FBF0DC", color: "#9A6312" }
                  : { background: "#FBE7EA", color: "#B4233F" }),
              }}>{l.reliability_score}%</span>
            </div>
          ))}
        </motion.div>

        {/* Clients en attente */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.45, ease: EASE }} style={panel}>
          <div style={{ padding: "15px 22px 13px", borderBottom: `1px solid ${LINE}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>Clients en attente</span>
            <Link to="/clients" style={{ fontSize: 12, fontWeight: 600, color: B, textDecoration: "none" }}>Voir tout</Link>
          </div>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center", color: FAINT, fontSize: 13 }}>Chargement…</div>
          ) : nonRecus.length === 0 ? (
            <div style={{ padding: "30px 22px", textAlign: "center" }}>
              <div style={{ width: 38, height: 38, margin: "0 auto 10px", borderRadius: "50%", background: "#E6F6EF", color: "#067A57", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon d={<polyline points="20 6 9 17 4 12"/>} size={18} width={2.4} />
              </div>
              <div style={{ fontSize: 13, color: "#067A57", fontWeight: 600 }}>Tous les clients ont répondu</div>
            </div>
          ) : nonRecus.slice(0, 5).map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 22px", borderBottom: i < Math.min(nonRecus.length, 5) - 1 ? `1px solid ${LINE}` : "none" }}>
              <span style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: avatarColor(c.Nom), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white" }}>
                {initials(c.Nom)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.Nom}</div>
                <div style={{ fontSize: 11.5, color: FAINT }}>{c.Nb_relances || 0} relance(s)</div>
              </div>
              <StatusBadge statut={c.Statut} />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
