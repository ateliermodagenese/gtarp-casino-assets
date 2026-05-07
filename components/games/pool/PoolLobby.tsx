"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameHeader } from "@/components/shared";
import PoolTable from "./PoolTable";

// ===========================================================================
// POOL LOBBY — Tela inicial do Pool Game (#22)
// Selecao de modo, tier de aposta, e busca de oponente
// CSS inline, zero Tailwind, Framer Motion
// ===========================================================================

type Lang = "br" | "in";
type GameMode = "8ball" | "9ball";
type Screen = "lobby" | "matchmaking" | "game";

interface Tier {
  id: number;
  name: { br: string; in: string };
  entry: number;
  pot: number;
}

// ===========================================================================
// CONSTANTES
// ===========================================================================

const ASSETS = {
  bgCasino: "/assets/shared/ui/bg-casino.png",
  bgPoolRoom: "/assets/games/pool/bg-pool-room.png",
  iconGcoin: "/assets/shared/icons/icon-gcoin.png",
  iconRules: "/assets/shared/icons/icon-rules.png",
};

const TIERS: Tier[] = [
  { id: 1, name: { br: "Amadora", in: "Amateur" }, entry: 250, pot: 500 },
  { id: 2, name: { br: "Casual", in: "Casual" }, entry: 500, pot: 1000 },
  { id: 3, name: { br: "Profissional", in: "Professional" }, entry: 1000, pot: 2000 },
  { id: 4, name: { br: "VIP", in: "VIP" }, entry: 2500, pot: 5000 },
  { id: 5, name: { br: "High Roller", in: "High Roller" }, entry: 5000, pot: 10000 },
];

const TEXTS = {
  title: { br: "POOL GAME", in: "POOL GAME" },
  subtitle: { br: "SINUCA PvP", in: "PvP POOL" },
  tagline: { br: "O primeiro jogo de habilidade do casino", in: "The first skill-based game in the casino" },
  findOpponent: { br: "ENCONTRAR OPONENTE", in: "FIND OPPONENT" },
  rake: { br: "Rake: 5%", in: "Rake: 5%" },
  skillBased: { br: "Skill-based • Sem RNG", in: "Skill-based • No RNG" },
};

const GOLD = {
  primary: "#D4A843",
  light: "#FFD700",
  dark: "#8B6914",
  glow: "rgba(212,168,67,0.5)",
};

const EMERALD = {
  primary: "#00C853",
  light: "#00E676",
  dark: "#004D25",
};

// ===========================================================================
// HELPERS
// ===========================================================================

function formatCurrency(val: number): string {
  if (val >= 1000) {
    return `G$${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}K`;
  }
  return `G$${val}`;
}

// ===========================================================================
// COMPONENT
// ===========================================================================

export default function PoolGame({
  onBack,
  onFindMatch,
  initialBalance,
  lang,
}: {
  onBack: () => void;
  onFindMatch?: (mode: GameMode, tier: Tier) => void;
  initialBalance: number;
  lang: Lang;
}) {
  const [screen, setScreen] = useState<Screen>("lobby");
  const [selectedMode, setSelectedMode] = useState<GameMode>("8ball");
  const [selectedTierId, setSelectedTierId] = useState<number>(3); // Profissional default
  const [balance, setBalance] = useState(initialBalance);

  const selectedTier = TIERS.find((t) => t.id === selectedTierId)!;
  const canAfford = balance >= selectedTier.entry;

  const handleFindMatch = () => {
    if (!canAfford) return;
    
    // Deduz entry fee do saldo
    setBalance((prev) => prev - selectedTier.entry);
    
    // Callback externo se existir
    if (onFindMatch) {
      onFindMatch(selectedMode, selectedTier);
    }
    
    // Vai direto para o jogo (futuramente pode ter matchmaking screen)
    setScreen("game");
  };

  const handleBackFromGame = () => {
    setScreen("lobby");
  };

  const handleGameEnd = (won: boolean) => {
    if (won) {
      // Winner takes pot minus 5% rake
      const winnings = Math.floor(selectedTier.pot * 0.95);
      setBalance((prev) => prev + winnings);
    }
    setScreen("lobby");
  };

  // =========================================================================
  // RENDER GAME SCREEN
  // =========================================================================
  if (screen === "game") {
    return (
      <PoolTable
        onBack={handleBackFromGame}
        onGameEnd={handleGameEnd}
        pot={selectedTier.pot}
        mode={selectedMode}
        lang={lang}
        balance={balance}
      />
    );
  }

  // =========================================================================
  // RENDER LOBBY SCREEN
  // =========================================================================
  return (
    <div
      style={{
        position: "absolute",
        inset: "6px",
        zIndex: 60,
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#080604",
        backgroundImage: `url('${ASSETS.bgCasino}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Overlay decorativo bg-pool-room */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "35%",
          backgroundImage: `url('${ASSETS.bgPoolRoom}')`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          opacity: 0.15,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* HEADER */}
      <GameHeader
        onBack={onBack}
        title={TEXTS.title[lang]}
        balance={balance}
        lang={lang}
        actions={[]}
      />

      {/* CONTEUDO PRINCIPAL */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "clamp(16px, 2vw, 28px) clamp(12px, 2vw, 24px)",
          position: "relative",
          zIndex: 1,
          overflowY: "auto",
          gap: "clamp(16px, 2vw, 24px)",
        }}
      >
        {/* TITULO SINUCA PvP */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <h2
            style={{
              fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
              fontWeight: 900,
              fontSize: "clamp(22px, 4vw, 40px)",
              color: GOLD.primary,
              margin: 0,
              textShadow: `0 0 25px ${GOLD.glow}, 0 2px 10px rgba(0,0,0,1)`,
              letterSpacing: "2px",
            }}
          >
            {TEXTS.subtitle[lang]}
          </h2>

          {/* Linha decorativa */}
          <div
            style={{
              width: "120px",
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${GOLD.primary}, transparent)`,
              margin: "8px auto",
            }}
          />

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(10px, 1.2vw, 14px)",
              color: "rgba(255,255,255,0.45)",
              margin: 0,
            }}
          >
            {TEXTS.tagline[lang]}
          </p>
        </div>

        {/* SELETOR DE MODO */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          {/* 8-BALL */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedMode("8ball")}
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              cursor: "pointer",
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: "clamp(11px, 1.4vw, 16px)",
              letterSpacing: "1px",
              transition: "all 0.2s",
              ...(selectedMode === "8ball"
                ? {
                    background: `linear-gradient(180deg, ${EMERALD.light}, ${EMERALD.dark})`,
                    border: `1.5px solid rgba(0,230,118,0.4)`,
                    color: "#FFFFFF",
                    boxShadow: `0 0 15px rgba(0,230,118,0.25)`,
                  }
                : {
                    background: "rgba(5,5,5,0.7)",
                    border: `1.5px solid rgba(212,168,67,0.2)`,
                    color: GOLD.primary,
                  }),
            }}
          >
            8-BALL
          </motion.button>

          {/* 9-BALL */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedMode("9ball")}
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              cursor: "pointer",
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: "clamp(11px, 1.4vw, 16px)",
              letterSpacing: "1px",
              transition: "all 0.2s",
              ...(selectedMode === "9ball"
                ? {
                    background: `linear-gradient(180deg, ${EMERALD.light}, ${EMERALD.dark})`,
                    border: `1.5px solid rgba(0,230,118,0.4)`,
                    color: "#FFFFFF",
                    boxShadow: `0 0 15px rgba(0,230,118,0.25)`,
                  }
                : {
                    background: "rgba(5,5,5,0.7)",
                    border: `1.5px solid rgba(212,168,67,0.2)`,
                    color: GOLD.primary,
                  }),
            }}
          >
            9-BALL
          </motion.button>
        </div>

        {/* TIERS DE APOSTA */}
        <div
          style={{
            display: "flex",
            gap: "clamp(8px, 1vw, 12px)",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            width: "100%",
            maxWidth: "900px",
            padding: "8px 4px",
            justifyContent: "center",
            flexWrap: "nowrap",
          }}
        >
          {TIERS.map((tier) => {
            const isSelected = tier.id === selectedTierId;
            const affordable = balance >= tier.entry;

            return (
              <motion.button
                key={tier.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTierId(tier.id)}
                style={{
                  width: "clamp(130px, 18vw, 170px)",
                  flexShrink: 0,
                  background: "rgba(15,12,5,0.95)",
                  border: isSelected
                    ? `1.5px solid rgba(212,168,67,0.6)`
                    : `1.5px solid rgba(212,168,67,0.18)`,
                  borderRadius: "10px",
                  padding: "clamp(12px, 1.5vw, 20px)",
                  scrollSnapAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: isSelected
                    ? `0 0 20px rgba(212,168,67,0.10)`
                    : "none",
                  opacity: affordable ? 1 : 0.5,
                }}
              >
                {/* Nome do tier */}
                <span
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 700,
                    fontSize: "clamp(9px, 1.1vw, 13px)",
                    color: GOLD.primary,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {tier.name[lang]}
                </span>

                {/* Entry fee */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <img
                    src={ASSETS.iconGcoin}
                    alt=""
                    style={{
                      width: "14px",
                      height: "14px",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 800,
                      fontSize: "clamp(14px, 2vw, 22px)",
                      color: EMERALD.light,
                    }}
                  >
                    {formatCurrency(tier.entry)}
                  </span>
                </div>

                {/* Pot */}
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                    fontSize: "clamp(9px, 1vw, 12px)",
                    color: "rgba(255,255,255,0.45)",
                  }}
                >
                  Pot: {formatCurrency(tier.pot)}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* BOTAO ENCONTRAR OPONENTE */}
        <motion.button
          whileHover={{ scale: canAfford ? 1.03 : 1 }}
          whileTap={{ scale: canAfford ? 0.97 : 1 }}
          onClick={handleFindMatch}
          disabled={!canAfford}
          style={{
            minHeight: "52px",
            width: "clamp(220px, 42vw, 320px)",
            borderRadius: "10px",
            cursor: canAfford ? "pointer" : "not-allowed",
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(13px, 1.8vw, 20px)",
            textTransform: "uppercase",
            letterSpacing: "2px",
            color: canAfford ? "#FFFFFF" : "rgba(255,255,255,0.4)",
            background: canAfford
              ? `linear-gradient(180deg, ${EMERALD.light}, ${EMERALD.primary})`
              : "rgba(40,40,40,0.6)",
            border: canAfford
              ? `1.5px solid rgba(0,230,118,0.3)`
              : `1.5px solid rgba(100,100,100,0.3)`,
            boxShadow: canAfford
              ? `0 0 20px rgba(0,230,118,0.15), 0 4px 15px rgba(0,0,0,0.4)`
              : "none",
            transition: "all 0.2s",
          }}
        >
          {TEXTS.findOpponent[lang]}
        </motion.button>
      </div>

      {/* RODAPE */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px clamp(16px, 3vw, 32px)",
          borderTop: "1px solid rgba(212,168,67,0.1)",
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(9px, 1vw, 12px)",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          {TEXTS.rake[lang]}
        </span>

        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(9px, 1vw, 12px)",
            color: "rgba(212,168,67,0.4)",
          }}
        >
          {TEXTS.skillBased[lang]}
        </span>
      </div>
    </div>
  );
}
