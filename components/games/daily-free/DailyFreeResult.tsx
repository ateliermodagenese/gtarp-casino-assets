"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface DailyFreeResultProps {
  prize: number;
  streakDay: number;
  onCollect: () => void;
  lang: "br" | "en";
}

const CONFETTI_COLORS = ["#FFD700", "#D4A843", "#F6E27A", "#00E676"];

function generateConfetti(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: 4 + Math.random() * 6,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    isCircle: Math.random() > 0.5,
    duration: 1.8 + Math.random() * 1.2,
    delay: Math.random() * 0.8,
    rotation: 360 + Math.random() * 720,
  }));
}

export default function DailyFreeResult({
  prize,
  streakDay,
  onCollect,
  lang,
}: DailyFreeResultProps) {
  const confetti = useMemo(() => generateConfetti(30), []);

  const getPrizeFontSize = (value: number) => {
    if (value >= 1000) return "clamp(36px, 5.5vw, 60px)";
    if (value >= 200) return "clamp(28px, 4.5vw, 48px)";
    return "clamp(22px, 3.5vw, 36px)";
  };

  const texts = {
    br: {
      congrats: "PARABENS!",
      youWon: "VOCE GANHOU",
      day: "DIA",
      of: "DE",
      collect: "COLETAR",
    },
    en: {
      congrats: "CONGRATULATIONS!",
      youWon: "YOU WON",
      day: "DAY",
      of: "OF",
      collect: "COLLECT",
    },
  };

  const t = texts[lang];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 70,
        background: "rgba(8,6,4,0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Confetti */}
      {confetti.map((c) => (
        <motion.div
          key={c.id}
          initial={{ y: -30, x: `${c.x}vw`, opacity: 1, rotate: 0 }}
          animate={{
            y: "110vh",
            rotate: c.rotation,
            opacity: [1, 1, 0.8, 0],
          }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            ease: "easeIn",
          }}
          style={{
            position: "absolute",
            top: 0,
            width: c.size,
            height: c.size,
            background: c.color,
            borderRadius: c.isCircle ? "50%" : "2px",
            boxShadow: `0 0 6px ${c.color}`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Card Central */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          position: "relative",
          background:
            "linear-gradient(180deg, rgba(30,28,24,0.95) 0%, rgba(18,16,12,0.98) 100%)",
          border: "1.5px solid rgba(212,168,67,0.4)",
          borderRadius: "18px",
          padding: "clamp(28px, 4vw, 48px) clamp(36px, 5vw, 72px)",
          maxWidth: "clamp(300px, 42vw, 460px)",
          boxShadow: `
            0 0 40px rgba(0,0,0,0.6),
            0 0 80px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,215,0,0.12),
            inset 0 -1px 0 rgba(0,0,0,0.3),
            0 0 60px rgba(212,168,67,0.08)
          `,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(10px, 1.5vw, 18px)",
        }}
      >
        {/* Emblema Dourado Topo */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
          style={{
            position: "relative",
            width: "clamp(56px, 8vw, 80px)",
            height: "clamp(56px, 8vw, 80px)",
            marginTop: "-clamp(14px, 2vw, 24px)",
          }}
        >
          {/* Outer ring */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background:
                "conic-gradient(from 0deg, #8B6914, #D4A843, #F6E27A, #D4A843, #8B6914, #D4A843, #F6E27A, #D4A843, #8B6914)",
              padding: "3px",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 30% 30%, #2A2520 0%, #1A1815 50%, #0F0E0C 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Inner emblem */}
              <div
                style={{
                  width: "70%",
                  height: "70%",
                  borderRadius: "50%",
                  border: "2px solid #D4A843",
                  background:
                    "radial-gradient(circle at 30% 30%, #252320 0%, #151412 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                {/* Star icon */}
                <svg
                  width="clamp(16px, 2.5vw, 24px)"
                  height="clamp(16px, 2.5vw, 24px)"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2Z"
                    fill="#D4A843"
                    stroke="#F6E27A"
                    strokeWidth="0.5"
                  />
                </svg>
              </div>
            </div>
          </div>
          {/* Decorative laurel hints */}
          <div
            style={{
              position: "absolute",
              bottom: "-4px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "80%",
              height: "8px",
              background:
                "radial-gradient(ellipse at center, rgba(212,168,67,0.3) 0%, transparent 70%)",
            }}
          />
        </motion.div>

        {/* PARABENS! */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={{
            fontFamily: "Cinzel, serif",
            fontWeight: 700,
            fontSize: "clamp(18px, 2.8vw, 32px)",
            color: "#D4A843",
            letterSpacing: "3px",
            textShadow: "0 0 20px rgba(212,168,67,0.5), 0 2px 4px rgba(0,0,0,0.8)",
          }}
        >
          {t.congrats}
        </motion.div>

        {/* VOCE GANHOU */}
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            fontSize: "clamp(10px, 1.3vw, 14px)",
            color: "rgba(212,168,67,0.7)",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginTop: "-clamp(4px, 0.5vw, 8px)",
          }}
        >
          {t.youWon}
        </div>

        {/* PREMIO */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{
            scale: [0, 1.25, 0.95, 1.08, 1],
            rotate: [-10, 4, -2, 0],
          }}
          transition={{ duration: 0.7, delay: 0.4 }}
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontWeight: 700,
            fontSize: getPrizeFontSize(prize),
            color: "#00E676",
            textShadow: `
              0 0 30px rgba(0,230,118,0.6),
              0 0 60px rgba(0,230,118,0.3),
              0 4px 8px rgba(0,0,0,0.8)
            `,
            letterSpacing: "2px",
          }}
        >
          +{prize} GCoin
        </motion.div>

        {/* Divisor decorativo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(8px, 1.2vw, 16px)",
            width: "100%",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              flex: 1,
              maxWidth: "60px",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(212,168,67,0.4) 100%)",
            }}
          />
          <div
            style={{
              width: "6px",
              height: "6px",
              background: "#D4A843",
              transform: "rotate(45deg)",
              boxShadow: "0 0 8px rgba(212,168,67,0.5)",
            }}
          />
          <div
            style={{
              flex: 1,
              maxWidth: "60px",
              height: "1px",
              background:
                "linear-gradient(90deg, rgba(212,168,67,0.4) 0%, transparent 100%)",
            }}
          />
        </div>

        {/* DIA X DE 30 */}
        <div
          style={{
            fontFamily: "Cinzel, serif",
            fontWeight: 600,
            fontSize: "clamp(11px, 1.4vw, 16px)",
            color: "rgba(212,168,67,0.65)",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          {t.day} {streakDay} {t.of} 30
        </div>

        {/* BOTAO COLETAR */}
        <motion.button
          onClick={onCollect}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            marginTop: "clamp(6px, 1vw, 12px)",
            fontFamily: "Cinzel, serif",
            fontWeight: 700,
            fontSize: "clamp(13px, 1.6vw, 18px)",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#0A0A0A",
            background: "linear-gradient(180deg, #00E676 0%, #00C853 50%, #00A844 100%)",
            border: "1.5px solid rgba(0,230,118,0.5)",
            borderRadius: "10px",
            padding: "clamp(10px, 1.4vw, 16px) clamp(28px, 4vw, 48px)",
            minHeight: "48px",
            minWidth: "clamp(160px, 20vw, 220px)",
            cursor: "pointer",
            boxShadow: `
              0 4px 20px rgba(0,230,118,0.35),
              0 8px 40px rgba(0,230,118,0.15),
              inset 0 1px 0 rgba(255,255,255,0.25),
              inset 0 -2px 4px rgba(0,0,0,0.15)
            `,
            textShadow: "0 1px 1px rgba(255,255,255,0.2)",
          }}
        >
          {t.collect}
        </motion.button>
      </motion.div>
    </div>
  );
}
