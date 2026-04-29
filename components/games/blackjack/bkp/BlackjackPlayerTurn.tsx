"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// TYPES (compativel com BlackjackTypes.ts do projeto)
// ============================================================================

interface Card {
  suit?: "spades" | "hearts" | "diamonds" | "clubs" | "H" | "D" | "S" | "C";
  rank?: string;
  faceUp?: boolean;
}

interface SideBetResult {
  won: boolean;
  payout?: string;
}

interface HandData {
  cards: Card[];
  total: number;
  isSoft: boolean;
  isBust: boolean;
  isBlackjack: boolean;
  bet: number;
  isDoubled?: boolean;
  isFromSplit?: boolean;
  isStanding?: boolean;
  isActive?: boolean;
}

type ActionType = "HIT" | "STAND" | "DOUBLE" | "SPLIT" | "SURRENDER";

interface BlackjackPlayerTurnProps {
  lang?: "br" | "in" | "en";
  playerHand?: HandData;
  dealerHand?: HandData;
  dealerVisibleTotal?: number;
  mainBet?: number;
  sideBetPP?: { amount: number; result: string | null; payout: number } | null;
  sideBet21?: { amount: number; result: string | null; payout: number } | null;
  availableActions?: ActionType[];
  onAction?: (action: ActionType) => void;
  onHit?: () => void;
  onStand?: () => void;
  onDouble?: () => void;
  onSplit?: () => void;
  onSurrender?: () => void;
}

// ============================================================================
// LABELS
// ============================================================================

const LABELS = {
  br: {
    dealer: "DEALER",
    player: "JOGADOR",
    hit: "HIT",
    stand: "STAND",
    double: "DOUBLE",
    split: "SPLIT",
    surrender: "SURRENDER",
  },
  in: {
    dealer: "DEALER",
    player: "PLAYER",
    hit: "HIT",
    stand: "STAND",
    double: "DOUBLE",
    split: "SPLIT",
    surrender: "SURRENDER",
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function getCardImagePath(card: Card): string {
  if (card.faceUp === false) {
    return "/assets/games/blackjack/card-back.png";
  }
  if (card.suit && card.rank) {
    return `/assets/games/blackjack/cards/card-${card.suit}-${card.rank}.png`;
  }
  return "/assets/games/blackjack/card-back.png";
}

function getTotalBadgeStyle(
  total: number,
  isSoft: boolean,
  isBust: boolean,
  isDealer: boolean
): { color: string; textShadow: string } {
  if (isDealer) {
    return { color: "#A8A8A8", textShadow: "none" };
  }
  if (isBust) {
    return { color: "#FF1744", textShadow: "0 0 8px rgba(255,23,68,0.5)" };
  }
  if (total === 21) {
    return { color: "#FFD700", textShadow: "0 0 12px rgba(255,215,0,0.6)" };
  }
  if (total >= 17 && total <= 20) {
    return { color: "#00E676", textShadow: "0 0 8px rgba(0,230,118,0.4)" };
  }
  if (isSoft) {
    return { color: "#448AFF", textShadow: "0 0 6px rgba(68,138,255,0.3)" };
  }
  return { color: "#A8A8A8", textShadow: "none" };
}

// ============================================================================
// BLACKJACK CARD COMPONENT (with 3D flip)
// ============================================================================

function BlackjackCard({
  card,
  index,
  isDealt = true,
}: {
  card: Card;
  index: number;
  isDealt?: boolean;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const isFaceUp = card.faceUp !== false;

  useEffect(() => {
    if (isDealt && isFaceUp) {
      const timer = setTimeout(() => {
        setIsFlipped(true);
      }, index * 250 + 100);
      return () => clearTimeout(timer);
    }
  }, [isDealt, index, isFaceUp]);

  const cardWidth = "clamp(48px, 8vw, 72px)";
  const cardHeight = "clamp(67px, 11.2vw, 101px)";

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: cardWidth,
    height: cardHeight,
    perspective: "1000px",
    marginLeft: index > 0 ? "clamp(-28px, -4.5vw, -40px)" : 0,
    zIndex: index,
  };

  const cardInnerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    transformStyle: "preserve-3d",
  };

  const faceStyle: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "100%",
    backfaceVisibility: "hidden",
    borderRadius: "clamp(4px, 0.6vw, 8px)",
    overflow: "hidden",
  };

  const frontStyle: React.CSSProperties = {
    ...faceStyle,
    background: "#FFFFFF",
    border: "1px solid rgba(0,0,0,0.15)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
  };

  const backStyle: React.CSSProperties = {
    ...faceStyle,
    transform: "rotateY(180deg)",
    border: "1.5px solid rgba(212,168,67,0.3)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
  };

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  };

  // For face-down cards, show back without flip animation
  if (!isFaceUp) {
    return (
      <div style={containerStyle}>
        <motion.div
          style={cardInnerStyle}
          initial={{ scale: 0.5, opacity: 0, y: -50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ 
            delay: index * 0.25,
            type: "spring", 
            stiffness: 300, 
            damping: 25 
          }}
        >
          <div style={backStyle}>
            <img
              src="/assets/games/blackjack/card-back.png"
              alt="Card back"
              style={imgStyle}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <motion.div
        style={cardInnerStyle}
        initial={{ rotateY: 180, scale: 0.5, opacity: 0, y: -50 }}
        animate={{ 
          rotateY: isFlipped ? 0 : 180, 
          scale: 1, 
          opacity: 1, 
          y: 0 
        }}
        transition={{ 
          delay: index * 0.25,
          type: "spring", 
          stiffness: 300, 
          damping: 25 
        }}
      >
        {/* Front face (card image) */}
        <div style={frontStyle}>
          <img
            src={getCardImagePath({ ...card, faceUp: true })}
            alt={`${card.rank} of ${card.suit}`}
            style={imgStyle}
          />
        </div>
        {/* Back face */}
        <div style={backStyle}>
          <img
            src="/assets/games/blackjack/card-back.png"
            alt="Card back"
            style={imgStyle}
          />
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// TOTAL BADGE COMPONENT
// ============================================================================

function TotalBadge({
  total,
  isSoft = false,
  isBust = false,
  isDealer = false,
}: {
  total: number;
  isSoft?: boolean;
  isBust?: boolean;
  isDealer?: boolean;
}) {
  const { color, textShadow } = getTotalBadgeStyle(total, isSoft, isBust, isDealer);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={total}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        style={{
          background: "rgba(0,0,0,0.7)",
          borderRadius: "12px",
          padding: "2px 10px",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          fontSize: "clamp(12px, 1.8vw, 16px)",
          color,
          textShadow,
        }}
      >
        {total}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// SIDE BET AREA COMPONENT
// ============================================================================

function SideBetArea({
  label,
  result,
  position,
}: {
  label: string;
  result?: SideBetResult;
  position: "left" | "right";
}) {
  const hasResult = result !== undefined;
  const won = result?.won ?? false;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        ...(position === "left" 
          ? { left: "clamp(-56px, -8vw, -72px)" } 
          : { right: "clamp(-56px, -8vw, -72px)" }
        ),
        width: "clamp(48px, 7vw, 64px)",
        height: "clamp(64px, 10vw, 88px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        borderRadius: "8px",
        border: hasResult
          ? won
            ? "2px solid rgba(0,230,118,0.5)"
            : "2px solid rgba(255,255,255,0.1)"
          : "2px dashed rgba(212,168,67,0.15)",
        background: hasResult
          ? won
            ? "rgba(0,230,118,0.08)"
            : "rgba(0,0,0,0.3)"
          : "rgba(0,0,0,0.2)",
        cursor: "default",
      }}
    >
      <span
        style={{
          fontFamily: "'Cinzel', serif",
          fontWeight: 700,
          fontSize: "clamp(9px, 1.3vw, 12px)",
          color: "rgba(212,168,67,0.6)",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </span>
      {hasResult && (
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: "clamp(10px, 1.4vw, 14px)",
            color: won ? "#00E676" : "rgba(255,255,255,0.3)",
          }}
        >
          {won ? result.payout : "-"}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// ACTION BUTTON COMPONENT
// ============================================================================

interface ActionButtonConfig {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  gradient: string;
  borderColor: string;
  glowColor: string;
  index: number;
}

function ActionButton({
  label,
  onClick,
  disabled = false,
  gradient,
  borderColor,
  glowColor,
  index,
}: ActionButtonConfig) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.05, 
        type: "spring", 
        stiffness: 400, 
        damping: 25 
      }}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      style={{
        minHeight: "44px",
        minWidth: "clamp(60px, 10vw, 80px)",
        padding: "0 clamp(8px, 1.5vw, 16px)",
        borderRadius: "8px",
        border: disabled 
          ? "1.5px solid rgba(255,255,255,0.05)" 
          : `1.5px solid ${borderColor}`,
        background: disabled ? "#1A1A1A" : gradient,
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'Cinzel', serif",
        fontWeight: 700,
        fontSize: "clamp(9px, 1.2vw, 14px)",
        color: "#FFFFFF",
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        boxShadow: !disabled && isHovered 
          ? `0 0 16px ${glowColor}` 
          : "0 2px 8px rgba(0,0,0,0.3)",
        outline: "none",
        transition: "box-shadow 0.2s ease",
      }}
    >
      {label}
    </motion.button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BlackjackPlayerTurn({
  onHit,
  onStand,
  onDouble,
  onSplit,
  onSurrender,
  onAction,
  playerHand,
  dealerHand,
  dealerVisibleTotal,
  availableActions,
  sideBetPP: sideBetPPProp,
  sideBet21: sideBet21Prop,
  lang = "br",
}: BlackjackPlayerTurnProps) {
  const langKey = lang === "en" ? "in" : lang;
  const L = LABELS[langKey] || LABELS.br;

  // Mapear suit H/D/S/C → full name para path de imagens
  const suitMap: Record<string, string> = { H: "hearts", D: "diamonds", S: "spades", C: "clubs", hearts: "hearts", diamonds: "diamonds", spades: "spades", clubs: "clubs" };
  const mapCard = (c: Card): Card => ({ ...c, suit: (suitMap[c.suit || ""] || c.suit) as any });

  // Usar props reais ou fallback para mocks
  const dealerCards: Card[] = dealerHand
    ? dealerHand.cards.map(mapCard)
    : [{ suit: "hearts", rank: "10", faceUp: true }, { faceUp: false }];
  const playerCards: Card[] = playerHand
    ? playerHand.cards.map(mapCard)
    : [{ suit: "spades", rank: "A", faceUp: true }, { suit: "diamonds", rank: "10", faceUp: true }];
  const dealerTotal = dealerVisibleTotal ?? 10;
  const playerTotal = playerHand?.total ?? 21;
  const isSoft = playerHand?.isSoft ?? false;
  const isBust = playerHand?.isBust ?? false;
  const canSplit = availableActions?.includes("SPLIT") ?? false;
  const canDouble = availableActions?.includes("DOUBLE") ?? true;
  const canSurrender = availableActions?.includes("SURRENDER") ?? true;
  const canHit = availableActions?.includes("HIT") ?? true;
  const canStand = availableActions?.includes("STAND") ?? true;

  // Side bets visual
  const sideBetPPResult: SideBetResult | undefined = sideBetPPProp ? { won: sideBetPPProp.result === "win", payout: sideBetPPProp.payout > 0 ? `${sideBetPPProp.payout / sideBetPPProp.amount}:1` : undefined } : undefined;
  const sideBet21Plus3: SideBetResult | undefined = sideBet21Prop ? { won: sideBet21Prop.result === "win", payout: sideBet21Prop.payout > 0 ? `${sideBet21Prop.payout / sideBet21Prop.amount}:1` : undefined } : undefined;

  // Handlers: prefer onAction (unified) over individual callbacks
  const fireAction = (action: ActionType) => {
    if (onAction) { onAction(action); return; }
    const map: Record<ActionType, (() => void) | undefined> = { HIT: onHit, STAND: onStand, DOUBLE: onDouble, SPLIT: onSplit, SURRENDER: onSurrender };
    map[action]?.();
  };

  // ========== ACTION BUTTONS CONFIG ==========
  const actionButtons = [
    {
      label: L.hit,
      onClick: () => fireAction("HIT"),
      disabled: !canHit,
      gradient: "linear-gradient(180deg, #00E676, #00C853, #004D25)",
      borderColor: "rgba(0,230,118,0.4)",
      glowColor: "rgba(0,230,118,0.4)",
    },
    {
      label: L.stand,
      onClick: () => fireAction("STAND"),
      disabled: !canStand,
      gradient: "linear-gradient(180deg, #D4A843, #CB9B51, #8B6914)",
      borderColor: "rgba(212,168,67,0.4)",
      glowColor: "rgba(212,168,67,0.4)",
    },
    {
      label: L.double,
      onClick: () => fireAction("DOUBLE"),
      disabled: !canDouble,
      gradient: "linear-gradient(180deg, #448AFF, #2962FF, #1A237E)",
      borderColor: "rgba(68,138,255,0.4)",
      glowColor: "rgba(68,138,255,0.4)",
    },
    {
      label: L.split,
      onClick: () => fireAction("SPLIT"),
      disabled: !canSplit,
      gradient: "linear-gradient(180deg, #B388FF, #7C4DFF, #4A148C)",
      borderColor: "rgba(179,136,255,0.4)",
      glowColor: "rgba(179,136,255,0.4)",
    },
    {
      label: L.surrender,
      onClick: () => fireAction("SURRENDER"),
      disabled: !canSurrender,
      gradient: "linear-gradient(180deg, #FF5252, #D32F2F, #B71C1C)",
      borderColor: "rgba(255,82,82,0.4)",
      glowColor: "rgba(255,82,82,0.4)",
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(16px, 3vh, 28px)",
        padding: "clamp(12px, 2vw, 24px)",
        boxSizing: "border-box",
      }}
    >
      {/* ========== MESA CENTRAL ========== */}
      <div
        style={{
          position: "relative",
          width: "clamp(280px, 55vw, 600px)",
          minHeight: "clamp(280px, 50vh, 500px)",
          background: "radial-gradient(ellipse at 50% 50%, #1a472a, #0f2d1a 70%, #091a0f)",
          backgroundImage: `
            radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px),
            radial-gradient(ellipse at 50% 50%, #1a472a, #0f2d1a 70%, #091a0f)
          `,
          backgroundSize: "8px 8px, 100% 100%",
          borderRadius: "clamp(12px, 2vw, 20px)",
          border: "3px solid rgba(212,168,67,0.4)",
          boxShadow: `
            0 0 30px rgba(212,168,67,0.08),
            0 8px 32px rgba(0,0,0,0.4),
            inset 0 0 150px rgba(0,0,0,0.3)
          `,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "clamp(20px, 4vh, 40px) clamp(16px, 3vw, 32px)",
          boxSizing: "border-box",
        }}
      >
        {/* Side Bets */}
        <SideBetArea label="PP" result={sideBetPPResult} position="left" />
        <SideBetArea label="21+3" result={sideBet21Plus3} position="right" />

        {/* ========== DEALER AREA ========== */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "clamp(8px, 1.5vh, 14px)",
          }}
        >
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: "clamp(10px, 1.4vw, 14px)",
              color: "rgba(255,255,255,0.1)",
              textTransform: "uppercase",
              letterSpacing: "3px",
            }}
          >
            {L.dealer}
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {dealerCards.map((card, i) => (
              <BlackjackCard key={i} card={card} index={i} />
            ))}
          </div>

          <TotalBadge total={dealerTotal} isDealer />
        </div>

        {/* ========== DIVIDER ========== */}
        <div
          style={{
            width: "60%",
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(212,168,67,0.15), transparent)",
          }}
        />

        {/* ========== PLAYER AREA ========== */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "clamp(8px, 1.5vh, 14px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {playerCards.map((card, i) => (
              <BlackjackCard key={i} card={card} index={i} />
            ))}
          </div>

          <TotalBadge total={playerTotal} isSoft={isSoft} isBust={isBust} />

          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: "clamp(10px, 1.4vw, 14px)",
              color: "rgba(255,255,255,0.1)",
              textTransform: "uppercase",
              letterSpacing: "3px",
            }}
          >
            {L.player}
          </span>
        </div>
      </div>

      {/* ========== ACTION BUTTONS ========== */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(6px, 1.2vw, 12px)",
          flexWrap: "wrap",
        }}
      >
        {actionButtons.map((btn, i) => (
          <ActionButton
            key={btn.label}
            label={btn.label}
            onClick={btn.onClick}
            disabled={btn.disabled}
            gradient={btn.gradient}
            borderColor={btn.borderColor}
            glowColor={btn.glowColor}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
