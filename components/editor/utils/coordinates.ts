/**
 * coordinates.ts
 *
 * EM PALAVRAS SIMPLES: funcoes pra converter entre pixel e percentual.
 * O editor salva tudo em %, mas o canvas Konva trabalha em pixels.
 * Essas funcoes fazem a ponte.
 *
 * TECNICAMENTE: conversoes uniformes baseadas em containerSize.
 * Inclui clamp pra impedir valores fora do range [0, 100] em %
 * e snap-to-grid opcional.
 */

/** Converte porcentagem em pixel relativo ao tamanho total */
export function percentToPx(percent: number, totalPx: number): number {
  return (percent / 100) * totalPx;
}

/** Converte pixel em porcentagem relativa ao tamanho total */
export function pxToPercent(px: number, totalPx: number): number {
  if (totalPx <= 0) return 0;
  return (px / totalPx) * 100;
}

/** Mantem percentual entre 0 e 100 (ou outros limites custom) */
export function clampPercent(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

/** Round pra N casas decimais — evita float drift acumulado */
export function roundTo(value: number, decimals = 3): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Snap pra grid de tamanho gridSize (em %). Ex: snapToGrid(33.7, 5) -> 35 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Converte um Box (em %) pra px, dado o container.
 * Util pra renderizar elementos no Konva.
 */
export interface PercentBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PixelBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function percentBoxToPx(box: PercentBox, container: { w: number; h: number }): PixelBox {
  return {
    x: percentToPx(box.x, container.w),
    y: percentToPx(box.y, container.h),
    width: percentToPx(box.width, container.w),
    height: percentToPx(box.height, container.h),
  };
}

export function pxBoxToPercent(box: PixelBox, container: { w: number; h: number }): PercentBox {
  return {
    x: roundTo(pxToPercent(box.x, container.w)),
    y: roundTo(pxToPercent(box.y, container.h)),
    width: roundTo(pxToPercent(box.width, container.w)),
    height: roundTo(pxToPercent(box.height, container.h)),
  };
}
