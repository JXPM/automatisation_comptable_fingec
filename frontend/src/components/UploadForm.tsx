import { useRef, useState } from "react";
import type { ProcessResult } from "../pages/TraitementPage";
import { B } from "../theme";
import { authFetch } from "../utils/api";

type Props = {
  onResult: (data: ProcessResult, filename: string, country: string) => void;
  onError: (msg: string) => void;
  onLoading: (v: boolean) => void;
  loading: boolean;
};

export default function UploadForm({ onResult, onError, onLoading, loading }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [country, setCountry] = useState("France");
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    const dt = new DataTransfer();
    dt.items.add(file);
    if (fileRef.current) fileRef.current.files = dt.files;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { onError("Veuillez sélectionner un fichier."); return; }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("country", country);

    onLoading(true);
    try {
      const res = await authFetch(`/process`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erreur de traitement");
      onResult(data, file.name, country);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      onLoading(false);
    }
  };

  const dropZoneBorder = dragging ? B : fileName ? `${B}55` : "#D6D9E0";
  const dropZoneBg = dragging
    ? "linear-gradient(180deg, #fdf0f3 0%, #fbe7ec 100%)"
    : fileName
      ? "linear-gradient(180deg, #fdf8f9 0%, #fbf2f4 100%)"
      : "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)";

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Zone drag & drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dropZoneBorder}`,
          borderRadius: 14,
          background: dropZoneBg,
          padding: "34px 24px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.25s var(--ease)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: dragging || fileName
            ? `linear-gradient(140deg, ${B} 0%, ${"#C13049"} 100%)`
            : "linear-gradient(140deg, #f3f4f6 0%, #e8e9ec 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 14px",
          transition: "all 0.25s var(--ease)",
          boxShadow: dragging || fileName
            ? "0 8px 22px -8px rgba(167, 34, 49,0.55), inset 0 1px 0 rgba(255,255,255,0.18)"
            : "0 2px 6px rgba(15,20,33,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
          transform: dragging ? "scale(1.05)" : "scale(1)",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke={dragging || fileName ? "#ffffff" : "#9CA3AF"}
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>

        {fileName ? (
          <>
            <p style={{ fontWeight: 600, fontSize: 14.5, color: "#0F1421", marginBottom: 4 }}>{fileName}</p>
            <p style={{ fontSize: 12.5, color: "#6B7280" }}>Cliquer pour changer · ou glisser un autre fichier</p>
          </>
        ) : (
          <>
            <p style={{ fontWeight: 600, fontSize: 14.5, color: "#1F2937", marginBottom: 4 }}>
              Glisser-déposer un fichier ici
            </p>
            <p style={{ fontSize: 12.5, color: "#9CA3AF" }}>ou cliquer pour parcourir · CSV, XLSX, XLS</p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {/* Pays + bouton */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 7 }}>
            Pays
          </label>
          <div style={{ position: "relative" }}>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              style={{
                width: "100%", padding: "10px 36px 10px 14px",
                border: "1px solid #E2E5EC", borderRadius: 10,
                fontFamily: "inherit",
                fontSize: 13.5, background: "white", outline: "none",
                color: "#0F1421", cursor: "pointer",
                appearance: "none",
                boxShadow: "0 1px 2px rgba(15,20,33,0.04)",
                transition: "border-color 0.15s var(--ease), box-shadow 0.15s var(--ease)",
              }}
              onFocus={(e) => { e.target.style.borderColor = B; e.target.style.boxShadow = `0 0 0 3px ${B}1a`; }}
              onBlur={(e) => { e.target.style.borderColor = "#E2E5EC"; e.target.style.boxShadow = "0 1px 2px rgba(15,20,33,0.04)"; }}
            >
              <option value="France">France · TVA 20%</option>
              <option value="Non-France">Non-France</option>
            </select>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !fileName}
          style={{
            background: loading || !fileName
              ? "linear-gradient(135deg, #d1bdc1 0%, #c2acb1 100%)"
              : `linear-gradient(135deg, ${B} 0%, #C13049 100%)`,
            color: "white", border: "none",
            padding: "11px 22px", borderRadius: 10,
            cursor: loading || !fileName ? "default" : "pointer",
            fontSize: 13.5, fontFamily: "inherit",
            fontWeight: 600, display: "flex", alignItems: "center", gap: 9,
            transition: "transform 0.15s var(--ease), box-shadow 0.2s var(--ease)",
            whiteSpace: "nowrap",
            boxShadow: loading || !fileName
              ? "none"
              : "0 6px 18px -6px rgba(167, 34, 49,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
          onMouseEnter={(e) => { if (!loading && fileName) e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
        >
          {loading ? (
            <>
              <span style={{
                width: 14, height: 14,
                border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white",
                borderRadius: "50%", display: "inline-block",
                animation: "spin 0.7s linear infinite",
              }} />
              Traitement…
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              Traiter le fichier
            </>
          )}
        </button>
      </div>
    </form>
  );
}
