"use client";

import { DailyFreeGame } from "@/components/games/daily-free";
import { useRouter } from "next/navigation";

export default function DailyFreePage() {
  const router = useRouter();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#080604",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <DailyFreeGame
        onBack={() => router.push("/")}
        lang="br"
        initialStreak={11}
        initialDay={11}
        canSpin={true}
        remainingMs={0}
        isVip={false}
        makeUpTokens={2}
        cycleResetDays={16}
        multiplier={5}
        currencyName="GCoin"
      />
    </div>
  );
}
