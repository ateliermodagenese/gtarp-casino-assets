"use client";

import { useState } from "react";
import DailyFreeIdle from "@/components/games/daily-free/DailyFreeIdle";
import DailyFreeResult from "@/components/games/daily-free/DailyFreeResult";

const mockCalendarDays = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  status: (i < 11 ? "claimed" : i === 11 ? "available" : "future") as
    | "future"
    | "available"
    | "claimed"
    | "missed",
}));

export default function DailyFreePreview() {
  const [showResult, setShowResult] = useState(false);
  const [prize] = useState(200);

  return (
    <div
      style={{
        position: "fixed",
        inset: "6px",
        zIndex: 60,
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#080604",
        backgroundImage: `
          radial-gradient(ellipse at 20% 20%, rgba(212,168,67,0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(212,168,67,0.05) 0%, transparent 50%)
        `,
        border: "1.5px solid rgba(212,168,67,0.35)",
        boxShadow: `
          inset 0 0 60px rgba(0,0,0,0.8),
          0 0 40px rgba(212,168,67,0.15)
        `,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Placeholder para GameHeader */}
      <div
        style={{
          height: "60px",
          background: "rgba(0,0,0,0.4)",
          borderBottom: "1px solid rgba(212,168,67,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Cinzel', serif",
          fontSize: "18px",
          color: "#D4A843",
          letterSpacing: "2px",
        }}
      >
        BONUS DIARIO
      </div>

      {/* Conteudo do jogo */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <DailyFreeIdle
          calendarDays={mockCalendarDays}
          currentStreak={12}
          milestones={{ 7: true, 14: false, 30: false }}
          onSpin={() => setShowResult(true)}
          lang="br"
        />
      </div>

      {/* Overlay de resultado */}
      {showResult && (
        <DailyFreeResult
          prize={prize}
          streakDay={12}
          onCollect={() => setShowResult(false)}
          lang="br"
        />
      )}
    </div>
  );
}
