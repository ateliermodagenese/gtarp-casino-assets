"use client";

// GameHeader — cabecalho padronizado para todos os 22 jogos do Blackout Casino
// Refatorado em 30/04/2026 - F3.B
// Mudancas:
//   - Background usa header-frame-ornamental.png (PNG AAA fotografico)
//   - CSS particles douradas animadas (substitui particles-bg descartado)
//   - Botao VOLTAR e Saldo com molduras ornamentais douradas
//   - Glow interno animado nos elementos interativos
//   - API mantida 100% (nao quebra nenhum jogo existente)
//
// Decisao bilingue: aceita "br" | "in" | "en" mas internamente normaliza
// "en" para "in" (projeto canonico usa "br" | "in")

import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { useCurrencyConfig } from "@/hooks/use-currency-config";
import LuxuryTooltip from "./LuxuryTooltip";

export interface HeaderAction {
  id: string;
  icon: string;
  tooltip: string;
  onClick: () => void;
  badge?: string;
}

export interface GameHeaderProps {
  onBack: () => void;
  title: string;
  logo?: string;
  balance: number;
  lang: "br" | "in" | "en";
  actions?: HeaderAction[];
  rightSlot?: ReactNode;
}

const GOLD = {
  primary: "#D4A843",
  light: "#FFD700",
  dark: "#8B6914",
  glow: "rgba(212,168,67,0.45)",
};

const EMERALD = {
  primary: "#00C853",
  light: "#00E676",
  glow: "rgba(0,230,118,0.35)",
};

// Path do PNG hero (gerado pela BC em 30/04)
const HEADER_FRAME_PNG = "/assets/shared/ui/header-frame-ornamental.png";

function formatBalance(val: number): string {
  return val >= 1000 ? val.toLocaleString("pt-BR") : String(val);
}

// Normaliza idioma (projeto usa "br"|"in", mas aceita "en" legado)
function normalizeLang(lang: "br" | "in" | "en"): "br" | "in" {
  return lang === "en" ? "in" : lang;
}

export default function GameHeader({
  onBack,
  title,
  logo,
  balance,
  lang,
  actions = [],
  rightSlot,
}: GameHeaderProps) {
  const { config: cc } = useCurrencyConfig();
  const langNorm = normalizeLang(lang);
  const backLabel = langNorm === "br" ? "VOLTAR" : "BACK";

  return (
    <header
      style={{
        position: "relative",
        zIndex: 10,
        flexShrink: 0,
        // Espaco interno + altura minima
        minHeight: "clamp(56px, 7vw, 84px)",
        // Padding pra conteudo nao colar nas bordas ornamentais do PNG
        padding: "clamp(10px, 1.4vw, 18px) clamp(20px, 3vw, 48px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        // Background base preto profundo
        background: "linear-gradient(180deg, #050403 0%, #0A0908 50%, #050403 100%)",
        // FIX 30/04/2026: bordas duplas (top + bottom) douradas — reforca
        // moldura luxuosa do header. Padrao "Casino Luxury" do guia visual
        // (DOUBLE OUTLINE pattern).
        borderTop: `1px solid ${GOLD.dark}`,
        borderBottom: `1px solid ${GOLD.glow}`,
        // FIX 30/04/2026: overflow hidden REMOVIDO do outer — estava
        // cortando os ornamentos barrocos dos cantos do PNG. As particulas
        // animadas tem proprio overflow hidden na CAMADA 2 (linha ~120),
        // entao nao vazam pra fora do header.
      }}
    >
      {/* ============== CAMADA 1: glow CSS (sem PNG ornamental) ============== */}

      {/* ============== CAMADA 2: CSS particles douradas animadas ============== */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        {/* Glow ambiental dourado (substitui particles-bg.png descartado) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 60% 100% at 50% 50%, ${GOLD.glow} 0%, transparent 70%)`,
            opacity: 0.5,
            mixBlendMode: "screen",
          }}
        />
        {/* Particles douradas pulsando (CSS keyframes via Framer Motion) */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.7, 0],
              scale: [0, 1, 0],
              x: [0, (i % 2 === 0 ? 1 : -1) * 12, 0],
              y: [0, -8, 0],
            }}
            transition={{
              duration: 3 + i * 0.4,
              repeat: Infinity,
              delay: i * 0.6,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              left: `${10 + i * 11}%`,
              top: `${30 + (i % 3) * 18}%`,
              width: i % 2 === 0 ? "3px" : "2px",
              height: i % 2 === 0 ? "3px" : "2px",
              borderRadius: "50%",
              background: GOLD.light,
              boxShadow: `0 0 6px ${GOLD.glow}, 0 0 12px ${GOLD.glow}`,
            }}
          />
        ))}
      </div>

      {/* ============== ESQUERDA: Botao Voltar (ornamental) ============== */}
      <div style={{ position: "relative", zIndex: 2, flexShrink: 0 }}>
        <LuxuryTooltip
          text={langNorm === "br" ? "Voltar ao lobby do casino" : "Back to casino lobby"}
          position="bottom"
        >
          <motion.button
            onClick={onBack}
            whileHover={{
              scale: 1.04,
              boxShadow: `0 0 16px ${GOLD.glow}, inset 0 0 8px rgba(255,215,0,0.15)`,
            }}
            whileTap={{ scale: 0.96 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(6px, 0.8vw, 10px)",
              padding: "clamp(6px, 0.8vw, 10px) clamp(12px, 1.5vw, 18px)",
              // Fundo escuro com leve transparencia
              background: "linear-gradient(135deg, rgba(15,12,8,0.85) 0%, rgba(8,7,6,0.95) 100%)",
              // Borda dourada com gradiente conico (efeito metal polido)
              border: `1.5px solid ${GOLD.primary}`,
              borderRadius: "8px",
              cursor: "pointer",
              // Texto em Cinzel dourado
              color: GOLD.primary,
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(10px, 1vw, 13px)",
              fontWeight: 700,
              letterSpacing: "1.5px",
              // Sombras pra dar profundidade
              boxShadow: [
                `0 0 0 1px ${GOLD.dark}`,
                "inset 0 1px 1px rgba(255,215,0,0.2)",
                "inset 0 -1px 2px rgba(0,0,0,0.4)",
                `0 2px 8px rgba(0,0,0,0.5)`,
              ].join(", "),
              transition: "all 0.2s",
              minHeight: "36px",
            }}
          >
            <span style={{ fontSize: "clamp(14px, 1.2vw, 18px)", lineHeight: 1 }}>‹</span>
            {backLabel}
          </motion.button>
        </LuxuryTooltip>
      </div>

      {/* ============== CENTRO: Logo + Titulo ornamental ============== */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          gap: "clamp(8px, 1vw, 14px)",
          pointerEvents: "none",
          zIndex: 2,
          // Padding lateral pra texto nao colar em ornamentos do PNG
          padding: "0 clamp(60px, 8vw, 120px)",
          maxWidth: "60vw",
        }}
      >
        {logo && (
          <img
            src={logo}
            alt=""
            style={{
              height: "clamp(28px, 3.4vw, 48px)",
              filter: `drop-shadow(0 0 10px ${GOLD.glow}) drop-shadow(0 2px 4px rgba(0,0,0,0.6))`,
              flexShrink: 0,
            }}
          />
        )}
        <h1
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 800,
            fontSize: "clamp(13px, 1.6vw, 21px)",
            // Cor dourada com gradiente metalico via background-clip
            background: `linear-gradient(180deg, ${GOLD.light} 0%, ${GOLD.primary} 50%, ${GOLD.dark} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: GOLD.primary, // fallback
            letterSpacing: "3px",
            margin: 0,
            // Glow externo via filter (combina bem com background-clip)
            filter: `drop-shadow(0 0 12px ${GOLD.glow}) drop-shadow(0 2px 4px rgba(0,0,0,0.5))`,
            whiteSpace: "nowrap",
            textTransform: "uppercase",
          }}
        >
          {title}
        </h1>
      </div>

      {/* ============== DIREITA: Saldo + Acoes ============== */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(6px, 0.8vw, 10px)",
          flexShrink: 0,
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* SALDO em container ornamental */}
        <LuxuryTooltip
          text={langNorm === "br" ? "Saldo disponivel para apostas" : "Balance available for bets"}
          position="bottom"
        >
          <motion.div
            // Pulso esmeralda sutil (animacao continua leve)
            animate={{
              boxShadow: [
                `0 0 0 1px ${GOLD.dark}, inset 0 0 8px rgba(212,168,67,0.1)`,
                `0 0 12px ${EMERALD.glow}, 0 0 0 1px ${GOLD.primary}, inset 0 0 8px rgba(212,168,67,0.15)`,
                `0 0 0 1px ${GOLD.dark}, inset 0 0 8px rgba(212,168,67,0.1)`,
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "clamp(6px, 0.8vw, 10px) clamp(12px, 1.5vw, 18px)",
              background: "linear-gradient(135deg, rgba(15,12,8,0.9) 0%, rgba(8,7,6,0.95) 100%)",
              border: `1.5px solid ${GOLD.primary}`,
              borderRadius: "8px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "clamp(12px, 1.2vw, 15px)",
              fontWeight: 700,
              color: GOLD.light,
              fontVariantNumeric: "tabular-nums" as const,
              minHeight: "36px",
              cursor: "default",
            }}
          >
            <img
              src={cc.icon}
              alt={cc.name}
              style={{
                width: "clamp(16px, 1.5vw, 20px)",
                height: "clamp(16px, 1.5vw, 20px)",
                flexShrink: 0,
                filter: `drop-shadow(0 0 4px ${GOLD.glow})`,
              }}
            />
            <span style={{ textShadow: `0 0 8px ${GOLD.glow}` }}>
              {formatBalance(balance)}
            </span>
          </motion.div>
        </LuxuryTooltip>

        {/* ICONES DE ACAO */}
        {actions.map((action) => (
          <LuxuryTooltip key={action.id} text={action.tooltip} position="bottom">
            <motion.button
              onClick={action.onClick}
              whileHover={{
                scale: 1.12,
                boxShadow: `0 0 12px ${GOLD.glow}, inset 0 0 6px rgba(255,215,0,0.2)`,
              }}
              whileTap={{ scale: 0.92 }}
              style={{
                position: "relative",
                width: "clamp(34px, 3vw, 42px)",
                height: "clamp(34px, 3vw, 42px)",
                padding: "6px",
                background: "linear-gradient(135deg, rgba(15,12,8,0.85) 0%, rgba(8,7,6,0.95) 100%)",
                border: `1.5px solid ${GOLD.dark}`,
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "border-color 0.2s",
                boxShadow: [
                  "inset 0 1px 1px rgba(255,215,0,0.15)",
                  "inset 0 -1px 2px rgba(0,0,0,0.4)",
                  "0 2px 6px rgba(0,0,0,0.4)",
                ].join(", "),
              }}
            >
              <img
                src={action.icon}
                alt=""
                style={{
                  width: "clamp(18px, 1.6vw, 22px)",
                  height: "clamp(18px, 1.6vw, 22px)",
                  opacity: 0.9,
                  filter: `drop-shadow(0 0 4px ${GOLD.glow})`,
                }}
              />
              {action.badge && (
                <span
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    minWidth: "16px",
                    height: "16px",
                    padding: "0 4px",
                    background: "linear-gradient(135deg, #FF4444, #CC2222)",
                    border: `1px solid ${GOLD.primary}`,
                    borderRadius: "8px",
                    fontSize: "9px",
                    fontWeight: 800,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 6px rgba(255,68,68,0.6)",
                  }}
                >
                  {action.badge}
                </span>
              )}
            </motion.button>
          </LuxuryTooltip>
        ))}

        {/* Slot customizado extra (ex: botao ?) */}
        {rightSlot}
      </div>
    </header>
  );
}
