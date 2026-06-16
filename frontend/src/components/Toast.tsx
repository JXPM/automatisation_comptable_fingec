import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type ToastType = "success" | "error";

interface ToastCtx {
  showToast: (msg: string, type?: ToastType) => void;
}

const Ctx = createContext<ToastCtx>({ showToast: () => {} });

export function useToast() {
  return useContext(Ctx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; type: ToastType; visible: boolean } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, type: ToastType = "success") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, type, visible: true });
    timerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <Ctx.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28,
          background: toast.type === "error"
            ? "linear-gradient(135deg, #7f1d1d 0%, #7E1626 100%)"
            : "linear-gradient(135deg, #1a1a2e 0%, #0F1421 100%)",
          color: "white",
          padding: "13px 20px",
          borderRadius: 12,
          fontSize: 13, fontWeight: 500,
          fontFamily: "inherit",
          boxShadow: "0 14px 36px -8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
          zIndex: 9999,
          display: "flex", alignItems: "center", gap: 11,
          maxWidth: 380,
          animation: "slideIn 0.25s var(--ease)",
        }}>
          {toast.type === "success"
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          }
          {toast.msg}
        </div>
      )}
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </Ctx.Provider>
  );
}
