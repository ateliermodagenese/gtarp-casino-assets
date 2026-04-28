"use client";

// BlackjackInsurance.tsx — TELA 5: Modal de Seguro contra Blackjack do Dealer
// Overlay modal com timer SVG circular 10s, urgente vermelho pulsando <3s
// Botoes SIM (gradient verde) + NAO (ghost dourado)
// CSS inline, ZERO Tailwind, fontes Cinzel/Inter/JetBrains Mono

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// TIPOS
// ============================================================================

interface BlackjackInsuranceProps {
  onAccept: () => void;
  onDecline: () => void;
  betAmount: number;
  lang: "br" | "in";
}

// ============================================================================
// TEXTOS i18n
// ============================================================================

const TEXTS = {
  title: { br: "SEGURO?", in: "INSURANCE?" },
  explanation: {
    br: "O dealer mostra um As. Seguro paga 2:1 se o dealer tiver Blackjack.",
    in: "Dealer shows an Ace. Insurance pays 2:1 if dealer has Blackjack.",
  },
  cost: { br: "Custo:", in: "Cost:" },
  yes: { br: "SIM", in: "YES" },
  no: { br: "NAO", in: "NO" },
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function BlackjackInsurance({
  onAccept,
  onDecline,
  betAmount,
  lang,
}: BlackjackInsuranceProps) {
  const [timeLeft, setTimeLeft] = useState(10);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasDeclinedRef = useRef(false);

  // ========================================================================
  // TIMER COUNTDOWN
  // ========================================================================

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!hasDeclinedRef.current) {
            hasDeclinedRef.current = true;
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
  }, [onDecline]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleAccept = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onAccept();
  };

  const handleDecline = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    hasDeclinedRef.current = true;
    onDecline();
  };

  // ========================================================================
  // CALCULOS
  // ========================================================================

  const insuranceCost = Math.floor(betAmount / 2);
  const isUrgent = timeLeft < 3;
  const circumference = 2 * Math.PI * 20; // ~126
  const strokeOffset = circumference * (1 - timeLeft / 10);

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <AnimatePresence>
      {/* OVERLAY FUNDO */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 90,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* MODAL CENTRAL */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{
            background: "rgba(10,10,10,0.95)",
            border: "1.5px solid rgba(212,168,67,0.3)",
            borderRadius: 16,
            padding: "clamp(20px, 4vw, 40px)",
            minWidth: "clamp(260px, 45vw, 380px)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(212,168,67,0.05)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "clamp(12px, 2vw, 20px)",
          }}
        >
          {/* ICONE ESCUDO/? */}
          <div
            style={{
              width: "clamp(36px, 5vw, 48px)",
              height: "clamp(36px, 5vw, 48px)",
              borderRadius: "50%",
              background:
                "linear-gradient(180deg, rgba(212,168,67,0.25) 0%, rgba(212,168,67,0.1) 100%)",
              border: "1.5px solid rgba(212,168,67,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 12px rgba(212,168,67,0.15)",
            }}
          >
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: "clamp(16px, 2.5vw, 24px)",
                color: "#D4A843",
              }}
            >
              ?
            </span>
          </div>

          {/* TITULO */}
          <h2
            style={{
              margin: 0,
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: "clamp(18px, 3vw, 28px)",
              color: "#D4A843",
              textAlign: "center",
              letterSpacing: "2px",
            }}
          >
            {TEXTS.title[lang]}
          </h2>

          {/* EXPLICACAO */}
          <p
            style={{
              margin: 0,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(12px, 1.5vw, 14px)",
              color: "rgba(255,255,255,0.6)",
              textAlign: "center",
              lineHeight: 1.5,
              maxWidth: "90%",
            }}
          >
            {TEXTS.explanation[lang]}
          </p>

          {/* VALOR DO SEGURO */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "clamp(6px, 0.8vw, 10px)",
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                fontSize: "clamp(12px, 1.5vw, 14px)",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {TEXTS.cost[lang]}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: "clamp(14px, 2vw, 20px)",
                color: "#FFD700",
              }}
            >
              G${insuranceCost}
            </span>
          </div>

          {/* TIMER SVG CIRCULAR */}
          <div
            style={{
              width: 56,
              height: 56,
              margin: "clamp(8px, 1.5vw, 16px) auto",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              viewBox="0 0 48 48"
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            >
              {/* Circle background */}
              <circle
                cx={24}
                cy={24}
                r={20}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={3}
              />
              {/* Circle progress */}
              <circle
                cx={24}
                cy={24}
                r={20}
                fill="none"
                stroke={isUrgent ? "#FF3B3B" : "#D4A843"}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                style={{
                  transform: "rotate(-90deg)",
                  transformOrigin: "center",
                  transition: "stroke-dashoffset 1s linear, stroke 0.3s ease",
                }}
              />
            </svg>

            {/* Valor central */}
            <motion.span
              key={timeLeft}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: isUrgent ? [1, 0.4, 1] : 1,
              }}
              transition={{
                scale: { duration: 0.2 },
                opacity: isUrgent
                  ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.2 },
              }}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: 16,
                color: isUrgent ? "#FF3B3B" : "#D4A843",
                zIndex: 1,
              }}
            >
              {timeLeft}
            </motion.span>
          </div>

          {/* BOTOES */}
          <div
            style={{
              display: "flex",
              gap: "clamp(10px, 1.5vw, 16px)",
              width: "100%",
              justifyContent: "center",
            }}
          >
            {/* SIM / YES */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAccept}
              style={{
                flex: 1,
                maxWidth: 140,
                minHeight: 44,
                background: "linear-gradient(180deg, #00C853, #004D25)",
                border: "1.5px solid rgba(0,230,118,0.3)",
                borderRadius: 10,
                color: "#FFFFFF",
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: "clamp(12px, 1.5vw, 14px)",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(0,200,83,0.25)",
              }}
            >
              {TEXTS.yes[lang]}
            </motion.button>

            {/* NAO / NO */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDecline}
              style={{
                flex: 1,
                maxWidth: 140,
                minHeight: 44,
                background: "transparent",
                border: "1.5px solid rgba(212,168,67,0.3)",
                borderRadius: 10,
                color: "#D4A843",
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: "clamp(12px, 1.5vw, 14px)",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {TEXTS.no[lang]}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
