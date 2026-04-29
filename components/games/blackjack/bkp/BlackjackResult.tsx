"use client";

// Blackjack TELA 4 — BlackjackResult.tsx
// Overlay semi-transparente sobre a mesa com 5 variantes de resultado:
//   WIN, BUST, BLACKJACK, PUSH, SURRENDER
// CSS inline (style={{}}), NUNCA Tailwind

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// TYPES
// ============================================================================

type ResultType = "win" | "bust" | "blackjack" | "push" | "surrender" | "lose";
type Lang = "br" | "in" | "en";

interface HandResultItem {
  handIndex: number;
  type: string;
  payout: number;
  netChange: number;
}

interface BlackjackResultProps {
  result?: ResultType;
  payout?: number;
  multiplier?: string;
  results?: HandResultItem[];
  onNewHand: () => void;
  onBack: () => void;
  lang: Lang;
}

// ============================================================================
// TEXTOS INTERNACIONALIZADOS
// ============================================================================

const TEXTS: Record<string, Record<Lang, string>> = {
  win: { br: "VOCE VENCEU!", in: "YOU WIN!" },
  bust: { br: "ESTOUROU!", in: "BUST!" },
  blackjack: { br: "BLACKJACK!", in: "BLACKJACK!" },
  push: { br: "EMPATE", in: "PUSH" },
  surrender: { br: "DESISTENCIA", in: "SURRENDER" },
  newHand: { br: "NOVA MAO", in: "NEW HAND" },
  back: { br: "VOLTAR", in: "BACK" },
  payment: { br: "Pagamento", in: "Payout" },
};

// ============================================================================
// HELPER: Formatar valor
// ============================================================================

function formatValue(value: number, isLoss: boolean): string {
  const absValue = Math.abs(value);
  const prefix = isLoss ? "-" : "+";
  return `${prefix}${absValue} GC`;
}

// ============================================================================
// SUBCOMPONENTE: Confetti (apenas BLACKJACK)
// ============================================================================

function ConfettiParticles() {
  const particles = useMemo(() => {
    const colors = ["#FFD700", "#D4A843", "#00E676", "#FFFFFF"];
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: 10 + (i * 3.5) % 80,
      size: 4 + (i % 5),
      color: colors[i % colors.length],
      delay: (i * 0.04) % 1,
      duration: 2 + (i % 3) * 0.5,
      xDrift: -30 + (i * 2.5) % 60,
      rotation: (i * 45) % 360,
    }));
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: `${p.x}%`,
            y: -20,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            y: "100vh",
            x: `calc(${p.x}% + ${p.xDrift}px)`,
            rotate: p.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
            times: [0, 0.7, 1],
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size}px ${p.color}66`,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: Countup animado
// ============================================================================

function CountupValue({
  target,
  duration,
  isLoss,
}: {
  target: number;
  duration: number;
  isLoss: boolean;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const absTarget = Math.abs(target);
    if (absTarget === 0) {
      setCurrent(0);
      return;
    }

    const startTime = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(absTarget * eased));

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setCurrent(absTarget);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  const prefix = isLoss ? "-" : "+";
  return (
    <span>
      {prefix}
      {current} GC
    </span>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function BlackjackResult({
  result: resultProp,
  payout: payoutProp,
  multiplier: multiplierProp,
  results,
  onNewHand,
  onBack,
  lang,
}: BlackjackResultProps) {
  const langKey = (lang === "en" ? "in" : lang) as "br" | "in";
  const [showButtons, setShowButtons] = useState(false);

  // Derivar result/payout de HandResult[] se passado pelo Game
  const mainResult = results?.[0];
  const resultTypeMap: Record<string, ResultType> = {
    WIN: "win", BLACKJACK: "blackjack", BUST: "bust", LOSE: "lose",
    PUSH: "push", SURRENDER: "surrender",
  };
  const result: ResultType = resultProp || (mainResult ? (resultTypeMap[mainResult.type] || "lose") : "lose");
  const payout = payoutProp ?? (mainResult?.payout ?? 0);
  const multiplier = multiplierProp ?? (result === "blackjack" ? "3:2" : result === "win" ? "1:1" : "");

  // Botoes aparecem apos 2s
  useEffect(() => {
    const timer = setTimeout(() => setShowButtons(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Estilos por variante
  const variantStyles = useMemo(() => {
    switch (result) {
      case "win":
        return {
          overlayBg: "rgba(0,0,0,0.7)",
          titleColor: "#00E676",
          titleShadow: "0 0 20px rgba(0,230,118,0.5)",
          payoutColor: "#00E676",
          shake: false,
          shimmer: false,
          confetti: false,
          titleSize: "clamp(20px, 4vw, 40px)",
          fontWeight: 900,
        };
      case "bust":
        return {
          overlayBg: "rgba(0,0,0,0.75)",
          titleColor: "#FF1744",
          titleShadow: "0 0 8px rgba(255,23,68,0.5)",
          payoutColor: "#FF1744",
          shake: true,
          shimmer: false,
          confetti: false,
          titleSize: "clamp(20px, 4vw, 40px)",
          fontWeight: 900,
        };
      case "blackjack":
        return {
          overlayBg: "rgba(0,0,0,0.85)",
          titleColor: "#FFD700",
          titleShadow:
            "0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,215,0,0.3), 0 0 60px rgba(255,215,0,0.15)",
          payoutColor: "#FFD700",
          shake: false,
          shimmer: true,
          confetti: true,
          titleSize: "clamp(24px, 5vw, 48px)",
          fontWeight: 900,
        };
      case "push":
        return {
          overlayBg: "rgba(0,0,0,0.6)",
          titleColor: "#FFD700",
          titleShadow: "none",
          payoutColor: "rgba(255,255,255,0.5)",
          shake: false,
          shimmer: false,
          confetti: false,
          titleSize: "clamp(20px, 4vw, 40px)",
          fontWeight: 700,
        };
      case "surrender":
        return {
          overlayBg: "rgba(0,0,0,0.5)",
          titleColor: "rgba(212,168,67,0.6)",
          titleShadow: "none",
          payoutColor: "rgba(255,255,255,0.4)",
          shake: false,
          shimmer: false,
          confetti: false,
          titleSize: "clamp(18px, 3.5vw, 36px)",
          fontWeight: 600,
        };
      default:
        return {
          overlayBg: "rgba(0,0,0,0.7)",
          titleColor: "#FFFFFF",
          titleShadow: "none",
          payoutColor: "#FFFFFF",
          shake: false,
          shimmer: false,
          confetti: false,
          titleSize: "clamp(20px, 4vw, 40px)",
          fontWeight: 700,
        };
    }
  }, [result]);

  const isLoss = result === "bust" || result === "surrender";
  const showCountup = result === "win" || result === "blackjack";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 100,
          background: variantStyles.overlayBg,
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(16px, 2.5vw, 28px)",
        }}
      >
        {/* Confetti (apenas BLACKJACK) */}
        {variantStyles.confetti && <ConfettiParticles />}

        {/* Titulo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={
            variantStyles.shake
              ? {
                  scale: 1,
                  opacity: 1,
                  x: [-4, 4, -3, 3, -1, 1, 0],
                }
              : { scale: 1, opacity: 1 }
          }
          transition={{
            scale: { type: "spring", stiffness: 300, damping: 20 },
            opacity: { duration: 0.3 },
            x: { duration: 0.5, ease: "easeOut" },
          }}
          style={{
            position: "relative",
            overflow: "hidden",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: "'Cinzel', serif",
              fontWeight: variantStyles.fontWeight,
              fontSize: variantStyles.titleSize,
              color: variantStyles.titleColor,
              textShadow: variantStyles.titleShadow,
              textTransform: "uppercase",
              letterSpacing: "clamp(2px, 0.3vw, 4px)",
              textAlign: "center",
            }}
          >
            {TEXTS[result]?.[langKey] || TEXTS[result]?.br || ""}
          </h1>

          {/* Shimmer sweep (apenas BLACKJACK) */}
          {variantStyles.shimmer && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "50%",
                height: "100%",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,215,0,0.2), transparent)",
                pointerEvents: "none",
              }}
            />
          )}
        </motion.div>

        {/* Payout */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "clamp(4px, 0.5vw, 8px)",
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "clamp(18px, 3vw, 32px)",
              color: variantStyles.payoutColor,
            }}
          >
            {showCountup ? (
              <CountupValue target={payout} duration={1.5} isLoss={isLoss} />
            ) : (
              formatValue(payout, isLoss)
            )}
          </span>

          {/* Sub-texto multiplier */}
          {result !== "push" && result !== "surrender" && (
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "clamp(11px, 1.3vw, 14px)",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {TEXTS.payment[langKey]} {multiplier}
            </span>
          )}
        </motion.div>

        {/* Botoes (aparecem com delay 2s) */}
        <AnimatePresence>
          {showButtons && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "clamp(8px, 1.5vw, 16px)",
                marginTop: "clamp(8px, 1vw, 16px)",
              }}
            >
              {/* NOVA MAO */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onNewHand}
                style={{
                  padding: "clamp(12px, 1.5vw, 16px) clamp(24px, 3vw, 40px)",
                  background: "linear-gradient(180deg, #00E676, #00C853)",
                  border: "none",
                  borderRadius: 10,
                  color: "#0A0A0A",
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: "clamp(12px, 1.4vw, 16px)",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  cursor: "pointer",
                  minHeight: 44,
                  boxShadow:
                    "0 4px 16px rgba(0,230,118,0.3), 0 0 20px rgba(0,230,118,0.15)",
                }}
              >
                {TEXTS.newHand[langKey]}
              </motion.button>

              {/* VOLTAR */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onBack}
                style={{
                  padding: "clamp(12px, 1.5vw, 16px) clamp(24px, 3vw, 40px)",
                  background: "transparent",
                  border: "1.5px solid rgba(212,168,67,0.4)",
                  borderRadius: 10,
                  color: "#D4A843",
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: "clamp(12px, 1.4vw, 16px)",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  cursor: "pointer",
                  minHeight: 44,
                }}
              >
                {TEXTS.back[langKey]}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
