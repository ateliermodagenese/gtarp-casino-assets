"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { GameHeader } from "@/components/shared";
import { useCasino } from "@/contexts/CasinoContext";
import DailyFreeIdle from "./DailyFreeIdle";
import DailyFreeResult from "./DailyFreeResult";
import DailyFreeMilestone from "./DailyFreeMilestone";

interface DailyFreeGameProps {
  onBack: () => void;
  onDeposit?: () => void;
}

// Mock calendar data - in production this would come from server
const generateCalendarDays = (currentDay: number, streak: number) => {
  return Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    if (day < currentDay) {
      // Days before today - check if within streak
      const daysAgo = currentDay - day;
      if (daysAgo <= streak) {
        return { day, status: "claimed" as const };
      }
      return { day, status: "missed" as const };
    } else if (day === currentDay) {
      return { day, status: "available" as const };
    }
    return { day, status: "future" as const };
  });
};

// Prize segments on the wheel
const PRIZES = [1000, 100, 50, 200, 200, 50, 100, 500];

// Milestone bonuses
const MILESTONE_BONUSES: Record<7 | 14 | 30, number> = {
  7: 500,
  14: 1000,
  30: 5000,
};

type GameState = "idle" | "spinning" | "result" | "milestone";

export default function DailyFreeGame({ onBack, onDeposit }: DailyFreeGameProps) {
  const { lang } = useCasino();
  const gameLang = lang === "br" ? "br" : "en";

  // Game state
  const [gameState, setGameState] = useState<GameState>("idle");
  const [currentDay] = useState(12); // Mock: today is day 12
  const [currentStreak, setCurrentStreak] = useState(11); // Mock: 11 days streak (will become 12 after spin)
  const [prize, setPrize] = useState(0);
  const [pendingMilestone, setPendingMilestone] = useState<7 | 14 | 30 | null>(null);

  // Calendar data
  const calendarDays = generateCalendarDays(currentDay, currentStreak);

  // Milestones achieved
  const milestones = {
    7: currentStreak >= 7,
    14: currentStreak >= 14,
    30: currentStreak >= 30,
  };

  // Handle spin
  const handleSpin = useCallback(() => {
    // Random prize
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const wonPrize = PRIZES[prizeIndex];
    setPrize(wonPrize);

    // Increment streak
    const newStreak = currentStreak + 1;
    setCurrentStreak(newStreak);

    // Check if hit a milestone
    if (newStreak === 7 || newStreak === 14 || newStreak === 30) {
      setPendingMilestone(newStreak as 7 | 14 | 30);
    }

    // Show result
    setGameState("result");
  }, [currentStreak]);

  // Handle collect from result
  const handleCollect = useCallback(() => {
    if (pendingMilestone) {
      setGameState("milestone");
    } else {
      setGameState("idle");
    }
  }, [pendingMilestone]);

  // Handle collect from milestone
  const handleMilestoneCollect = useCallback(() => {
    setPendingMilestone(null);
    setGameState("idle");
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "absolute",
        inset: "6px",
        zIndex: 60,
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#080604",
        backgroundImage: `
          url("/assets/ui/bg-casino.png"),
          radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,168,67,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 50% 100%, rgba(0,0,0,0.5) 0%, transparent 70%)
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        border: "1.5px solid rgba(212,168,67,0.35)",
        boxShadow: `
          inset 0 0 60px rgba(0,0,0,0.4),
          0 0 25px rgba(212,168,67,0.2),
          0 0 50px rgba(212,168,67,0.1)
        `,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <GameHeader
        titleBR="DAILY-FREE"
        titleEN="DAILY-FREE"
        subtitleBR="Roda da Fortuna • 1 giro por dia • 100% gratis"
        subtitleEN="Fortune Wheel • 1 spin per day • 100% free"
        onBack={onBack}
        onDeposit={onDeposit}
        hideHistoryButton
        hideProvablyFairButton
      />

      {/* Game content */}
      <div
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(12px, 2vw, 24px)",
        }}
      >
        {/* Main game area */}
        <DailyFreeIdle
          calendarDays={calendarDays}
          currentStreak={currentStreak}
          milestones={milestones}
          onSpin={handleSpin}
          lang={gameLang}
        />

        {/* Result overlay */}
        {gameState === "result" && (
          <DailyFreeResult
            prize={prize}
            streakDay={currentDay}
            onCollect={handleCollect}
            lang={gameLang}
          />
        )}

        {/* Milestone overlay */}
        {gameState === "milestone" && pendingMilestone && (
          <DailyFreeMilestone
            tier={pendingMilestone}
            bonus={MILESTONE_BONUSES[pendingMilestone]}
            onCollect={handleMilestoneCollect}
            lang={gameLang}
          />
        )}
      </div>

      {/* Footer info bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          padding: "clamp(8px, 1.2vw, 16px) clamp(16px, 2vw, 32px)",
          borderTop: "1px solid rgba(212,168,67,0.15)",
          background: "rgba(0,0,0,0.3)",
        }}
      >
        {/* Streak info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(6px, 0.8vw, 12px)",
          }}
        >
          <img
            src="/assets/games/daily-free/icons/icon-flame.png"
            alt=""
            style={{
              width: "clamp(24px, 3vw, 36px)",
              height: "clamp(24px, 3vw, 36px)",
              filter: "drop-shadow(0 0 6px rgba(255,140,0,0.6))",
            }}
          />
          <div>
            <div
              style={{
                fontFamily: "var(--font-cinzel), Cinzel, serif",
                fontSize: "clamp(10px, 1.1vw, 14px)",
                color: "rgba(212,168,67,0.7)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {gameLang === "br" ? "SEQUENCIA" : "STREAK"}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono), JetBrains Mono, monospace",
                fontSize: "clamp(14px, 1.6vw, 20px)",
                fontWeight: 700,
                color: "#D4A843",
              }}
            >
              {currentStreak} {gameLang === "br" ? "DIAS" : "DAYS"}
            </div>
          </div>
        </div>

        {/* Next spin timer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(6px, 0.8vw, 12px)",
          }}
        >
          <div
            style={{
              width: "clamp(24px, 3vw, 36px)",
              height: "clamp(24px, 3vw, 36px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              background: "rgba(212,168,67,0.1)",
              border: "1px solid rgba(212,168,67,0.3)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D4A843"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <line x1="9" y1="2" x2="9" y2="6" />
              <line x1="15" y1="2" x2="15" y2="6" />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-cinzel), Cinzel, serif",
                fontSize: "clamp(10px, 1.1vw, 14px)",
                color: "rgba(212,168,67,0.7)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {gameLang === "br" ? "PROXIMO GIRO" : "NEXT SPIN"}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono), JetBrains Mono, monospace",
                fontSize: "clamp(14px, 1.6vw, 20px)",
                fontWeight: 700,
                color: "#D4A843",
              }}
            >
              23:47:32
            </div>
          </div>
        </div>

        {/* How it works */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(6px, 0.8vw, 12px)",
          }}
        >
          <div
            style={{
              width: "clamp(24px, 3vw, 36px)",
              height: "clamp(24px, 3vw, 36px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background: "rgba(212,168,67,0.1)",
              border: "1px solid rgba(212,168,67,0.3)",
              fontFamily: "var(--font-cinzel), Cinzel, serif",
              fontSize: "clamp(14px, 1.6vw, 20px)",
              fontWeight: 700,
              color: "#D4A843",
            }}
          >
            ?
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-cinzel), Cinzel, serif",
                fontSize: "clamp(10px, 1.1vw, 14px)",
                color: "rgba(212,168,67,0.7)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {gameLang === "br" ? "COMO FUNCIONA" : "HOW IT WORKS"}
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans), Inter, sans-serif",
                fontSize: "clamp(10px, 1vw, 13px)",
                color: "rgba(255,255,255,0.6)",
                maxWidth: "clamp(120px, 15vw, 200px)",
              }}
            >
              {gameLang === "br"
                ? "Gire 1x por dia e mantenha sua sequencia para ganhar bonus maiores!"
                : "Spin 1x per day and keep your streak to earn bigger bonuses!"}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
