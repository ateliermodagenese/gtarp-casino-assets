"use client";

/**
 * EditorStage.tsx
 *
 * EM PALAVRAS SIMPLES: o canvas central. Voce pode arrastar elementos,
 * ou clicar e arrastar numa area vazia pra selecionar varios de uma
 * vez (marquee). Smart guides (linhas douradas) aparecem quando o
 * elemento se alinha com outro.
 *
 * TECNICAMENTE: Stage Konva com 4 layers:
 * 1. Background (PNG/video, listening:false)
 * 2. Elementos interativos
 * 3. Marquee + smart guides overlay (listening:false)
 * 4. Transformer (UI overlay)
 *
 * Marquee state via useState. Smart guides via callback do
 * EditorElement.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer } from "react-konva";
import BackgroundLayer from "./BackgroundLayer";
import EditorElement from "./EditorElement";
import EditorTransformer from "./EditorTransformer";
import MarqueeOverlay from "./MarqueeOverlay";
import { useEditorStore } from "./state/editorStore";
import { useDragHistoryGate } from "./utils/history";
import { makeMarquee, findElementsInMarquee, type MarqueeRect } from "./utils/marquee";
import type { SmartGuide } from "./utils/snap";
import type Konva from "konva";

export default function EditorStage() {
  const layout = useEditorStore((s) => s.layout);
  const currentSceneId = useEditorStore((s) => s.currentSceneId);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const setSelection = useEditorStore((s) => s.setSelection);
  const updateElement = useEditorStore((s) => s.updateElement);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [marquee, setMarquee] = useState<MarqueeRect | undefined>();
  const [guides, setGuides] = useState<SmartGuide[]>([]);
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);

  const scene = layout.scenes.find((s) => s.id === currentSceneId);
  const aspect = layout.baseResolution.width / layout.baseResolution.height;
  const gate = useDragHistoryGate();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setSize({ w, h: w / aspect });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect]);

  // Stage mouse down: se for em area vazia, comeca marquee
  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target !== e.target.getStage()) return;
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      marqueeStart.current = {
        x: (pos.x / size.w) * 100,
        y: (pos.y / size.h) * 100,
      };
    },
    [size],
  );

  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!marqueeStart.current) return;
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const end = {
        x: (pos.x / size.w) * 100,
        y: (pos.y / size.h) * 100,
      };
      setMarquee(makeMarquee(marqueeStart.current, end));
    },
    [size],
  );

  const handleStageMouseUp = useCallback(() => {
    if (marqueeStart.current && marquee) {
      // Marquee tem que ter tamanho minimo pra evitar selecao por click
      if (marquee.width > 0.5 || marquee.height > 0.5) {
        const ids = findElementsInMarquee(marquee, scene?.elements ?? []);
        setSelection(ids);
      } else {
        setSelection([]);
      }
    }
    marqueeStart.current = null;
    setMarquee(undefined);
  }, [marquee, scene, setSelection]);

  const handleElementSelect = useCallback(
    (id: string) => {
      const shiftKey =
        typeof window !== "undefined" &&
        (window as Window & { __lastShiftKey?: boolean }).__lastShiftKey === true;
      if (shiftKey) {
        const has = selectedIds.includes(id);
        setSelection(has ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);
      } else {
        setSelection([id]);
      }
    },
    [selectedIds, setSelection],
  );

  // Detectar Shift pra desligar snap (movimento livre)
  const [snapEnabled, setSnapEnabled] = useState(true);
  useEffect(() => {
    const sync = (e: KeyboardEvent) => setSnapEnabled(!e.shiftKey);
    window.addEventListener("keydown", sync);
    window.addEventListener("keyup", sync);
    return () => {
      window.removeEventListener("keydown", sync);
      window.removeEventListener("keyup", sync);
    };
  }, []);

  if (!scene) {
    return (
      <div style={emptyStyle}>
        <p style={{ color: "#8a8a8a" }}>
          Cena <code style={{ color: "#D4A843" }}>{currentSceneId}</code> nao encontrada.
        </p>
      </div>
    );
  }

  const sortedElements = scene.elements.slice().sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        aspectRatio: `${aspect}`,
        background: "#1a1410",
        border: "1px solid rgba(212,168,67,0.2)",
        borderRadius: 8,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {size.w > 0 && (
        <Stage
          ref={stageRef}
          width={size.w}
          height={size.h}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onTouchStart={handleStageMouseDown as unknown as Konva.KonvaEventListener<Konva.Stage, TouchEvent>}
          onTouchMove={handleStageMouseMove as unknown as Konva.KonvaEventListener<Konva.Stage, TouchEvent>}
          onTouchEnd={handleStageMouseUp}
        >
          <BackgroundLayer background={scene.background} width={size.w} height={size.h} />

          <Layer>
            {sortedElements.map((el) => (
              <EditorElement
                key={el.id}
                element={el}
                siblings={scene.elements}
                container={size}
                isSelected={selectedIds.includes(el.id)}
                snapEnabled={snapEnabled}
                onSelect={() => handleElementSelect(el.id)}
                onChange={(patch) => updateElement(el.id, patch)}
                onDragStart={gate.begin}
                onDragEndGate={gate.end}
                onTransformStart={gate.begin}
                onTransformEndGate={gate.end}
                onGuidesChange={setGuides}
              />
            ))}
          </Layer>

          <MarqueeOverlay marquee={marquee} guides={guides} containerSize={size} />

          <Layer>
            <EditorTransformer selectedIds={selectedIds} stageRef={stageRef} />
          </Layer>
        </Stage>
      )}
    </div>
  );
}

const emptyStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "16/9",
  background: "#1a1410",
  border: "1px dashed rgba(212,168,67,0.3)",
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
