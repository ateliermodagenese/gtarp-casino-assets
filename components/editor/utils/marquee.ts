"use client";

/**
 * marquee.ts
 *
 * EM PALAVRAS SIMPLES: quando voce clica numa area vazia do canvas
 * e arrasta, aparece um retangulo dourado tracejado. Tudo que ficar
 * dentro dele eh selecionado quando voce solta.
 *
 * TECNICAMENTE: math pra detectar quais elementos estao dentro de
 * um retangulo. Usa bbox simples (sem considerar rotacao por
 * enquanto — se o elemento esta rotacionado, usa o bounding box
 * do retangulo original).
 */
import type { GameElement } from "../state/schema";

export interface MarqueeRect {
  /** % do canvas */
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Cria um MarqueeRect a partir de 2 pontos (start + end)
 * normalizando ordem (start pode estar a direita/baixo de end).
 */
export function makeMarquee(
  start: { x: number; y: number },
  end: { x: number; y: number },
): MarqueeRect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

/**
 * Retorna ids de elementos que estao DENTRO do marquee.
 * Modo "intersect" (default): qualquer overlap conta.
 * Modo "contain": elemento precisa estar 100% dentro pra contar.
 */
export function findElementsInMarquee(
  marquee: MarqueeRect,
  elements: GameElement[],
  mode: "intersect" | "contain" = "intersect",
): string[] {
  const result: string[] = [];
  for (const el of elements) {
    if (el.locked || !el.visible) continue;

    const elRight = el.x + el.width;
    const elBottom = el.y + el.height;
    const mRight = marquee.x + marquee.width;
    const mBottom = marquee.y + marquee.height;

    if (mode === "contain") {
      // 100% dentro
      if (
        el.x >= marquee.x &&
        el.y >= marquee.y &&
        elRight <= mRight &&
        elBottom <= mBottom
      ) {
        result.push(el.id);
      }
    } else {
      // intersect: overlap
      if (
        el.x < mRight &&
        elRight > marquee.x &&
        el.y < mBottom &&
        elBottom > marquee.y
      ) {
        result.push(el.id);
      }
    }
  }
  return result;
}
