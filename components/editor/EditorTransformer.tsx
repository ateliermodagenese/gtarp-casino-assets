"use client";

/**
 * EditorTransformer.tsx
 *
 * EM PALAVRAS SIMPLES: as 8 alcas (4 cantos + 4 lados) + alca de
 * rotacao que aparecem quando voce seleciona um elemento. Permite
 * arrastar pra redimensionar e rotacionar.
 *
 * TECNICAMENTE: Konva.Transformer attached ao(s) node(s)
 * selecionado(s) via ref. Inclui:
 * - rotationSnaps a cada 45 graus
 * - boundBoxFunc impedindo width/height < 5px
 * - Multi-select via array de nodes
 *
 * Em E10 ganha tambem multi-select por marquee.
 */
import { Transformer } from "react-konva";
import { useEffect, useRef } from "react";
import type Konva from "konva";

interface Props {
  selectedIds: string[];
  /** Stage ref pra encontrar os nodes via id */
  stageRef: React.RefObject<Konva.Stage | null>;
}

export default function EditorTransformer({ selectedIds, stageRef }: Props) {
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (!trRef.current) return;
    const stage = stageRef.current;
    if (!stage) return;

    if (selectedIds.length === 0) {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
      return;
    }

    // Procura nodes por id
    const nodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter((n): n is Konva.Node => Boolean(n));

    trRef.current.nodes(nodes);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedIds, stageRef]);

  return (
    <Transformer
      ref={trRef}
      // Snap de rotacao a cada 45 graus quando proximo
      rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
      rotationSnapTolerance={3}
      // Impede width/height muito pequenos
      boundBoxFunc={(oldBox, newBox) => {
        if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
          return oldBox;
        }
        return newBox;
      }}
      // Cores alinhadas com a paleta dourada do projeto
      anchorStroke="#D4A843"
      anchorFill="#0a0806"
      anchorSize={9}
      anchorCornerRadius={2}
      borderStroke="#D4A843"
      borderStrokeWidth={1.5}
      borderDash={[4, 4]}
      rotateAnchorOffset={28}
      keepRatio={false}
      flipEnabled={false}
    />
  );
}
