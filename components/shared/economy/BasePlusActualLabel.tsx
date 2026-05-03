"use client";

// BasePlusActualLabel — componente shared que mostra valor BASE + valor real
// Usado em milestones, roda, paytable, qualquer lugar que mostre payout
// Lê automaticamente do useEconomyConfig

import { useEconomyConfig } from "./useEconomyConfig";
import { calculatePayout, formatValue } from "./formatPayout";

interface BasePlusActualLabelProps {
  base: number;
  // Se true, mostra so o valor final (sem a legenda "base x mult")
  compact?: boolean;
  // Tamanho visual
  size?: "sm" | "md" | "lg";
  // Override do multiplier (pra preview no admin)
  multiplierOverride?: number;
  // Override da moeda (pra preview no admin)
  symbolOverride?: string;
  // gameId pro override especifico
  gameId?: string;
  // Cor do valor final (default: #00E676 emerald)
  accentColor?: string;
}

const SIZE_MAP = {
  sm: { base: "clamp(9px, 1vw, 12px)", actual: "clamp(10px, 1.1vw, 13px)", gap: "2px" },
  md: { base: "clamp(11px, 1.2vw, 14px)", actual: "clamp(13px, 1.4vw, 16px)", gap: "3px" },
  lg: { base: "clamp(14px, 1.6vw, 18px)", actual: "clamp(18px, 2vw, 24px)", gap: "4px" },
};

export default function BasePlusActualLabel({
  base,
  compact = false,
  size = "md",
  multiplierOverride,
  symbolOverride,
  gameId,
  accentColor = "#00E676",
}: BasePlusActualLabelProps) {
  const { economy } = useEconomyConfig(gameId);
  const mult = multiplierOverride ?? economy.multiplier;
  const symbol = symbolOverride ?? economy.currency.symbol;
  const final = calculatePayout(base, mult);
  const sizes = SIZE_MAP[size];

  if (compact) {
    return (
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          fontSize: sizes.actual,
          color: accentColor,
        }}
      >
        {formatValue(final, symbol)}
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: sizes.gap,
        lineHeight: 1.2,
      }}
    >
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          fontSize: sizes.actual,
          color: accentColor,
        }}
      >
        {formatValue(final, symbol)}
      </span>
      {mult !== 1 && (
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: sizes.base,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.5px",
          }}
        >
          {base} × {mult % 1 === 0 ? `${mult}x` : `${mult.toFixed(1)}x`}
        </span>
      )}
    </span>
  );
}
