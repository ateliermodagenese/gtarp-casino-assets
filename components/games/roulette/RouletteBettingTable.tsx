"use client";

// ============================================================================
// ROULETTE BETTING TABLE — Mesa de apostas PREMIUM LUXO
// ============================================================================
// Refinamento visual: felt realista, separadores dourados, profundidade 3D
// Grid 3x12 + Outside bets com acabamento de casino Las Vegas AAA
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

// ============================================================================
// PALETA PREMIUM - Cores refinadas conforme especificacao
// ============================================================================
const FELT = {
  base: "#0E3B2E",
  deep: "#0A2A21",
  gradient: "linear-gradient(145deg, #0E3B2E 0%, #0A2A21 60%, #081F18 100%)",
  vignette: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)",
};

const GOLD = {
  primary: "#D4A843",
  light: "#F4D78C",
  medium: "#C9A227",
  dark: "#8B6914",
  separator: "rgba(212,168,67,0.35)",
  separatorHighlight: "rgba(244,215,140,0.15)",
  glow: "rgba(212,168,67,0.25)",
  glowStrong: "rgba(212,168,67,0.5)",
};

const CELL_COLORS = {
  red: {
    base: "#8B0000",
    surface: "#C62828",
    gradient: "linear-gradient(145deg, #C62828 0%, #8B0000 100%)",
    glow: "rgba(198,40,40,0.4)",
  },
  black: {
    base: "#0A0A0A",
    surface: "#1A1A1A",
    gradient: "linear-gradient(145deg, #1A1A1A 0%, #0A0A0A 100%)",
    glow: "rgba(255,255,255,0.15)",
  },
  green: {
    base: "#006B3C",
    surface: "#00C853",
    gradient: "linear-gradient(145deg, #00A844 0%, #006B3C 100%)",
    glow: "rgba(0,200,83,0.5)",
    glowStrong: "rgba(0,200,83,0.7)",
  },
};

const LIGHTNING = {
  gold: "#FFD700",
  glow: "rgba(255,215,0,0.6)",
  glowStrong: "rgba(255,215,0,0.8)",
};

// Tipografia
const TEXT = {
  number: "#F5F5F5", // Branco mais quente
  numberShadow: "0 1px 0 rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.5)",
  emboss: "0 -1px 0 rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.08)",
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

  // Grid layout: 3 linhas x 12 colunas
  const gridNumbers = useMemo(() => {
    const grid: number[][] = [[], [], []];
    for (let col = 0; col < 12; col++) {
      const base = col * 3 + 1;
      grid[2].push(base + 2);
      grid[1].push(base + 1);
      grid[0].push(base);
    }
    return grid;
  }, []);

  // Helper para encontrar aposta existente
  const getBetOnCell = useCallback((numbers: number[]): number => {
    const key = JSON.stringify(numbers.sort((a, b) => a - b));
    const bet = bets.find(b => JSON.stringify(b.numbers.sort((a, b) => a - b)) === key);
    return bet?.amount || 0;
  }, [bets]);

  // Handler de clique
  const handleCellClick = useCallback((type: BetType, numbers: number[]) => {
    if (disabled) return;
    onPlaceBet({
      type,
      numbers,
      amount: selectedChip,
      payout: PAYOUTS[type],
    });
  }, [disabled, selectedChip, onPlaceBet]);

  // Verificar Lightning
  const isLightning = useCallback((num: number): LightningNumber | undefined => {
    return lightningNumbers.find(ln => ln.number === num);
  }, [lightningNumbers]);

  // Renderizar chip empilhado
  const renderChipStack = (amount: number) => {
    if (amount === 0) return null;
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
            filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.6))",
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
            textShadow: "0 1px 2px rgba(0,0,0,0.9)",
            whiteSpace: "nowrap",
          }}
        >
          {amount}
        </span>
      </motion.div>
    );
  };

  // ============================================================================
  // ESTILO BASE DE CELULA — Profundidade 3D
  // ============================================================================
  const baseCellStyle = {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    minHeight: "clamp(32px, 4vw, 48px)",
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700,
    color: TEXT.number,
    userSelect: "none" as const,
    // Depth: soft inner shadow + top highlight
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.06),
      inset 0 -1px 2px rgba(0,0,0,0.3),
      inset 1px 0 2px rgba(0,0,0,0.15),
      inset -1px 0 2px rgba(0,0,0,0.15)
    `,
  };

  // ============================================================================
  // NUMERO CELL FACTORY
  // ============================================================================
  const getNumberCellStyle = (color: "red" | "black", lightning: LightningNumber | undefined, isHovered: boolean, isSelected: boolean) => {
    const colorSet = color === "red" ? CELL_COLORS.red : CELL_COLORS.black;
    
    let boxShadow = `
      inset 0 1px 0 rgba(255,255,255,0.08),
      inset 0 -2px 4px rgba(0,0,0,0.4),
      inset 2px 0 4px rgba(0,0,0,0.2),
      inset -2px 0 4px rgba(0,0,0,0.2)
    `;

    if (lightning) {
      boxShadow = `
        inset 0 0 12px ${LIGHTNING.glow},
        0 0 8px ${LIGHTNING.glow},
        inset 0 1px 0 rgba(255,215,0,0.2)
      `;
    }

    if (isSelected) {
      boxShadow = `
        inset 0 0 15px ${GOLD.glowStrong},
        0 0 12px ${GOLD.glowStrong},
        inset 0 1px 0 rgba(255,255,255,0.15)
      `;
    }

    return {
      background: colorSet.gradient,
      border: lightning 
        ? `1.5px solid ${LIGHTNING.gold}`
        : `1px solid ${GOLD.separator}`,
      borderTop: lightning
        ? `1.5px solid ${LIGHTNING.gold}`
        : `1px solid ${GOLD.separatorHighlight}`,
      borderRadius: "3px",
      boxShadow,
    };
  };

  // ============================================================================
  // OUTSIDE BET BUTTON STYLE — Embedded in felt
  // ============================================================================
  const getOutsideBetStyle = (type: string) => {
    const isRedBlack = type === "red" || type === "black";
    
    let bg = "linear-gradient(180deg, rgba(20,20,20,0.7) 0%, rgba(10,10,10,0.85) 100%)";
    let borderColor = GOLD.separator;
    
    if (type === "red") {
      bg = `linear-gradient(180deg, ${CELL_COLORS.red.surface}88 0%, ${CELL_COLORS.red.base}CC 100%)`;
      borderColor = CELL_COLORS.red.surface;
    } else if (type === "black") {
      bg = "linear-gradient(180deg, rgba(35,35,35,0.9) 0%, rgba(15,15,15,0.95) 100%)";
      borderColor = "rgba(255,255,255,0.15)";
    }

    return {
      background: bg,
      border: `1px solid ${borderColor}`,
      borderTop: `1px solid ${isRedBlack ? borderColor : GOLD.separatorHighlight}`,
      borderRadius: "4px",
      boxShadow: `
        inset 0 1px 0 rgba(255,255,255,0.05),
        inset 0 -2px 6px rgba(0,0,0,0.5),
        0 2px 4px rgba(0,0,0,0.3)
      `,
      // Glass-like inner depth
      backdropFilter: "blur(2px)",
    };
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "clamp(3px, 0.4vw, 6px)",
        padding: "clamp(10px, 1.2vw, 18px)",
        // ================================================================
        // LAYER 1: BASE FELT — Deep green gradient + texture + vignette
        // ================================================================
        background: FELT.gradient,
        backgroundImage: `
          ${FELT.vignette},
          url("${ASSETS.feltTexture}")
        `,
        backgroundBlendMode: "normal, soft-light",
        backgroundSize: "100% 100%, 200px 200px",
        borderRadius: "14px",
        // Luxurious gold frame with depth
        border: `2px solid ${GOLD.medium}`,
        boxShadow: `
          inset 0 0 60px rgba(0,0,0,0.35),
          inset 0 2px 0 rgba(255,255,255,0.03),
          0 0 30px ${GOLD.glow},
          0 4px 20px rgba(0,0,0,0.5)
        `,
        // Subtle top-left lighting
        backgroundPosition: "center, 0 0",
      }}
    >
      {/* ================================================================ */}
      {/* ZERO + Grid principal                                           */}
      {/* ================================================================ */}
      <div
        style={{
          display: "flex",
          gap: "clamp(2px, 0.3vw, 4px)",
          flex: 1,
        }}
      >
        {/* ============================================================ */}
        {/* ZERO — Premium emerald glow                                   */}
        {/* ============================================================ */}
        <motion.button
          onClick={() => handleCellClick("zero", [0])}
          whileHover={!disabled ? { 
            scale: 1.02,
            boxShadow: `
              inset 0 0 20px ${CELL_COLORS.green.glowStrong},
              0 0 20px ${CELL_COLORS.green.glow},
              inset 0 1px 0 rgba(255,255,255,0.15)
            `,
          } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
          style={{
            ...baseCellStyle,
            width: "clamp(36px, 4vw, 56px)",
            background: CELL_COLORS.green.gradient,
            border: `1.5px solid ${CELL_COLORS.green.surface}`,
            borderTop: `1.5px solid rgba(0,200,83,0.6)`,
            borderRadius: "8px 0 0 8px",
            fontSize: "clamp(18px, 2.2vw, 28px)",
            fontFamily: "'Cinzel', serif",
            fontWeight: 800,
            letterSpacing: "0.05em",
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            textShadow: TEXT.emboss,
            boxShadow: `
              inset 0 0 25px ${CELL_COLORS.green.glow},
              inset 0 1px 0 rgba(255,255,255,0.1),
              0 0 15px ${CELL_COLORS.green.glow}
            `,
          }}
        >
          0
          {renderChipStack(getBetOnCell([0]))}
        </motion.button>

        {/* ============================================================ */}
        {/* Grid 3x12 — Gold separators com depth                         */}
        {/* ============================================================ */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "clamp(2px, 0.25vw, 3px)",
            // LAYER 2: Gold grid separator base
            padding: "2px",
            background: `linear-gradient(135deg, ${GOLD.separator} 0%, rgba(139,105,20,0.2) 100%)`,
            borderRadius: "4px",
            boxShadow: `
              inset 0 1px 0 ${GOLD.separatorHighlight},
              inset 0 -1px 0 rgba(0,0,0,0.3)
            `,
          }}
        >
          {gridNumbers.slice().reverse().map((row, rowIdx) => (
            <div
              key={rowIdx}
              style={{
                display: "flex",
                gap: "clamp(2px, 0.25vw, 3px)",
                flex: 1,
              }}
            >
              {row.map((num) => {
                const color = getNumberColor(num);
                const lightning = isLightning(num);
                const betAmount = getBetOnCell([num]);
                const cellStyle = getNumberCellStyle(color, lightning, false, betAmount > 0);

                return (
                  <motion.button
                    key={num}
                    onClick={() => handleCellClick("straight", [num])}
                    whileHover={!disabled ? { 
                      scale: 1.06,
                      boxShadow: lightning 
                        ? `
                          inset 0 0 18px ${LIGHTNING.glowStrong},
                          0 0 15px ${LIGHTNING.glow}
                        `
                        : `
                          inset 0 0 12px ${GOLD.glowStrong},
                          0 0 10px ${GOLD.glow}
                        `,
                    } : {}}
                    whileTap={!disabled ? { scale: 0.95 } : {}}
                    style={{
                      ...baseCellStyle,
                      flex: 1,
                      fontSize: "clamp(13px, 1.5vw, 20px)",
                      fontFamily: "'Cinzel', serif",
                      fontWeight: 700,
                      letterSpacing: "0.02em",
                      textShadow: TEXT.emboss,
                      ...cellStyle,
                    }}
                  >
                    {num}
                    {/* Lightning multiplier badge */}
                    {lightning && (
                      <span
                        style={{
                          position: "absolute",
                          top: "1px",
                          right: "2px",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "clamp(7px, 0.7vw, 9px)",
                          fontWeight: 800,
                          color: LIGHTNING.gold,
                          textShadow: `0 0 8px ${LIGHTNING.glowStrong}`,
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
                whileHover={!disabled ? { 
                  scale: 1.05, 
                  boxShadow: `
                    inset 0 0 10px ${GOLD.glowStrong},
                    0 0 8px ${GOLD.glow}
                  `,
                } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
                style={{
                  ...baseCellStyle,
                  width: "clamp(32px, 3.5vw, 48px)",
                  background: "linear-gradient(180deg, rgba(30,30,30,0.8) 0%, rgba(15,15,15,0.9) 100%)",
                  border: `1px solid ${GOLD.separator}`,
                  borderTop: `1px solid ${GOLD.separatorHighlight}`,
                  borderRadius: "3px",
                  fontSize: "clamp(9px, 1vw, 12px)",
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  color: GOLD.primary,
                  textShadow: `0 1px 2px rgba(0,0,0,0.8), 0 0 8px ${GOLD.glow}`,
                  boxShadow: `
                    inset 0 1px 0 rgba(255,255,255,0.04),
                    inset 0 -2px 4px rgba(0,0,0,0.4)
                  `,
                }}
              >
                {T.col}
                {renderChipStack(getBetOnCell(gridNumbers[2 - rowIdx]))}
              </motion.button>
            </div>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* DOZENS ROW — Embedded buttons                                   */}
      {/* ================================================================ */}
      <div
        style={{
          display: "flex",
          gap: "clamp(3px, 0.35vw, 5px)",
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
            whileHover={!disabled ? { 
              scale: 1.02, 
              boxShadow: `
                inset 0 0 12px ${GOLD.glowStrong},
                0 0 10px ${GOLD.glow}
              `,
            } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            style={{
              ...baseCellStyle,
              flex: 1,
              minHeight: "clamp(28px, 3.2vw, 40px)",
              ...getOutsideBetStyle("dozen"),
              fontSize: "clamp(10px, 1.1vw, 14px)",
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              color: GOLD.primary,
              textShadow: `0 1px 2px rgba(0,0,0,0.8), 0 0 6px ${GOLD.glow}`,
              letterSpacing: "0.05em",
            }}
          >
            {dozen.label}
            {renderChipStack(getBetOnCell(dozen.numbers))}
          </motion.button>
        ))}
      </div>

      {/* ================================================================ */}
      {/* OUTSIDE BETS ROW — Premium embedded buttons                     */}
      {/* ================================================================ */}
      <div
        style={{
          display: "flex",
          gap: "clamp(3px, 0.35vw, 5px)",
          marginLeft: "clamp(38px, 4.3vw, 60px)",
        }}
      >
        {[
          { label: T.low, type: "low" as BetType, numbers: Array.from({ length: 18 }, (_, i) => i + 1) },
          { label: T.even, type: "even" as BetType, numbers: Array.from({ length: 18 }, (_, i) => (i + 1) * 2) },
          { label: T.red, type: "red" as BetType, numbers: RED_NUMBERS },
          { label: T.black, type: "black" as BetType, numbers: BLACK_NUMBERS },
          { label: T.odd, type: "odd" as BetType, numbers: Array.from({ length: 18 }, (_, i) => i * 2 + 1) },
          { label: T.high, type: "high" as BetType, numbers: Array.from({ length: 18 }, (_, i) => i + 19) },
        ].map((bet, idx) => {
          const betStyle = getOutsideBetStyle(bet.type);
          const textColor = bet.type === "red" ? TEXT.number 
            : bet.type === "black" ? TEXT.number 
            : GOLD.primary;

          return (
            <motion.button
              key={idx}
              onClick={() => handleCellClick(bet.type, bet.numbers)}
              whileHover={!disabled ? { 
                scale: 1.03, 
                boxShadow: bet.type === "red" 
                  ? `inset 0 0 15px ${CELL_COLORS.red.glow}, 0 0 12px ${CELL_COLORS.red.glow}`
                  : bet.type === "black"
                  ? `inset 0 0 12px rgba(255,255,255,0.15), 0 0 8px rgba(255,255,255,0.1)`
                  : `inset 0 0 12px ${GOLD.glowStrong}, 0 0 10px ${GOLD.glow}`,
              } : {}}
              whileTap={!disabled ? { scale: 0.97 } : {}}
              style={{
                ...baseCellStyle,
                flex: 1,
                minHeight: "clamp(28px, 3.2vw, 40px)",
                ...betStyle,
                fontSize: "clamp(9px, 1vw, 13px)",
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                color: textColor,
                textShadow: bet.type === "red" || bet.type === "black"
                  ? TEXT.numberShadow
                  : `0 1px 2px rgba(0,0,0,0.8), 0 0 6px ${GOLD.glow}`,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {bet.label}
              {renderChipStack(getBetOnCell(bet.numbers))}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
