import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import PageHeader from "../components/PageHeader";
import { B } from "../theme";
import { getMonitoring, retrain, type Monitoring } from "../utils/ai";

export default function MonitoringIAPage() {
  const [data, setData] = useState<Monitoring | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retraining, setRetraining] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    getMonitoring().then(setData).catch((e) =>
      setError(e instanceof Error ? e.message : "Erreur de chargement."));
  }, []);

  useEffect(() => { load(); }, [load]);

  const doRetrain = async () => {
    setRetraining(true);
    setToast(null);
    try {
      const r = await retrain();
      setToast(`Modèle v${r.model_version} réentraîné — ${r.n_feedback_used} correction(s) intégrée(s), exactitude libellés inédits ${Math.round(r.holdout_accuracy * 100)} %.`);
      load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Échec du réentraînement.");
    } finally {
      setRetraining(false);
    }
  };

  if (error) {
    return (
      <div style={{ padding: "36px 40px" }}>
        <div style={{ padding: "14px 18px", borderRadius: 12, background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", fontSize: 13 }}>{error}</div>
      </div>
    );
  }
  if (!data) {
    return <div style={{ padding: "36px 40px", color: "#9CA3AF", fontSize: 14 }}>Chargement du monitorage…</div>;
  }

  const maxHist = Math.max(1, ...Object.values(data.confidence_histogram));
  const maxCat = Math.max(1, ...data.per_category.map((c) => c.count));

  return (
    <div style={{ padding: "36px 40px", display: "flex", flexDirection: "column", gap: 22, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <PageHeader
          eyebrow="Intelligence artificielle"
          title="Monitorage du modèle"
          subtitle="Surveillance de la qualité des prédictions en production : volume, confiance, taux de revue, dérive et boucle de feedback."
          style={{ marginBottom: 0 }}
        />
        <motion.button
          onClick={doRetrain}
          disabled={retraining}
          whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
          style={{
            padding: "11px 20px", borderRadius: 10, border: "none",
            background: retraining ? "#9CA3AF" : B, color: "white",
            fontSize: 13.5, fontWeight: 600, cursor: retraining ? "default" : "pointer",
            boxShadow: "0 4px 14px -4px rgba(167,34,49,0.45)", whiteSpace: "nowrap",
          }}
        >
          {retraining ? "Réentraînement…" : "Réentraîner sur le feedback"}
        </motion.button>
      </div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: "12px 16px", borderRadius: 12, background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46", fontSize: 13 }}
        >
          {toast}
        </motion.div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        <Kpi label="Prédictions" value={`${data.total_predictions}`} />
        <Kpi label="Confiance moyenne" value={data.avg_confidence != null ? `${Math.round(data.avg_confidence * 100)} %` : "—"} />
        <Kpi label="Taux de revue" value={`${Math.round(data.review_rate * 100)} %`} accent={data.review_rate > 0.3 ? "#D97706" : undefined} />
        <Kpi label="Corrections reçues" value={`${data.feedback_count}`} />
        <Kpi label="Taux de correction" value={data.correction_rate != null ? `${Math.round(data.correction_rate * 100)} %` : "—"} />
      </div>

      {data.total_predictions === 0 ? (
        <Card><div style={{ padding: 24, color: "#9CA3AF", fontSize: 13.5 }}>Aucune prédiction enregistrée pour l'instant. Utilise l'écran « Catégorisation IA » pour générer des données de monitorage.</div></Card>
      ) : (
        <>
          {/* Histogramme de confiance */}
          <Card>
            <CardTitle>Distribution de la confiance</CardTitle>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, padding: "8px 4px 0" }}>
              {Object.entries(data.confidence_histogram).map(([range, n]) => {
                const lo = parseInt(range.split("-")[0], 10);
                const color = lo < 55 ? "#DC2626" : lo < 75 ? "#D97706" : "#059669";
                return (
                  <div key={range} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "#6B7280" }}>{n || ""}</span>
                    <div title={`${range} % : ${n}`} style={{ width: "100%", height: `${(n / maxHist) * 100}%`, minHeight: n ? 3 : 0, background: color, borderRadius: "4px 4px 0 0" }} />
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>{lo}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 8 }}>Axe X : confiance (%) · Axe Y : nombre de prédictions · rouge = sous le seuil de revue.</div>
          </Card>

          {/* Par catégorie */}
          <Card>
            <CardTitle>Répartition par catégorie</CardTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: "4px 2px" }}>
              {data.per_category.map((c) => (
                <div key={c.category} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 120, fontSize: 12.5, color: "#374151", textTransform: "capitalize" }}>{c.category}</span>
                  <div style={{ flex: 1, height: 8, background: "#F1F2F5", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${(c.count / maxCat) * 100}%`, height: "100%", background: B, borderRadius: 99 }} />
                  </div>
                  <span style={{ width: 36, fontSize: 12, fontWeight: 600, color: "#141A26", textAlign: "right" }}>{c.count}</span>
                  <span style={{ width: 48, fontSize: 11.5, color: "#9CA3AF", textAlign: "right" }}>{Math.round(c.avg_confidence * 100)} %</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Dérive (confiance moyenne par jour) */}
          {data.daily.length > 1 && (
            <Card>
              <CardTitle>Dérive — confiance moyenne par jour</CardTitle>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 110, padding: "8px 4px 0" }}>
                {data.daily.map((d) => (
                  <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <div title={`${d.day} : ${Math.round(d.avg_confidence * 100)} % (${d.count})`} style={{ width: "70%", height: `${d.avg_confidence * 100}%`, background: "#6366F1", borderRadius: "4px 4px 0 0" }} />
                    <span style={{ fontSize: 9.5, color: "#9CA3AF" }}>{d.day.slice(5)}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 8 }}>Une baisse durable de la confiance moyenne signale une dérive (nouveaux libellés non couverts) → déclencher un réentraînement.</div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: "white", border: "1px solid #ECEEF2", borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: accent ?? "#141A26" }}>{value}</div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "white", border: "1px solid #ECEEF2", borderRadius: 16, padding: "18px 22px", boxShadow: "0 1px 2px rgba(15,20,33,0.04)" }}>
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 14, fontWeight: 700, color: "#141A26", marginBottom: 14 }}>{children}</div>;
}
