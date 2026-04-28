"use client";

// BlackjackSplit.tsx — Tela 6 (split: 2 maos lado a lado)
// Jogador dividiu par em 2 maos, cada uma jogada sequencialmente
// A mao ativa tem borda verde brilhante + dot pulse, a inativa fica dimmed

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

// ============================================================================
// TYPES
// ============================================================================

type Suit = "spades" | "hearts" | "diamonds" | "clubs";
type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

interface Card {
  suit: Suit;
  rank: Rank;
  faceUp?: boolean;
}

interface HandData {
  cards: Card[];
  total: number;
  isSoft?: boolean;
}

type Action = "hit" | "stand" | "double" | "split" | "surrender";

export interface BlackjackSplitProps {
  onAction?: (action: Action) => void;
  lang?: "br" | "in";
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_DEALER: { cards: Card[]; total: number } = {
  cards: [
    { suit: "clubs", rank: "7", faceUp: true },
    { suit: "spades", rank: "K", faceUp: false },
  ],
  total: 7,
};

const MOCK_HANDS: HandData[] = [
  { cards: [{ suit: "spades", rank: "8" }, { suit: "hearts", rank: "5" }], total: 13 },
  { cards: [{ suit: "spades", rank: "8" }, { suit: "diamonds", rank: "Q" }], total: 18 },
];

const MOCK_ACTIVE_INDEX = 0;

const MOCK_ACTIONS = {
  canSplit: false,
  canDouble: true,
  canSurrender: false,
};

// ============================================================================
// TEXTS
// ============================================================================

const TEXTS = {
  dealer: { br: "DEALER", in: "DEALER" },
  player: { br: "JOGADOR", in: "PLAYER" },
  hand: { br: "MÃO", in: "HAND" },
  playingHand: { br: "Jogando Mão", in: "Playing Hand" },
  of: { br: "de", in: "of" },
  hit: { br: "PEDIR", in: "HIT" },
  stand: { br: "PARAR", in: "STAND" },
  double: { br: "DOBRAR", in: "DOUBLE" },
  split: { br: "DIVIDIR", in: "SPLIT" },
  surrender: { br: "DESISTIR", in: "SURRENDER" },
};

function t(obj: { br: string; in: string }, lang: "br" | "in"): string {
  return obj[lang];
}

// ============================================================================
// HELPER: Get card image path
// ============================================================================

function getCardImagePath(card: Card): string {
  return `/assets/games/blackjack/cards/card-${card.suit}-${card.rank}.png`;
}

// ============================================================================
// HELPER: Get total badge color
// ============================================================================

function getTotalBadgeStyle(total: number, isSoft?: boolean, isDealer?: boolean): { color: string; textShadow: string } {
  if (isDealer) {
    return { color: "#A8A8A8", textShadow: "none" };
  }
  if (total > 21) {
    return { color: "#FF1744", textShadow: "0 0 8px rgba(255,23,68,0.5)" };
  }
  if (total === 21) {
    return { color: "#FFD700", textShadow: "0 0 12px rgba(255,215,0,0.6)" };
  }
  if (total >= 17) {
    return { color: "#00E676", textShadow: "0 0 8px rgba(0,230,118,0.4)" };
  }
  if (isSoft) {
    return { color: "#448AFF", textShadow: "0 0 6px rgba(68,138,255,0.3)" };
  }
  return { color: "#A8A8A8", textShadow: "none" };
}

// ============================================================================
// SUBCOMPONENT: Card
// ============================================================================

interface CardProps {
  card: Card;
  index: number;
  offsetLeft?: number;
}

function CardDisplay({ card, index, offsetLeft = 0 }: CardProps) {
  const isFaceUp = card.faceUp !== false;
  const cardWidth = "clamp(48px, 8vw, 72px)";
  const cardHeight = "clamp(67px, 11.2vw, 101px)";

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, rotateY: 180 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      transition={{
        delay: index * 0.25,
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      style={{
        position: index > 0 ? "relative" : "relative",
        marginLeft: index > 0 ? `clamp(-12px, -1.5vw, -8px)` : 0,
        width: cardWidth,
        height: cardHeight,
        perspective: "1000px",
        transformStyle: "preserve-3d",
        zIndex: index,
      }}
    >
      {/* Face up - PNG image */}
      {isFaceUp ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#FFFFFF",
            borderRadius: "clamp(4px, 0.6vw, 8px)",
            border: "1px solid rgba(0,0,0,0.15)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            overflow: "hidden",
            backfaceVisibility: "hidden",
          }}
        >
          <img
            src={getCardImagePath(card)}
            alt={`${card.rank} of ${card.suit}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            draggable={false}
          />
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "clamp(4px, 0.6vw, 8px)",
            border: "1.5px solid rgba(212,168,67,0.3)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            overflow: "hidden",
            backfaceVisibility: "hidden",
          }}
        >
          <img
            src="/assets/games/blackjack/card-back.png"
            alt="Card back"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            draggable={false}
          />
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// SUBCOMPONENT: Total Badge
// ============================================================================

interface TotalBadgeProps {
  total: number;
  isSoft?: boolean;
  isDealer?: boolean;
}

function TotalBadge({ total, isSoft, isDealer }: TotalBadgeProps) {
  const { color, textShadow } = getTotalBadgeStyle(total, isSoft, isDealer);

  return (
    <motion.div
      key={total}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2px 10px",
        background: "rgba(0,0,0,0.7)",
        borderRadius: 12,
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        fontSize: "clamp(12px, 1.8vw, 16px)",
        color,
        textShadow,
      }}
    >
      {total > 21 ? `${total} BUST` : total}
    </motion.div>
  );
}

// ============================================================================
// SUBCOMPONENT: Dot Pulse (for active hand)
// ============================================================================

function DotPulse() {
  return (
    <motion.div
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
      style={{
        position: "absolute",
        top: -8,
        left: "50%",
        transform: "translateX(-50%)",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "#00E676",
        boxShadow: "0 0 6px rgba(0,230,118,0.6)",
      }}
    />
  );
}

// ============================================================================
// SUBCOMPONENT: Hand Box (active or inactive)
// ============================================================================

interface HandBoxProps {
  hand: HandData;
  index: number;
  isActive: boolean;
  lang: "br" | "in";
}

function HandBox({ hand, index, isActive, lang }: HandBoxProps) {
  const handLabel = `${t(TEXTS.hand, lang)} ${index + 1}`;

  return (
    <motion.div
      layoutId={`hand-${index}`}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "clamp(8px, 1.2vw, 12px)",
        padding: "clamp(8px, 1.5vw, 16px)",
        borderRadius: 12,
        border: isActive
          ? "2px solid rgba(0,230,118,0.5)"
          : "1.5px solid rgba(255,255,255,0.08)",
        background: isActive
          ? "rgba(0,230,118,0.04)"
          : "rgba(0,0,0,0.2)",
        boxShadow: isActive
          ? "0 0 12px rgba(0,230,118,0.15)"
          : "none",
        opacity: isActive ? 1 : 0.6,
        transition: "all 0.3s ease",
      }}
    >
      {/* Dot pulse for active hand */}
      {isActive && <DotPulse />}

      {/* Hand label */}
      <span
        style={{
          fontFamily: "'Cinzel', serif",
          fontWeight: 600,
          fontSize: 10,
          color: isActive ? "#00E676" : "rgba(255,255,255,0.3)",
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        {handLabel}
      </span>

      {/* Cards */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        {hand.cards.map((card, i) => (
          <CardDisplay key={i} card={card} index={i} />
        ))}
      </div>

      {/* Total badge */}
      <TotalBadge total={hand.total} isSoft={hand.isSoft} />
    </motion.div>
  );
}

// ============================================================================
// SUBCOMPONENT: Action Button
// ============================================================================

interface ActionButtonConfig {
  id: Action;
  textKey: keyof typeof TEXTS;
  gradient: string;
  borderColor: string;
}

const ACTION_BUTTONS: ActionButtonConfig[] = [
  {
    id: "hit",
    textKey: "hit",
    gradient: "linear-gradient(180deg, #00E676, #00C853, #004D25)",
    borderColor: "rgba(0,230,118,0.4)",
  },
  {
    id: "stand",
    textKey: "stand",
    gradient: "linear-gradient(180deg, #D4A843, #CB9B51, #8B6914)",
    borderColor: "rgba(212,168,67,0.4)",
  },
  {
    id: "double",
    textKey: "double",
    gradient: "linear-gradient(180deg, #448AFF, #2962FF, #1A237E)",
    borderColor: "rgba(68,138,255,0.4)",
  },
  {
    id: "split",
    textKey: "split",
    gradient: "linear-gradient(180deg, #B388FF, #7C4DFF, #4A148C)",
    borderColor: "rgba(179,136,255,0.4)",
  },
  {
    id: "surrender",
    textKey: "surrender",
    gradient: "linear-gradient(180deg, #FF5252, #D32F2F, #B71C1C)",
    borderColor: "rgba(255,82,82,0.4)",
  },
];

interface ActionButtonProps {
  config: ActionButtonConfig;
  enabled: boolean;
  lang: "br" | "in";
  index: number;
  onAction: (action: Action) => void;
}

function ActionButton({ config, enabled, lang, index, onAction }: ActionButtonProps) {
  const label = t(TEXTS[config.textKey], lang);

  return (
    <motion.button
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 + index * 0.05 }}
      whileHover={enabled ? { y: -1, boxShadow: `0 4px 16px ${config.borderColor}` } : {}}
      whileTap={enabled ? { scale: 0.97 } : {}}
      onClick={() => enabled && onAction(config.id)}
      disabled={!enabled}
      style={{
        minHeight: 44,
        minWidth: "clamp(60px, 10vw, 80px)",
        padding: "0 clamp(10px, 1.5vw, 16px)",
        background: enabled ? config.gradient : "#1A1A1A",
        border: enabled
          ? `1.5px solid ${config.borderColor}`
          : "1.5px solid rgba(255,255,255,0.05)",
        borderRadius: 8,
        fontFamily: "'Cinzel', serif",
        fontWeight: 700,
        fontSize: "clamp(9px, 1.2vw, 14px)",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: "#FFFFFF",
        cursor: enabled ? "pointer" : "not-allowed",
        opacity: enabled ? 1 : 0.35,
        transition: "all 0.2s ease",
      }}
    >
      {label}
    </motion.button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BlackjackSplit({
  onAction,
  lang = "br",
}: BlackjackSplitProps) {
  const [activeHandIndex] = useState(MOCK_ACTIVE_INDEX);
  const dealerCards = MOCK_DEALER.cards;
  const dealerTotal = MOCK_DEALER.total;
  const playerHands = MOCK_HANDS;

  const handleAction = (action: Action) => {
    onAction?.(action);
  };

  const isActionEnabled = (action: Action): boolean => {
    switch (action) {
      case "hit":
      case "stand":
        return true;
      case "double":
        return MOCK_ACTIONS.canDouble;
      case "split":
        return MOCK_ACTIONS.canSplit;
      case "surrender":
        return MOCK_ACTIONS.canSurrender;
      default:
        return false;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        gap: "clamp(16px, 2.5vw, 28px)",
        padding: "clamp(12px, 2vw, 24px)",
      }}
    >
      {/* MESA CENTRAL */}
      <div
        style={{
          position: "relative",
          width: "clamp(320px, 60vw, 680px)",
          minHeight: "clamp(300px, 52vh, 520px)",
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
          padding: "clamp(20px, 3vw, 36px) clamp(16px, 2.5vw, 28px)",
        }}
      >
        {/* DEALER LABEL */}
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(10px, 1.3vw, 14px)",
            color: "rgba(255,255,255,0.1)",
            textTransform: "uppercase",
            letterSpacing: "3px",
          }}
        >
          {t(TEXTS.dealer, lang)}
        </span>

        {/* DEALER CARDS */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "clamp(8px, 1.2vw, 12px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {dealerCards.map((card, i) => (
              <CardDisplay key={i} card={card} index={i} />
            ))}
          </div>
          <TotalBadge total={dealerTotal} isDealer />
        </div>

        {/* DIVIDER */}
        <div
          style={{
            width: "60%",
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(212,168,67,0.15), transparent)",
          }}
        />

        {/* PLAYER HANDS (2 hands side by side) */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            gap: "clamp(24px, 4vw, 48px)",
          }}
        >
          <AnimatePresence>
            {playerHands.map((hand, i) => (
              <HandBox
                key={i}
                hand={hand}
                index={i}
                isActive={i === activeHandIndex}
                lang={lang}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* PLAYER LABEL */}
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(10px, 1.3vw, 14px)",
            color: "rgba(255,255,255,0.1)",
            textTransform: "uppercase",
            letterSpacing: "3px",
          }}
        >
          {t(TEXTS.player, lang)}
        </span>
      </div>

      {/* INDICADOR DE MAO + BOTOES */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(10px, 1.5vw, 16px)",
        }}
      >
        {/* Hand indicator */}
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(11px, 1.4vw, 13px)",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          {t(TEXTS.playingHand, lang)} {activeHandIndex + 1} {t(TEXTS.of, lang)} {playerHands.length}
        </span>

        {/* ACTION BUTTONS */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "clamp(8px, 1.2vw, 14px)",
          }}
        >
          {ACTION_BUTTONS.map((btn, i) => (
            <ActionButton
              key={btn.id}
              config={btn}
              enabled={isActionEnabled(btn.id)}
              lang={lang}
              index={i}
              onAction={handleAction}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
