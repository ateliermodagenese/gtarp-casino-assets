"use client";

import { motion } from "framer-motion";
import type { CrashPhase } from "./CrashGame";
import { useCurrencyConfig } from "@/hooks/use-currency-config";

// ===========================================================================
// CRASH CONTROLS — Painel de Aposta e Cashout
// ===========================================================================

interface CrashControlsProps {
  phase: CrashPhase;
  betAmount: number;
  setBetAmount: (amount: number) => void;
  autoCashout: number | null;
  setAutoCashout: (value: number | null) => void;
  hasPlacedBet: boolean;
  hasCashedOut: boolean;
  multiplier: number;
  saldo: number;
  onPlaceBet: () => void;
  onCashout: () => void;
  lang: "br" | "in";
}

const COLORS = {
  gold: "#D4A843",
  goldLight: "#FFD700",
  green: "#00E676",
  red: "#FF4444",
  darkBg: "rgba(5,5,5,0.95)",
  inputBg: "rgba(15,15,15,0.9)",
};

const QUICK_BETS = [10, 50, 100, 500];
const QUICK_CASHOUTS = [1.5, 2, 3, 5, 10];

export function CrashControls({
  phase,
  betAmount,
  setBetAmount,
  autoCashout,
  setAutoCashout,
  hasPlacedBet,
  hasCashedOut,
  multiplier,
  saldo,
  onPlaceBet,
  onCashout,
  lang,
}: CrashControlsProps) {
  const { config: cc } = useCurrencyConfig();
  const canBet = phase === "BETTING" && !hasPlacedBet;
  const canCashout = phase === "RISING" && hasPlacedBet && !hasCashedOut;
  const potentialWin = betAmount * multiplier;

  return (
    <div
      style={{
        background: COLORS.darkBg,
        border: "1px solid rgba(212,168,67,0.3)",
        borderRadius: "12px",
        padding: "clamp(12px, 1.5vw, 20px)",
        display: "flex",
        flexDirection: "column",
        gap: "clamp(10px, 1.2vw, 16px)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* ================================================================
          VALOR DA APOSTA
          ================================================================ */}
      <div>
        <label
          style={{
            display: "block",
            fontFamily: "var(--font-cinzel)",
            fontSize: "clamp(10px, 1vw, 13px)",
            fontWeight: 600,
            color: "rgba(212,168,67,0.8)",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: "clamp(6px, 0.8vw, 10px)",
          }}
        >
          {lang === "br" ? "VALOR DA APOSTA" : "BET AMOUNT"}
        </label>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(6px, 0.8vw, 10px)",
            background: COLORS.inputBg,
            border: "1px solid rgba(212,168,67,0.25)",
            borderRadius: "8px",
            padding: "clamp(8px, 1vw, 12px)",
          }}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setBetAmount(Math.max(1, betAmount / 2))}
            disabled={!canBet}
            style={{
              width: "clamp(28px, 2.5vw, 36px)",
              height: "clamp(28px, 2.5vw, 36px)",
              borderRadius: "6px",
              background: "rgba(212,168,67,0.15)",
              border: "1px solid rgba(212,168,67,0.3)",
              color: COLORS.gold,
              fontFamily: "var(--font-mono)",
              fontSize: "clamp(12px, 1.2vw, 16px)",
              fontWeight: 700,
              cursor: canBet ? "pointer" : "not-allowed",
              opacity: canBet ? 1 : 0.5,
            }}
          >
            ½
          </motion.button>

          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, Math.min(saldo, Number(e.target.value))))}
            disabled={!canBet}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "var(--font-mono)",
              fontSize: "clamp(14px, 1.6vw, 20px)",
              fontWeight: 700,
              color: COLORS.green,
              textAlign: "center",
              opacity: canBet ? 1 : 0.6,
            }}
          />

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setBetAmount(Math.min(saldo, betAmount * 2))}
            disabled={!canBet}
            style={{
              width: "clamp(28px, 2.5vw, 36px)",
              height: "clamp(28px, 2.5vw, 36px)",
              borderRadius: "6px",
              background: "rgba(212,168,67,0.15)",
              border: "1px solid rgba(212,168,67,0.3)",
              color: COLORS.gold,
              fontFamily: "var(--font-mono)",
              fontSize: "clamp(12px, 1.2vw, 16px)",
              fontWeight: 700,
              cursor: canBet ? "pointer" : "not-allowed",
              opacity: canBet ? 1 : 0.5,
            }}
          >
            2×
          </motion.button>
        </div>

        {/* Quick bet buttons + MIN/MAX */}
        <div
          style={{
            display: "flex",
            gap: "clamp(4px, 0.5vw, 8px)",
            marginTop: "clamp(6px, 0.8vw, 10px)",
          }}
        >
          <motion.button
            whileHover={{ scale: 1.05, borderColor: "rgba(212,168,67,0.6)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setBetAmount(1)}
            disabled={!canBet}
            style={{
              flex: 1,
              padding: "clamp(4px, 0.6vw, 8px)",
              background: "transparent",
              border: "1px solid rgba(212,168,67,0.3)",
              borderRadius: "6px",
              fontFamily: "var(--font-cinzel)",
              fontSize: "clamp(8px, 0.8vw, 11px)",
              fontWeight: 700,
              color: COLORS.gold,
              cursor: canBet ? "pointer" : "not-allowed",
              opacity: canBet ? 1 : 0.5,
              letterSpacing: "0.5px",
            }}
          >
            MIN
          </motion.button>
          {QUICK_BETS.map((amount) => (
            <motion.button
              key={amount}
              whileHover={{ scale: 1.05, borderColor: "rgba(212,168,67,0.6)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBetAmount(Math.min(saldo, amount))}
              disabled={!canBet}
              style={{
                flex: 1,
                padding: "clamp(4px, 0.6vw, 8px)",
                background: betAmount === amount ? "rgba(212,168,67,0.2)" : "transparent",
                border: `1px solid ${betAmount === amount ? "rgba(212,168,67,0.5)" : "rgba(212,168,67,0.2)"}`,
                borderRadius: "6px",
                fontFamily: "var(--font-mono)",
                fontSize: "clamp(9px, 0.9vw, 12px)",
                fontWeight: 600,
                color: betAmount === amount ? COLORS.goldLight : "rgba(212,168,67,0.6)",
                cursor: canBet ? "pointer" : "not-allowed",
                opacity: canBet ? 1 : 0.5,
              }}
            >
              {amount}
            </motion.button>
          ))}
          <motion.button
            whileHover={{ scale: 1.05, borderColor: "rgba(212,168,67,0.6)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setBetAmount(Math.min(10000, saldo))}
            disabled={!canBet}
            style={{
              flex: 1,
              padding: "clamp(4px, 0.6vw, 8px)",
              background: "transparent",
              border: "1px solid rgba(212,168,67,0.3)",
              borderRadius: "6px",
              fontFamily: "var(--font-cinzel)",
              fontSize: "clamp(8px, 0.8vw, 11px)",
              fontWeight: 700,
              color: COLORS.gold,
              cursor: canBet ? "pointer" : "not-allowed",
              opacity: canBet ? 1 : 0.5,
              letterSpacing: "0.5px",
            }}
          >
            MAX
          </motion.button>
        </div>
      </div>

      {/* Legenda contextual */}
      <div style={{
        textAlign: "center", fontSize: "clamp(8px, 0.8vw, 10px)",
        fontFamily: "sans-serif", color: "rgba(255,255,255,0.35)",
        lineHeight: 1.4, minHeight: 14,
      }}>
        {phase === "RISING" && hasPlacedBet && !hasCashedOut
          ? (lang === "br"
            ? `Cashout agora: ${multiplier.toFixed(2)}x = ${potentialWin.toFixed(2)} ${cc.symbol}`
            : `Cash out now: ${multiplier.toFixed(2)}x = ${potentialWin.toFixed(2)} ${cc.symbol}`)
          : hasCashedOut
            ? (lang === "br" ? "Lucro garantido!" : "Profit secured!")
            : phase === "CRASHED"
              ? (lang === "br" ? "Rodada encerrada — aguarde a proxima" : "Round ended — wait for next")
              : (lang === "br" ? "Aposte e saia antes do crash para ganhar" : "Bet and cash out before crash to win")}
      </div>

      {/* ================================================================
          AUTO CASHOUT
          ================================================================ */}
      <div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "var(--font-cinzel)",
            fontSize: "clamp(10px, 1vw, 13px)",
            fontWeight: 600,
            color: "rgba(212,168,67,0.8)",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: "clamp(6px, 0.8vw, 10px)",
          }}
        >
          <span>{lang === "br" ? "AUTO CASHOUT" : "AUTO CASHOUT"}</span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setAutoCashout(autoCashout ? null : 2)}
            disabled={!canBet}
            style={{
              width: "clamp(36px, 3vw, 48px)",
              height: "clamp(20px, 1.8vw, 26px)",
              borderRadius: "13px",
              background: autoCashout 
                ? "linear-gradient(90deg, #00E676, #00C853)" 
                : "rgba(60,60,60,0.8)",
              border: "none",
              cursor: canBet ? "pointer" : "not-allowed",
              position: "relative",
              opacity: canBet ? 1 : 0.5,
            }}
          >
            <motion.div
              animate={{ x: autoCashout ? "calc(100% - 18px)" : "2px" }}
              style={{
                position: "absolute",
                top: "2px",
                width: "clamp(16px, 1.4vw, 22px)",
                height: "clamp(16px, 1.4vw, 22px)",
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            />
          </motion.button>
        </label>

        {autoCashout !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(6px, 0.8vw, 10px)",
                background: COLORS.inputBg,
                border: "1px solid rgba(0,230,118,0.25)",
                borderRadius: "8px",
                padding: "clamp(8px, 1vw, 12px)",
              }}
            >
              <input
                type="number"
                step="0.1"
                min="1.1"
                value={autoCashout}
                onChange={(e) => setAutoCashout(Math.max(1.1, Number(e.target.value)))}
                disabled={!canBet}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(14px, 1.6vw, 20px)",
                  fontWeight: 700,
                  color: COLORS.green,
                  textAlign: "center",
                  opacity: canBet ? 1 : 0.6,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(12px, 1.2vw, 16px)",
                  fontWeight: 600,
                  color: "rgba(212,168,67,0.6)",
                }}
              >
                ×
              </span>
            </div>

            {/* Quick cashout buttons */}
            <div
              style={{
                display: "flex",
                gap: "clamp(4px, 0.5vw, 8px)",
                marginTop: "clamp(6px, 0.8vw, 10px)",
              }}
            >
              {QUICK_CASHOUTS.map((mult) => (
                <motion.button
                  key={mult}
                  whileHover={{ scale: 1.05, borderColor: "rgba(0,230,118,0.6)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAutoCashout(mult)}
                  disabled={!canBet}
                  style={{
                    flex: 1,
                    padding: "clamp(4px, 0.6vw, 8px)",
                    background: autoCashout === mult ? "rgba(0,230,118,0.15)" : "transparent",
                    border: `1px solid ${autoCashout === mult ? "rgba(0,230,118,0.5)" : "rgba(0,230,118,0.2)"}`,
                    borderRadius: "6px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "clamp(9px, 0.9vw, 12px)",
                    fontWeight: 600,
                    color: autoCashout === mult ? COLORS.green : "rgba(0,230,118,0.6)",
                    cursor: canBet ? "pointer" : "not-allowed",
                    opacity: canBet ? 1 : 0.5,
                  }}
                >
                  {mult}×
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ================================================================
          BOTAO PRINCIPAL — APOSTAR / CASHOUT
          ================================================================ */}
      {canCashout ? (
        <motion.button
          onClick={onCashout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          animate={{
            boxShadow: [
              "0 0 20px rgba(255,68,68,0.4)",
              "0 0 40px rgba(255,68,68,0.6)",
              "0 0 20px rgba(255,68,68,0.4)",
            ],
          }}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{
            width: "100%",
            padding: "clamp(14px, 2vw, 24px)",
            background: "linear-gradient(180deg, #FF5555 0%, #CC3333 100%)",
            border: "2px solid rgba(255,100,100,0.6)",
            borderRadius: "12px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "clamp(4px, 0.5vw, 8px)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-cinzel)",
              fontSize: "clamp(14px, 1.6vw, 20px)",
              fontWeight: 800,
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "2px",
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            {lang === "br" ? "SACAR" : "CASHOUT"}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "clamp(12px, 1.4vw, 18px)",
              fontWeight: 700,
              color: "#FFD700",
              textShadow: "0 0 10px rgba(255,215,0,0.5)",
            }}
          >
            {potentialWin.toFixed(2)} {cc.symbol}
          </span>
        </motion.button>
      ) : (
        <motion.button
          onClick={onPlaceBet}
          whileHover={canBet ? { scale: 1.02, boxShadow: "0 0 30px rgba(0,230,118,0.5)" } : {}}
          whileTap={canBet ? { scale: 0.98 } : {}}
          disabled={!canBet || betAmount > saldo}
          style={{
            width: "100%",
            padding: "clamp(14px, 2vw, 24px)",
            background: canBet && betAmount <= saldo
              ? "linear-gradient(180deg, #00E676 0%, #00C853 100%)"
              : hasPlacedBet && !hasCashedOut
                ? "linear-gradient(180deg, #555 0%, #333 100%)"
                : "linear-gradient(180deg, #444 0%, #222 100%)",
            border: canBet && betAmount <= saldo
              ? "2px solid rgba(0,230,118,0.6)"
              : "2px solid rgba(100,100,100,0.3)",
            borderRadius: "12px",
            cursor: canBet && betAmount <= saldo ? "pointer" : "not-allowed",
            boxShadow: canBet && betAmount <= saldo
              ? "0 0 20px rgba(0,230,118,0.3)"
              : "none",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-cinzel)",
              fontSize: "clamp(14px, 1.6vw, 20px)",
              fontWeight: 800,
              color: canBet && betAmount <= saldo ? "#0A0A0A" : "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            {hasPlacedBet 
              ? (hasCashedOut 
                  ? (lang === "br" ? "SACOU!" : "CASHED OUT!") 
                  : (lang === "br" ? "AGUARDANDO..." : "WAITING..."))
              : (betAmount > saldo 
                  ? (lang === "br" ? "SALDO INSUFICIENTE" : "INSUFFICIENT BALANCE")
                  : (lang === "br" ? "APOSTAR" : "BET"))
            }
          </span>
        </motion.button>
      )}

      {/* Info do round atual */}
      {hasPlacedBet && !hasCashedOut && phase === "RISING" && (
        <div
          style={{
            textAlign: "center",
            padding: "clamp(8px, 1vw, 12px)",
            background: "rgba(0,230,118,0.1)",
            border: "1px solid rgba(0,230,118,0.2)",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-cinzel)",
              fontSize: "clamp(9px, 0.9vw, 11px)",
              color: "rgba(0,230,118,0.7)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "4px",
            }}
          >
            {lang === "br" ? "GANHO POTENCIAL" : "POTENTIAL WIN"}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "clamp(16px, 2vw, 24px)",
              fontWeight: 700,
              color: COLORS.green,
              textShadow: "0 0 15px rgba(0,230,118,0.6)",
            }}
          >
            {potentialWin.toFixed(2)} {cc.symbol}
          </div>
        </div>
      )}
    </div>
  );
}
