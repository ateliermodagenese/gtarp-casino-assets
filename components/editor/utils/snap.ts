"use client";

/**
 * snap.ts
 *
 * EM PALAVRAS SIMPLES: ajuda o elemento a "grudar" na grade ou em
 * outros elementos quando voce arrasta perto deles. Tipo um ima leve.
 *
 * TECNICAMENTE: 2 features:
 * 1. snapToGrid — arredonda valores pra multiplos de gridSize
 * 2. detectGuides — calcula guias de alinhamento contra outros
 *    elementos da cena (centro/borda esquerda/topo/etc)
 */
import type { GameElement } from "../state/schema";
import { EDITOR_CONFIG } from "@/editor.config";

/** Snap pra grid (5% por padrao) — usado quando Shift NAO esta pressionado */
export function snapToGrid(value: number, gridSize = EDITOR_CONFIG.gridSize): number {
  return Math.round(value / gridSize) * gridSize;
}

/** Snap unico se proximo da grid (dentro de tolerance%) */
export function snapNear(value: number, gridSize: number, tolerance: number): number {
  const snapped = Math.round(value / gridSize) * gridSize;
  return Math.abs(value - snapped) <= tolerance ? snapped : value;
}

/**
 * Smart guides: detecta linhas de alinhamento contra outros elementos.
 * Retorna array de guias visuais + valores ajustados de x/y se houver snap.
 */
export interface SmartGuide {
  axis: "x" | "y";
  /** Posicao em % do canvas */
  position: number;
  /** Tipo da guia: align (com aresta) ou center (com centro) */
  kind: "left" | "right" | "center" | "top" | "bottom" | "middle";
}

export interface SnapResult {
  x: number;
  y: number;
  guides: SmartGuide[];
}

/**
 * Calcula snap + guides pra um elemento sendo arrastado.
 *
 * @param dragging O elemento sendo arrastado (com x,y candidatos)
 * @param others Outros elementos da cena (referencias pra alinhar)
 * @param tolerance Distancia max em % pra considerar snap (default 0.5%)
 */
export function computeSnap(
  dragging: { x: number; y: number; width: number; height: number },
  others: GameElement[],
  tolerance = 0.5,
): SnapResult {
  const guides: SmartGuide[] = [];
  let snappedX = dragging.x;
  let snappedY = dragging.y;

  // Pontos de interesse do elemento sendo arrastado
  const draggingPoints = {
    left: dragging.x,
    right: dragging.x + dragging.width,
    centerX: dragging.x + dragging.width / 2,
    top: dragging.y,
    bottom: dragging.y + dragging.height,
    centerY: dragging.y + dragging.height / 2,
  };

  // Pontos de cada outro elemento
  const candidatesX: { value: number; kind: SmartGuide["kind"] }[] = [];
  const candidatesY: { value: number; kind: SmartGuide["kind"] }[] = [];

  for (const other of others) {
    if (!other.visible) continue;
    candidatesX.push({ value: other.x, kind: "left" });
    candidatesX.push({ value: other.x + other.width, kind: "right" });
    candidatesX.push({ value: other.x + other.width / 2, kind: "center" });
    candidatesY.push({ value: other.y, kind: "top" });
    candidatesY.push({ value: other.y + other.height, kind: "bottom" });
    candidatesY.push({ value: other.y + other.height / 2, kind: "middle" });
  }

  // Tambem snap em meio do canvas
  candidatesX.push({ value: 50, kind: "center" });
  candidatesY.push({ value: 50, kind: "middle" });

  // Procura snap em X — testa cada ponto do dragging contra cada candidato
  let bestDxDelta = tolerance;
  let bestDxAdjust = 0;
  for (const cand of candidatesX) {
    for (const [pointName, pointValue] of Object.entries(draggingPoints)) {
      if (!pointName.match(/X$|^left$|^right$/)) continue;
      const delta = cand.value - pointValue;
      if (Math.abs(delta) < bestDxDelta) {
        bestDxDelta = Math.abs(delta);
        bestDxAdjust = delta;
        guides.push({ axis: "x", position: cand.value, kind: cand.kind });
      }
    }
  }

  let bestDyDelta = tolerance;
  let bestDyAdjust = 0;
  for (const cand of candidatesY) {
    for (const [pointName, pointValue] of Object.entries(draggingPoints)) {
      if (!pointName.match(/Y$|^top$|^bottom$/)) continue;
      const delta = cand.value - pointValue;
      if (Math.abs(delta) < bestDyDelta) {
        bestDyDelta = Math.abs(delta);
        bestDyAdjust = delta;
        guides.push({ axis: "y", position: cand.value, kind: cand.kind });
      }
    }
  }

  if (bestDxDelta < tolerance) snappedX = dragging.x + bestDxAdjust;
  if (bestDyDelta < tolerance) snappedY = dragging.y + bestDyAdjust;

  // Filtra guides — deixa so as que efetivamente snaparam
  const finalGuides = guides.filter((g) =>
    g.axis === "x" ? bestDxDelta < tolerance : bestDyDelta < tolerance,
  );

  return { x: snappedX, y: snappedY, guides: finalGuides };
}
