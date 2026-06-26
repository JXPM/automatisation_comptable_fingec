// Client typé de l'API de catégorisation comptable (/api/ai).
// S'appuie sur authFetch : le cookie de session httpOnly est envoyé
// automatiquement, et un 401 déclenche la déconnexion globale.
import { authFetch } from "./api";

export interface Alternative {
  category: string;
  label: string;
  account: string;
  confidence: number;
}

export interface Prediction {
  input: string;
  category: string;
  label: string;
  account: string;
  confidence: number;
  review: boolean;
  alternatives: Alternative[];
}

export interface ModelInfo {
  model_version: string;
  trained_at: string;
  metrics: { accuracy?: number; f1_macro?: number };
  categories: string[];
  review_threshold: number;
}

export interface BatchResult {
  count: number;
  review_count: number;
  predictions: Prediction[];
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `Erreur ${res.status}.`);
  }
  return res.json() as Promise<T>;
}

/** Métadonnées du modèle en service (version, métriques, seuil de revue). */
export async function aiInfo(): Promise<ModelInfo> {
  return parse<ModelInfo>(await authFetch("/api/ai/info"));
}

/** Catégorise un lot de libellés (une composante de transaction par entrée). */
export async function categorizeBatch(labels: string[]): Promise<BatchResult> {
  return parse<BatchResult>(
    await authFetch("/api/ai/categorize-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labels }),
    }),
  );
}

export interface Category {
  key: string;
  label: string;
  account: string;
  description: string;
}

/** Référentiel des catégories (pour les menus de correction). */
export async function getCategories(): Promise<Category[]> {
  return parse<Category[]>(await authFetch("/api/ai/categories"));
}

/** Enregistre une correction du comptable (boucle de feedback). */
export async function sendFeedback(input: {
  label: string;
  predicted_category: string;
  predicted_confidence: number;
  corrected_category: string;
}): Promise<{ corrected_label: string; corrected_account: string }> {
  return parse(
    await authFetch("/api/ai/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export interface Monitoring {
  total_predictions: number;
  review_count: number;
  review_rate: number;
  avg_confidence: number | null;
  confidence_histogram: Record<string, number>;
  per_category: { category: string; count: number; avg_confidence: number }[];
  daily: { day: string; count: number; avg_confidence: number }[];
  feedback_count: number;
  correction_count: number;
  correction_rate: number | null;
  model: ModelInfo | null;
}

/** Métriques de surveillance du modèle (admin). */
export async function getMonitoring(): Promise<Monitoring> {
  return parse<Monitoring>(await authFetch("/api/ai/monitoring"));
}

/** Réentraîne le modèle en incorporant le feedback (admin). */
export async function retrain(): Promise<{
  model_version: string;
  n_feedback_used: number;
  accuracy: number;
  f1_macro: number;
  holdout_accuracy: number;
}> {
  return parse(await authFetch("/api/ai/retrain", { method: "POST" }));
}
