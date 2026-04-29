"use client";

import { useState, useCallback, useMemo } from "react";
import DailyFreeIdle from "@/components/games/daily-free/DailyFreeIdle";
import DailyFreeResult from "@/components/games/daily-free/DailyFreeResult";
import DailyFreeMilestone from "@/components/games/daily-free/DailyFreeMilestone";
import DailyFreeClaimed from "@/components/games/daily-free/DailyFreeClaimed";

// Prizes on the wheel
const PRIZES = [1000, 100, 50, 200, 200, 50, 100, 500];

type GameState = "idle" | "result" | "milestone" | "claimed";

export default function DailyFreePreview() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [prize, setPrize] = useState(200);
  const [currentStreak, setCurrentStreak] = useState(6); // Start at 6 to trigger 7-day milestone
  const [pendingMilestone, setPendingMilestone] = useState<7 | 14 | 30 | null>(null);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [timeLeft] = useState(85200000); // ~23:40:00

  // Calendar days - dynamically updated based on current streak
  const calendarDays = useMemo(() => {
    const claimedCount = hasSpunToday ? currentStreak : currentStreak;
    return Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      status: (
        i < claimedCount - 1 ? "claimed" :
        i === claimedCount - 1 && hasSpunToday ? "claimed" :
        i === claimedCount - 1 && !hasSpunToday ? "claimed" :
        i === claimedCount ? (hasSpunToday ? "future" : "available") :
        "future"
      ) as "future" | "available" | "claimed" | "missed",
    }));
  }, [currentStreak, hasSpunToday]);

  // Handle spin
  const handleSpin = useCallback(() => {
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    setPrize(PRIZES[prizeIndex]);

    // Increment streak
    const newStreak = currentStreak + 1;
    setCurrentStreak(newStreak);
    setHasSpunToday(true);

    // Check milestones
    if (newStreak === 7 || newStreak === 14 || newStreak === 30) {
      setPendingMilestone(newStreak as 7 | 14 | 30);
    }

    setGameState("result");
  }, [currentStreak]);

  // Handle collect from result
  const handleCollect = useCallback(() => {
    if (pendingMilestone) {
      setGameState("milestone");
    } else {
      setGameState("claimed");
    }
  }, [pendingMilestone]);

  // Handle collect from milestone
  const handleMilestoneCollect = useCallback(() => {
    setPendingMilestone(null);
    setGameState("claimed");
  }, []);

  // Reset to idle (for testing)
  const handleReset = useCallback(() => {
    setGameState("idle");
    setHasSpunToday(false);
    setCurrentStreak(6);
    setPendingMilestone(null);
  }, []);

  // Milestones status
  const milestones = {
    7: currentStreak >= 7,
    14: currentStreak >= 14,
    30: currentStreak >= 30,
  };

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
          justifyContent: "space-between",
          padding: "0 24px",
          fontFamily: "'Cinzel', serif",
        }}
      >
        <div style={{ color: "#D4A843", fontSize: "14px", cursor: "pointer" }} onClick={handleReset}>
          ← VOLTAR (Reset)
        </div>
        <div style={{ color: "#D4A843", fontSize: "18px", letterSpacing: "2px" }}>
          BONUS DIARIO
        </div>
        <div style={{ color: "#00E676", fontSize: "14px", fontFamily: "monospace" }}>
          Streak: {currentStreak}
        </div>
      </div>

      {/* Conteudo do jogo */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {/* Show Idle or Claimed based on hasSpunToday */}
        {gameState === "idle" && (
          <DailyFreeIdle
            calendarDays={calendarDays}
            currentStreak={currentStreak}
            milestones={milestones}
            onSpin={handleSpin}
            lang="br"
          />
        )}

        {gameState === "claimed" && (
          <DailyFreeClaimed
            calendarDays={calendarDays}
            currentStreak={currentStreak}
            milestones={milestones}
            timeLeft={timeLeft}
            todayPrize={prize}
            lang="br"
          />
        )}

        {/* Result overlay */}
        {gameState === "result" && (
          <DailyFreeResult
            prize={prize}
            streakDay={currentStreak}
            onCollect={handleCollect}
            lang="br"
          />
        )}

        {/* Milestone overlay */}
        {gameState === "milestone" && pendingMilestone && (
          <DailyFreeMilestone
            tier={pendingMilestone}
            bonus={pendingMilestone === 7 ? 500 : pendingMilestone === 14 ? 1000 : 5000}
            onCollect={handleMilestoneCollect}
            lang="br"
          />
        )}
      </div>

      {/* Flow info bar */}
      <div
        style={{
          padding: "12px 24px",
          background: "rgba(0,0,0,0.5)",
          borderTop: "1px solid rgba(212,168,67,0.2)",
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          fontFamily: "monospace",
          fontSize: "12px",
        }}
      >
        <span style={{ color: gameState === "idle" ? "#00E676" : "#666" }}>
          1. IDLE
        </span>
        <span style={{ color: "#666" }}>→</span>
        <span style={{ color: gameState === "result" ? "#00E676" : "#666" }}>
          2. RESULT
        </span>
        <span style={{ color: "#666" }}>→</span>
        <span style={{ color: gameState === "milestone" ? "#00E676" : "#666" }}>
          3. MILESTONE
        </span>
        <span style={{ color: "#666" }}>→</span>
        <span style={{ color: gameState === "claimed" ? "#00E676" : "#666" }}>
          4. CLAIMED
        </span>
      </div>
    </div>
  );
}
