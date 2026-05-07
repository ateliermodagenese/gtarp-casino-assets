"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

type Lang = "pt" | "en";

const GOLD = "#D4A843";
const EMERALD = "#00E676";

const ASSETS = {
  gcoin: "/assets/shared/icons/icon-gcoin.png",
};

const CONFETTI_COLORS = ["#FFD700", "#D4A843", "#00E676", "#FFFFFF"];

const TEXT: Record<Lang, Record<string, string>> = {
  pt: {
    win: "VOCÊ VENCEU!",
    lose: "DERROTA",
    rake: "Rake 5%:",
    rematch: "REVANCHE",
    lobby: "LOBBY",
  },
  en: {
    win: "YOU WON!",
    lose: "DEFEAT",
    rake: "Rake 5%:",
    rematch: "REMATCH",
    lobby: "LOBBY",
  },
};

export default function PoolResult({
  result = "win",
  prize = 1800,
  rake = 100,
  onRematch,
  onLobby,
  lang = "pt",
}: {
  result: "win" | "lose";
  prize: number;
  rake: number;
  onRematch: () => void;
  onLobby: () => void;
  lang: Lang;
}) {
  const t = TEXT[lang];
  const isWin = result === "win";

  const confettiPieces = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotate: Math.random() * 360,
      size: 4 + Math.random() * 8,
    }));
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.70)",
        backdropFilter: isWin ? "blur(4px)" : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Confetti - only on win */}
      {isWin &&
        confettiPieces.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{
              y: [0, 400 + Math.random() * 200],
              opacity: [1, 1, 0],
              rotate: piece.rotate + 360,
            }}
            transition={{
              duration: piece.duration,
              delay: piece.delay,
              ease: "easeOut",
              repeat: Infinity,
              repeatDelay: Math.random() * 2,
            }}
            style={{
              position: "absolute",
              left: `${piece.x}%`,
              top: "-20px",
              width: piece.size,
              height: piece.size,
              background: piece.color,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              pointerEvents: "none",
            }}
          />
        ))}

      {/* Card */}
      <motion.div
        initial={isWin ? { scale: 0.85, opacity: 0 } : { x: 0, opacity: 0 }}
        animate={
          isWin
            ? { scale: 1, opacity: 1 }
            : { x: [-3, 3, -2, 2, 0], opacity: 1 }
        }
        transition={
          isWin
            ? { type: "spring", stiffness: 300, damping: 20 }
            : { duration: 0.4 }
        }
        style={{
          background: "rgba(10,8,5,0.95)",
          border: `1.5px solid rgba(212,168,67,${isWin ? 0.4 : 0.2})`,
          borderRadius: "16px",
          padding: "clamp(24px,4vw,40px)",
          width: "clamp(300px,50vw,480px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(12px,2vw,20px)",
          boxShadow: isWin ? "0 0 60px rgba(212,168,67,0.08)" : "none",
          position: "relative",
          zIndex: 101,
        }}
      >
        {/* Ornamental line - only on win */}
        {isWin && (
          <div
            style={{
              width: "60%",
              height: "2px",
              background:
                "linear-gradient(90deg, transparent, #D4A843, #FFD700, #D4A843, transparent)",
            }}
          />
        )}

        {/* Title */}
        <h1
          style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontWeight: isWin ? 900 : 700,
            fontSize: isWin ? "clamp(22px,4vw,42px)" : "clamp(18px,3vw,32px)",
            color: isWin ? "#FFD700" : "rgba(212,168,67,0.5)",
            textShadow: isWin ? "0 0 20px rgba(255,215,0,0.6)" : "none",
            margin: 0,
            textAlign: "center",
          }}
        >
          {isWin ? t.win : t.lose}
        </h1>

        {/* Prize */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {isWin && (
            <img
              src={ASSETS.gcoin}
              alt="GCoin"
              style={{ width: "24px", height: "24px" }}
            />
          )}
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: isWin ? 900 : 700,
              fontSize: isWin ? "clamp(28px,5vw,52px)" : "clamp(22px,4vw,40px)",
              color: isWin ? EMERALD : "#FF4444",
            }}
          >
            {isWin ? `+G$${prize.toLocaleString()}` : `-G$${prize.toLocaleString()}`}
          </span>
        </div>

        {/* Rake info - only on win */}
        {isWin && (
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(9px,1vw,12px)",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            {t.rake} G${rake.toLocaleString()}
          </span>
        )}

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "8px",
          }}
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRematch}
            style={{
              background: "linear-gradient(180deg, #00E676, #00C853)",
              border: "none",
              borderRadius: "8px",
              padding: "12px 28px",
              minHeight: "44px",
              cursor: "pointer",
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: "clamp(11px,1.4vw,15px)",
              color: "#FFFFFF",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            {t.rematch}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onLobby}
            style={{
              background: "transparent",
              border: "1.5px solid rgba(212,168,67,0.3)",
              borderRadius: "8px",
              padding: "12px 28px",
              minHeight: "44px",
              cursor: "pointer",
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: "clamp(11px,1.4vw,15px)",
              color: GOLD,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            {t.lobby}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
