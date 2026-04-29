"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCasino } from "@/contexts/CasinoContext";
import { GameHeader, useEscStack, HistoryModal, ProvablyFairModal, WinBadge, WinAmount, MultiBadge } from "@/components/shared";
import type { PFData } from "@/components/shared";
import { useCurrencyConfig } from "@/hooks/use-currency-config";
import { sha256, generateSecureSeed, createSeedPair } from "@/components/shared/crypto";
import { useCrashSound } from "./useCrashSound";
import { CrashCanvas } from "./CrashCanvas";
import { CrashControls } from "./CrashControls";
import { CrashHistory } from "./CrashHistory";
import { CrashBetFeed } from "./CrashBetFeed";
import CrashBigWin from "./CrashBigWin";
import CrashMilestone from "./CrashMilestone";
import CrashAutoBet from "./CrashAutoBet";
import type { AutoBetConfig } from "./CrashAutoBet";

// ===========================================================================
// CRASH GAME — Blackout Casino
// Estados: WAITING → BETTING → RISING → CRASHED
// ===========================================================================

// Deteccao de ambiente: web (mock local) ou FiveM (server real)
const isFiveM = typeof window !== "undefined" &&
  window.location.href.includes("cfx-nui-");

// Comunicacao com server FiveM via NUI
async function fetchNui(endpoint: string, data?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const resourceName = "bc_casino";
  const resp = await fetch(`https://${resourceName}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || {}),
  });
  return resp.json();
}

export type CrashPhase = "WAITING" | "BETTING" | "RISING" | "CRASHED";

interface SeedRecord {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  revealedAt: string;
}

export interface CrashBet {
  id: string;
  playerName: string;
  amount: number;
  autoCashout: number | null;
  cashedOut: boolean;
  cashoutMultiplier: number | null;
}

interface CrashRound {
  id: string;
  crashPoint: number;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

// Paths dos assets
const ASSETS = {
  frameCanvas: "/assets/games/crash/frame-canvas.png",
  starsBg: "/assets/games/crash/stars-bg.png",
  bgCasino: "/assets/shared/ui/bg-casino.png",
  iconGcoin: "/assets/shared/icons/icon-gcoin.png",
  iconHistory: "/assets/shared/icons/icon-history.png",
  iconProvablyFair: "/assets/shared/icons/icon-provably-fair.png",
  iconSoundOn: "/assets/shared/icons/icon-sound-on.png",
  iconSoundOff: "/assets/shared/icons/icon-sound-off.png",
  logoCrash: "/assets/logos-br-para-cards/1.LOGO-BR-CRASH.png",
};

// Configuracoes do jogo
const CONFIG = {
  BETTING_DURATION: 5000, // 5 segundos para apostar
  MIN_BET: 1,
  MAX_BET: 10000,
  HOUSE_EDGE: 0.01, // 1% house edge (RTP 99%)
};

// Gerar crash point — modelo Stake/Bustabit (Pesquisa X0 P3)
// Distribuicao: ~52% abaixo 1.5x, ~25% entre 1.5x-5x, ~23% acima 5x
// House edge 1%: ~1% dos rounds crasham instantaneamente em 1.00x
function generateCrashPoint(): number {
  const raw = Math.random();
  // 1% house edge — crash instantaneo
  if (raw < CONFIG.HOUSE_EDGE) return 1.00;
  // Formula: crashPoint = floor((1 / (1 - raw)) * 100) / 100
  const crashPoint = Math.floor((1 / (1 - raw)) * 100) / 100;
  return Math.min(crashPoint, 1000);
}

// Gerar seed aleatorio
function generateSeed(): string {
  return Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

export default function CrashGame({ onBack }: { onBack: () => void }) {
  const { saldo, setSaldo, lang } = useCasino();
  const sound = useCrashSound();
  const { config: cc } = useCurrencyConfig();
  
  // Estado do jogo
  const [phase, setPhase] = useState<CrashPhase>("WAITING");
  const [countdown, setCountdown] = useState(5);
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState(0);
  const [curvePoints, setCurvePoints] = useState<{ x: number; y: number }[]>([]);
  
  // Estado da aposta do jogador
  const [betAmount, setBetAmount] = useState(10);
  const [autoCashout, setAutoCashout] = useState<number | null>(null);
  const [hasPlacedBet, setHasPlacedBet] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [cashoutMultiplier, setCashoutMultiplier] = useState<number | null>(null);
  
  // Feed de apostas (outros jogadores simulados)
  const [bets, setBets] = useState<CrashBet[]>([]);
  
  // Historico de rounds
  const [history, setHistory] = useState<CrashRound[]>([]);
  
  // Som
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Modo de aposta: manual ou auto
  const [betMode, setBetMode] = useState<"manual" | "auto">("manual");
  const [autoBetRunning, setAutoBetRunning] = useState(false);
  const [autoBetConfig, setAutoBetConfig] = useState<AutoBetConfig | null>(null);
  const [autoBetRound, setAutoBetRound] = useState(0);
  const [autoBetProfit, setAutoBetProfit] = useState(0);
  const autoBetRef = useRef({ running: false, config: null as AutoBetConfig | null, round: 0, profit: 0, baseBet: 0 });
  
  // Milestone badges (2x, 5x, 10x, 25x, 50x, 100x)
  const [currentMilestone, setCurrentMilestone] = useState<number | null>(null);
  const prevMultiplierRef = useRef(1);
  
  // Modais
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showProvablyFair, setShowProvablyFair] = useState(false);
  const [selectedRound, setSelectedRound] = useState<CrashRound | null>(null);
  
  // Provably Fair — estados dedicados (padrao Slots)
  const [pfServerSeed, setPfServerSeed] = useState("");
  const [pfServerSeedHash, setPfServerSeedHash] = useState("");
  const [pfClientSeed, setPfClientSeed] = useState("");
  const [pfNonce, setPfNonce] = useState(0);
  const [pfRevealedSeed, setPfRevealedSeed] = useState("");
  const [pfIsValid, setPfIsValid] = useState<boolean | null>(null);
  const [pfVerifying, setPfVerifying] = useState(false);
  const [pfVerifyDetails, setPfVerifyDetails] = useState<{ committedHash: string; recalculatedHash: string; match: boolean } | null>(null);
  const [seedHistory, setSeedHistory] = useState<SeedRecord[]>([]);
  const [clientSeedChanged, setClientSeedChanged] = useState(false);
  const currentRoundIdRef = useRef<string>("");
  
  // ESC hierarquico (fecha modal mais recente, ou volta ao lobby)
  const { push: escPush, pop: escPop } = useEscStack(onBack);
  
  useEffect(() => {
    if (showHistoryPanel) escPush("history", () => setShowHistoryPanel(false));
    else escPop("history");
  }, [showHistoryPanel]);
  
  useEffect(() => {
    if (showProvablyFair) escPush("pf", () => setShowProvablyFair(false));
    else escPop("pf");
  }, [showProvablyFair]);

  // Buscar historico do server no FiveM ao abrir modal
  useEffect(() => {
    if (!showHistoryPanel || !isFiveM) return;
    (async () => {
      try {
        const resp = await fetchNui("casino:crash:getHistory", { limit: 50 });
        if (resp.rounds && Array.isArray(resp.rounds)) {
          const serverRounds = (resp.rounds as Array<Record<string, unknown>>).map((r) => ({
            id: (r.id as string) || "",
            crashPoint: (r.crashPoint as number) || 1,
            serverSeed: (r.serverSeed as string) || "",
            clientSeed: (r.clientSeed as string) || "",
            nonce: (r.nonce as number) || 0,
          }));
          setHistory(serverRounds);
        }
      } catch { /* fallback: manter historico local */ }
    })();
  }, [showHistoryPanel]);
  
  // Resultados do jogador por round
  const playerResultsRef = useRef<Map<string, { status: "won" | "lost" | "none"; amount: number; cashoutMultiplier?: number }>>(new Map());
  
  // Refs para animacao
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const phaseRef = useRef<CrashPhase>("WAITING");
  const betRef = useRef({ placed: false, cashedOut: false, autoCashout: null as number | null, amount: 0 });
  const startNewRoundRef = useRef<() => void>(() => {});
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bettingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const crashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Sincronizar refs com estado (evita closure stale no rAF)
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => {
    betRef.current.placed = hasPlacedBet;
    betRef.current.cashedOut = hasCashedOut;
    betRef.current.autoCashout = autoCashout;
    betRef.current.amount = betAmount;
  }, [hasPlacedBet, hasCashedOut, autoCashout, betAmount]);

  // ==========================================================================
  // GAME LOOP
  // ==========================================================================
  
  const startNewRound = useCallback(async () => {
    // Limpar timers anteriores (previne memory leak)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (bettingTimeoutRef.current) clearTimeout(bettingTimeoutRef.current);
    if (crashTimeoutRef.current) clearTimeout(crashTimeoutRef.current);

    // Reset estado
    setMultiplier(1.00);
    setCurvePoints([]);
    setHasPlacedBet(false);
    setHasCashedOut(false);
    setCashoutMultiplier(null);
    setBets([]);
    
    // Gerar crash point — FiveM busca do server, web calcula local
    let newCrashPoint: number;
    if (isFiveM) {
      try {
        const resp = await fetchNui("casino:crash:newRound", {});
        newCrashPoint = (resp.crashPoint as number) || 2.0;
        currentRoundIdRef.current = (resp.roundId as string) || Date.now().toString();
        if (resp.serverSeedHash) setPfServerSeedHash(resp.serverSeedHash as string);
      } catch {
        newCrashPoint = 2.0; // fallback seguro
      }
    } else {
      newCrashPoint = generateCrashPoint();
      currentRoundIdRef.current = Date.now().toString();
    }
    setCrashPoint(newCrashPoint);
    
    // Iniciar fase WAITING com countdown
    setPhase("WAITING");
    setCountdown(5);
    
    if (soundEnabled) sound.playCountdown();
    
    // Countdown de 5 segundos (tick sonoro cada segundo)
    let count = 5;
    countdownIntervalRef.current = setInterval(() => {
      count--;
      setCountdown(count);
      if (soundEnabled && count > 0) sound.playCountdown();
      
      if (count <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setPhase("BETTING");
        
        // Fase BETTING por 5 segundos
        bettingTimeoutRef.current = setTimeout(() => {
          if (phaseRef.current === "BETTING") {
            startRising(newCrashPoint);
          }
        }, CONFIG.BETTING_DURATION);
      }
    }, 1000);
  }, [soundEnabled, sound]);

  // Manter ref atualizada (evita circular dependency com triggerCrash)
  useEffect(() => { startNewRoundRef.current = startNewRound; }, [startNewRound]);

  const startRising = useCallback((targetCrashPoint: number) => {
    setPhase("RISING");
    startTimeRef.current = performance.now();
    
    if (soundEnabled) sound.startRisingTone();
    
    // Simular outras apostas
    const fakeBets: CrashBet[] = Array.from({ length: Math.floor(Math.random() * 8) + 3 }, (_, i) => ({
      id: `bot-${i}`,
      playerName: `Player${Math.floor(Math.random() * 999)}`,
      amount: Math.floor(Math.random() * 500) + 10,
      autoCashout: Math.random() > 0.5 ? Math.floor(Math.random() * 300 + 120) / 100 : null,
      cashedOut: false,
      cashoutMultiplier: null,
    }));
    setBets(prev => [...prev, ...fakeBets]);
    
    // Loop de animacao
    const animate = () => {
      if (phaseRef.current !== "RISING") return;
      
      const elapsed = performance.now() - startTimeRef.current;
      // Formula exponencial: mult = e^(t * k) onde k controla velocidade
      // Ajustado para dar ~10s ate 10x
      const k = 0.00023;
      const newMultiplier = Math.exp(elapsed * k);
      
      setMultiplier(newMultiplier);
      
      // Atualizar pontos da curva
      setCurvePoints(prev => {
        const newPoint = {
          x: elapsed / 50, // Normalizado para largura do canvas
          y: Math.log(newMultiplier) * 50, // Escala logaritmica
        };
        return [...prev.slice(-200), newPoint]; // Manter ultimos 200 pontos
      });
      
      // Atualizar tom ascendente
      if (soundEnabled) {
        sound.updateRisingTone(newMultiplier);
      }
      
      // Detectar milestone (2x, 5x, 10x, 25x, 50x, 100x)
      const milestones = [2, 5, 10, 25, 50, 100];
      const prev = prevMultiplierRef.current;
      for (const m of milestones) {
        if (newMultiplier >= m && prev < m) {
          setCurrentMilestone(m);
          if (soundEnabled) sound.playMilestone(m);
          break;
        }
      }
      prevMultiplierRef.current = newMultiplier;
      
      // Auto-cashout do jogador (usa ref para valor atualizado)
      const bet = betRef.current;
      if (bet.placed && !bet.cashedOut && bet.autoCashout && newMultiplier >= bet.autoCashout) {
        handleCashout(newMultiplier);
      }
      
      // Auto-cashout dos bots
      setBets(prev => prev.map(b => {
        if (!b.cashedOut && b.autoCashout && newMultiplier >= b.autoCashout) {
          return { ...b, cashedOut: true, cashoutMultiplier: b.autoCashout };
        }
        return b;
      }));
      
      // Verificar crash
      if (newMultiplier >= targetCrashPoint) {
        triggerCrash(targetCrashPoint);
        return;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [soundEnabled, sound]);

  const triggerCrash = useCallback((finalMultiplier: number) => {
    cancelAnimationFrame(animationRef.current);
    setPhase("CRASHED");
    setMultiplier(finalMultiplier);
    
    if (soundEnabled) {
      sound.stopRisingTone();
      sound.playCrash();
    }
    
    // Adicionar ao historico
    const roundId = currentRoundIdRef.current || Date.now().toString();
    const newRound: CrashRound = {
      id: roundId,
      crashPoint: finalMultiplier,
      serverSeed: generateSeed(),
      clientSeed: generateSeed(),
      nonce: pfNonce,
    };
    setHistory(prev => [newRound, ...prev.slice(0, 49)]);
    
    // Marcar bots que nao sacaram como perdedores
    setBets(prev => prev.map(bet => {
      if (!bet.cashedOut) {
        return { ...bet, cashedOut: false, cashoutMultiplier: 0 };
      }
      return bet;
    }));
    
    // Registrar resultado do jogador no historico
    const bet = betRef.current;
    if (bet.placed) {
      if (bet.cashedOut) {
        const realMult = cashoutMultiplier || bet.autoCashout || 1;
        const winAmount = Math.floor(bet.amount * realMult * 100) / 100;
        playerResultsRef.current.set(roundId, {
          status: "won",
          amount: winAmount,
          cashoutMultiplier: realMult,
        });
        // Som de big win se sacou em >= 5x
        if (realMult >= 5 && soundEnabled) sound.playBigWin();
      } else {
        playerResultsRef.current.set(roundId, {
          status: "lost",
          amount: -bet.amount,
        });
        if (soundEnabled) sound.playLose();
      }
    } else {
      playerResultsRef.current.set(roundId, { status: "none", amount: 0 });
    }
    
    // Proximo round em 3 segundos
    crashTimeoutRef.current = setTimeout(() => {
      startNewRoundRef.current();
    }, 3000);
  }, [soundEnabled, sound]);

  // ==========================================================================
  // ACOES DO JOGADOR
  // ==========================================================================
  
  const handlePlaceBet = useCallback(async () => {
    const currentPhase = phaseRef.current;
    if (currentPhase !== "BETTING" || betRef.current.placed) return;
    if (betAmount > saldo || betAmount < CONFIG.MIN_BET) return;
    
    if (isFiveM) {
      // FiveM: server debita saldo e registra aposta
      const resp = await fetchNui("casino:crash:bet", {
        amount: betAmount,
        autoCashout: autoCashout,
        roundId: currentRoundIdRef.current,
        clientSeed: pfClientSeed,
      });
      if ((resp as { error?: boolean }).error) {
        if (soundEnabled) sound.playBetReject();
        return;
      }
      setSaldo(resp.balance as number);
    } else {
      // Web: debitar localmente
      setSaldo(prev => prev - betAmount);
    }

    setHasPlacedBet(true);
    setPfNonce(prev => prev + 1);
    
    if (soundEnabled) sound.playBet();
    
    const playerBet: CrashBet = {
      id: "player",
      playerName: lang === "br" ? "VOCÊ" : "YOU",
      amount: betAmount,
      autoCashout,
      cashedOut: false,
      cashoutMultiplier: null,
    };
    setBets(prev => [playerBet, ...prev]);
  }, [betAmount, saldo, autoCashout, soundEnabled, sound, lang, setSaldo, pfClientSeed]);

  const handleCashout = useCallback(async (currentMultiplier?: number) => {
    if (phaseRef.current !== "RISING") return;
    const bet = betRef.current;
    if (!bet.placed || bet.cashedOut) return;
    
    const mult = currentMultiplier || multiplier;

    if (isFiveM) {
      // FiveM: server credita saldo e valida cashout
      const resp = await fetchNui("casino:crash:cashout", {
        roundId: currentRoundIdRef.current,
        clientMultiplier: mult,
      });
      if ((resp as { error?: boolean }).error) return;
      setSaldo(resp.balance as number);
      setCashoutMultiplier(resp.multiplier as number || mult);
    } else {
      // Web: creditar localmente
      const winnings = Math.floor(bet.amount * mult * 100) / 100;
      setSaldo(prev => prev + winnings);
      setCashoutMultiplier(mult);
    }

    setHasCashedOut(true);
    
    if (soundEnabled) sound.playCashout();
    
    setBets(prev => prev.map(b => {
      if (b.id === "player") {
        return { ...b, cashedOut: true, cashoutMultiplier: mult };
      }
      return b;
    }));
  }, [multiplier, soundEnabled, sound, setSaldo]);

  // ==========================================================================
  // AUTO BET HANDLERS
  // ==========================================================================

  const handleAutoBetStart = useCallback((config: AutoBetConfig) => {
    setAutoBetConfig(config);
    setAutoBetRunning(true);
    setAutoBetRound(0);
    setAutoBetProfit(0);
    autoBetRef.current = { running: true, config, round: 0, profit: 0, baseBet: config.betAmount };
    // A aposta automatica sera colocada no proximo BETTING phase
  }, []);

  const handleAutoBetStop = useCallback(() => {
    setAutoBetRunning(false);
    setAutoBetConfig(null);
    autoBetRef.current.running = false;
  }, []);

  // Auto-aposta: quando entra em BETTING e auto bet esta ativo
  useEffect(() => {
    if (phase !== "BETTING" || !autoBetRef.current.running || !autoBetRef.current.config) return;
    const ab = autoBetRef.current;
    if (ab.round >= ab.config.rounds) {
      handleAutoBetStop();
      return;
    }
    // Stop conditions
    if (ab.config.stopProfit && ab.profit >= ab.config.stopProfit) { handleAutoBetStop(); return; }
    if (ab.config.stopLoss && ab.profit <= -(ab.config.stopLoss)) { handleAutoBetStop(); return; }

    // Colocar aposta automaticamente
    const currentBet = Math.min(ab.config.betAmount, saldo);
    if (currentBet < CONFIG.MIN_BET || currentBet > saldo) { handleAutoBetStop(); return; }

    setBetAmount(currentBet);
    setAutoCashout(ab.config.autoCashout);
    // Atraso de 500ms para dar feedback visual antes de apostar
    const timer = setTimeout(() => {
      if (phaseRef.current === "BETTING" && autoBetRef.current.running) {
        handlePlaceBet();
        ab.round++;
        setAutoBetRound(ab.round);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [phase, saldo, handlePlaceBet, handleAutoBetStop]);

  // Atualizar profit do auto bet apos cada round
  useEffect(() => {
    if (phase !== "CRASHED" || !autoBetRef.current.running) return;
    const ab = autoBetRef.current;
    if (!betRef.current.placed) return;

    if (betRef.current.cashedOut && cashoutMultiplier) {
      const winnings = betRef.current.amount * cashoutMultiplier - betRef.current.amount;
      ab.profit += winnings;
      // Ajustar bet apos vitoria
      if (ab.config?.onWin === "increase25") ab.config.betAmount = Math.floor(ab.baseBet * 1.25);
      else if (ab.config?.onWin === "increase50") ab.config.betAmount = Math.floor(ab.baseBet * 1.5);
      else if (ab.config?.onWin === "double") ab.config.betAmount = ab.baseBet * 2;
      else if (ab.config) ab.config.betAmount = ab.baseBet;
    } else {
      ab.profit -= betRef.current.amount;
      // Ajustar bet apos derrota
      if (ab.config?.onLoss === "increase25") ab.config.betAmount = Math.floor(ab.baseBet * 1.25);
      else if (ab.config?.onLoss === "increase50") ab.config.betAmount = Math.floor(ab.baseBet * 1.5);
      else if (ab.config?.onLoss === "double") ab.config.betAmount = ab.baseBet * 2;
      else if (ab.config) ab.config.betAmount = ab.baseBet;
    }
    setAutoBetProfit(ab.profit);
  }, [phase, cashoutMultiplier]);

  // ==========================================================================
  // PROVABLY FAIR HANDLERS (padrao Slots)
  // ==========================================================================

  const pfData: PFData = {
    serverSeedHash: pfServerSeedHash,
    clientSeed: pfClientSeed,
    nonce: pfNonce,
    serverSeed: pfRevealedSeed,
    isValid: pfIsValid,
  };

  const handleClientSeedChange = useCallback((newSeed: string) => {
    const trimmed = newSeed.replace(/\s/g, "");
    if (trimmed.length > 64) return;
    setPfClientSeed(trimmed);
    if (trimmed.length >= 4 && trimmed !== pfClientSeed) {
      setPfNonce(0);
      setPfIsValid(null);
      setPfVerifyDetails(null);
      setClientSeedChanged(true);
      setTimeout(() => setClientSeedChanged(false), 1200);
    }
  }, [pfClientSeed]);

  const handlePfVerify = useCallback(async () => {
    if (pfVerifying) return;
    setPfIsValid(null);
    setPfVerifying(true);
    try {
      if (isFiveM) {
        const resp = await fetchNui("casino:crash:verify", { roundId: currentRoundIdRef.current });
        if ((resp as { error?: boolean }).error) { setPfIsValid(false); setPfVerifying(false); return; }
        const revealedSeed = resp.serverSeed as string;
        const committedHash = resp.serverSeedHash as string;
        setPfRevealedSeed(revealedSeed);
        const recalculatedHash = await sha256(revealedSeed);
        const hashMatch = recalculatedHash === committedHash;
        setPfIsValid(hashMatch);
        setPfVerifyDetails({ committedHash, recalculatedHash, match: hashMatch });
        setSeedHistory(prev => [{
          serverSeed: revealedSeed, serverSeedHash: committedHash,
          clientSeed: pfClientSeed, nonce: resp.nonce as number,
          revealedAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        }, ...prev].slice(0, 5));
      } else {
        // Web mock: verificar seed local
        if (!pfServerSeed) { setPfIsValid(false); setPfVerifying(false); return; }
        const recalculatedHash = await sha256(pfServerSeed);
        const hashMatch = recalculatedHash === pfServerSeedHash;
        setPfIsValid(hashMatch);
        setPfRevealedSeed(pfServerSeed);
        setPfVerifyDetails({ committedHash: pfServerSeedHash, recalculatedHash, match: hashMatch });
        setSeedHistory(prev => [{
          serverSeed: pfServerSeed, serverSeedHash: pfServerSeedHash,
          clientSeed: pfClientSeed, nonce: pfNonce,
          revealedAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        }, ...prev].slice(0, 5));
      }
    } catch { setPfIsValid(false); }
    setPfVerifying(false);
  }, [pfVerifying, pfServerSeed, pfServerSeedHash, pfClientSeed, pfNonce]);

  const handlePfRotate = useCallback(async () => {
    if (isFiveM) {
      const resp = await fetchNui("casino:crash:rotateSeed", { clientSeed: pfClientSeed });
      if ((resp as { error?: boolean }).error) return;
      setSeedHistory(prev => [{
        serverSeed: resp.serverSeed as string, serverSeedHash: resp.serverSeedHash as string,
        clientSeed: pfClientSeed, nonce: resp.nonce as number,
        revealedAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      }, ...prev].slice(0, 5));
      setPfRevealedSeed(resp.serverSeed as string);
      setPfServerSeedHash("nova sessao — aguardando round...");
      setPfNonce(0);
      setPfIsValid(null);
      setPfVerifyDetails(null);
    } else {
      // Web mock: revelar atual + criar nova sessao
      if (pfServerSeed) {
        setSeedHistory(prev => [{
          serverSeed: pfServerSeed, serverSeedHash: pfServerSeedHash,
          clientSeed: pfClientSeed, nonce: pfNonce,
          revealedAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        }, ...prev].slice(0, 5));
      }
      const pair = await createSeedPair();
      setPfServerSeed(pair.serverSeed);
      setPfServerSeedHash(pair.serverSeedHash);
      setPfClientSeed(generateSecureSeed().slice(0, 16));
      setPfNonce(0);
      setPfRevealedSeed("");
      setPfIsValid(null);
      setPfVerifyDetails(null);
    }
  }, [pfServerSeed, pfServerSeedHash, pfClientSeed, pfNonce]);

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================
  
  useEffect(() => {
    // Sessao PF inicial
    (async () => {
      if (isFiveM) {
        // FiveM: buscar sessao do server
        try {
          const resp = await fetchNui("casino:crash:config", {});
          if (resp.serverSeedHash) setPfServerSeedHash(resp.serverSeedHash as string);
          if (resp.clientSeed) setPfClientSeed(resp.clientSeed as string);
        } catch { /* fallback: session vazia */ }
      } else {
        // Web: criar sessao local
        const pair = await createSeedPair();
        setPfServerSeed(pair.serverSeed);
        setPfServerSeedHash(pair.serverSeedHash);
        setPfClientSeed(generateSecureSeed().slice(0, 16));
      }
    })();

    // Gerar historico inicial
    const initialHistory: CrashRound[] = Array.from({ length: 20 }, (_, i) => ({
      id: `init-${i}`,
      crashPoint: generateCrashPoint(),
      serverSeed: generateSeed(),
      clientSeed: generateSeed(),
      nonce: 20 - i,
    }));
    setHistory(initialHistory);
    
    // Iniciar primeiro round
    startNewRound();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (bettingTimeoutRef.current) clearTimeout(bettingTimeoutRef.current);
      if (crashTimeoutRef.current) clearTimeout(crashTimeoutRef.current);
      sound.cleanup();
    };
  }, []);

  // ==========================================================================
  // RENDER
  // ==========================================================================
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "absolute",
        inset: "6px",
        zIndex: 60,
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#080604",
        backgroundImage: `url('${ASSETS.bgCasino}'), radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,168,67,0.03) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(0,0,0,0.5) 0%, transparent 70%)`,
        backgroundSize: "cover, 100% 100%, 100% 100%",
        border: "1.5px solid rgba(212,168,67,0.35)",
        boxShadow: "inset 0 0 80px rgba(0,0,0,0.9), inset 0 0 2px rgba(212,168,67,0.15), 0 0 0 3px rgba(6,5,3,0.95), 0 0 0 4.5px rgba(212,168,67,0.2), 0 0 0 8px rgba(6,5,3,0.9), 0 0 30px rgba(212,168,67,0.06)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      
      {/* ===================================================================
          HEADER — Logo, Saldo, Controles
          =================================================================== */}
      <GameHeader
        onBack={onBack}
        title={lang === "br" ? "CRASH" : "CRASH"}
        balance={saldo}
        lang={lang === "en" ? "in" : lang as "br"}
        actions={[
          { id: "history", icon: ASSETS.iconHistory, tooltip: lang === "br" ? "Histórico" : "History", onClick: () => setShowHistoryPanel(true) },
          { id: "pf", icon: ASSETS.iconProvablyFair, tooltip: "Provably Fair", onClick: () => setShowProvablyFair(true) },
          { id: "sound", icon: soundEnabled ? ASSETS.iconSoundOn : ASSETS.iconSoundOff, tooltip: soundEnabled ? (lang === "br" ? "Desativar som" : "Mute") : (lang === "br" ? "Ativar som" : "Unmute"), onClick: () => setSoundEnabled(s => !s) },
        ]}
      />

      {/* ===================================================================
          MAIN — Canvas + Controles
          =================================================================== */}
      <main
        style={{
          position: "relative",
          zIndex: 5,
          flex: 1,
          display: "flex",
          gap: "clamp(8px, 1vw, 12px)",
          padding: "clamp(8px, 1.5vw, 16px)",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* ===============================================================
            AREA DO CANVAS — Curva + Multiplicador
            =============================================================== */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "clamp(6px, 0.8vw, 12px)",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {/* Historico de rounds (badges) */}
          <CrashHistory history={history} />

          {/* Canvas Container com Frame */}
          <div
            style={{
              position: "relative",
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {/* Frame dourado art-deco */}
            <img
              src={ASSETS.frameCanvas}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "fill",
                pointerEvents: "none",
                zIndex: 10,
                filter: "drop-shadow(0 0 20px rgba(212,168,67,0.3))",
              }}
            />

            {/* Canvas da curva */}
            <CrashCanvas
              phase={phase}
              multiplier={multiplier}
              curvePoints={curvePoints}
              countdown={countdown}
              crashPoint={phase === "CRASHED" ? crashPoint : undefined}
              lang={lang === "en" ? "en" : "br"}
            />

            {/* Milestone badge (2x, 5x, 10x...) */}
            <CrashMilestone milestone={currentMilestone} />

            {/* Overlay de resultado (vitoria/derrota) */}
            <AnimatePresence>
              {phase === "CRASHED" && hasPlacedBet && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: hasCashedOut 
                      ? "radial-gradient(ellipse at center, rgba(0,230,118,0.15) 0%, transparent 70%)"
                      : "radial-gradient(ellipse at center, rgba(255,68,68,0.15) 0%, transparent 70%)",
                    zIndex: 15,
                  }}
                >
                  <motion.div
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    style={{
                      textAlign: "center",
                      padding: "clamp(16px, 2vw, 32px)",
                      background: "rgba(5,5,5,0.9)",
                      border: `2px solid ${hasCashedOut ? "rgba(0,230,118,0.6)" : "rgba(255,68,68,0.6)"}`,
                      borderRadius: "16px",
                      boxShadow: hasCashedOut
                        ? "0 0 40px rgba(0,230,118,0.3)"
                        : "0 0 40px rgba(255,68,68,0.3)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-cinzel)",
                        fontSize: "clamp(14px, 1.8vw, 24px)",
                        fontWeight: 700,
                        color: hasCashedOut ? "#00E676" : "#FF4444",
                        textTransform: "uppercase",
                        letterSpacing: "3px",
                        marginBottom: "clamp(8px, 1vw, 16px)",
                        textShadow: hasCashedOut
                          ? "0 0 20px rgba(0,230,118,0.8)"
                          : "0 0 20px rgba(255,68,68,0.8)",
                      }}
                    >
                      {hasCashedOut 
                        ? (lang === "br" ? "VOCÊ SACOU!" : "YOU CASHED OUT!")
                        : (lang === "br" ? "VOCÊ PERDEU!" : "YOU LOST!")
                      }
                    </div>
                    {hasCashedOut && cashoutMultiplier && (
                      <>
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "clamp(24px, 4vw, 48px)",
                            fontWeight: 800,
                            color: "#00E676",
                            textShadow: "0 0 30px rgba(0,230,118,0.8), 0 0 60px rgba(0,230,118,0.4)",
                          }}
                        >
                          {cashoutMultiplier.toFixed(2)}x
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "clamp(14px, 1.6vw, 22px)",
                            fontWeight: 600,
                            color: "#FFD700",
                            marginTop: "clamp(8px, 1vw, 12px)",
                          }}
                        >
                          +{(betAmount * cashoutMultiplier).toFixed(2)} {cc.symbol}
                        </div>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Big Win overlay (>=5x) com countup animado */}
            <CrashBigWin
              show={phase === "CRASHED" && hasCashedOut && (cashoutMultiplier || 0) >= 5}
              multiplier={cashoutMultiplier || 0}
              betAmount={betAmount}
              winAmount={betAmount * (cashoutMultiplier || 0)}
              onPlayAgain={() => {}}
              lang={lang === "en" ? "en" : "br"}
            />
          </div>
        </div>

        {/* ===============================================================
            SIDEBAR — Controles + Feed de Apostas
            =============================================================== */}
        <div
          style={{
            width: "clamp(220px, 26vw, 320px)",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "clamp(8px, 1vw, 12px)",
            overflowY: "auto",
            overflowX: "hidden",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(212,168,67,0.3) transparent",
          }}
        >
          {/* Toggle MANUAL / AUTO */}
          <div style={{
            display: "flex",
            background: "rgba(5,5,5,0.95)",
            border: "1px solid rgba(212,168,67,0.3)",
            borderRadius: "10px",
            overflow: "hidden",
          }}>
            {(["manual", "auto"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => { setBetMode(mode); if (mode === "manual" && autoBetRunning) handleAutoBetStop(); }}
                style={{
                  flex: 1,
                  padding: "clamp(8px, 1vw, 12px)",
                  background: betMode === mode ? "rgba(212,168,67,0.15)" : "transparent",
                  borderBottom: betMode === mode ? "2px solid #D4A843" : "2px solid transparent",
                  border: "none",
                  borderBottomStyle: "solid",
                  borderBottomWidth: "2px",
                  borderBottomColor: betMode === mode ? "#D4A843" : "transparent",
                  color: betMode === mode ? "#D4A843" : "rgba(212,168,67,0.5)",
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "clamp(10px, 1.1vw, 13px)",
                  fontWeight: 700,
                  textTransform: "uppercase" as const,
                  letterSpacing: "1.5px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  minHeight: "44px",
                }}
              >
                {mode === "manual" ? "MANUAL" : "AUTO"}
              </button>
            ))}
          </div>

          {/* Controles de aposta (MANUAL) ou Auto Bet Config (AUTO) */}
          {betMode === "manual" ? (
            <CrashControls
              phase={phase}
              betAmount={betAmount}
              setBetAmount={setBetAmount}
              autoCashout={autoCashout}
              setAutoCashout={setAutoCashout}
              hasPlacedBet={hasPlacedBet}
              hasCashedOut={hasCashedOut}
              multiplier={multiplier}
              saldo={saldo}
              onPlaceBet={handlePlaceBet}
              onCashout={handleCashout}
              lang={lang}
            />
          ) : (
            <div style={{
              background: "rgba(5,5,5,0.95)",
              border: "1px solid rgba(212,168,67,0.3)",
              borderRadius: "12px",
              overflow: "hidden",
            }}>
              <CrashAutoBet
                onStart={handleAutoBetStart}
                onStop={handleAutoBetStop}
                isRunning={autoBetRunning}
                currentRound={autoBetRound}
                totalRounds={autoBetConfig?.rounds || 0}
                currentProfit={autoBetProfit}
                balance={saldo}
                minBet={CONFIG.MIN_BET}
                maxBet={CONFIG.MAX_BET}
                lang={lang === "en" ? "en" : "br"}
              />
              {/* Botao CASHOUT durante RISING mesmo no modo auto */}
              {phase === "RISING" && hasPlacedBet && !hasCashedOut && (
                <div style={{ padding: "0 clamp(10px, 1.5vw, 16px) clamp(10px, 1.5vw, 16px)" }}>
                  <motion.button
                    onClick={() => handleCashout()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    animate={{
                      boxShadow: [
                        "0 0 20px rgba(255,68,68,0.4)",
                        "0 0 40px rgba(255,68,68,0.6)",
                        "0 0 20px rgba(255,68,68,0.4)",
                      ],
                    }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    style={{
                      width: "100%",
                      padding: "clamp(12px, 1.5vw, 18px)",
                      background: "linear-gradient(180deg, #FF5555 0%, #CC3333 100%)",
                      border: "2px solid rgba(255,100,100,0.6)",
                      borderRadius: "10px",
                      cursor: "pointer",
                      textAlign: "center" as const,
                    }}
                  >
                    <span style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "clamp(12px, 1.4vw, 18px)",
                      fontWeight: 800,
                      color: "#fff",
                      textTransform: "uppercase" as const,
                      letterSpacing: "2px",
                    }}>
                      {lang === "br" ? "SACAR" : "CASHOUT"} {(betAmount * multiplier).toFixed(2)} {cc.symbol}
                    </span>
                  </motion.button>
                </div>
              )}
            </div>
          )}

          {/* Feed de apostas */}
          <CrashBetFeed bets={bets} lang={lang} />
        </div>
      </main>

      {/* ===================================================================
          MODAIS (shared components)
          =================================================================== */}
      
      <HistoryModal
        open={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
        title={lang === "br" ? "HISTÓRICO" : "HISTORY"}
        lang={lang === "en" ? "in" : (lang as "br")}
        columns={[
          {
            id: "round",
            label: "#",
            width: "15%",
            render: (row: CrashRound) => (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.5)", fontSize: "clamp(10px, 1vw, 13px)" }}>
                #{row.nonce}
              </span>
            ),
          },
          {
            id: "crash",
            label: "CRASH",
            width: "25%",
            render: (row: CrashRound) => <MultiBadge multi={`${row.crashPoint.toFixed(2)}x`} />,
          },
          {
            id: "result",
            label: lang === "br" ? "RESULTADO" : "RESULT",
            width: "30%",
            render: (row: CrashRound) => {
              const pr = playerResultsRef.current.get(row.id);
              if (!pr || pr.status === "none") return <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>;
              return <WinBadge won={pr.status === "won"} lang={lang === "en" ? "in" : (lang as "br")} />;
            },
          },
          {
            id: "payout",
            label: lang === "br" ? "GANHO" : "WIN",
            width: "30%",
            align: "right" as const,
            render: (row: CrashRound) => {
              const pr = playerResultsRef.current.get(row.id);
              if (!pr || pr.status === "none") return <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>;
              return <WinAmount value={pr.amount} prefix="GC" />;
            },
          },
        ]}
        data={history}
        escPush={escPush}
        escPop={escPop}
      />

      <ProvablyFairModal
        open={showProvablyFair}
        onClose={() => setShowProvablyFair(false)}
        lang={lang === "en" ? "in" : (lang as "br")}
        pfData={pfData}
        seedHistory={seedHistory}
        onClientSeedChange={handleClientSeedChange}
        onVerify={handlePfVerify}
        onRotateSeed={handlePfRotate}
        verifying={pfVerifying}
        verifyDetails={pfVerifyDetails}
        clientSeedChanged={clientSeedChanged}
        unverifiedCount={pfNonce}
        escPush={escPush}
        escPop={escPop}
      />
    </motion.div>
  );
}
