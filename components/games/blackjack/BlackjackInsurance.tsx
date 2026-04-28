"use client";

// Blackjack Tela 3 — INSURANCE MODAL (Seguro contra Blackjack do Dealer)
// Overlay modal com timer SVG circular 10s (urgente vermelho pulsando <3s)
// Botoes SIM (gradient verde) + NAO (ghost dourado)

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ASSETS, COLORS, TEXTS, t, RULES } from "./BlackjackConstants";
import type { Lang } from "./BlackjackTypes";

// ============================================================================
// PROPS
// ============================================================================

export interface BlackjackInsuranceProps {
  lang: Lang;
  /** Aposta atual do jogador (seguro = metade disso) */
  betAmount: number;
  /** Callback ao clicar SIM */
  onAccept: () => void;
  /** Callback ao clicar NAO ou timer zerar */
  onDecline: () => void;
  /** Tempo inicial do timer (default: 10s) */
  initialTime?: number;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export default function BlackjackInsurance({
  lang,
  betAmount,
  onAccept,
  onDecline,
  initialTime = RULES.insuranceTimerSeconds,
}: BlackjackInsuranceProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const declinedRef = useRef(false);

  // ==========================================================================
  // TIMER COUNTDOWN
  // ==========================================================================

  useEffect(() => {
    setTimeLeft(initialTime);
    declinedRef.current = false;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!declinedRef.current) {
            declinedRef.current = true;
            onDecline();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTime]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleAccept = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onAccept();
  };

  const handleDecline = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    declinedRef.current = true;
    onDecline();
  };

  // ==========================================================================
  // CALCULOS
  // ==========================================================================

  const insuranceCost = Math.floor(betAmount / 2);
  const isUrgent = timeLeft <= 3;
  const circumference = 2 * Math.PI * 34; // raio 34 = circumferencia ~213.6

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(16px, 2vw, 32px)",
        }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{
            position: "relative",
            width: "clamp(320px, 50vw, 520px)",
            padding: "clamp(24px, 3vw, 40px) clamp(20px, 2.5vw, 36px)",
            background:
              "linear-gradient(180deg, rgba(20,16,8,0.98) 0%, rgba(10,8,4,0.96) 50%, rgba(20,16,8,0.98) 100%)",
            backgroundImage:
              "radial-gradient(ellipse at 50% 0%, rgba(212,168,67,0.08) 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(212,168,67,0.04) 0%, transparent 60%)",
            border: "1px solid rgba(212,168,67,0.5)",
            borderRadius: 8,
            boxShadow:
              "inset 0 0 0 1px rgba(212,168,67,0.15), inset 0 0 40px rgba(0,0,0,0.6), 0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(212,168,67,0.15)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "clamp(16px, 2vw, 24px)",
          }}
        >
          {/* Moldura interna */}
          <div
            style={{
              position: "absolute",
              top: "clamp(8px, 1vw, 12px)",
              bottom: "clamp(8px, 1vw, 12px)",
              left: "clamp(8px, 1vw, 12px)",
              right: "clamp(8px, 1vw, 12px)",
              border: "1px solid rgba(212,168,67,0.2)",
              borderRadius: 4,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* 1. BADGE "DEALER MOSTRA AS" */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              gap: "clamp(8px, 1vw, 12px)",
              padding: "clamp(6px, 0.8vw, 10px) clamp(14px, 1.8vw, 20px)",
              background: "rgba(212,168,67,0.1)",
              border: "1px solid rgba(212,168,67,0.3)",
              borderRadius: 20,
            }}
          >
            <img
              src={ASSETS.iconInsurance}
              alt=""
              style={{
                width: "clamp(18px, 2vw, 24px)",
                height: "clamp(18px, 2vw, 24px)",
              }}
              draggable={false}
            />
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: "clamp(9px, 1vw, 11px)",
                color: COLORS.goldPrimary,
                letterSpacing: "3px",
                textTransform: "uppercase",
              }}
            >
              {t(TEXTS.insuranceBadge, lang)}
            </span>
          </div>

          {/* 2. TITULO "SEGURO?" */}
          <h2
            style={{
              position: "relative",
              zIndex: 1,
              margin: 0,
              fontFamily: "'Cinzel', serif",
              fontWeight: 800,
              fontSize: "clamp(24px, 3.5vw, 42px)",
              color: COLORS.goldLight,
              letterSpacing: "4px",
              textTransform: "uppercase",
              textShadow:
                "0 0 20px rgba(255,215,0,0.5), 0 0 40px rgba(212,168,67,0.3), 0 2px 4px rgba(0,0,0,0.8)",
              textAlign: "center",
            }}
          >
            {t(TEXTS.insuranceTitle, lang)}
          </h2>

          {/* 3. TEXTO EXPLICATIVO */}
          <p
            style={{
              position: "relative",
              zIndex: 1,
              margin: 0,
              maxWidth: "90%",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(12px, 1.3vw, 15px)",
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.5,
              textAlign: "center",
            }}
          >
            {t(TEXTS.insuranceText, lang)}
          </p>

          {/* 4. SEPARADOR COM DIAMANTE */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: "70%",
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(212,168,67,0.4), transparent)",
              margin: "clamp(4px, 0.5vw, 8px) 0",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -3,
                left: "50%",
                transform: "translateX(-50%) rotate(45deg)",
                width: 6,
                height: 6,
                background: COLORS.goldPrimary,
                boxShadow: "0 0 8px rgba(212,168,67,0.6)",
              }}
            />
          </div>

          {/* 5. VALOR DO SEGURO */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(4px, 0.5vw, 6px)",
            }}
          >
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                fontSize: "clamp(9px, 1vw, 11px)",
                color: "rgba(212,168,67,0.6)",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              {t(TEXTS.insuranceCost, lang)}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 800,
                fontSize: "clamp(22px, 2.8vw, 36px)",
                color: COLORS.greenNeon,
                textShadow:
                  "0 0 16px rgba(0,230,118,0.6), 0 1px 2px rgba(0,0,0,0.8)",
                letterSpacing: "1px",
                lineHeight: 1,
              }}
            >
              <span style={{ fontSize: "0.55em", opacity: 0.75 }}>G$</span>
              {insuranceCost}
            </span>
          </div>

          {/* 6. TIMER SVG CIRCULAR */}
          <CircularTimer
            timeLeft={timeLeft}
            initialTime={initialTime}
            isUrgent={isUrgent}
            circumference={circumference}
          />

          {/* 7. BOTOES SIM / NAO */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              gap: "clamp(12px, 1.5vw, 20px)",
              marginTop: "clamp(8px, 1vw, 12px)",
            }}
          >
            {/* BOTAO SIM */}
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAccept}
              style={{
                padding: "clamp(12px, 1.5vw, 16px) clamp(24px, 3vw, 40px)",
                background:
                  "linear-gradient(180deg, #00E676 0%, #00C853 50%, #004D25 100%)",
                border: "1.5px solid rgba(0,230,118,0.5)",
                borderRadius: 8,
                color: "#FFFFFF",
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: "clamp(12px, 1.3vw, 15px)",
                letterSpacing: "3px",
                textTransform: "uppercase",
                cursor: "pointer",
                minHeight: 48,
                minWidth: "clamp(100px, 12vw, 140px)",
                boxShadow:
                  "0 4px 12px rgba(0,200,83,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                textShadow: "0 1px 2px rgba(0,0,0,0.6)",
              }}
            >
              {t(TEXTS.yes, lang)}
            </motion.button>

            {/* BOTAO NAO (ghost dourado) */}
            <motion.button
              whileHover={{ y: -2, borderColor: "rgba(212,168,67,0.7)" }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDecline}
              style={{
                padding: "clamp(12px, 1.5vw, 16px) clamp(24px, 3vw, 40px)",
                background: "transparent",
                border: "1.5px solid rgba(212,168,67,0.4)",
                borderRadius: 8,
                color: COLORS.goldPrimary,
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: "clamp(12px, 1.3vw, 15px)",
                letterSpacing: "3px",
                textTransform: "uppercase",
                cursor: "pointer",
                minHeight: 48,
                minWidth: "clamp(100px, 12vw, 140px)",
                textShadow: "0 0 8px rgba(212,168,67,0.3)",
              }}
            >
              {t(TEXTS.no, lang)}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// SUBCOMPONENTE: CIRCULAR TIMER (SVG)
// ============================================================================

interface CircularTimerProps {
  timeLeft: number;
  initialTime: number;
  isUrgent: boolean;
  circumference: number;
}

function CircularTimer({
  timeLeft,
  initialTime,
  isUrgent,
  circumference,
}: CircularTimerProps) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        width: "clamp(70px, 8vw, 90px)",
        height: "clamp(70px, 8vw, 90px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 80 80"
        style={{
          transform: "rotate(-90deg)",
          animation: isUrgent
            ? "bjInsuranceUrgent 0.5s ease infinite"
            : "none",
        }}
      >
        {/* Circle fundo */}
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="4"
        />
        {/* Circle progresso */}
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke={isUrgent ? COLORS.redSoft : COLORS.goldPrimary}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - timeLeft / initialTime)}
          style={{
            transition: "stroke-dashoffset 1s linear, stroke 0.3s ease",
            filter: isUrgent
              ? "drop-shadow(0 0 8px rgba(255,59,59,0.8))"
              : "drop-shadow(0 0 8px rgba(212,168,67,0.5))",
          }}
        />
      </svg>

      {/* Contador central */}
      <span
        style={{
          position: "absolute",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 800,
          fontSize: "clamp(18px, 2.2vw, 26px)",
          color: isUrgent ? COLORS.redSoft : COLORS.white,
          textShadow: isUrgent
            ? "0 0 10px rgba(255,59,59,0.8)"
            : "0 1px 2px rgba(0,0,0,0.8)",
          transition: "color 0.3s ease",
        }}
      >
        {timeLeft}
      </span>
    </div>
  );
}
