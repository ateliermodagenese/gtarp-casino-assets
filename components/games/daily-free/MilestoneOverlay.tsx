"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

// ===========================================================================
// MODAL 2: MILESTONE (SEQUÊNCIA DE X DIAS!) — Daily-Free
// Overlay especial quando o jogador atinge um milestone (D7, D14, D21, D28)
// CSS inline, zero Tailwind, Framer Motion
// ===========================================================================

type Lang = "br" | "in";

interface MilestoneOverlayProps {
  day: 7 | 14 | 21 | 28;
  baseBonus?: number;
  multiplier: number;
  currencyName: string;
  lang: Lang;
  onCollect: () => void;
}

const ASSETS = {
  getBadge: (day: number, lang: Lang) => 
    `/assets/games/daily-free/badges/badge-streak-${day}-${lang.toUpperCase()}.png`,
  coinStack: "/assets/games/daily-free/prizes/coin-stack.png",
  gemGreen: "/assets/games/daily-free/prizes/gem-green.png",
  iconTrophy: "/assets/games/daily-free/icons/icon-trophy.png",
  dividerOrnamental: "/assets/shared/ui/divider-ornamental-gold.png",
};

const MILESTONE_BONUSES: Record<number, number> = {
  7: 500,
  14: 1000,
  21: 1500,
  28: 2500,
};

const MILESTONE_COLORS: Record<number, { color: string; glow: string; gradient: string }> = {
  7: { 
    color: "#4B69FF", 
    glow: "rgba(75,105,255,0.45)",
    gradient: "linear-gradient(180deg, #4B69FF 0%, #2D4CBF 50%, #1A2D7A 100%)",
  },
  14: { 
    color: "#8847FF", 
    glow: "rgba(136,71,255,0.45)",
    gradient: "linear-gradient(180deg, #8847FF 0%, #6930CC 50%, #3D1A7A 100%)",
  },
  21: { 
    color: "#C0C0FF", 
    glow: "rgba(192,192,255,0.45)",
    gradient: "linear-gradient(180deg, #C0C0FF 0%, #9090CC 50%, #5050A0 100%)",
  },
  28: { 
    color: "#FFD700", 
    glow: "rgba(255,215,0,0.55)",
    gradient: "linear-gradient(180deg, #FFD700 0%, #CC9900 50%, #7A5500 100%)",
  },
};

const TEXTS = {
  streakOf: { br: "SEQUÊNCIA DE", in: "" },
  days: { br: "DIAS!", in: "-DAY STREAK!" },
  bonus: { br: "BÔNUS", in: "BONUS" },
  base: { br: "base", in: "base" },
  collectBonus: { br: "COLETAR BÔNUS", in: "COLLECT BONUS" },
  dayOf28: { br: "DIA", in: "DAY" },
  of28: { br: "DE 28", in: "OF 28" },
};

// Raios de luz radiais
function LightRays({ color, glow }: { color: string; glow: string }) {
  const rays = useMemo(() => 
    Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      rotation: i * 15,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 0.8,
    }))
  , []);

  return (
    <div style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      width: 0,
      height: 0,
      pointerEvents: "none",
      zIndex: 0,
    }}>
      {rays.map(ray => (
        <motion.div
          key={ray.id}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{
            opacity: [0, 0.7, 0],
            scaleY: [0, 1, 1.3],
          }}
          transition={{
            duration: ray.duration,
            delay: ray.delay,
            repeat: Infinity,
            repeatDelay: 0.8 + Math.random() * 0.5,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            width: "4px",
            height: "clamp(80px, 12vw, 140px)",
            background: `linear-gradient(180deg, ${color}, transparent)`,
            transformOrigin: "center bottom",
            transform: `rotate(${ray.rotation}deg) translateY(-120px)`,
            borderRadius: "2px",
            filter: `drop-shadow(0 0 8px ${glow})`,
          }}
        />
      ))}
    </div>
  );
}

// Particulas flutuantes
function FloatingParticles({ color }: { color: string }) {
  const particles = useMemo(() =>
    Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2,
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
            x: `${p.x}%`,
            y: `${p.y}%`,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            y: [`${p.y}%`, `${p.y - 30}%`],
            opacity: [0, 1, 0],
            scale: [0, 1, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            backgroundColor: color,
            borderRadius: "50%",
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      ))}
    </div>
  );
}

export default function MilestoneOverlay({
  day,
  baseBonus,
  multiplier,
  currencyName,
  lang,
  onCollect,
}: MilestoneOverlayProps) {
  const theme = MILESTONE_COLORS[day];
  const bonus = baseBonus ?? MILESTONE_BONUSES[day];
  const finalBonus = bonus * multiplier;

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
        zIndex: 110,
        background: "radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.92) 100%)",
        backdropFilter: "blur(6px)",
      }}
    >
      {/* Raios de luz */}
      <LightRays color={theme.color} glow={theme.glow} />
      
      {/* Particulas */}
      <FloatingParticles color={theme.color} />

      {/* Card principal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ 
          duration: 0.6, 
          ease: [0.34, 1.56, 0.64, 1],
        }}
        style={{
          position: "relative",
          width: "clamp(320px, 42vw, 520px)",
          padding: "clamp(28px, 3.5vw, 48px) clamp(24px, 3vw, 40px)",
          borderRadius: "16px",
          background: "linear-gradient(180deg, rgba(20,18,15,0.98) 0%, rgba(8,6,4,1) 100%)",
          border: `2px solid ${theme.color}`,
          boxShadow: `
            0 0 80px ${theme.glow},
            0 0 120px ${theme.glow},
            inset 0 0 60px rgba(0,0,0,0.7),
            0 30px 80px rgba(0,0,0,0.6)
          `,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(12px, 1.4vw, 20px)",
          zIndex: 1,
        }}
      >
        {/* Badge PNG hero */}
        <motion.img
          src={ASSETS.getBadge(day, lang)}
          alt={`${day} days streak`}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ 
            scale: 1, 
            rotate: 0,
          }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            width: "clamp(140px, 18vw, 240px)",
            height: "clamp(140px, 18vw, 240px)",
            objectFit: "contain",
            marginTop: "-clamp(60px, 8vw, 100px)",
            filter: `drop-shadow(0 0 40px ${theme.glow})`,
          }}
        />

        {/* Pulsacao no badge */}
        <motion.div
          animate={{
            boxShadow: [
              `0 0 40px ${theme.glow}`,
              `0 0 80px ${theme.glow}`,
              `0 0 40px ${theme.glow}`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "-clamp(30px, 4vw, 50px)",
            width: "clamp(140px, 18vw, 240px)",
            height: "clamp(140px, 18vw, 240px)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        {/* Titulo SEQUENCIA DE X DIAS */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 900,
            fontSize: "clamp(22px, 2.8vw, 38px)",
            color: theme.color,
            letterSpacing: "3px",
            textTransform: "uppercase",
            textShadow: `
              0 0 24px ${theme.glow},
              0 0 48px ${theme.glow},
              0 2px 4px rgba(0,0,0,0.6)
            `,
            textAlign: "center",
            margin: 0,
          }}
        >
          {lang === "br" 
            ? `${TEXTS.streakOf[lang]} ${day} ${TEXTS.days[lang]}`
            : `${day}${TEXTS.days[lang]}`
          }
        </motion.h1>

        {/* Divisor ornamental */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          style={{
            width: "80%",
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${theme.color}, transparent)`,
          }}
        />

        {/* Bonus ganho */}
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
          {/* Icone de moedas */}
          <motion.img
            src={ASSETS.coinStack}
            alt=""
            animate={{ 
              y: [0, -5, 0],
              rotate: [0, -3, 3, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
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
            fontSize: "clamp(40px, 5vw, 68px)",
            color: "#00E676",
            textShadow: `
              0 0 24px rgba(0,230,118,0.7),
              0 0 48px rgba(0,230,118,0.4),
              0 2px 6px rgba(0,0,0,0.6)
            `,
            lineHeight: 1,
          }}>
            +{finalBonus}
          </span>

          {/* Nome da moeda + bonus */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "2px",
          }}>
            <span style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: "clamp(16px, 1.8vw, 24px)",
              color: "#00E676",
              letterSpacing: "1px",
            }}>
              {currencyName}
            </span>
            <span style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: "clamp(12px, 1.4vw, 18px)",
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}>
              {TEXTS.bonus[lang]}
            </span>
          </div>
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
          {bonus} {TEXTS.base[lang]} × <span style={{ color: theme.color }}>{multiplier}x</span> = {finalBonus} {currencyName}
        </motion.div>

        {/* Indicador do dia */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(6px, 0.8vw, 10px)",
            padding: "clamp(6px, 0.8vw, 10px) clamp(14px, 1.6vw, 22px)",
            background: "rgba(0,0,0,0.5)",
            border: `1px solid ${theme.color}40`,
            borderRadius: "8px",
          }}
        >
          <img
            src={ASSETS.iconTrophy}
            alt=""
            style={{
              width: "clamp(16px, 1.8vw, 24px)",
              height: "clamp(16px, 1.8vw, 24px)",
              filter: `drop-shadow(0 0 4px ${theme.glow})`,
            }}
          />
          <span style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 600,
            fontSize: "clamp(11px, 1.2vw, 15px)",
            color: theme.color,
            letterSpacing: "2px",
          }}>
            {TEXTS.dayOf28[lang]} {day} {TEXTS.of28[lang]}
          </span>
        </motion.div>

        {/* Botao COLETAR BONUS */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          onClick={onCollect}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{
            position: "relative",
            marginTop: "clamp(6px, 0.8vw, 12px)",
            fontFamily: "'Cinzel', serif",
            fontWeight: 900,
            fontSize: "clamp(15px, 1.7vw, 22px)",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#FFFFFF",
            padding: "clamp(14px, 1.8vw, 22px) clamp(40px, 5vw, 70px)",
            borderRadius: "12px",
            border: "2px solid rgba(0,230,118,0.5)",
            background: "linear-gradient(180deg, #00E676 0%, #00C853 50%, #004D25 100%)",
            boxShadow: `
              0 0 25px rgba(0,230,118,0.5),
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
          {TEXTS.collectBonus[lang]}
        </motion.button>

        {/* Gemas decorativas */}
        <img
          src={ASSETS.gemGreen}
          alt=""
          style={{
            position: "absolute",
            bottom: "8%",
            left: "-4%",
            width: "clamp(20px, 2.5vw, 34px)",
            height: "clamp(20px, 2.5vw, 34px)",
            objectFit: "contain",
            opacity: 0.6,
            filter: "drop-shadow(0 0 8px rgba(0,230,118,0.5))",
          }}
        />
        <img
          src={ASSETS.gemGreen}
          alt=""
          style={{
            position: "absolute",
            top: "20%",
            right: "-3%",
            width: "clamp(16px, 2vw, 28px)",
            height: "clamp(16px, 2vw, 28px)",
            objectFit: "contain",
            opacity: 0.5,
            filter: "drop-shadow(0 0 8px rgba(0,230,118,0.5))",
            transform: "rotate(30deg)",
          }}
        />
      </motion.div>
    </motion.div>
  );
}
