"use client";

/**
 * ResizeHandles.tsx
 *
 * 8 handles de resize ao redor do elemento selecionado.
 * Cantos: nw, ne, sw, se. Lados: n, s, e, w.
 * Shift = manter proporcao. Ctrl = resize simetrico.
 *
 * Recebe highlightRect (coords no espaco do container),
 * o elemento DOM real, e callbacks pra pushUndo + updateHighlight.
 */
import { useCallback, useRef, useState } from "react";

type HandlePos = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface ResizeHandlesProps {
  /** Rect do highlight no espaco do container (ja escalado) */
  rect: DOMRect;
  /** Elemento DOM real dentro do iframe */
  element: HTMLElement;
  /** Fator de escala do iframe (containerWidth / 1920) */
  scale: number;
  /** Salvar snapshot pra undo antes de iniciar resize */
  onResizeStart: () => void;
  /** Atualizar highlight + painel apos resize */
  onResizeEnd: () => void;
  /** Atualizar highlight durante resize */
  onResizeMove: () => void;
}

const HANDLE_SIZE = 8;

const HANDLE_CURSORS: Record<HandlePos, string> = {
  nw: "nw-resize",
  n: "n-resize",
  ne: "ne-resize",
  e: "e-resize",
  se: "se-resize",
  s: "s-resize",
  sw: "sw-resize",
  w: "w-resize",
};

/** Posicao de cada handle relativa ao rect */
function handlePosition(pos: HandlePos, rect: DOMRect): { left: number; top: number } {
  const half = HANDLE_SIZE / 2;
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  switch (pos) {
    case "nw": return { left: rect.x - half, top: rect.y - half };
    case "n":  return { left: cx - half, top: rect.y - half };
    case "ne": return { left: rect.x + rect.width - half, top: rect.y - half };
    case "e":  return { left: rect.x + rect.width - half, top: cy - half };
    case "se": return { left: rect.x + rect.width - half, top: rect.y + rect.height - half };
    case "s":  return { left: cx - half, top: rect.y + rect.height - half };
    case "sw": return { left: rect.x - half, top: rect.y + rect.height - half };
    case "w":  return { left: rect.x - half, top: cy - half };
  }
}

export default function ResizeHandles({
  rect,
  element,
  scale,
  onResizeStart,
  onResizeEnd,
  onResizeMove,
}: ResizeHandlesProps) {
  const [activeHandle, setActiveHandle] = useState<HandlePos | null>(null);
  const startRef = useRef<{
    mouseX: number;
    mouseY: number;
    origWidth: number;
    origHeight: number;
    origLeft: number;
    origTop: number;
    aspectRatio: number;
  } | null>(null);

  const handleMouseDown = useCallback(
    (pos: HandlePos, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const elRect = element.getBoundingClientRect();
      const origWidth = elRect.width;
      const origHeight = elRect.height;

      startRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        origWidth,
        origHeight,
        origLeft: elRect.left,
        origTop: elRect.top,
        aspectRatio: origWidth / (origHeight || 1),
      };

      setActiveHandle(pos);
      onResizeStart();

      const onMove = (me: MouseEvent) => {
        if (!startRef.current) return;
        const s = startRef.current;
        // Delta em pixels reais do iframe (compensar escala)
        let dxReal = (me.clientX - s.mouseX) / scale;
        let dyReal = (me.clientY - s.mouseY) / scale;

        let newW = s.origWidth;
        let newH = s.origHeight;

        // Calcular novo tamanho baseado na posicao do handle
        const affectsRight = pos === "e" || pos === "ne" || pos === "se";
        const affectsLeft = pos === "w" || pos === "nw" || pos === "sw";
        const affectsBottom = pos === "s" || pos === "se" || pos === "sw";
        const affectsTop = pos === "n" || pos === "nw" || pos === "ne";

        if (affectsRight) newW = s.origWidth + dxReal;
        if (affectsLeft) newW = s.origWidth - dxReal;
        if (affectsBottom) newH = s.origHeight + dyReal;
        if (affectsTop) newH = s.origHeight - dyReal;

        // Shift = manter proporcao
        if (me.shiftKey) {
          const isCorner = pos === "nw" || pos === "ne" || pos === "sw" || pos === "se";
          if (isCorner) {
            const ratio = s.aspectRatio;
            if (Math.abs(dxReal) > Math.abs(dyReal)) {
              newH = newW / ratio;
            } else {
              newW = newH * ratio;
            }
          }
        }

        // Minimo 10px
        newW = Math.max(10, newW);
        newH = Math.max(10, newH);

        // Aplicar ao elemento
        element.style.width = `${Math.round(newW)}px`;
        element.style.height = `${Math.round(newH)}px`;

        // Se redimensionou pela esquerda ou topo, compensar posicao
        if (affectsLeft) {
          const offsetX = s.origWidth - newW;
          const currentTransform = element.style.transform || "";
          const matchT = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
          const baseX = matchT ? parseFloat(matchT[1]) : 0;
          const baseY = matchT ? parseFloat(matchT[2]) : 0;
          const cleanT = currentTransform.replace(/translate\([^)]*\)/g, "").trim();
          element.style.transform = `${cleanT} translate(${baseX + offsetX}px, ${baseY}px)`.trim();
        }
        if (affectsTop) {
          const offsetY = s.origHeight - newH;
          const currentTransform = element.style.transform || "";
          const matchT = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
          const baseX = matchT ? parseFloat(matchT[1]) : 0;
          const baseY = matchT ? parseFloat(matchT[2]) : 0;
          const cleanT = currentTransform.replace(/translate\([^)]*\)/g, "").trim();
          element.style.transform = `${cleanT} translate(${baseX}px, ${baseY + offsetY}px)`.trim();
        }

        onResizeMove();
      };

      const onUp = () => {
        setActiveHandle(null);
        startRef.current = null;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        onResizeEnd();
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [element, scale, onResizeStart, onResizeEnd, onResizeMove],
  );

  const handles: HandlePos[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

  return (
    <>
      {handles.map((pos) => {
        const { left, top } = handlePosition(pos, rect);
        return (
          <div
            key={pos}
            onMouseDown={(e) => handleMouseDown(pos, e)}
            style={{
              position: "absolute",
              left,
              top,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              background: activeHandle === pos ? "#FFD700" : "#D4A843",
              border: "1px solid #080604",
              borderRadius: pos === "n" || pos === "s" || pos === "e" || pos === "w" ? 1 : 2,
              cursor: HANDLE_CURSORS[pos],
              zIndex: 14,
              boxShadow: "0 0 4px rgba(0,0,0,0.5)",
              transition: activeHandle ? "none" : "background 0.1s",
            }}
            title={`Resize ${pos}${"\n"}Shift = proporcional`}
          />
        );
      })}
    </>
  );
}
