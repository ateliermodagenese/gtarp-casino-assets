"use client";

// ============================================================================
// ROULETTE CHIP SELECTOR — Seletor de fichas premium
// ============================================================================
// Usa imagens reais das chips (chip-1.png, chip-5.png, etc)
// Animacao de selecao com scale + glow
// ============================================================================

import { motion } from "framer-motion";

// Assets
const CHIPS = [
  { value: 1, src: "/assets/games/roulette/chips/chip-1.png" },
  { value: 5, src: "/assets/games/roulette/chips/chip-5.png" },
  { value: 10, src: "/assets/games/roulette/chips/chip-10.png" },
  { value: 25, src: "/assets/games/roulette/chips/chip-25.png" },
  { value: 50, src: "/assets/games/roulette/chips/chip-50.png" },
  { value: 100, src: "/assets/games/roulette/chips/chip-100.png" },
  { value: 500, src: "/assets/games/roulette/chips/chip-500.png" },
  { value: 1000, src: "/assets/games/roulette/chips/chip-1000.png" },
];

const GOLD = {
  primary: "#D4A843",
  light: "#FFD700",
  glow: "rgba(212,168,67,0.5)",
};

interface RouletteChipSelectorProps {
  selectedChip: number;
  onSelectChip: (value: number) => void;
  disabled?: boolean;
}

export default function RouletteChipSelector({
  selectedChip,
  onSelectChip,
  disabled = false,
}: RouletteChipSelectorProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "clamp(6px, 0.8vw, 12px)",
        alignItems: "center",
      }}
    >
      {CHIPS.map((chip) => {
        const isSelected = selectedChip === chip.value;

        return (
          <motion.button
            key={chip.value}
            onClick={() => !disabled && onSelectChip(chip.value)}
            whileHover={!disabled ? { scale: 1.1, y: -4 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            animate={{
              scale: isSelected ? 1.15 : 1,
              y: isSelected ? -6 : 0,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{
              position: "relative",
              width: "clamp(36px, 4.5vw, 56px)",
              height: "clamp(36px, 4.5vw, 56px)",
              padding: 0,
              background: "transparent",
              border: "none",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {/* Glow effect quando selecionado */}
            {isSelected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  position: "absolute",
                  inset: "-8px",
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${GOLD.glow} 0%, transparent 70%)`,
                  zIndex: 0,
                }}
              />
            )}

            {/* Imagem da chip */}
            <img
              src={chip.src}
              alt={`${chip.value}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                position: "relative",
                zIndex: 1,
                filter: isSelected
                  ? `drop-shadow(0 0 12px ${GOLD.glow}) drop-shadow(0 4px 8px rgba(0,0,0,0.4))`
                  : "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
                transition: "filter 0.2s ease",
              }}
            />

            {/* Ring de selecao */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  position: "absolute",
                  inset: "-4px",
                  borderRadius: "50%",
                  border: `2px solid ${GOLD.light}`,
                  boxShadow: `0 0 10px ${GOLD.glow}`,
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
