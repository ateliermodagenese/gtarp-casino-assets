"use client";

// useEconomyConfig — hook shared para sistema de multiplier de economia
// Todos os jogos usam este hook para obter o multiplier e moeda do servidor
// Web: retorna defaults (multiplier 1.0, GCoin)
// FiveM: busca de casino_economy_config + override por jogo

import { useState, useEffect, useCallback } from "react";

const isFiveM =
  typeof window !== "undefined" &&
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

export interface EconomyConfig {
  // Multiplier efetivo (global ou override do jogo)
  multiplier: number;
  // Moeda do servidor
  currency: {
    name: string;
    symbol: string;
    icon: string;
  };
  // Multiplier global (pra mostrar no painel admin)
  globalMultiplier: number;
  // Override do jogo especifico (null = usa global)
  gameOverride: number | null;
}

const DEFAULTS: EconomyConfig = {
  multiplier: 1.0,
  currency: {
    name: "GCoin",
    symbol: "GC",
    icon: "/assets/shared/icons/icon-gcoin.png",
  },
  globalMultiplier: 1.0,
  gameOverride: null,
};

// Cache global pra nao buscar toda vez que um componente monta
let cachedEconomy: EconomyConfig | null = null;
let economyPromise: Promise<EconomyConfig> | null = null;

async function loadEconomy(gameId?: string): Promise<EconomyConfig> {
  if (cachedEconomy && !gameId) return cachedEconomy;

  if (!isFiveM) {
    cachedEconomy = DEFAULTS;
    return DEFAULTS;
  }

  if (economyPromise && !gameId) return economyPromise;

  economyPromise = fetchNui<{
    global_multiplier?: number;
    multiplier_override?: number | null;
    currency_name?: string;
    currency_symbol?: string;
    currency_icon?: string;
  }>("casino:economy:getConfig", { gameId: gameId || null })
    .then((raw) => {
      const globalMult = raw?.global_multiplier ?? 1.0;
      const override = raw?.multiplier_override ?? null;
      const effectiveMult = override ?? globalMult;

      const config: EconomyConfig = {
        multiplier: effectiveMult,
        currency: {
          name: raw?.currency_name ?? DEFAULTS.currency.name,
          symbol: raw?.currency_symbol ?? DEFAULTS.currency.symbol,
          icon: raw?.currency_icon ?? DEFAULTS.currency.icon,
        },
        globalMultiplier: globalMult,
        gameOverride: override,
      };

      cachedEconomy = config;
      economyPromise = null;
      return config;
    })
    .catch(() => {
      cachedEconomy = DEFAULTS;
      economyPromise = null;
      return DEFAULTS;
    });

  return economyPromise;
}

/**
 * Hook de economia — retorna multiplier efetivo + moeda do servidor
 * @param gameId - ID do jogo pra buscar override especifico (ex: "daily-free", "slots")
 */
export function useEconomyConfig(gameId?: string) {
  const [config, setConfig] = useState<EconomyConfig>(cachedEconomy ?? DEFAULTS);
  const [loading, setLoading] = useState(!cachedEconomy);

  useEffect(() => {
    let mounted = true;
    loadEconomy(gameId).then((cfg) => {
      if (!mounted) return;
      setConfig(cfg);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [gameId]);

  const reload = useCallback(() => {
    cachedEconomy = null;
    economyPromise = null;
    setLoading(true);
    loadEconomy(gameId).then((cfg) => {
      setConfig(cfg);
      setLoading(false);
    });
  }, [gameId]);

  return { economy: config, loading, reload };
}

/**
 * Invalida o cache (chamar quando admin muda multiplier)
 */
export function invalidateEconomyCache() {
  cachedEconomy = null;
  economyPromise = null;
}
