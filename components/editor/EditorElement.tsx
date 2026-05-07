"use client";

/**
 * EditorElement.tsx
 *
 * EM PALAVRAS SIMPLES: cada elemento (imagem/retangulo/texto/
 * placeholder) eh renderizado por este componente. Quando voce
 * arrasta, ele "gruda" em outros elementos proximos (smart guides)
 * ou na grade (Shift desliga snap).
 *
 * TECNICAMENTE: wrapper polimorfico memoizado (React.memo).
 * dragBoundFunc dispara computeSnap a cada frame de drag e devolve
 * coords corrigidas — Konva usa pra reposicionar o node sem
 * trigger React re-render. Pause/resume zundo + onChange so no end.
 *
 * Performance: perfectDrawEnabled:false, transformsEnabled em
 * "position" pra elementos so-mover (vira "all" durante transform).
 */
import { Image as KonvaImage, Rect as KonvaRect, Text as KonvaText, Group } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";
import { forwardRef, memo, useCallback, useRef } from "react";
import type { GameElement } from "./state/schema";
import { percentBoxToPx } from "./utils/coordinates";
import { computeSnap, type SmartGuide } from "./utils/snap";

interface Props {
  element: GameElement;
  /** Outros elementos da cena pra calcular smart guides */
  siblings: GameElement[];
  container: { w: number; h: number };
  isSelected: boolean;
  /** Se Shift esta pressionado, desliga snap (movimento livre) */
  snapEnabled: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<GameElement>) => void;
  onDragStart?: () => void;
  onDragEndGate?: () => void;
  onTransformStart?: () => void;
  onTransformEndGate?: () => void;
  /** Recebe guides pra renderizar no overlay */
  onGuidesChange?: (guides: SmartGuide[]) => void;
}

const EditorElementInner = forwardRef<Konva.Node, Props>(function EditorElementInner(
  {
    element,
    siblings,
    container,
    isSelected,
    snapEnabled,
    onSelect,
    onChange,
    onDragStart,
    onDragEndGate,
    onTransformStart,
    onTransformEndGate,
    onGuidesChange,
  },
  ref,
) {
  const px = percentBoxToPx(element, container);
  const lastGuides = useRef<SmartGuide[]>([]);

  // dragBoundFunc — chamado a cada frame durante drag. Retorna posicao
  // ajustada (snap). NAO trigger React re-render — Konva usa direto.
  const dragBoundFunc = useCallback(
    (pos: { x: number; y: number }) => {
      if (!snapEnabled) return pos;

      // Converte pos px -> %, aplica snap, devolve px
      const candidate = {
        x: (pos.x / container.w) * 100,
        y: (pos.y / container.h) * 100,
        width: element.width,
        height: element.height,
      };
      const others = siblings.filter((s) => s.id !== element.id);
      const result = computeSnap(candidate, others);

      // Notifica guides pro overlay (no proximo tick, fora do drag bound)
      if (onGuidesChange) {
        const same =
          result.guides.length === lastGuides.current.length &&
          result.guides.every(
            (g, i) =>
              g.axis === lastGuides.current[i]?.axis &&
              g.position === lastGuides.current[i]?.position,
          );
        if (!same) {
          lastGuides.current = result.guides;
          // Defer pra fora do drag bound func pra nao bloquear
          requestAnimationFrame(() => onGuidesChange(result.guides));
        }
      }

      return {
        x: (result.x / 100) * container.w,
        y: (result.y / 100) * container.h,
      };
    },
    [snapEnabled, container, element.id, element.width, element.height, siblings, onGuidesChange],
  );

  const handleDragStart = useCallback(() => {
    onDragStart?.();
  }, [onDragStart]);

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      onChange({
        x: (node.x() / container.w) * 100,
        y: (node.y() / container.h) * 100,
      });
      // Limpa guides
      onGuidesChange?.([]);
      lastGuides.current = [];
      onDragEndGate?.();
    },
    [onChange, container, onGuidesChange, onDragEndGate],
  );

  const handleTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      onChange({
        x: (node.x() / container.w) * 100,
        y: (node.y() / container.h) * 100,
        width: ((node.width() * scaleX) / container.w) * 100,
        height: ((node.height() * scaleY) / container.h) * 100,
        rotation: node.rotation(),
      });
      onTransformEndGate?.();
    },
    [onChange, container, onTransformEndGate],
  );

  const commonProps = {
    id: element.id,
    x: px.x,
    y: px.y,
    width: px.width,
    height: px.height,
    rotation: element.rotation,
    opacity: element.opacity,
    visible: element.visible,
    draggable: !element.locked,
    dragBoundFunc,
    onClick: onSelect,
    onTap: onSelect,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onTransformStart: () => onTransformStart?.(),
    onTransformEnd: handleTransformEnd,
    perfectDrawEnabled: false,
    // transformsEnabled: "position" eh o ideal pra so-mover, mas
    // quando seleciona pra rotacionar precisa "all". Konva
    // detecta sozinho com transformer attached.
  };

  if (element.type === "image") {
    return <ImageElementInner element={element} commonProps={commonProps} forwardedRef={ref} isSelected={isSelected} />;
  }

  if (element.type === "rect") {
    return (
      <KonvaRect
        ref={ref as React.RefObject<Konva.Rect>}
        {...commonProps}
        fill={element.fill}
        stroke={isSelected ? "#D4A843" : element.stroke}
        strokeWidth={isSelected ? 1.5 : element.strokeWidth ?? 0}
        cornerRadius={element.cornerRadius ?? 0}
      />
    );
  }

  if (element.type === "text") {
    const fontSizePx = (element.fontSize / 100) * container.h;
    const display = element.binding ? element.binding : element.text;
    return (
      <KonvaText
        ref={ref as React.RefObject<Konva.Text>}
        {...commonProps}
        text={display}
        fontFamily={element.fontFamily}
        fontSize={fontSizePx}
        fill={element.color}
        align={element.align}
        fontStyle={element.fontWeight && element.fontWeight >= 700 ? "bold" : "normal"}
        stroke={isSelected ? "#D4A843" : undefined}
        strokeWidth={isSelected ? 1 : 0}
      />
    );
  }

  if (element.type === "placeholder") {
    return (
      <Group ref={ref as React.RefObject<Konva.Group>} {...commonProps}>
        <KonvaRect
          width={px.width}
          height={px.height}
          fill="rgba(212,168,67,0.08)"
          stroke={isSelected ? "#D4A843" : "rgba(212,168,67,0.6)"}
          strokeWidth={isSelected ? 2 : 1.5}
          dash={[6, 4]}
        />
        <KonvaText
          text={`PLACEHOLDER\n${element.placeholderId}\n${element.description ?? ""}`}
          x={8}
          y={8}
          width={px.width - 16}
          fontSize={11}
          fontFamily="ui-monospace, monospace"
          fill="#D4A843"
        />
      </Group>
    );
  }

  return null;
});

function ImageElementInner({
  element,
  commonProps,
  forwardedRef,
  isSelected,
}: {
  element: Extract<GameElement, { type: "image" }>;
  commonProps: Record<string, unknown>;
  forwardedRef: React.ForwardedRef<Konva.Node>;
  isSelected: boolean;
}) {
  const [image] = useImage(element.src, "anonymous");
  if (!image) return null;
  return (
    <KonvaImage
      ref={forwardedRef as React.RefObject<Konva.Image>}
      {...commonProps}
      image={image}
      stroke={isSelected ? "#D4A843" : undefined}
      strokeWidth={isSelected ? 1.5 : 0}
    />
  );
}

/**
 * Memo'd export — re-renderiza so quando props mudam.
 * Compara element por id+versao (stringify rapido em essential keys),
 * containerSize, isSelected, snapEnabled.
 */
const EditorElement = memo(EditorElementInner, (prev, next) => {
  if (prev.element !== next.element) return false;
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.snapEnabled !== next.snapEnabled) return false;
  if (prev.container.w !== next.container.w || prev.container.h !== next.container.h) return false;
  // siblings comparison: shallow length + identity check
  if (prev.siblings.length !== next.siblings.length) return false;
  for (let i = 0; i < prev.siblings.length; i++) {
    if (prev.siblings[i] !== next.siblings[i]) return false;
  }
  return true;
});

export default EditorElement;
