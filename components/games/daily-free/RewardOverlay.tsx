"use client";

// RewardOverlay — Modal "PARABENS!" do Daily-Free
// F3.F - 30/04/2026
//
// Aparece apos o spin da wheel terminar.
// 2 variantes:
//   1. Regular reward (giro comum): "+200 GC"
//   2. Milestone reward (D7/D14/D21/D28): "+200 GC" do giro + "+500 GC" bonus + badge do milestone
//
// Visual luxo (referencia: Imagem 7 do BC):
//   - brasao-vitoria.png no topo (PNG AAA com asas + estrela + laurel + gema)
//   - Confetti animado caindo (confetti-gold-emerald.png replicado em CSS)
//   - "PARABENS!" Cinzel dourado metalico
//   - Numero gigante VERDE 3D com glow
//   - Divider ornamental gold
//   - Botao COLETAR verde luxo polido com pulse
//
// Bilingue BR/IN automatico

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RewardOverlayProps {
  // Estado de visibilidade (controlado pelo DailyFreeGame)
  open: boolean;
  // Callback quando jogador clica em COLETAR
  onCollect: () => void;
  // Resultado do giro (vem do casino:daily:claim do server)
  reward: {
    wheelAmount: number;          // Premio do wheel (50, 100, 200, 500, 1000 ou Mystery 1000-5000)
    segmentTier: "common" | "good" | "big" | "mystery";
    mysteryAmount: number | null; // Se Mystery, valor sorteado dentro do range
    milestoneDay: number | null;  // 7, 14, 21, 28 ou null
    milestoneBonus: number;       // 500, 1000, 2500, 5000 ou 0
    totalAwarded: number;         // wheelAmount + milestoneBonus
    isAnchor: boolean;            // primeiro daily-free vitalicio
  };
  // Dia atual no ciclo (para texto "DIA X DE 28")
  currentDay: number;
  cycleDays?: number;
  lang: "br" | "in" | "en";
}

const GOLD = {
  primary: "#D4A843",
  light: "#FFD700",
  dark: "#8B6914",
  glow: "rgba(212,168,67,0.55)",
};

const EMERALD = {
  primary: "#00C853",
  light: "#00E676",
  glow: "rgba(0,230,118,0.55)",
};

const BRASAO_PNG = "/assets/games/daily-free/brasao-vitoria.png";
const CONFETTI_PNG = "/assets/shared/ui/confetti-gold-emerald.png";
const DIVIDER_PNG = "/assets/shared/ui/divider-ornamental-gold.png";

function normalizeLang(lang: "br" | "in" | "en"): "br" | "in" {
  return lang === "en" ? "in" : lang;
}

// Path do badge do milestone (dependente de idioma)
function milestoneBadgePath(day: number, lang: "br" | "in"): string {
  return `/assets/games/daily-free/badges/badge-streak-${day}-${lang.toUpperCase()}.png`;
}

export default function RewardOverlay({
  open,
  onCollect,
  reward,
  currentDay,
  cycleDays = 28,
  lang,
}: RewardOverlayProps) {
  const langNorm = normalizeLang(lang);
  const hasMilestone = reward.milestoneDay !== null && reward.milestoneBonus > 0;
  const isMystery = reward.segmentTier === "mystery";

  // Tira foco/scroll do body quando aberto (UX comum em modais celebrativos)
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Esc para fechar (atalho de coletar)
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        e.preventDefault();
        onCollect();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCollect]);

  // Textos bilingues
  const T = {
    br: {
      parabens: "PARABÉNS!",
      voceGanhou: "VOCÊ GANHOU",
      anchor: "PRIMEIRO BÔNUS!",
      mysteryLabel: "MYSTERY",
      diaDe: `DIA ${currentDay} DE ${cycleDays}`,
      milestoneAtingido: (d: number) => `MILESTONE DE ${d} DIAS!`,
      bonusExtra: "BÔNUS EXTRA",
      totalLabel: "TOTAL RECEBIDO",
      coletar: "COLETAR",
    },
    in: {
      parabens: "CONGRATULATIONS!",
      voceGanhou: "YOU WON",
      anchor: "FIRST BONUS!",
      mysteryLabel: "MYSTERY",
      diaDe: `DAY ${currentDay} OF ${cycleDays}`,
      milestoneAtingido: (d: number) => `${d}-DAY MILESTONE!`,
      bonusExtra: "EXTRA BONUS",
      totalLabel: "TOTAL RECEIVED",
      coletar: "COLLECT",
    },
  }[langNorm];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          // Backdrop semi-transparente preto
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(16px, 3vw, 32px)",
          }}
        >
          {/* ============== CONFETTI ANIMADO no fundo ============== */}
          <ConfettiLayer />

          {/* ============== CARD PRINCIPAL ============== */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            style={{
              position: "relative",
              zIndex: 2,
              maxWidth: "min(520px, 90vw)",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "clamp(24px, 3.5vw, 40px) clamp(20px, 3vw, 36px)",
              background:
                "linear-gradient(180deg, rgba(20,16,12,0.96) 0%, rgba(8,7,6,0.98) 100%)",
              border: `2px solid ${GOLD.primary}`,
              borderRadius: "20px",
              boxShadow: [
                `0 0 0 2px ${GOLD.dark}`,
                `0 0 40px ${GOLD.glow}`,
                `0 0 80px rgba(212,168,67,0.25)`,
                `0 20px 60px rgba(0,0,0,0.7)`,
                "inset 0 2px 4px rgba(255,215,0,0.15)",
                "inset 0 -2px 4px rgba(0,0,0,0.5)",
              ].join(", "),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(14px, 1.8vw, 20px)",
              textAlign: "center",
            }}
          >
            {/* BRASAO PNG no topo (com pulse celebrativo na entrada) */}
            <motion.img
              src={BRASAO_PNG}
              alt=""
              aria-hidden
              initial={{ scale: 0, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 14,
                delay: 0.15,
              }}
              style={{
                width: "clamp(110px, 14vw, 170px)",
                height: "auto",
                marginTop: "-30%",
                filter: `drop-shadow(0 0 18px ${GOLD.glow}) drop-shadow(0 6px 12px rgba(0,0,0,0.7))`,
              }}
            />

            {/* TITULO PARABENS! */}
            <motion.h2
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 800,
                fontSize: "clamp(22px, 3vw, 36px)",
                background: `linear-gradient(180deg, ${GOLD.light} 0%, ${GOLD.primary} 50%, ${GOLD.dark} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: GOLD.primary, // fallback
                letterSpacing: "4px",
                margin: 0,
                filter: `drop-shadow(0 0 14px ${GOLD.glow}) drop-shadow(0 2px 4px rgba(0,0,0,0.6))`,
              }}
            >
              {reward.isAnchor ? T.anchor : T.parabens}
            </motion.h2>

            {/* SUBTITLE "VOCE GANHOU" */}
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                fontSize: "clamp(11px, 1.2vw, 14px)",
                color: "rgba(212,168,67,0.75)",
                letterSpacing: "3px",
                marginTop: "-10px",
              }}
            >
              {T.voceGanhou}
            </div>

            {/* DIVIDER PNG */}
            <img
              src={DIVIDER_PNG}
              alt=""
              aria-hidden
              style={{
                width: "65%",
                height: "auto",
                opacity: 0.85,
                filter: `drop-shadow(0 0 6px ${GOLD.glow})`,
              }}
            />

            {/* ============== VALOR PRINCIPAL: wheel amount ============== */}
            <RewardValue
              amount={reward.wheelAmount}
              label={isMystery ? T.mysteryLabel : null}
              tier={reward.segmentTier}
            />

            {/* ============== BLOCO MILESTONE (so se for D7/14/21/28) ============== */}
            {hasMilestone && reward.milestoneDay !== null && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 240,
                  damping: 18,
                  delay: 0.6,
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "clamp(8px, 1vw, 12px)",
                  width: "100%",
                  padding: "clamp(12px, 1.6vw, 18px)",
                  background:
                    "linear-gradient(135deg, rgba(0,80,40,0.18) 0%, rgba(0,40,20,0.15) 100%)",
                  border: `1.5px solid ${EMERALD.primary}`,
                  borderRadius: "14px",
                  boxShadow: [
                    `0 0 16px ${EMERALD.glow}`,
                    "inset 0 1px 2px rgba(0,230,118,0.15)",
                  ].join(", "),
                }}
              >
                {/* Badge PNG do milestone */}
                <img
                  src={milestoneBadgePath(reward.milestoneDay, langNorm)}
                  alt=""
                  style={{
                    width: "clamp(64px, 7vw, 92px)",
                    height: "auto",
                    filter: `drop-shadow(0 0 12px ${EMERALD.glow}) drop-shadow(0 3px 6px rgba(0,0,0,0.6))`,
                  }}
                />
                {/* Texto "MILESTONE DE 7 DIAS!" */}
                <div
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 800,
                    fontSize: "clamp(13px, 1.4vw, 17px)",
                    color: EMERALD.light,
                    letterSpacing: "2px",
                    textShadow: `0 0 10px ${EMERALD.glow}`,
                  }}
                >
                  {T.milestoneAtingido(reward.milestoneDay)}
                </div>
                {/* Bonus value */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontWeight: 600,
                      fontSize: "clamp(10px, 1vw, 12px)",
                      color: "rgba(0,230,118,0.7)",
                      letterSpacing: "2px",
                    }}
                  >
                    {T.bonusExtra}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontWeight: 800,
                      fontSize: "clamp(22px, 2.4vw, 30px)",
                      color: EMERALD.light,
                      textShadow: `0 0 14px ${EMERALD.glow}, 0 2px 4px rgba(0,0,0,0.7)`,
                      letterSpacing: "1px",
                    }}
                  >
                    +{reward.milestoneBonus.toLocaleString("pt-BR")} GC
                  </span>
                </div>
              </motion.div>
            )}

            {/* ============== TOTAL (so mostra quando ha bonus de milestone) ============== */}
            {hasMilestone && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "4px",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 600,
                    fontSize: "clamp(10px, 1vw, 12px)",
                    color: "rgba(255,215,0,0.65)",
                    letterSpacing: "2px",
                  }}
                >
                  {T.totalLabel}
                </span>
                <span
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 800,
                    fontSize: "clamp(20px, 2.2vw, 28px)",
                    color: GOLD.light,
                    textShadow: `0 0 12px ${GOLD.glow}, 0 2px 4px rgba(0,0,0,0.7)`,
                    letterSpacing: "1px",
                  }}
                >
                  {reward.totalAwarded.toLocaleString("pt-BR")} GC
                </span>
              </div>
            )}

            {/* CONTEXTO "DIA 12 DE 28" */}
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                fontSize: "clamp(11px, 1.1vw, 13px)",
                color: "rgba(212,168,67,0.65)",
                letterSpacing: "3px",
                marginTop: hasMilestone ? "-4px" : "-6px",
              }}
            >
              {T.diaDe}
            </div>

            {/* DIVIDER PNG novamente */}
            <img
              src={DIVIDER_PNG}
              alt=""
              aria-hidden
              style={{
                width: "65%",
                height: "auto",
                opacity: 0.85,
                filter: `drop-shadow(0 0 6px ${GOLD.glow})`,
                transform: "rotate(180deg)", // espelha pra simetria visual
              }}
            />

            {/* BOTAO COLETAR (verde luxo polido com pulse) */}
            <motion.button
              onClick={onCollect}
              whileHover={{
                scale: 1.04,
                boxShadow: `0 0 28px ${EMERALD.glow}, 0 0 0 2px ${EMERALD.light}, inset 0 0 14px rgba(0,230,118,0.25)`,
              }}
              whileTap={{ scale: 0.96 }}
              animate={{
                boxShadow: [
                  `0 0 16px ${EMERALD.glow}, 0 0 0 1.5px ${EMERALD.primary}, inset 0 1px 2px rgba(0,230,118,0.2)`,
                  `0 0 26px ${EMERALD.light}, 0 0 0 2px ${EMERALD.light}, inset 0 1px 2px rgba(0,230,118,0.3)`,
                  `0 0 16px ${EMERALD.glow}, 0 0 0 1.5px ${EMERALD.primary}, inset 0 1px 2px rgba(0,230,118,0.2)`,
                ],
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              style={{
                marginTop: "8px",
                padding: "clamp(12px, 1.6vw, 18px) clamp(40px, 6vw, 64px)",
                background: `linear-gradient(180deg, ${EMERALD.light} 0%, ${EMERALD.primary} 50%, #007530 100%)`,
                border: `2px solid ${EMERALD.light}`,
                borderRadius: "10px",
                cursor: "pointer",
                fontFamily: "'Cinzel', serif",
                fontWeight: 800,
                fontSize: "clamp(15px, 1.6vw, 19px)",
                color: "#FFFFFF",
                letterSpacing: "4px",
                textShadow: "0 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(0,230,118,0.4)",
                minWidth: "clamp(180px, 22vw, 260px)",
              }}
            >
              {T.coletar}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// SUBCOMPONENTE: RewardValue (numero gigante verde 3D)
// ============================================================
function RewardValue({
  amount,
  label,
  tier,
}: {
  amount: number;
  label: string | null;
  tier: "common" | "good" | "big" | "mystery";
}) {
  // Mystery e tiers altos ganham mais glow
  const intensity = tier === "mystery" ? 1.4 : tier === "big" ? 1.2 : 1;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 14,
        delay: 0.5,
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {label && (
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(11px, 1.1vw, 13px)",
            color: GOLD.light,
            letterSpacing: "4px",
            textShadow: `0 0 10px ${GOLD.glow}`,
            opacity: 0.85,
          }}
        >
          {label}
        </span>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "clamp(6px, 0.8vw, 12px)",
        }}
      >
        {/* Numero principal verde 3D gigante */}
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 900,
            // Tamanho dinamico (Mystery e bigger sao maiores)
            fontSize: `clamp(${36 * intensity}px, ${5 * intensity}vw, ${64 * intensity}px)`,
            // Gradiente verde 3D metalico (efeito Imagem 7)
            background: `linear-gradient(180deg, ${EMERALD.light} 0%, ${EMERALD.primary} 50%, #007530 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: EMERALD.light, // fallback
            letterSpacing: "1px",
            lineHeight: 1,
            // Multiplas drop-shadows pra dar profundidade 3D
            filter: [
              `drop-shadow(0 0 ${20 * intensity}px ${EMERALD.glow})`,
              `drop-shadow(0 0 ${40 * intensity}px rgba(0,230,118,0.3))`,
              `drop-shadow(0 4px 6px rgba(0,0,0,0.7))`,
            ].join(" "),
          }}
        >
          +{amount.toLocaleString("pt-BR")}
        </span>
        {/* Texto "GC" menor mas no mesmo gradiente */}
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 800,
            fontSize: `clamp(${20 * intensity}px, ${2.6 * intensity}vw, ${36 * intensity}px)`,
            background: `linear-gradient(180deg, ${EMERALD.light} 0%, ${EMERALD.primary} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: EMERALD.primary,
            letterSpacing: "2px",
            filter: `drop-shadow(0 0 12px ${EMERALD.glow}) drop-shadow(0 2px 3px rgba(0,0,0,0.6))`,
          }}
        >
          GCoin
        </span>
      </div>
    </motion.div>
  );
}

// ============================================================
// CAMADA DE CONFETTI ANIMADO
// ============================================================
function ConfettiLayer() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
        overflow: "hidden",
      }}
    >
      {/* PNG de confetti como layer base (estatico) */}
      <motion.img
        src={CONFETTI_PNG}
        alt=""
        initial={{ opacity: 0, scale: 1.2 }}
        animate={{ opacity: 0.85, scale: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          position: "absolute",
          top: "-10%",
          left: "-5%",
          width: "110%",
          height: "auto",
          mixBlendMode: "screen",
          filter: "brightness(1.1)",
        }}
      />
      {/* Confetti dinamicos extras: 16 particulas caindo (CSS) */}
      {[...Array(16)].map((_, i) => {
        const isGold = i % 2 === 0;
        const delay = (i * 0.15) % 2;
        const xStart = 5 + (i * 6.2) % 90;
        const drift = (i % 4 === 0 ? 1 : -1) * (10 + (i % 3) * 8);
        return (
          <motion.div
            key={`confetti-extra-${i}`}
            initial={{
              y: -50,
              x: 0,
              rotate: 0,
              opacity: 0,
            }}
            animate={{
              y: ["0vh", "110vh"],
              x: [0, drift, 0, drift * 0.5],
              rotate: [0, 360, 720],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 3.5 + (i % 3),
              repeat: Infinity,
              delay,
              ease: "linear",
            }}
            style={{
              position: "absolute",
              top: "-5%",
              left: `${xStart}%`,
              width: "10px",
              height: i % 3 === 0 ? "14px" : "6px",
              background: isGold
                ? `linear-gradient(135deg, ${GOLD.light}, ${GOLD.primary})`
                : `linear-gradient(135deg, ${EMERALD.light}, ${EMERALD.primary})`,
              boxShadow: isGold
                ? `0 0 6px ${GOLD.glow}`
                : `0 0 6px ${EMERALD.glow}`,
              borderRadius: "1px",
            }}
          />
        );
      })}
    </div>
  );
}
