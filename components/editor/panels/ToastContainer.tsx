"use client";

/**
 * ToastContainer.tsx
 *
 * EM PALAVRAS SIMPLES: caixinhas de aviso que entram suavemente pela
 * direita quando aparecem e somem com fade quando passam o tempo.
 *
 * TECNICAMENTE: escuta eventos custom `editor:toast` e mantem fila
 * com auto-dismiss. Animacao via framer-motion AnimatePresence.
 * 3 tipos: info, success, error.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

interface Toast {
  id: string;
  type: "info" | "success" | "error";
  message: string;
  expiresAt: number;
}

interface ToastEventDetail {
  type: "info" | "success" | "error";
  message: string;
  durationMs?: number;
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastEventDetail>).detail;
      if (!detail) return;
      const duration = detail.durationMs ?? (detail.type === "error" ? 6000 : 3500);
      const toast: Toast = {
        id: crypto.randomUUID(),
        type: detail.type,
        message: detail.message,
        expiresAt: Date.now() + duration,
      };
      setToasts((prev) => [...prev, toast].slice(-5));
    };
    window.addEventListener("editor:toast", onToast);
    return () => window.removeEventListener("editor:toast", onToast);
  }, []);

  // Auto-dismiss tick
  useEffect(() => {
    if (toasts.length === 0) return;
    const interval = window.setInterval(() => {
      const now = Date.now();
      setToasts((prev) => prev.filter((t) => t.expiresAt > now));
    }, 200);
    return () => window.clearInterval(interval);
  }, [toasts.length]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div style={containerStyle}>
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ ...toastBase, ...toastByType[t.type] }}
          >
            <span style={iconStyle}>{iconByType[t.type]}</span>
            <span style={msgStyle}>{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              style={closeStyle}
              title="Fechar"
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

const iconByType: Record<Toast["type"], string> = {
  info: "ℹ",
  success: "✓",
  error: "⚠",
};

const containerStyle: React.CSSProperties = {
  position: "fixed",
  bottom: 24,
  right: 24,
  zIndex: 10000,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  pointerEvents: "none",
};

const toastBase: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  padding: "10px 14px",
  borderRadius: 6,
  fontSize: 13,
  minWidth: 280,
  maxWidth: 420,
  pointerEvents: "auto",
  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
  backdropFilter: "blur(8px)",
};

const toastByType: Record<Toast["type"], React.CSSProperties> = {
  info: {
    background: "rgba(20, 30, 50, 0.92)",
    border: "1px solid rgba(100, 150, 200, 0.4)",
    color: "#a8c5e0",
  },
  success: {
    background: "rgba(20, 35, 22, 0.92)",
    border: "1px solid rgba(100, 200, 100, 0.4)",
    color: "#9ed99e",
  },
  error: {
    background: "rgba(40, 18, 18, 0.92)",
    border: "1px solid rgba(220, 80, 80, 0.5)",
    color: "#f0a8a8",
  },
};

const iconStyle: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1,
  paddingTop: 1,
};

const msgStyle: React.CSSProperties = {
  flex: 1,
  lineHeight: 1.4,
};

const closeStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "currentColor",
  cursor: "pointer",
  fontSize: 18,
  lineHeight: 1,
  opacity: 0.6,
  padding: 0,
  fontFamily: "inherit",
};
