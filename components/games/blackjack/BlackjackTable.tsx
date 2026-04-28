"use client";

// BlackjackTable — container visual da mesa de blackjack
// Felt radial-gradient verde, borda dourada, shadow multicamada, textura de pontos
// Usado como wrapper por TODAS as telas (Betting, PlayerTurn, Split, DealerTurn)
// Cada tela passa seu conteudo como children

import type { ReactNode } from "react";
import { COLORS } from "./BlackjackConstants";

interface BlackjackTableProps {
  children: ReactNode;
  /** Largura customizada (default: clamp(320px, 60vw, 720px)) */
  width?: string;
  /** Altura minima customizada (default: clamp(300px, 55vh, 540px)) */
  minHeight?: string;
}

export default function BlackjackTable({
  children,
  width = "clamp(320px, 60vw, 720px)",
  minHeight = "clamp(300px, 55vh, 540px)",
}: BlackjackTableProps) {
  return (
    <div
      style={{
        position: "relative",
        width,
        minHeight,
        background: `radial-gradient(ellipse at 50% 50%, ${COLORS.feltLight} 0%, ${COLORS.feltMid} 70%, ${COLORS.feltEdge} 100%)`,
        borderRadius: "clamp(12px, 2vw, 20px)",
        border: "3px solid rgba(212,168,67,0.4)",
        boxShadow:
          "0 0 30px rgba(212,168,67,0.08), 0 8px 32px rgba(0,0,0,0.4), inset 0 0 150px rgba(0,0,0,0.3), 0 0 60px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "clamp(16px, 3vw, 32px) clamp(12px, 2vw, 24px)",
        overflow: "hidden",
      }}
    >
      {/* Textura de pontos sobre o felt */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "8px 8px",
          pointerEvents: "none",
          borderRadius: "inherit",
        }}
      />

      {/* Conteudo da tela (cartas, labels, side bets, etc) */}
      {children}
    </div>
  );
}
