import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useToast } from "../components/Toast";
import { B } from "../theme";
import { authFetch } from "../utils/api";

interface ClientLite {
  Nom: string;
  Email: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MailPage() {
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch("/api/clients");
        if (res.ok) {
          const data = await res.json();
          setClients(Array.isArray(data) ? data : []);
        }
      } catch { /* la composition reste possible sans suggestions */ }
    })();
  }, []);

  const addRecipient = (raw: string): boolean => {
    const email = raw.trim().replace(/[,;]+$/, "");
    if (!email) return false;
    if (!EMAIL_RE.test(email)) {
      showToast(`Adresse invalide : ${email}`, "error");
      return false;
    }
    if (!recipients.includes(email)) setRecipients(r => [...r, email]);
    setInput("");
    return true;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      addRecipient(input);
    } else if (e.key === "Backspace" && !input && recipients.length) {
      setRecipients(r => r.slice(0, -1));
    }
  };

  const removeRecipient = (email: string) =>
    setRecipients(r => r.filter(x => x !== email));

  const suggestions = useMemo(
    () => clients.filter(c => c.Email && !recipients.includes(c.Email)),
    [clients, recipients],
  );

  const send = async () => {
    // Prend en compte une saisie en cours non encore validée.
    let finalRecipients = recipients;
    const pending = input.trim();
    if (pending && EMAIL_RE.test(pending) && !recipients.includes(pending)) {
      finalRecipients = [...recipients, pending];
    }
    if (finalRecipients.length === 0) {
      showToast("Ajoutez au moins un destinataire.", "error");
      return;
    }
    if (!subject.trim() || !message.trim()) {
      showToast("Objet et message sont requis.", "error");
      return;
    }
    setSending(true);
    try {
      const res = await authFetch("/n8n/webhook/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: finalRecipients.join(","), subject, message }),
      });
      if (!res.ok) throw new Error();
      showToast(`Mail envoyé à ${finalRecipients.length} destinataire${finalRecipients.length > 1 ? "s" : ""}`);
      setRecipients([]); setInput(""); setSubject(""); setMessage("");
    } catch {
      showToast("Erreur lors de l'envoi du mail", "error");
    } finally {
      setSending(false);
    }
  };

  const labelStyle: CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "#6B7280",
    textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, display: "block",
  };
  const fieldStyle: CSSProperties = {
    width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 9,
    fontSize: 14, background: "white", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: 760 }}>

      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 4, height: 44, borderRadius: 2,
          background: `linear-gradient(180deg, ${B} 0%, #9d2440 100%)`,
          boxShadow: `0 4px 12px -4px ${B}66`,
        }} />
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase", color: B, marginBottom: 4 }}>
            Communication
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "#0F1421", margin: 0, letterSpacing: "-0.5px" }}>
            Nouveau mail
          </h1>
        </div>
      </div>

      <div style={{
        background: "white", borderRadius: 16, border: "1px solid #ECEEF2",
        padding: 24,
        boxShadow: "0 1px 2px rgba(15,20,33,0.04), 0 8px 24px -8px rgba(15,20,33,0.08)",
        display: "flex", flexDirection: "column", gap: 20,
      }}>

        {/* Destinataires */}
        <div>
          <label style={labelStyle}>Destinataires</label>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
            padding: "7px 8px", border: "1px solid #E5E7EB", borderRadius: 9, background: "white",
          }}>
            {recipients.map(email => (
              <span key={email} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#F5E9EC", color: B, borderRadius: 7,
                padding: "4px 8px", fontSize: 12.5, fontWeight: 500,
              }}>
                {email}
                <button
                  onClick={() => removeRecipient(email)}
                  aria-label={`Retirer ${email}`}
                  style={{ border: "none", background: "transparent", color: B, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}
                >×</button>
              </span>
            ))}
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={() => input.trim() && addRecipient(input)}
              placeholder={recipients.length ? "" : "email@exemple.fr puis Entrée…"}
              style={{ flex: 1, minWidth: 180, border: "none", outline: "none", fontSize: 14, fontFamily: "inherit", padding: "4px 2px" }}
            />
          </div>

          {/* Ajout rapide depuis les clients */}
          {suggestions.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>Ajouter un client :</span>
              <select
                value=""
                onChange={e => { if (e.target.value) addRecipient(e.target.value); }}
                style={{
                  padding: "6px 10px", border: "1px solid #E5E7EB", borderRadius: 8,
                  fontSize: 13, background: "white", cursor: "pointer", fontFamily: "inherit", color: "#374151",
                }}
              >
                <option value="">— Choisir —</option>
                {suggestions.map(c => (
                  <option key={c.Email} value={c.Email}>{c.Nom} — {c.Email}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Objet */}
        <div>
          <label style={labelStyle}>Objet</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Objet du message"
            style={fieldStyle}
          />
        </div>

        {/* Message */}
        <div>
          <label style={labelStyle}>Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Votre message…"
            rows={10}
            style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.55 }}
          />
          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>
            Chaque destinataire reçoit le mail séparément (ils ne se voient pas entre eux).
          </p>
        </div>

        {/* Envoi */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={send}
            disabled={sending}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "11px 22px", borderRadius: 10, border: "none",
              background: sending ? "#C4A0A8" : B, color: "white",
              fontSize: 14, fontWeight: 600, cursor: sending ? "default" : "pointer",
              fontFamily: "inherit", transition: "background 0.15s",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            {sending ? "Envoi en cours…" : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}
