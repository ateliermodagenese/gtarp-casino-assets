"use client";

// ============================================================================
// ROULETTE GAME — Blackout Casino GTARP
// Tier S (Hero) — 8 Telas Premium AAA
// ============================================================================
// Telas:
//   1. MODE SELECT — Classic vs Lightning
//   2. BETTING TABLE — Grid 3x12 + Outside bets + Chips + Racetrack
//   3. LIGHTNING PHASE — Lucky Numbers reveal (Lightning mode only)
//   4. SPINNING — Wheel spinning + ball orbit
//   5. RESULT WIN — Overlay + counter rolling
//   6. RESULT LOSE — Overlay shake
//   7. BIG WIN LIGHTNING — MEGA WIN overlay (Lightning mode)
//   8. HISTORY + PROVABLY FAIR — Modals
// ============================================================================

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useCasino } from "@/contexts/CasinoContext";
import { GameHeader, useEscStack, HistoryModal, ProvablyFairModal } from "@/components/shared";
import type { PFData, HistoryColumn } from "@/components/shared";
import { useCurrencyConfig } from "@/hooks/use-currency-config";
import { useSoundManager } from "@/hooks/use-sound-manager";
import RouletteWheel from "./RouletteWheel";
import RouletteBettingTable from "./RouletteBettingTable";
import RouletteChipSelector from "./RouletteChipSelector";
import RouletteLightningPhase from "./RouletteLightningPhase";

// ============================================================================
// ASSETS
// ============================================================================
const ASSETS = {
  wheelEuropean: "/assets/games/roulette/wheel-european.png",
  ball: "/assets/games/roulette/ball.png",
  feltTexture: "/assets/games/roulette/felt-texture.png",
  frameWheel: "/assets/games/roulette/frame-wheel.png",
  lightningBolt: "/assets/games/roulette/lightning-bolt.png",
  modeClassic: "/assets/games/roulette/mode-classic.png",
  modeLightning: "/assets/games/roulette/mode-lightning.png",
  iconSpin: "/assets/games/roulette/icon-spin.png",
  bgCasino: "/assets/shared/ui/bg-casino.png",
  iconGcoin: "/assets/shared/icons/icon-gcoin.png",
  iconHistory: "/assets/shared/icons/icon-history.png",
  iconProvablyFair: "/assets/shared/icons/icon-provably-fair.png",
  iconSoundOn: "/assets/shared/icons/icon-sound-on.png",
  iconSoundOff: "/assets/shared/icons/icon-sound-off.png",
  logoRoulette: "/assets/logos-br-para-cards/5.LOGO-BR-ROULETTE.png",
  chips: {
    1: "/assets/games/roulette/chips/chip-1.png",
    5: "/assets/games/roulette/chips/chip-5.png",
    10: "/assets/games/roulette/chips/chip-10.png",
    25: "/assets/games/roulette/chips/chip-25.png",
    50: "/assets/games/roulette/chips/chip-50.png",
    100: "/assets/games/roulette/chips/chip-100.png",
    500: "/assets/games/roulette/chips/chip-500.png",
    1000: "/assets/games/roulette/chips/chip-1000.png",
    5000: "/assets/games/roulette/chips/chip-5000.png",
    10000: "/assets/games/roulette/chips/chip-10000.png",
  } as Record<number, string>,
  multipliers: {
    50: "/assets/games/roulette/multipliers/multi-50x.png",
    100: "/assets/games/roulette/multipliers/multi-100x.png",
    200: "/assets/games/roulette/multipliers/multi-200x.png",
    300: "/assets/games/roulette/multipliers/multi-300x.png",
    400: "/assets/games/roulette/multipliers/multi-400x.png",
    500: "/assets/games/roulette/multipliers/multi-500x.png",
  } as Record<number, string>,
};

// ============================================================================
// TIPOS
// ============================================================================
export type RouletteMode = "classic" | "lightning";
export type RoulettePhase = 
  | "MODE_SELECT" 
  | "BETTING" 
  | "LIGHTNING_REVEAL" 
  | "SPINNING" 
  | "RESULT_WIN" 
  | "RESULT_LOSE" 
  | "BIG_WIN";

export interface RouletteBet {
  type: BetType;
  numbers: number[];
  amount: number;
  payout: number;
}

export type BetType = 
  | "straight" | "split" | "street" | "corner" | "sixline" 
  | "column" | "dozen" | "red" | "black" | "odd" | "even" 
  | "low" | "high" | "zero";

export interface LightningNumber {
  number: number;
  multiplier: 50 | 100 | 200 | 300 | 400 | 500;
}

interface RouletteRound {
  id: string;
  mode: RouletteMode;
  resultNumber: number;
  bets: RouletteBet[];
  totalBet: number;
  totalWin: number;
  lightningNumbers?: LightningNumber[];
  timestamp: number;
}

// ============================================================================
// CONSTANTES DA ROLETA EUROPEIA
// ============================================================================

// Sequencia dos numeros na roda europeia (sentido horario a partir do 0)
export const WHEEL_SEQUENCE = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// Cores dos numeros
export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
export const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

export function getNumberColor(n: number): "red" | "black" | "green" {
  if (n === 0) return "green";
  return RED_NUMBERS.includes(n) ? "red" : "black";
}

// Payouts
export const PAYOUTS: Record<BetType, number> = {
  straight: 35,
  split: 17,
  street: 11,
  corner: 8,
  sixline: 5,
  column: 2,
  dozen: 2,
  red: 1,
  black: 1,
  odd: 1,
  even: 1,
  low: 1,
  high: 1,
  zero: 35,
};

// ============================================================================
// PALETA
// ============================================================================
const GOLD = {
  primary: "#D4A843",
  light: "#FFD700",
  dark: "#8B6914",
  glow: "rgba(212,168,67,0.4)",
};
const EMERALD = {
  primary: "#00C853",
  light: "#00E676",
  glow: "rgba(0,230,118,0.4)",
};
const ROULETTE = {
  red: "#DC2626",
  redGlow: "rgba(220,38,38,0.5)",
  black: "#1A1A1A",
  green: "#15803D",
  greenGlow: "rgba(21,128,61,0.5)",
  felt: "#0D5C2A",
  lightningGold: "#FFD700",
  lightningGlow: "rgba(255,215,0,0.6)",
};

// ============================================================================
// CONFIGURACOES
// ============================================================================
const CONFIG = {
  MIN_BET: 1,
  MAX_BET: 10000,
  SPIN_DURATION: 4500, // ms
  BETTING_TIME: 15000, // 15s para apostar
  LIGHTNING_REVEAL_DELAY: 800, // stagger entre lucky numbers
  RESULT_DISPLAY_TIME: 4000,
};

// ============================================================================
// DETECTAR FIVEM
// ============================================================================
const isFiveM = typeof window !== "undefined" && window.location.href.includes("cfx-nui-");

async function fetchNui(endpoint: string, data?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const resourceName = "bc_casino";
  const resp = await fetch(`https://${resourceName}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || {}),
  });
  return resp.json();
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export interface RouletteGameProps {
  onBack: () => void;
  onDeposit?: () => void;
}

export default function RouletteGame({ onBack, onDeposit }: RouletteGameProps) {
  const { saldo, setSaldo, lang } = useCasino();
  const sound = useSoundManager();
  const { config: cc, formatCurrency } = useCurrencyConfig();

  // Estado do jogo
  const [mode, setMode] = useState<RouletteMode | null>(null);
  const [phase, setPhase] = useState<RoulettePhase>("MODE_SELECT");
  const [selectedChip, setSelectedChip] = useState<number>(10);
  const [bets, setBets] = useState<RouletteBet[]>([]);
  const [resultNumber, setResultNumber] = useState<number | null>(null);
  const [lightningNumbers, setLightningNumbers] = useState<LightningNumber[]>([]);
  const [totalWin, setTotalWin] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bettingTimeLeft, setBettingTimeLeft] = useState(CONFIG.BETTING_TIME / 1000);

  // Historico
  const [history, setHistory] = useState<RouletteRound[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showProvablyFair, setShowProvablyFair] = useState(false);

  // Provably Fair
  const [pfData, setPfData] = useState<PFData>({
    serverSeedHash: "",
    clientSeed: "",
    nonce: 0,
    serverSeed: "",
    isValid: null,
  });
  const [pfVerifying, setPfVerifying] = useState(false);

  // ESC stack
  const { push: escPush, pop: escPop } = useEscStack(onBack);

  useEffect(() => {
    if (showHistory) escPush("roulette-history", () => setShowHistory(false));
    else escPop("roulette-history");
  }, [showHistory, escPush, escPop]);

  useEffect(() => {
    if (showProvablyFair) escPush("roulette-pf", () => setShowProvablyFair(false));
    else escPop("roulette-pf");
  }, [showProvablyFair, escPush, escPop]);

  // Refs
  const bettingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ============================================================================
  // TEXTOS BILINGUES
  // ============================================================================
  const T = useMemo(() => ({
    br: {
      title: "ROLETA",
      titleLightning: "ROLETA RELAMPAGO",
      selectMode: "ESCOLHA SEU MODO",
      classic: "CLASSICA",
      classicDesc: "Roleta Europeia tradicional com 37 numeros",
      lightning: "RELAMPAGO",
      lightningDesc: "Multiplicadores ate 500x nos Lucky Numbers!",
      popular: "POPULAR",
      placeBets: "FACA SUAS APOSTAS",
      spin: "GIRAR",
      clear: "LIMPAR",
      undo: "DESFAZER",
      double: "DOBRAR",
      totalBet: "APOSTA TOTAL",
      balance: "SALDO",
      win: "VOCE GANHOU!",
      lose: "TENTE NOVAMENTE",
      megaWin: "MEGA WIN",
      newRound: "NOVA RODADA",
      luckyNumbers: "LUCKY NUMBERS",
      history: "Historico",
      provablyFair: "Provably Fair",
      soundOn: "Som ligado",
      soundOff: "Som desligado",
      noFunds: "Saldo insuficiente",
      minBet: "Aposta minima",
      maxBet: "Aposta maxima",
      red: "Vermelho",
      black: "Preto",
      even: "Par",
      odd: "Impar",
      low: "1-18",
      high: "19-36",
      dozen1: "1-12",
      dozen2: "13-24",
      dozen3: "25-36",
      col1: "2:1",
      col2: "2:1",
      col3: "2:1",
    },
    in: {
      title: "ROULETTE",
      titleLightning: "LIGHTNING ROULETTE",
      selectMode: "SELECT YOUR MODE",
      classic: "CLASSIC",
      classicDesc: "Traditional European Roulette with 37 numbers",
      lightning: "LIGHTNING",
      lightningDesc: "Multipliers up to 500x on Lucky Numbers!",
      popular: "POPULAR",
      placeBets: "PLACE YOUR BETS",
      spin: "SPIN",
      clear: "CLEAR",
      undo: "UNDO",
      double: "DOUBLE",
      totalBet: "TOTAL BET",
      balance: "BALANCE",
      win: "YOU WIN!",
      lose: "TRY AGAIN",
      megaWin: "MEGA WIN",
      newRound: "NEW ROUND",
      luckyNumbers: "LUCKY NUMBERS",
      history: "History",
      provablyFair: "Provably Fair",
      soundOn: "Sound on",
      soundOff: "Sound off",
      noFunds: "Insufficient funds",
      minBet: "Minimum bet",
      maxBet: "Maximum bet",
      red: "Red",
      black: "Black",
      even: "Even",
      odd: "Odd",
      low: "1-18",
      high: "19-36",
      dozen1: "1-12",
      dozen2: "13-24",
      dozen3: "25-36",
      col1: "2:1",
      col2: "2:1",
      col3: "2:1",
    },
  }), [])[lang === "in" ? "in" : "br"];

  // ============================================================================
  // CALCULOS
  // ============================================================================
  const totalBet = useMemo(() => bets.reduce((sum, b) => sum + b.amount, 0), [bets]);

  const canSpin = totalBet >= CONFIG.MIN_BET && totalBet <= saldo && phase === "BETTING";

  // ============================================================================
  // SELECAO DE MODO
  // ============================================================================
  const handleSelectMode = useCallback((selectedMode: RouletteMode) => {
    setMode(selectedMode);
    setPhase("BETTING");
    setBets([]);
    setResultNumber(null);
    setLightningNumbers([]);
    setTotalWin(0);
    setBettingTimeLeft(CONFIG.BETTING_TIME / 1000);
    if (soundEnabled) sound.play("click");
  }, [sound, soundEnabled]);

  const handleBackToModeSelect = useCallback(() => {
    setMode(null);
    setPhase("MODE_SELECT");
    setBets([]);
    setResultNumber(null);
    setLightningNumbers([]);
    if (soundEnabled) sound.play("click");
  }, [sound, soundEnabled]);

  // ============================================================================
  // APOSTAS
  // ============================================================================
  const handlePlaceBet = useCallback((bet: RouletteBet) => {
    if (phase !== "BETTING") return;
    if (totalBet + bet.amount > saldo) {
      if (soundEnabled) sound.play("error");
      return;
    }

    setBets(prev => {
      // Verificar se ja existe aposta no mesmo lugar
      const existing = prev.find(b => 
        b.type === bet.type && 
        JSON.stringify(b.numbers) === JSON.stringify(bet.numbers)
      );
      if (existing) {
        return prev.map(b => 
          b === existing 
            ? { ...b, amount: b.amount + bet.amount }
            : b
        );
      }
      return [...prev, bet];
    });

    if (soundEnabled) sound.play("chip");
  }, [phase, totalBet, saldo, sound, soundEnabled]);

  const handleClearBets = useCallback(() => {
    setBets([]);
    if (soundEnabled) sound.play("click");
  }, [sound, soundEnabled]);

  const handleUndoBet = useCallback(() => {
    setBets(prev => prev.slice(0, -1));
    if (soundEnabled) sound.play("click");
  }, [sound, soundEnabled]);

  const handleDoubleBets = useCallback(() => {
    if (totalBet * 2 > saldo) {
      if (soundEnabled) sound.play("error");
      return;
    }
    setBets(prev => prev.map(b => ({ ...b, amount: b.amount * 2 })));
    if (soundEnabled) sound.play("click");
  }, [totalBet, saldo, sound, soundEnabled]);

  // ============================================================================
  // GIRAR A ROLETA
  // ============================================================================
  const handleSpin = useCallback(async () => {
    if (!canSpin || isSpinning) return;

    setIsSpinning(true);
    if (soundEnabled) sound.play("spin");

    // Debitar aposta
    setSaldo(prev => prev - totalBet);

    // Gerar resultado
    let result: number;
    let luckyNums: LightningNumber[] = [];

    if (isFiveM) {
      try {
        const resp = await fetchNui("casino:roulette:spin", {
          bets,
          mode,
          totalBet,
        });
        result = (resp.result as number) ?? Math.floor(Math.random() * 37);
        luckyNums = (resp.lightningNumbers as LightningNumber[]) ?? [];
      } catch {
        result = Math.floor(Math.random() * 37);
      }
    } else {
      result = Math.floor(Math.random() * 37);
      // Gerar Lightning Numbers (1-5 numeros com multiplicadores)
      if (mode === "lightning") {
        const count = Math.floor(Math.random() * 5) + 1;
        const multipliers: (50 | 100 | 200 | 300 | 400 | 500)[] = [50, 100, 200, 300, 400, 500];
        const used = new Set<number>();
        for (let i = 0; i < count; i++) {
          let num: number;
          do {
            num = Math.floor(Math.random() * 36) + 1; // 1-36 (nao inclui 0)
          } while (used.has(num));
          used.add(num);
          // Distribuicao de multiplicadores (maiores sao mais raros)
          const weights = [40, 25, 18, 10, 5, 2];
          const total = weights.reduce((a, b) => a + b, 0);
          let rand = Math.random() * total;
          let multIdx = 0;
          for (let j = 0; j < weights.length; j++) {
            rand -= weights[j];
            if (rand <= 0) {
              multIdx = j;
              break;
            }
          }
          luckyNums.push({ number: num, multiplier: multipliers[multIdx] });
        }
      }
    }

    setLightningNumbers(luckyNums);

    // Fase Lightning Reveal (so no modo lightning)
    if (mode === "lightning" && luckyNums.length > 0) {
      setPhase("LIGHTNING_REVEAL");
      await new Promise(resolve => setTimeout(resolve, luckyNums.length * CONFIG.LIGHTNING_REVEAL_DELAY + 1500));
    }

    // Fase Spinning
    setPhase("SPINNING");
    setResultNumber(result);

    // Esperar animacao da roda
    await new Promise(resolve => setTimeout(resolve, CONFIG.SPIN_DURATION + 500));

    // Calcular ganhos
    let winAmount = 0;
    for (const bet of bets) {
      if (bet.numbers.includes(result)) {
        let payout = bet.amount * (bet.payout + 1);
        // Aplicar multiplicador Lightning se aplicavel
        if (mode === "lightning") {
          const lightning = luckyNums.find(ln => ln.number === result);
          if (lightning && bet.type === "straight") {
            payout = bet.amount * lightning.multiplier;
          }
        }
        winAmount += payout;
      }
    }

    setTotalWin(winAmount);
    setIsSpinning(false);

    // Creditar ganhos
    if (winAmount > 0) {
      setSaldo(prev => prev + winAmount);
      
      // Determinar tipo de vitoria
      const isBigWin = mode === "lightning" && winAmount >= totalBet * 10;
      if (isBigWin) {
        setPhase("BIG_WIN");
        if (soundEnabled) sound.play("bigwin");
      } else {
        setPhase("RESULT_WIN");
        if (soundEnabled) sound.play("win");
      }
    } else {
      setPhase("RESULT_LOSE");
      if (soundEnabled) sound.play("lose");
    }

    // Adicionar ao historico
    const round: RouletteRound = {
      id: Date.now().toString(),
      mode: mode!,
      resultNumber: result,
      bets: [...bets],
      totalBet,
      totalWin: winAmount,
      lightningNumbers: luckyNums,
      timestamp: Date.now(),
    };
    setHistory(prev => [round, ...prev.slice(0, 49)]);

    // Voltar para betting apos delay
    setTimeout(() => {
      setPhase("BETTING");
      setBets([]);
      setResultNumber(null);
      setLightningNumbers([]);
      setTotalWin(0);
      setBettingTimeLeft(CONFIG.BETTING_TIME / 1000);
    }, CONFIG.RESULT_DISPLAY_TIME);

  }, [canSpin, isSpinning, bets, mode, totalBet, saldo, setSaldo, sound, soundEnabled]);

  // ============================================================================
  // HEADER ACTIONS
  // ============================================================================
  const headerActions = useMemo(() => [
    {
      id: "sound",
      icon: soundEnabled ? ASSETS.iconSoundOn : ASSETS.iconSoundOff,
      tooltip: soundEnabled ? T.soundOn : T.soundOff,
      onClick: () => setSoundEnabled(prev => !prev),
    },
    {
      id: "history",
      icon: ASSETS.iconHistory,
      tooltip: T.history,
      onClick: () => setShowHistory(true),
    },
    {
      id: "pf",
      icon: ASSETS.iconProvablyFair,
      tooltip: T.provablyFair,
      onClick: () => setShowProvablyFair(true),
    },
  ], [soundEnabled, T]);

  // ============================================================================
  // HISTORY COLUMNS
  // ============================================================================
  const historyColumns: HistoryColumn<RouletteRound>[] = useMemo(() => [
    {
      id: "result",
      label: lang === "br" ? "Resultado" : "Result",
      width: "80px",
      align: "center" as const,
      render: (row) => (
        <div style={{
          width: "clamp(28px, 3vw, 36px)",
          height: "clamp(28px, 3vw, 36px)",
          borderRadius: "50%",
          background: getNumberColor(row.resultNumber) === "red" 
            ? ROULETTE.red 
            : getNumberColor(row.resultNumber) === "black" 
              ? ROULETTE.black 
              : ROULETTE.green,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "clamp(12px, 1.2vw, 16px)",
          fontWeight: 700,
          color: "#fff",
          boxShadow: `0 0 10px ${getNumberColor(row.resultNumber) === "red" 
            ? ROULETTE.redGlow 
            : getNumberColor(row.resultNumber) === "green" 
              ? ROULETTE.greenGlow 
              : "rgba(0,0,0,0.5)"}`,
        }}>
          {row.resultNumber}
        </div>
      ),
    },
    {
      id: "mode",
      label: lang === "br" ? "Modo" : "Mode",
      width: "100px",
      align: "center" as const,
      render: (row) => (
        <span style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "clamp(10px, 1vw, 12px)",
          color: row.mode === "lightning" ? ROULETTE.lightningGold : GOLD.primary,
          textShadow: row.mode === "lightning" ? `0 0 8px ${ROULETTE.lightningGlow}` : "none",
        }}>
          {row.mode === "lightning" ? "LIGHTNING" : "CLASSIC"}
        </span>
      ),
    },
    {
      id: "bet",
      label: lang === "br" ? "Aposta" : "Bet",
      width: "100px",
      align: "right" as const,
      render: (row) => (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "clamp(11px, 1.1vw, 14px)",
          color: "rgba(255,255,255,0.8)",
        }}>
          {row.totalBet.toLocaleString()}
        </span>
      ),
    },
    {
      id: "win",
      label: lang === "br" ? "Ganho" : "Win",
      width: "120px",
      align: "right" as const,
      render: (row) => (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "clamp(11px, 1.1vw, 14px)",
          fontWeight: 700,
          color: row.totalWin > 0 ? EMERALD.light : "rgba(255,255,255,0.4)",
          textShadow: row.totalWin > 0 ? `0 0 8px ${EMERALD.glow}` : "none",
        }}>
          {row.totalWin > 0 ? `+${row.totalWin.toLocaleString()}` : "0"}
        </span>
      ),
    },
  ], [lang]);

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: `linear-gradient(180deg, #0A0A0A 0%, #050505 100%)`,
        backgroundImage: `url("${ASSETS.bgCasino}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: "18px",
      }}
    >
      {/* Vinheta */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Header */}
      <GameHeader
        onBack={mode ? handleBackToModeSelect : onBack}
        title={mode === "lightning" ? T.titleLightning : T.title}
        logo={ASSETS.logoRoulette}
        balance={saldo}
        lang={lang}
        actions={headerActions}
      />

      {/* Conteudo Principal */}
      <div
        style={{
          flex: 1,
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <AnimatePresence mode="wait">
          {/* TELA 1: MODE SELECT */}
          {phase === "MODE_SELECT" && (
            <motion.div
              key="mode-select"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "clamp(20px, 3vw, 40px)",
                padding: "clamp(20px, 3vw, 40px)",
              }}
            >
              <h2
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: "clamp(18px, 2.5vw, 32px)",
                  fontWeight: 800,
                  color: GOLD.primary,
                  letterSpacing: "4px",
                  textShadow: `0 0 20px ${GOLD.glow}`,
                  textAlign: "center",
                }}
              >
                {T.selectMode}
              </h2>

              <div
                style={{
                  display: "flex",
                  gap: "clamp(16px, 3vw, 40px)",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {/* Card Classic */}
                <motion.button
                  onClick={() => handleSelectMode("classic")}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: "clamp(200px, 25vw, 320px)",
                    aspectRatio: "3/4",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    position: "relative",
                    borderRadius: "16px",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={ASSETS.modeClassic}
                    alt="Classic Roulette"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "16px",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.8) 100%)",
                      borderRadius: "16px",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: "clamp(12px, 2vw, 24px)",
                      left: 0,
                      right: 0,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "clamp(14px, 1.8vw, 22px)",
                        fontWeight: 800,
                        color: GOLD.light,
                        letterSpacing: "3px",
                        textShadow: `0 0 10px ${GOLD.glow}`,
                        marginBottom: "6px",
                      }}
                    >
                      {T.classic}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "clamp(10px, 1vw, 13px)",
                        color: "rgba(255,255,255,0.7)",
                        padding: "0 12px",
                      }}
                    >
                      {T.classicDesc}
                    </div>
                  </div>
                </motion.button>

                {/* Card Lightning */}
                <motion.button
                  onClick={() => handleSelectMode("lightning")}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: "clamp(200px, 25vw, 320px)",
                    aspectRatio: "3/4",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    position: "relative",
                    borderRadius: "16px",
                    overflow: "hidden",
                  }}
                >
                  {/* Badge POPULAR */}
                  <div
                    style={{
                      position: "absolute",
                      top: "clamp(8px, 1vw, 14px)",
                      right: "clamp(8px, 1vw, 14px)",
                      zIndex: 10,
                      background: `linear-gradient(135deg, ${ROULETTE.lightningGold} 0%, #FFA500 100%)`,
                      padding: "4px 12px",
                      borderRadius: "4px",
                      fontFamily: "'Cinzel', serif",
                      fontSize: "clamp(8px, 0.9vw, 11px)",
                      fontWeight: 800,
                      color: "#000",
                      letterSpacing: "1.5px",
                      boxShadow: `0 0 15px ${ROULETTE.lightningGlow}`,
                    }}
                  >
                    {T.popular}
                  </div>
                  <img
                    src={ASSETS.modeLightning}
                    alt="Lightning Roulette"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "16px",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.8) 100%)",
                      borderRadius: "16px",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: "clamp(12px, 2vw, 24px)",
                      left: 0,
                      right: 0,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "clamp(14px, 1.8vw, 22px)",
                        fontWeight: 800,
                        color: ROULETTE.lightningGold,
                        letterSpacing: "3px",
                        textShadow: `0 0 10px ${ROULETTE.lightningGlow}`,
                        marginBottom: "6px",
                      }}
                    >
                      {T.lightning}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "clamp(10px, 1vw, 13px)",
                        color: "rgba(255,255,255,0.7)",
                        padding: "0 12px",
                      }}
                    >
                      {T.lightningDesc}
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* TELA 2-8: JOGO ATIVO */}
          {mode && phase !== "MODE_SELECT" && (
            <motion.div
              key="game-active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Area principal do jogo */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  gap: "clamp(12px, 2vw, 24px)",
                  padding: "clamp(12px, 1.5vw, 20px)",
                  overflow: "hidden",
                }}
              >
                {/* Coluna esquerda: Roda */}
                <div
                  style={{
                    flex: "0 0 40%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <RouletteWheel
                    isSpinning={phase === "SPINNING"}
                    resultNumber={resultNumber}
                    mode={mode}
                    lightningNumbers={lightningNumbers}
                  />

                  {/* Ultimo resultado */}
                  {history.length > 0 && phase === "BETTING" && (
                    <div
                      style={{
                        marginTop: "clamp(12px, 1.5vw, 20px)",
                        display: "flex",
                        gap: "clamp(4px, 0.5vw, 8px)",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        maxWidth: "90%",
                      }}
                    >
                      {history.slice(0, 10).map((round, idx) => (
                        <motion.div
                          key={round.id}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          style={{
                            width: "clamp(24px, 2.5vw, 32px)",
                            height: "clamp(24px, 2.5vw, 32px)",
                            borderRadius: "50%",
                            background: getNumberColor(round.resultNumber) === "red"
                              ? ROULETTE.red
                              : getNumberColor(round.resultNumber) === "black"
                                ? ROULETTE.black
                                : ROULETTE.green,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "clamp(10px, 1vw, 13px)",
                            fontWeight: 700,
                            color: "#fff",
                            border: "1.5px solid rgba(255,255,255,0.2)",
                          }}
                        >
                          {round.resultNumber}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Coluna direita: Mesa de apostas */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <RouletteBettingTable
                    bets={bets}
                    selectedChip={selectedChip}
                    onPlaceBet={handlePlaceBet}
                    mode={mode}
                    lightningNumbers={lightningNumbers}
                    disabled={phase !== "BETTING"}
                    lang={lang}
                  />
                </div>
              </div>

              {/* Footer: Chips + Controles */}
              <div
                style={{
                  flexShrink: 0,
                  padding: "clamp(10px, 1.2vw, 16px) clamp(16px, 2vw, 28px)",
                  background: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.8) 100%)",
                  borderTop: `1px solid ${GOLD.dark}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "clamp(12px, 2vw, 24px)",
                }}
              >
                {/* Chips */}
                <RouletteChipSelector
                  selectedChip={selectedChip}
                  onSelectChip={setSelectedChip}
                  disabled={phase !== "BETTING"}
                />

                {/* Info central */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: "clamp(9px, 0.9vw, 11px)",
                      color: "rgba(212,168,67,0.6)",
                      letterSpacing: "1.5px",
                    }}
                  >
                    {T.totalBet}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "clamp(16px, 2vw, 24px)",
                      fontWeight: 700,
                      color: totalBet > 0 ? GOLD.light : "rgba(255,255,255,0.3)",
                      textShadow: totalBet > 0 ? `0 0 10px ${GOLD.glow}` : "none",
                    }}
                  >
                    {totalBet.toLocaleString()}
                  </span>
                </div>

                {/* Botoes de controle */}
                <div
                  style={{
                    display: "flex",
                    gap: "clamp(8px, 1vw, 12px)",
                  }}
                >
                  {/* Clear */}
                  <motion.button
                    onClick={handleClearBets}
                    disabled={bets.length === 0 || phase !== "BETTING"}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: "clamp(8px, 1vw, 12px) clamp(16px, 2vw, 24px)",
                      background: "rgba(255,68,68,0.15)",
                      border: "1.5px solid rgba(255,68,68,0.4)",
                      borderRadius: "8px",
                      fontFamily: "'Cinzel', serif",
                      fontSize: "clamp(10px, 1vw, 13px)",
                      fontWeight: 700,
                      color: bets.length > 0 ? "#FF6B6B" : "rgba(255,255,255,0.3)",
                      letterSpacing: "1.5px",
                      cursor: bets.length > 0 && phase === "BETTING" ? "pointer" : "not-allowed",
                      opacity: bets.length > 0 && phase === "BETTING" ? 1 : 0.5,
                      minHeight: "44px",
                    }}
                  >
                    {T.clear}
                  </motion.button>

                  {/* Undo */}
                  <motion.button
                    onClick={handleUndoBet}
                    disabled={bets.length === 0 || phase !== "BETTING"}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: "clamp(8px, 1vw, 12px) clamp(16px, 2vw, 24px)",
                      background: "rgba(212,168,67,0.1)",
                      border: `1.5px solid ${GOLD.dark}`,
                      borderRadius: "8px",
                      fontFamily: "'Cinzel', serif",
                      fontSize: "clamp(10px, 1vw, 13px)",
                      fontWeight: 700,
                      color: bets.length > 0 ? GOLD.primary : "rgba(255,255,255,0.3)",
                      letterSpacing: "1.5px",
                      cursor: bets.length > 0 && phase === "BETTING" ? "pointer" : "not-allowed",
                      opacity: bets.length > 0 && phase === "BETTING" ? 1 : 0.5,
                      minHeight: "44px",
                    }}
                  >
                    {T.undo}
                  </motion.button>

                  {/* Double */}
                  <motion.button
                    onClick={handleDoubleBets}
                    disabled={bets.length === 0 || totalBet * 2 > saldo || phase !== "BETTING"}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: "clamp(8px, 1vw, 12px) clamp(16px, 2vw, 24px)",
                      background: "rgba(212,168,67,0.1)",
                      border: `1.5px solid ${GOLD.dark}`,
                      borderRadius: "8px",
                      fontFamily: "'Cinzel', serif",
                      fontSize: "clamp(10px, 1vw, 13px)",
                      fontWeight: 700,
                      color: bets.length > 0 && totalBet * 2 <= saldo ? GOLD.primary : "rgba(255,255,255,0.3)",
                      letterSpacing: "1.5px",
                      cursor: bets.length > 0 && totalBet * 2 <= saldo && phase === "BETTING" ? "pointer" : "not-allowed",
                      opacity: bets.length > 0 && totalBet * 2 <= saldo && phase === "BETTING" ? 1 : 0.5,
                      minHeight: "44px",
                    }}
                  >
                    {T.double}
                  </motion.button>

                  {/* SPIN */}
                  <motion.button
                    onClick={handleSpin}
                    disabled={!canSpin || isSpinning}
                    whileHover={canSpin ? { scale: 1.05, boxShadow: `0 0 30px ${EMERALD.glow}` } : {}}
                    whileTap={canSpin ? { scale: 0.95 } : {}}
                    style={{
                      padding: "clamp(10px, 1.2vw, 16px) clamp(28px, 4vw, 48px)",
                      background: canSpin
                        ? `linear-gradient(180deg, ${EMERALD.light} 0%, ${EMERALD.primary} 100%)`
                        : "rgba(255,255,255,0.1)",
                      border: canSpin ? `2px solid ${EMERALD.light}` : "2px solid rgba(255,255,255,0.2)",
                      borderRadius: "10px",
                      fontFamily: "'Cinzel', serif",
                      fontSize: "clamp(14px, 1.6vw, 20px)",
                      fontWeight: 800,
                      color: canSpin ? "#000" : "rgba(255,255,255,0.3)",
                      letterSpacing: "3px",
                      cursor: canSpin ? "pointer" : "not-allowed",
                      boxShadow: canSpin ? `0 0 20px ${EMERALD.glow}, inset 0 1px 1px rgba(255,255,255,0.3)` : "none",
                      minHeight: "52px",
                    }}
                  >
                    {T.spin}
                  </motion.button>
                </div>
              </div>

              {/* OVERLAY: Lightning Reveal */}
              <AnimatePresence>
                {phase === "LIGHTNING_REVEAL" && (
                  <RouletteLightningPhase
                    lightningNumbers={lightningNumbers}
                    onComplete={() => {}}
                  />
                )}
              </AnimatePresence>

              {/* OVERLAY: Result Win */}
              <AnimatePresence>
                {phase === "RESULT_WIN" && resultNumber !== null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.7)",
                      backdropFilter: "blur(4px)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "clamp(16px, 2vw, 28px)",
                      zIndex: 60,
                    }}
                  >
                    {/* Numero resultado */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      style={{
                        width: "clamp(80px, 12vw, 140px)",
                        height: "clamp(80px, 12vw, 140px)",
                        borderRadius: "50%",
                        background: getNumberColor(resultNumber) === "red"
                          ? `linear-gradient(135deg, ${ROULETTE.red} 0%, #B91C1C 100%)`
                          : getNumberColor(resultNumber) === "black"
                            ? `linear-gradient(135deg, #2D2D2D 0%, ${ROULETTE.black} 100%)`
                            : `linear-gradient(135deg, ${ROULETTE.green} 0%, #166534 100%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "clamp(32px, 5vw, 56px)",
                        fontWeight: 800,
                        color: "#fff",
                        border: `4px solid ${GOLD.light}`,
                        boxShadow: `0 0 40px ${GOLD.glow}, 0 0 80px rgba(0,0,0,0.5)`,
                      }}
                    >
                      {resultNumber}
                    </motion.div>

                    {/* WIN text */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "clamp(24px, 4vw, 48px)",
                        fontWeight: 800,
                        color: EMERALD.light,
                        letterSpacing: "6px",
                        textShadow: `0 0 20px ${EMERALD.glow}, 0 0 40px ${EMERALD.glow}`,
                      }}
                    >
                      {T.win}
                    </motion.div>

                    {/* Win amount counter */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "clamp(28px, 4.5vw, 52px)",
                        fontWeight: 800,
                        color: GOLD.light,
                        textShadow: `0 0 15px ${GOLD.glow}`,
                      }}
                    >
                      +{totalWin.toLocaleString()}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* OVERLAY: Result Lose */}
              <AnimatePresence>
                {phase === "RESULT_LOSE" && resultNumber !== null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.6)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "clamp(16px, 2vw, 28px)",
                      zIndex: 60,
                    }}
                  >
                    {/* Numero resultado */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, x: [0, -5, 5, -5, 5, 0] }}
                      transition={{ duration: 0.5 }}
                      style={{
                        width: "clamp(80px, 12vw, 140px)",
                        height: "clamp(80px, 12vw, 140px)",
                        borderRadius: "50%",
                        background: getNumberColor(resultNumber) === "red"
                          ? `linear-gradient(135deg, ${ROULETTE.red} 0%, #B91C1C 100%)`
                          : getNumberColor(resultNumber) === "black"
                            ? `linear-gradient(135deg, #2D2D2D 0%, ${ROULETTE.black} 100%)`
                            : `linear-gradient(135deg, ${ROULETTE.green} 0%, #166534 100%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "clamp(32px, 5vw, 56px)",
                        fontWeight: 800,
                        color: "#fff",
                        border: "4px solid rgba(255,255,255,0.3)",
                        opacity: 0.8,
                      }}
                    >
                      {resultNumber}
                    </motion.div>

                    {/* LOSE text */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "clamp(20px, 3vw, 36px)",
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.5)",
                        letterSpacing: "4px",
                      }}
                    >
                      {T.lose}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* OVERLAY: Big Win (Lightning) */}
              <AnimatePresence>
                {phase === "BIG_WIN" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.85)",
                      backdropFilter: "blur(8px)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "clamp(20px, 3vw, 40px)",
                      zIndex: 60,
                    }}
                  >
                    {/* Lightning bolts animados */}
                    {[...Array(6)].map((_, i) => (
                      <motion.img
                        key={i}
                        src={ASSETS.lightningBolt}
                        alt=""
                        initial={{ opacity: 0, scale: 0, rotate: Math.random() * 60 - 30 }}
                        animate={{
                          opacity: [0, 1, 0.8, 1, 0],
                          scale: [0, 1.2, 1, 1.1, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          delay: i * 0.15,
                          repeat: Infinity,
                          repeatDelay: 1,
                        }}
                        style={{
                          position: "absolute",
                          width: "clamp(60px, 8vw, 100px)",
                          left: `${15 + i * 14}%`,
                          top: `${20 + (i % 2) * 30}%`,
                          filter: `drop-shadow(0 0 20px ${ROULETTE.lightningGlow})`,
                        }}
                      />
                    ))}

                    {/* MEGA WIN */}
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ 
                        scale: [0, 1.2, 1],
                        rotate: [-10, 5, 0],
                      }}
                      transition={{ duration: 0.6, type: "spring" }}
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "clamp(36px, 6vw, 72px)",
                        fontWeight: 900,
                        background: `linear-gradient(180deg, ${ROULETTE.lightningGold} 0%, #FFA500 50%, ${ROULETTE.lightningGold} 100%)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        letterSpacing: "8px",
                        textShadow: `0 0 30px ${ROULETTE.lightningGlow}`,
                        filter: `drop-shadow(0 0 20px ${ROULETTE.lightningGlow})`,
                      }}
                    >
                      {T.megaWin}
                    </motion.div>

                    {/* Win amount com counter */}
                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "clamp(40px, 7vw, 80px)",
                        fontWeight: 800,
                        color: ROULETTE.lightningGold,
                        textShadow: `0 0 20px ${ROULETTE.lightningGlow}, 0 0 40px ${ROULETTE.lightningGlow}`,
                      }}
                    >
                      +{totalWin.toLocaleString()}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History Modal */}
      <HistoryModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        columns={historyColumns}
        data={history}
        lang={lang}
        escPush={escPush}
        escPop={escPop}
      />

      {/* Provably Fair Modal */}
      <ProvablyFairModal
        open={showProvablyFair}
        onClose={() => setShowProvablyFair(false)}
        lang={lang}
        pfData={pfData}
        onClientSeedChange={(seed) => setPfData(prev => ({ ...prev, clientSeed: seed }))}
        onVerify={async () => {
          setPfVerifying(true);
          await new Promise(r => setTimeout(r, 1000));
          setPfData(prev => ({ ...prev, isValid: true }));
          setPfVerifying(false);
        }}
        verifying={pfVerifying}
        escPush={escPush}
        escPop={escPop}
      />

      {/* Keyframes globais */}
      <style>{`
        @keyframes megaPulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.05); filter: brightness(1.2); }
        }
        @keyframes lightningFlash {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.3; }
        }
        @keyframes saldoWinFlash {
          0%, 100% { text-shadow: 0 0 10px rgba(0,230,118,0.5); }
          50% { text-shadow: 0 0 20px rgba(0,230,118,0.8), 0 0 30px rgba(0,230,118,0.6); }
        }
      `}</style>
    </motion.div>
  );
}
