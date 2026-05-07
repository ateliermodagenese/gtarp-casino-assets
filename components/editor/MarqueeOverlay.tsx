"use client";

/**
 * MarqueeOverlay.tsx
 */
import { Layer, Rect, Line } from "react-konva";
import type { MarqueeRect } from "./utils/marquee";
import type { SmartGuide } from "./utils/snap";

interface Props {
  marquee?: MarqueeRect;
  guides?: SmartGuide[];
  containerSize: { w: number; h: number };
}

export default function MarqueeOverlay({ marquee, guides = [], containerSize }: Props) {
  return (
    <Layer listening={false}>
      {guides.map((g, i) => {
        const isX = g.axis === "x";
        const pos = isX
          ? (g.position / 100) * containerSize.w
          : (g.position / 100) * containerSize.h;
        return (
          <Line
            key={`${g.axis}-${g.kind}-${i}-${g.position}`}
            points={isX ? [pos, 0, pos, containerSize.h] : [0, pos, containerSize.w, pos]}
            stroke="#D4A843"
            strokeWidth={1}
            dash={[4, 4]}
            opacity={0.7}
          />
        );
      })}

      {marquee && (
        <Rect
          x={(marquee.x / 100) * containerSize.w}
          y={(marquee.y / 100) * containerSize.h}
          width={(marquee.width / 100) * containerSize.w}
          height={(marquee.height / 100) * containerSize.h}
          stroke="#D4A843"
          strokeWidth={1.5}
          dash={[6, 4]}
          fill="rgba(212,168,67,0.05)"
        />
      )}
    </Layer>
  );
}
