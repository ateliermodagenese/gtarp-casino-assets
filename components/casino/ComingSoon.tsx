"use client";

// ComingSoon — Tela "EM BREVE" Premium AAA
// Refatorado 30/04/2026
//
// Visual luxo seguindo paleta Blackout Casino (golden polish + verde esmeralda)
// Usa: brasao-vitoria.png + frame-luxo-ornamental.png + shimmer dourado infinito
// Bilingue BR/IN

import { motion } from "framer-motion";
import { useCasino } from "@/contexts/CasinoContext";

interface ComingSoonProps {
  onBack: () => void;
}

const TEXTS = {
  br: {
    title: "EM BREVE",
    sub: "Este jogo está sendo preparado com atenção aos detalhes.",
    sub2: "Em breve disponível para você.",
    back: "VOLTAR",
    backTooltip: "Voltar ao painel",
  },
  in: {
    title: "COMING SOON",
    sub: "This game is being prepared with attention to detail.",
    sub2: "Available soon for you.",
    back: "GO BACK",
    backTooltip: "Back to panel",
  },
};

const GOLD = {
  primary: "#D4A843",
  light: "#FFD700",
  dark: "#8B6914",
  glow: "rgba(212,168,67,0.45)",
  glowSoft: "rgba(212,168,67,0.15)",
};
const EMERALD = {
  primary: "#00C853",
  light: "#00E676",
  glow: "rgba(0,230,118,0.35)",
};

export default function ComingSoon({ onBack }: ComingSoonProps) {
  const { lang } = useCasino();
  const t = TEXTS[lang === "in" ? "in" : "br"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 60,
        borderRadius: "inherit",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(16px, 2vw, 28px)",
        background: "radial-gradient(ellipse at center, rgba(20,16,10,0.92) 0%, rgba(8,7,6,0.98) 70%, rgba(0,0,0,1) 100%)",
        padding: "clamp(20px, 3vw, 40px)",
      }}
    >
      {/* ==================== AMBIENT LAYERS ==================== */}

      {/* Layer 1: Shimmer dourado infinito (CSS animacao premium) */}
      <motion.div
        aria-hidden
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(105deg, transparent 35%, ${GOLD.glowSoft} 50%, transparent 65%)`,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Layer 2: Glow ambiental esmeralda (pulsando, sutil) */}
      <motion.div
        aria-hidden
        animate={{
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 30% 20%, ${EMERALD.glow} 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${GOLD.glowSoft} 0%, transparent 50%)`,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Layer 3: Sparkle particles CSS (3 dots pulsantes em posições random) */}
      {[
        { x: "15%", y: "25%", delay: 0 },
        { x: "85%", y: "30%", delay: 0.8 },
        { x: "20%", y: "75%", delay: 1.6 },
        { x: "78%", y: "70%", delay: 2.4 },
        { x: "50%", y: "15%", delay: 1.2 },
      ].map((p, i) => (
        <motion.div
          key={i}
          aria-hidden
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.4, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            background: GOLD.light,
            boxShadow: `0 0 12px ${GOLD.glow}, 0 0 6px ${GOLD.light}`,
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      ))}

      {/* ==================== CONTEUDO PRINCIPAL ==================== */}

      <div
        style={{
          position: "relative",
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(14px, 1.8vw, 22px)",
          maxWidth: "clamp(280px, 80%, 540px)",
        }}
      >
        {/* BRASAO — PNG luxo com glow ambiental */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.7, type: "spring", stiffness: 180, damping: 18 }}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Glow atras do brasao */}
          <motion.div
            aria-hidden
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              width: "clamp(140px, 18vw, 220px)",
              height: "clamp(140px, 18vw, 220px)",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${GOLD.glow} 0%, transparent 65%)`,
              filter: "blur(20px)",
            }}
          />

          {/* Brasao PNG */}
          <motion.img
            src="/assets/games/daily-free/brasao-vitoria.png"
            alt=""
            animate={{
              y: [0, -6, 0],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "relative",
              width: "clamp(100px, 12vw, 160px)",
              height: "auto",
              filter: `drop-shadow(0 8px 20px ${GOLD.glow}) drop-shadow(0 0 12px ${EMERALD.glow})`,
              opacity: 0.92,
            }}
          />
        </motion.div>

        {/* MOLDURA + TITULO "EM BREVE" */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 240, damping: 20 }}
          style={{
            position: "relative",
            padding: "clamp(12px, 1.6vw, 20px) clamp(28px, 4vw, 56px)",
            background: `linear-gradient(135deg, rgba(20,16,10,0.85) 0%, rgba(8,7,6,0.95) 100%)`,
            border: `2px solid ${GOLD.primary}`,
            borderRadius: "12px",
            boxShadow: [
              `0 0 0 1px ${GOLD.dark}`,
              `0 0 32px ${GOLD.glow}`,
              `inset 0 1px 1px rgba(255,215,0,0.1)`,
              "0 8px 24px rgba(0,0,0,0.5)",
            ].join(", "),
          }}
        >
          {/* 4 cantos decorativos (simulam "frame ornamental" CSS-only) */}
          {[
            { top: -2, left: -2, borderTop: `2px solid ${GOLD.light}`, borderLeft: `2px solid ${GOLD.light}` },
            { top: -2, right: -2, borderTop: `2px solid ${GOLD.light}`, borderRight: `2px solid ${GOLD.light}` },
            { bottom: -2, left: -2, borderBottom: `2px solid ${GOLD.light}`, borderLeft: `2px solid ${GOLD.light}` },
            { bottom: -2, right: -2, borderBottom: `2px solid ${GOLD.light}`, borderRight: `2px solid ${GOLD.light}` },
          ].map((style, i) => (
            <motion.div
              key={i}
              aria-hidden
              animate={{
                boxShadow: [
                  `0 0 4px ${GOLD.glow}`,
                  `0 0 12px ${GOLD.glow}`,
                  `0 0 4px ${GOLD.glow}`,
                ],
              }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
              style={{
                position: "absolute",
                width: "12px",
                height: "12px",
                ...style,
              }}
            />
          ))}

          <motion.span
            animate={{
              textShadow: [
                `0 0 12px ${GOLD.glow}, 0 2px 4px rgba(0,0,0,0.5)`,
                `0 0 24px ${GOLD.glow}, 0 2px 4px rgba(0,0,0,0.5)`,
                `0 0 12px ${GOLD.glow}, 0 2px 4px rgba(0,0,0,0.5)`,
              ],
            }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(20px, 3.2vw, 38px)",
              fontWeight: 900,
              color: GOLD.light,
              letterSpacing: "clamp(3px, 0.5vw, 6px)",
              textTransform: "uppercase",
              display: "block",
              textAlign: "center",
            }}
          >
            {t.title}
          </motion.span>
        </motion.div>

        {/* Linha divisoria ornamental (CSS-only - 2 linhas com diamante central) */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "clamp(180px, 30%, 320px)",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              background: `linear-gradient(90deg, transparent 0%, ${GOLD.primary} 50%, ${GOLD.dark} 100%)`,
            }}
          />
          <motion.div
            animate={{
              rotate: [0, 360],
              boxShadow: [
                `0 0 6px ${GOLD.glow}`,
                `0 0 14px ${GOLD.glow}`,
                `0 0 6px ${GOLD.glow}`,
              ],
            }}
            transition={{
              rotate: { duration: 8, repeat: Infinity, ease: "linear" },
              boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            }}
            style={{
              width: "8px",
              height: "8px",
              background: GOLD.light,
              transform: "rotate(45deg)",
              flexShrink: 0,
            }}
          />
          <div
            style={{
              flex: 1,
              height: "1px",
              background: `linear-gradient(90deg, ${GOLD.dark} 0%, ${GOLD.primary} 50%, transparent 100%)`,
            }}
          />
        </motion.div>

        {/* SUBTITULO em duas linhas */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55 }}
          style={{
            textAlign: "center",
            fontFamily: "'Inter', sans-serif",
            color: "rgba(212,168,67,0.7)",
            lineHeight: 1.6,
          }}
        >
          <div
            style={{
              fontSize: "clamp(11px, 1.2vw, 14px)",
              marginBottom: "4px",
            }}
          >
            {t.sub}
          </div>
          <div
            style={{
              fontSize: "clamp(10px, 1.05vw, 12px)",
              color: "rgba(212,168,67,0.5)",
              fontStyle: "italic",
            }}
          >
            {t.sub2}
          </div>
        </motion.div>

        {/* BOTAO VOLTAR — esmeralda premium */}
        <motion.button
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, type: "spring", stiffness: 240 }}
          whileHover={{
            scale: 1.05,
            boxShadow: [
              `0 0 28px ${EMERALD.glow}`,
              `0 0 0 2px ${EMERALD.light}`,
              `inset 0 1px 1px rgba(255,255,255,0.25)`,
              `0 6px 16px rgba(0,0,0,0.5)`,
            ].join(", "),
          }}
          whileTap={{ scale: 0.96 }}
          onClick={onBack}
          title={t.backTooltip}
          style={{
            marginTop: "clamp(8px, 1vw, 14px)",
            padding: "clamp(11px, 1.4vw, 16px) clamp(28px, 4vw, 48px)",
            background: `linear-gradient(180deg, ${EMERALD.light} 0%, ${EMERALD.primary} 50%, #007530 100%)`,
            color: "#FFFFFF",
            border: `2px solid ${EMERALD.light}`,
            borderRadius: "10px",
            fontFamily: "'Cinzel', serif",
            fontSize: "clamp(12px, 1.3vw, 15px)",
            fontWeight: 800,
            letterSpacing: "clamp(2px, 0.4vw, 3px)",
            textTransform: "uppercase",
            cursor: "pointer",
            minWidth: "clamp(140px, 18vw, 200px)",
            minHeight: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            textShadow: `0 2px 4px rgba(0,0,0,0.5), 0 0 10px ${EMERALD.glow}`,
            boxShadow: [
              `0 0 16px ${EMERALD.glow}`,
              `inset 0 1px 1px rgba(255,255,255,0.2)`,
              `0 4px 12px rgba(0,0,0,0.4)`,
            ].join(", "),
            transition: "box-shadow 0.2s, transform 0.15s",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" strokeLinecap="round" />
            <polyline points="12 19 5 12 12 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t.back}
        </motion.button>
      </div>
    </motion.div>
  );
}
