"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface CrashBettingProps {
  historyResults: number[];
  onBet: (amount: number, autoCashout: number | null) => void;
  balance: number;
  minBet?: number;
  maxBet?: number;
  countdown: number;
  lang: "br" | "en";
}

interface MockBet {
  name: string;
  amount: number;
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const MOCK_BETS: MockBet[] = [
  { name: "JokerBR_777", amount: 1250 },
  { name: "NightOwl", amount: 500 },
  { name: "CasinoKing99", amount: 3200 },
  { name: "LuckyDragon", amount: 780 },
  { name: "AcePlayer", amount: 2100 },
  { name: "GoldenBet", amount: 450 },
];

const TEXTS = {
  br: {
    nextRound: "PROXIMO ROUND EM",
    placeBet: "Faca sua aposta",
    bet: "APOSTA",
    cashoutAt: "SACAR EM",
    manual: "MANUAL",
    auto: "AUTO",
    bets: "APOSTAS",
    betButton: "APOSTAR",
    betted: "Apostou",
  },
  en: {
    nextRound: "NEXT ROUND IN",
    placeBet: "Place your bet",
    bet: "BET",
    cashoutAt: "CASHOUT AT",
    manual: "MANUAL",
    auto: "AUTO",
    bets: "BETS",
    betButton: "BET",
    betted: "Betted",
  },
};

/* ─────────────────────────────────────────────────────────────
   HELPER: Badge color by multiplier
───────────────────────────────────────────────────────────── */
function getBadgeStyle(mult: number): { background: string; color: string } {
  if (mult >= 10) {
    return { background: "rgba(212,168,67,0.15)", color: "#D4A843" };
  }
  if (mult >= 2) {
    return { background: "rgba(0,230,118,0.1)", color: "#00E676" };
  }
  return { background: "rgba(255,68,68,0.1)", color: "#FF4444" };
}

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */
export default function CrashBetting({
  historyResults,
  onBet,
  balance,
  minBet = 10,
  maxBet = 10000,
  countdown,
  lang,
}: CrashBettingProps) {
  const t = TEXTS[lang];

  const [betAmount, setBetAmount] = useState<number>(minBet);
  const [autoCashout, setAutoCashout] = useState<string>("2.00");
  const [mode, setMode] = useState<"manual" | "auto">("manual");

  /* ─────────────────────────────────────────────────────────
     Handlers
  ───────────────────────────────────────────────────────── */
  const handleMin = () => setBetAmount(minBet);
  const handleMax = () => setBetAmount(Math.min(maxBet, balance));
  const handleDouble = () =>
    setBetAmount((prev) => Math.min(prev * 2, maxBet, balance));
  const handleHalf = () =>
    setBetAmount((prev) => Math.max(Math.floor(prev / 2), minBet));

  const handleBet = () => {
    const cashoutValue =
      mode === "auto" ? parseFloat(autoCashout) || null : null;
    onBet(betAmount, cashoutValue);
  };

  const truncateName = (name: string, max: number) =>
    name.length > max ? name.slice(0, max) + "..." : name;

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: "clamp(8px, 1.5vw, 14px)",
        padding: "clamp(8px, 1.5vw, 14px)",
        boxSizing: "border-box",
      }}
    >
      {/* ══════════════════════════════════════════════════════════
          1. HISTORY BAR
      ══════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          overflowY: "hidden",
          paddingBottom: "4px",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(212,168,67,0.4) transparent",
        }}
      >
        {historyResults.map((mult, idx) => {
          const badgeStyle = getBadgeStyle(mult);
          return (
            <div
              key={idx}
              style={{
                flexShrink: 0,
                background: badgeStyle.background,
                color: badgeStyle.color,
                borderRadius: "6px",
                padding: "2px 8px",
                fontSize: "clamp(10px, 1vw, 13px)",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {mult.toFixed(2)}x
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. CENTRAL AREA
      ══════════════════════════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0D0B08",
          border: "1px solid rgba(212,168,67,0.12)",
          borderRadius: "10px",
          overflow: "hidden",
          minHeight: "clamp(140px, 25vh, 220px)",
        }}
      >
        {/* Stars background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/assets/games/crash/stars-bg.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.15,
            pointerEvents: "none",
          }}
        />

        {/* Frame canvas */}
        <img
          src="/assets/games/crash/frame-canvas.png"
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            opacity: 0.6,
          }}
        />

        {/* Countdown text */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontWeight: 700,
              fontSize: "clamp(16px, 2.5vw, 28px)",
              color: "#D4A843",
              textShadow: "0 0 20px rgba(212,168,67,0.5), 0 0 40px rgba(212,168,67,0.25)",
              letterSpacing: "1px",
            }}
          >
            {t.nextRound} {countdown}s
          </div>
          <div
            style={{
              marginTop: "8px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(12px, 1.2vw, 16px)",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            {t.placeBet}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          3. CONTROLS PANEL
      ══════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* ─────────────────────────────────────────────────────
            LEFT COLUMN: Bet Controls
        ───────────────────────────────────────────────────── */}
        <div
          style={{
            flex: "1 1 clamp(200px, 45%, 320px)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {/* BET INPUT */}
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "'Cinzel Decorative', serif",
                fontWeight: 600,
                fontSize: "10px",
                color: "#D4A843",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "6px",
              }}
            >
              {t.bet}
            </label>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
              style={{
                width: "100%",
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(212,168,67,0.25)",
                borderRadius: "8px",
                color: "#00E676",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "clamp(14px, 1.5vw, 20px)",
                padding: "8px 12px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          {/* SHORTCUT BUTTONS */}
          <div
            style={{
              display: "flex",
              gap: "6px",
            }}
          >
            {[
              { label: "MIN", action: handleMin },
              { label: "x2", action: handleDouble },
              { label: "/2", action: handleHalf },
              { label: "MAX", action: handleMax },
            ].map((btn) => (
              <motion.button
                key={btn.label}
                onClick={btn.action}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  flex: 1,
                  minHeight: "36px",
                  minWidth: "44px",
                  background: "rgba(212,168,67,0.08)",
                  border: "1px solid rgba(212,168,67,0.2)",
                  borderRadius: "6px",
                  color: "#D4A843",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: "clamp(9px, 1vw, 12px)",
                  cursor: "pointer",
                  transition: "background 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(212,168,67,0.15)";
                  e.currentTarget.style.borderColor = "rgba(212,168,67,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(212,168,67,0.08)";
                  e.currentTarget.style.borderColor = "rgba(212,168,67,0.2)";
                }}
              >
                {btn.label}
              </motion.button>
            ))}
          </div>

          {/* AUTO CASHOUT */}
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "'Cinzel Decorative', serif",
                fontWeight: 600,
                fontSize: "10px",
                color: "#D4A843",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "6px",
              }}
            >
              {t.cashoutAt}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={autoCashout}
                onChange={(e) => setAutoCashout(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(212,168,67,0.25)",
                  borderRadius: "8px",
                  color: "#D4A843",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "clamp(14px, 1.5vw, 20px)",
                  padding: "8px 36px 8px 12px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(212,168,67,0.6)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "clamp(12px, 1.2vw, 16px)",
                  pointerEvents: "none",
                }}
              >
                x
              </span>
            </div>
          </div>

          {/* MANUAL / AUTO TOGGLE */}
          <div
            style={{
              display: "flex",
              gap: "2px",
              background: "rgba(0,0,0,0.3)",
              borderRadius: "8px",
              padding: "4px",
            }}
          >
            {(["manual", "auto"] as const).map((m) => {
              const isActive = mode === m;
              const iconSrc =
                m === "manual"
                  ? "/assets/shared/icons/icon-manual.png"
                  : "/assets/shared/icons/icon-auto-bet.png";
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px 12px",
                    background: isActive ? "rgba(212,168,67,0.12)" : "transparent",
                    border: "none",
                    borderBottom: isActive ? "2px solid #D4A843" : "2px solid transparent",
                    borderRadius: "6px",
                    color: isActive ? "#D4A843" : "rgba(255,255,255,0.4)",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    fontSize: "clamp(10px, 1vw, 13px)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <img
                    src={iconSrc}
                    alt=""
                    style={{
                      width: "16px",
                      height: "16px",
                      opacity: isActive ? 1 : 0.5,
                    }}
                  />
                  {m === "manual" ? t.manual : t.auto}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────
            RIGHT COLUMN: Bets Feed
        ───────────────────────────────────────────────────── */}
        <div
          style={{
            flex: "1 1 clamp(180px, 40%, 280px)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontWeight: 600,
              fontSize: "10px",
              color: "#D4A843",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            {t.bets}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              maxHeight: "180px",
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(212,168,67,0.4) transparent",
            }}
          >
            {MOCK_BETS.map((bet, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "6px",
                  padding: "8px",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: "clamp(11px, 1.1vw, 14px)",
                    color: "rgba(255,255,255,0.7)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100px",
                  }}
                >
                  {truncateName(bet.name, 12)}
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: "clamp(11px, 1.1vw, 14px)",
                      color: "#00E676",
                    }}
                  >
                    {bet.amount.toLocaleString()} GC
                  </span>
                  <span
                    style={{
                      fontSize: "9px",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      background: "rgba(0,230,118,0.1)",
                      color: "#00E676",
                      borderRadius: "4px",
                      padding: "2px 6px",
                    }}
                  >
                    {t.betted}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          4. BET BUTTON
      ══════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: "4px",
        }}
      >
        <motion.button
          onClick={handleBet}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontWeight: 700,
            fontSize: "clamp(13px, 1.5vw, 18px)",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "#000",
            background: "linear-gradient(180deg, #00E676, #00C853)",
            border: "none",
            borderRadius: "10px",
            minHeight: "48px",
            width: "clamp(160px, 30vw, 260px)",
            cursor: "pointer",
            boxShadow:
              "0 4px 15px rgba(0,230,118,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          {t.betButton}
        </motion.button>
      </div>
    </div>
  );
}
