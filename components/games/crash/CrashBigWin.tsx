"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";

interface CrashBigWinProps {
  show: boolean;
  multiplier: number;
  betAmount: number;
  winAmount: number;
  onPlayAgain: () => void;
  lang: "br" | "en";
}

const LABELS = {
  br: {
    bigWin: "BIG WIN",
    megaWin: "MEGA WIN",
    epicWin: "EPIC WIN",
    legendary: "LEGENDARY",
    newBet: "NOVA APOSTA",
  },
  en: {
    bigWin: "BIG WIN",
    megaWin: "MEGA WIN",
    epicWin: "EPIC WIN",
    legendary: "LEGENDARY",
    newBet: "NEW BET",
  },
};

function getTier(multiplier: number) {
  if (multiplier >= 100) {
    return {
      label: "legendary",
      color: "#AA00FF",
      bgColor: "rgba(170,0,255,0.15)",
      borderColor: "rgba(170,0,255,0.3)",
    };
  }
  if (multiplier >= 10) {
    return {
      label: "epicWin",
      color: "#FF1744",
      bgColor: "rgba(255,23,68,0.15)",
      borderColor: "rgba(255,23,68,0.3)",
    };
  }
  if (multiplier >= 5) {
    return {
      label: "megaWin",
      color: "#FF9800",
      bgColor: "rgba(255,152,0,0.15)",
      borderColor: "rgba(255,152,0,0.3)",
    };
  }
  return {
    label: "bigWin",
    color: "#FFD700",
    bgColor: "rgba(255,215,0,0.15)",
    borderColor: "rgba(255,215,0,0.3)",
  };
}

function ConfettiParticle({ index }: { index: number }) {
  const colors = ["#FFD700", "#D4A843", "#00E676", "#FFFFFF"];
  const color = colors[index % colors.length];
  const size = 4 + Math.random() * 6;
  const isCircle = Math.random() > 0.5;
  const left = Math.random() * 100;
  const delay = Math.random() * 1;
  const duration = 2 + Math.random() * 2;
  const swayAmount = 30 + Math.random() * 40;
  const rotation = Math.random() * 360;

  return (
    <div
      style={{
        position: "absolute",
        top: "-10px",
        left: `${left}%`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        borderRadius: isCircle ? "50%" : "0",
        opacity: 0,
        transform: `rotate(${rotation}deg)`,
        animation: `confettiFall ${duration}s ease-out ${delay}s forwards`,
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}

function CountUpValue({ value, duration = 2 }: { value: number; duration?: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.floor(latest).toLocaleString("pt-BR"));
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    const controls = animate(count, value, {
      duration,
      ease: "easeOut",
    });

    const unsubscribe = rounded.on("change", (v) => setDisplayValue(v));

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, duration, count, rounded]);

  return <span>{displayValue}</span>;
}

export default function CrashBigWin({
  show,
  multiplier = 25.43,
  betAmount = 500,
  winAmount = 12715,
  onPlayAgain,
  lang = "br",
}: CrashBigWinProps) {
  const t = LABELS[lang];
  const tier = getTier(multiplier);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (show) {
      setShowButton(false);
      const timer = setTimeout(() => setShowButton(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const confettiParticles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => <ConfettiParticle key={i} index={i} />);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          {/* Keyframes for confetti */}
          <style>
            {`
              @keyframes confettiFall {
                0% {
                  opacity: 1;
                  transform: translateY(0) translateX(0) rotate(0deg);
                }
                100% {
                  opacity: 0;
                  transform: translateY(400px) translateX(var(--sway, 30px)) rotate(720deg);
                }
              }
            `}
          </style>

          {/* Confetti particles */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            {confettiParticles}
          </div>

          {/* Central card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(8px, 1.5vw, 16px)",
              zIndex: 10,
            }}
          >
            {/* Tier Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{
                padding: "4px 16px",
                borderRadius: "20px",
                backgroundColor: tier.bgColor,
                border: `1.5px solid ${tier.borderColor}`,
              }}
            >
              <span
                style={{
                  fontFamily: "'Cinzel Decorative', serif",
                  fontWeight: 700,
                  fontSize: "clamp(10px, 1.2vw, 14px)",
                  color: tier.color,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                {t[tier.label as keyof typeof t]}
              </span>
            </motion.div>

            {/* Multiplier */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
              style={{
                fontFamily: "'Cinzel Decorative', serif",
                fontWeight: 900,
                fontSize: "clamp(36px, 7vw, 72px)",
                color: tier.color,
                textShadow: `
                  0 0 20px ${tier.color}60,
                  0 0 40px ${tier.color}40,
                  0 0 60px ${tier.color}20
                `,
                lineHeight: 1,
              }}
            >
              {multiplier.toFixed(2)}x
            </motion.div>

            {/* Win Amount with Countup */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(6px, 1vw, 12px)",
                marginTop: "clamp(4px, 1vw, 12px)",
              }}
            >
              <img
                src="/assets/shared/icons/icon-gcoin.png"
                alt="GCoin"
                style={{
                  width: "clamp(20px, 3vw, 28px)",
                  height: "clamp(20px, 3vw, 28px)",
                  objectFit: "contain",
                }}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: "clamp(20px, 3.5vw, 40px)",
                  color: "#00E676",
                  textShadow: "0 0 15px rgba(0,230,118,0.4)",
                }}
              >
                +<CountUpValue value={winAmount} duration={2} /> GC
              </span>
            </motion.div>

            {/* Bet info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 500,
                fontSize: "clamp(10px, 1.2vw, 14px)",
                color: "rgba(255,255,255,0.4)",
                marginTop: "clamp(2px, 0.5vw, 8px)",
              }}
            >
              {lang === "br" ? "Aposta:" : "Bet:"} {betAmount.toLocaleString("pt-BR")} GC
            </motion.div>

            {/* Play Again Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: showButton ? 1 : 0 }}
              transition={{ duration: 0.4 }}
              onClick={onPlayAgain}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                marginTop: "clamp(12px, 2vw, 24px)",
                background: "linear-gradient(180deg, #00E676, #00C853)",
                border: "none",
                borderRadius: "10px",
                padding: "0 clamp(24px, 3vw, 40px)",
                minHeight: "48px",
                cursor: showButton ? "pointer" : "default",
                pointerEvents: showButton ? "auto" : "none",
                boxShadow: "0 4px 15px rgba(0,230,118,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: "clamp(12px, 1.4vw, 16px)",
                  color: "#000",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                {t.newBet}
              </span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
