import { useRef, useState } from "react";
import type { ProcessResult } from "../App";

type Props = {
  onResult: (data: ProcessResult) => void;
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
    // Injecter le fichier dans l'input natif
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
      const res = await fetch("/process", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erreur de traitement");
      onResult(data);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      onLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Zone drag & drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#7d1c34" : fileName ? "#7d1c3466" : "#d1d5db"}`,
          borderRadius: 12,
          background: dragging ? "#fdf0f3" : fileName ? "#fdf8f9" : "white",
          padding: "28px 20px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: dragging ? "#7d1c3415" : "#f4f4f6",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 12px",
          transition: "all 0.2s",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke={dragging || fileName ? "#7d1c34" : "#9ca3af"}
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>

        {fileName ? (
          <>
            <p style={{ fontWeight: 600, fontSize: 14, color: "#1a1a2e", marginBottom: 2 }}>{fileName}</p>
            <p style={{ fontSize: 12, color: "#6b7280" }}>Cliquer pour changer de fichier</p>
          </>
        ) : (
          <>
            <p style={{ fontWeight: 500, fontSize: 14, color: "#374151", marginBottom: 4 }}>
              Glisser-déposer un fichier ici
            </p>
            <p style={{ fontSize: 12, color: "#9ca3af" }}>ou cliquer pour parcourir — CSV, XLSX, XLS</p>
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
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>
            Pays
          </label>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            style={{
              width: "100%", padding: "9px 12px",
              border: "1px solid #e8e8ee", borderRadius: 8,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13, background: "white", outline: "none",
              color: "#1a1a2e", cursor: "pointer",
            }}
          >
            <option value="France">France (TVA 20%)</option>
            <option value="Non-France">Non-France</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !fileName}
          style={{
            marginTop: 22,
            background: loading || !fileName ? "#c4a0a8" : "#7d1c34",
            color: "white", border: "none",
            padding: "9px 24px", borderRadius: 8,
            cursor: loading || !fileName ? "default" : "pointer",
            fontSize: 13, fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500, display: "flex", alignItems: "center", gap: 8,
            transition: "background 0.2s",
            whiteSpace: "nowrap",
          }}
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              Traiter le fichier
            </>
          )}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}
