"use client";

// Blackjack Card Component — Blackout Casino GTARP
// Card com flip 3D real (perspective + rotateY + backfaceVisibility)
// HandTotalBadge com 6 estados de cor
// DotPulse indicador de mao ativa
//
// Exportado:
//   - BlackjackCard (carta individual)
//   - HandTotalBadge (badge do total da mao)
//   - DotPulse (indicador visual)

import { motion } from "framer-motion";
import { ASSETS, getSuitSymbol, getSuitColor, COLORS } from "./BlackjackConstants";
import type { Rank, Suit } from "./BlackjackTypes";

// ============================================================================
// BLACKJACK CARD
// ============================================================================

export interface BlackjackCardProps {
  rank: Rank;
  suit: Suit;
  faceUp?: boolean;
  /** Indice da carta na mao, usado para stagger da animacao de entrada */
  index?: number;
  /** Se deve animar entrada do shoe */
  animate?: boolean;
}

export function BlackjackCard({
  rank,
  suit,
  faceUp = true,
  index = 0,
  animate = true,
}: BlackjackCardProps) {
  const symbol = getSuitSymbol(suit);
  const suitColor = getSuitColor(suit);

  // Mapeamento suit code → nome para path dos PNGs
  const SUIT_NAME: Record<Suit, string> = { H: "hearts", D: "diamonds", S: "spades", C: "clubs" };
  const cardImagePath = `/assets/games/blackjack/cards/card-${SUIT_NAME[suit]}-${rank}.png`;

  const cardW = "clamp(56px, 7vw, 84px)";
  const cardH = "clamp(78px, 10vw, 118px)";
  const radius = "clamp(6px, 0.8vw, 10px)";

  const entryProps = animate
    ? {
        initial: { x: 300, y: -150, opacity: 0 },
        animate: { x: 0, y: 0, opacity: 1 },
        transition: {
          type: "spring" as const,
          stiffness: 200,
          damping: 25,
          delay: index * 0.2,
        },
      }
    : {};

  return (
    <motion.div
      {...entryProps}
      style={{
        position: "relative",
        width: cardW,
        height: cardH,
        perspective: "1000px",
        flexShrink: 0,
      }}
    >
      <motion.div
        initial={{ rotateY: 180 }}
        animate={{ rotateY: faceUp ? 0 : 180 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
        }}
      >
        {/* FACE FRONTAL — PNG da carta com fallback CSS */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            background:
              "linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)",
            border: "1px solid rgba(0,0,0,0.15)",
            boxShadow:
              "0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.8)",
            overflow: "hidden",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {/* Imagem PNG da carta (cobre toda a face) */}
          <img
            src={cardImagePath}
            alt={`${rank}${symbol}`}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            onError={(e) => {
              // Fallback: esconde a imagem se PNG nao existir, mostra CSS abaixo
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />

          {/* Fallback CSS (visivel se PNG falhar ou enquanto carrega) */}
          {/* Rank TOP-LEFT */}
          <div
            style={{
              position: "absolute",
              top: "clamp(4px, 0.6vw, 8px)",
              left: "clamp(4px, 0.6vw, 8px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              lineHeight: 1,
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(14px, 1.8vw, 22px)",
                color: suitColor,
              }}
            >
              {rank}
            </span>
            <span
              style={{
                fontSize: "clamp(10px, 1.2vw, 16px)",
                color: suitColor,
                marginTop: -2,
              }}
            >
              {symbol}
            </span>
          </div>

          {/* Naipe CENTRAL grande */}
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "clamp(28px, 4vw, 48px)",
              color: suitColor,
              opacity: 0.9,
              pointerEvents: "none",
            }}
          >
            {symbol}
          </span>

          {/* Rank BOTTOM-RIGHT (rotacionado 180 graus) */}
          <div
            style={{
              position: "absolute",
              bottom: "clamp(4px, 0.6vw, 8px)",
              right: "clamp(4px, 0.6vw, 8px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              lineHeight: 1,
              transform: "rotate(180deg)",
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(14px, 1.8vw, 22px)",
                color: suitColor,
              }}
            >
              {rank}
            </span>
            <span
              style={{
                fontSize: "clamp(10px, 1.2vw, 16px)",
                color: suitColor,
                marginTop: -2,
              }}
            >
              {symbol}
            </span>
          </div>
        </div>

        {/* FACE VERSO — card-back.png (SEMPRE renderizada, rotateY 180 + backfaceVisibility) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            boxShadow:
              "0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,168,67,0.3)",
            overflow: "hidden",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <img
            src={ASSETS.cardBack}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// HAND TOTAL BADGE — 6 estados de cor
// ============================================================================

export interface HandTotalBadgeProps {
  total: number;
  /** Mao eh soft (contem As valendo 11) */
  isSoft?: boolean;
  /** Mao estourou (> 21) */
  isBust?: boolean;
  /** Eh badge do dealer (neutro, so mostra carta visivel) */
  isDealer?: boolean;
  /** Valor alternativo da mao soft (ex: soft 17 mostra "7/17") */
  softAlt?: number;
}

export function HandTotalBadge({
  total,
  isSoft,
  isBust,
  isDealer,
  softAlt,
}: HandTotalBadgeProps) {
  let color: string = COLORS.textMuted;
  let textShadow = "none";
  let animation: string | undefined;
  let displayText = String(total);

  if (isBust) {
    color = COLORS.redBust;
    textShadow = "0 0 10px rgba(255,23,68,0.6)";
  } else if (total === 21) {
    color = COLORS.goldLight;
    textShadow =
      "0 0 12px rgba(255,215,0,0.6), 0 0 24px rgba(255,215,0,0.3)";
    animation = "bjTotalGlow 1.5s ease-in-out infinite";
  } else if (isDealer) {
    color = COLORS.textMuted;
  } else if (isSoft && softAlt !== undefined) {
    color = COLORS.blueDouble;
    textShadow = "0 0 8px rgba(68,138,255,0.4)";
    displayText = `${softAlt}/${total}`;
  } else if (total >= 17 && total <= 20) {
    color = COLORS.greenNeon;
    textShadow = "0 0 10px rgba(0,230,118,0.5)";
  }

  return (
    <motion.div
      key={total}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      style={{
        padding: "clamp(3px, 0.4vw, 5px) clamp(10px, 1.2vw, 16px)",
        background: "rgba(0,0,0,0.7)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.1)",
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        fontSize: "clamp(12px, 1.4vw, 17px)",
        letterSpacing: 1,
        color,
        textShadow,
        animation: animation || "none",
        display: "inline-block",
      }}
    >
      {displayText}
    </motion.div>
  );
}

// ============================================================================
// DOT PULSE — indicador visual de mao ativa
// ============================================================================

export function DotPulse() {
  return (
    <motion.div
      animate={{ y: [0, -3, 0] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: COLORS.greenNeon,
        boxShadow:
          "0 0 10px rgba(0,230,118,0.8), 0 0 20px rgba(0,230,118,0.4)",
        marginTop: "clamp(4px, 0.5vw, 6px)",
      }}
    />
  );
}
