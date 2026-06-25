import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles, FileSpreadsheet, Users, Mail, UserCog, X, ArrowRight, ArrowLeft, CheckCircle2,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { authFetch } from "../utils/api";
import { B, B_DARK } from "../theme";

// Événement global pour rouvrir la visite guidée depuis n'importe où (page Compte…).
export const OPEN_GUIDE_EVENT = "fingec:open-guide";
export function openOnboardingGuide() {
  window.dispatchEvent(new Event(OPEN_GUIDE_EVENT));
}

type Placement = "center" | "right" | "bottom";
interface Step {
  sel?: string;            // sélecteur de l'élément réel à mettre en avant
  placement: Placement;
  icon: typeof Sparkles;
  eyebrow: string;
  title: string;
  body: ReactNode;
}

function Badge({ children, color, bg }: { children: ReactNode; color: string; bg: string }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color, background: bg, padding: "3px 9px", borderRadius: 99 }}>
      {children}
    </span>
  );
}
const arrow: React.CSSProperties = { color: "var(--muted-2)", fontSize: 13 };

const STEPS: Step[] = [
  {
    placement: "center",
    icon: Sparkles,
    eyebrow: "Bienvenue",
    title: "Petit tour du propriétaire",
    body: (
      <>
        En quelques étapes, on vous montre <strong>directement sur l'écran</strong> où se trouve
        l'essentiel. Vous pourrez relancer cette visite quand vous voulez depuis
        <strong> Paramètres du compte</strong>.
      </>
    ),
  },
  {
    sel: '[data-tour="nav-/traitement"]',
    placement: "right",
    icon: FileSpreadsheet,
    eyebrow: "Traitement",
    title: "Traiter un fichier",
    body: (
      <>
        Ici, déposez un fichier <strong>TikTok</strong> (Excel) ou <strong>Shopify</strong> (CSV),
        choisissez le pays, et l'app génère le <strong>journal d'écritures prêt pour Quadra</strong>
        {" "}+ un rapport de contrôle.
      </>
    ),
  },
  {
    sel: '[data-tour="nav-/clients"]',
    placement: "right",
    icon: Users,
    eyebrow: "Clients & relances",
    title: "Suivre vos clients",
    body: (
      <>
        Le suivi des pièces se fait par statut :
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 12 }}>
          <Badge color="#6B7280" bg="#F3F4F6">En attente</Badge><span style={arrow}>→</span>
          <Badge color="#1D4ED8" bg="#E0E7FF">Envoyé</Badge><span style={arrow}>→</span>
          <Badge color="#B45309" bg="#FEF3C7">Relancé</Badge><span style={arrow}>→</span>
          <Badge color="#15803D" bg="#DCFCE7">Reçu</Badge>
        </div>
        <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--muted)" }}>
          « Envoyer le mail » → Envoyé · « Relancer » → Relancé · « ✓ Reçu » clôt le mois.
        </div>
      </>
    ),
  },
  {
    sel: '[data-tour="nav-/mail"]',
    placement: "right",
    icon: Mail,
    eyebrow: "Nouveau mail",
    title: "Écrire un e-mail",
    body: (
      <>
        Composez un message libre : destinataires depuis le <strong>carnet d'adresses</strong>, objet,
        texte — la <strong>signature du cabinet</strong> est ajoutée automatiquement.
      </>
    ),
  },
  {
    sel: '[data-tour="account"]',
    placement: "bottom",
    icon: UserCog,
    eyebrow: "Votre compte",
    title: "Profil & réglages",
    body: (
      <>
        Votre avatar ouvre les <strong>Paramètres du compte</strong> : nom, <strong>photo</strong>,
        mot de passe — et le bouton pour <strong>revoir cette visite</strong>.
      </>
    ),
  },
];

const PAD = 8; // marge autour de l'élément mis en avant

export default function OnboardingGuide() {
  const { user, updateUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const autoShown = useRef(false);

  const current = STEPS[step];

  // Ouverture automatique à la première connexion.
  useEffect(() => {
    if (user && !user.onboarded && !autoShown.current) {
      autoShown.current = true;
      setStep(0);
      setOpen(true);
    }
  }, [user]);

  // Réouverture manuelle (page Compte).
  useEffect(() => {
    const handler = () => { setStep(0); setOpen(true); };
    window.addEventListener(OPEN_GUIDE_EVENT, handler);
    return () => window.removeEventListener(OPEN_GUIDE_EVENT, handler);
  }, []);

  // Localise l'élément réel ciblé par l'étape et suit ses déplacements.
  useLayoutEffect(() => {
    if (!open) return;
    if (!current.sel) { setRect(null); return; }
    const measure = () => {
      const el = document.querySelector(current.sel!);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    el_scroll(current.sel);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const id = window.setTimeout(measure, 350); // après transitions de page
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      window.clearTimeout(id);
    };
  }, [open, step, current.sel]);

  if (!user) return null;

  const close = async () => {
    setOpen(false);
    if (!user.onboarded) {
      try {
        const res = await authFetch("/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ onboarded: true }),
        });
        if (res.ok) updateUser(await res.json());
      } catch { /* réessaiera à la prochaine session */ }
    }
  };

  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;
  const anchored = !!current.sel && !!rect;
  const tip = tooltipStyle(anchored ? rect : null, current.placement);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="tour"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ position: "fixed", inset: 0, zIndex: 1000 }}
        >
          {/* Voile : plein écran si pas de cible, sinon « trou » lumineux sur l'élément */}
          {anchored ? (
            <div
              style={{
                position: "fixed",
                top: rect!.top - PAD, left: rect!.left - PAD,
                width: rect!.width + PAD * 2, height: rect!.height + PAD * 2,
                borderRadius: 12, pointerEvents: "none",
                boxShadow: "0 0 0 9999px rgba(15,20,33,0.62)",
                border: "2px solid rgba(255,255,255,0.92)",
                transition: "all 0.32s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          ) : (
            <div style={{ position: "fixed", inset: 0, background: "rgba(15,20,33,0.62)", backdropFilter: "blur(2px)" }} />
          )}

          {/* Capte les clics hors bulle (on avance avec les boutons) */}
          <div style={{ position: "fixed", inset: 0 }} onClick={() => { /* bloque l'app pendant la visite */ }} />

          {/* La bulle */}
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Visite guidée"
            style={{
              position: "fixed", width: 340, maxWidth: "calc(100vw - 32px)",
              background: "var(--surface)", borderRadius: 16, overflow: "hidden",
              boxShadow: "0 24px 60px -16px rgba(15,20,33,0.5)", ...tip,
            }}
          >
            {/* En-tête coloré */}
            <div style={{ position: "relative", padding: "18px 20px 16px", background: `linear-gradient(135deg, ${B}, ${B_DARK})`, color: "#fff" }}>
              <button
                onClick={close}
                aria-label="Fermer"
                style={{ position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(255,255,255,0.16)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={15} />
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.24)" }}>
                  <Icon size={18} strokeWidth={1.9} color="#fff" />
                </span>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "rgba(255,255,255,0.75)" }}>
                    {current.eyebrow} · {step + 1}/{STEPS.length}
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, letterSpacing: "-0.2px" }}>
                    {current.title}
                  </div>
                </div>
              </div>
            </div>

            {/* Corps */}
            <div style={{ padding: "16px 20px 6px", fontSize: 13.6, lineHeight: 1.58, color: "var(--ink-2)" }}>
              {current.body}
            </div>

            {/* Pied : progression + navigation */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 18px" }}>
              <div style={{ display: "flex", gap: 5 }}>
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    aria-label={`Étape ${i + 1}`}
                    style={{ width: i === step ? 18 : 6, height: 6, borderRadius: 99, border: "none", cursor: "pointer", padding: 0, background: i === step ? B : "var(--line-2)", transition: "all 0.3s var(--ease)" }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {step > 0 && (
                  <button onClick={() => setStep((s) => s - 1)} style={ghostBtn} aria-label="Précédent">
                    <ArrowLeft size={15} />
                  </button>
                )}
                {isLast ? (
                  <button onClick={close} style={primaryBtn}>
                    <CheckCircle2 size={15} /> Terminer
                  </button>
                ) : (
                  <button onClick={() => setStep((s) => s + 1)} style={primaryBtn}>
                    Suivant <ArrowRight size={15} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Fait défiler l'élément ciblé dans la vue s'il est hors écran.
function el_scroll(sel: string) {
  const el = document.querySelector(sel);
  if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

// Calcule la position de la bulle selon l'élément ciblé et le placement souhaité.
function tooltipStyle(rect: DOMRect | null, placement: Placement): React.CSSProperties {
  const W = 340, GAP = 16, M = 16;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  if (!rect || placement === "center") {
    return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
  }
  if (placement === "bottom") {
    const top = Math.min(rect.bottom + GAP, vh - 220);
    const right = Math.max(M, vw - rect.right);
    return { top, right };
  }
  // "right" : à droite de l'élément (barre latérale), centré verticalement, borné à l'écran.
  let left = rect.right + GAP;
  if (left + W > vw - M) left = Math.max(M, rect.left - W - GAP); // bascule à gauche si pas la place
  const top = Math.max(M, Math.min(rect.top + rect.height / 2 - 70, vh - 240));
  return { left, top };
}

const primaryBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 15px", borderRadius: 9,
  border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 640, color: "#fff",
  background: `linear-gradient(95deg, ${B}, ${B_DARK})`, boxShadow: "var(--shadow-glow)",
};
const ghostBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 9,
  border: "1px solid var(--line-2)", background: "#fff", cursor: "pointer", color: "var(--ink-2)",
};

// Lien réutilisable pour reproposer la visite depuis l'app.
export function GuideReplayLink() {
  return (
    <Link to="#" onClick={(e) => { e.preventDefault(); openOnboardingGuide(); }} style={{ color: B, fontWeight: 600, textDecoration: "none" }}>
      revoir la visite
    </Link>
  );
}
