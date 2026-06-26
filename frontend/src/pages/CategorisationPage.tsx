import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "../components/PageHeader";
import { B } from "../theme";
import {
  aiInfo, categorizeBatch, getCategories, sendFeedback,
  type ModelInfo, type Prediction, type Category,
} from "../utils/ai";

const EASE = [0.22, 1, 0.36, 1] as const;

// Exemples pré-remplis : libellés réels de relevés TikTok/Shopify pour une
// démonstration immédiate (un par ligne).
const SAMPLE = [
  "TikTok Shop commission fee",
  "Affiliate Shop Ads commission",
  "Customer shipping fee",
  "Tax and duty",
  "Net sales",
  "EPR Pay on Behalf service fee",
  "Refunded customer shipping fee",
  "Adjustment amount",
].join("\n");

function confidenceColor(p: Prediction): string {
  if (p.review) return "#DC2626";        // sous le seuil → rouge (à revoir)
  if (p.confidence < 0.75) return "#D97706"; // moyen → ambre
  return "#059669";                       // élevé → vert
}

export default function CategorisationPage() {
  const [text, setText] = useState(SAMPLE);
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [preds, setPreds] = useState<Prediction[] | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    aiInfo().then(setInfo).catch(() => setInfo(null));
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const run = async () => {
    const labels = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (labels.length === 0) {
      setError("Saisis au moins un libellé.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await categorizeBatch(labels);
      setPreds(res.predictions);
      setReviewCount(res.review_count);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de la catégorisation.");
      setPreds(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "36px 40px", display: "flex", flexDirection: "column", gap: 22, maxWidth: 1100, margin: "0 auto" }}>
      <PageHeader
        eyebrow="Intelligence artificielle"
        title="Catégorisation comptable"
        subtitle="Le modèle propose un compte Quadra pour chaque libellé de transaction, avec un score de confiance. Les cas peu sûrs sont signalés « à revoir »."
        style={{ marginBottom: 0 }}
      />

      {/* Carte d'identité du modèle */}
      {info && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          style={{
            display: "flex", gap: 26, flexWrap: "wrap", alignItems: "center",
            background: "white", border: "1px solid #ECEEF2", borderRadius: 14,
            padding: "14px 20px", fontSize: 13, color: "#374151",
          }}
        >
          <Stat label="Modèle" value={`v${info.model_version}`} />
          <Stat label="Exactitude (test)" value={info.metrics.accuracy != null ? `${Math.round(info.metrics.accuracy * 100)} %` : "—"} />
          <Stat label="Seuil de revue" value={`${Math.round(info.review_threshold * 100)} %`} />
          <Stat label="Catégories" value={`${info.categories.length}`} />
        </motion.div>
      )}

      {/* Saisie */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.45, ease: EASE }}
        style={{
          background: "white", border: "1px solid #ECEEF2", borderRadius: 16,
          padding: "22px 24px",
          boxShadow: "0 1px 2px rgba(15,20,33,0.04), 0 8px 24px -10px rgba(15,20,33,0.08)",
        }}
      >
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#141A26", marginBottom: 8 }}>
          Libellés à catégoriser <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(un par ligne)</span>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          spellCheck={false}
          style={{
            width: "100%", boxSizing: "border-box", resize: "vertical",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 13, lineHeight: 1.6, color: "#1F2937",
            padding: "12px 14px", borderRadius: 10, border: "1px solid #E5E7EB",
            background: "#FCFCFD", outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
          <motion.button
            onClick={run}
            disabled={loading}
            whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
            style={{
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: loading ? "#9CA3AF" : B, color: "white",
              fontSize: 13.5, fontWeight: 600, cursor: loading ? "default" : "pointer",
              boxShadow: "0 4px 14px -4px rgba(167,34,49,0.45)",
            }}
          >
            {loading ? "Analyse en cours…" : "Catégoriser"}
          </motion.button>
          <button
            onClick={() => { setText(SAMPLE); setPreds(null); setError(null); }}
            style={{
              padding: "10px 16px", borderRadius: 10, border: "1px solid #E5E7EB",
              background: "white", color: "#6B7280", fontSize: 13, cursor: "pointer",
            }}
          >
            Réinitialiser
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              padding: "12px 16px", borderRadius: 12, background: "#FEF2F2",
              border: "1px solid #FECACA", fontSize: 13, color: "#B91C1C",
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Résultats */}
      <AnimatePresence>
        {preds && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            style={{
              background: "white", border: "1px solid #ECEEF2", borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 1px 2px rgba(15,20,33,0.04), 0 8px 24px -10px rgba(15,20,33,0.08)",
            }}
          >
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 20px", borderBottom: "1px solid #F1F2F5",
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#141A26" }}>
                {preds.length} ligne{preds.length > 1 ? "s" : ""} catégorisée{preds.length > 1 ? "s" : ""}
              </span>
              {reviewCount > 0 && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "4px 11px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                  background: "#FEF3C7", color: "#92400E",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#D97706" }} />
                  {reviewCount} à revoir
                </span>
              )}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#6B7280", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    <th style={{ padding: "10px 20px", fontWeight: 600 }}>Libellé</th>
                    <th style={{ padding: "10px 14px", fontWeight: 600 }}>Catégorie prédite</th>
                    <th style={{ padding: "10px 14px", fontWeight: 600 }}>Compte</th>
                    <th style={{ padding: "10px 14px", fontWeight: 600, width: 170 }}>Confiance</th>
                    <th style={{ padding: "10px 14px", fontWeight: 600 }}>État</th>
                    <th style={{ padding: "10px 20px", fontWeight: 600 }}>Correction</th>
                  </tr>
                </thead>
                <tbody>
                  {preds.map((p, i) => {
                    const color = confidenceColor(p);
                    return (
                      <tr key={i} style={{
                        borderTop: "1px solid #F4F5F7",
                        background: p.review ? "#FFFBEB" : "transparent",
                      }}>
                        <td style={{ padding: "11px 20px", color: "#1F2937", fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}>{p.input}</td>
                        <td style={{ padding: "11px 14px", fontWeight: 600, color: "#141A26" }}>{p.label}</td>
                        <td style={{ padding: "11px 14px", fontFamily: "ui-monospace, monospace", color: "#4B5563" }}>{p.account}</td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 6, borderRadius: 99, background: "#F1F2F5", overflow: "hidden" }}>
                              <div style={{ width: `${Math.round(p.confidence * 100)}%`, height: "100%", background: color, borderRadius: 99 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 34 }}>{Math.round(p.confidence * 100)}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          {p.review ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#92400E", fontWeight: 600, fontSize: 12 }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#D97706" }} /> À revoir
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#065F46", fontWeight: 600, fontSize: 12 }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981" }} /> Auto
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "11px 20px" }}>
                          <CorrectionCell prediction={p} categories={categories} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "12px 20px", fontSize: 12, color: "#9CA3AF", borderTop: "1px solid #F4F5F7" }}>
              Les lignes « à revoir » (confiance &lt; seuil) doivent être validées par le comptable. La correction de ces cas alimentera le réentraînement du modèle.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: "#141A26" }}>{value}</span>
    </div>
  );
}

// Cellule de correction : le comptable choisit la bonne catégorie et l'envoie
// au modèle (boucle de feedback). Une fois corrigée, l'état est figé.
function CorrectionCell({ prediction, categories }: { prediction: Prediction; categories: Category[] }) {
  const [choice, setChoice] = useState(prediction.category);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const changed = choice !== prediction.category;

  if (saved) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#065F46", fontWeight: 600 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Corrigé
      </span>
    );
  }

  const submit = async () => {
    setBusy(true);
    try {
      await sendFeedback({
        label: prediction.input,
        predicted_category: prediction.category,
        predicted_confidence: prediction.confidence,
        corrected_category: choice,
      });
      setSaved(true);
    } catch {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <select
        value={choice}
        onChange={(e) => setChoice(e.target.value)}
        style={{
          fontSize: 12, padding: "5px 7px", borderRadius: 7,
          border: "1px solid #E5E7EB", background: "white", color: "#374151", cursor: "pointer",
        }}
      >
        {categories.map((c) => (
          <option key={c.key} value={c.key}>{c.label}</option>
        ))}
      </select>
      {changed && (
        <button
          onClick={submit}
          disabled={busy}
          style={{
            fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 7,
            border: "none", background: B, color: "white", cursor: "pointer",
          }}
        >
          {busy ? "…" : "Valider"}
        </button>
      )}
    </div>
  );
}
