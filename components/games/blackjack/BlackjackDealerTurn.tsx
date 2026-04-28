"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// TYPES
// ============================================================================
interface Card {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank: string;
}

interface BlackjackDealerTurnProps {
  onComplete?: (result: { dealerTotal: number; playerTotal: number; dealerBust: boolean }) => void;
  lang?: "br" | "in";
}

// ============================================================================
// LABELS
// ============================================================================
const LABELS = {
  br: {
    dealer: "DEALER",
    player: "JOGADOR",
    dealerPlaying: "DEALER JOGANDO...",
    bust: "BUST",
    hit: "HIT",
    stand: "STAND",
    double: "DOUBLE",
    split: "SPLIT",
    surrender: "SURRENDER",
  },
  in: {
    dealer: "DEALER",
    player: "PLAYER",
    dealerPlaying: "DEALER PLAYING...",
    bust: "BUST",
    hit: "HIT",
    stand: "STAND",
    double: "DOUBLE",
    split: "SPLIT",
    surrender: "SURRENDER",
  },
};

// ============================================================================
// MOCK DATA
// ============================================================================
const DEALER_CARDS: Card[] = [
  { suit: "hearts", rank: "10" },
  { suit: "spades", rank: "K" },
  { suit: "diamonds", rank: "6" },
];

const PLAYER_CARDS: Card[] = [
  { suit: "spades", rank: "A" },
  { suit: "diamonds", rank: "10" },
];

// ============================================================================
// HELPER: Get card PNG path
// ============================================================================
function getCardPath(card: Card): string {
  return `/assets/games/blackjack/cards/card-${card.suit}-${card.rank}.png`;
}

// ============================================================================
// HELPER: Get total badge color style
// ============================================================================
function getTotalStyle(total: number, isBust: boolean, isDealer: boolean): React.CSSProperties {
  if (isBust) {
    return { color: "#FF1744", textShadow: "0 0 8px rgba(255,23,68,0.5)" };
  }
  if (isDealer) {
    return { color: "#A8A8A8" };
  }
  if (total === 21) {
    return { color: "#FFD700", textShadow: "0 0 12px rgba(255,215,0,0.6)" };
  }
  if (total >= 17) {
    return { color: "#00E676", textShadow: "0 0 8px rgba(0,230,118,0.4)" };
  }
  return { color: "#A8A8A8" };
}

// ============================================================================
// COMPONENT: BlackjackCard (with flip animation)
// ============================================================================
function BlackjackCard({
  card,
  isFlipped,
  showGlow,
  delay = 0,
  slideIn = false,
}: {
  card: Card;
  isFlipped: boolean;
  showGlow?: boolean;
  delay?: number;
  slideIn?: boolean;
}) {
  const cardWidth = "clamp(48px, 8vw, 72px)";
  const cardHeight = "clamp(67px, 11.2vw, 101px)";

  const cardFaceStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "clamp(4px, 0.6vw, 8px)",
    backfaceVisibility: "hidden",
    overflow: "hidden",
  };

  return (
    <motion.div
      initial={slideIn ? { x: 50, opacity: 0 } : { opacity: 1 }}
      animate={{ x: 0, opacity: 1 }}
      transition={slideIn ? { delay, duration: 0.4, ease: "easeOut" } : {}}
      style={{
        width: cardWidth,
        height: cardHeight,
        perspective: "1000px",
        flexShrink: 0,
      }}
    >
      <motion.div
        initial={{ rotateY: isFlipped ? 0 : 180 }}
        animate={{ rotateY: isFlipped ? 0 : 180 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 40,
          delay,
        }}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Front face (card image) */}
        <div
          style={{
            ...cardFaceStyle,
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.15)",
            boxShadow: showGlow
              ? "0 0 20px rgba(212,168,67,0.4), 0 2px 8px rgba(0,0,0,0.3)"
              : "0 2px 8px rgba(0,0,0,0.3)",
            transition: "box-shadow 0.7s ease-out",
          }}
        >
          <img
            src={getCardPath(card)}
            alt={`${card.rank} of ${card.suit}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "clamp(4px, 0.6vw, 8px)",
            }}
            draggable={false}
          />
        </div>

        {/* Back face (card back) */}
        <div
          style={{
            ...cardFaceStyle,
            transform: "rotateY(180deg)",
            border: "1.5px solid rgba(212,168,67,0.3)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          <img
            src="/assets/games/blackjack/card-back.png"
            alt="Card back"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "clamp(4px, 0.6vw, 8px)",
            }}
            draggable={false}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// COMPONENT: TotalBadge
// ============================================================================
function TotalBadge({
  total,
  isBust,
  isDealer,
  bustLabel,
}: {
  total: number;
  isBust: boolean;
  isDealer: boolean;
  bustLabel: string;
}) {
  const style = getTotalStyle(total, isBust, isDealer);

  return (
    <motion.div
      key={`${total}-${isBust}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{
        background: "rgba(0,0,0,0.7)",
        borderRadius: "12px",
        padding: "2px 10px",
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        fontSize: "clamp(12px, 1.8vw, 16px)",
        ...style,
      }}
    >
      {isBust ? `${total} ${bustLabel}` : total}
    </motion.div>
  );
}

// ============================================================================
// COMPONENT: ActionButton (disabled state)
// ============================================================================
function ActionButton({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "44px",
        minWidth: "clamp(60px, 10vw, 80px)",
        padding: "0 clamp(8px, 1.2vw, 14px)",
        background: "#1A1A1A",
        border: "1.5px solid rgba(255,255,255,0.05)",
        borderRadius: "8px",
        fontFamily: "'Cinzel', serif",
        fontWeight: 700,
        fontSize: "clamp(9px, 1.2vw, 14px)",
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        color: "#FFFFFF",
        opacity: 0.2,
        pointerEvents: "none",
        filter: "grayscale(1)",
      }}
    >
      {label}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function BlackjackDealerTurn({
  onComplete,
  lang = "br",
}: BlackjackDealerTurnProps) {
  const t = LABELS[lang];

  // Animation sequence states
  const [holeCardFlipped, setHoleCardFlipped] = useState(false);
  const [showHoleCardGlow, setShowHoleCardGlow] = useState(false);
  const [dealerTotal, setDealerTotal] = useState(10);
  const [showThirdCard, setShowThirdCard] = useState(false);
  const [dealerBust, setDealerBust] = useState(false);

  // Animation sequence
  useEffect(() => {
    // T=0ms: Flip hole card
    const flipTimer = setTimeout(() => {
      setHoleCardFlipped(true);
      setShowHoleCardGlow(true);
    }, 100);

    // T=700ms: Remove glow
    const glowTimer = setTimeout(() => {
      setShowHoleCardGlow(false);
    }, 700);

    // T=800ms: Update dealer total to 20
    const updateTotal1 = setTimeout(() => {
      setDealerTotal(20);
    }, 800);

    // T=1500ms: Show third card
    const showCard3 = setTimeout(() => {
      setShowThirdCard(true);
    }, 1500);

    // T=2000ms: Update dealer total to 26
    const updateTotal2 = setTimeout(() => {
      setDealerTotal(26);
    }, 2000);

    // T=2200ms: Set bust state
    const setBust = setTimeout(() => {
      setDealerBust(true);
      onComplete?.({ dealerTotal: 26, playerTotal: 21, dealerBust: true });
    }, 2200);

    return () => {
      clearTimeout(flipTimer);
      clearTimeout(glowTimer);
      clearTimeout(updateTotal1);
      clearTimeout(showCard3);
      clearTimeout(updateTotal2);
      clearTimeout(setBust);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(16px, 2.5vw, 28px)",
        width: "100%",
        height: "100%",
        padding: "clamp(12px, 2vw, 24px)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ================================================================== */}
      {/* MESA CENTRAL */}
      {/* ================================================================== */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          width: "clamp(280px, 55vw, 600px)",
          minHeight: "clamp(280px, 50vh, 500px)",
          padding: "clamp(16px, 2.5vw, 32px)",
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
        }}
      >
        {/* ============================================================== */}
        {/* SIDE BET: PERFECT PAIRS (left) */}
        {/* ============================================================== */}
        <div
          style={{
            position: "absolute",
            left: "clamp(-56px, -8vw, -72px)",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "clamp(48px, 7vw, 64px)",
            height: "clamp(56px, 8vw, 72px)",
            border: "2px solid rgba(212,168,67,0.25)",
            borderRadius: "8px",
            background: "rgba(0,0,0,0.3)",
          }}
        >
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: "clamp(9px, 1.2vw, 12px)",
              color: "rgba(212,168,67,0.6)",
              letterSpacing: "1px",
            }}
          >
            PP
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "clamp(10px, 1.4vw, 14px)",
              color: "#00E676",
              marginTop: "4px",
            }}
          >
            6:1
          </span>
        </div>

        {/* ============================================================== */}
        {/* SIDE BET: 21+3 (right) */}
        {/* ============================================================== */}
        <div
          style={{
            position: "absolute",
            right: "clamp(-56px, -8vw, -72px)",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "clamp(48px, 7vw, 64px)",
            height: "clamp(56px, 8vw, 72px)",
            border: "2px solid rgba(212,168,67,0.25)",
            borderRadius: "8px",
            background: "rgba(0,0,0,0.3)",
          }}
        >
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: "clamp(9px, 1.2vw, 12px)",
              color: "rgba(212,168,67,0.6)",
              letterSpacing: "1px",
            }}
          >
            21+3
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "clamp(10px, 1.4vw, 14px)",
              color: "rgba(255,255,255,0.3)",
              marginTop: "4px",
            }}
          >
            -
          </span>
        </div>

        {/* ============================================================== */}
        {/* DEALER AREA */}
        {/* ============================================================== */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "clamp(8px, 1.2vw, 12px)",
          }}
        >
          {/* Dealer label */}
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
            {t.dealer}
          </span>

          {/* Dealer cards */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(8px, 1.5vw, 16px)",
            }}
          >
            {/* Card 1: 10 of Hearts (always face-up) */}
            <BlackjackCard card={DEALER_CARDS[0]} isFlipped={true} />

            {/* Card 2: K of Spades (hole card that flips) */}
            <BlackjackCard
              card={DEALER_CARDS[1]}
              isFlipped={holeCardFlipped}
              showGlow={showHoleCardGlow}
            />

            {/* Card 3: 6 of Diamonds (slides in) */}
            <AnimatePresence>
              {showThirdCard && (
                <BlackjackCard
                  card={DEALER_CARDS[2]}
                  isFlipped={true}
                  slideIn={true}
                  delay={0}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Dealer total badge */}
          <TotalBadge
            total={dealerTotal}
            isBust={dealerBust}
            isDealer={!dealerBust}
            bustLabel={t.bust}
          />
        </div>

        {/* ============================================================== */}
        {/* DIVIDER */}
        {/* ============================================================== */}
        <div
          style={{
            width: "60%",
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(212,168,67,0.15), transparent)",
          }}
        />

        {/* ============================================================== */}
        {/* PLAYER AREA */}
        {/* ============================================================== */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "clamp(8px, 1.2vw, 12px)",
          }}
        >
          {/* Player cards (stacked with offset) */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              height: "clamp(67px, 11.2vw, 101px)",
              width: "clamp(72px, 12vw, 108px)",
            }}
          >
            {PLAYER_CARDS.map((card, index) => (
              <div
                key={`player-${index}`}
                style={{
                  position: index === 0 ? "relative" : "absolute",
                  left: index === 0 ? 0 : "clamp(20px, 3.5vw, 32px)",
                  zIndex: index,
                }}
              >
                <BlackjackCard card={card} isFlipped={true} />
              </div>
            ))}
          </div>

          {/* Player total badge */}
          <TotalBadge total={21} isBust={false} isDealer={false} bustLabel={t.bust} />

          {/* Player label */}
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
            {t.player}
          </span>
        </div>
      </div>

      {/* ================================================================== */}
      {/* CONTROLS (DIMMED) */}
      {/* ================================================================== */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(8px, 1.2vw, 12px)",
        }}
      >
        {/* Dealer playing indicator */}
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 600,
            fontSize: "clamp(11px, 1.5vw, 14px)",
            color: "rgba(212,168,67,0.5)",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          {t.dealerPlaying}
        </span>

        {/* Action buttons (all disabled) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(6px, 1vw, 10px)",
            flexWrap: "wrap",
          }}
        >
          <ActionButton label={t.hit} />
          <ActionButton label={t.stand} />
          <ActionButton label={t.double} />
          <ActionButton label={t.split} />
          <ActionButton label={t.surrender} />
        </div>
      </div>
    </div>
  );
}
