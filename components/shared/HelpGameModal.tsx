"use client";

// HelpGameModal — modal de ajuda padronizado para todos os 22 jogos do Blackout Casino
// Layout: sidebar vertical de abas + area de conteudo com cards visuais
// Conteudo bilingue BR/IN (le do contexto, sem toggle interno)
// Mobile responsive: sidebar vira lista horizontal scrollavel
//
// Uso tipico:
//   <HelpGameModal
//     open={showHelp}
//     onClose={() => setShowHelp(false)}
//     lang={lang}
//     gameTitle="Daily-Free"
//     sections={DAILY_FREE_HELP_SECTIONS}
//   />

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Paleta dourada — mesma do GameModal, identidade visual unificada
const GOLD = {
  primary: "#D4A843",
  light: "#FFD700",
  dark: "#8B6914",
  muted: "rgba(212,168,67,0.2)",
  glow: "rgba(212,168,67,0.35)",
  bg: "rgba(212,168,67,0.06)",
  bgActive: "rgba(212,168,67,0.14)",
};

// Tipo de uma aba do modal de ajuda
// Cada jogo passa um array dessas
export interface HelpSection {
  // Identificador unico (ex: "como-jogar", "premios", "streak")
  id: string;
  // Icone da aba (PNG path ou data:url ou emoji)
  icon: string;
  // Titulo da aba em PT-BR
  titleBR: string;
  // Titulo da aba em EN
  titleIN: string;
  // Conteudo da aba — pode ser ReactNode pra customizacao maxima
  // Recebe lang pra renderizar bilingue dentro
  content: (lang: "br" | "in") => ReactNode;
}

export interface HelpGameModalProps {
  open: boolean;
  onClose: () => void;
  lang: "br" | "in";
  // Titulo no header (ex: "Daily-Free" ou "Slot Machine")
  gameTitle: string;
  // Logo opcional do jogo (PNG path)
  gameLogo?: string;
  // Lista de abas — cada jogo configura as suas
  sections: HelpSection[];
  // ID unico pro ESC stack
  escId?: string;
  escPush?: (id: string, close: () => void) => void;
  escPop?: (id: string) => void;
}

export default function HelpGameModal({
  open,
  onClose,
  lang,
  gameTitle,
  gameLogo,
  sections,
  escId = "help-game-modal",
  escPush,
  escPop,
}: HelpGameModalProps) {
  // Aba ativa — primeira por default
  const [activeId, setActiveId] = useState<string>(sections[0]?.id || "");

  // Reset ao abrir (sempre comeca na primeira aba)
  useEffect(() => {
    if (open && sections[0]) {
      setActiveId(sections[0].id);
    }
  }, [open, sections]);

  // ESC stack hierarquico (igual ao GameModal)
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

  // Fallback ESC local se nao usa stack externo
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

  const activeSection = sections.find(s => s.id === activeId) || sections[0];
  const headerTitle = lang === "br" ? "Como Jogar" : "How to Play";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key={`help-modal-${escId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleOverlayClick}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 95,
            background: "rgba(0,0,0,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(16px, 3vw, 32px)",
          }}
        >
          {/* Container com borda animada gold (mesmo padrao GameModal) */}
          <motion.div
            ref={innerRef}
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            style={{
              width: "clamp(360px, 78vw, 920px)",
              maxHeight: "min(80vh, calc(100% - 48px))",
              display: "flex",
              flexDirection: "column",
              borderRadius: "16px",
              overflow: "hidden",
              position: "relative",
              padding: "2px",
              background: `conic-gradient(from var(--border-angle, 0deg), ${GOLD.dark} 0%, ${GOLD.primary} 25%, ${GOLD.light} 50%, ${GOLD.primary} 75%, ${GOLD.dark} 100%)`,
              animation: "border-rotate 8s linear infinite",
              boxShadow: [
                `0 0 20px ${GOLD.glow}`,
                `0 0 50px rgba(212,168,67,0.12)`,
                `0 10px 40px rgba(0,0,0,0.6)`,
                `0 25px 80px rgba(0,0,0,0.4)`,
              ].join(", "),
            }}
          >
            {/* Inner — fundo real */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                borderRadius: "14px",
                background: "linear-gradient(180deg, #181410 0%, #0E0C09 50%, #080706 100%)",
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
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                  {gameLogo && (
                    <img
                      src={gameLogo}
                      alt=""
                      style={{
                        width: "clamp(28px, 2.4vw, 38px)",
                        height: "clamp(28px, 2.4vw, 38px)",
                        flexShrink: 0,
                        filter: "drop-shadow(0 0 8px rgba(212,168,67,0.4))",
                      }}
                    />
                  )}
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
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
                      {headerTitle}
                    </h2>
                    <span
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "clamp(10px, 1vw, 12px)",
                        color: "rgba(212,168,67,0.55)",
                        letterSpacing: "1.5px",
                        marginTop: "1px",
                      }}
                    >
                      {gameTitle.toUpperCase()}
                    </span>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.15, filter: "brightness(1.5)" }}
                  whileTap={{ scale: 0.85 }}
                  title={lang === "br" ? "Fechar" : "Close"}
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
                    alt={lang === "br" ? "Fechar" : "Close"}
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

              {/* ===== BODY: SIDEBAR + CONTENT ===== */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  overflow: "hidden",
                  // Mobile (≤640px): empilha vertical (abas viram barra horizontal)
                  flexDirection: "row",
                }}
                className="help-modal-body"
              >
                {/* SIDEBAR DE ABAS (vertical desktop, horizontal mobile via CSS) */}
                <nav
                  className="help-modal-sidebar"
                  style={{
                    flexShrink: 0,
                    width: "clamp(160px, 22vw, 220px)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    padding: "clamp(10px, 1.4vw, 14px)",
                    borderRight: `1px solid rgba(212,168,67,0.1)`,
                    background: "rgba(0,0,0,0.25)",
                    overflowY: "auto",
                  }}
                >
                  {sections.map(section => {
                    const isActive = section.id === activeId;
                    const tabLabel = lang === "br" ? section.titleBR : section.titleIN;
                    return (
                      <motion.button
                        key={section.id}
                        onClick={() => setActiveId(section.id)}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "clamp(8px, 1vw, 12px) clamp(10px, 1.2vw, 14px)",
                          background: isActive ? GOLD.bgActive : "transparent",
                          border: isActive
                            ? `1px solid ${GOLD.muted}`
                            : "1px solid transparent",
                          borderLeft: isActive
                            ? `3px solid ${GOLD.primary}`
                            : "3px solid transparent",
                          borderRadius: "8px",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background 0.2s, border-color 0.2s",
                          fontFamily: "'Cinzel', serif",
                          fontSize: "clamp(11px, 1.1vw, 13px)",
                          fontWeight: isActive ? 700 : 500,
                          letterSpacing: "1px",
                          color: isActive ? GOLD.light : "rgba(212,168,67,0.7)",
                          textShadow: isActive
                            ? `0 0 8px rgba(255,215,0,0.3)`
                            : "none",
                        }}
                      >
                        {/* Icone da aba — pode ser path PNG ou emoji */}
                        {section.icon.startsWith("/") || section.icon.startsWith("data:") ? (
                          <img
                            src={section.icon}
                            alt=""
                            style={{
                              width: "clamp(18px, 1.5vw, 22px)",
                              height: "clamp(18px, 1.5vw, 22px)",
                              flexShrink: 0,
                              opacity: isActive ? 1 : 0.7,
                              filter: isActive
                                ? `drop-shadow(0 0 6px ${GOLD.glow})`
                                : "none",
                              transition: "opacity 0.2s",
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: "clamp(16px, 1.4vw, 20px)",
                              flexShrink: 0,
                              opacity: isActive ? 1 : 0.7,
                            }}
                          >
                            {section.icon}
                          </span>
                        )}
                        <span
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {tabLabel}
                        </span>
                      </motion.button>
                    );
                  })}
                </nav>

                {/* AREA DE CONTEUDO */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    overflowX: "hidden",
                    padding: "clamp(16px, 2vw, 28px) clamp(18px, 2.4vw, 32px)",
                    position: "relative",
                  }}
                >
                  <AnimatePresence mode="wait">
                    {activeSection && (
                      <motion.div
                        key={activeSection.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Titulo grande dourado da aba ativa */}
                        <h3
                          style={{
                            fontFamily: "'Cinzel', serif",
                            fontWeight: 700,
                            fontSize: "clamp(18px, 2vw, 26px)",
                            color: GOLD.light,
                            letterSpacing: "2px",
                            margin: "0 0 clamp(12px, 1.6vw, 20px) 0",
                            textShadow: `0 0 16px rgba(255,215,0,0.25)`,
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          {activeSection.icon.startsWith("/") || activeSection.icon.startsWith("data:") ? (
                            <img
                              src={activeSection.icon}
                              alt=""
                              style={{
                                width: "clamp(28px, 2.4vw, 36px)",
                                height: "clamp(28px, 2.4vw, 36px)",
                                filter: `drop-shadow(0 0 10px ${GOLD.glow})`,
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: "clamp(24px, 2.2vw, 32px)" }}>
                              {activeSection.icon}
                            </span>
                          )}
                          {lang === "br" ? activeSection.titleBR : activeSection.titleIN}
                        </h3>

                        {/* Conteudo customizado da aba — cada jogo passa o seu */}
                        <div
                          style={{
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontSize: "clamp(13px, 1.2vw, 14px)",
                            color: "rgba(255,255,255,0.85)",
                            lineHeight: 1.65,
                          }}
                        >
                          {activeSection.content(lang)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mobile responsive — converte sidebar em barra horizontal */}
          <style>{`
            @media (max-width: 640px) {
              .help-modal-body {
                flex-direction: column !important;
              }
              .help-modal-sidebar {
                width: 100% !important;
                flex-direction: row !important;
                border-right: none !important;
                border-bottom: 1px solid rgba(212,168,67,0.1) !important;
                overflow-x: auto !important;
                overflow-y: hidden !important;
                padding: 8px !important;
              }
              .help-modal-sidebar button {
                flex-shrink: 0;
                min-width: 110px;
                border-left: none !important;
                border-bottom: 3px solid transparent !important;
              }
              .help-modal-sidebar button[style*="rgba(212,168,67,0.14)"] {
                border-left: none !important;
                border-bottom-color: ${GOLD.primary} !important;
              }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// HELPER: HelpCard — bloco visual reutilizavel pra o conteudo
// Cada jogo pode usar livremente dentro do `content` de cada section
// ============================================================
export function HelpCard({
  icon,
  title,
  children,
  variant = "default",
}: {
  icon?: string;
  title: string;
  children: ReactNode;
  variant?: "default" | "tip" | "warning" | "win";
}) {
  const variantStyles = {
    default: {
      borderColor: GOLD.muted,
      bgColor: "rgba(212,168,67,0.05)",
      iconBg: GOLD.bg,
      titleColor: GOLD.primary,
    },
    tip: {
      borderColor: "rgba(0,230,118,0.3)",
      bgColor: "rgba(0,230,118,0.04)",
      iconBg: "rgba(0,230,118,0.1)",
      titleColor: "#00E676",
    },
    warning: {
      borderColor: "rgba(255,159,28,0.3)",
      bgColor: "rgba(255,159,28,0.04)",
      iconBg: "rgba(255,159,28,0.1)",
      titleColor: "#FF9F1C",
    },
    win: {
      borderColor: "rgba(255,215,0,0.4)",
      bgColor: "rgba(255,215,0,0.06)",
      iconBg: "rgba(255,215,0,0.12)",
      titleColor: GOLD.light,
    },
  };
  const s = variantStyles[variant];

  return (
    <div
      style={{
        display: "flex",
        gap: "14px",
        padding: "clamp(12px, 1.4vw, 16px)",
        marginBottom: "10px",
        background: s.bgColor,
        border: `1px solid ${s.borderColor}`,
        borderRadius: "10px",
        backdropFilter: "blur(2px)",
      }}
    >
      {icon && (
        <div
          style={{
            flexShrink: 0,
            width: "clamp(36px, 3vw, 44px)",
            height: "clamp(36px, 3vw, 44px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: s.iconBg,
            borderRadius: "10px",
            border: `1px solid ${s.borderColor}`,
          }}
        >
          {icon.startsWith("/") || icon.startsWith("data:") ? (
            <img
              src={icon}
              alt=""
              style={{
                width: "clamp(22px, 2vw, 28px)",
                height: "clamp(22px, 2vw, 28px)",
              }}
            />
          ) : (
            <span style={{ fontSize: "clamp(18px, 1.6vw, 22px)" }}>{icon}</span>
          )}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(13px, 1.2vw, 15px)",
            color: s.titleColor,
            letterSpacing: "1px",
            margin: "0 0 6px 0",
          }}
        >
          {title}
        </h4>
        <div
          style={{
            fontSize: "clamp(12px, 1.1vw, 13px)",
            color: "rgba(255,255,255,0.78)",
            lineHeight: 1.6,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
