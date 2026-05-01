"use client";

// Hook dedicado para Daily-Free — chama os 8 endpoints do server/handlers/daily.js
// Padrao identico ao use-game-api.ts (fetchNui + mock pra dev local)

import { useCallback } from "react";

const isFiveM = typeof window !== "undefined" &&
  window.location.href.includes("cfx-nui-");

const resourceName = "bc_casino";

async function fetchNui<T>(evento: string, payload?: unknown): Promise<T> {
  const resp = await fetch(`https://${resourceName}/${evento}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });
  return resp.json();
}

// ============================================================
// TIPOS — espelham o que daily.js retorna
// ============================================================

export interface WheelSegment {
  id: number;
  tier: "common" | "good" | "big" | "mystery";
  min: number;
  max: number;
  weight: number;
  icon: string; // "coin-small" | "coin-medium" | "coin-stack" | "treasure" | "gem-green"
}

export interface DailyState {
  ok: boolean;
  saldo: number;
  streak: {
    current: number;
    longest: number;
    cycle_day: number;
    total_claims: number;
    total_earned: number;
    cycles_completed: number;
    anchor_claimed: boolean;
    last_claim_at: string | null;
  };
  makeup: {
    remaining: number;
    month: string;
    max: number;
  };
  can_claim: boolean;
  can_claim_reason: string;
  cooldown_remaining_ms: number;
  vip: boolean;
  spins_per_day: number;
  config: {
    cycle_days: number;
    cooldown_hours: number;
    milestone_d7: number;
    milestone_d14: number;
    milestone_d21: number;
    milestone_d28: number;
  };
  wheel: {
    segments: WheelSegment[];
    server_seed_hash: string;
    client_seed: string;
    next_nonce: number;
  };
}

export interface DailyClaimResult {
  ok: boolean;
  claim_id: number;
  result: {
    segment_id: number;
    segment_tier: WheelSegment["tier"];
    segment_icon: string;
    wheel_amount: number;
    mystery_amount: number | null;
    milestone_day: number | null;
    milestone_bonus: number;
    total_awarded: number;
    is_anchor: boolean;
  };
  streak: {
    current: number;
    longest: number;
    cycle_day: number;
    cycles_completed: number;
  };
  saldo: number;
  provably_fair: {
    server_seed_hash: string;
    client_seed: string;
    nonce: number;
    result_hash: string;
    result_float: number;
  };
}

export interface DailyHistoryItem {
  id: number;
  claim_type: "regular" | "vip" | "makeup" | "anchor";
  streak_at_claim: number;
  cycle_day_at_claim: number;
  wheel_segment_id: number;
  wheel_segment_tier: WheelSegment["tier"];
  wheel_amount: number;
  mystery_amount: number | null;
  milestone_day: number | null;
  milestone_bonus: number;
  total_awarded: number;
  server_seed_hash: string;
  client_seed: string;
  nonce: number;
  result_hash: string;
  created_at: string;
}

// ============================================================
// MOCK DATA — pra dev local (browser sem FiveM)
// ============================================================

const MOCK_SEGMENTS: WheelSegment[] = [
  { id: 1,  tier: "common",  min: 50,   max: 50,   weight: 8,  icon: "coin-small" },
  { id: 2,  tier: "common",  min: 100,  max: 100,  weight: 8,  icon: "coin-small" },
  { id: 3,  tier: "common",  min: 50,   max: 50,   weight: 8,  icon: "coin-small" },
  { id: 4,  tier: "good",    min: 200,  max: 200,  weight: 12, icon: "coin-medium" },
  { id: 5,  tier: "common",  min: 100,  max: 100,  weight: 8,  icon: "coin-small" },
  { id: 6,  tier: "common",  min: 50,   max: 50,   weight: 8,  icon: "coin-small" },
  { id: 7,  tier: "good",    min: 500,  max: 500,  weight: 12, icon: "coin-medium" },
  { id: 8,  tier: "common",  min: 100,  max: 100,  weight: 8,  icon: "coin-small" },
  { id: 9,  tier: "big",     min: 1000, max: 1000, weight: 8,  icon: "coin-stack" },
  { id: 10, tier: "common",  min: 50,   max: 50,   weight: 8,  icon: "coin-small" },
  { id: 11, tier: "common",  min: 100,  max: 100,  weight: 8,  icon: "coin-small" },
  { id: 12, tier: "mystery", min: 1000, max: 5000, weight: 4,  icon: "treasure" },
];

const MOCK_STATE: DailyState = {
  ok: true,
  saldo: 2500,
  streak: {
    current: 11,
    longest: 14,
    cycle_day: 11,
    total_claims: 11,
    total_earned: 1850,
    cycles_completed: 0,
    anchor_claimed: true,
    last_claim_at: new Date(Date.now() - 24 * 3600000 - 60000).toISOString(),
  },
  makeup: { remaining: 2, month: "2026-04", max: 3 },
  can_claim: true,
  can_claim_reason: "rolling_24h_ok",
  cooldown_remaining_ms: 0,
  vip: false,
  spins_per_day: 1,
  config: {
    cycle_days: 28,
    cooldown_hours: 24,
    milestone_d7: 500,
    milestone_d14: 1000,
    milestone_d21: 2500,
    milestone_d28: 5000,
  },
  wheel: {
    segments: MOCK_SEGMENTS,
    server_seed_hash: "a".repeat(64),
    client_seed: "mock_client_seed",
    next_nonce: 12,
  },
};

// Mock claim com resultado aleatorio (apenas para dev)
function generateMockClaim(state: DailyState): DailyClaimResult {
  // Weighted pick
  const segments = state.wheel.segments;
  const total = segments.reduce((s, x) => s + x.weight, 0);
  const target = Math.random() * total;
  let acum = 0;
  let chosen = segments[0];
  for (const seg of segments) {
    acum += seg.weight;
    if (target < acum) { chosen = seg; break; }
  }
  const wheelAmount = (chosen.tier === "mystery")
    ? Math.floor(chosen.min + Math.random() * (chosen.max - chosen.min + 1))
    : chosen.min;
  const newCycleDay = (state.streak.cycle_day % 28) + 1;
  const isMilestone = [7, 14, 21, 28].includes(newCycleDay);
  const milestoneBonus = isMilestone
    ? state.config[`milestone_d${newCycleDay}` as keyof typeof state.config] || 0
    : 0;
  return {
    ok: true,
    claim_id: Math.floor(Math.random() * 1000),
    result: {
      segment_id: chosen.id,
      segment_tier: chosen.tier,
      segment_icon: chosen.icon,
      wheel_amount: wheelAmount,
      mystery_amount: chosen.tier === "mystery" ? wheelAmount : null,
      milestone_day: isMilestone ? newCycleDay : null,
      milestone_bonus: milestoneBonus,
      total_awarded: wheelAmount + milestoneBonus,
      is_anchor: false,
    },
    streak: {
      current: state.streak.current + 1,
      longest: Math.max(state.streak.longest, state.streak.current + 1),
      cycle_day: newCycleDay,
      cycles_completed: state.streak.cycles_completed,
    },
    saldo: state.saldo + wheelAmount + milestoneBonus,
    provably_fair: {
      server_seed_hash: state.wheel.server_seed_hash,
      client_seed: state.wheel.client_seed,
      nonce: state.wheel.next_nonce,
      result_hash: Math.random().toString(36).repeat(4).substring(0, 64),
      result_float: Math.random(),
    },
  };
}

// ============================================================
// HOOK
// ============================================================

export function useDailyAPI() {
  const getState = useCallback(async (): Promise<DailyState> => {
    if (!isFiveM) {
      await new Promise(r => setTimeout(r, 200));
      return MOCK_STATE;
    }
    return fetchNui<DailyState>("casino:daily:state");
  }, []);

  const claim = useCallback(async (): Promise<DailyClaimResult> => {
    if (!isFiveM) {
      await new Promise(r => setTimeout(r, 600));
      return generateMockClaim(MOCK_STATE);
    }
    return fetchNui<DailyClaimResult>("casino:daily:claim");
  }, []);

  const getHistory = useCallback(async (
    limit = 30,
    offset = 0
  ): Promise<{ ok: boolean; history: DailyHistoryItem[]; total: number }> => {
    if (!isFiveM) {
      await new Promise(r => setTimeout(r, 200));
      return { ok: true, history: [], total: 0 };
    }
    return fetchNui("casino:daily:history", { limit, offset });
  }, []);

  const rotateSeed = useCallback(async (newClientSeed: string): Promise<{
    ok: boolean;
    revealed_old_server_seed?: string;
    new_server_seed_hash?: string;
    new_client_seed?: string;
    nonce?: number;
    error?: string;
  }> => {
    if (!isFiveM) {
      return {
        ok: true,
        revealed_old_server_seed: "x".repeat(64),
        new_server_seed_hash: "y".repeat(64),
        new_client_seed: newClientSeed,
        nonce: 0,
      };
    }
    return fetchNui("casino:daily:rotate-seed", { client_seed: newClientSeed });
  }, []);

  const useMakeupToken = useCallback(async (): Promise<{
    ok: boolean;
    tokens_remaining?: number;
    streak_preserved?: number;
    error?: string;
  }> => {
    if (!isFiveM) {
      return { ok: true, tokens_remaining: 1, streak_preserved: 11 };
    }
    return fetchNui("casino:daily:use-makeup");
  }, []);

  const verify = useCallback(async (claimId: number): Promise<{
    ok: boolean;
    claim?: DailyHistoryItem;
    provably_fair?: {
      server_seed_hash: string;
      server_seed: string | null;
      client_seed: string;
      nonce: number;
      result_hash: string;
      result_float: number;
      recomputed_hmac: string | null;
      recomputed_float: number | null;
      matches_original: boolean | null;
    };
    error?: string;
  }> => {
    if (!isFiveM) {
      return { ok: true };
    }
    return fetchNui("casino:daily:verify", { claim_id: claimId });
  }, []);

  return {
    getState,
    claim,
    getHistory,
    rotateSeed,
    useMakeupToken,
    verify,
    isFiveM,
  };
}
