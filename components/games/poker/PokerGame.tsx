"use client";

// PokerGame — Jogo de Poker do Blackout Casino
// 2 modos: Caribbean Stud + Ultimate Texas Hold'em
// FSM completa com telas principais de cada variante

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameHeader } from "@/components/shared";
import { useCasino } from "@/contexts/CasinoContext";

// =============================================================================
// TYPES
// =============================================================================

type PokerPhase =
  | "MODE_SELECT"
  | "CARIBBEAN_BETTING"
  | "CARIBBEAN_PLAYING"
  | "CARIBBEAN_RESULT"
  | "UTH_BETTING"
  | "UTH_PREFLOP"
  | "UTH_FLOP"
  | "UTH_RIVER"
  | "UTH_SHOWDOWN";

type PokerMode = "caribbean" | "uth";
type CardSuit = "hearts" | "diamonds" | "clubs" | "spades";
type CardRank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

interface Card {
  suit: CardSuit;
  rank: CardRank;
  faceUp: boolean;
}

interface PokerGameProps {
  onBack: () => void;
  onDeposit?: () => void;
  lang?: "br" | "en";
}

// =============================================================================
// ASSETS
// =============================================================================

const ASSETS = {
  bgCasino: "/assets/shared/ui/bg-casino.png",
  dividerGold: "/assets/shared/ui/divider-ornamental-gold.png",
  chip: "/assets/games/poker/chip.png",
  cardBack: "/assets/games/poker/card-back.png",
  suitHearts: "/assets/games/poker/suit-hearts.png",
  suitDiamonds: "/assets/games/poker/suit-diamonds.png",
  suitClubs: "/assets/games/poker/suit-clubs.png",
  suitSpades: "/assets/games/poker/suit-spades.png",
  iconJackpot: "/assets/shared/icons/icon-jackpot.png",
  iconSoundOn: "/assets/shared/icons/icon-sound-on.png",
  iconSoundOff: "/assets/shared/icons/icon-sound-off.png",
  iconRules: "/assets/shared/icons/icon-rules.png",
  iconPaytable: "/assets/shared/icons/icon-paytable.png",
  iconMode: "/assets/shared/icons/icon-mode.png",
};

// Card images from blackjack
const getCardImage = (card: Card): string => {
  const suitMap: Record<CardSuit, string> = {
    hearts: "hearts",
    diamonds: "diamonds",
    clubs: "clubs",
    spades: "spades",
  };
  return `/assets/games/blackjack/cards/card-${suitMap[card.suit]}-${card.rank}.png`;
};

// =============================================================================
// COLORS
// =============================================================================

const GOLD = {
  primary: "#D4A843",
  light: "#FFD700",
  dark: "#8B6914",
  glow: "rgba(212,168,67,0.45)",
};

const EMERALD = {
  primary: "#00C853",
  light: "#00E676",
  glow: "rgba(0,230,118,0.35)",
};

// =============================================================================
// TEXTS (Bilingue)
// =============================================================================

const TEXTS = {
  title: { br: "POKER", en: "POKER" },
  selectMode: { br: "ESCOLHA O MODO", en: "SELECT MODE" },
  caribbeanStud: { br: "CARIBBEAN STUD", en: "CARIBBEAN STUD" },
  caribbeanSub: { br: "5 cartas cada · Fold ou Raise", en: "5 cards each · Fold or Raise" },
  ultimateHoldem: { br: "ULTIMATE HOLD'EM", en: "ULTIMATE HOLD'EM" },
  ultimateSub: { br: "2 hole + 5 community · 3 decisoes", en: "2 hole + 5 community · 3 decisions" },
  play: { br: "JOGAR", en: "PLAY" },
  dealer: { br: "DEALER", en: "DEALER" },
  yourHand: { br: "SUA MAO", en: "YOUR HAND" },
  yourCards: { br: "SUAS CARTAS", en: "YOUR CARDS" },
  community: { br: "COMMUNITY", en: "COMMUNITY" },
  ante: { br: "ANTE", en: "ANTE" },
  blind: { br: "BLIND", en: "BLIND" },
  trips: { br: "TRIPS", en: "TRIPS" },
  raise: { br: "RAISE", en: "RAISE" },
  jackpot: { br: "JACKPOT", en: "JACKPOT" },
  activate: { br: "ATIVAR", en: "ACTIVATE" },
  active: { br: "ATIVO", en: "ACTIVE" },
  deal: { br: "DISTRIBUIR", en: "DEAL" },
  fold: { br: "FOLD", en: "FOLD" },
  call: { br: "CALL", en: "CALL" },
  check: { br: "CHECK", en: "CHECK" },
  bet: { br: "BET", en: "BET" },
  perHand: { br: "G$ 1/mao", en: "G$ 1/hand" },
  rules: { br: "Regras do jogo", en: "Game rules" },
  paytable: { br: "Tabela de pagamentos", en: "Paytable" },
  soundOn: { br: "Desativar som", en: "Mute sound" },
  soundOff: { br: "Ativar som", en: "Enable sound" },
  houseEdge: { br: "House Edge", en: "House Edge" },
  newHand: { br: "NOVA MAO", en: "NEW HAND" },
  youWin: { br: "VOCE GANHOU!", en: "YOU WIN!" },
  youLose: { br: "VOCE PERDEU", en: "YOU LOSE" },
  push: { br: "EMPATE", en: "PUSH" },
  dealerNoQualify: { br: "DEALER NAO QUALIFICA", en: "DEALER DOESN'T QUALIFY" },
  preflop: { br: "PRE-FLOP", en: "PRE-FLOP" },
  flop: { br: "FLOP", en: "FLOP" },
  river: { br: "TURN & RIVER", en: "TURN & RIVER" },
  showdown: { br: "SHOWDOWN", en: "SHOWDOWN" },
  bet4x: { br: "BET 4X", en: "BET 4X" },
  bet2x: { br: "BET 2X", en: "BET 2X" },
  bet1x: { br: "BET 1X", en: "BET 1X" },
};

function t(obj: { br: string; en: string }, lang: "br" | "en"): string {
  return obj[lang] || obj.en;
}

// =============================================================================
// DECK UTILITIES
// =============================================================================

const SUITS: CardSuit[] = ["hearts", "diamonds", "clubs", "spades"];
const RANKS: CardRank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, faceUp: false });
    }
  }
  return deck;
}

function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function dealCards(deck: Card[], count: number, faceUp: boolean = true): { cards: Card[]; remaining: Card[] } {
  const cards = deck.slice(0, count).map(c => ({ ...c, faceUp }));
  const remaining = deck.slice(count);
  return { cards, remaining };
}

// =============================================================================
// HAND EVALUATION (Simplified)
// =============================================================================

type HandRank =
  | "HIGH_CARD"
  | "ONE_PAIR"
  | "TWO_PAIR"
  | "THREE_KIND"
  | "STRAIGHT"
  | "FLUSH"
  | "FULL_HOUSE"
  | "FOUR_KIND"
  | "STRAIGHT_FLUSH"
  | "ROYAL_FLUSH";

const HAND_NAMES: Record<HandRank, { br: string; en: string }> = {
  HIGH_CARD: { br: "Carta Alta", en: "High Card" },
  ONE_PAIR: { br: "Um Par", en: "One Pair" },
  TWO_PAIR: { br: "Dois Pares", en: "Two Pair" },
  THREE_KIND: { br: "Trinca", en: "Three of a Kind" },
  STRAIGHT: { br: "Sequencia", en: "Straight" },
  FLUSH: { br: "Flush", en: "Flush" },
  FULL_HOUSE: { br: "Full House", en: "Full House" },
  FOUR_KIND: { br: "Quadra", en: "Four of a Kind" },
  STRAIGHT_FLUSH: { br: "Straight Flush", en: "Straight Flush" },
  ROYAL_FLUSH: { br: "Royal Flush", en: "Royal Flush" },
};

function evaluateHand(cards: Card[]): { rank: HandRank; score: number } {
  // Simplified evaluation - in production would be more complete
  const rankValues: Record<CardRank, number> = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
    "J": 11, "Q": 12, "K": 13, "A": 14
  };

  const values = cards.map(c => rankValues[c.rank]).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const isFlush = suits.every(s => s === suits[0]);
  
  // Count ranks
  const counts: Record<number, number> = {};
  values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  const countValues = Object.values(counts).sort((a, b) => b - a);
  
  // Check straight
  const uniqueValues = [...new Set(values)].sort((a, b) => b - a);
  const isStraight = uniqueValues.length === 5 && 
    (uniqueValues[0] - uniqueValues[4] === 4 || 
     (uniqueValues[0] === 14 && uniqueValues[1] === 5)); // Ace-low straight

  // Determine hand rank
  if (isFlush && isStraight) {
    if (uniqueValues[0] === 14 && uniqueValues[1] === 13) {
      return { rank: "ROYAL_FLUSH", score: 1000 };
    }
    return { rank: "STRAIGHT_FLUSH", score: 900 + uniqueValues[0] };
  }
  if (countValues[0] === 4) return { rank: "FOUR_KIND", score: 800 + values[0] };
  if (countValues[0] === 3 && countValues[1] === 2) return { rank: "FULL_HOUSE", score: 700 + values[0] };
  if (isFlush) return { rank: "FLUSH", score: 600 + values[0] };
  if (isStraight) return { rank: "STRAIGHT", score: 500 + uniqueValues[0] };
  if (countValues[0] === 3) return { rank: "THREE_KIND", score: 400 + values[0] };
  if (countValues[0] === 2 && countValues[1] === 2) return { rank: "TWO_PAIR", score: 300 + values[0] };
  if (countValues[0] === 2) return { rank: "ONE_PAIR", score: 200 + values[0] };
  return { rank: "HIGH_CARD", score: 100 + values[0] };
}

// Caribbean Stud: Dealer qualifies with Ace-King or better
function dealerQualifies(cards: Card[]): boolean {
  const eval_ = evaluateHand(cards);
  if (eval_.rank !== "HIGH_CARD") return true;
  // Check for A-K high
  const hasAce = cards.some(c => c.rank === "A");
  const hasKing = cards.some(c => c.rank === "K");
  return hasAce && hasKing;
}

// =============================================================================
// CARD COMPONENT
// =============================================================================

function PokerCard({
  card,
  index,
  delay = 0,
  size = "normal",
}: {
  card: Card | null;
  index: number;
  delay?: number;
  size?: "normal" | "small" | "large";
}) {
  const sizeMap = {
    small: { width: "clamp(36px, 5vw, 56px)", aspect: "5/7" },
    normal: { width: "clamp(48px, 6.5vw, 80px)", aspect: "5/7" },
    large: { width: "clamp(60px, 8vw, 100px)", aspect: "5/7" },
  };

  const { width, aspect } = sizeMap[size];

  if (!card) {
    // Empty slot
    return (
      <div
        style={{
          width,
          aspectRatio: aspect,
          background: "rgba(212,168,67,0.05)",
          border: "1px dashed rgba(212,168,67,0.15)",
          borderRadius: "6px",
        }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -30, rotateY: 180 }}
      animate={{ opacity: 1, y: 0, rotateY: card.faceUp ? 0 : 180 }}
      transition={{
        duration: 0.4,
        delay: delay + index * 0.15,
        ease: [0.23, 1, 0.32, 1],
      }}
      style={{
        width,
        aspectRatio: aspect,
        perspective: "1000px",
        transformStyle: "preserve-3d",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transform: card.faceUp ? "rotateY(0deg)" : "rotateY(180deg)",
          transition: "transform 0.5s",
        }}
      >
        {/* Front */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            borderRadius: "6px",
            overflow: "hidden",
            boxShadow: `
              0 2px 8px rgba(0,0,0,0.5),
              0 0 1px rgba(212,168,67,0.3),
              inset 0 0 20px rgba(255,255,255,0.05)
            `,
          }}
        >
          <img
            src={getCardImage(card)}
            alt={`${card.rank} of ${card.suit}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
        {/* Back */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: "6px",
            overflow: "hidden",
            boxShadow: `
              0 2px 8px rgba(0,0,0,0.5),
              0 0 1px rgba(212,168,67,0.3)
            `,
          }}
        >
          <img
            src={ASSETS.cardBack}
            alt="Card back"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// CHIP STACK DISPLAY
// =============================================================================

function ChipStack({ amount, label, color = GOLD.primary }: { amount: number; label: string; color?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <div style={{ position: "relative" }}>
        <img
          src={ASSETS.chip}
          alt=""
          style={{
            width: "clamp(32px, 4vw, 48px)",
            height: "clamp(32px, 4vw, 48px)",
            objectFit: "contain",
            filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.5))`,
          }}
        />
        {amount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "clamp(8px, 0.9vw, 11px)",
              color: "#0A0A0A",
              textShadow: "0 0 2px rgba(255,255,255,0.3)",
            }}
          >
            {amount >= 1000 ? `${(amount / 1000).toFixed(0)}K` : amount}
          </span>
        )}
      </div>
      <span
        style={{
          fontFamily: "'Cinzel', serif",
          fontWeight: 600,
          fontSize: "clamp(8px, 0.9vw, 10px)",
          color,
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// =============================================================================
// MODE SELECT SCREEN
// =============================================================================

function ModeSelectScreen({
  lang,
  onSelectMode,
}: {
  lang: "br" | "en";
  onSelectMode: (mode: PokerMode) => void;
}) {
  const modes = [
    {
      id: "caribbean" as PokerMode,
      icon: ASSETS.suitSpades,
      title: t(TEXTS.caribbeanStud, lang),
      subtitle: t(TEXTS.caribbeanSub, lang),
      houseEdge: "5.22%",
      edgeColor: GOLD.primary,
    },
    {
      id: "uth" as PokerMode,
      icon: ASSETS.suitHearts,
      title: t(TEXTS.ultimateHoldem, lang),
      subtitle: t(TEXTS.ultimateSub, lang),
      houseEdge: "2.19%",
      edgeColor: EMERALD.light,
    },
  ];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(16px, 3vw, 32px)",
        gap: "clamp(24px, 4vw, 48px)",
      }}
    >
      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          fontFamily: "'Cinzel', serif",
          fontWeight: 800,
          fontSize: "clamp(18px, 2.5vw, 30px)",
          color: GOLD.primary,
          letterSpacing: "4px",
          textShadow: `0 0 20px ${GOLD.glow}`,
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        {t(TEXTS.selectMode, lang)}
      </motion.h2>

      {/* Mode Cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "clamp(20px, 3vw, 40px)",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {modes.map((mode, index) => (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.15, ease: "easeOut" }}
            whileHover={{
              scale: 1.04,
              y: -6,
              borderColor: "rgba(212,168,67,0.6)",
              boxShadow: `0 0 30px ${GOLD.glow}, 0 8px 32px rgba(0,0,0,0.6)`,
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectMode(mode.id)}
            style={{
              width: "clamp(180px, 24vw, 280px)",
              aspectRatio: "3/4",
              borderRadius: "16px",
              overflow: "hidden",
              cursor: "pointer",
              border: `1.5px solid rgba(212,168,67,0.25)`,
              background: "linear-gradient(160deg, #141210 0%, #0D0B08 100%)",
              boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              padding: 0,
            }}
          >
            {/* Inner glow */}
            <div
              style={{
                position: "absolute",
                inset: "1px",
                borderRadius: "15px",
                border: `1px solid rgba(212,168,67,0.1)`,
                pointerEvents: "none",
              }}
            />

            {/* Card Content */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "clamp(16px, 2vw, 24px)",
                gap: "clamp(12px, 1.5vw, 20px)",
              }}
            >
              {/* Suit Icon */}
              <motion.img
                src={mode.icon}
                alt=""
                animate={{ 
                  filter: [
                    `drop-shadow(0 0 8px ${GOLD.glow})`,
                    `drop-shadow(0 0 16px ${GOLD.glow})`,
                    `drop-shadow(0 0 8px ${GOLD.glow})`,
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: "clamp(56px, 7vw, 88px)",
                  height: "clamp(56px, 7vw, 88px)",
                  objectFit: "contain",
                }}
              />

              {/* Title */}
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 800,
                  fontSize: "clamp(11px, 1.3vw, 16px)",
                  color: GOLD.light,
                  letterSpacing: "2px",
                  textAlign: "center",
                  textShadow: `0 0 10px ${GOLD.glow}`,
                }}
              >
                {mode.title}
              </span>

              {/* Subtitle */}
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: "clamp(9px, 1vw, 12px)",
                  color: "rgba(255,255,255,0.55)",
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                {mode.subtitle}
              </span>

              {/* House Edge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "auto",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "clamp(8px, 0.9vw, 10px)",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  {t(TEXTS.houseEdge, lang)}:
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                    fontSize: "clamp(10px, 1.1vw, 13px)",
                    color: mode.edgeColor,
                  }}
                >
                  {mode.houseEdge}
                </span>
              </div>
            </div>

            {/* Footer Play Button */}
            <div
              style={{
                padding: "clamp(12px, 1.5vw, 20px)",
                background: "linear-gradient(0deg, rgba(8,6,4,0.95) 60%, transparent)",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  background: `linear-gradient(180deg, ${EMERALD.light}, ${EMERALD.primary})`,
                  borderRadius: "8px",
                  padding: "clamp(8px, 1vw, 12px) clamp(24px, 3vw, 40px)",
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: "clamp(10px, 1.1vw, 13px)",
                  color: "#FFFFFF",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  boxShadow: `0 0 16px ${EMERALD.glow}`,
                }}
              >
                {t(TEXTS.play, lang)}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// CARIBBEAN STUD - BETTING SCREEN
// =============================================================================

function CaribbeanBettingScreen({
  lang,
  balance,
  ante,
  setAnte,
  jackpotPool,
  jackpotActive,
  setJackpotActive,
  onDeal,
  onBack,
}: {
  lang: "br" | "en";
  balance: number;
  ante: number;
  setAnte: (v: number) => void;
  jackpotPool: number;
  jackpotActive: boolean;
  setJackpotActive: (v: boolean) => void;
  onDeal: () => void;
  onBack: () => void;
}) {
  const presets = [
    { label: "MIN", action: () => setAnte(10) },
    { label: "2", action: () => setAnte(Math.max(10, Math.floor(ante / 2))) },
    { label: "x2", action: () => setAnte(Math.min(balance, ante * 2)) },
    { label: "MAX", action: () => setAnte(Math.min(balance, 10000)) },
  ];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          padding: "clamp(8px, 1.2vw, 16px)",
          gap: "clamp(12px, 2vw, 24px)",
          minHeight: 0,
        }}
      >
        {/* Table Area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "clamp(10px, 1.5vw, 18px)",
            minWidth: 0,
          }}
        >
          {/* Felt Table */}
          <div
            style={{
              flex: 1,
              background: "radial-gradient(ellipse at 50% 40%, #1a3d1a 0%, #0f2a0f 50%, #071507 100%)",
              borderRadius: "clamp(12px, 2vw, 20px)",
              border: "2px solid rgba(212,168,67,0.3)",
              boxShadow: "inset 0 0 40px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.4)",
              padding: "clamp(12px, 2vw, 24px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 0,
            }}
          >
            {/* Dealer Area */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "clamp(8px, 1vw, 12px)",
              }}
            >
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 600,
                  fontSize: "clamp(10px, 1.1vw, 13px)",
                  color: "rgba(255,255,255,0.25)",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                }}
              >
                {t(TEXTS.dealer, lang)}
              </span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "clamp(4px, 0.6vw, 8px)",
                  justifyContent: "center",
                }}
              >
                {[...Array(5)].map((_, i) => (
                  <PokerCard key={`dealer-slot-${i}`} card={null} index={i} size="normal" />
                ))}
              </div>
            </div>

            {/* Divider */}
            <img
              src={ASSETS.dividerGold}
              alt=""
              style={{
                width: "70%",
                alignSelf: "center",
                opacity: 0.35,
                objectFit: "contain",
              }}
            />

            {/* Player Area */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "clamp(8px, 1vw, 12px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "clamp(4px, 0.6vw, 8px)",
                  justifyContent: "center",
                }}
              >
                {[...Array(5)].map((_, i) => (
                  <PokerCard key={`player-slot-${i}`} card={null} index={i} size="normal" />
                ))}
              </div>
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 600,
                  fontSize: "clamp(10px, 1.1vw, 13px)",
                  color: "rgba(255,255,255,0.25)",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                }}
              >
                {t(TEXTS.yourHand, lang)}
              </span>
            </div>
          </div>

          {/* Betting Controls */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(10px, 1.2vw, 16px)",
              padding: "clamp(8px, 1vw, 12px)",
            }}
          >
            {/* Ante Display */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(8px, 1vw, 12px)",
              }}
            >
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 600,
                  fontSize: "clamp(11px, 1.2vw, 14px)",
                  color: GOLD.primary,
                  letterSpacing: "2px",
                }}
              >
                {t(TEXTS.ante, lang)}:
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: "clamp(16px, 2vw, 24px)",
                  color: EMERALD.light,
                  textShadow: `0 0 10px ${EMERALD.glow}`,
                }}
              >
                G$ {ante.toLocaleString("pt-BR")}
              </span>
            </div>

            {/* Chip + Presets */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "clamp(8px, 1vw, 14px)",
                alignItems: "center",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {/* Clickable Chip */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAnte(Math.min(balance, ante + 100))}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <img
                  src={ASSETS.chip}
                  alt=""
                  style={{
                    width: "clamp(48px, 6vw, 72px)",
                    height: "clamp(48px, 6vw, 72px)",
                    objectFit: "contain",
                    filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
                  }}
                />
              </motion.button>

              {/* Preset Buttons */}
              {presets.map((preset) => (
                <motion.button
                  key={preset.label}
                  whileHover={{ background: "rgba(212,168,67,0.15)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={preset.action}
                  style={{
                    background: "rgba(212,168,67,0.08)",
                    border: "1px solid rgba(212,168,67,0.25)",
                    borderRadius: "6px",
                    color: GOLD.primary,
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 600,
                    fontSize: "clamp(10px, 1vw, 12px)",
                    minHeight: "40px",
                    minWidth: "48px",
                    padding: "clamp(6px, 0.7vw, 10px) clamp(12px, 1.2vw, 16px)",
                    cursor: "pointer",
                  }}
                >
                  {preset.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Side Panel: Jackpot */}
        <div
          style={{
            flex: "0 0 auto",
            width: "clamp(110px, 14vw, 180px)",
          }}
        >
          <div
            style={{
              background: "rgba(212,168,67,0.04)",
              border: "1px solid rgba(212,168,67,0.15)",
              borderRadius: "12px",
              padding: "clamp(10px, 1.5vw, 16px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(8px, 1vw, 12px)",
              height: "100%",
            }}
          >
            {/* Jackpot Icon */}
            <motion.img
              src={ASSETS.iconJackpot}
              alt=""
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: "clamp(36px, 4.5vw, 56px)",
                height: "clamp(36px, 4.5vw, 56px)",
                objectFit: "contain",
                filter: `drop-shadow(0 0 10px ${GOLD.glow})`,
              }}
            />

            {/* Jackpot Label */}
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: "clamp(10px, 1.1vw, 13px)",
                color: GOLD.light,
                letterSpacing: "2px",
                textShadow: `0 0 8px ${GOLD.glow}`,
              }}
            >
              {t(TEXTS.jackpot, lang)}
            </span>

            {/* Jackpot Value */}
            <motion.span
              animate={{
                textShadow: [
                  `0 0 8px ${GOLD.glow}`,
                  `0 0 16px ${GOLD.glow}`,
                  `0 0 8px ${GOLD.glow}`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: "clamp(13px, 1.5vw, 18px)",
                color: GOLD.light,
              }}
            >
              G$ {jackpotPool.toLocaleString("pt-BR")}
            </motion.span>

            {/* Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setJackpotActive(!jackpotActive)}
              style={{
                width: "100%",
                minHeight: "44px",
                borderRadius: "8px",
                cursor: "pointer",
                marginTop: "auto",
                border: jackpotActive
                  ? `1.5px solid ${GOLD.primary}`
                  : "1px dashed rgba(212,168,67,0.25)",
                background: jackpotActive
                  ? "rgba(212,168,67,0.12)"
                  : "transparent",
                boxShadow: jackpotActive
                  ? `0 0 12px rgba(212,168,67,0.25)`
                  : "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                padding: "clamp(6px, 0.8vw, 10px)",
              }}
            >
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 600,
                  fontSize: "clamp(10px, 1.1vw, 12px)",
                  color: jackpotActive ? GOLD.light : GOLD.primary,
                }}
              >
                {jackpotActive ? t(TEXTS.active, lang) : t(TEXTS.activate, lang)}
              </span>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: "clamp(8px, 0.9vw, 10px)",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                {t(TEXTS.perHand, lang)}
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Footer: Deal Button */}
      <div
        style={{
          padding: "clamp(10px, 1.5vw, 18px)",
          background: "linear-gradient(0deg, rgba(8,6,4,0.95) 70%, transparent)",
          display: "flex",
          justifyContent: "center",
          gap: "clamp(12px, 1.5vw, 20px)",
        }}
      >
        {/* Back to Mode Select */}
        <motion.button
          whileHover={{ scale: 1.02, borderColor: "rgba(212,168,67,0.5)" }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          style={{
            minWidth: "clamp(100px, 12vw, 140px)",
            minHeight: "48px",
            background: "rgba(212,168,67,0.08)",
            border: "1px solid rgba(212,168,67,0.25)",
            borderRadius: "10px",
            cursor: "pointer",
            fontFamily: "'Cinzel', serif",
            fontWeight: 600,
            fontSize: "clamp(11px, 1.2vw, 14px)",
            color: GOLD.primary,
            letterSpacing: "1px",
          }}
        >
          {lang === "br" ? "VOLTAR" : "BACK"}
        </motion.button>

        {/* Deal Button */}
        <motion.button
          whileHover={ante > 0 ? { scale: 1.03 } : {}}
          whileTap={ante > 0 ? { scale: 0.97 } : {}}
          onClick={ante > 0 ? onDeal : undefined}
          animate={
            ante > 0
              ? {
                  boxShadow: [
                    `0 0 20px ${EMERALD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
                    `0 0 35px ${EMERALD.glow}, 0 0 12px ${GOLD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
                    `0 0 20px ${EMERALD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
                  ],
                }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            minWidth: "clamp(160px, 22vw, 260px)",
            minHeight: "52px",
            background:
              ante > 0
                ? `linear-gradient(180deg, ${EMERALD.light} 0%, ${EMERALD.primary} 50%, #004D25 100%)`
                : "rgba(100,100,100,0.3)",
            border: ante > 0 ? `1.5px solid rgba(0,230,118,0.4)` : "1px solid rgba(100,100,100,0.3)",
            borderRadius: "10px",
            cursor: ante > 0 ? "pointer" : "not-allowed",
            opacity: ante > 0 ? 1 : 0.35,
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(14px, 1.7vw, 20px)",
            color: "#FFFFFF",
            letterSpacing: "2px",
            textTransform: "uppercase",
            boxShadow: ante > 0
              ? `0 0 20px ${EMERALD.glow}, 0 4px 12px rgba(0,0,0,0.4)`
              : "none",
          }}
        >
          {t(TEXTS.deal, lang)}
        </motion.button>
      </div>
    </div>
  );
}

// =============================================================================
// CARIBBEAN STUD - PLAYING SCREEN
// =============================================================================

function CaribbeanPlayingScreen({
  lang,
  playerCards,
  dealerCards,
  ante,
  onFold,
  onRaise,
}: {
  lang: "br" | "en";
  playerCards: Card[];
  dealerCards: Card[];
  ante: number;
  onFold: () => void;
  onRaise: () => void;
}) {
  const playerEval = evaluateHand(playerCards);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Table */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "clamp(8px, 1.2vw, 16px)",
          minHeight: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            background: "radial-gradient(ellipse at 50% 40%, #1a3d1a 0%, #0f2a0f 50%, #071507 100%)",
            borderRadius: "clamp(12px, 2vw, 20px)",
            border: "2px solid rgba(212,168,67,0.3)",
            boxShadow: "inset 0 0 40px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.4)",
            padding: "clamp(12px, 2vw, 24px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: 0,
          }}
        >
          {/* Dealer Area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(8px, 1vw, 12px)",
            }}
          >
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                fontSize: "clamp(10px, 1.1vw, 13px)",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "3px",
                textTransform: "uppercase",
              }}
            >
              {t(TEXTS.dealer, lang)}
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "clamp(4px, 0.6vw, 8px)",
                justifyContent: "center",
              }}
            >
              {dealerCards.map((card, i) => (
                <PokerCard key={`dealer-${i}`} card={card} index={i} size="normal" />
              ))}
            </div>
          </div>

          {/* Bet Info Center */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "clamp(24px, 4vw, 48px)",
            }}
          >
            <ChipStack amount={ante} label={t(TEXTS.ante, lang)} />
            <img
              src={ASSETS.dividerGold}
              alt=""
              style={{
                width: "clamp(40px, 6vw, 80px)",
                opacity: 0.3,
                objectFit: "contain",
                alignSelf: "center",
              }}
            />
            <ChipStack amount={0} label={t(TEXTS.raise, lang)} color="rgba(255,255,255,0.3)" />
          </div>

          {/* Player Area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(8px, 1vw, 12px)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "clamp(4px, 0.6vw, 8px)",
                justifyContent: "center",
              }}
            >
              {playerCards.map((card, i) => (
                <PokerCard key={`player-${i}`} card={card} index={i} delay={0.3} size="normal" />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 600,
                  fontSize: "clamp(10px, 1.1vw, 13px)",
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                }}
              >
                {t(TEXTS.yourHand, lang)}
              </span>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: "clamp(12px, 1.4vw, 17px)",
                  color: GOLD.light,
                  letterSpacing: "1px",
                  textShadow: `0 0 10px ${GOLD.glow}`,
                }}
              >
                {HAND_NAMES[playerEval.rank][lang]}
              </motion.span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          padding: "clamp(10px, 1.5vw, 18px)",
          background: "linear-gradient(0deg, rgba(8,6,4,0.95) 70%, transparent)",
          display: "flex",
          justifyContent: "center",
          gap: "clamp(16px, 2vw, 28px)",
        }}
      >
        {/* Fold */}
        <motion.button
          whileHover={{ scale: 1.02, borderColor: "rgba(255,100,100,0.5)" }}
          whileTap={{ scale: 0.98 }}
          onClick={onFold}
          style={{
            minWidth: "clamp(120px, 16vw, 180px)",
            minHeight: "52px",
            background: "rgba(180,60,60,0.15)",
            border: "1.5px solid rgba(180,60,60,0.4)",
            borderRadius: "10px",
            cursor: "pointer",
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(13px, 1.5vw, 18px)",
            color: "#FF6B6B",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          {t(TEXTS.fold, lang)}
        </motion.button>

        {/* Raise (2x Ante) */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRaise}
          animate={{
            boxShadow: [
              `0 0 20px ${EMERALD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
              `0 0 35px ${EMERALD.glow}, 0 0 12px ${GOLD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
              `0 0 20px ${EMERALD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            minWidth: "clamp(160px, 22vw, 260px)",
            minHeight: "52px",
            background: `linear-gradient(180deg, ${EMERALD.light} 0%, ${EMERALD.primary} 50%, #004D25 100%)`,
            border: `1.5px solid rgba(0,230,118,0.4)`,
            borderRadius: "10px",
            cursor: "pointer",
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(13px, 1.5vw, 18px)",
            color: "#FFFFFF",
            letterSpacing: "2px",
            textTransform: "uppercase",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
          }}
        >
          <span>{t(TEXTS.raise, lang)}</span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "clamp(10px, 1.1vw, 13px)",
              opacity: 0.8,
            }}
          >
            G$ {(ante * 2).toLocaleString("pt-BR")}
          </span>
        </motion.button>
      </div>
    </div>
  );
}

// =============================================================================
// CARIBBEAN STUD - RESULT SCREEN
// =============================================================================

function CaribbeanResultScreen({
  lang,
  playerCards,
  dealerCards,
  ante,
  raised,
  result,
  payout,
  onNewHand,
}: {
  lang: "br" | "en";
  playerCards: Card[];
  dealerCards: Card[];
  ante: number;
  raised: boolean;
  result: "win" | "lose" | "push" | "no_qualify";
  payout: number;
  onNewHand: () => void;
}) {
  const playerEval = evaluateHand(playerCards);
  const dealerEval = evaluateHand(dealerCards);
  const qualified = dealerQualifies(dealerCards);

  const resultText = {
    win: TEXTS.youWin,
    lose: TEXTS.youLose,
    push: TEXTS.push,
    no_qualify: TEXTS.dealerNoQualify,
  };

  const resultColor = {
    win: EMERALD.light,
    lose: "#FF6B6B",
    push: GOLD.primary,
    no_qualify: GOLD.light,
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Table */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "clamp(8px, 1.2vw, 16px)",
          minHeight: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            background: "radial-gradient(ellipse at 50% 40%, #1a3d1a 0%, #0f2a0f 50%, #071507 100%)",
            borderRadius: "clamp(12px, 2vw, 20px)",
            border: "2px solid rgba(212,168,67,0.3)",
            boxShadow: "inset 0 0 40px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.4)",
            padding: "clamp(12px, 2vw, 24px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            minHeight: 0,
          }}
        >
          {/* Dealer Area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(6px, 0.8vw, 10px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(8px, 1vw, 12px)",
              }}
            >
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 600,
                  fontSize: "clamp(10px, 1.1vw, 13px)",
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "2px",
                }}
              >
                {t(TEXTS.dealer, lang)}
              </span>
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: "clamp(10px, 1.1vw, 13px)",
                  color: qualified ? GOLD.light : "rgba(255,255,255,0.4)",
                  letterSpacing: "1px",
                }}
              >
                {HAND_NAMES[dealerEval.rank][lang]}
              </span>
              {!qualified && (
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "clamp(9px, 1vw, 11px)",
                    color: "#FF6B6B",
                    opacity: 0.8,
                  }}
                >
                  ({lang === "br" ? "Nao qualifica" : "Doesn't qualify"})
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "clamp(4px, 0.6vw, 8px)",
                justifyContent: "center",
              }}
            >
              {dealerCards.map((card, i) => (
                <PokerCard key={`dealer-${i}`} card={{ ...card, faceUp: true }} index={i} size="normal" />
              ))}
            </div>
          </div>

          {/* Result Overlay */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(8px, 1vw, 12px)",
            }}
          >
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 800,
                fontSize: "clamp(20px, 3vw, 36px)",
                color: resultColor[result],
                letterSpacing: "3px",
                textShadow: `0 0 20px ${result === "win" ? EMERALD.glow : result === "lose" ? "rgba(255,100,100,0.5)" : GOLD.glow}`,
              }}
            >
              {t(resultText[result], lang)}
            </span>
            {payout > 0 && (
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: "clamp(18px, 2.5vw, 30px)",
                  color: EMERALD.light,
                  textShadow: `0 0 15px ${EMERALD.glow}`,
                }}
              >
                +G$ {payout.toLocaleString("pt-BR")}
              </motion.span>
            )}
          </motion.div>

          {/* Player Area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(6px, 0.8vw, 10px)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "clamp(4px, 0.6vw, 8px)",
                justifyContent: "center",
              }}
            >
              {playerCards.map((card, i) => (
                <PokerCard key={`player-${i}`} card={card} index={i} size="normal" />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(8px, 1vw, 12px)",
              }}
            >
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 600,
                  fontSize: "clamp(10px, 1.1vw, 13px)",
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "2px",
                }}
              >
                {t(TEXTS.yourHand, lang)}
              </span>
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: "clamp(11px, 1.2vw, 14px)",
                  color: GOLD.light,
                  letterSpacing: "1px",
                  textShadow: `0 0 8px ${GOLD.glow}`,
                }}
              >
                {HAND_NAMES[playerEval.rank][lang]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* New Hand Button */}
      <div
        style={{
          padding: "clamp(10px, 1.5vw, 18px)",
          background: "linear-gradient(0deg, rgba(8,6,4,0.95) 70%, transparent)",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNewHand}
          animate={{
            boxShadow: [
              `0 0 20px ${GOLD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
              `0 0 30px ${GOLD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
              `0 0 20px ${GOLD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            minWidth: "clamp(180px, 24vw, 280px)",
            minHeight: "52px",
            background: `linear-gradient(180deg, ${GOLD.light} 0%, ${GOLD.primary} 50%, ${GOLD.dark} 100%)`,
            border: `1.5px solid rgba(255,215,0,0.4)`,
            borderRadius: "10px",
            cursor: "pointer",
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(14px, 1.7vw, 20px)",
            color: "#0A0A0A",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          {t(TEXTS.newHand, lang)}
        </motion.button>
      </div>
    </div>
  );
}

// =============================================================================
// UTH - BETTING SCREEN
// =============================================================================

function UTHBettingScreen({
  lang,
  balance,
  ante,
  setAnte,
  tripsActive,
  setTripsActive,
  onDeal,
  onBack,
}: {
  lang: "br" | "en";
  balance: number;
  ante: number;
  setAnte: (v: number) => void;
  tripsActive: boolean;
  setTripsActive: (v: boolean) => void;
  onDeal: () => void;
  onBack: () => void;
}) {
  const blind = ante; // Blind = Ante in UTH
  const trips = tripsActive ? Math.min(ante, 100) : 0;

  const presets = [
    { label: "MIN", action: () => setAnte(10) },
    { label: "2", action: () => setAnte(Math.max(10, Math.floor(ante / 2))) },
    { label: "x2", action: () => setAnte(Math.min(balance / 2, ante * 2)) },
    { label: "MAX", action: () => setAnte(Math.min(balance / 2, 5000)) },
  ];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "clamp(8px, 1.2vw, 16px)",
          gap: "clamp(10px, 1.5vw, 18px)",
          minHeight: 0,
        }}
      >
        {/* Felt Table */}
        <div
          style={{
            flex: 1,
            background: "radial-gradient(ellipse at 50% 40%, #1a3d1a 0%, #0f2a0f 50%, #071507 100%)",
            borderRadius: "clamp(12px, 2vw, 20px)",
            border: "2px solid rgba(212,168,67,0.3)",
            boxShadow: "inset 0 0 40px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.4)",
            padding: "clamp(12px, 2vw, 24px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: 0,
          }}
        >
          {/* Dealer Area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(6px, 0.8vw, 10px)",
            }}
          >
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                fontSize: "clamp(10px, 1.1vw, 13px)",
                color: "rgba(255,255,255,0.25)",
                letterSpacing: "3px",
              }}
            >
              {t(TEXTS.dealer, lang)}
            </span>
            <div
              style={{
                display: "flex",
                gap: "clamp(4px, 0.6vw, 8px)",
              }}
            >
              {[...Array(2)].map((_, i) => (
                <PokerCard key={`dealer-slot-${i}`} card={null} index={i} size="normal" />
              ))}
            </div>
          </div>

          {/* Community Cards Area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(8px, 1vw, 12px)",
            }}
          >
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                fontSize: "clamp(10px, 1.1vw, 13px)",
                color: "rgba(255,255,255,0.25)",
                letterSpacing: "3px",
              }}
            >
              {t(TEXTS.community, lang)}
            </span>
            <div
              style={{
                display: "flex",
                gap: "clamp(4px, 0.6vw, 8px)",
              }}
            >
              {[...Array(5)].map((_, i) => (
                <PokerCard key={`community-slot-${i}`} card={null} index={i} size="small" />
              ))}
            </div>
          </div>

          {/* Player Area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(6px, 0.8vw, 10px)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "clamp(4px, 0.6vw, 8px)",
              }}
            >
              {[...Array(2)].map((_, i) => (
                <PokerCard key={`player-slot-${i}`} card={null} index={i} size="normal" />
              ))}
            </div>
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                fontSize: "clamp(10px, 1.1vw, 13px)",
                color: "rgba(255,255,255,0.25)",
                letterSpacing: "3px",
              }}
            >
              {t(TEXTS.yourCards, lang)}
            </span>
          </div>
        </div>

        {/* Betting Area */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "clamp(16px, 2.5vw, 32px)",
            justifyContent: "center",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          {/* Bet Chips Display */}
          <div
            style={{
              display: "flex",
              gap: "clamp(20px, 3vw, 40px)",
              alignItems: "center",
            }}
          >
            <ChipStack amount={ante} label={t(TEXTS.ante, lang)} />
            <ChipStack amount={blind} label={t(TEXTS.blind, lang)} />
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTripsActive(!tripsActive)}
              style={{ cursor: "pointer" }}
            >
              <ChipStack
                amount={trips}
                label={t(TEXTS.trips, lang)}
                color={tripsActive ? EMERALD.light : "rgba(255,255,255,0.3)"}
              />
            </motion.div>
          </div>

          {/* Chip Selector + Presets */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(8px, 1vw, 12px)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "clamp(8px, 1vw, 12px)",
                alignItems: "center",
              }}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAnte(Math.min(balance / 2, ante + 50))}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <img
                  src={ASSETS.chip}
                  alt=""
                  style={{
                    width: "clamp(44px, 5.5vw, 64px)",
                    height: "clamp(44px, 5.5vw, 64px)",
                    objectFit: "contain",
                    filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
                  }}
                />
              </motion.button>

              {presets.map((preset) => (
                <motion.button
                  key={preset.label}
                  whileHover={{ background: "rgba(212,168,67,0.15)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={preset.action}
                  style={{
                    background: "rgba(212,168,67,0.08)",
                    border: "1px solid rgba(212,168,67,0.25)",
                    borderRadius: "6px",
                    color: GOLD.primary,
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 600,
                    fontSize: "clamp(9px, 1vw, 11px)",
                    minHeight: "36px",
                    minWidth: "44px",
                    padding: "clamp(6px, 0.7vw, 8px) clamp(10px, 1vw, 14px)",
                    cursor: "pointer",
                  }}
                >
                  {preset.label}
                </motion.button>
              ))}
            </div>

            {/* Total Bet Display */}
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: "clamp(14px, 1.6vw, 20px)",
                color: EMERALD.light,
                textShadow: `0 0 10px ${EMERALD.glow}`,
              }}
            >
              {lang === "br" ? "Total:" : "Total:"} G$ {(ante + blind + trips).toLocaleString("pt-BR")}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "clamp(10px, 1.5vw, 18px)",
          background: "linear-gradient(0deg, rgba(8,6,4,0.95) 70%, transparent)",
          display: "flex",
          justifyContent: "center",
          gap: "clamp(12px, 1.5vw, 20px)",
        }}
      >
        <motion.button
          whileHover={{ scale: 1.02, borderColor: "rgba(212,168,67,0.5)" }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          style={{
            minWidth: "clamp(100px, 12vw, 140px)",
            minHeight: "48px",
            background: "rgba(212,168,67,0.08)",
            border: "1px solid rgba(212,168,67,0.25)",
            borderRadius: "10px",
            cursor: "pointer",
            fontFamily: "'Cinzel', serif",
            fontWeight: 600,
            fontSize: "clamp(11px, 1.2vw, 14px)",
            color: GOLD.primary,
            letterSpacing: "1px",
          }}
        >
          {lang === "br" ? "VOLTAR" : "BACK"}
        </motion.button>

        <motion.button
          whileHover={ante > 0 ? { scale: 1.03 } : {}}
          whileTap={ante > 0 ? { scale: 0.97 } : {}}
          onClick={ante > 0 ? onDeal : undefined}
          animate={
            ante > 0
              ? {
                  boxShadow: [
                    `0 0 20px ${EMERALD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
                    `0 0 35px ${EMERALD.glow}, 0 0 12px ${GOLD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
                    `0 0 20px ${EMERALD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
                  ],
                }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            minWidth: "clamp(160px, 22vw, 260px)",
            minHeight: "52px",
            background:
              ante > 0
                ? `linear-gradient(180deg, ${EMERALD.light} 0%, ${EMERALD.primary} 50%, #004D25 100%)`
                : "rgba(100,100,100,0.3)",
            border: ante > 0 ? `1.5px solid rgba(0,230,118,0.4)` : "1px solid rgba(100,100,100,0.3)",
            borderRadius: "10px",
            cursor: ante > 0 ? "pointer" : "not-allowed",
            opacity: ante > 0 ? 1 : 0.35,
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(14px, 1.7vw, 20px)",
            color: "#FFFFFF",
            letterSpacing: "2px",
          }}
        >
          {t(TEXTS.deal, lang)}
        </motion.button>
      </div>
    </div>
  );
}

// =============================================================================
// UTH - PREFLOP SCREEN
// =============================================================================

function UTHPreflopScreen({
  lang,
  playerCards,
  ante,
  blind,
  onBet4x,
  onCheck,
}: {
  lang: "br" | "en";
  playerCards: Card[];
  ante: number;
  blind: number;
  onBet4x: () => void;
  onCheck: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Table */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "clamp(8px, 1.2vw, 16px)",
          minHeight: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            background: "radial-gradient(ellipse at 50% 40%, #1a3d1a 0%, #0f2a0f 50%, #071507 100%)",
            borderRadius: "clamp(12px, 2vw, 20px)",
            border: "2px solid rgba(212,168,67,0.3)",
            boxShadow: "inset 0 0 40px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.4)",
            padding: "clamp(12px, 2vw, 24px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: 0,
          }}
        >
          {/* Dealer Area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(6px, 0.8vw, 10px)",
            }}
          >
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                fontSize: "clamp(10px, 1.1vw, 13px)",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "3px",
              }}
            >
              {t(TEXTS.dealer, lang)}
            </span>
            <div
              style={{
                display: "flex",
                gap: "clamp(4px, 0.6vw, 8px)",
              }}
            >
              {[...Array(2)].map((_, i) => (
                <PokerCard key={`dealer-${i}`} card={{ suit: "spades", rank: "A", faceUp: false }} index={i} size="normal" />
              ))}
            </div>
          </div>

          {/* Community Cards (empty for preflop) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(8px, 1vw, 12px)",
            }}
          >
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                fontSize: "clamp(10px, 1.1vw, 13px)",
                color: "rgba(255,255,255,0.25)",
                letterSpacing: "3px",
              }}
            >
              {t(TEXTS.community, lang)}
            </span>
            <div
              style={{
                display: "flex",
                gap: "clamp(4px, 0.6vw, 8px)",
              }}
            >
              {[...Array(5)].map((_, i) => (
                <PokerCard key={`community-${i}`} card={null} index={i} size="small" />
              ))}
            </div>
          </div>

          {/* Bet Chips Center */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "clamp(24px, 4vw, 48px)",
            }}
          >
            <ChipStack amount={ante} label={t(TEXTS.ante, lang)} />
            <ChipStack amount={blind} label={t(TEXTS.blind, lang)} />
          </div>

          {/* Player Area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(6px, 0.8vw, 10px)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "clamp(6px, 0.8vw, 10px)",
              }}
            >
              {playerCards.map((card, i) => (
                <PokerCard key={`player-${i}`} card={card} index={i} size="large" />
              ))}
            </div>
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                fontSize: "clamp(10px, 1.1vw, 13px)",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "3px",
              }}
            >
              {t(TEXTS.yourCards, lang)}
            </span>
          </div>
        </div>
      </div>

      {/* Phase Indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "clamp(6px, 0.8vw, 10px)",
        }}
      >
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(12px, 1.4vw, 17px)",
            color: GOLD.light,
            letterSpacing: "3px",
            textShadow: `0 0 10px ${GOLD.glow}`,
          }}
        >
          {t(TEXTS.preflop, lang)}
        </span>
      </div>

      {/* Actions */}
      <div
        style={{
          padding: "clamp(10px, 1.5vw, 18px)",
          background: "linear-gradient(0deg, rgba(8,6,4,0.95) 70%, transparent)",
          display: "flex",
          justifyContent: "center",
          gap: "clamp(16px, 2vw, 28px)",
        }}
      >
        {/* Check */}
        <motion.button
          whileHover={{ scale: 1.02, borderColor: "rgba(212,168,67,0.5)" }}
          whileTap={{ scale: 0.98 }}
          onClick={onCheck}
          style={{
            minWidth: "clamp(120px, 16vw, 180px)",
            minHeight: "52px",
            background: "rgba(212,168,67,0.08)",
            border: "1.5px solid rgba(212,168,67,0.3)",
            borderRadius: "10px",
            cursor: "pointer",
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(13px, 1.5vw, 18px)",
            color: GOLD.primary,
            letterSpacing: "2px",
          }}
        >
          {t(TEXTS.check, lang)}
        </motion.button>

        {/* Bet 4x */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBet4x}
          animate={{
            boxShadow: [
              `0 0 20px ${EMERALD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
              `0 0 35px ${EMERALD.glow}, 0 0 12px ${GOLD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
              `0 0 20px ${EMERALD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            minWidth: "clamp(160px, 22vw, 260px)",
            minHeight: "52px",
            background: `linear-gradient(180deg, ${EMERALD.light} 0%, ${EMERALD.primary} 50%, #004D25 100%)`,
            border: `1.5px solid rgba(0,230,118,0.4)`,
            borderRadius: "10px",
            cursor: "pointer",
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(13px, 1.5vw, 18px)",
            color: "#FFFFFF",
            letterSpacing: "2px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
          }}
        >
          <span>{t(TEXTS.bet4x, lang)}</span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "clamp(10px, 1.1vw, 13px)",
              opacity: 0.8,
            }}
          >
            G$ {(ante * 4).toLocaleString("pt-BR")}
          </span>
        </motion.button>
      </div>
    </div>
  );
}

// =============================================================================
// UTH - FLOP SCREEN
// =============================================================================

function UTHFlopScreen({
  lang,
  playerCards,
  communityCards,
  ante,
  blind,
  playBet,
  onBet2x,
  onCheck,
}: {
  lang: "br" | "en";
  playerCards: Card[];
  communityCards: Card[];
  ante: number;
  blind: number;
  playBet: number;
  onBet2x: () => void;
  onCheck: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Table */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "clamp(8px, 1.2vw, 16px)",
          minHeight: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            background: "radial-gradient(ellipse at 50% 40%, #1a3d1a 0%, #0f2a0f 50%, #071507 100%)",
            borderRadius: "clamp(12px, 2vw, 20px)",
            border: "2px solid rgba(212,168,67,0.3)",
            boxShadow: "inset 0 0 40px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.4)",
            padding: "clamp(12px, 2vw, 24px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: 0,
          }}
        >
          {/* Dealer Area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(6px, 0.8vw, 10px)",
            }}
          >
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                fontSize: "clamp(10px, 1.1vw, 13px)",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "3px",
              }}
            >
              {t(TEXTS.dealer, lang)}
            </span>
            <div
              style={{
                display: "flex",
                gap: "clamp(4px, 0.6vw, 8px)",
              }}
            >
              {[...Array(2)].map((_, i) => (
                <PokerCard key={`dealer-${i}`} card={{ suit: "spades", rank: "A", faceUp: false }} index={i} size="normal" />
              ))}
            </div>
          </div>

          {/* Community Cards */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(8px, 1vw, 12px)",
            }}
          >
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                fontSize: "clamp(10px, 1.1vw, 13px)",
                color: GOLD.primary,
                letterSpacing: "3px",
              }}
            >
              {t(TEXTS.community, lang)}
            </span>
            <div
              style={{
                display: "flex",
                gap: "clamp(4px, 0.6vw, 8px)",
              }}
            >
              {communityCards.slice(0, 3).map((card, i) => (
                <PokerCard key={`community-${i}`} card={card} index={i} size="normal" />
              ))}
              {[...Array(2)].map((_, i) => (
                <PokerCard key={`community-empty-${i}`} card={null} index={i + 3} size="normal" />
              ))}
            </div>
          </div>

          {/* Bet Chips Center */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "clamp(16px, 2.5vw, 32px)",
            }}
          >
            <ChipStack amount={ante} label={t(TEXTS.ante, lang)} />
            <ChipStack amount={blind} label={t(TEXTS.blind, lang)} />
            {playBet > 0 && (
              <ChipStack amount={playBet} label={t(TEXTS.bet, lang)} color={EMERALD.light} />
            )}
          </div>

          {/* Player Area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(6px, 0.8vw, 10px)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "clamp(6px, 0.8vw, 10px)",
              }}
            >
              {playerCards.map((card, i) => (
                <PokerCard key={`player-${i}`} card={card} index={i} size="large" />
              ))}
            </div>
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                fontSize: "clamp(10px, 1.1vw, 13px)",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "3px",
              }}
            >
              {t(TEXTS.yourCards, lang)}
            </span>
          </div>
        </div>
      </div>

      {/* Phase Indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "clamp(6px, 0.8vw, 10px)",
        }}
      >
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(12px, 1.4vw, 17px)",
            color: GOLD.light,
            letterSpacing: "3px",
            textShadow: `0 0 10px ${GOLD.glow}`,
          }}
        >
          {t(TEXTS.flop, lang)}
        </span>
      </div>

      {/* Actions */}
      <div
        style={{
          padding: "clamp(10px, 1.5vw, 18px)",
          background: "linear-gradient(0deg, rgba(8,6,4,0.95) 70%, transparent)",
          display: "flex",
          justifyContent: "center",
          gap: "clamp(16px, 2vw, 28px)",
        }}
      >
        <motion.button
          whileHover={{ scale: 1.02, borderColor: "rgba(212,168,67,0.5)" }}
          whileTap={{ scale: 0.98 }}
          onClick={onCheck}
          disabled={playBet > 0}
          style={{
            minWidth: "clamp(120px, 16vw, 180px)",
            minHeight: "52px",
            background: "rgba(212,168,67,0.08)",
            border: "1.5px solid rgba(212,168,67,0.3)",
            borderRadius: "10px",
            cursor: playBet > 0 ? "not-allowed" : "pointer",
            opacity: playBet > 0 ? 0.35 : 1,
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(13px, 1.5vw, 18px)",
            color: GOLD.primary,
            letterSpacing: "2px",
          }}
        >
          {t(TEXTS.check, lang)}
        </motion.button>

        <motion.button
          whileHover={playBet === 0 ? { scale: 1.03 } : {}}
          whileTap={playBet === 0 ? { scale: 0.97 } : {}}
          onClick={playBet === 0 ? onBet2x : undefined}
          disabled={playBet > 0}
          animate={
            playBet === 0
              ? {
                  boxShadow: [
                    `0 0 20px ${EMERALD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
                    `0 0 35px ${EMERALD.glow}, 0 0 12px ${GOLD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
                    `0 0 20px ${EMERALD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
                  ],
                }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            minWidth: "clamp(160px, 22vw, 260px)",
            minHeight: "52px",
            background:
              playBet === 0
                ? `linear-gradient(180deg, ${EMERALD.light} 0%, ${EMERALD.primary} 50%, #004D25 100%)`
                : "rgba(100,100,100,0.3)",
            border: playBet === 0 ? `1.5px solid rgba(0,230,118,0.4)` : "1px solid rgba(100,100,100,0.3)",
            borderRadius: "10px",
            cursor: playBet > 0 ? "not-allowed" : "pointer",
            opacity: playBet > 0 ? 0.35 : 1,
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(13px, 1.5vw, 18px)",
            color: "#FFFFFF",
            letterSpacing: "2px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
          }}
        >
          <span>{t(TEXTS.bet2x, lang)}</span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "clamp(10px, 1.1vw, 13px)",
              opacity: 0.8,
            }}
          >
            G$ {(ante * 2).toLocaleString("pt-BR")}
          </span>
        </motion.button>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PokerGame({ onBack, onDeposit, lang: propLang }: PokerGameProps) {
  const { lang: contextLang, saldo, setSaldo } = useCasino();
  const lang = (propLang || contextLang || "br") as "br" | "en";
  const balance = saldo ?? 8250;

  // Core State
  const [phase, setPhase] = useState<PokerPhase>("MODE_SELECT");
  const [mode, setMode] = useState<PokerMode | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Betting State
  const [ante, setAnte] = useState(100);
  const [jackpotActive, setJackpotActive] = useState(false);
  const [tripsActive, setTripsActive] = useState(false);
  const [playBet, setPlayBet] = useState(0);

  // Cards State
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);

  // Result State
  const [result, setResult] = useState<"win" | "lose" | "push" | "no_qualify">("win");
  const [payout, setPayout] = useState(0);

  // Constants
  const jackpotPool = 12450;

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSelectMode = useCallback((selectedMode: PokerMode) => {
    setMode(selectedMode);
    setPhase(selectedMode === "caribbean" ? "CARIBBEAN_BETTING" : "UTH_BETTING");
  }, []);

  const handleBackToModeSelect = useCallback(() => {
    setPhase("MODE_SELECT");
    setMode(null);
    setPlayerCards([]);
    setDealerCards([]);
    setCommunityCards([]);
    setPlayBet(0);
  }, []);

  // Caribbean Stud Handlers
  const handleCaribbeanDeal = useCallback(() => {
    const newDeck = shuffleDeck(createDeck());
    const { cards: pCards, remaining: r1 } = dealCards(newDeck, 5, true);
    const { cards: dCards, remaining: r2 } = dealCards(r1, 5, false);
    // First dealer card is face up
    dCards[0].faceUp = true;

    setDeck(r2);
    setPlayerCards(pCards);
    setDealerCards(dCards);
    setPhase("CARIBBEAN_PLAYING");
  }, []);

  const handleCaribbeanFold = useCallback(() => {
    // Lose ante
    setResult("lose");
    setPayout(0);
    setPhase("CARIBBEAN_RESULT");
  }, []);

  const handleCaribbeanRaise = useCallback(() => {
    // Reveal all dealer cards
    const revealedDealer = dealerCards.map(c => ({ ...c, faceUp: true }));
    setDealerCards(revealedDealer);

    const playerEval = evaluateHand(playerCards);
    const dealerEval = evaluateHand(revealedDealer);
    const qualified = dealerQualifies(revealedDealer);

    if (!qualified) {
      // Dealer doesn't qualify - ante pays 1:1, raise pushes
      setResult("no_qualify");
      setPayout(ante);
    } else if (playerEval.score > dealerEval.score) {
      // Player wins
      const raiseBet = ante * 2;
      const winPayout = ante + raiseBet * 2; // Simplified payout
      setResult("win");
      setPayout(winPayout);
    } else if (playerEval.score < dealerEval.score) {
      // Dealer wins
      setResult("lose");
      setPayout(0);
    } else {
      // Push
      setResult("push");
      setPayout(ante + ante * 2);
    }

    setPhase("CARIBBEAN_RESULT");
  }, [dealerCards, playerCards, ante]);

  const handleNewHand = useCallback(() => {
    setPhase(mode === "caribbean" ? "CARIBBEAN_BETTING" : "UTH_BETTING");
    setPlayerCards([]);
    setDealerCards([]);
    setCommunityCards([]);
    setPlayBet(0);
    setPayout(0);
  }, [mode]);

  // UTH Handlers
  const handleUTHDeal = useCallback(() => {
    const newDeck = shuffleDeck(createDeck());
    const { cards: pCards, remaining: r1 } = dealCards(newDeck, 2, true);
    const { cards: dCards, remaining: r2 } = dealCards(r1, 2, false);
    const { cards: cCards, remaining: r3 } = dealCards(r2, 5, false);

    setDeck(r3);
    setPlayerCards(pCards);
    setDealerCards(dCards);
    setCommunityCards(cCards);
    setPhase("UTH_PREFLOP");
  }, []);

  const handleBet4x = useCallback(() => {
    setPlayBet(ante * 4);
    // Reveal flop
    const revealed = [...communityCards];
    revealed[0].faceUp = true;
    revealed[1].faceUp = true;
    revealed[2].faceUp = true;
    setCommunityCards(revealed);
    setPhase("UTH_FLOP");
  }, [ante, communityCards]);

  const handlePreflopCheck = useCallback(() => {
    // Reveal flop
    const revealed = [...communityCards];
    revealed[0].faceUp = true;
    revealed[1].faceUp = true;
    revealed[2].faceUp = true;
    setCommunityCards(revealed);
    setPhase("UTH_FLOP");
  }, [communityCards]);

  const handleBet2x = useCallback(() => {
    setPlayBet(ante * 2);
    // Continue to river (simplified - would normally go through turn)
  }, [ante]);

  const handleFlopCheck = useCallback(() => {
    // Continue to river
  }, []);

  // Header actions
  const headerActions = useMemo(() => [
    ...(mode ? [{
      id: "mode",
      icon: ASSETS.iconMode,
      tooltip: lang === "br" ? "Trocar modo" : "Switch mode",
      onClick: handleBackToModeSelect,
    }] : []),
    {
      id: "rules",
      icon: ASSETS.iconRules,
      tooltip: t(TEXTS.rules, lang),
      onClick: () => {},
    },
    {
      id: "paytable",
      icon: ASSETS.iconPaytable,
      tooltip: t(TEXTS.paytable, lang),
      onClick: () => {},
    },
    {
      id: "sound",
      icon: soundEnabled ? ASSETS.iconSoundOn : ASSETS.iconSoundOff,
      tooltip: soundEnabled ? t(TEXTS.soundOn, lang) : t(TEXTS.soundOff, lang),
      onClick: () => setSoundEnabled(s => !s),
    },
  ], [mode, lang, soundEnabled, handleBackToModeSelect]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div
      style={{
        position: "absolute",
        inset: "6px",
        zIndex: 60,
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#080604",
        backgroundImage: `url('${ASSETS.bgCasino}'), radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,168,67,0.03) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(0,0,0,0.5) 0%, transparent 70%)`,
        backgroundSize: "cover, 100% 100%, 100% 100%",
        border: "1.5px solid rgba(212,168,67,0.35)",
        boxShadow: "inset 0 0 80px rgba(0,0,0,0.9), inset 0 0 2px rgba(212,168,67,0.15), 0 0 0 3px rgba(6,5,3,0.95), 0 0 0 4.5px rgba(212,168,67,0.2), 0 0 0 8px rgba(6,5,3,0.9), 0 0 30px rgba(212,168,67,0.06)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <GameHeader
        onBack={onBack}
        title={t(TEXTS.title, lang)}
        balance={balance}
        lang={lang}
        actions={headerActions}
      />

      {/* Game Area */}
      <div
        style={{
          position: "relative",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <AnimatePresence mode="wait">
          {/* MODE SELECT */}
          {phase === "MODE_SELECT" && (
            <motion.div
              key="mode-select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: "absolute", inset: 0 }}
            >
              <ModeSelectScreen lang={lang} onSelectMode={handleSelectMode} />
            </motion.div>
          )}

          {/* CARIBBEAN BETTING */}
          {phase === "CARIBBEAN_BETTING" && (
            <motion.div
              key="caribbean-betting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: "absolute", inset: 0 }}
            >
              <CaribbeanBettingScreen
                lang={lang}
                balance={balance}
                ante={ante}
                setAnte={setAnte}
                jackpotPool={jackpotPool}
                jackpotActive={jackpotActive}
                setJackpotActive={setJackpotActive}
                onDeal={handleCaribbeanDeal}
                onBack={handleBackToModeSelect}
              />
            </motion.div>
          )}

          {/* CARIBBEAN PLAYING */}
          {phase === "CARIBBEAN_PLAYING" && (
            <motion.div
              key="caribbean-playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: "absolute", inset: 0 }}
            >
              <CaribbeanPlayingScreen
                lang={lang}
                playerCards={playerCards}
                dealerCards={dealerCards}
                ante={ante}
                onFold={handleCaribbeanFold}
                onRaise={handleCaribbeanRaise}
              />
            </motion.div>
          )}

          {/* CARIBBEAN RESULT */}
          {phase === "CARIBBEAN_RESULT" && (
            <motion.div
              key="caribbean-result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: "absolute", inset: 0 }}
            >
              <CaribbeanResultScreen
                lang={lang}
                playerCards={playerCards}
                dealerCards={dealerCards}
                ante={ante}
                raised={true}
                result={result}
                payout={payout}
                onNewHand={handleNewHand}
              />
            </motion.div>
          )}

          {/* UTH BETTING */}
          {phase === "UTH_BETTING" && (
            <motion.div
              key="uth-betting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: "absolute", inset: 0 }}
            >
              <UTHBettingScreen
                lang={lang}
                balance={balance}
                ante={ante}
                setAnte={setAnte}
                tripsActive={tripsActive}
                setTripsActive={setTripsActive}
                onDeal={handleUTHDeal}
                onBack={handleBackToModeSelect}
              />
            </motion.div>
          )}

          {/* UTH PREFLOP */}
          {phase === "UTH_PREFLOP" && (
            <motion.div
              key="uth-preflop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: "absolute", inset: 0 }}
            >
              <UTHPreflopScreen
                lang={lang}
                playerCards={playerCards}
                ante={ante}
                blind={ante}
                onBet4x={handleBet4x}
                onCheck={handlePreflopCheck}
              />
            </motion.div>
          )}

          {/* UTH FLOP */}
          {phase === "UTH_FLOP" && (
            <motion.div
              key="uth-flop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: "absolute", inset: 0 }}
            >
              <UTHFlopScreen
                lang={lang}
                playerCards={playerCards}
                communityCards={communityCards}
                ante={ante}
                blind={ante}
                playBet={playBet}
                onBet2x={handleBet2x}
                onCheck={handleFlopCheck}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
