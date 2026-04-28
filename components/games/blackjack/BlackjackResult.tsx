"use client";

// Blackjack Tela 6 — RESULT (5 variantes de resultado)
// Overlay sobre a mesa com titulo + payout + botoes NOVA MAO + VOLTAR
// Variantes:
//   WIN        -> verde, countup animado, glow
//   BUST       -> vermelho, shake horizontal curto
//   BLACKJACK  -> dourado, shimmer sweep, confetti dourado
//   PUSH       -> dourado neutro (empate)
//   SURRENDER  -> dourado sutil opacidade reduzida
//   LOSE       -> vermelho soft, sem shake

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ASSETS, COLORS, TEXTS, t, formatBalance } from "./BlackjackConstants";
import type { HandResult, Lang, ResultType } from "./BlackjackTypes";

// ============================================================================
// PROPS
// ============================================================================

export interface BlackjackResultProps {
  lang: Lang;
  /** Resultados de cada mao (1 ou mais se houve split) */
  results: HandResult[];
  /** Callback do botao NOVA MAO */
  onNewHand: () => void;
  /** Callback do botao VOLTAR */
  onBack: () => void;
}

// ============================================================================
// HELPER: resultado dominante quando ha multiplas maos (split)
// Prioridade: BLACKJACK > WIN > PUSH > SURRENDER > BUST > LOSE
// ============================================================================

function pickDominantResult(results: HandResult[]): ResultType {
  const priority: ResultType[] = [
    "BLACKJACK",
    "WIN",
    "PUSH",
    "SURRENDER",
    "BUST",
    "LOSE",
  ];
  for (const type of priority) {
    if (results.some((r) => r.type === type)) return type;
  }
  return "LOSE";
}

// ============================================================================
// HELPER: estilo visual por tipo de resultado
// ============================================================================

interface ResultStyle {
  titleColor: string;
  titleShadow: string;
  accentShadow: string;
  shake: boolean;
  shimmer: boolean;
  confetti: boolean;
  titleKey: "resultWin" | "resultBust" | "resultBlackjack" | "resultPush" | "resultLose" | "resultSurrender";
  payoutPrefix: string;
  payoutColor: string;
  opacity: number;
}

function getResultStyle(type: ResultType): ResultStyle {
  switch (type) {
    case "BLACKJACK":
      return {
        titleColor: COLORS.goldLight,
        titleShadow:
          "0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(212,168,67,0.5), 0 2px 8px rgba(0,0,0,0.9)",
        accentShadow: "0 0 20px rgba(255,215,0,0.6)",
        shake: false,
        shimmer: true,
        confetti: true,
        titleKey: "resultBlackjack",
        payoutPrefix: "+",
        payoutColor: COLORS.goldLight,
        opacity: 1,
      };
    case "WIN":
      return {
        titleColor: COLORS.greenNeon,
        titleShadow:
          "0 0 30px rgba(0,230,118,0.7), 0 0 60px rgba(0,230,118,0.4), 0 2px 8px rgba(0,0,0,0.9)",
        accentShadow: "0 0 16px rgba(0,230,118,0.6)",
        shake: false,
        shimmer: false,
        confetti: false,
        titleKey: "resultWin",
        payoutPrefix: "+",
        payoutColor: COLORS.greenNeon,
        opacity: 1,
      };
    case "PUSH":
      return {
        titleColor: COLORS.goldPrimary,
        titleShadow:
          "0 0 20px rgba(212,168,67,0.5), 0 2px 4px rgba(0,0,0,0.8)",
        accentShadow: "0 0 12px rgba(212,168,67,0.4)",
        shake: false,
        shimmer: false,
        confetti: false,
        titleKey: "resultPush",
        payoutPrefix: "",
        payoutColor: COLORS.goldPrimary,
        opacity: 1,
      };
    case "SURRENDER":
      return {
        titleColor: "rgba(212,168,67,0.7)",
        titleShadow: "0 1px 2px rgba(0,0,0,0.8)",
        accentShadow: "none",
        shake: false,
        shimmer: false,
        confetti: false,
        titleKey: "resultSurrender",
        payoutPrefix: "",
        payoutColor: "rgba(212,168,67,0.7)",
        opacity: 0.75,
      };
    case "BUST":
      return {
        titleColor: COLORS.redBust,
        titleShadow:
          "0 0 30px rgba(255,23,68,0.8), 0 0 60px rgba(255,23,68,0.4), 0 2px 8px rgba(0,0,0,0.9)",
        accentShadow: "0 0 16px rgba(255,23,68,0.6)",
        shake: true,
        shimmer: false,
        confetti: false,
        titleKey: "resultBust",
        payoutPrefix: "-",
        payoutColor: COLORS.redBust,
        opacity: 1,
      };
    case "LOSE":
    default:
      return {
        titleColor: COLORS.redSoft,
        titleShadow:
          "0 0 20px rgba(255,59,59,0.5), 0 2px 4px rgba(0,0,0,0.8)",
        accentShadow: "0 0 12px rgba(255,59,59,0.4)",
        shake: false,
        shimmer: false,
        confetti: false,
        titleKey: "resultLose",
        payoutPrefix: "-",
        payoutColor: COLORS.redSoft,
        opacity: 1,
      };
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function BlackjackResult({
  lang,
  results,
  onNewHand,
  onBack,
}: BlackjackResultProps) {
  const dominantType = pickDominantResult(results);
  const style = getResultStyle(dominantType);

  // Total de variacao liquida (positivo = ganho, negativo = perda)
  const totalNetChange = results.reduce((sum, r) => sum + r.netChange, 0);

  // Botoes aparecem apos 2.2s
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowButtons(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  // Texto do titulo
  const titleObj = TEXTS[style.titleKey] as { br: string; en: string };
  const title = lang === "br" ? titleObj.br : titleObj.en;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 90,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(16px, 2vw, 32px)",
          pointerEvents: "none",
        }}
      >
        {/* Confetti (apenas BLACKJACK) */}
        {style.confetti && <Confetti />}

        {/* Conteudo central */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={
            style.shake
              ? {
                  scale: 1,
                  opacity: style.opacity,
                  y: 0,
                  x: [0, -8, 8, -6, 6, -3, 3, 0],
                }
              : {
                  scale: 1,
                  opacity: style.opacity,
                  y: 0,
                }
          }
          transition={{
            scale: { type: "spring", stiffness: 300, damping: 20 },
            x: { duration: 0.6, ease: "easeInOut" },
          }}
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "clamp(20px, 2.5vw, 32px)",
            pointerEvents: "auto",
            maxWidth: "clamp(320px, 60vw, 640px)",
          }}
        >
          {/* TITULO com shimmer no Blackjack */}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              padding: "clamp(4px, 0.5vw, 8px) clamp(20px, 2.5vw, 32px)",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontFamily: "'Cinzel', serif",
                fontWeight: 900,
                fontSize: "clamp(36px, 6vw, 84px)",
                color: style.titleColor,
                letterSpacing: "clamp(3px, 0.5vw, 6px)",
                textTransform: "uppercase",
                textShadow: style.titleShadow,
                textAlign: "center",
                lineHeight: 1,
              }}
            >
              {title}
            </h1>

            {/* Shimmer sweep (apenas BLACKJACK) */}
            {style.shimmer && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "-100%",
                  width: "50%",
                  height: "100%",
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                  animation: "bjShimmerSweep 2s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>

          {/* PAYOUT / NET CHANGE */}
          {dominantType !== "PUSH" && (
            <PayoutDisplay
              value={totalNetChange}
              prefix={style.payoutPrefix}
              color={style.payoutColor}
              shadow={style.accentShadow}
              lang={lang}
              type={dominantType}
            />
          )}

          {/* PUSH message (empate, sem valor) */}
          {dominantType === "PUSH" && (
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "clamp(14px, 1.5vw, 18px)",
                color: "rgba(212,168,67,0.7)",
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              {lang === "br"
                ? "Sua aposta foi devolvida"
                : "Your bet was returned"}
            </div>
          )}

          {/* Resumo por mao se for split (mais de 1 resultado) */}
          {results.length > 1 && (
            <HandResultsSummary results={results} lang={lang} />
          )}

          {/* BOTOES (aparecem apos 2.2s) */}
          <AnimatePresence>
            {showButtons && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                  display: "flex",
                  gap: "clamp(12px, 1.5vw, 20px)",
                  marginTop: "clamp(8px, 1vw, 16px)",
                }}
              >
                {/* NOVA MAO (primario verde) */}
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onNewHand}
                  style={{
                    padding:
                      "clamp(14px, 1.6vw, 18px) clamp(28px, 3vw, 44px)",
                    background:
                      "linear-gradient(180deg, #00E676 0%, #00C853 50%, #004D25 100%)",
                    border: "1.5px solid rgba(0,230,118,0.5)",
                    borderRadius: 8,
                    color: "#FFFFFF",
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 700,
                    fontSize: "clamp(13px, 1.4vw, 16px)",
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    minHeight: 52,
                    minWidth: "clamp(140px, 16vw, 180px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "clamp(8px, 1vw, 12px)",
                    boxShadow:
                      "0 4px 20px rgba(0,200,83,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                    textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                  }}
                >
                  <img
                    src={ASSETS.iconNewHand}
                    alt=""
                    style={{
                      width: "clamp(16px, 1.8vw, 22px)",
                      height: "clamp(16px, 1.8vw, 22px)",
                    }}
                    draggable={false}
                  />
                  {t(TEXTS.newHand, lang)}
                </motion.button>

                {/* VOLTAR (ghost dourado) */}
                <motion.button
                  whileHover={{
                    y: -2,
                    borderColor: "rgba(212,168,67,0.7)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onBack}
                  style={{
                    padding:
                      "clamp(14px, 1.6vw, 18px) clamp(28px, 3vw, 44px)",
                    background: "transparent",
                    border: "1.5px solid rgba(212,168,67,0.4)",
                    borderRadius: 8,
                    color: COLORS.goldPrimary,
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 700,
                    fontSize: "clamp(13px, 1.4vw, 16px)",
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    minHeight: 52,
                    minWidth: "clamp(140px, 16vw, 180px)",
                    textShadow: "0 0 8px rgba(212,168,67,0.3)",
                  }}
                >
                  {t(TEXTS.back, lang)}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// SUBCOMPONENTE: PAYOUT DISPLAY (com countup animado)
// ============================================================================

interface PayoutDisplayProps {
  value: number;
  prefix: string;
  color: string;
  shadow: string;
  lang: Lang;
  type: ResultType;
}

function PayoutDisplay({
  value,
  prefix,
  color,
  shadow,
  lang,
  type,
}: PayoutDisplayProps) {
  const [displayValue, setDisplayValue] = useState(0);

  // Countup animado apenas para wins (WIN + BLACKJACK)
  useEffect(() => {
    const shouldCountup = type === "WIN" || type === "BLACKJACK";
    const target = Math.abs(value);

    if (!shouldCountup) {
      setDisplayValue(target);
      return;
    }

    const duration = 1200;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(target * eased));

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplayValue(target);
      }
    };

    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, type]);

  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        delay: 0.3,
        type: "spring",
        stiffness: 400,
        damping: 20,
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "clamp(4px, 0.5vw, 8px)",
      }}
    >
      <span
        style={{
          fontFamily: "'Cinzel', serif",
          fontWeight: 600,
          fontSize: "clamp(10px, 1.1vw, 13px)",
          color: "rgba(255,255,255,0.5)",
          letterSpacing: "3px",
          textTransform: "uppercase",
        }}
      >
        {t(TEXTS.payout, lang)}
      </span>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 800,
          fontSize: "clamp(28px, 4vw, 56px)",
          color,
          textShadow: shadow,
          letterSpacing: "2px",
          lineHeight: 1,
        }}
      >
        <span style={{ fontSize: "0.55em", opacity: 0.85, marginRight: 4 }}>
          {prefix}G$
        </span>
        {formatBalance(displayValue)}
      </span>
    </motion.div>
  );
}

// ============================================================================
// SUBCOMPONENTE: RESUMO POR MAO (somente quando ha split)
// ============================================================================

interface HandResultsSummaryProps {
  results: HandResult[];
  lang: Lang;
}

function HandResultsSummary({ results, lang }: HandResultsSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "clamp(6px, 0.8vw, 10px)",
        padding: "clamp(12px, 1.5vw, 18px)",
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(212,168,67,0.2)",
        borderRadius: 6,
        minWidth: "clamp(240px, 28vw, 360px)",
      }}
    >
      <span
        style={{
          fontFamily: "'Cinzel', serif",
          fontWeight: 700,
          fontSize: "clamp(10px, 1.1vw, 12px)",
          color: "rgba(212,168,67,0.6)",
          letterSpacing: "2px",
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: "clamp(4px, 0.5vw, 6px)",
        }}
      >
        {lang === "br" ? "POR MÃO" : "PER HAND"}
      </span>

      {results.map((r, i) => {
        const isWin =
          r.type === "WIN" || r.type === "BLACKJACK" || r.type === "PUSH";
        const color = isWin
          ? r.type === "PUSH"
            ? COLORS.goldPrimary
            : COLORS.greenNeon
          : COLORS.redSoft;

        return (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "clamp(12px, 1.5vw, 20px)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "clamp(12px, 1.3vw, 15px)",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.6)",
                fontWeight: 500,
              }}
            >
              {lang === "br" ? `Mão ${i + 1}` : `Hand ${i + 1}`} — {r.type}
            </span>
            <span
              style={{
                color,
                fontWeight: 700,
                textShadow: `0 0 6px ${color}44`,
              }}
            >
              {r.netChange >= 0 ? "+" : "-"}G${formatBalance(Math.abs(r.netChange))}
            </span>
          </div>
        );
      })}
    </motion.div>
  );
}

// ============================================================================
// SUBCOMPONENTE: CONFETTI (apenas para BLACKJACK — 30 particulas)
// ============================================================================

function Confetti() {
  // Gera 30 particulas com posicoes e delays deterministicos
  // (sem Math.random pra ficar igual em SSR)
  const particles = Array.from({ length: 30 }, (_, i) => {
    const angle = (i / 30) * 360;
    const xOffset = Math.cos((angle * Math.PI) / 180) * 45;
    const delay = (i * 0.04) % 0.8;
    const size = 6 + (i % 3) * 2;
    const color =
      i % 3 === 0
        ? COLORS.goldLight
        : i % 3 === 1
          ? COLORS.goldPrimary
          : "#FFFFFF";
    return { xOffset, delay, size, color };
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{
            x: 0,
            y: 0,
            opacity: 1,
            rotate: 0,
          }}
          animate={{
            x: `${p.xOffset}vw`,
            y: "100vh",
            opacity: [1, 1, 0],
            rotate: 720,
          }}
          transition={{
            duration: 2.5,
            delay: p.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
            times: [0, 0.7, 1],
          }}
          style={{
            position: "absolute",
            top: "45%",
            left: "50%",
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: i % 2 === 0 ? "50%" : 2,
            boxShadow: `0 0 8px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}
