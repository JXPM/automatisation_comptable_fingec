import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useToast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../auth/AuthContext";
import { B } from "../theme";
import { authFetch } from "../utils/api";
import { avatarColor, initials } from "../utils/clients";
import { getCabinet, saveCabinet, CABINET_LOGO, type CabinetInfo } from "../utils/cabinet";

interface Contact {
  Nom: string;
  Email: string;
  kind: "Client" | "Collaborateur";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Objets fréquents proposés en un clic (contexte collecte de pièces comptables).
const SUBJECT_SUGGESTIONS = [
  "Demande de documents comptables",
  "Relance des pièces manquantes",
  "Rappel : documents du mois",
  "Confirmation de réception",
  "Point sur votre dossier",
];

const RED = "#A72231";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Signature HTML (table compatible e-mail) avec logo, nom de l'expéditeur et coordonnées du cabinet. */
function signatureHtml(name: string, c: CabinetInfo) {
  const phone = c.telephone ? `<div style="font-size:12px;color:${RED};">${escapeHtml(c.telephone)}</div>` : "";
  return (
    `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:2px solid ${RED};padding-top:12px;font-family:'Segoe UI',Arial,sans-serif;">` +
      `<tr>` +
        `<td style="vertical-align:top;padding:12px 16px 0 0;"><img src="${CABINET_LOGO}" width="88" alt="Fingec" style="display:block;"></td>` +
        `<td style="vertical-align:top;padding-top:12px;line-height:1.5;">` +
          `<div style="font-size:18px;font-weight:700;color:${RED};">${escapeHtml(name || "Cabinet Fingec")}</div>` +
          `<div style="font-size:13px;color:${RED};">Cabinet Fingec</div>` +
          phone +
          `<div style="font-size:12px;color:#555;">${escapeHtml(c.adresse)}</div>` +
          `<div style="font-size:12px;color:#444;">${escapeHtml(c.ordre)}</div>` +
          `<div style="font-size:12px;color:${RED};">${escapeHtml(c.contact)}</div>` +
        `</td>` +
      `</tr>` +
    `</table>`
  );
}

/** Compose l'e-mail HTML complet : corps saisi + « Cordialement, » + signature. */
function buildEmailHtml(body: string, name: string, c: CabinetInfo) {
  const paras = escapeHtml(body.trim())
    .split(/\n{2,}/)
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 14px;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  return (
    `<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#333;line-height:1.6;">` +
    paras +
    `<p style="margin:18px 0 4px;">Cordialement,</p>` +
    signatureHtml(name, c) +
    `</div>`
  );
}

export default function MailPage() {
  const { user } = useAuth();
  const senderName = user?.full_name || "";
  const [clients, setClients] = useState<Contact[]>([]);
  const [users, setUsers] = useState<Contact[]>([]);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [cabinet, setCabinet] = useState<CabinetInfo>(getCabinet);
  const [editingSig, setEditingSig] = useState(false);
  const { showToast } = useToast();

  // Mise à jour live des coordonnées du cabinet (persistées immédiatement).
  const updateCabinet = (patch: Partial<CabinetInfo>) => {
    setCabinet(prev => { const next = { ...prev, ...patch }; saveCabinet(next); return next; });
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch("/api/clients");
        if (res.ok) {
          const data = await res.json();
          setClients(Array.isArray(data)
            ? data.filter((c: { Email?: string }) => c.Email)
                .map((c: { Nom?: string; Email: string }) => ({ Nom: c.Nom || c.Email, Email: c.Email, kind: "Client" as const }))
            : []);
        }
      } catch { /* la composition reste possible sans suggestions */ }
      try {
        // Collaborateurs (réservé admin) — échec silencieux si non autorisé.
        const res = await authFetch("/auth/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(Array.isArray(data)
            ? data.filter((u: { email?: string }) => u.email)
                .map((u: { full_name?: string; email: string }) => ({ Nom: u.full_name || u.email, Email: u.email, kind: "Collaborateur" as const }))
            : []);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  // Annuaire fusionné (collaborateurs prioritaires), dédoublonné par e-mail.
  const contacts = useMemo(() => {
    const map = new Map<string, Contact>();
    for (const u of users) map.set(u.Email.toLowerCase(), u);
    for (const c of clients) if (!map.has(c.Email.toLowerCase())) map.set(c.Email.toLowerCase(), c);
    return [...map.values()];
  }, [clients, users]);

  // Suggestions filtrées par la saisie (nom ou e-mail), hors déjà ajoutés.
  const matches = useMemo(() => {
    const q = input.trim().toLowerCase();
    const pool = contacts.filter(c => !recipients.includes(c.Email));
    if (!q) return pool.slice(0, 6);
    return pool
      .filter(c => c.Nom.toLowerCase().includes(q) || c.Email.toLowerCase().includes(q))
      .slice(0, 6);
  }, [contacts, recipients, input]);

  const addRecipient = (raw: string): boolean => {
    const email = raw.trim().replace(/[,;]+$/, "");
    if (!email) return false;
    if (!EMAIL_RE.test(email)) {
      showToast(`Adresse invalide : ${email}`, "error");
      return false;
    }
    if (!recipients.includes(email)) setRecipients(r => [...r, email]);
    setInput("");
    setActiveIdx(-1);
    return true;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const showing = focused && matches.length > 0;
    if (e.key === "ArrowDown" && showing) {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp" && showing) {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === "," || e.key === ";" || (e.key === "Tab" && activeIdx >= 0)) {
      if (activeIdx >= 0 && matches[activeIdx]) {
        e.preventDefault();
        addRecipient(matches[activeIdx].Email);
      } else if (input.trim()) {
        e.preventDefault();
        addRecipient(input);
      }
    } else if (e.key === "Escape") {
      setFocused(false);
    } else if (e.key === "Backspace" && !input && recipients.length) {
      setRecipients(r => r.slice(0, -1));
    }
  };

  const removeRecipient = (email: string) =>
    setRecipients(r => r.filter(x => x !== email));

  const send = async () => {
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
      // L'e-mail part en HTML : corps saisi + signature du cabinet avec logo.
      const html = buildEmailHtml(message, senderName, cabinet);
      const res = await authFetch("/n8n/webhook/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // `from` : le mail part de l'adresse du collaborateur connecté.
        body: JSON.stringify({ from: user?.email, to: finalRecipients.join(","), subject, message: html }),
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

  const showDropdown = focused && matches.length > 0;

  return (
    <div style={{ padding: "36px 40px", maxWidth: 760, margin: "0 auto" }}>

      {/* Header */}
      <PageHeader eyebrow="Communication" title="Nouveau mail" />

      <div style={{
        background: "white", borderRadius: 16, border: "1px solid #ECEEF2",
        padding: 24,
        boxShadow: "0 1px 2px rgba(15,20,33,0.04), 0 8px 24px -8px rgba(15,20,33,0.08)",
        display: "flex", flexDirection: "column", gap: 20,
      }}>

        {/* Destinataires — autocomplétion */}
        <div>
          <label style={labelStyle}>Destinataires</label>
          <div style={{ position: "relative" }}>
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
              padding: "7px 8px", border: `1px solid ${showDropdown ? B : "#E5E7EB"}`, borderRadius: 9, background: "white",
              transition: "border-color 0.15s",
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
                onChange={e => { setInput(e.target.value); setActiveIdx(-1); }}
                onKeyDown={onKeyDown}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 120)}
                placeholder={recipients.length ? "Ajouter…" : "Nom, e-mail, ou quelques lettres…"}
                style={{ flex: 1, minWidth: 180, border: "none", outline: "none", fontSize: 14, fontFamily: "inherit", padding: "4px 2px" }}
              />
            </div>

            {/* Liste de suggestions */}
            {showDropdown && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20,
                background: "white", border: "1px solid #ECEEF2", borderRadius: 11,
                boxShadow: "0 14px 36px -12px rgba(15,20,33,0.20), 0 2px 6px rgba(15,20,33,0.05)",
                overflow: "hidden", maxHeight: 264, overflowY: "auto",
              }}>
                {input.trim() === "" && (
                  <div style={{ padding: "8px 14px", fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Carnet d'adresses
                  </div>
                )}
                {matches.map((c, i) => (
                  <div
                    key={c.Email}
                    onMouseDown={e => { e.preventDefault(); addRecipient(c.Email); }}
                    onMouseEnter={() => setActiveIdx(i)}
                    style={{
                      display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", cursor: "pointer",
                      background: activeIdx === i ? "#FBE9EC" : "white",
                    }}
                  >
                    <span style={{
                      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                      background: avatarColor(c.Nom), color: "white",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700,
                    }}>{initials(c.Nom)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#141A26", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.Nom}</div>
                      <div style={{ fontSize: 12, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.Email}</div>
                    </div>
                    <span style={{
                      flexShrink: 0, fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                      background: c.kind === "Collaborateur" ? "#EEF2FF" : "#F3F4F7",
                      color: c.kind === "Collaborateur" ? "#4F46E5" : "#6B7280",
                    }}>{c.kind}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 6 }}>
            Tape un nom ou une adresse, ou choisis dans le carnet. Entrée pour ajouter.
          </p>
        </div>

        {/* Objet + objets proposés */}
        <div>
          <label style={labelStyle}>Objet</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Objet du message"
            style={fieldStyle}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 9, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#9CA3AF", marginRight: 2 }}>Suggestions :</span>
            {SUBJECT_SUGGESTIONS.map(s => {
              const active = subject === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s)}
                  style={{
                    padding: "5px 11px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
                    fontSize: 12.5, fontWeight: 500,
                    border: `1px solid ${active ? B : "#E5E7EB"}`,
                    background: active ? "#FBE9EC" : "white",
                    color: active ? B : "#4B5563",
                    transition: "all 0.14s",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = "#CBD2DD"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = "#E5E7EB"; }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Message */}
        <div>
          <label style={labelStyle}>Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={"Bonjour,\n\nVotre message…"}
            rows={9}
            style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.55 }}
          />
          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>
            « Cordialement » et la signature ci-dessous sont ajoutés automatiquement. Chaque destinataire reçoit le mail séparément.
          </p>
        </div>

        {/* Aperçu de la signature + édition des coordonnées du cabinet */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Signature</label>
            <button
              type="button"
              onClick={() => setEditingSig(v => !v)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit",
                fontSize: 12.5, fontWeight: 600, color: B, padding: 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
              </svg>
              {editingSig ? "Fermer" : "Modifier les coordonnées"}
            </button>
          </div>

          {editingSig && (
            <div style={{
              border: "1px solid #ECEEF2", borderRadius: 11, padding: 16, marginBottom: 12,
              background: "#FBFBFC", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
            }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "#6B7280" }}>Adresse</span>
                <input value={cabinet.adresse} onChange={e => updateCabinet({ adresse: e.target.value })} style={{ ...fieldStyle, marginTop: 5 }} />
              </div>
              <div>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "#6B7280" }}>Téléphone (optionnel)</span>
                <input value={cabinet.telephone} onChange={e => updateCabinet({ telephone: e.target.value })} placeholder="03 00 00 00 00" style={{ ...fieldStyle, marginTop: 5 }} />
              </div>
              <div>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "#6B7280" }}>Contact (e-mail | site)</span>
                <input value={cabinet.contact} onChange={e => updateCabinet({ contact: e.target.value })} style={{ ...fieldStyle, marginTop: 5 }} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "#6B7280" }}>Mention légale</span>
                <input value={cabinet.ordre} onChange={e => updateCabinet({ ordre: e.target.value })} style={{ ...fieldStyle, marginTop: 5 }} />
              </div>
              <p style={{ gridColumn: "1 / -1", margin: 0, fontSize: 11.5, color: "#9CA3AF" }}>
                Enregistré automatiquement. Le nom affiché est celui de ton compte ({senderName || "—"}).
              </p>
            </div>
          )}

          <div style={{ border: "1px solid #ECEEF2", borderRadius: 11, padding: "16px 18px", background: "#FBFBFC" }}>
            <div dangerouslySetInnerHTML={{ __html: signatureHtml(senderName, cabinet) }} />
          </div>
          <p style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 6 }}>
            Signature du cabinet (logo + coordonnées), insérée automatiquement à la fin de chaque e-mail.
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
