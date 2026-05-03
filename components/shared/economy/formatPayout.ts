// formatPayout — helper shared para exibir valores BASE × multiplier
// Usado em todos os jogos que mostram valores economicos

/**
 * Calcula valor final = base * multiplier (arredondado pra baixo)
 */
export function calculatePayout(base: number, multiplier: number): number {
  return Math.floor(base * multiplier);
}

/**
 * Formata valor com simbolo da moeda
 * Ex: formatValue(500, "GC") => "500 GC"
 */
export function formatValue(value: number, symbol: string): string {
  const formatted = value >= 1000
    ? value.toLocaleString("pt-BR")
    : String(value);
  return `${formatted} ${symbol}`;
}

/**
 * Formata legenda completa BASE x MULT = FINAL
 * Ex: formatPayoutLabel(100, 5, "GC") => "100 base × 5x = 500 GC"
 */
export function formatPayoutLabel(
  base: number,
  multiplier: number,
  symbol: string,
): string {
  const final = calculatePayout(base, multiplier);
  const multStr = multiplier % 1 === 0
    ? `${multiplier}x`
    : `${multiplier.toFixed(1)}x`;
  return `${base} base × ${multStr} = ${formatValue(final, symbol)}`;
}

/**
 * Formata valor final curto (sem a conta)
 * Ex: formatFinalValue(100, 5, "GC") => "500 GC"
 */
export function formatFinalValue(
  base: number,
  multiplier: number,
  symbol: string,
): string {
  return formatValue(calculatePayout(base, multiplier), symbol);
}
