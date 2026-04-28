"use client";

import { useState } from "react";
import { motion } from "framer-motion";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
export interface AutoBetConfig {
  rounds: number;
  betAmount: number;
  autoCashout: number;
  onWin: "keep" | "increase25" | "increase50" | "double";
  onLoss: "keep" | "increase25" | "increase50" | "double";
  stopProfit: number | null;
  stopLoss: number | null;
}

interface CrashAutoBetProps {
  onStart: (config: AutoBetConfig) => void;
  onStop: () => void;
  isRunning: boolean;
  currentRound?: number;
  totalRounds?: number;
  currentProfit?: number;
  balance: number;
  minBet?: number;
  maxBet?: number;
  lang: "br" | "en";
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const TEXTS = {
  br: {
    rounds: "ROUNDS",
    bet: "APOSTA",
    cashoutAt: "SACAR EM",
    afterWin: "APOS VITORIA",
    afterLoss: "APOS DERROTA",
    stopProfit: "PARAR SE LUCRO >=",
    stopLoss: "PARAR SE PERDA >=",
    noLimit: "Sem limite",
    startAuto: "INICIAR AUTO",
    stopAuto: "PARAR",
    autoLabel: "AUTO",
    roundLabel: "Round",
    profitLabel: "Lucro",
    optionKeep: "Manter aposta",
    optionIncrease25: "Aumentar 25%",
    optionIncrease50: "Aumentar 50%",
    optionDouble: "Dobrar",
  },
  en: {
    rounds: "ROUNDS",
    bet: "BET",
    cashoutAt: "CASHOUT AT",
    afterWin: "AFTER WIN",
    afterLoss: "AFTER LOSS",
    stopProfit: "STOP IF PROFIT >=",
    stopLoss: "STOP IF LOSS >=",
    noLimit: "No limit",
    startAuto: "START AUTO",
    stopAuto: "STOP",
    autoLabel: "AUTO",
    roundLabel: "Round",
    profitLabel: "Profit",
    optionKeep: "Keep bet",
    optionIncrease25: "Increase 25%",
    optionIncrease50: "Increase 50%",
    optionDouble: "Double",
  },
};

/* ─────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────── */
const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'Cinzel Decorative', serif",
  fontWeight: 600,
  fontSize: "10px",
  color: "#D4A843",
  textTransform: "uppercase",
  letterSpacing: "1px",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,0.5)",
  border: "1px solid rgba(212,168,67,0.25)",
  borderRadius: "8px",
  color: "#00E676",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "clamp(14px, 1.5vw, 20px)",
  padding: "8px 12px",
  boxSizing: "border-box" as const,
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,0.6)",
  border: "1px solid rgba(212,168,67,0.25)",
  borderRadius: "8px",
  color: "#D4A843",
  fontFamily: "'Inter', sans-serif",
  fontWeight: 600,
  fontSize: "clamp(10px, 1.1vw, 14px)",
  padding: "clamp(6px, 0.8vw, 10px)",
  minHeight: "44px",
  boxSizing: "border-box" as const,
  outline: "none",
  appearance: "none" as const,
  cursor: "pointer",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23D4A843' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: "36px",
};

const inputWithSuffixStyle: React.CSSProperties = {
  ...inputStyle,
  paddingRight: "40px",
};

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */
export default function CrashAutoBet({
  onStart,
  onStop,
  isRunning,
  currentRound = 0,
  totalRounds = 0,
  currentProfit = 0,
  balance,
  minBet = 10,
  maxBet = 10000,
  lang,
}: CrashAutoBetProps) {
  const t = TEXTS[lang];

  const [rounds, setRounds] = useState<number>(10);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [autoCashout, setAutoCashout] = useState<string>("2.00");
  const [onWin, setOnWin] = useState<AutoBetConfig["onWin"]>("keep");
  const [onLoss, setOnLoss] = useState<AutoBetConfig["onLoss"]>("keep");
  const [stopProfit, setStopProfit] = useState<string>("");
  const [stopLoss, setStopLoss] = useState<string>("");

  /* ─────────────────────────────────────────────────────────
     Handlers
  ───────────────────────────────────────────────────────── */
  const handleMin = () => setBetAmount(minBet);
  const handleMax = () => setBetAmount(Math.min(maxBet, balance));
  const handleDouble = () =>
    setBetAmount((prev) => Math.min(prev * 2, maxBet, balance));
  const handleHalf = () =>
    setBetAmount((prev) => Math.max(Math.floor(prev / 2), minBet));

  const handleStart = () => {
    const config: AutoBetConfig = {
      rounds,
      betAmount,
      autoCashout: parseFloat(autoCashout) || 2,
      onWin,
      onLoss,
      stopProfit: stopProfit ? parseFloat(stopProfit) : null,
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
    };
    onStart(config);
  };

  const formatProfit = (value: number) => {
    const prefix = value >= 0 ? "+" : "";
    return `${prefix}${value.toLocaleString()} GC`;
  };

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "clamp(10px, 1.5vw, 14px)",
        padding: "clamp(10px, 1.5vw, 16px)",
        boxSizing: "border-box",
      }}
    >
      {/* ══════════════════════════════════════════════════════════
          AUTO RUNNING INDICATOR
      ══════════════════════════════════════════════════════════ */}
      {isRunning && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(212,168,67,0.08)",
            border: "1px solid rgba(212,168,67,0.15)",
            borderRadius: "6px",
            padding: "clamp(8px, 1vw, 12px)",
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              fontSize: "clamp(9px, 1vw, 12px)",
              color: "#D4A843",
            }}
          >
            {t.autoLabel}: {t.roundLabel} {currentRound}/{totalRounds} | {t.profitLabel}:{" "}
            <span
              style={{
                color: currentProfit >= 0 ? "#00E676" : "#FF4444",
              }}
            >
              {formatProfit(currentProfit)}
            </span>
          </span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          1. ROUNDS FIELD
      ══════════════════════════════════════════════════════════ */}
      <div>
        <label style={labelStyle}>{t.rounds}</label>
        <input
          type="number"
          min={1}
          max={100}
          step={1}
          value={rounds}
          onChange={(e) => setRounds(Math.max(1, Math.min(100, Number(e.target.value))))}
          disabled={isRunning}
          style={{
            ...inputStyle,
            opacity: isRunning ? 0.5 : 1,
            cursor: isRunning ? "not-allowed" : "text",
          }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. BET AMOUNT FIELD
      ══════════════════════════════════════════════════════════ */}
      <div>
        <label style={labelStyle}>{t.bet}</label>
        <input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
          disabled={isRunning}
          style={{
            ...inputStyle,
            opacity: isRunning ? 0.5 : 1,
            cursor: isRunning ? "not-allowed" : "text",
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
            disabled={isRunning}
            whileHover={!isRunning ? { scale: 1.05 } : {}}
            whileTap={!isRunning ? { scale: 0.95 } : {}}
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
              cursor: isRunning ? "not-allowed" : "pointer",
              opacity: isRunning ? 0.5 : 1,
              transition: "background 0.2s, border-color 0.2s",
            }}
          >
            {btn.label}
          </motion.button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          3. AUTO CASHOUT FIELD
      ══════════════════════════════════════════════════════════ */}
      <div>
        <label style={labelStyle}>{t.cashoutAt}</label>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={autoCashout}
            onChange={(e) => setAutoCashout(e.target.value)}
            disabled={isRunning}
            style={{
              ...inputWithSuffixStyle,
              color: "#D4A843",
              opacity: isRunning ? 0.5 : 1,
              cursor: isRunning ? "not-allowed" : "text",
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

      {/* ══════════════════════════════════════════════════════════
          4. AFTER WIN SELECT
      ══════════════════════════════════════════════════════════ */}
      <div>
        <label style={labelStyle}>{t.afterWin}</label>
        <select
          value={onWin}
          onChange={(e) => setOnWin(e.target.value as AutoBetConfig["onWin"])}
          disabled={isRunning}
          style={{
            ...selectStyle,
            opacity: isRunning ? 0.5 : 1,
            cursor: isRunning ? "not-allowed" : "pointer",
          }}
        >
          <option value="keep">{t.optionKeep}</option>
          <option value="increase25">{t.optionIncrease25}</option>
          <option value="increase50">{t.optionIncrease50}</option>
          <option value="double">{t.optionDouble}</option>
        </select>
      </div>

      {/* ══════════════════════════════════════════════════════════
          5. AFTER LOSS SELECT
      ══════════════════════════════════════════════════════════ */}
      <div>
        <label style={labelStyle}>{t.afterLoss}</label>
        <select
          value={onLoss}
          onChange={(e) => setOnLoss(e.target.value as AutoBetConfig["onLoss"])}
          disabled={isRunning}
          style={{
            ...selectStyle,
            opacity: isRunning ? 0.5 : 1,
            cursor: isRunning ? "not-allowed" : "pointer",
          }}
        >
          <option value="keep">{t.optionKeep}</option>
          <option value="increase25">{t.optionIncrease25}</option>
          <option value="increase50">{t.optionIncrease50}</option>
          <option value="double">{t.optionDouble}</option>
        </select>
      </div>

      {/* ══════════════════════════════════════════════════════════
          6. STOP IF PROFIT FIELD
      ══════════════════════════════════════════════════════════ */}
      <div>
        <label style={labelStyle}>{t.stopProfit}</label>
        <div style={{ position: "relative" }}>
          <input
            type="number"
            value={stopProfit}
            onChange={(e) => setStopProfit(e.target.value)}
            placeholder={t.noLimit}
            disabled={isRunning}
            style={{
              ...inputWithSuffixStyle,
              color: "#00E676",
              opacity: isRunning ? 0.5 : 1,
              cursor: isRunning ? "not-allowed" : "text",
            }}
          />
          <span
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.3)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "clamp(10px, 1vw, 12px)",
              pointerEvents: "none",
            }}
          >
            GC
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          7. STOP IF LOSS FIELD
      ══════════════════════════════════════════════════════════ */}
      <div>
        <label style={labelStyle}>{t.stopLoss}</label>
        <div style={{ position: "relative" }}>
          <input
            type="number"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder={t.noLimit}
            disabled={isRunning}
            style={{
              ...inputWithSuffixStyle,
              color: "#FF4444",
              opacity: isRunning ? 0.5 : 1,
              cursor: isRunning ? "not-allowed" : "text",
            }}
          />
          <span
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.3)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "clamp(10px, 1vw, 12px)",
              pointerEvents: "none",
            }}
          >
            GC
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          8. START/STOP BUTTON
      ══════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: "8px",
        }}
      >
        {isRunning ? (
          <motion.button
            onClick={onStop}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontFamily: "'Cinzel Decorative', serif",
              fontWeight: 700,
              fontSize: "clamp(13px, 1.5vw, 18px)",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#FFFFFF",
              background: "linear-gradient(180deg, #FF6B6B, #FF4444)",
              border: "1px solid rgba(255,68,68,0.3)",
              borderRadius: "10px",
              minHeight: "48px",
              width: "clamp(160px, 30vw, 260px)",
              cursor: "pointer",
              boxShadow:
                "0 4px 15px rgba(255,68,68,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            {t.stopAuto}
          </motion.button>
        ) : (
          <motion.button
            onClick={handleStart}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
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
            <img
              src="/assets/shared/icons/icon-auto-bet.png"
              alt=""
              style={{
                width: "20px",
                height: "20px",
                filter: "brightness(0)",
              }}
            />
            {t.startAuto}
          </motion.button>
        )}
      </div>
    </div>
  );
}
