"use client";

// ============================================================================
// ROULETTE BETTING TABLE — Mesa de apostas premium
// ============================================================================
// Grid 3x12 + Outside bets (Red/Black, Even/Odd, etc)
// Mostra chips empilhados nas apostas
// Highlight dos Lightning Numbers no modo Relampago
// ============================================================================

import { useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  RED_NUMBERS, 
  BLACK_NUMBERS, 
  getNumberColor, 
  PAYOUTS,
  type RouletteBet, 
  type BetType, 
  type RouletteMode, 
  type LightningNumber 
} from "./RouletteGame";

// Assets
const ASSETS = {
  feltTexture: "/assets/games/roulette/felt-texture.png",
  chips: {
    1: "/assets/games/roulette/chips/chip-1.png",
    5: "/assets/games/roulette/chips/chip-5.png",
    10: "/assets/games/roulette/chips/chip-10.png",
    25: "/assets/games/roulette/chips/chip-25.png",
    50: "/assets/games/roulette/chips/chip-50.png",
    100: "/assets/games/roulette/chips/chip-100.png",
    500: "/assets/games/roulette/chips/chip-500.png",
    1000: "/assets/games/roulette/chips/chip-1000.png",
  } as Record<number, string>,
};

// Paleta
const ROULETTE = {
  red: "#DC2626",
  redBg: "rgba(220,38,38,0.15)",
  redGlow: "rgba(220,38,38,0.5)",
  black: "#1A1A1A",
  blackBg: "rgba(26,26,26,0.5)",
  green: "#15803D",
  greenBg: "rgba(21,128,61,0.3)",
  greenGlow: "rgba(21,128,61,0.5)",
  felt: "#0D5C2A",
  lightningGold: "#FFD700",
  lightningGlow: "rgba(255,215,0,0.6)",
};

const GOLD = {
  primary: "#D4A843",
  light: "#FFD700",
  dark: "#8B6914",
  glow: "rgba(212,168,67,0.4)",
};

interface RouletteBettingTableProps {
  bets: RouletteBet[];
  selectedChip: number;
  onPlaceBet: (bet: RouletteBet) => void;
  mode: RouletteMode;
  lightningNumbers: LightningNumber[];
  disabled: boolean;
  lang: "br" | "in";
}

export default function RouletteBettingTable({
  bets,
  selectedChip,
  onPlaceBet,
  mode,
  lightningNumbers,
  disabled,
  lang,
}: RouletteBettingTableProps) {
  // Textos bilingues
  const T = useMemo(() => ({
    red: lang === "br" ? "VERM" : "RED",
    black: lang === "br" ? "PRETO" : "BLACK",
    even: lang === "br" ? "PAR" : "EVEN",
    odd: lang === "br" ? "IMPAR" : "ODD",
    low: "1-18",
    high: "19-36",
    dozen1: "1st 12",
    dozen2: "2nd 12",
    dozen3: "3rd 12",
    col: "2:1",
  }), [lang]);

  // Numeros do grid (1-36 em ordem de leitura da mesa)
  // Layout: 3 linhas x 12 colunas
  // Linha 3: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36
  // Linha 2: 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35
  // Linha 1: 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34
  const gridNumbers = useMemo(() => {
    const grid: number[][] = [[], [], []];
    for (let col = 0; col < 12; col++) {
      const base = col * 3 + 1;
      grid[2].push(base + 2); // Linha de cima (3, 6, 9...)
      grid[1].push(base + 1); // Linha do meio (2, 5, 8...)
      grid[0].push(base);     // Linha de baixo (1, 4, 7...)
    }
    return grid;
  }, []);

  // Helper para encontrar aposta existente
  const getBetOnCell = useCallback((numbers: number[]): number => {
    const key = JSON.stringify(numbers.sort((a, b) => a - b));
    const bet = bets.find(b => JSON.stringify(b.numbers.sort((a, b) => a - b)) === key);
    return bet?.amount || 0;
  }, [bets]);

  // Handler de clique em celula
  const handleCellClick = useCallback((type: BetType, numbers: number[]) => {
    if (disabled) return;
    onPlaceBet({
      type,
      numbers,
      amount: selectedChip,
      payout: PAYOUTS[type],
    });
  }, [disabled, selectedChip, onPlaceBet]);

  // Verificar se numero e Lightning
  const isLightning = useCallback((num: number): LightningNumber | undefined => {
    return lightningNumbers.find(ln => ln.number === num);
  }, [lightningNumbers]);

  // Renderizar chip empilhado
  const renderChipStack = (amount: number) => {
    if (amount === 0) return null;
    
    // Determinar qual chip usar baseado no valor
    const chipValues = [1000, 500, 100, 50, 25, 10, 5, 1];
    let chipToShow = 1;
    for (const val of chipValues) {
      if (amount >= val) {
        chipToShow = val;
        break;
      }
    }

    return (
      <motion.div
        initial={{ scale: 0, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <img
          src={ASSETS.chips[chipToShow] || ASSETS.chips[100]}
          alt=""
          style={{
            width: "clamp(24px, 3vw, 36px)",
            height: "clamp(24px, 3vw, 36px)",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
          }}
        />
        <span
          style={{
            position: "absolute",
            bottom: "-8px",
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "clamp(8px, 0.8vw, 10px)",
            fontWeight: 700,
            color: GOLD.light,
            textShadow: "0 1px 2px rgba(0,0,0,0.8)",
            whiteSpace: "nowrap",
          }}
        >
          {amount}
        </span>
      </motion.div>
    );
  };

  // Estilo base de celula
  const baseCellStyle = {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s ease",
    minHeight: "clamp(32px, 4vw, 48px)",
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700,
    color: "#fff",
    userSelect: "none" as const,
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "clamp(4px, 0.5vw, 8px)",
        padding: "clamp(8px, 1vw, 16px)",
        background: `linear-gradient(135deg, ${ROULETTE.felt} 0%, #0A4A22 100%)`,
        backgroundImage: `url("${ASSETS.feltTexture}")`,
        backgroundBlendMode: "overlay",
        borderRadius: "12px",
        border: `2px solid ${GOLD.dark}`,
        boxShadow: `inset 0 0 40px rgba(0,0,0,0.3), 0 0 20px ${GOLD.glow}`,
      }}
    >
      {/* ZERO + Grid principal */}
      <div
        style={{
          display: "flex",
          gap: "clamp(2px, 0.3vw, 4px)",
          flex: 1,
        }}
      >
        {/* ZERO */}
        <motion.button
          onClick={() => handleCellClick("zero", [0])}
          whileHover={!disabled ? { scale: 1.02, boxShadow: `0 0 15px ${ROULETTE.greenGlow}` } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
          style={{
            ...baseCellStyle,
            width: "clamp(36px, 4vw, 56px)",
            background: ROULETTE.greenBg,
            border: `2px solid ${ROULETTE.green}`,
            borderRadius: "8px 0 0 8px",
            fontSize: "clamp(16px, 2vw, 24px)",
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            boxShadow: `inset 0 0 20px ${ROULETTE.greenGlow}`,
          }}
        >
          0
          {renderChipStack(getBetOnCell([0]))}
        </motion.button>

        {/* Grid 3x12 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "clamp(2px, 0.3vw, 4px)",
          }}
        >
          {gridNumbers.slice().reverse().map((row, rowIdx) => (
            <div
              key={rowIdx}
              style={{
                display: "flex",
                gap: "clamp(2px, 0.3vw, 4px)",
                flex: 1,
              }}
            >
              {row.map((num) => {
                const color = getNumberColor(num);
                const lightning = isLightning(num);
                const betAmount = getBetOnCell([num]);

                return (
                  <motion.button
                    key={num}
                    onClick={() => handleCellClick("straight", [num])}
                    whileHover={!disabled ? { 
                      scale: 1.05, 
                      boxShadow: lightning 
                        ? `0 0 20px ${ROULETTE.lightningGlow}`
                        : `0 0 12px ${color === "red" ? ROULETTE.redGlow : "rgba(255,255,255,0.3)"}` 
                    } : {}}
                    whileTap={!disabled ? { scale: 0.95 } : {}}
                    style={{
                      ...baseCellStyle,
                      flex: 1,
                      background: color === "red" ? ROULETTE.redBg : ROULETTE.blackBg,
                      border: lightning 
                        ? `2px solid ${ROULETTE.lightningGold}`
                        : `1.5px solid ${color === "red" ? ROULETTE.red : "rgba(255,255,255,0.2)"}`,
                      borderRadius: "4px",
                      fontSize: "clamp(12px, 1.4vw, 18px)",
                      boxShadow: lightning 
                        ? `inset 0 0 15px ${ROULETTE.lightningGlow}, 0 0 10px ${ROULETTE.lightningGlow}`
                        : "none",
                    }}
                  >
                    {num}
                    {/* Lightning indicator */}
                    {lightning && (
                      <span
                        style={{
                          position: "absolute",
                          top: "2px",
                          right: "2px",
                          fontFamily: "'Cinzel', serif",
                          fontSize: "clamp(7px, 0.7vw, 9px)",
                          fontWeight: 800,
                          color: ROULETTE.lightningGold,
                          textShadow: `0 0 6px ${ROULETTE.lightningGlow}`,
                        }}
                      >
                        {lightning.multiplier}x
                      </span>
                    )}
                    {renderChipStack(betAmount)}
                  </motion.button>
                );
              })}

              {/* Column bet (2:1) */}
              <motion.button
                onClick={() => handleCellClick("column", gridNumbers[2 - rowIdx])}
                whileHover={!disabled ? { scale: 1.05, boxShadow: `0 0 10px ${GOLD.glow}` } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
                style={{
                  ...baseCellStyle,
                  width: "clamp(32px, 3.5vw, 48px)",
                  background: "rgba(212,168,67,0.1)",
                  border: `1.5px solid ${GOLD.dark}`,
                  borderRadius: "4px",
                  fontSize: "clamp(9px, 1vw, 12px)",
                  fontFamily: "'Cinzel', serif",
                }}
              >
                {T.col}
                {renderChipStack(getBetOnCell(gridNumbers[2 - rowIdx]))}
              </motion.button>
            </div>
          ))}
        </div>
      </div>

      {/* Dozens row */}
      <div
        style={{
          display: "flex",
          gap: "clamp(2px, 0.3vw, 4px)",
          marginLeft: "clamp(38px, 4.3vw, 60px)",
        }}
      >
        {[
          { label: T.dozen1, numbers: Array.from({ length: 12 }, (_, i) => i + 1) },
          { label: T.dozen2, numbers: Array.from({ length: 12 }, (_, i) => i + 13) },
          { label: T.dozen3, numbers: Array.from({ length: 12 }, (_, i) => i + 25) },
        ].map((dozen, idx) => (
          <motion.button
            key={idx}
            onClick={() => handleCellClick("dozen", dozen.numbers)}
            whileHover={!disabled ? { scale: 1.02, boxShadow: `0 0 10px ${GOLD.glow}` } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            style={{
              ...baseCellStyle,
              flex: 1,
              background: "rgba(212,168,67,0.08)",
              border: `1.5px solid ${GOLD.dark}`,
              borderRadius: "4px",
              fontSize: "clamp(10px, 1.1vw, 14px)",
              fontFamily: "'Cinzel', serif",
              color: GOLD.primary,
            }}
          >
            {dozen.label}
            {renderChipStack(getBetOnCell(dozen.numbers))}
          </motion.button>
        ))}
      </div>

      {/* Outside bets row */}
      <div
        style={{
          display: "flex",
          gap: "clamp(2px, 0.3vw, 4px)",
          marginLeft: "clamp(38px, 4.3vw, 60px)",
        }}
      >
        {[
          { label: T.low, type: "low" as BetType, numbers: Array.from({ length: 18 }, (_, i) => i + 1), color: GOLD.primary },
          { label: T.even, type: "even" as BetType, numbers: Array.from({ length: 18 }, (_, i) => (i + 1) * 2), color: GOLD.primary },
          { label: T.red, type: "red" as BetType, numbers: RED_NUMBERS, color: ROULETTE.red, bg: ROULETTE.redBg },
          { label: T.black, type: "black" as BetType, numbers: BLACK_NUMBERS, color: "#fff", bg: ROULETTE.blackBg },
          { label: T.odd, type: "odd" as BetType, numbers: Array.from({ length: 18 }, (_, i) => i * 2 + 1), color: GOLD.primary },
          { label: T.high, type: "high" as BetType, numbers: Array.from({ length: 18 }, (_, i) => i + 19), color: GOLD.primary },
        ].map((bet, idx) => (
          <motion.button
            key={idx}
            onClick={() => handleCellClick(bet.type, bet.numbers)}
            whileHover={!disabled ? { 
              scale: 1.02, 
              boxShadow: `0 0 12px ${bet.type === "red" ? ROULETTE.redGlow : bet.type === "black" ? "rgba(255,255,255,0.3)" : GOLD.glow}` 
            } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            style={{
              ...baseCellStyle,
              flex: 1,
              background: bet.bg || "rgba(212,168,67,0.08)",
              border: `1.5px solid ${bet.type === "red" ? ROULETTE.red : bet.type === "black" ? "rgba(255,255,255,0.3)" : GOLD.dark}`,
              borderRadius: "4px",
              fontSize: "clamp(9px, 1vw, 12px)",
              fontFamily: "'Cinzel', serif",
              color: bet.color,
            }}
          >
            {bet.label}
            {renderChipStack(getBetOnCell(bet.numbers))}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
