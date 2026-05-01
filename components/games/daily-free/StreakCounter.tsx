"use client";

// StreakCounter — Footer triplo do Daily-Free
// F3.E - 30/04/2026
//
// 3 cards lado a lado (referencia: footer das Imagens 8/9 do BC):
//   1. SEQUENCIA  - flame icon PNG + numero de dias atual
//   2. PROXIMO GIRO - timer countdown 24h-rolling (atualiza a cada segundo)
//   3. COMO FUNCIONA - botao que abre o HelpGameModal
//
// Bilingue BR/IN automatico
// Cards usam moldura dourada com pulso esmeralda sutil (mesmo padrao GameHeader)

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface StreakCounterProps {
  // Streak atual em dias
  currentStreak: number;
  // Timestamp ISO do ultimo claim (para calcular cooldown 24h-rolling)
  // null = pode girar agora (primeiro claim ou cooldown ja expirou)
  lastClaimAt: string | null;
  // Cooldown em horas (default 24, do casino_daily_config)
  cooldownHours?: number;
  // Idioma
  lang: "br" | "in" | "en";
  // Callback quando clica em "Como Funciona" (abre HelpGameModal no DailyFreeGame)
  onHelpClick: () => void;
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

const ICON_FLAME = "/assets/games/daily-free/icons/icon-flame.png";

// Normaliza idioma (canonico "br"|"in")
function normalizeLang(lang: "br" | "in" | "en"): "br" | "in" {
  return lang === "en" ? "in" : lang;
}

// Formata milissegundos restantes em "HH:MM:SS"
function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((n) => n.toString().padStart(2, "0"))
    .join(":");
}

// Calcula ms restantes ate o proximo claim ser permitido
function calculateCooldownMs(lastClaimAt: string | null, cooldownHours: number): number {
  if (!lastClaimAt) return 0;
  const lastMs = new Date(lastClaimAt).getTime();
  const expireMs = lastMs + cooldownHours * 3600000;
  return Math.max(0, expireMs - Date.now());
}

export default function StreakCounter({
  currentStreak,
  lastClaimAt,
  cooldownHours = 24,
  lang,
  onHelpClick,
}: StreakCounterProps) {
  const langNorm = normalizeLang(lang);

  // Estado do countdown (atualiza a cada segundo)
  const [remainingMs, setRemainingMs] = useState(() =>
    calculateCooldownMs(lastClaimAt, cooldownHours)
  );

  useEffect(() => {
    // Setup do timer
    const update = () =>
      setRemainingMs(calculateCooldownMs(lastClaimAt, cooldownHours));
    update(); // primeira atualizacao imediata
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lastClaimAt, cooldownHours]);

  const canClaimNow = remainingMs <= 0;

  // Textos bilingues
  const T = {
    br: {
      sequenciaLabel: "SEQUÊNCIA",
      sequenciaSuffix: currentStreak === 1 ? "DIA" : "DIAS",
      proximoLabel: "PRÓXIMO GIRO",
      proximoAvailable: "Disponível agora!",
      proximoIn: "Disponível em",
      comoLabel: "COMO FUNCIONA",
      comoSubtitle: "Gire 1x por dia e\nganhe GCoins grátis!",
    },
    in: {
      sequenciaLabel: "STREAK",
      sequenciaSuffix: currentStreak === 1 ? "DAY" : "DAYS",
      proximoLabel: "NEXT SPIN",
      proximoAvailable: "Available now!",
      proximoIn: "Available in",
      comoLabel: "HOW IT WORKS",
      comoSubtitle: "Spin 1x per day and\nearn free GCoins!",
    },
  }[langNorm];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "clamp(8px, 1.2vw, 16px)",
        width: "100%",
      }}
    >
      {/* ============== CARD 1: SEQUENCIA ============== */}
      <Card>
        <CardIcon>
          <motion.img
            src={ICON_FLAME}
            alt=""
            aria-hidden
            // Animacao sutil de "respiracao" da chama
            animate={{
              scale: [1, 1.06, 1],
              filter: [
                `drop-shadow(0 0 8px ${GOLD.glow})`,
                `drop-shadow(0 0 14px ${GOLD.light}) drop-shadow(0 0 22px ${EMERALD.glow})`,
                `drop-shadow(0 0 8px ${GOLD.glow})`,
              ],
            }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: "clamp(36px, 3.6vw, 52px)",
              height: "clamp(36px, 3.6vw, 52px)",
              objectFit: "contain",
            }}
          />
        </CardIcon>
        <CardLabel>{T.sequenciaLabel}</CardLabel>
        <CardValue style={{ fontSize: "clamp(20px, 2.4vw, 30px)" }}>
          {currentStreak}{" "}
          <span style={{ fontSize: "0.55em", opacity: 0.85 }}>
            {T.sequenciaSuffix}
          </span>
        </CardValue>
      </Card>

      {/* ============== CARD 2: PROXIMO GIRO ============== */}
      <Card>
        <CardIcon>
          {/* Calendario SVG (nao tem PNG dedicado, fica em SVG estilizado) */}
          <CalendarSVG canClaim={canClaimNow} />
        </CardIcon>
        <CardLabel>{T.proximoLabel}</CardLabel>
        {canClaimNow ? (
          <CardValue
            style={{
              fontSize: "clamp(13px, 1.4vw, 17px)",
              color: EMERALD.light,
              fontFamily: "'Cinzel', serif",
              textShadow: `0 0 12px ${EMERALD.glow}`,
            }}
          >
            {T.proximoAvailable}
          </CardValue>
        ) : (
          <>
            <CardValue
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "clamp(18px, 2.2vw, 26px)",
                color: GOLD.light,
                fontVariantNumeric: "tabular-nums" as const,
                letterSpacing: "1px",
              }}
            >
              {formatCountdown(remainingMs)}
            </CardValue>
            <CardSubtitle>{T.proximoIn}</CardSubtitle>
          </>
        )}
      </Card>

      {/* ============== CARD 3: COMO FUNCIONA (CLICAVEL) ============== */}
      <ClickableCard onClick={onHelpClick}>
        <CardIcon>
          {/* Question mark SVG estilizado dourado */}
          <QuestionMarkSVG />
        </CardIcon>
        <CardLabel>{T.comoLabel}</CardLabel>
        <CardSubtitle
          style={{
            whiteSpace: "pre-line",
            fontSize: "clamp(11px, 1.05vw, 13px)",
            lineHeight: 1.45,
            marginTop: "2px",
          }}
        >
          {T.comoSubtitle}
        </CardSubtitle>
      </ClickableCard>
    </div>
  );
}

// ============================================================
// SUBCOMPONENTES VISUAIS (cards padronizados)
// ============================================================

function Card({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      animate={{
        boxShadow: [
          `0 0 0 1px ${GOLD.dark}, inset 0 0 8px rgba(212,168,67,0.08)`,
          `0 0 14px ${EMERALD.glow}, 0 0 0 1px ${GOLD.primary}, inset 0 0 8px rgba(212,168,67,0.15)`,
          `0 0 0 1px ${GOLD.dark}, inset 0 0 8px rgba(212,168,67,0.08)`,
        ],
      }}
      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(4px, 0.6vw, 8px)",
        padding: "clamp(12px, 1.6vw, 20px)",
        background:
          "linear-gradient(135deg, rgba(15,12,8,0.88) 0%, rgba(8,7,6,0.95) 100%)",
        border: `1.5px solid ${GOLD.dark}`,
        borderRadius: "12px",
        minHeight: "clamp(110px, 13vw, 160px)",
        textAlign: "center",
      }}
    >
      {children}
    </motion.div>
  );
}

function ClickableCard({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{
        scale: 1.02,
        boxShadow: `0 0 22px ${GOLD.glow}, 0 0 0 1.5px ${GOLD.primary}, inset 0 0 12px rgba(255,215,0,0.18)`,
      }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(4px, 0.6vw, 8px)",
        padding: "clamp(12px, 1.6vw, 20px)",
        background:
          "linear-gradient(135deg, rgba(15,12,8,0.88) 0%, rgba(8,7,6,0.95) 100%)",
        border: `1.5px solid ${GOLD.dark}`,
        borderRadius: "12px",
        minHeight: "clamp(110px, 13vw, 160px)",
        textAlign: "center",
        cursor: "pointer",
        transition: "border-color 0.2s",
        boxShadow: `0 0 0 1px ${GOLD.dark}, inset 0 0 8px rgba(212,168,67,0.08)`,
        fontFamily: "inherit",
      }}
    >
      {children}
    </motion.button>
  );
}

function CardIcon({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "clamp(40px, 4vw, 58px)",
      }}
    >
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "'Cinzel', serif",
        fontWeight: 700,
        fontSize: "clamp(10px, 1vw, 13px)",
        color: GOLD.primary,
        letterSpacing: "2px",
        textShadow: `0 0 6px ${GOLD.glow}`,
      }}
    >
      {children}
    </div>
  );
}

function CardValue({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: "'Cinzel', serif",
        fontWeight: 800,
        fontSize: "clamp(20px, 2.4vw, 30px)",
        color: GOLD.light,
        letterSpacing: "1px",
        textShadow: `0 0 10px ${GOLD.glow}, 0 2px 4px rgba(0,0,0,0.6)`,
        lineHeight: 1.1,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardSubtitle({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: "clamp(10px, 1vw, 12px)",
        color: "rgba(212,168,67,0.65)",
        marginTop: "1px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ============================================================
// SVG INLINES (calendar + question mark dourados)
// ============================================================

function CalendarSVG({ canClaim }: { canClaim: boolean }) {
  const fill = canClaim ? EMERALD.light : GOLD.primary;
  const glow = canClaim ? EMERALD.glow : GOLD.glow;
  return (
    <motion.svg
      viewBox="0 0 24 24"
      width="clamp(36px, 3.6vw, 52px)"
      height="clamp(36px, 3.6vw, 52px)"
      animate={
        canClaim
          ? {
              scale: [1, 1.08, 1],
              filter: [
                `drop-shadow(0 0 6px ${glow})`,
                `drop-shadow(0 0 14px ${glow})`,
                `drop-shadow(0 0 6px ${glow})`,
              ],
            }
          : undefined
      }
      transition={
        canClaim ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : undefined
      }
      style={{
        filter: !canClaim ? `drop-shadow(0 0 6px ${glow})` : undefined,
      }}
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        fill="none"
        stroke={fill}
        strokeWidth="1.6"
      />
      <line x1="3" y1="9" x2="21" y2="9" stroke={fill} strokeWidth="1.6" />
      <line x1="8" y1="3" x2="8" y2="7" stroke={fill} strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="3" x2="16" y2="7" stroke={fill} strokeWidth="2" strokeLinecap="round" />
      {/* Pontos representando dias */}
      <circle cx="8" cy="13" r="1" fill={fill} />
      <circle cx="12" cy="13" r="1" fill={fill} />
      <circle cx="16" cy="13" r="1" fill={fill} />
      <circle cx="8" cy="17" r="1" fill={fill} />
      <circle cx="12" cy="17" r="1.4" fill={fill} opacity="0.9" />
    </motion.svg>
  );
}

function QuestionMarkSVG() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="clamp(36px, 3.6vw, 52px)"
      height="clamp(36px, 3.6vw, 52px)"
      style={{
        filter: `drop-shadow(0 0 8px ${GOLD.glow})`,
      }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke={GOLD.primary}
        strokeWidth="1.6"
      />
      <path
        d="M 9 9 Q 9 6 12 6 Q 15 6 15 9 Q 15 11 12 12 L 12 14"
        fill="none"
        stroke={GOLD.light}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="17.5" r="1.2" fill={GOLD.light} />
    </svg>
  );
}
