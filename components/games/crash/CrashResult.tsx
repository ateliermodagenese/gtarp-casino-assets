"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface CrashResultProps {
  result: "win" | "loss";
  crashedAt: number;
  cashedAt?: number;
  betAmount: number;
  payout?: number;
  onPlayAgain: () => void;
  lang: "br" | "en";
}

const LABELS = {
  br: {
    win: "VOCE GANHOU!",
    loss: "CRASHED!",
    playAgain: "APOSTAR NOVAMENTE",
  },
  en: {
    win: "YOU WON!",
    loss: "CRASHED!",
    playAgain: "BET AGAIN",
  },
};

export default function CrashResult({
  result,
  crashedAt,
  cashedAt,
  betAmount,
  payout,
  onPlayAgain,
  lang,
}: CrashResultProps) {
  const [showButton, setShowButton] = useState(false);
  const labels = LABELS[lang];

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const isWin = result === "win";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: isWin ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.85)",
        backdropFilter: isWin ? "blur(4px)" : "blur(2px)",
        borderRadius: "10px",
      }}
    >
      {/* Badge Central */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={
          isWin
            ? { type: "spring", stiffness: 300, damping: 25 }
            : { duration: 0.4 }
        }
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(20px, 3vw, 40px)",
          borderRadius: "16px",
          background: "rgba(0,0,0,0.6)",
          border: isWin
            ? "1.5px solid rgba(0,230,118,0.3)"
            : "1.5px solid rgba(255,68,68,0.25)",
          boxShadow: isWin
            ? "0 0 40px rgba(0,230,118,0.15), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 0 40px rgba(255,68,68,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
          minWidth: "clamp(200px, 40vw, 320px)",
        }}
      >
        {/* Titulo */}
        <motion.span
          animate={!isWin ? { x: [-3, 3, -2, 2, 0] } : {}}
          transition={{ duration: 0.4 }}
          style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontWeight: 700,
            fontSize: isWin ? "clamp(18px, 3vw, 32px)" : "clamp(20px, 3.5vw, 36px)",
            color: isWin ? "#00E676" : "#FF4444",
            textShadow: isWin
              ? "0 0 20px rgba(0,230,118,0.5)"
              : "0 0 20px rgba(255,68,68,0.5)",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          {isWin ? labels.win : labels.loss}
        </motion.span>

        {/* Multiplicador */}
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: "clamp(14px, 2vw, 22px)",
            color: isWin ? "#FFD700" : "rgba(255,255,255,0.5)",
            marginTop: "8px",
          }}
        >
          {isWin ? `${cashedAt?.toFixed(2)}x` : `@ ${crashedAt.toFixed(2)}x`}
        </span>

        {/* Valor */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "12px",
          }}
        >
          {isWin && (
            <img
              src="/assets/shared/icons/icon-gcoin.png"
              alt=""
              style={{
                width: "24px",
                height: "24px",
                objectFit: "contain",
              }}
            />
          )}
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: isWin
                ? "clamp(24px, 4vw, 48px)"
                : "clamp(20px, 3vw, 36px)",
              color: isWin ? "#00E676" : "#FF4444",
              textShadow: isWin
                ? "0 0 15px rgba(0,230,118,0.4)"
                : "0 0 15px rgba(255,68,68,0.4)",
            }}
          >
            {isWin
              ? `+${payout?.toLocaleString("pt-BR")} GC`
              : `-${betAmount.toLocaleString("pt-BR")} GC`}
          </span>
        </div>
      </motion.div>

      {/* Botao Apostar Novamente */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={showButton ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.4 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onPlayAgain}
        style={{
          marginTop: "clamp(20px, 3vw, 32px)",
          background: "linear-gradient(180deg, #00E676, #00C853)",
          color: "#000",
          fontFamily: "'Cinzel Decorative', serif",
          fontWeight: 700,
          fontSize: "clamp(13px, 1.5vw, 18px)",
          letterSpacing: "2px",
          textTransform: "uppercase",
          border: "none",
          borderRadius: "10px",
          padding: "0 clamp(24px, 3vw, 40px)",
          minHeight: "48px",
          minWidth: "clamp(180px, 30vw, 280px)",
          cursor: "pointer",
          boxShadow:
            "0 4px 15px rgba(0,230,118,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
          pointerEvents: showButton ? "auto" : "none",
        }}
      >
        {labels.playAgain}
      </motion.button>
    </motion.div>
  );
}
