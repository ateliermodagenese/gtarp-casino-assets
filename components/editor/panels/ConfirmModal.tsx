"use client";

/**
 * ConfirmModal.tsx
 *
 * EM PALAVRAS SIMPLES: caixinha que pergunta "tem certeza?" antes
 * de fazer algo que nao da pra desfazer (ex: deletar cena).
 *
 * TECNICAMENTE: modal controlado via prop `open`. Renderiza em
 * portal (no document.body) pra nao ser cortado por overflow:hidden
 * dos paineis. Fecha com Esc.
 */
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div style={overlayStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={titleStyle}>{title}</h3>
        <p style={messageStyle}>{message}</p>
        <div style={btnRowStyle}>
          <button onClick={onCancel} style={btnSecondary}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} style={danger ? btnDanger : btnPrimary}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  backdropFilter: "blur(4px)",
};

const modalStyle: React.CSSProperties = {
  background: "#0a0806",
  border: "1px solid rgba(212,168,67,0.3)",
  borderRadius: 8,
  padding: 24,
  minWidth: 320,
  maxWidth: 480,
  boxShadow: "0 10px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,168,67,0.1)",
};

const titleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: "#D4A843",
  margin: "0 0 8px 0",
};

const messageStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#c5c5c5",
  margin: "0 0 20px 0",
  lineHeight: 1.5,
};

const btnRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
};

const btnBase: React.CSSProperties = {
  padding: "8px 14px",
  fontSize: 12,
  borderRadius: 4,
  cursor: "pointer",
  fontFamily: "inherit",
  border: "1px solid transparent",
  letterSpacing: 0.3,
};

const btnSecondary: React.CSSProperties = {
  ...btnBase,
  background: "transparent",
  color: "#8a8a8a",
  border: "1px solid rgba(138,138,138,0.3)",
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: "rgba(212,168,67,0.15)",
  color: "#D4A843",
  border: "1px solid rgba(212,168,67,0.5)",
};

const btnDanger: React.CSSProperties = {
  ...btnBase,
  background: "rgba(220,80,80,0.15)",
  color: "#dc5050",
  border: "1px solid rgba(220,80,80,0.5)",
};
