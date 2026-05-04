"use client";

// PokerGame — Jogo de Poker do Blackout Casino
// Telas 1-2: MODE_SELECT e CARIBBEAN_BETTING
// Criado em 05/05/2026

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameHeader } from "@/components/shared";
import { useCasino } from "@/contexts/CasinoContext";

// =============================================================================
// TYPES
// =============================================================================

type PokerPhase = "MODE_SELECT" | "CARIBBEAN_BETTING";

type PokerMode = "caribbean" | "uth";

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
  iconCardsSpread: "/assets/shared/icons/icon-cards-spread.png",
  iconChipStack: "/assets/shared/icons/icon-chip-stack.png",
  iconJackpot: "/assets/shared/icons/icon-jackpot.png",
  iconSoundOn: "/assets/shared/icons/icon-sound-on.png",
  iconSoundOff: "/assets/shared/icons/icon-sound-off.png",
  iconRules: "/assets/shared/icons/icon-rules.png",
  iconPaytable: "/assets/shared/icons/icon-paytable.png",
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
// TEXTS
// =============================================================================

const TEXTS = {
  title: { br: "POKER", en: "POKER" },
  selectMode: { br: "ESCOLHA O MODO", en: "SELECT MODE" },
  caribbeanStud: { br: "CARIBBEAN STUD", en: "CARIBBEAN STUD" },
  caribbeanSub: { br: "5 cartas · Fold ou Raise", en: "5 cards · Fold or Raise" },
  ultimateHoldem: { br: "ULTIMATE HOLD'EM", en: "ULTIMATE HOLD'EM" },
  ultimateSub: { br: "2+5 cartas · 3 decisões", en: "2+5 cards · 3 decisions" },
  play: { br: "JOGAR", en: "PLAY" },
  dealer: { br: "DEALER", en: "DEALER" },
  yourHand: { br: "SUA MÃO", en: "YOUR HAND" },
  ante: { br: "ANTE:", en: "ANTE:" },
  jackpot: { br: "JACKPOT", en: "JACKPOT" },
  activate: { br: "ATIVAR", en: "ACTIVATE" },
  active: { br: "ATIVO", en: "ACTIVE" },
  deal: { br: "DISTRIBUIR", en: "DEAL" },
  perHand: { br: "G$ 1/mão", en: "G$ 1/hand" },
  rules: { br: "Regras do jogo", en: "Game rules" },
  paytable: { br: "Tabela de pagamentos", en: "Paytable" },
  soundOn: { br: "Desativar som", en: "Mute sound" },
  soundOff: { br: "Ativar som", en: "Enable sound" },
};

function t(obj: { br: string; en: string }, lang: "br" | "en"): string {
  return obj[lang] || obj.en;
}

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK = {
  balance: 8250,
  ante: 100,
  jackpotPool: 12450,
  jackpotActive: false,
};

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
      icon: ASSETS.iconCardsSpread,
      title: t(TEXTS.caribbeanStud, lang),
      subtitle: t(TEXTS.caribbeanSub, lang),
      houseEdge: "House Edge: 5.2%",
      edgeColor: GOLD.primary,
    },
    {
      id: "uth" as PokerMode,
      icon: ASSETS.iconChipStack,
      title: t(TEXTS.ultimateHoldem, lang),
      subtitle: t(TEXTS.ultimateSub, lang),
      houseEdge: "House Edge: 2.2%",
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
            transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
            whileHover={{
              scale: 1.04,
              y: -6,
              borderColor: "rgba(212,168,67,0.6)",
              boxShadow: `0 0 30px ${GOLD.glow}, 0 8px 32px rgba(0,0,0,0.6)`,
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectMode(mode.id)}
            style={{
              width: "clamp(200px, 26vw, 320px)",
              aspectRatio: "3/4",
              borderRadius: "16px",
              overflow: "hidden",
              cursor: "pointer",
              border: `1px solid rgba(212,168,67,0.2)`,
              background: "linear-gradient(160deg, #141210 0%, #0D0B08 100%)",
              boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              padding: 0,
            }}
          >
            {/* Inner border glow */}
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
              {/* Icon */}
              <img
                src={mode.icon}
                alt=""
                style={{
                  width: "clamp(64px, 8vw, 100px)",
                  height: "clamp(64px, 8vw, 100px)",
                  objectFit: "contain",
                  filter: `drop-shadow(0 0 12px ${GOLD.glow})`,
                }}
              />

              {/* Title */}
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 800,
                  fontSize: "clamp(12px, 1.4vw, 17px)",
                  color: GOLD.light,
                  letterSpacing: "2px",
                  textAlign: "center",
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
                }}
              >
                {mode.subtitle}
              </span>

              {/* House Edge */}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  fontSize: "clamp(9px, 0.9vw, 11px)",
                  color: mode.edgeColor,
                  opacity: 0.8,
                }}
              >
                {mode.houseEdge}
              </span>
            </div>

            {/* Footer with Play Button */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "clamp(12px, 1.5vw, 20px)",
                background: "linear-gradient(0deg, rgba(8,6,4,0.95) 60%, transparent)",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: `linear-gradient(180deg, ${EMERALD.light}, ${EMERALD.primary})`,
                  borderRadius: "8px",
                  padding: "clamp(6px, 0.8vw, 10px) clamp(20px, 2.5vw, 32px)",
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
              </motion.span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// CARIBBEAN BETTING SCREEN
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
}: {
  lang: "br" | "en";
  balance: number;
  ante: number;
  setAnte: (v: number) => void;
  jackpotPool: number;
  jackpotActive: boolean;
  setJackpotActive: (v: boolean) => void;
  onDeal: () => void;
}) {
  const presets = [
    { label: "MIN", action: () => setAnte(10) },
    { label: "÷2", action: () => setAnte(Math.max(10, Math.floor(ante / 2))) },
    { label: "×2", action: () => setAnte(Math.min(balance, ante * 2)) },
    { label: "MAX", action: () => setAnte(Math.min(balance, 10000)) },
  ];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        padding: "clamp(8px, 1.2vw, 16px)",
        gap: "clamp(8px, 1vw, 14px)",
      }}
    >
      {/* Main Area: Table + Side Bet */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          gap: "clamp(12px, 2vw, 24px)",
          minHeight: 0,
        }}
      >
        {/* Left Column: Table + Betting */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "clamp(10px, 1.5vw, 18px)",
            minWidth: 0,
          }}
        >
          {/* Table */}
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
              gap: "clamp(10px, 1.5vw, 18px)",
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
                  fontSize: "clamp(9px, 1vw, 12px)",
                  color: "rgba(255,255,255,0.2)",
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
                  <div
                    key={`dealer-slot-${i}`}
                    style={{
                      width: "clamp(40px, 5.5vw, 70px)",
                      aspectRatio: "5/7",
                      background: "rgba(212,168,67,0.05)",
                      border: "1px dashed rgba(212,168,67,0.15)",
                      borderRadius: "6px",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Divider */}
            <img
              src={ASSETS.dividerGold}
              alt=""
              style={{
                width: "80%",
                alignSelf: "center",
                opacity: 0.4,
                objectFit: "contain",
              }}
            />

            {/* Player Area */}
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
                  fontSize: "clamp(9px, 1vw, 12px)",
                  color: "rgba(255,255,255,0.2)",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                }}
              >
                {t(TEXTS.yourHand, lang)}
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
                  <div
                    key={`player-slot-${i}`}
                    style={{
                      width: "clamp(40px, 5.5vw, 70px)",
                      aspectRatio: "5/7",
                      background: "rgba(212,168,67,0.05)",
                      border: "1px dashed rgba(212,168,67,0.15)",
                      borderRadius: "6px",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Betting Area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(10px, 1.2vw, 16px)",
            }}
          >
            {/* Current Ante Display */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <img
                src={ASSETS.iconChipStack}
                alt=""
                style={{
                  width: "20px",
                  height: "20px",
                  objectFit: "contain",
                }}
              />
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 600,
                  fontSize: "clamp(10px, 1.1vw, 13px)",
                  color: GOLD.primary,
                }}
              >
                {t(TEXTS.ante, lang)}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: "clamp(14px, 1.8vw, 22px)",
                  color: EMERALD.light,
                  textShadow: `0 0 8px ${EMERALD.glow}`,
                }}
              >
                G$ {ante.toLocaleString("pt-BR")}
              </span>
            </div>

            {/* Chip Selector */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "clamp(6px, 0.8vw, 12px)",
                justifyContent: "center",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {/* Single Chip */}
              <motion.button
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setAnte(Math.min(balance, ante + 100))}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <img
                  src={ASSETS.chip}
                  alt=""
                  style={{
                    width: "clamp(44px, 6vw, 72px)",
                    height: "clamp(44px, 6vw, 72px)",
                    objectFit: "contain",
                    filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: "clamp(9px, 0.9vw, 11px)",
                    color: EMERALD.light,
                  }}
                >
                  G$ 100
                </span>
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
                    border: "1px solid rgba(212,168,67,0.2)",
                    borderRadius: "6px",
                    color: GOLD.primary,
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 600,
                    fontSize: "clamp(9px, 0.9vw, 11px)",
                    minHeight: "36px",
                    minWidth: "44px",
                    padding: "clamp(6px, 0.6vw, 8px) clamp(10px, 1vw, 14px)",
                    cursor: "pointer",
                  }}
                >
                  {preset.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Side Bet Jackpot */}
        <div
          style={{
            flex: "0 0 auto",
            width: "clamp(120px, 16vw, 200px)",
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
              gap: "8px",
              height: "100%",
            }}
          >
            {/* Jackpot Icon */}
            <motion.img
              src={ASSETS.iconJackpot}
              alt=""
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: "clamp(32px, 4vw, 52px)",
                height: "clamp(32px, 4vw, 52px)",
                objectFit: "contain",
                filter: `drop-shadow(0 0 8px ${GOLD.glow})`,
              }}
            />

            {/* Jackpot Label */}
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: "clamp(9px, 1vw, 12px)",
                color: GOLD.light,
                letterSpacing: "2px",
              }}
            >
              {t(TEXTS.jackpot, lang)}
            </span>

            {/* Jackpot Value */}
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: "clamp(11px, 1.3vw, 16px)",
                color: GOLD.light,
                textShadow: `0 0 10px ${GOLD.glow}`,
              }}
            >
              G$ {jackpotPool.toLocaleString("pt-BR")}
            </span>

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
                border: jackpotActive
                  ? `1.5px solid ${GOLD.primary}`
                  : "1px dashed rgba(212,168,67,0.2)",
                background: jackpotActive
                  ? "rgba(212,168,67,0.1)"
                  : "transparent",
                boxShadow: jackpotActive
                  ? `0 0 10px rgba(212,168,67,0.2)`
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
                  fontSize: "clamp(9px, 1vw, 12px)",
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
          padding: "clamp(8px, 1.2vw, 16px)",
          background: "linear-gradient(0deg, rgba(8,6,4,0.95) 70%, transparent)",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <motion.button
          whileHover={ante > 0 ? { scale: 1.03 } : {}}
          whileTap={ante > 0 ? { scale: 0.97 } : {}}
          onClick={ante > 0 ? onDeal : undefined}
          animate={
            ante > 0
              ? {
                  boxShadow: [
                    `0 0 20px ${EMERALD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
                    `0 0 30px ${EMERALD.glow}, 0 0 10px ${GOLD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
                    `0 0 20px ${EMERALD.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
                  ],
                }
              : {}
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            width: "clamp(160px, 22vw, 260px)",
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
            fontSize: "clamp(13px, 1.6vw, 18px)",
            color: "#FFFFFF",
            letterSpacing: "2px",
            textTransform: "uppercase",
            boxShadow:
              ante > 0
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
// MAIN COMPONENT
// =============================================================================

export default function PokerGame({ onBack, onDeposit, lang: propLang }: PokerGameProps) {
  const { lang: contextLang, saldo } = useCasino();
  const lang = (propLang || contextLang || "br") as "br" | "en";
  const balance = saldo ?? MOCK.balance;

  // State
  const [phase, setPhase] = useState<PokerPhase>("MODE_SELECT");
  const [mode, setMode] = useState<PokerMode | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ante, setAnte] = useState(MOCK.ante);
  const [jackpotActive, setJackpotActive] = useState(MOCK.jackpotActive);

  // Handlers
  const handleSelectMode = (selectedMode: PokerMode) => {
    setMode(selectedMode);
    if (selectedMode === "caribbean") {
      setPhase("CARIBBEAN_BETTING");
    }
    // UTH will be added in future screens
  };

  const handleDeal = () => {
    // Will be implemented in future screens
    console.log("[v0] Deal pressed with ante:", ante, "jackpot:", jackpotActive);
  };

  // Header actions
  const headerActions = [
    {
      id: "rules",
      icon: ASSETS.iconRules,
      tooltip: t(TEXTS.rules, lang),
      onClick: () => console.log("[v0] Rules clicked"),
    },
    {
      id: "paytable",
      icon: ASSETS.iconPaytable,
      tooltip: t(TEXTS.paytable, lang),
      onClick: () => console.log("[v0] Paytable clicked"),
    },
    {
      id: "sound",
      icon: soundEnabled ? ASSETS.iconSoundOn : ASSETS.iconSoundOff,
      tooltip: soundEnabled ? t(TEXTS.soundOn, lang) : t(TEXTS.soundOff, lang),
      onClick: () => setSoundEnabled((s) => !s),
    },
  ];

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
        boxShadow:
          "inset 0 0 80px rgba(0,0,0,0.9), inset 0 0 2px rgba(212,168,67,0.15), 0 0 0 3px rgba(6,5,3,0.95), 0 0 0 4.5px rgba(212,168,67,0.2), 0 0 0 8px rgba(6,5,3,0.9), 0 0 30px rgba(212,168,67,0.06)",
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
          {/* Screen 1: Mode Select */}
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

          {/* Screen 2: Caribbean Betting */}
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
                jackpotPool={MOCK.jackpotPool}
                jackpotActive={jackpotActive}
                setJackpotActive={setJackpotActive}
                onDeal={handleDeal}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
