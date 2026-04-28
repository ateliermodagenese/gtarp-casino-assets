"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ============================================================
   BLACKJACK BETTING SCREEN — TELA 1
   Mesa central vazia + chip selector abaixo + side bets laterais
   CSS inline (style={{}}), ZERO Tailwind
   ============================================================ */

interface SideBets {
  perfectPairs: number;
  twentyOnePlus3: number;
}

interface BlackjackBettingProps {
  onDeal: (bet: number, sideBets: SideBets) => void;
  lang: "br" | "in";
}

/* ------------------------------ CHIP DATA (CSS GRADIENTS) ------------------------------ */
const CHIPS = [
  { value: 10, label: "10", gradient: "radial-gradient(circle at 35% 35%, #F5F5F5, #BDBDBD 60%, #9E9E9E)", textColor: "#1A1A1A" },
  { value: 25, label: "25", gradient: "radial-gradient(circle at 35% 35%, #66BB6A, #388E3C 60%, #1B5E20)", textColor: "#FFFFFF" },
  { value: 50, label: "50", gradient: "radial-gradient(circle at 35% 35%, #448AFF, #1565C0 60%, #0D47A1)", textColor: "#FFFFFF" },
  { value: 100, label: "100", gradient: "radial-gradient(circle at 35% 35%, #1A1A1A, #424242 60%, #212121)", textColor: "#FFFFFF" },
  { value: 500, label: "500", gradient: "radial-gradient(circle at 35% 35%, #D4A843, #8B6914 60%, #5D4600)", textColor: "#FFFFFF" },
];

/* ------------------------------ TRANSLATIONS ------------------------------ */
const T = {
  br: {
    dealer: "DEALER",
    player: "JOGADOR",
    bet: "APOSTA",
    deal: "DISTRIBUIR",
    clear: "LIMPAR",
    perfectPairs: "PP",
    twentyOnePlus3: "21+3",
    minBet: "Aposta min: G$10",
    totalBet: "Total",
  },
  in: {
    dealer: "DEALER",
    player: "PLAYER",
    bet: "BET",
    deal: "DEAL",
    clear: "CLEAR",
    perfectPairs: "PP",
    twentyOnePlus3: "21+3",
    minBet: "Min bet: G$10",
    totalBet: "Total",
  },
};

/* ------------------------------ MAIN COMPONENT ------------------------------ */
export default function BlackjackBetting({ onDeal, lang }: BlackjackBettingProps) {
  const t = T[lang];

  /* State */
  const [selectedChip, setSelectedChip] = useState<number>(10);
  const [mainBet, setMainBet] = useState<number>(0);
  const [sideBets, setSideBets] = useState<SideBets>({ perfectPairs: 0, twentyOnePlus3: 0 });

  /* Total bet calculation */
  const totalBet = mainBet + sideBets.perfectPairs + sideBets.twentyOnePlus3;

  /* Handlers */
  const handleMainBetClick = useCallback(() => {
    setMainBet((prev) => prev + selectedChip);
  }, [selectedChip]);

  const handleSideBetClick = useCallback(
    (type: "perfectPairs" | "twentyOnePlus3") => {
      setSideBets((prev) => ({
        ...prev,
        [type]: prev[type] + selectedChip,
      }));
    },
    [selectedChip]
  );

  const handleClear = useCallback(() => {
    setMainBet(0);
    setSideBets({ perfectPairs: 0, twentyOnePlus3: 0 });
  }, []);

  const handleDeal = useCallback(() => {
    if (mainBet >= 10) {
      onDeal(mainBet, sideBets);
    }
  }, [mainBet, sideBets, onDeal]);

  const canDeal = mainBet >= 10;

  /* ------------------------------ RENDER ------------------------------ */
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        padding: "clamp(12px, 2vw, 24px)",
        boxSizing: "border-box",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* ==================== MESA CENTRAL ==================== */}
      <div
        style={{
          position: "relative",
          width: "clamp(280px, 55vw, 600px)",
          minHeight: "clamp(280px, 50vh, 500px)",
          background: "radial-gradient(ellipse at 50% 50%, #1a472a, #0f2d1a 70%, #091a0f)",
          borderRadius: "clamp(12px, 2vw, 20px)",
          border: "3px solid rgba(212,168,67,0.4)",
          boxShadow:
            "0 0 30px rgba(212,168,67,0.08), 0 8px 32px rgba(0,0,0,0.4), inset 0 0 150px rgba(0,0,0,0.3)",
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "8px 8px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "clamp(16px, 3vw, 32px)",
          boxSizing: "border-box",
        }}
      >
        {/* ---------- DEALER LABEL ---------- */}
        <div
          style={{
            fontFamily: "'Cinzel Decorative', Cinzel, serif",
            fontWeight: 700,
            fontSize: "clamp(12px, 1.8vw, 18px)",
            color: "rgba(255,255,255,0.1)",
            textTransform: "uppercase",
            letterSpacing: "3px",
            userSelect: "none",
          }}
        >
          {t.dealer}
        </div>

        {/* ---------- CENTRAL AREA WITH SIDE BETS ---------- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(12px, 3vw, 32px)",
            width: "100%",
            flex: 1,
          }}
        >
          {/* SIDE BET: Perfect Pairs (left) */}
          <motion.div
            whileHover={{ scale: 1.05, borderColor: "rgba(212,168,67,0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSideBetClick("perfectPairs")}
            style={{
              width: "clamp(48px, 7vw, 64px)",
              height: "clamp(60px, 9vw, 80px)",
              border: sideBets.perfectPairs > 0
                ? "2px solid rgba(212,168,67,0.5)"
                : "2px dashed rgba(212,168,67,0.15)",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              cursor: "pointer",
              background: sideBets.perfectPairs > 0
                ? "rgba(212,168,67,0.08)"
                : "rgba(0,0,0,0.2)",
              transition: "border-color 0.2s, background 0.2s",
            }}
          >
            <span
              style={{
                fontFamily: "'Cinzel Decorative', Cinzel, serif",
                fontWeight: 700,
                fontSize: "clamp(10px, 1.4vw, 14px)",
                color: sideBets.perfectPairs > 0 ? "#D4A843" : "rgba(255,255,255,0.3)",
              }}
            >
              {t.perfectPairs}
            </span>
            <AnimatePresence>
              {sideBets.perfectPairs > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: "clamp(9px, 1.2vw, 12px)",
                    color: "#00E676",
                  }}
                >
                  G${sideBets.perfectPairs}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          {/* MAIN BET AREA (center) */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMainBetClick}
            style={{
              position: "relative",
              width: "clamp(80px, 14vw, 140px)",
              height: "clamp(80px, 14vw, 140px)",
              borderRadius: "50%",
              border: "3px solid rgba(212,168,67,0.5)",
              background: "rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow:
                mainBet > 0
                  ? "0 0 20px rgba(0,230,118,0.15), inset 0 0 30px rgba(0,0,0,0.4)"
                  : "inset 0 0 30px rgba(0,0,0,0.4)",
            }}
          >
            {/* Pulsing ring animation when empty */}
            {mainBet === 0 && (
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(0,230,118,0.3)",
                    "0 0 0 8px rgba(0,230,118,0)",
                  ],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                style={{
                  position: "absolute",
                  inset: -3,
                  borderRadius: "50%",
                  pointerEvents: "none",
                }}
              />
            )}

            {mainBet === 0 ? (
              <span
                style={{
                  fontFamily: "'Cinzel Decorative', Cinzel, serif",
                  fontWeight: 700,
                  fontSize: "clamp(12px, 2vw, 18px)",
                  color: "rgba(255,255,255,0.25)",
                  textTransform: "uppercase",
                }}
              >
                {t.bet}
              </span>
            ) : (
              /* Chip Stack Visual */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                {/* Stacked chips representation */}
                <div style={{ position: "relative", height: "clamp(24px, 4vw, 40px)" }}>
                  {[...Array(Math.min(5, Math.ceil(mainBet / 50)))].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        bottom: i * 4,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "clamp(28px, 4vw, 40px)",
                        height: "clamp(6px, 1vw, 10px)",
                        background: CHIPS[Math.min(i, 4)].gradient,
                        borderRadius: "50%",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                      }}
                    />
                  ))}
                </div>
                <motion.span
                  key={mainBet}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: "clamp(14px, 2.2vw, 22px)",
                    color: "#00E676",
                    marginTop: "4px",
                  }}
                >
                  G${mainBet}
                </motion.span>
              </div>
            )}
          </motion.div>

          {/* SIDE BET: 21+3 (right) */}
          <motion.div
            whileHover={{ scale: 1.05, borderColor: "rgba(212,168,67,0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSideBetClick("twentyOnePlus3")}
            style={{
              width: "clamp(48px, 7vw, 64px)",
              height: "clamp(60px, 9vw, 80px)",
              border: sideBets.twentyOnePlus3 > 0
                ? "2px solid rgba(212,168,67,0.5)"
                : "2px dashed rgba(212,168,67,0.15)",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              cursor: "pointer",
              background: sideBets.twentyOnePlus3 > 0
                ? "rgba(212,168,67,0.08)"
                : "rgba(0,0,0,0.2)",
              transition: "border-color 0.2s, background 0.2s",
            }}
          >
            <span
              style={{
                fontFamily: "'Cinzel Decorative', Cinzel, serif",
                fontWeight: 700,
                fontSize: "clamp(10px, 1.4vw, 14px)",
                color: sideBets.twentyOnePlus3 > 0 ? "#D4A843" : "rgba(255,255,255,0.3)",
              }}
            >
              {t.twentyOnePlus3}
            </span>
            <AnimatePresence>
              {sideBets.twentyOnePlus3 > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: "clamp(9px, 1.2vw, 12px)",
                    color: "#00E676",
                  }}
                >
                  G${sideBets.twentyOnePlus3}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ---------- DIVIDER ---------- */}
        <div
          style={{
            width: "60%",
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(212,168,67,0.15), transparent)",
          }}
        />

        {/* ---------- PLAYER LABEL ---------- */}
        <div
          style={{
            fontFamily: "'Cinzel Decorative', Cinzel, serif",
            fontWeight: 700,
            fontSize: "clamp(12px, 1.8vw, 18px)",
            color: "rgba(255,255,255,0.1)",
            textTransform: "uppercase",
            letterSpacing: "3px",
            userSelect: "none",
          }}
        >
          {t.player}
        </div>
      </div>

      {/* ==================== CHIP SELECTOR (below table) ==================== */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(6px, 1vw, 12px)",
          marginTop: "clamp(16px, 3vw, 28px)",
        }}
      >
        {CHIPS.map((chip) => (
          <motion.button
            key={chip.value}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedChip(chip.value)}
            style={{
              width: "clamp(36px, 5.5vw, 52px)",
              height: "clamp(36px, 5.5vw, 52px)",
              minWidth: "44px",
              minHeight: "44px",
              borderRadius: "50%",
              background: chip.gradient,
              border: "none",
              outline: selectedChip === chip.value
                ? "2px solid rgba(255,255,255,0.5)"
                : "none",
              outlineOffset: "2px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "clamp(10px, 1.4vw, 14px)",
              color: chip.textColor,
              boxShadow:
                selectedChip === chip.value
                  ? "0 0 12px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)"
                  : "0 4px 8px rgba(0,0,0,0.4)",
              transform: selectedChip === chip.value ? "scale(1.15)" : "scale(1)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            {chip.label}
          </motion.button>
        ))}
      </div>

      {/* ==================== BET DISPLAY + BUTTONS ==================== */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(12px, 2vw, 20px)",
          marginTop: "clamp(16px, 3vw, 24px)",
        }}
      >
        {/* Total Bet Display */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "clamp(11px, 1.4vw, 14px)",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {t.totalBet}:
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "clamp(16px, 2.5vw, 28px)",
              color: totalBet > 0 ? "#00E676" : "rgba(255,255,255,0.3)",
            }}
          >
            G${totalBet}
          </span>
        </div>

        {/* Clear Button */}
        <AnimatePresence>
          {totalBet > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClear}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(255,82,82,0.2)",
                border: "1px solid rgba(255,82,82,0.4)",
                color: "#FF5252",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: 700,
              }}
              aria-label={t.clear}
            >
              X
            </motion.button>
          )}
        </AnimatePresence>

        {/* Deal Button */}
        <motion.button
          whileHover={canDeal ? { scale: 1.03 } : {}}
          whileTap={canDeal ? { scale: 0.97 } : {}}
          onClick={handleDeal}
          disabled={!canDeal}
          style={{
            minHeight: "48px",
            padding: "clamp(10px, 1.5vw, 14px) clamp(24px, 4vw, 48px)",
            background: canDeal
              ? "linear-gradient(180deg, #00E676, #00C853)"
              : "linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
            border: "none",
            borderRadius: "10px",
            cursor: canDeal ? "pointer" : "not-allowed",
            fontFamily: "'Cinzel Decorative', Cinzel, serif",
            fontWeight: 700,
            fontSize: "clamp(12px, 1.8vw, 16px)",
            color: canDeal ? "#0A0A0A" : "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
            letterSpacing: "2px",
            boxShadow: canDeal
              ? "0 0 20px rgba(0,230,118,0.3), 0 4px 12px rgba(0,0,0,0.3)"
              : "none",
            transition: "background 0.2s, box-shadow 0.2s",
          }}
        >
          {t.deal}
        </motion.button>
      </div>

      {/* Min bet hint */}
      <span
        style={{
          marginTop: "clamp(8px, 1.5vw, 12px)",
          fontFamily: "Inter, sans-serif",
          fontSize: "clamp(10px, 1.2vw, 12px)",
          color: "rgba(255,255,255,0.3)",
        }}
      >
        {t.minBet}
      </span>
    </div>
  );
}
