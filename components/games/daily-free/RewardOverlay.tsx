"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

// ===========================================================================
// MODAL 1: RESULTADO (PARABÉNS) — Daily-Free
// Overlay que aparece após o giro com o prêmio ganho
// CSS inline, zero Tailwind, Framer Motion
// ===========================================================================

type Lang = "br" | "in";

interface WheelSegment {
  value: number;
  tier: "common" | "good" | "big" | "mystery";
  angle: number;
}

interface RewardOverlayProps {
  segment: WheelSegment;
  multiplier: number;
  currencyName: string;
  currentDay: number;
  lang: Lang;
  onCollect: () => void;
}

const ASSETS = {
  brasaoVitoria: "/assets/games/daily-free/brasao-vitoria.png",
  frameLuxo: "/assets/games/daily-free/frame-luxo-ornamental.png",
  coinSmall: "/assets/games/daily-free/prizes/coin-small.png",
  coinMedium: "/assets/games/daily-free/prizes/coin-medium.png",
  coinStack: "/assets/games/daily-free/prizes/coin-stack.png",
  treasure: "/assets/games/daily-free/prizes/treasure.png",
  gemGreen: "/assets/games/daily-free/prizes/gem-green.png",
  dividerOrnamental: "/assets/shared/ui/divider-ornamental-gold.png",
};

const TEXTS = {
  congrats: { br: "PARABÉNS!", in: "CONGRATULATIONS!" },
  youWon: { br: "VOCÊ GANHOU", in: "YOU WON" },
  base: { br: "BASE", in: "BASE" },
  collect: { br: "COLETAR", in: "COLLECT" },
  dayOf28: { br: "DIA", in: "DAY" },
  of28: { br: "DE 28", in: "OF 28" },
};

// Confetti particles
const CONFETTI_COLORS = ["#FFD700", "#00E676", "#D4A843", "#FFFFFF", "#4B69FF"];

function Confetti() {
  const particles = useMemo(() => 
    Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      size: 4 + Math.random() * 8,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
    }))
  , []);

  return (
    <div style={{
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: 0,
    }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ 
            x: `${p.x}vw`, 
            y: "-10%",
            rotate: p.rotation,
            opacity: 1,
          }}
          animate={{ 
            y: "110%",
            rotate: p.rotation + 360,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            boxShadow: `0 0 6px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

export default function RewardOverlay({
  segment,
  multiplier,
  currencyName,
  currentDay,
  lang,
  onCollect,
}: RewardOverlayProps) {
  // Calcular valor final
  const baseValue = segment.tier === "mystery" 
    ? 1000 + Math.floor(Math.random() * 4000) // Mystery: 1000-5000
    : segment.value;
  const finalValue = baseValue * multiplier;

  // Icone baseado no tier
  const prizeIcon = useMemo(() => {
    switch (segment.tier) {
      case "common": return ASSETS.coinSmall;
      case "good": return ASSETS.coinMedium;
      case "big": return ASSETS.coinStack;
      case "mystery": return ASSETS.treasure;
      default: return ASSETS.coinSmall;
    }
  }, [segment.tier]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        background: "radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.92) 100%)",
        backdropFilter: "blur(6px)",
      }}
    >
      {/* Confetti */}
      <Confetti />

      {/* Card principal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -30 }}
        transition={{ 
          duration: 0.5, 
          ease: [0.34, 1.56, 0.64, 1],
        }}
        style={{
          position: "relative",
          width: "clamp(340px, 45vw, 520px)",
          padding: "clamp(30px, 4vw, 50px) clamp(24px, 3vw, 40px)",
          borderRadius: "16px",
          background: "linear-gradient(180deg, rgba(20,18,15,0.98) 0%, rgba(8,6,4,1) 100%)",
          border: "2px solid rgba(212,168,67,0.5)",
          boxShadow: `
            0 0 80px rgba(255,215,0,0.3),
            0 0 120px rgba(0,230,118,0.15),
            inset 0 0 60px rgba(0,0,0,0.7),
            0 30px 80px rgba(0,0,0,0.6)
          `,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(12px, 1.5vw, 20px)",
          zIndex: 1,
        }}
      >
        {/* Frame ornamental por cima */}
        <img
          src={ASSETS.frameLuxo}
          alt=""
          style={{
            position: "absolute",
            inset: "-8%",
            width: "116%",
            height: "116%",
            objectFit: "fill",
            pointerEvents: "none",
            filter: "drop-shadow(0 0 30px rgba(255,215,0,0.3))",
            zIndex: -1,
          }}
        />

        {/* Brasao de vitoria */}
        <motion.img
          src={ASSETS.brasaoVitoria}
          alt=""
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            width: "clamp(80px, 10vw, 120px)",
            height: "clamp(80px, 10vw, 120px)",
            objectFit: "contain",
            filter: "drop-shadow(0 0 30px rgba(255,215,0,0.6))",
            marginTop: "-clamp(50px, 6vw, 70px)",
          }}
        />

        {/* Titulo PARABENS */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 900,
            fontSize: "clamp(28px, 3.5vw, 44px)",
            color: "#FFD700",
            letterSpacing: "4px",
            textTransform: "uppercase",
            textShadow: `
              0 0 30px rgba(255,215,0,0.7),
              0 0 60px rgba(255,215,0,0.4),
              0 4px 8px rgba(0,0,0,0.8)
            `,
            margin: 0,
            textAlign: "center",
          }}
        >
          {TEXTS.congrats[lang]}
        </motion.h1>

        {/* Subtitulo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(8px, 1vw, 14px)",
          }}
        >
          <div style={{
            width: "clamp(30px, 4vw, 50px)",
            height: "2px",
            background: "linear-gradient(90deg, transparent, rgba(212,168,67,0.6))",
          }} />
          <span style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 600,
            fontSize: "clamp(12px, 1.4vw, 18px)",
            color: "rgba(255,255,255,0.6)",
            letterSpacing: "3px",
            textTransform: "uppercase",
          }}>
            {TEXTS.youWon[lang]}
          </span>
          <div style={{
            width: "clamp(30px, 4vw, 50px)",
            height: "2px",
            background: "linear-gradient(90deg, rgba(212,168,67,0.6), transparent)",
          }} />
        </motion.div>

        {/* Valor do premio */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(10px, 1.2vw, 18px)",
          }}
        >
          {/* Icone do premio */}
          <motion.img
            src={prizeIcon}
            alt=""
            animate={{ 
              rotate: [0, -5, 5, -5, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            style={{
              width: "clamp(50px, 6vw, 80px)",
              height: "clamp(50px, 6vw, 80px)",
              objectFit: "contain",
              filter: "drop-shadow(0 0 15px rgba(255,215,0,0.5))",
            }}
          />

          {/* Valor */}
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: "clamp(44px, 5.5vw, 72px)",
            color: "#00E676",
            textShadow: `
              0 0 30px rgba(0,230,118,0.7),
              0 0 60px rgba(0,230,118,0.4),
              0 4px 8px rgba(0,0,0,0.8)
            `,
            lineHeight: 1,
          }}>
            +{finalValue}
          </span>

          {/* Nome da moeda */}
          <span style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(18px, 2.2vw, 28px)",
            color: "#00E676",
            letterSpacing: "2px",
            alignSelf: "flex-end",
            paddingBottom: "clamp(4px, 0.5vw, 8px)",
          }}>
            {currencyName}
          </span>
        </motion.div>

        {/* Calculo base x multiplier */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(11px, 1.2vw, 15px)",
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
          }}
        >
          {baseValue} {TEXTS.base[lang]} × <span style={{ color: "#FFD700" }}>{multiplier}x</span> = {finalValue} {currencyName}
        </motion.div>

        {/* Dia atual */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 600,
            fontSize: "clamp(12px, 1.4vw, 18px)",
            color: "rgba(212,168,67,0.8)",
            letterSpacing: "2px",
          }}
        >
          {TEXTS.dayOf28[lang]} {currentDay} {TEXTS.of28[lang]}
        </motion.div>

        {/* Botao COLETAR */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          onClick={onCollect}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{
            position: "relative",
            marginTop: "clamp(8px, 1vw, 16px)",
            fontFamily: "'Cinzel', serif",
            fontWeight: 900,
            fontSize: "clamp(16px, 1.8vw, 24px)",
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: "#FFFFFF",
            padding: "clamp(14px, 1.8vw, 22px) clamp(50px, 6vw, 90px)",
            borderRadius: "12px",
            border: "2px solid rgba(0,230,118,0.5)",
            background: "linear-gradient(180deg, #00E676 0%, #00C853 50%, #004D25 100%)",
            boxShadow: `
              0 0 30px rgba(0,230,118,0.5),
              0 8px 24px rgba(0,0,0,0.5),
              inset 0 2px 0 rgba(255,255,255,0.25),
              inset 0 -2px 4px rgba(0,0,0,0.3)
            `,
            cursor: "pointer",
            overflow: "hidden",
          }}
        >
          {/* Shine effect */}
          <motion.div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "50%",
              height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              pointerEvents: "none",
            }}
            animate={{ x: ["0%", "300%"] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
          />
          {TEXTS.collect[lang]}
        </motion.button>

        {/* Gemas decorativas */}
        <img
          src={ASSETS.gemGreen}
          alt=""
          style={{
            position: "absolute",
            bottom: "10%",
            left: "-5%",
            width: "clamp(24px, 3vw, 40px)",
            height: "clamp(24px, 3vw, 40px)",
            objectFit: "contain",
            opacity: 0.7,
            filter: "drop-shadow(0 0 10px rgba(0,230,118,0.5))",
          }}
        />
        <img
          src={ASSETS.gemGreen}
          alt=""
          style={{
            position: "absolute",
            top: "15%",
            right: "-4%",
            width: "clamp(20px, 2.5vw, 34px)",
            height: "clamp(20px, 2.5vw, 34px)",
            objectFit: "contain",
            opacity: 0.6,
            filter: "drop-shadow(0 0 10px rgba(0,230,118,0.5))",
            transform: "rotate(25deg)",
          }}
        />
      </motion.div>
    </motion.div>
  );
}
