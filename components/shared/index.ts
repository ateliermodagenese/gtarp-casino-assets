export { default as GameModal } from "./GameModal";
export type { GameModalProps } from "./GameModal";
export { default as GameHeader } from "./GameHeader";
export type { GameHeaderProps, HeaderAction } from "./GameHeader";
export { default as HistoryModal, WinBadge, WinAmount, MultiBadge, TierBadge } from "./HistoryModal";
export type { HistoryModalProps, HistoryColumn, HistoryStats, FilterTab, SortOrder } from "./HistoryModal";
export {
  default as GameFooter,
  InfoChip,
  PrimaryActionButton,
  SecondaryActionButton,
  BalanceDisplay,
  WinAmountDisplay,
  ChipsRow,
  CountdownDisplay,
} from "./GameFooter";
export type {
  GameFooterProps,
  InfoChipProps,
  PrimaryActionButtonProps,
  SecondaryActionButtonProps,
  BalanceDisplayProps,
  WinAmountDisplayProps,
  ChipsRowProps,
  CountdownDisplayProps,
} from "./GameFooter";
export { default as ProvablyFairModal } from "./ProvablyFairModal";
export type { ProvablyFairModalProps, PFData, SeedRecord } from "./ProvablyFairModal";
export { default as PaytableModal } from "./PaytableModal";
export type { PaytableModalProps, PaytableSymbol, PaytableCategory } from "./PaytableModal";
export { useEscStack } from "./useEscStack";
export { default as LuxuryTooltip } from "./LuxuryTooltip";
export { default as HelpPanel } from "./HelpPanel";
export { default as HelpGameModal, HelpCard } from "./HelpGameModal";
export type { HelpGameModalProps, HelpSection } from "./HelpGameModal";
export { sha256, hmacSHA256, generateSecureSeed, createSeedPair } from "./crypto";

// Economy — sistema de multiplier (Passo 2)
export {
  useEconomyConfig,
  invalidateEconomyCache,
  calculatePayout,
  formatValue,
  formatPayoutLabel,
  formatFinalValue,
  BasePlusActualLabel,
  ECONOMY_TOOLTIPS,
} from "./economy";
export type { EconomyConfig, TooltipEntry, TooltipKey } from "./economy";
