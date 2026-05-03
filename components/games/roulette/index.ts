// Roulette Game — Blackout Casino
// Exporta todos os componentes do jogo da Roleta

export { default as RouletteGame } from "./RouletteGame";
export { default as RouletteWheel } from "./RouletteWheel";
export { default as RouletteBettingTable } from "./RouletteBettingTable";
export { default as RouletteChipSelector } from "./RouletteChipSelector";
export { default as RouletteLightningPhase } from "./RouletteLightningPhase";

// Re-exportar tipos
export type {
  RouletteMode,
  RoulettePhase,
  RouletteBet,
  BetType,
  LightningNumber,
  RouletteGameProps,
} from "./RouletteGame";

// Re-exportar constantes
export {
  WHEEL_SEQUENCE,
  RED_NUMBERS,
  BLACK_NUMBERS,
  getNumberColor,
  PAYOUTS,
} from "./RouletteGame";
