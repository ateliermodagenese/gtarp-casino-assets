"use client";

// GameModal — wrapper compartilhado premium para todos os 22 jogos
// Borda animada conic-gradient dourada (mesmo efeito da hero/cabine)
// Dark glassmorphism + Framer Motion spring + ESC hierarquico

import { useEffect, useCallback, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Props publicas do componente
export interface GameModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  children: ReactNode;
  footer?: ReactNode;
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  width?: string;
  maxHeight?: string;
  // Se true, mostra borda animada premium (padrao: true)
  animatedBorder?: boolean;
  // ID unico pro ESC stack (cada modal precisa de um)
  escId?: string;
  // Registrar/remover do ESC stack externo (useEscStack)
  escPush?: (id: string, close: () => void) => void;
  escPop?: (id: string) => void;
}

// Paleta dourada — mesma identidade do cassino
const GOLD = {
  primary: "#D4A843",
  light: "#FFD700",
  dark: "#8B6914",
  muted: "rgba(212,168,67,0.2)",
  glow: "rgba(212,168,67,0.35)",
  bg: "rgba(212,168,67,0.06)",
};

export default function GameModal({
  open,
  onClose,
  title,
  icon,
  children,
  footer,
  tabs,
  activeTab,
  onTabChange,
  width = "clamp(360px, 58vw, 700px)",
  maxHeight = "min(72vh, calc(100% - 48px))",
  animatedBorder = true,
  escId = "game-modal",
  escPush,
  escPop,
}: GameModalProps) {
  // Registrar no ESC stack externo quando abre
  useEffect(() => {
    if (open && escPush) {
      escPush(escId, onClose);
    }
    if (!open && escPop) {
      escPop(escId);
    }
    return () => {
      if (escPop) escPop(escId);
    };
  }, [open, escId, escPush, escPop, onClose]);

  // Fallback: ESC local se nao estiver usando stack externo
  useEffect(() => {
    if (!open || escPush) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, onClose, escPush]);

  // Click fora fecha
  const innerRef = useRef<HTMLDivElement>(null);
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (innerRef.current && !innerRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key={`modal-overlay-${escId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleOverlayClick}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 90,
            background: "rgba(0,0,0,0.92)",
            // backdrop-filter REMOVIDO — causa flickering no FiveM CEF (citizenfx/fivem#3843)
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(16px, 3vw, 32px)",
          }}
        >
          {/* Container com borda animada */}
          <motion.div
            ref={innerRef}
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            style={{
              width,
              maxHeight,
              display: "flex",
              flexDirection: "column",
              borderRadius: "16px",
              overflow: "hidden",
              position: "relative",
              // Borda animada conic-gradient (mesmo efeito hero/cabine)
              ...(animatedBorder
                ? {
                    padding: "2px",
                    background: `conic-gradient(from var(--border-angle, 0deg), ${GOLD.dark} 0%, ${GOLD.primary} 25%, ${GOLD.light} 50%, ${GOLD.primary} 75%, ${GOLD.dark} 100%)`,
                    animation: "border-rotate 8s linear infinite",
                    boxShadow: [
                      `0 0 20px ${GOLD.glow}`,
                      `0 0 50px rgba(212,168,67,0.12)`,
                      `0 10px 40px rgba(0,0,0,0.6)`,
                      `0 25px 80px rgba(0,0,0,0.4)`,
                    ].join(", "),
                  }
                : {
                    border: `1px solid ${GOLD.muted}`,
                    boxShadow: `0 10px 40px rgba(0,0,0,0.5)`,
                  }),
            }}
          >
            {/* Inner container — fundo real do modal */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                borderRadius: animatedBorder ? "14px" : "16px",
                background: "linear-gradient(180deg, #181410 0%, #0E0C09 50%, #080706 100%)",
                // Glassmorphism sutil no topo
                backgroundImage: [
                  "linear-gradient(180deg, #181410 0%, #0E0C09 50%, #080706 100%)",
                  `radial-gradient(ellipse 60% 40% at 50% 0%, ${GOLD.bg}, transparent)`,
                ].join(", "),
              }}
            >
              {/* ===== HEADER ===== */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "clamp(10px, 1.3vw, 16px) clamp(14px, 1.8vw, 22px)",
                  borderBottom: `1px solid rgba(212,168,67,0.12)`,
                  background: `linear-gradient(180deg, rgba(212,168,67,0.04) 0%, transparent 100%)`,
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  {icon && (
                    <img
                      src={icon}
                      alt=""
                      style={{
                        width: "clamp(18px, 1.5vw, 24px)",
                        height: "clamp(18px, 1.5vw, 24px)",
                        opacity: 0.85,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <h2
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontWeight: 800,
                      fontSize: "clamp(14px, 1.6vw, 20px)",
                      color: GOLD.primary,
                      letterSpacing: "2px",
                      margin: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      textShadow: `0 0 12px rgba(212,168,67,0.3)`,
                    }}
                  >
                    {title}
                  </h2>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.15, filter: "brightness(1.5)" }}
                  whileTap={{ scale: 0.85 }}
                  title="Fechar / Close"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src="/assets/shared/ui/icon-close.png"
                    alt="Fechar"
                    style={{
                      width: "clamp(20px, 1.8vw, 28px)",
                      height: "clamp(20px, 1.8vw, 28px)",
                      opacity: 0.6,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={e => { (e.target as HTMLImageElement).style.opacity = "1"; }}
                    onMouseLeave={e => { (e.target as HTMLImageElement).style.opacity = "0.6"; }}
                  />
                </motion.button>
              </div>

              {/* ===== TABS (opcional) ===== */}
              {tabs && tabs.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: "2px",
                    padding: "0 clamp(14px, 1.8vw, 22px)",
                    borderBottom: `1px solid rgba(212,168,67,0.08)`,
                    flexShrink: 0,
                    overflowX: "auto",
                    scrollbarWidth: "none",
                  }}
                >
                  {tabs.map((tab) => {
                    const isActive = tab.id === activeTab;
                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => onTabChange?.(tab.id)}
                        whileHover={{ color: GOLD.light }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          background: "transparent",
                          border: "none",
                          borderBottom: isActive ? `2px solid ${GOLD.primary}` : "2px solid transparent",
                          padding: "clamp(8px, 1vw, 12px) clamp(12px, 1.5vw, 18px)",
                          fontFamily: "'Cinzel', serif",
                          fontWeight: isActive ? 700 : 500,
                          fontSize: "clamp(11px, 1.1vw, 13px)",
                          color: isActive ? GOLD.primary : "rgba(255,255,255,0.4)",
                          letterSpacing: "1.5px",
                          cursor: "pointer",
                          transition: "color 0.2s, border-color 0.3s",
                          whiteSpace: "nowrap",
                          textShadow: isActive ? `0 0 8px rgba(212,168,67,0.25)` : "none",
                        }}
                      >
                        {tab.label}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* ===== BODY — conteudo scrollavel com minHeight fixa ===== */}
              <div
                className="game-modal-body"
                style={{
                  flex: 1,
                  // minHeight: garante que o modal nao oscila ao trocar abas
                  // (algumas abas tem pouco conteudo, outras muito - sem isso, o modal encolhe)
                  minHeight: "clamp(280px, 38vh, 460px)",
                  maxHeight: "clamp(360px, 60vh, 620px)",
                  overflowY: "auto",
                  padding: "clamp(12px, 1.5vw, 20px) clamp(14px, 1.8vw, 22px)",
                  // Scrollbar dourada premium (Firefox)
                  scrollbarWidth: "thin",
                  scrollbarColor: `${GOLD.primary} rgba(0,0,0,0.3)`,
                }}
              >
                {children}
              </div>

              {/* Scrollbar custom WebKit (Chrome/Edge/Safari/CEF) — dourado luxuoso */}
              <style>{`
                .game-modal-body::-webkit-scrollbar {
                  width: 8px;
                }
                .game-modal-body::-webkit-scrollbar-track {
                  background: rgba(0,0,0,0.4);
                  border-radius: 4px;
                  margin: 4px 0;
                }
                .game-modal-body::-webkit-scrollbar-thumb {
                  background: linear-gradient(180deg, ${GOLD.light} 0%, ${GOLD.primary} 50%, ${GOLD.dark} 100%);
                  border-radius: 4px;
                  border: 1px solid rgba(0,0,0,0.3);
                  box-shadow: 0 0 6px ${GOLD.glow}, inset 0 1px 1px rgba(255,215,0,0.3);
                }
                .game-modal-body::-webkit-scrollbar-thumb:hover {
                  background: linear-gradient(180deg, #FFEC60 0%, ${GOLD.light} 50%, ${GOLD.primary} 100%);
                  box-shadow: 0 0 12px ${GOLD.glow};
                }
                .game-modal-body::-webkit-scrollbar-thumb:active {
                  background: linear-gradient(180deg, ${GOLD.primary} 0%, ${GOLD.dark} 100%);
                }
              `}</style>

              {/* ===== FOOTER (opcional) ===== */}
              {footer && (
                <div
                  style={{
                    borderTop: `1px solid rgba(212,168,67,0.1)`,
                    padding: "clamp(10px, 1.2vw, 14px) clamp(14px, 1.8vw, 22px)",
                    background: `linear-gradient(0deg, rgba(212,168,67,0.03) 0%, transparent 100%)`,
                    flexShrink: 0,
                  }}
                >
                  {footer}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
