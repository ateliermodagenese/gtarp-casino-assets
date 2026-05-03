"use client";

// ============================================================================
// ROULETTE LIGHTNING PHASE — Revelacao dos Lucky Numbers
// ============================================================================
// Animacao sequencial com stagger 800ms
// Flash branco + shake por numero
// Usa imagens de multiplicadores (multi-50x.png, etc)
// ============================================================================

import { motion } from "framer-motion";
import { type LightningNumber } from "./RouletteGame";

// Assets
const MULTIPLIER_IMAGES: Record<number, string> = {
  50: "/assets/games/roulette/multipliers/multi-50x.png",
  100: "/assets/games/roulette/multipliers/multi-100x.png",
  200: "/assets/games/roulette/multipliers/multi-200x.png",
  300: "/assets/games/roulette/multipliers/multi-300x.png",
  400: "/assets/games/roulette/multipliers/multi-400x.png",
  500: "/assets/games/roulette/multipliers/multi-500x.png",
};

const LIGHTNING_BOLT = "/assets/games/roulette/lightning-bolt.png";

const ROULETTE = {
  lightningGold: "#FFD700",
  lightningGlow: "rgba(255,215,0,0.6)",
};

interface RouletteLightningPhaseProps {
  lightningNumbers: LightningNumber[];
  onComplete: () => void;
}

export default function RouletteLightningPhase({
  lightningNumbers,
  onComplete,
}: RouletteLightningPhaseProps) {
  const staggerDelay = 0.8; // 800ms entre cada numero

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(24px, 4vw, 48px)",
        zIndex: 70,
      }}
    >
      {/* Flash de fundo animado */}
      <motion.div
        animate={{
          opacity: [0, 0.15, 0, 0.1, 0],
        }}
        transition={{
          duration: lightningNumbers.length * staggerDelay + 1,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, ${ROULETTE.lightningGlow} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Titulo LUCKY NUMBERS */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "clamp(20px, 3vw, 36px)",
          fontWeight: 800,
          color: ROULETTE.lightningGold,
          letterSpacing: "6px",
          textShadow: `0 0 20px ${ROULETTE.lightningGlow}, 0 0 40px ${ROULETTE.lightningGlow}`,
        }}
      >
        LUCKY NUMBERS
      </motion.div>

      {/* Grid de Lightning Numbers */}
      <div
        style={{
          display: "flex",
          gap: "clamp(16px, 3vw, 32px)",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: "80%",
        }}
      >
        {lightningNumbers.map((ln, idx) => (
          <motion.div
            key={`${ln.number}-${idx}`}
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ 
              scale: [0, 1.3, 1],
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: idx * staggerDelay,
              duration: 0.6,
              type: "spring",
              stiffness: 200,
            }}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(8px, 1vw, 14px)",
            }}
          >
            {/* Lightning bolts ao redor */}
            {[0, 1, 2, 3].map((boltIdx) => (
              <motion.img
                key={boltIdx}
                src={LIGHTNING_BOLT}
                alt=""
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0.7, 1, 0],
                  scale: [0, 1.2, 1, 1.1, 0],
                  rotate: boltIdx * 90,
                }}
                transition={{
                  delay: idx * staggerDelay + 0.2,
                  duration: 0.8,
                }}
                style={{
                  position: "absolute",
                  width: "clamp(30px, 4vw, 50px)",
                  transform: `rotate(${boltIdx * 90}deg) translateY(-120%)`,
                  filter: `drop-shadow(0 0 10px ${ROULETTE.lightningGlow})`,
                  pointerEvents: "none",
                }}
              />
            ))}

            {/* Circulo do numero */}
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 20px ${ROULETTE.lightningGlow}`,
                  `0 0 40px ${ROULETTE.lightningGlow}, 0 0 60px ${ROULETTE.lightningGlow}`,
                  `0 0 20px ${ROULETTE.lightningGlow}`,
                ],
              }}
              transition={{
                delay: idx * staggerDelay + 0.3,
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                width: "clamp(60px, 8vw, 100px)",
                height: "clamp(60px, 8vw, 100px)",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1A1A1A 0%, #000 100%)",
                border: `3px solid ${ROULETTE.lightningGold}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "clamp(24px, 3.5vw, 42px)",
                fontWeight: 800,
                color: ROULETTE.lightningGold,
                textShadow: `0 0 15px ${ROULETTE.lightningGlow}`,
              }}
            >
              {ln.number}
            </motion.div>

            {/* Imagem do multiplicador */}
            <motion.img
              src={MULTIPLIER_IMAGES[ln.multiplier]}
              alt={`${ln.multiplier}x`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: idx * staggerDelay + 0.4,
                type: "spring",
                stiffness: 300,
              }}
              style={{
                width: "clamp(80px, 10vw, 140px)",
                height: "auto",
                filter: `drop-shadow(0 0 15px ${ROULETTE.lightningGlow})`,
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Texto de instrucao */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: lightningNumbers.length * staggerDelay + 0.5 }}
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "clamp(11px, 1.2vw, 15px)",
          color: "rgba(255,255,255,0.6)",
          textAlign: "center",
        }}
      >
        Numeros com multiplicadores especiais nesta rodada!
      </motion.div>

      {/* Keyframes para shake */}
      <style>{`
        @keyframes lightningShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </motion.div>
  );
}
