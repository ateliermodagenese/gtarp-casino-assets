"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface DailyFreeMilestoneProps {
  tier: 7 | 14 | 30;
  bonus: number;
  onCollect: () => void;
  lang: "br" | "en";
}

const TIER_CONFIG = {
  7: {
    color: "#4B69FF",
    textBR: "SEQUENCIA DE 7 DIAS!",
    textEN: "7 DAY STREAK!",
    particles: 35,
  },
  14: {
    color: "#8847FF",
    textBR: "SEQUENCIA DE 14 DIAS!",
    textEN: "14 DAY STREAK!",
    particles: 35,
  },
  30: {
    color: "#FFD700",
    textBR: "SEQUENCIA PERFEITA!",
    textEN: "PERFECT STREAK!",
    particles: 60,
  },
};

export default function DailyFreeMilestone({
  tier,
  bonus,
  onCollect,
  lang,
}: DailyFreeMilestoneProps) {
  const isBR = lang === "br";
  const config = TIER_CONFIG[tier];

  // Generate particles with random properties
  const particles = useMemo(() => {
    const colors =
      tier === 30
        ? ["#FFD700", "#D4A843", "#F6E27A", "#FFFACD"]
        : [config.color, config.color + "CC", config.color + "99"];

    return Array.from({ length: config.particles }, (_, i) => ({
      id: i,
      size: 3 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      x: (Math.random() - 0.5) * 240,
      y: (Math.random() - 0.5) * 240,
      duration: 1.5 + Math.random(),
      delay: Math.random() * 0.3,
    }));
  }, [tier, config.particles, config.color]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 80,
        background: "rgba(5,5,5,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(16px, 2.5vw, 32px)",
      }}
    >
      {/* Badge circular central com glow ring */}
      <div
        style={{
          position: "relative",
          width: "clamp(100px, 14vw, 160px)",
          aspectRatio: "1",
        }}
      >
        {/* Particles burst */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{
              x: p.x,
              y: p.y,
              scale: 0,
              opacity: 0,
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: "easeOut",
            }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: p.size,
              height: p.size,
              background: p.color,
              borderRadius: "50%",
              pointerEvents: "none",
              boxShadow: `0 0 6px ${p.color}`,
            }}
          />
        ))}

        {/* Glow ring pulsante */}
        <motion.div
          animate={{
            boxShadow: [
              `0 0 15px ${config.color}66, inset 0 0 10px ${config.color}33`,
              `0 0 35px ${config.color}88, inset 0 0 20px ${config.color}44`,
              `0 0 15px ${config.color}66, inset 0 0 10px ${config.color}33`,
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            inset: "-10px",
            borderRadius: "50%",
            border: `2px solid ${config.color}88`,
            pointerEvents: "none",
          }}
        />

        {/* Badge principal */}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{
            scale: [0, 1.4, 0.9, 1.05, 1],
            rotate: [-30, 10, -5, 0],
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: `3px solid ${config.color}`,
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), rgba(0,0,0,0.6))`,
            boxShadow: `0 0 30px ${config.color}66, inset 0 0 20px rgba(0,0,0,0.5)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Inner glow */}
          <div
            style={{
              position: "absolute",
              inset: "15%",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${config.color}22 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />

          {/* Laurel wreath decoration */}
          <svg
            viewBox="0 0 100 100"
            style={{
              position: "absolute",
              inset: "8%",
              opacity: 0.4,
              pointerEvents: "none",
            }}
          >
            {/* Left branch */}
            <path
              d="M30,80 Q20,60 25,40 Q22,50 18,55 Q15,45 20,35 Q18,42 14,45 Q12,35 18,25 Q17,30 13,32 Q15,20 25,15"
              fill="none"
              stroke={config.color}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Right branch */}
            <path
              d="M70,80 Q80,60 75,40 Q78,50 82,55 Q85,45 80,35 Q82,42 86,45 Q88,35 82,25 Q83,30 87,32 Q85,20 75,15"
              fill="none"
              stroke={config.color}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          {/* Number */}
          <span
            style={{
              fontFamily: "var(--font-cinzel), Cinzel, serif",
              fontWeight: 900,
              fontSize: "clamp(32px, 4.5vw, 56px)",
              color: "#FFFFFF",
              textShadow: `0 0 15px ${config.color}, 0 0 30px ${config.color}66, 0 2px 4px rgba(0,0,0,0.8)`,
              position: "relative",
              zIndex: 2,
            }}
          >
            {tier}
          </span>
        </motion.div>

        {/* Diamond accent below badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            position: "absolute",
            bottom: "-20px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "12px",
            height: "12px",
            background: config.color,
            transform: "translateX(-50%) rotate(45deg)",
            boxShadow: `0 0 10px ${config.color}`,
          }}
        />
      </div>

      {/* Texto milestone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        style={{
          fontFamily: "var(--font-cinzel), Cinzel, serif",
          fontWeight: 800,
          fontSize: "clamp(16px, 2.2vw, 26px)",
          textTransform: "uppercase",
          letterSpacing: "2px",
          color: config.color,
          textShadow: `0 0 12px ${config.color}66, 0 2px 4px rgba(0,0,0,0.8)`,
          textAlign: "center",
        }}
      >
        {isBR ? config.textBR : config.textEN}
      </motion.div>

      {/* Texto bonus */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 0.6,
          type: "spring",
          stiffness: 300,
          damping: 20,
        }}
        style={{
          fontFamily: "var(--font-mono), JetBrains Mono, monospace",
          fontWeight: 700,
          fontSize: "clamp(18px, 2.5vw, 30px)",
          color: "#00E676",
          textShadow:
            "0 0 15px rgba(0,230,118,0.5), 0 0 30px rgba(0,230,118,0.25), 0 2px 4px rgba(0,0,0,0.8)",
          textAlign: "center",
        }}
      >
        +{bonus.toLocaleString()} GCoin BONUS!
      </motion.div>

      {/* Botao coletar bonus */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCollect}
        style={{
          fontFamily: "var(--font-cinzel), Cinzel, serif",
          fontWeight: 700,
          fontSize: "clamp(12px, 1.4vw, 16px)",
          textTransform: "uppercase",
          letterSpacing: "2px",
          color: "#000",
          background: "linear-gradient(180deg, #00E676, #00C853, #00A844)",
          border: "1.5px solid rgba(0,230,118,0.4)",
          borderRadius: "10px",
          padding: "12px 32px",
          minHeight: "44px",
          minWidth: "clamp(160px, 20vw, 220px)",
          cursor: "pointer",
          boxShadow:
            "0 4px 15px rgba(0,230,118,0.3), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 20px rgba(0,230,118,0.2)",
        }}
      >
        {isBR ? "COLETAR BONUS" : "COLLECT BONUS"}
      </motion.button>
    </div>
  );
}
