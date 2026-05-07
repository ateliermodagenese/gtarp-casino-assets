"use client";

/**
 * ModalShell.tsx
 *
 * EM PALAVRAS SIMPLES: caixinha de modal com animacao suave de fade-in
 * (overlay escurece, modal sobe levemente). Reutilizada por todos os
 * modais do editor pra ter visual consistente.
 *
 * TECNICAMENTE: wrapper com framer-motion AnimatePresence + portal.
 * Esc fecha. Click no overlay fecha. Click no modal nao propaga.
 * Children eh o conteudo do modal.
 */
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** zIndex base — diferentes modais usam diferentes camadas */
  zIndex?: number;
  /** Largura max em px ou string CSS */
  maxWidth?: string | number;
}

export default function ModalShell({
  open,
  onClose,
  children,
  zIndex = 9000,
  maxWidth = "min(800px, 92vw)",
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          style={{ ...overlayStyle, zIndex }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            style={{ ...modalStyle, maxWidth }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.75)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backdropFilter: "blur(6px)",
};

const modalStyle: React.CSSProperties = {
  background: "#0a0806",
  border: "1px solid rgba(212,168,67,0.3)",
  borderRadius: 10,
  width: "100%",
  display: "flex",
  flexDirection: "column",
  maxHeight: "92vh",
  boxShadow: "0 10px 60px rgba(0,0,0,0.7)",
};
