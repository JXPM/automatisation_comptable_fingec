import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, FileSpreadsheet, Users, Mail, UserCog, X, ArrowRight, ArrowLeft, CheckCircle2,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { authFetch } from "../utils/api";
import { B, B_DARK } from "../theme";

const EASE = [0.22, 1, 0.36, 1] as const;

// Événement global pour rouvrir le guide depuis n'importe où (page Compte…).
export const OPEN_GUIDE_EVENT = "fingec:open-guide";
export function openOnboardingGuide() {
  window.dispatchEvent(new Event(OPEN_GUIDE_EVENT));
}

interface Slide {
  icon: typeof Sparkles;
  eyebrow: string;
  title: string;
  body: ReactNode;
}

function Badge({ children, color, bg }: { children: ReactNode; color: string; bg: string }) {
  return (
    <span style={{ fontSize: 12.5, fontWeight: 600, color, background: bg, padding: "4px 10px", borderRadius: 99 }}>
      {children}
    </span>
  );
}
const arrow: React.CSSProperties = { color: "var(--muted-2)", fontSize: 14, alignSelf: "center" };

const SLIDES: Slide[] = [
  {
    icon: Sparkles,
    eyebrow: "Bienvenue",
    title: "Votre espace Fingec",
    body: (
      <>
        Cet outil prépare votre <strong>comptabilité e‑commerce</strong> et automatise le suivi de
        vos clients. Ce petit guide vous montre l'essentiel en moins d'une minute.
        <br />
        Vous pourrez le rouvrir à tout moment depuis <strong>Paramètres du compte</strong>.
      </>
    ),
  },
  {
    icon: FileSpreadsheet,
    eyebrow: "Traitement",
    title: "Du fichier brut au journal Quadra",
    body: (
      <>
        Dans <strong>Traitement</strong>, déposez un fichier <strong>TikTok</strong> (Excel) ou
        <strong> Shopify</strong> (CSV), choisissez le <strong>pays</strong> (la TVA est calculée pour
        la France), et l'app génère le <strong>journal d'écritures prêt pour Quadra</strong> + un
        rapport de contrôle avec un score de fiabilité.
      </>
    ),
  },
  {
    icon: Users,
    eyebrow: "Clients & relances",
    title: "Suivez vos clients par statut",
    body: (
      <>
        Dans <strong>Clients</strong>, chaque client a un statut. Vos actions le font évoluer :
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          <Badge color="#6B7280" bg="#F3F4F6">En attente</Badge>
          <span style={arrow}>→</span>
          <Badge color="#1D4ED8" bg="#E0E7FF">Envoyé</Badge>
          <span style={arrow}>→</span>
          <Badge color="#B45309" bg="#FEF3C7">Relancé</Badge>
          <span style={arrow}>→</span>
          <Badge color="#15803D" bg="#DCFCE7">Reçu</Badge>
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
          « Envoyer le mail » → Envoyé · « Relancer » → Relancé · « ✓ Reçu » clôt le mois.
        </div>
      </>
    ),
  },
  {
    icon: Mail,
    eyebrow: "Nouveau mail",
    title: "Écrivez avec la signature du cabinet",
    body: (
      <>
        Dans <strong>Nouveau mail</strong>, composez un message libre : choisissez les destinataires
        dans le <strong>carnet d'adresses</strong>, l'objet, votre texte — la formule de politesse et
        la <strong>signature Fingec</strong> sont ajoutées automatiquement. Chaque destinataire reçoit
        un envoi séparé.
      </>
    ),
  },
  {
    icon: UserCog,
    eyebrow: "Votre compte",
    title: "Personnalisez votre profil",
    body: (
      <>
        Dans <strong>Paramètres du compte</strong>, modifiez votre <strong>nom</strong>, ajoutez une
        <strong> photo</strong> et changez votre <strong>mot de passe</strong>. C'est aussi là que
        vous pourrez <strong>relancer ce guide</strong> quand vous voulez.
      </>
    ),
  },
];

export default function OnboardingGuide() {
  const { user, updateUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const autoShown = useRef(false);

  // Ouverture automatique à la première connexion (compte pas encore « onboarded »).
  useEffect(() => {
    if (user && !user.onboarded && !autoShown.current) {
      autoShown.current = true;
      setStep(0);
      setOpen(true);
    }
  }, [user]);

  // Réouverture manuelle (depuis la page Compte).
  useEffect(() => {
    const handler = () => { setStep(0); setOpen(true); };
    window.addEventListener(OPEN_GUIDE_EVENT, handler);
    return () => window.removeEventListener(OPEN_GUIDE_EVENT, handler);
  }, []);

  if (!user) return null;

  const close = async () => {
    setOpen(false);
    // Mémorise que le guide a été vu (une seule fois, côté serveur).
    if (!user.onboarded) {
      try {
        const res = await authFetch("/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ onboarded: true }),
        });
        if (res.ok) updateUser(await res.json());
      } catch { /* sans gravité : réessaiera à la prochaine session */ }
    }
  };

  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];
  const Icon = slide.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={close}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(15,20,33,0.55)", backdropFilter: "blur(3px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Guide de prise en main"
            style={{
              width: "100%", maxWidth: 520, background: "var(--surface)", borderRadius: 20,
              boxShadow: "0 30px 80px -20px rgba(15,20,33,0.45)", overflow: "hidden", position: "relative",
            }}
          >
            {/* En-tête coloré */}
            <div style={{ position: "relative", padding: "26px 28px 22px", background: `linear-gradient(135deg, ${B}, ${B_DARK})`, color: "#fff" }}>
              <button
                onClick={close}
                aria-label="Fermer"
                style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 9, border: "none", cursor: "pointer", background: "rgba(255,255,255,0.16)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={17} />
              </button>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.24)" }}>
                <Icon size={22} strokeWidth={1.9} color="#fff" />
              </div>
              <div style={{ marginTop: 14, fontSize: 11.5, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.75)" }}>
                {slide.eyebrow} · {step + 1}/{SLIDES.length}
              </div>
              <h2 style={{ margin: "4px 0 0", fontFamily: "var(--font-display)", fontSize: 23, fontWeight: 700, letterSpacing: "-0.3px" }}>
                {slide.title}
              </h2>
            </div>

            {/* Corps */}
            <div style={{ padding: "22px 28px 8px", minHeight: 132 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  style={{ fontSize: 14.5, lineHeight: 1.62, color: "var(--ink-2)" }}
                >
                  {slide.body}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Pied : progression + navigation */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px 24px" }}>
              <div style={{ display: "flex", gap: 6 }}>
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    aria-label={`Étape ${i + 1}`}
                    style={{
                      width: i === step ? 22 : 7, height: 7, borderRadius: 99, border: "none", cursor: "pointer", padding: 0,
                      background: i === step ? B : "var(--line-2)", transition: "all 0.3s var(--ease)",
                    }}
                  />
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {step > 0 && (
                  <button onClick={() => setStep((s) => s - 1)} style={ghostBtn}>
                    <ArrowLeft size={15} /> Précédent
                  </button>
                )}
                {isLast ? (
                  <button onClick={close} style={primaryBtn}>
                    <CheckCircle2 size={16} /> C'est parti
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

const primaryBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 10,
  border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 640, color: "#fff",
  background: `linear-gradient(95deg, ${B}, ${B_DARK})`, boxShadow: "var(--shadow-glow)",
};
const ghostBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 12px", borderRadius: 10,
  border: "1px solid var(--line-2)", background: "#fff", cursor: "pointer", fontFamily: "inherit",
  fontSize: 13.5, fontWeight: 600, color: "var(--ink-2)",
};

// Pour reproposer le guide depuis l'app. Petit lien réutilisable.
export function GuideReplayLink() {
  return (
    <Link to="#" onClick={(e) => { e.preventDefault(); openOnboardingGuide(); }} style={{ color: B, fontWeight: 600, textDecoration: "none" }}>
      revoir le guide
    </Link>
  );
}
