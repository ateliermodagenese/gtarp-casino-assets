"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCasino } from "@/contexts/CasinoContext";
import {
  createProvablyFairSession, generateGrid as engineGenerateGrid,
  executeVideoSpin, executeClassicSpin, executeBuyBonus,
  sha256,
} from "./SlotsEngine";
import type { SpinResult, Grid as EngineGrid, GridCell } from "./SlotsTypes";
import { VIDEO_SYMBOLS, CLASSIC_SYMBOLS as ENGINE_CLASSIC_SYMBOLS, MIN_BET, MAX_BET, BET_STEPS, BUY_BONUS_MULTIPLIER, GRID_COLS, GRID_ROWS } from "./SlotsConstants";
import DevToolbar from "@/components/casino/DevToolbar";
import {
  HistoryModal, WinAmount, MultiBadge,
  ProvablyFairModal, PaytableModal,
  GameHeader, useEscStack,
  type HistoryColumn, type PFData, type SeedRecord,
  type PaytableCategory,
} from "@/components/shared";
import { useCurrencyConfig } from "@/hooks/use-currency-config";

// FiveM NUI detection — URL contem cfx-nui- quando dentro do FiveM
const isFiveM = typeof window !== "undefined" &&
  window.location.href.includes("cfx-nui-");

async function fetchNui(endpoint: string, data?: any): Promise<any> {
  const resourceName = "bc_casino";
  const resp = await fetch(`https://${resourceName}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || {}),
  });
  return resp.json();
}

// ===========================================================================
// SLOTS GAME — Blackout Casino
// Telas 1-4: ModeSelect, VideoIdle, Spinning/Tumble, FSTrigger
// ===========================================================================

export type SlotsScreen = 
  | "modeSelect" 
  | "videoIdle" 
  | "spinning" 
  | "fsTrigger"
  | "fsPlaying"
  | "winOverlay"
  | "classicIdle"
  | "classicSpinning";

export type SlotMode = "classic" | "video";

// Paths dos assets
const ASSETS = {
  bgCasino: "/assets/shared/ui/bg-casino.png",
  iconGcoin: "/assets/shared/icons/icon-gcoin.png",
  iconInfo: "/assets/shared/icons/icon-info.png",
  iconHistory: "/assets/shared/icons/icon-history.png",
  iconPaytable: "/assets/shared/icons/icon-paytable.png",
  iconCopy: "/assets/shared/icons/icon-copy.png",
  iconProvablyFair: "/assets/shared/icons/icon-provably-fair.png",
  iconSoundOn: "/assets/shared/icons/icon-sound-on.png",
  iconSoundOff: "/assets/shared/icons/icon-sound-off.png",
  logoSlotsBr: "/assets/logos-br-para-cards/2.LOGO-BR-SLOT-MACHINE.png",
  logoSlotsEn: "/assets/logos-in-para-cards/2.LOGO-IN-SLOT-MACHINE.png",
};

// Simbolos regulares (sem scatter/orb para grid visual)
const REGULAR_SYMBOLS = VIDEO_SYMBOLS.filter(s => s.id !== "scatter" && s.id !== "multiplier_orb");

// Simbolos do Classic Slot (7 simbolos)
const CLASSIC_SYMBOLS = [
  { id: "seven", path: "/assets/games/slots/classic/seven.png", color: "#FF1744" },
  { id: "bar", path: "/assets/games/slots/classic/bar.png", color: "#C9A84C" },
  { id: "cherry", path: "/assets/games/slots/classic/cherry.png", color: "#FF5252" },
  { id: "diamond", path: "/assets/games/slots/classic/diamond.png", color: "#64B5F6" },
  { id: "bell", path: "/assets/games/slots/classic/bell.png", color: "#FFD700" },
  { id: "lemon", path: "/assets/games/slots/classic/lemon.png", color: "#FFEB3B" },
  { id: "star", path: "/assets/games/slots/classic/star.png", color: "#FFD700" },
];

// Win overlay images
const WIN_OVERLAYS = {
  big: "/assets/games/slots/overlays/win_big.png",
  mega: "/assets/games/slots/overlays/win_mega.png",
  jackpot: "/assets/games/slots/overlays/win_jackpot.png",
};

// Textos bilingues
const TEXTS = {
  back: { br: "VOLTAR", en: "BACK" },
  backTooltip: { br: "Retorna ao cassino", en: "Return to casino" },
  balanceTooltip: { br: "Seu saldo disponivel para apostas", en: "Your balance available for bets" },
  slotMachine: { br: "SLOT MACHINE", en: "SLOT MACHINE" },
  chooseMode: { br: "Escolha seu modo de jogo", en: "Choose your game mode" },
  classic: { br: "CLASSIC", en: "CLASSIC" },
  video: { br: "VIDEO", en: "VIDEO" },
  classicDesc: { br: "3 rolos, rápido e nostálgico", en: "3 reels, fast and simple" },
  videoDesc: { br: "Grid 8x4, Scatter Pays + Tumble", en: "Grid 8x4, Scatter Pays + Tumble" },
  play: { br: "JOGAR", en: "PLAY" },
  playClassicTooltip: { br: "Iniciar modo Classic", en: "Start Classic mode" },
  playVideoTooltip: { br: "Iniciar modo Video", en: "Start Video mode" },
  jackpot: { br: "JACKPOT", en: "JACKPOT" },
  jackpotTooltip: { br: "Jackpot progressivo — 1.5% de cada aposta alimenta o prêmio", en: "Progressive jackpot — 1.5% of every bet feeds the prize" },
  bet: { br: "APOSTA", en: "BET" },
  win: { br: "GANHO", en: "WIN" },
  spin: { br: "GIRAR", en: "SPIN" },
  spinTooltip: { br: "Girar os rolos! Custo: valor da aposta atual", en: "Spin the reels! Cost: current bet value" },
  ante: { br: "ANTE", en: "ANTE" },
  anteTooltip: { br: "Ativa: +25% no custo do spin, dobra chance de Free Spins", en: "Active: +25% spin cost, doubles Free Spins chance" },
  turbo: { br: "TURBO", en: "TURBO" },
  auto: { br: "AUTO", en: "AUTO" },
  tumble: { br: "TUMBLE", en: "TUMBLE" },
  tumbleTooltip: { br: "Número de cascatas consecutivas neste spin", en: "Number of consecutive cascades in this spin" },
  freeSpins: { br: "FREE SPINS!", en: "FREE SPINS!" },
  rounds: { br: "RODADAS", en: "ROUNDS" },
  start: { br: "COMEÇAR", en: "START" },
  bonus: { br: "BONUS", en: "BONUS" },
  total: { br: "TOTAL", en: "TOTAL" },
  bigWin: { br: "BIG WIN!", en: "BIG WIN!" },
  megaWin: { br: "MEGA WIN!", en: "MEGA WIN!" },
  jackpotWin: { br: "JACKPOT!", en: "JACKPOT!" },
  continue: { br: "CONTINUAR", en: "CONTINUE" },
  backToVideo: { br: "VOLTAR AO VIDEO", en: "BACK TO VIDEO" },
  fsRemaining: { br: "FREE SPINS", en: "FREE SPINS" },
  multiplier: { br: "MULTIPLICADOR", en: "MULTIPLIER" },
  paytable: { br: "TABELA DE PAGAMENTOS", en: "PAYTABLE" },
  history: { br: "HISTÓRICO", en: "HISTORY" },
  provablyFair: { br: "PROVABLY FAIR", en: "PROVABLY FAIR" },
  highSymbols: { br: "SÍMBOLOS PREMIUM", en: "HIGH SYMBOLS" },
  lowSymbols: { br: "SÍMBOLOS GEMAS", en: "LOW SYMBOLS" },
  specialSymbols: { br: "ESPECIAIS", en: "SPECIAL" },
  triggersFs: { br: "Ativa Free Spins", en: "Triggers Free Spins" },
  multipliesWin: { br: "Multiplica ganhos", en: "Multiplies wins" },
  serverSeedHash: { br: "Hash do Server Seed", en: "Server Seed Hash" },
  clientSeed: { br: "Client Seed", en: "Client Seed" },
  nonce: { br: "Nonce", en: "Nonce" },
  verify: { br: "VERIFICAR", en: "VERIFY" },
  provablyFairDesc: { br: "Cada resultado é verificável criptograficamente. O server seed é revelado após cada rodada.", en: "Each result is cryptographically verifiable. Server seed is revealed after each round." },
  buyFreeSpins: { br: "COMPRAR FREE SPINS", en: "BUY FREE SPINS" },
  guaranteedSpins: { br: "10 giros grátis garantidos", en: "10 guaranteed free spins" },
  cost: { br: "CUSTO", en: "COST" },
  currentBalance: { br: "Saldo", en: "Balance" },
  confirm: { br: "CONFIRMAR", en: "CONFIRM" },
  cancel: { br: "CANCELAR", en: "CANCEL" },
  copied: { br: "Copiado!", en: "Copied!" },
  noHistory: { br: "Nenhuma rodada ainda", en: "No rounds yet" },
};

// Nomes bilingues dos simbolos — payouts vem de SlotsConstants.ts (single source of truth)
const SYMBOL_NAMES: Record<string, { br: string; en: string }> = {
  crown: { br: "Coroa", en: "Crown" },
  ring: { br: "Anel", en: "Ring" },
  hourglass: { br: "Ampulheta", en: "Hourglass" },
  chalice: { br: "Cálice", en: "Chalice" },
  ruby: { br: "Rubi", en: "Ruby" },
  sapphire: { br: "Safira", en: "Sapphire" },
  emerald: { br: "Esmeralda", en: "Emerald" },
  amethyst: { br: "Ametista", en: "Amethyst" },
  topaz: { br: "Topázio", en: "Topaz" },
  scatter: { br: "Scatter", en: "Scatter" },
  multiplier_orb: { br: "Orbe Multi", en: "Multi Orb" },
};

// Tipo do registro de historico de spins (G1)
interface SpinHistoryEntry {
  id: number;
  bet: number;
  win: number;
  multi: string;
  time: string;
  mode: "classic" | "video" | "fs";
  pfNonce: number;
}

const MAX_HISTORY = 50;

// Grid mockado com simbolos aleatorios
function generateMockGrid(): { id: string; path: string; tier: string; color: string; uniqueKey: string; multiplierValue?: number }[][] {
  const grid: { id: string; path: string; tier: string; color: string; uniqueKey: string; multiplierValue?: number }[][] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    const rowSymbols: { id: string; path: string; tier: string; color: string; uniqueKey: string; multiplierValue?: number }[] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      const symbol = REGULAR_SYMBOLS[Math.floor(Math.random() * REGULAR_SYMBOLS.length)];
      rowSymbols.push({
        ...symbol,
        uniqueKey: `${row}-${col}-${Date.now()}-${Math.random()}`,
        multiplierValue: 0,
      });
    }
    grid.push(rowSymbols);
  }
  return grid;
}

// Gerar posicoes de winning aleatorias (para demo)
function generateWinningPositions(): Set<string> {
  const positions = new Set<string>();
  const symbol = REGULAR_SYMBOLS[Math.floor(Math.random() * REGULAR_SYMBOLS.length)];
  const count = Math.floor(Math.random() * 4) + 8; // 8-11 matches
  
  while (positions.size < count) {
    const row = Math.floor(Math.random() * GRID_ROWS);
    const col = Math.floor(Math.random() * GRID_COLS);
    positions.add(`${row}-${col}`);
  }
  return positions;
}

// Props do componente
interface SlotsGameProps {
  onBack: () => void;
  onDeposit?: () => void;
  lang?: "br" | "en";
  playerId?: string;
  initialBalance?: number;
}

export default function SlotsGame({ 
  onBack, 
  onDeposit,
  lang: propLang,
  playerId = "player1",
  initialBalance,
}: SlotsGameProps) {
  const { saldo, setSaldo, lang: contextLang } = useCasino();
  const rawLang = propLang || contextLang || "br";
  const lang = rawLang === "in" ? "en" : rawLang as "br" | "en";
  const { config: cc, formatCurrency } = useCurrencyConfig();
  
  // Estados principais
  const [screen, setScreen] = useState<SlotsScreen>("modeSelect");
  const [mode, setMode] = useState<SlotMode | null>(null);
  const [grid, setGrid] = useState<ReturnType<typeof generateMockGrid>>([]);
  const [winningPositions, setWinningPositions] = useState<Set<string>>(new Set());
  const [isSpinning, setIsSpinning] = useState(false);
  const [tumbleCount, setTumbleCount] = useState(0);
  const [showWinHighlight, setShowWinHighlight] = useState(false);
  
  // Estados de aposta
  const [bet, setBet] = useState(10);
  const [currentWin, setCurrentWin] = useState(0);
  const [jackpotPool, setJackpotPool] = useState(47350);
  const [anteBet, setAnteBet] = useState(false);
  const [turboMode, setTurboMode] = useState(false);
  const [autoPlay, setAutoPlay] = useState(0);
  const [showAutoPlayConfig, setShowAutoPlayConfig] = useState(false);
  const [autoPlayConfig, setAutoPlayConfig] = useState({
    spins: 10,
    lossLimit: 0,
    singleWinLimit: 0,
    balanceMin: 0,
    stopOnFS: true,
  });
  const autoPlayStartBalance = useRef(0);
  
  // Free Spins
  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState(0);
  const [freeSpinsTotal, setFreeSpinsTotal] = useState(0);
  const [fsMultiplier, setFsMultiplier] = useState(1);
  const [fsTotalWin, setFsTotalWin] = useState(0);
  const [fsExitConfirm, setFsExitConfirm] = useState(false);
  
  // Win Overlay
  const [winOverlayData, setWinOverlayData] = useState<{ amount: number; ratio: number } | null>(null);
  const [countUpValue, setCountUpValue] = useState(0);
  
  // Classic Slot
  const [classicReels, setClassicReels] = useState<typeof CLASSIC_SYMBOLS[number][][]>([[], [], []]);
  const [classicSpinning, setClassicSpinning] = useState([false, false, false]);
  // Strip estendido: 12 simbolos por reel (9 random + 3 final) para animacao sem vazio
  const [classicStrips, setClassicStrips] = useState<typeof CLASSIC_SYMBOLS[number][][]>([[], [], []]);
  const [classicStopped, setClassicStopped] = useState([false, false, false]);
  const [isLeverPulled, setIsLeverPulled] = useState(false);
  const [classicFeedback, setClassicFeedback] = useState<"win" | "lose" | null>(null);
  // Rows vencedoras no classic: Set de rowIndex (0=topo, 1=meio, 2=baixo)
  const [classicWinRows, setClassicWinRows] = useState<Map<string, number>>(new Map());
  const [videoFeedback, setVideoFeedback] = useState<"win" | "lose" | null>(null);
  
  // Modais
  const [showPaytable, setShowPaytable] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProvablyFair, setShowProvablyFair] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpTab, setHelpTab] = useState(0);
  const [showBuyBonus, setShowBuyBonus] = useState(false);
  const [clientSeed, setClientSeed] = useState("a1b2c3d4e5f6");
  const [nonce, setNonce] = useState(0);
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [serverSeed, setServerSeed] = useState("");
  const [serverSeedHash, setServerSeedHash] = useState("carregando...");
  const [lastSpinResult, setLastSpinResult] = useState<SpinResult | null>(null);
  const [pfVerifying, setPfVerifying] = useState(false);
  const [pfIsValid, setPfIsValid] = useState<boolean | null>(null);
  const [pfRevealedSeed, setPfRevealedSeed] = useState("");
  const [seedHistory, setSeedHistory] = useState<SeedRecord[]>([]);
  const [pfVerifyDetails, setPfVerifyDetails] = useState<{ committedHash: string; recalculatedHash: string; match: boolean } | null>(null);
  const [clientSeedChanged, setClientSeedChanged] = useState(false);

  // G1: Historico real de spins (substitui MOCK_HISTORY)
  const [spinHistory, setSpinHistory] = useState<SpinHistoryEntry[]>([]);
  const spinIdCounter = useRef(0);

  // G2: Filtro de modo no historico
  const [historyFilter, setHistoryFilter] = useState<"all" | "classic" | "video" | "fs">("all");

  // G4: Session stats (useRef para nao causar re-render a cada spin)
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const sessionStatsRef = useRef({
    totalBet: 0,
    totalWin: 0,
    spins: 0,
    bestWin: 0,
    bestMulti: 0,
    wins: 0,
    startTime: Date.now(),
  });

  // Refs
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countUpRef = useRef<number | null>(null);
  const fsSpinRef = useRef<() => void>(() => {});

  // Provably Fair — sessao real (browser mock ou server)
  useEffect(() => {
    if (isFiveM) {
      // FiveM: sessao criada no server ao primeiro spin
      // serverSeedHash vem no response do spin
      setServerSeedHash("aguardando primeiro spin...");
      return;
    }
    createProvablyFairSession().then(session => {
      setServerSeed(session.serverSeed);
      setServerSeedHash(session.serverSeedHash);
      setClientSeed(session.clientSeed);
      setNonce(0);
    });
  }, []);

  // G1+G4: Registra spin no historico e acumula stats de sessao
  const pushToHistory = useCallback((betVal: number, winVal: number, spinMode: "classic" | "video" | "fs") => {
    spinIdCounter.current += 1;
    const multi = winVal > 0 ? `x${(winVal / betVal).toFixed(1)}` : "-";
    const entry: SpinHistoryEntry = {
      id: spinIdCounter.current,
      bet: betVal,
      win: winVal,
      multi,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      mode: spinMode,
      pfNonce: nonce,
    };
    setSpinHistory(prev => [entry, ...prev].slice(0, MAX_HISTORY));

    const stats = sessionStatsRef.current;
    stats.totalBet += betVal;
    stats.totalWin += winVal;
    stats.spins += 1;
    if (winVal > 0) stats.wins += 1;
    if (winVal > stats.bestWin) {
      stats.bestWin = winVal;
      stats.bestMulti = winVal / betVal;
    }
  }, [nonce]);
  
  // Sons — 16 arquivos em public/assets/sounds/slots/
  
  // D5 — Canvas 2D gold particles on classic win
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleRafRef = useRef<number>(0);
  const spawnGoldParticles = useCallback((count: number) => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) { canvas.width = rect.width; canvas.height = rect.height; }
    const colors = ["#FFD700", "#C9A84C", "#F6E27A", "#DAA520", "#FFC107"];
    const particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; color: string; alpha: number; decay: number }> = [];
    const cx = canvas.width / 2, cy = canvas.height / 2;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      particles.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.008 + Math.random() * 0.012,
      });
    }
    cancelAnimationFrame(particleRafRef.current);
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      for (const p of particles) {
        if (p.alpha <= 0) continue;
        p.x += p.vx; p.y += p.vy; p.vy += 0.08;
        p.alpha -= p.decay;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        alive++;
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      if (alive > 0) particleRafRef.current = requestAnimationFrame(animate);
    };
    particleRafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (classicFeedback === "win") {
      const winRows = classicWinRows.size;
      const count = winRows >= 2 ? 80 : winRows === 1 ? 40 : 15;
      spawnGoldParticles(count);
    }
    return () => cancelAnimationFrame(particleRafRef.current);
  }, [classicFeedback, classicWinRows, spawnGoldParticles]);
  const soundCacheRef = useRef<Record<string, HTMLAudioElement>>({});
  const playSound = useCallback((name: string, volume = 0.5) => {
    try {
      const path = `/assets/sounds/slots/${name}.mp3`;
      if (!soundCacheRef.current[name]) {
        soundCacheRef.current[name] = new Audio(path);
      }
      const audio = soundCacheRef.current[name];
      audio.volume = Math.min(1, Math.max(0, volume));
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch (_) {}
  }, []);
  
  const playWinSound = useCallback((amount: number, betVal: number) => {
    const ratio = amount / betVal;
    if (ratio >= 50) playSound("win_mega", 0.7);
    else if (ratio >= 15) playSound("win_big", 0.6);
    else if (ratio >= 5) playSound("win_medium", 0.5);
    else playSound("win_small", 0.4);
  }, [playSound]);
  
  // Gerar reels classicos (3 reels, cada um com 3 simbolos visiveis)
  const generateClassicReels = useCallback(() => {
    return [0, 1, 2].map(() => {
      const reel: typeof CLASSIC_SYMBOLS[number][] = [];
      for (let i = 0; i < 3; i++) {
        reel.push(CLASSIC_SYMBOLS[Math.floor(Math.random() * CLASSIC_SYMBOLS.length)]);
      }
      return reel;
    });
  }, []);
  
  // Inicializar grid
  useEffect(() => {
    setGrid(generateMockGrid());
    setClassicReels(generateClassicReels());
  }, [generateClassicReels]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      if (countUpRef.current) cancelAnimationFrame(countUpRef.current);
    };
  }, []);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  
  const handleModeSelect = useCallback((selectedMode: SlotMode) => {
    setMode(selectedMode);
    if (selectedMode === "video") {
      setScreen("videoIdle");
      setGrid(generateMockGrid());
    } else if (selectedMode === "classic") {
      setScreen("classicIdle");
      setClassicReels(generateClassicReels());
      setClassicStopped([false, false, false]);
    }
  }, [generateClassicReels]);

  // Helper: reconstruir grid visual apos tumble step
  const applyTumbleStep = useCallback((
    currentGrid: ReturnType<typeof generateMockGrid>,
    step: { removedPositions: Array<{ row: number; col: number }>; newSymbols: Array<{ row: number; col: number; symbol: { id: string; path: string; tier: string; color: string } }> }
  ): ReturnType<typeof generateMockGrid> => {
    const removedSet = new Set(step.removedPositions.map(p => `${p.row}-${p.col}`));
    const newGrid: ReturnType<typeof generateMockGrid> = [];

    for (let col = 0; col < GRID_COLS; col++) {
      const surviving: ReturnType<typeof generateMockGrid>[0] = [];
      for (let row = 0; row < GRID_ROWS; row++) {
        if (!removedSet.has(`${row}-${col}`)) {
          surviving.push(currentGrid[row]?.[col] || currentGrid[0][0]);
        }
      }

      const newForCol = step.newSymbols
        .filter(s => s.col === col)
        .sort((a, b) => a.row - b.row)
        .map(s => ({
          id: s.symbol.id,
          path: s.symbol.path,
          tier: s.symbol.tier,
          color: s.symbol.color,
          uniqueKey: `t-${col}-${Date.now()}-${Math.random()}`,
          multiplierValue: s.multiplierValue || 0,
        }));

      const fullCol = [...newForCol, ...surviving];

      for (let row = 0; row < GRID_ROWS; row++) {
        if (!newGrid[row]) newGrid[row] = [];
        newGrid[row][col] = fullCol[row] || surviving[surviving.length - 1] || currentGrid[0][0];
      }
    }

    return newGrid;
  }, []);

  // Win countup animation
  const startCountUp = useCallback((targetValue: number, ratio: number) => {
    const duration = ratio >= 500 ? 4000 : ratio >= 50 ? 3000 : 2000;
    const startTime = performance.now();
    setCountUpValue(0);
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      
      setCountUpValue(Math.floor(targetValue * eased));
      
      if (progress < 1) {
        countUpRef.current = requestAnimationFrame(animate);
      }
    };
    
    countUpRef.current = requestAnimationFrame(animate);
  }, []);

  const handleSpin = useCallback(async () => {
    if (isSpinning || bet > saldo) return;

    const totalBet = anteBet ? Math.floor(bet * 1.25) : bet;
    setSaldo(saldo - totalBet);
    setIsSpinning(true);
    setScreen("spinning");
    setCurrentWin(0);
    setTumbleCount(0);
    setShowWinHighlight(false);
    setWinningPositions(new Set());
    setGrid(generateMockGrid());
    playSound("spin_start", 0.4);

    const currentNonce = nonce;
    setNonce(prev => prev + 1);

    const isFS = screen === "fsPlaying" || freeSpinsRemaining > 0;

    try {
      if (isFiveM) {
        // ==================== FIVEM: servidor calcula resultado ====================
        const resp = await fetchNui("casino:slot:spin", {
          bet, anteBet, isFS, clientSeed,
        });

        if (resp.error) {
          setSaldo(prev => prev + totalBet);
          setIsSpinning(false);
          setScreen("videoIdle");
          return;
        }

        // Mapear grid do server (column-major {symbolId}) para visual (row-major com images)
        const serverGrid = resp.grid;
        const visualGrid: ReturnType<typeof generateMockGrid> = [];
        for (let row = 0; row < GRID_ROWS; row++) {
          const rowSymbols: ReturnType<typeof generateMockGrid>[0] = [];
          for (let col = 0; col < GRID_COLS; col++) {
            const serverCell = serverGrid[col][row];
            const sym = VIDEO_SYMBOLS.find(s => s.id === serverCell.symbolId) || VIDEO_SYMBOLS[8];
            rowSymbols.push({
              id: sym.id, path: sym.path, tier: sym.tier, color: sym.color,
              uniqueKey: `${row}-${col}-${Date.now()}-${Math.random()}`,
              multiplierValue: serverCell.multiplierValue || 0,
            });
          }
          visualGrid.push(rowSymbols);
        }

        // Aplicar resultado do server
        setSaldo(resp.balance);
        setJackpotPool(resp.jackpotPool);
        setServerSeedHash(resp.serverSeedHash);

        // G1: Registrar no historico
        pushToHistory(totalBet, resp.totalWin || 0, isFS ? "fs" : "video");

        // Construir SpinResult pra PF verify funcionar
        const engineGrid: EngineGrid = [];
        for (let col = 0; col < GRID_COLS; col++) {
          const column: GridCell[] = [];
          for (let row = 0; row < GRID_ROWS; row++) {
            const cell = serverGrid[col][row];
            const sym = VIDEO_SYMBOLS.find(s => s.id === cell.symbolId) || VIDEO_SYMBOLS[8];
            column.push({
              symbol: sym, row, col,
              isWinning: false, isDimmed: false,
              isScatter: cell.isScatter, isMultiplier: cell.isMultiplier,
              multiplierValue: cell.multiplierValue || 0,
            });
          }
          engineGrid.push(column);
        }
        setLastSpinResult({
          initialGrid: engineGrid,
          tumbleSteps: [],
          totalWin: resp.totalWin,
          totalMultiplier: resp.totalMultiplier || 1,
          scatterCount: resp.scatterCount || 0,
          triggeredFreeSpins: resp.triggeredFS || false,
          freeSpinsAwarded: resp.fsAwarded || 0,
          isJackpot: resp.isJackpot || false,
          jackpotWin: resp.jackpotWin || 0,
          provablyFair: {
            serverSeedHash: resp.serverSeedHash,
            clientSeed,
            nonce: resp.nonce,
          },
        });

        const spinDuration = turboMode ? 800 : 2400;
        spinTimeoutRef.current = setTimeout(() => {
          setGrid(visualGrid);

          // Helper: mapear grid server (col-major symbolId) pra visual (row-major com images)
          const mapServerGrid = (sGrid: any[][]) => {
            const vGrid: ReturnType<typeof generateMockGrid> = [];
            for (let row = 0; row < GRID_ROWS; row++) {
              const rowSymbols: ReturnType<typeof generateMockGrid>[0] = [];
              for (let col = 0; col < GRID_COLS; col++) {
                const sCell = sGrid[col][row];
                const sym = VIDEO_SYMBOLS.find(s => s.id === sCell.symbolId) || VIDEO_SYMBOLS[8];
                rowSymbols.push({
                  id: sym.id, path: sym.path, tier: sym.tier, color: sym.color,
                  uniqueKey: `t-${row}-${col}-${Date.now()}-${Math.random()}`,
                  multiplierValue: sCell.multiplierValue || 0,
                });
              }
              vGrid.push(rowSymbols);
            }
            return vGrid;
          };

          const serverSteps = resp.tumbleSteps || [];

          if (serverSteps.length > 0) {
            // TUMBLE CASCADE ANIMADO — delay inicial pra jogador ver o grid
            const highlightDur = turboMode ? 300 : 1200;
            const cascadeDur = turboMode ? 250 : 800;
            const initialViewDelay = turboMode ? 600 : 2000;
            let accWin = 0;

            const animateServerStep = (stepIdx: number) => {
              const step = serverSteps[stepIdx];

              // Highlight posicoes vencedoras
              const positions = new Set<string>();
              for (const cluster of step.winClusters) {
                for (const pos of cluster.positions) {
                  positions.add(`${pos.row}-${pos.col}`);
                }
              }
              setWinningPositions(positions);
              setShowWinHighlight(true);
              setTumbleCount(stepIdx + 1);
              accWin += step.stepWin;
              setCurrentWin(accWin);
              playSound(stepIdx === 0 ? "win_small" : "tumble_drop", 0.3);

              // Apos highlight: limpar + mostrar grid cascadeado
              spinTimeoutRef.current = setTimeout(() => {
                setShowWinHighlight(false);
                setWinningPositions(new Set());
                setGrid(mapServerGrid(step.gridAfter));

                // Proximo passo ou finalizar
                spinTimeoutRef.current = setTimeout(() => {
                  if (stepIdx + 1 < serverSteps.length) {
                    animateServerStep(stepIdx + 1);
                  } else {
                    // Fim da cascata — finalizar
                    finalizeSpin();
                  }
                }, cascadeDur);
              }, highlightDur);
            };

            playWinSound(resp.totalWin, bet);
            setVideoFeedback("win");
            setTimeout(() => setVideoFeedback(null), 1600);
            // Delay pra jogador ver o grid antes do tumble comecar
            spinTimeoutRef.current = setTimeout(() => {
              animateServerStep(0);
            }, initialViewDelay);
          } else if (resp.totalWin > 0) {
            // Win direto sem tumble — aguarda simbolos aparecerem (stagger 8 colunas = ~1.05s)
            setCurrentWin(resp.totalWin);
            playWinSound(resp.totalWin, bet);
            const winDelay = turboMode ? 600 : 1800;
            spinTimeoutRef.current = setTimeout(() => {
              setVideoFeedback("win");
              setTimeout(() => setVideoFeedback(null), 1600);
              finalizeSpin();
            }, winDelay);
          } else {
            // Sem win — aguarda simbolos aparecerem antes de encerrar
            setVideoFeedback("lose");
            setTimeout(() => setVideoFeedback(null), 1600);
            setTimeout(() => {
              setIsSpinning(false);
              setScreen(isFS ? "fsPlaying" : "videoIdle");
            }, turboMode ? 800 : 1600);
          }

          function finalizeSpin() {
            if (resp.triggeredFS && !isFS) {
              playSound("free_spins_trigger", 0.6);
              setScreen("fsTrigger");
              setFreeSpinsTotal(resp.fsAwarded);
              setFreeSpinsRemaining(resp.fsAwarded);
              setFsMultiplier(1);
              setFsTotalWin(0);
              setIsSpinning(false);
            } else {
              const ratio = resp.totalWin / bet;
              if (ratio >= 5) {
                setWinOverlayData({ amount: resp.totalWin, ratio });
                setScreen("winOverlay");
                startCountUp(resp.totalWin, ratio);
                setIsSpinning(false);
              } else {
                // Pausa para usuario ver o resultado antes de liberar proximo spin
                setTimeout(() => {
                  setScreen(isFS ? "fsPlaying" : "videoIdle");
                  setIsSpinning(false);
                }, turboMode ? 600 : 1500);
              }
            }
          }
        }, spinDuration);

      } else {
        // ==================== BROWSER MOCK: engine local (dev) ====================
        const { result, newJackpotPool } = await executeVideoSpin(
          bet, anteBet, serverSeed, clientSeed, currentNonce, isFS, jackpotPool
        );
        setJackpotPool(newJackpotPool);
        setLastSpinResult(result);

        // G1: Registrar no historico
        pushToHistory(totalBet, result.totalWin || 0, isFS ? "fs" : "video");

      // Atraso de animacao do spin
      const spinDuration = turboMode ? 800 : 2400;
      spinTimeoutRef.current = setTimeout(() => {
        // Converter grid da engine (column-major) para visual (row-major)
        const engineGrid = result.initialGrid;
        const visualGrid: ReturnType<typeof generateMockGrid> = [];
        for (let row = 0; row < GRID_ROWS; row++) {
          const rowSymbols: ReturnType<typeof generateMockGrid>[0] = [];
          for (let col = 0; col < GRID_COLS; col++) {
            const cell = engineGrid[col][row];
            rowSymbols.push({
              id: cell.symbol.id,
              path: cell.symbol.path,
              tier: cell.symbol.tier,
              color: cell.symbol.color,
              uniqueKey: `${row}-${col}-${Date.now()}-${Math.random()}`,
              multiplierValue: cell.multiplierValue || 0,
            });
          }
          visualGrid.push(rowSymbols);
        }
        setGrid(visualGrid);

        if (result.tumbleSteps.length > 0) {
          // Tumble cascade animado — passo a passo
          const highlightDur = turboMode ? 300 : 1200;
          const cascadeDur = turboMode ? 250 : 800;
          const initialViewDelay = turboMode ? 600 : 2000;
          let accWin = 0;

          const animateStep = (stepIdx: number) => {
            const step = result.tumbleSteps[stepIdx];

            const positions = new Set<string>();
            for (const cluster of step.winClusters) {
              for (const pos of cluster.positions) {
                positions.add(`${pos.row}-${pos.col}`);
              }
            }
            setWinningPositions(positions);
            setShowWinHighlight(true);
            setTumbleCount(stepIdx + 1);
            accWin += step.totalWin;
            setCurrentWin(accWin);
            playSound(stepIdx === 0 ? "win_small" : "tumble_drop", 0.3);

            spinTimeoutRef.current = setTimeout(() => {
              setShowWinHighlight(false);
              setWinningPositions(new Set());
              setGrid(prev => applyTumbleStep(prev, step));

              spinTimeoutRef.current = setTimeout(() => {
                if (stepIdx + 1 < result.tumbleSteps.length) {
                  animateStep(stepIdx + 1);
                } else {
                  if (result.triggeredFreeSpins && !isFS) {
                    playSound("free_spins_trigger", 0.6);
                    setScreen("fsTrigger");
                    setFreeSpinsTotal(result.freeSpinsAwarded);
                    setFreeSpinsRemaining(result.freeSpinsAwarded);
                    setFsMultiplier(1);
                    setFsTotalWin(0);
                    setIsSpinning(false);
                  } else {
                    const ratio = result.totalWin / bet;
                    setSaldo(prev => prev + result.totalWin);

                    if (ratio >= 5) {
                      setWinOverlayData({ amount: result.totalWin, ratio });
                      setScreen("winOverlay");
                      startCountUp(result.totalWin, ratio);
                    } else {
                      setScreen(isFS ? "fsPlaying" : "videoIdle");
                    }
                    setIsSpinning(false);
                  }
                }
              }, cascadeDur);
            }, highlightDur);
          };

          playWinSound(result.totalWin, bet);
          setVideoFeedback("win");
          setTimeout(() => setVideoFeedback(null), 1600);
          spinTimeoutRef.current = setTimeout(() => {
            animateStep(0);
          }, initialViewDelay);
        } else if (result.totalWin > 0) {
          // Win direto sem tumble (browser) — aguarda simbolos se estabilizarem
          setCurrentWin(result.totalWin);
          playWinSound(result.totalWin, bet);
          const winDelay = turboMode ? 600 : 1800;
          spinTimeoutRef.current = setTimeout(() => {
            setVideoFeedback("win");
            setTimeout(() => setVideoFeedback(null), 1600);
            setSaldo(prev => prev + result.totalWin);
            const ratio = result.totalWin / bet;
            if (ratio >= 5) {
              setWinOverlayData({ amount: result.totalWin, ratio });
              setScreen("winOverlay");
              startCountUp(result.totalWin, ratio);
            } else {
              setScreen(isFS ? "fsPlaying" : "videoIdle");
            }
            setIsSpinning(false);
          }, winDelay);
        } else {
          // Sem win — aguarda simbolos aparecerem antes de encerrar
          setVideoFeedback("lose");
          setTimeout(() => setVideoFeedback(null), 1600);
          setTimeout(() => {
            setIsSpinning(false);
            setScreen(isFS ? "fsPlaying" : "videoIdle");
          }, turboMode ? 800 : 1600);
        }
      }, spinDuration);
      }
    } catch (err) {
      // Fallback: devolver aposta se engine falhar
      setSaldo(prev => prev + totalBet);
      setIsSpinning(false);
      setScreen("videoIdle");
    }
  }, [isSpinning, bet, saldo, anteBet, turboMode, setSaldo, nonce, serverSeed, clientSeed, jackpotPool, screen, freeSpinsRemaining, applyTumbleStep, startCountUp, pushToHistory]);
  
  const handleFSStart = useCallback(() => {
    setScreen("fsPlaying");
    setTimeout(() => fsSpinRef.current(), 500);
  }, []);
  
  // Free Spin handler — usa engine real, ref pra recursao sem closure stale
  const handleFSSpin = useCallback(() => {
    setFreeSpinsRemaining(prev => {
      if (prev <= 0) return prev;
      
      setIsSpinning(true);
      setShowWinHighlight(false);
      setWinningPositions(new Set());
      setGrid(generateMockGrid());
      
      const currentNonce = nonce;
      setNonce(n => n + 1);
      
      const spinDur = turboMode ? 800 : 1600;

      (async () => {
        try {
          let result: SpinResult;
          let newJackpotPool = jackpotPool;

          if (isFiveM) {
            const resp = await fetchNui("casino:slot:spin", {
              bet, anteBet, isFS: true, clientSeed,
            });
            if (resp.error) { setIsSpinning(false); return prev; }

            // Mapear grid do server → formato SpinResult parcial
            const serverGrid = resp.grid;
            const mappedGrid: any = [];
            for (let col = 0; col < GRID_COLS; col++) {
              const column: any = [];
              for (let row = 0; row < GRID_ROWS; row++) {
                const sc = serverGrid[col][row];
                const sym = VIDEO_SYMBOLS.find(s => s.id === sc.symbolId) || VIDEO_SYMBOLS[8];
                column.push({ symbol: sym, row, col, isWinning: false, isDimmed: false, isScatter: sc.isScatter, isMultiplier: sc.isMultiplier, multiplierValue: sc.multiplierValue || 0 });
              }
              mappedGrid.push(column);
            }

            setSaldo(resp.balance);
            setJackpotPool(resp.jackpotPool);
            setServerSeedHash(resp.serverSeedHash);
            newJackpotPool = resp.jackpotPool;

            result = {
              initialGrid: mappedGrid,
              tumbleSteps: resp.tumbleSteps || [],
              totalWin: resp.totalWin,
              totalMultiplier: resp.totalMultiplier,
              scatterCount: resp.scatterCount,
              triggeredFreeSpins: resp.triggeredFS,
              freeSpinsAwarded: resp.fsAwarded,
              isJackpot: resp.isJackpot,
              jackpotWin: resp.jackpotWin,
              provablyFair: { serverSeedHash: resp.serverSeedHash, clientSeed, nonce: currentNonce },
            };
          } else {
            const execResult = await executeVideoSpin(
              bet, anteBet, serverSeed, clientSeed, currentNonce, true, jackpotPool
            );
            result = execResult.result;
            newJackpotPool = execResult.newJackpotPool;
          }

          setJackpotPool(newJackpotPool);
          setLastSpinResult(result);

          // G1: Registrar FS spin no historico
          pushToHistory(bet + anteBet, result.totalWin || 0, "fs");

          spinTimeoutRef.current = setTimeout(() => {
            const engineGrid = result.initialGrid;
            const visualGrid: ReturnType<typeof generateMockGrid> = [];
            for (let row = 0; row < GRID_ROWS; row++) {
              const rowSymbols: ReturnType<typeof generateMockGrid>[0] = [];
              for (let col = 0; col < GRID_COLS; col++) {
                const cell = engineGrid[col][row];
                rowSymbols.push({
                  id: cell.symbol.id,
                  path: cell.symbol.path,
                  tier: cell.symbol.tier,
                  color: cell.symbol.color,
                  uniqueKey: `fs-${row}-${col}-${Date.now()}-${Math.random()}`,
                  multiplierValue: cell.multiplierValue || 0,
                });
              }
              visualGrid.push(rowSymbols);
            }
            setGrid(visualGrid);

            if (result.tumbleSteps.length > 0) {
              const highlightDur = turboMode ? 300 : 1200;
              const cascadeDur = turboMode ? 250 : 800;
              let accWin = 0;

              const animateFSStep = (stepIdx: number) => {
                const step = result.tumbleSteps[stepIdx];

                const positions = new Set<string>();
                for (const cluster of step.winClusters) {
                  for (const pos of cluster.positions) {
                    positions.add(`${pos.row}-${pos.col}`);
                  }
                }
                setWinningPositions(positions);
                setShowWinHighlight(true);
                setTumbleCount(stepIdx + 1);
                accWin += step.totalWin || step.stepWin || 0;
                setCurrentWin(accWin);
                playSound(stepIdx === 0 ? "win_small" : "tumble_drop", 0.3);

                spinTimeoutRef.current = setTimeout(() => {
                  setShowWinHighlight(false);
                  setWinningPositions(new Set());
                  setGrid(prevGrid => applyTumbleStep(prevGrid, step));

                  spinTimeoutRef.current = setTimeout(() => {
                    if (stepIdx + 1 < result.tumbleSteps.length) {
                      animateFSStep(stepIdx + 1);
                    } else {
                      // Fim da cascata — finalizar este FS spin
                      const spinWin = result.totalWin;
                      setCurrentWin(spinWin);

                      if (result.totalMultiplier > 1) {
                        setFsMultiplier(m => m + (result.totalMultiplier - 1));
                      }

                      setFsTotalWin(curTotal => {
                        const newTotal = curTotal + spinWin;

                        setTimeout(() => {
                          setIsSpinning(false);

                          if (result.triggeredFreeSpins) {
                            setFreeSpinsRemaining(r => r + result.freeSpinsAwarded);
                            setFreeSpinsTotal(t => t + result.freeSpinsAwarded);
                          }

                          if (prev <= 1 && !result.triggeredFreeSpins) {
                            if (newTotal > 0) {
                              const ratio = newTotal / bet;
                              if (ratio >= 5) {
                                setWinOverlayData({ amount: newTotal, ratio });
                                setScreen("winOverlay");
                                startCountUp(newTotal, ratio);
                              } else {
                                setSaldo(s => s + newTotal);
                                setScreen("videoIdle");
                                setFsMultiplier(1);
                                setFsTotalWin(0);
                              }
                            } else {
                              setScreen("videoIdle");
                              setFsMultiplier(1);
                              setFsTotalWin(0);
                            }
                          } else {
                            setTimeout(() => fsSpinRef.current(), turboMode ? 400 : 800);
                          }
                        }, turboMode ? 300 : 600);

                        return newTotal;
                      });
                    }
                  }, cascadeDur);
                }, highlightDur);
              };

              playWinSound(result.totalWin, bet);
              setVideoFeedback("win");
              setTimeout(() => setVideoFeedback(null), 1600);
              animateFSStep(0);
            } else {
              setTimeout(() => {
                setIsSpinning(false);
                
                if (prev <= 1) {
                  setFsTotalWin(curTotal => {
                    if (curTotal > 0) {
                      const ratio = curTotal / bet;
                      if (ratio >= 5) {
                        setWinOverlayData({ amount: curTotal, ratio });
                        setScreen("winOverlay");
                        startCountUp(curTotal, ratio);
                      } else {
                        setSaldo(s => s + curTotal);
                        setScreen("videoIdle");
                        setFsMultiplier(1);
                        setFsTotalWin(0);
                      }
                    } else {
                      setScreen("videoIdle");
                      setFsMultiplier(1);
                      setFsTotalWin(0);
                    }
                    return curTotal;
                  });
                } else {
                  setTimeout(() => fsSpinRef.current(), turboMode ? 400 : 800);
                }
              }, turboMode ? 200 : 400);
            }
          }, spinDur);
        } catch {
          setIsSpinning(false);
        }
      })();
      
      return prev - 1;
    });
  }, [turboMode, bet, anteBet, nonce, serverSeed, clientSeed, jackpotPool, setSaldo, startCountUp, pushToHistory]);
  
  // Manter ref atualizado
  useEffect(() => {
    fsSpinRef.current = handleFSSpin;
  }, [handleFSSpin]);

  // Auto-play loop com stop conditions (H1 — padrao NetEnt/Pragmatic)
  useEffect(() => {
    if (autoPlay <= 0 || screen !== "videoIdle" || isSpinning || bet > saldo) return;

    const cfg = autoPlayConfig;
    const startBal = autoPlayStartBalance.current;

    // Stop condition: loss limit
    if (cfg.lossLimit > 0 && startBal - saldo >= cfg.lossLimit) {
      setAutoPlay(0);
      return;
    }
    // Stop condition: single win limit (ultimo spin)
    if (cfg.singleWinLimit > 0 && currentWin >= cfg.singleWinLimit) {
      setAutoPlay(0);
      return;
    }
    // Stop condition: balance minimum
    if (cfg.balanceMin > 0 && saldo <= cfg.balanceMin) {
      setAutoPlay(0);
      return;
    }
    // Stop condition: free spins triggered
    if (cfg.stopOnFS && (freeSpinsRemaining > 0 || screen === "fsTrigger")) {
      setAutoPlay(0);
      return;
    }

    const timer = setTimeout(() => {
      setAutoPlay(prev => prev - 1);
      handleSpin();
    }, turboMode ? 500 : 1000);
    return () => clearTimeout(timer);
  }, [autoPlay, screen, isSpinning, bet, saldo, turboMode, handleSpin, autoPlayConfig, currentWin, freeSpinsRemaining]);
  
  // Win overlay continue
  const handleWinContinue = useCallback(() => {
    if (winOverlayData) {
      setSaldo(prev => prev + winOverlayData.amount);
    }
    setWinOverlayData(null);
    setCountUpValue(0);
    setScreen("videoIdle");
    setFsMultiplier(1);
    setFsTotalWin(0);
    setCurrentWin(0);
  }, [winOverlayData, setSaldo]);
  
  // Classic Spin handler
  const handleClassicSpin = useCallback(async () => {
    if (classicSpinning.some(s => s) || bet > saldo) return;

    const totalBet = bet;
    setSaldo(saldo - totalBet);
    setJackpotPool(prev => prev + Math.floor(totalBet * 0.015));
    setCurrentWin(0);
    // Strip inicial com 12 simbolos random — sem vazio no overflow durante o spin
    const initialStrips = [0, 1, 2].map(() =>
      Array.from({ length: 12 }, () => CLASSIC_SYMBOLS[Math.floor(Math.random() * CLASSIC_SYMBOLS.length)])
    );
    setClassicStrips(initialStrips);
    setClassicSpinning([true, true, true]);
    setClassicStopped([false, false, false]);
    setScreen("classicSpinning");
    playSound("spin_start", 0.4);

    const currentNonce = nonce;
    setNonce(prev => prev + 1);

    try {
      let totalWin = 0;
      let finalReels: any[][];

      if (isFiveM) {
        const resp = await fetchNui("casino:slot:classic-spin", { bet, clientSeed });
        if (resp.error) {
          setSaldo(prev => prev + totalBet);
          setClassicSpinning([false, false, false]);
          setScreen("classicIdle");
          return;
        }
        totalWin = resp.totalWin;
        setSaldo(resp.balance);
        setServerSeedHash(resp.serverSeedHash);
        // Mapear reels do server (symbolId) pra visual (com path/color)
        finalReels = resp.reels.map((reel: any[]) =>
          reel.map((sym: any) => {
            const found = ENGINE_CLASSIC_SYMBOLS.find(s => s.id === sym.id) || ENGINE_CLASSIC_SYMBOLS[6];
            return { id: found.id, path: found.path, color: found.color, weight: found.weight, payout3: found.payout3, payout2: found.payout2 };
          })
        );
      } else {
        const classicResult = await executeClassicSpin(bet, serverSeed, clientSeed, currentNonce);
        totalWin = classicResult.totalWin;
        finalReels = classicResult.visibleReels.map(reel =>
          reel.map(sym => ({
            id: sym.id, path: sym.path, color: sym.color,
            weight: sym.weight, payout3: sym.payout3, payout2: sym.payout2,
          }))
        );
      }
      // G1: Registrar classic spin no historico
      pushToHistory(totalBet, totalWin, "classic");

      const baseTimes = turboMode ? [500, 700, 1100] : [1000, 1400, 2200];
      // Substituir ultimos 3 de cada strip pelo resultado real
      setClassicStrips(finalReels.map((fr, i) => [
        ...(initialStrips[i]?.slice(0, 9) ?? Array.from({ length: 9 }, () => CLASSIC_SYMBOLS[0])),
        ...fr,
      ]));

      baseTimes.forEach((time, reelIndex) => {
        setTimeout(() => {
          setClassicReels(prev => {
            const newReels = [...prev];
            newReels[reelIndex] = finalReels[reelIndex];
            return newReels;
          });
          setClassicSpinning(prev => {
            const ns = [...prev]; ns[reelIndex] = false; return ns;
          });
          setClassicStopped(prev => {
            const ns = [...prev]; ns[reelIndex] = true; return ns;
          });

          if (reelIndex === 2) {
            setTimeout(() => {
              setScreen("classicIdle");
              if (totalWin > 0) {
                setCurrentWin(totalWin);
                if (!isFiveM) setSaldo(prev => prev + totalWin);
                // Detectar quais linhas tem 3 simbolos iguais para highlight
                const winCells = new Map<string, number>();
                for (let row = 0; row < 3; row++) {
                  const ids = finalReels.map(reel => reel[row]?.id);
                  if (ids[0] && ids[0] === ids[1] && ids[1] === ids[2]) {
                    winCells.set(`0-${row}`, 3);
                    winCells.set(`1-${row}`, 3);
                    winCells.set(`2-${row}`, 3);
                  } else if (ids[0] && ids[0] === ids[1]) {
                    winCells.set(`0-${row}`, 2);
                    winCells.set(`1-${row}`, 2);
                  }
                }
                setClassicWinRows(winCells);
                setClassicFeedback("win");
                playWinSound(totalWin, bet);
              } else {
                setClassicFeedback("lose");
              }
              playSound("reel_stop", 0.3);
              setTimeout(() => { setClassicFeedback(null); setClassicWinRows(new Map()); }, 1800);
            }, 200);
          }
        }, time);
      });
    } catch (_) {
      setSaldo(prev => prev + totalBet);
      setClassicSpinning([false, false, false]);
      setScreen("classicIdle");
    }
  }, [classicSpinning, bet, saldo, turboMode, setSaldo, nonce, serverSeed, clientSeed, pushToHistory]);
  
  const handleBetChange = useCallback((action: "min" | "max" | "prev" | "next") => {
    switch (action) {
      case "min":
        setBet(BET_STEPS[0]);
        break;
      case "max":
        setBet(Math.min(BET_STEPS[BET_STEPS.length - 1], Math.floor(saldo)));
        break;
      case "prev": {
        const idx = BET_STEPS.findIndex(s => s >= bet);
        const prevIdx = Math.max(0, (idx <= 0 ? 0 : idx - 1));
        setBet(BET_STEPS[prevIdx]);
        break;
      }
      case "next": {
        const idx = BET_STEPS.findIndex(s => s > bet);
        const nextIdx = idx === -1 ? BET_STEPS.length - 1 : idx;
        setBet(Math.min(BET_STEPS[nextIdx], Math.floor(saldo) || BET_STEPS[nextIdx]));
        break;
      }
    }
  }, [bet, saldo]);
  
  // Copy server seed hash
  const handleCopyHash = useCallback(() => {
    navigator.clipboard.writeText(serverSeedHash);
    setCopiedSeed(true);
    setTimeout(() => setCopiedSeed(false), 2000);
  }, [serverSeedHash]);
  
  // Buy bonus (100x bet)
  const handleBuyBonus = useCallback(async () => {
    const cost = bet * BUY_BONUS_MULTIPLIER;
    if (cost > saldo) return;

    setSaldo(saldo - cost);
    setShowBuyBonus(false);
    playSound("buy_bonus", 0.5);

    const currentNonce = nonce;
    setNonce(prev => prev + 1);

    try {
      if (isFiveM) {
        const resp = await fetchNui("casino:slot:buy-bonus", { bet });
        if (resp.error) { setSaldo(prev => prev + cost); return; }
        setSaldo(resp.balance);
        setFreeSpinsRemaining(resp.fsAwarded);
        setFreeSpinsTotal(resp.fsAwarded);
        setFsMultiplier(1);
        setFsTotalWin(0);
        setScreen("fsTrigger");
      } else {
        const { result, newJackpotPool } = await executeBuyBonus(
          bet, serverSeed, clientSeed, currentNonce, jackpotPool
        );
        setJackpotPool(newJackpotPool);
        setLastSpinResult(result);
        setFreeSpinsRemaining(result.freeSpinsAwarded);
        setFreeSpinsTotal(result.freeSpinsAwarded);
        setFsMultiplier(1);
        setFsTotalWin(0);
        setScreen("fsTrigger");
      }
    } catch (_) {
      setSaldo(prev => prev + cost);
    }
  }, [bet, saldo, setSaldo, nonce, serverSeed, clientSeed, jackpotPool]);

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================
  
  const t = (key: keyof typeof TEXTS) => TEXTS[key][lang];

  // ==========================================================================
  // TELA 1 - MODE SELECT
  // ==========================================================================

  const [hoveredMode, setHoveredMode] = useState<"classic" | "video" | null>(null);

  const renderModeSelect = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        gap: "clamp(16px, 3vw, 32px)",
        padding: "clamp(16px, 3vw, 32px)",
      }}
    >
      {/* Titulo */}
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 900,
            fontSize: "clamp(24px, 4.5vw, 48px)",
            textTransform: "uppercase",
            letterSpacing: "4px",
            color: "#C9A84C",
            textShadow: "0 0 25px rgba(212,168,67,0.08), 0 2px 10px rgba(0,0,0,1)",
            margin: 0,
          }}
        >
          {t("slotMachine")}
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: "clamp(10px, 1.3vw, 16px)",
            color: "#A8A8A8",
            fontStyle: "italic",
            marginTop: "clamp(4px, 0.5vw, 8px)",
          }}
        >
          {t("chooseMode")}
        </p>
      </div>

      {/* Mode Cards */}
      <div
        style={{
          display: "flex",
          gap: "clamp(16px, 3vw, 32px)",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* Classic Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0, 0, 0.2, 1] }}
          whileHover={{ y: -6, scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleModeSelect("classic")}
          onMouseEnter={() => setHoveredMode("classic")}
          onMouseLeave={() => setHoveredMode(null)}
          title={t("playClassicTooltip")}
          style={{
            width: "clamp(180px, 28vw, 280px)",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            borderRadius: 4,
          }}
        >
          <motion.img
            src="/assets/games/slots/mode-classic.png"
            alt="Classic Slot"
            animate={{ scale: hoveredMode === "classic" ? 1.08 : 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
            }}
          />

          <AnimatePresence>
            {hoveredMode === "classic" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(ellipse at 50% 30%, rgba(212,168,67,0.06) 0%, rgba(0,0,0,0.96) 40%, rgba(0,0,0,0.98) 100%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "clamp(16px, 3vw, 28px)",
                  zIndex: 4,
                  gap: "clamp(8px, 1.2vw, 14px)",
                }}
              >
                <motion.span
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 900,
                    fontSize: "clamp(20px, 3.2vw, 32px)",
                    color: "#FFD700",
                    textTransform: "uppercase",
                    letterSpacing: 5,
                    textShadow: "0 0 20px rgba(255,215,0,0.7), 0 0 50px rgba(255,215,0,0.3), 0 2px 8px rgba(0,0,0,0.9)",
                    textAlign: "center",
                  }}
                >
                  {t("classic")}
                </motion.span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
                  style={{
                    width: "clamp(40px, 8vw, 70px)",
                    height: 1,
                    background: "linear-gradient(90deg, transparent, #F6E27A, #C9A84C, #F6E27A, transparent)",
                  }}
                />
                <motion.p
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "clamp(10px, 1.2vw, 13px)",
                    color: "#F6E27A",
                    lineHeight: 1.7,
                    textAlign: "center",
                    maxWidth: "85%",
                    letterSpacing: 0.4,
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  {lang === "br"
                    ? "3 rolos classicos com paylines tradicionais e simbolos iconicos de Las Vegas. Rapido, nostalgico."
                    : "3 classic reels with traditional paylines and iconic Las Vegas symbols. Fast, nostalgic."}
                </motion.p>
                <motion.div
                  initial={{ y: 6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                  style={{
                    display: "flex",
                    gap: "clamp(4px, 0.6vw, 8px)",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    marginTop: "clamp(2px, 0.3vw, 4px)",
                  }}
                >
                  {["3 Reels", "Paylines", lang === "br" ? "Rapido" : "Fast"].map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "clamp(7px, 0.9vw, 10px)",
                        color: "#C9A84C",
                        border: "1px solid rgba(212,168,67,0.08)",
                        borderRadius: 4,
                        padding: "clamp(2px, 0.3vw, 3px) clamp(6px, 0.8vw, 10px)",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Video Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0, 0, 0.2, 1] }}
          whileHover={{ y: -6, scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleModeSelect("video")}
          onMouseEnter={() => setHoveredMode("video")}
          onMouseLeave={() => setHoveredMode(null)}
          title={t("playVideoTooltip")}
          style={{
            width: "clamp(180px, 28vw, 280px)",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            borderRadius: 4,
          }}
        >
          <motion.img
            src="/assets/games/slots/mode-video.png"
            alt="Video Slot"
            animate={{ scale: hoveredMode === "video" ? 1.08 : 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
            }}
          />

          <AnimatePresence>
            {hoveredMode === "video" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(ellipse at 50% 30%, rgba(212,168,67,0.06) 0%, rgba(0,0,0,0.96) 40%, rgba(0,0,0,0.98) 100%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "clamp(16px, 3vw, 28px)",
                  zIndex: 4,
                  gap: "clamp(8px, 1.2vw, 14px)",
                }}
              >
                <motion.span
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 900,
                    fontSize: "clamp(20px, 3.2vw, 32px)",
                    color: "#FFD700",
                    textTransform: "uppercase",
                    letterSpacing: 5,
                    textShadow: "0 0 20px rgba(255,215,0,0.7), 0 0 50px rgba(255,215,0,0.3), 0 2px 8px rgba(0,0,0,0.9)",
                    textAlign: "center",
                  }}
                >
                  {t("video")}
                </motion.span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
                  style={{
                    width: "clamp(40px, 8vw, 70px)",
                    height: 1,
                    background: "linear-gradient(90deg, transparent, #F6E27A, #C9A84C, #F6E27A, transparent)",
                  }}
                />
                <motion.p
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "clamp(10px, 1.2vw, 13px)",
                    color: "#F6E27A",
                    lineHeight: 1.7,
                    textAlign: "center",
                    maxWidth: "85%",
                    letterSpacing: 0.4,
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  {lang === "br"
                    ? "Grid 8x4 com Scatter Pays e Tumble Cascade. Multiplicadores acumulados, Free Spins e Buy Bonus."
                    : "8x4 grid with Scatter Pays and Tumble Cascade. Running multipliers, Free Spins and Buy Bonus."}
                </motion.p>
                <motion.div
                  initial={{ y: 6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                  style={{
                    display: "flex",
                    gap: "clamp(4px, 0.6vw, 8px)",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    marginTop: "clamp(2px, 0.3vw, 4px)",
                  }}
                >
                  {["8x4 Grid", "Tumble", "Free Spins", "Buy Bonus"].map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "clamp(7px, 0.9vw, 10px)",
                        color: "#C9A84C",
                        border: "1px solid rgba(212,168,67,0.08)",
                        borderRadius: 4,
                        padding: "clamp(2px, 0.3vw, 3px) clamp(6px, 0.8vw, 10px)",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
  // ==========================================================================
  // TELA 2/3 — VIDEO SLOT (IDLE / SPINNING)
  // ==========================================================================
  
  const renderVideoSlot = () => {
    const isFS = screen === "fsPlaying";
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Area central - video slot com frame premium */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0, padding: "clamp(2px, 0.4vw, 6px)" }}>

        {/* CONTAINER PRINCIPAL DO VIDEO SLOT */}
        <div
          style={{
            position: "relative",
            width: "clamp(380px, 72vw, 680px)",
            maxWidth: "96%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Badge "VIDEO SLOT" refinado - acima do frame */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: "clamp(6px, 0.8vw, 10px)",
              padding: "clamp(4px, 0.5vw, 8px) clamp(16px, 2.5vw, 32px)",
              background: "linear-gradient(180deg, rgba(20,20,20,0.95) 0%, rgba(10,10,10,0.98) 100%)",
              border: "1px solid rgba(212,168,67,0.3)",
              borderRadius: 6,
              boxShadow: "0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,168,67,0.1)",
            }}
          >
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: "clamp(10px, 1.4vw, 16px)",
                color: "#FFD700",
                textShadow: "0 0 8px rgba(255,215,0,0.4)",
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              VIDEO SLOT
            </span>
          </motion.div>

          {/* Frame principal com imagem premium */}
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "1.45 / 1",
            }}
          >
            {/* Frame image - moldura premium */}
            <img
              src="/images/slots/video/video-frame.png"
              alt="Video Slot Frame"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "fill",
                zIndex: 2,
                pointerEvents: "none",
                filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.6))",
              }}
            />

            {/* Area do Grid - dentro do frame */}
            <div
              style={{
                position: "absolute",
                top: "6%",
                left: "4%",
                right: "4%",
                bottom: "6%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
                background: "linear-gradient(180deg, #080808 0%, #0A0A0A 50%, #080808 100%)",
                borderRadius: 8,
              }}
            >
              {/* Grid container interno */}
              <div
                style={{
                  position: "relative",
                  width: "96%",
                  height: "94%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
            {/* Tumble Badge */}
            <AnimatePresence>
              {tumbleCount > 0 && (
                <motion.div
                  key={tumbleCount}
                  initial={{ scale: 1.4, opacity: 0, y: -8 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  title={t("tumbleTooltip")}
                  style={{
                    position: "absolute",
                    top: "clamp(6px, 0.8vw, 10px)",
                    right: "clamp(6px, 0.8vw, 10px)",
                    background: "linear-gradient(135deg, rgba(15,12,5,0.88) 0%, rgba(8,15,10,0.85) 100%)",
                    border: "1px solid rgba(212,168,67,0.15)",
                    borderRadius: "8px",
                    padding: "clamp(3px, 0.4vw, 6px) clamp(8px, 1vw, 14px)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: "clamp(10px, 1.2vw, 14px)",
                    color: "#C9A84C",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    zIndex: 10,
                    boxShadow: "0 0 12px rgba(212,168,67,0.12), inset 0 0 8px rgba(212,168,67,0.08)",
                    textShadow: "0 0 6px rgba(212,168,67,0.15)",
                  }}
                >
                  {t("tumble")} x{tumbleCount}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Grid 8x4 */}
            {(() => {
              const scatterCount = grid.reduce((acc, row) => acc + row.filter(s => s.id === "scatter").length, 0);
              const scatterScale = scatterCount >= 4 ? 1.5 : scatterCount === 3 ? 1.4 : scatterCount === 2 ? 1.3 : 1.2;
              const scatterGlow = scatterCount >= 4
                ? "0 0 20px rgba(100,180,255,0.6), 0 0 40px rgba(100,180,255,0.3), inset 0 0 10px rgba(100,180,255,0.15)"
                : scatterCount === 3
                ? "0 0 14px rgba(100,180,255,0.4), 0 0 28px rgba(100,180,255,0.2)"
                : scatterCount === 2
                ? "0 0 10px rgba(100,180,255,0.25), 0 0 18px rgba(100,180,255,0.1)"
                : "0 0 8px rgba(100,180,255,0.1)";
              return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
                gap: "clamp(2px, 0.3vw, 4px)",
                width: "100%",
                aspectRatio: `${GRID_COLS} / ${GRID_ROWS}`,
              }}
            >
              <AnimatePresence mode="popLayout">
                {grid.map((row, rowIndex) =>
                  row.map((symbol, colIndex) => {
                    const posKey = `${rowIndex}-${colIndex}`;
                    const isWinning = winningPositions.has(posKey);
                    const isDimmed = showWinHighlight && !isWinning;
                    const isScatter = symbol.id === "scatter";
                    const isOrb = symbol.id === "multiplier_orb";
                    const orbValue = isOrb ? (symbol.multiplierValue || 0) : 0;
                    
                    return (
                      <motion.div
                        key={symbol.uniqueKey}
                        layout
                        initial={{ opacity: 0, y: -80, scale: 0.8 }}
                        animate={{
                          opacity: isDimmed ? 0.3 : 1,
                          y: 0,
                          scale: isScatter ? scatterScale : isOrb ? 1.1 : (isWinning ? 1.05 : 1),
                          filter: isDimmed ? "grayscale(0.5)" : "grayscale(0)",
                        }}
                        exit={{ opacity: 0, scale: 0.3, filter: "blur(4px)", transition: { duration: 0.25, ease: "easeIn" } }}
                        transition={{
                          type: "spring",
                          stiffness: isScatter ? 200 : 260,
                          damping: isScatter ? 12 : 20,
                          mass: 0.8,
                          delay: isSpinning ? colIndex * 0.22 : rowIndex * 0.06,
                        }}
                        style={{
                          aspectRatio: "1",
                          borderRadius: "8px",
                          position: "relative",
                          background: isOrb
                            ? "radial-gradient(circle, rgba(255,215,0,0.12) 0%, rgba(255,180,0,0.04) 50%, transparent 70%)"
                            : isScatter
                            ? "radial-gradient(circle, rgba(100,180,255,0.06) 0%, transparent 70%)"
                            : isWinning
                            ? `radial-gradient(circle, ${symbol.color}15 0%, transparent 70%)`
                            : "rgba(255,255,255,0.03)",
                          border: isOrb
                            ? "1.5px solid rgba(255,215,0,0.7)"
                            : isScatter
                            ? `1.5px solid rgba(100,180,255,${scatterCount >= 3 ? 0.6 : 0.25})`
                            : isWinning
                            ? `1.5px solid ${symbol.color}`
                            : isDimmed
                            ? "1px solid rgba(255,255,255,0.02)"
                            : "1px solid rgba(255,255,255,0.05)",
                          animation: isOrb
                            ? "slot-orb-glow 1.8s infinite ease-in-out"
                            : isWinning
                            ? "slot-cluster-pulse 1.4s infinite ease-in-out"
                            : "none",
                          ["--cluster-color" as string]: isWinning ? `${symbol.color}60` : undefined,
                          boxShadow: isScatter
                            ? scatterGlow
                            : "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={symbol.path}
                          alt={symbol.id}
                          style={{
                            width: isOrb ? "70%" : "80%",
                            height: isOrb ? "70%" : "80%",
                            objectFit: "contain",
                            filter: isOrb ? "drop-shadow(0 0 6px rgba(255,215,0,0.6))" : isWinning ? `drop-shadow(0 0 4px ${symbol.color})` : "none",
                          }}
                        />
                        {/* E1: Badge do multiplicador no orb */}
                        {isOrb && orbValue > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: "2px",
                              right: "2px",
                              background: "linear-gradient(135deg, #FFD700, #FF8C00)",
                              borderRadius: 4,
                              padding: "1px 4px",
                              fontSize: "clamp(8px, 0.9vw, 11px)",
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 700,
                              color: "#000",
                              lineHeight: 1.2,
                              boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
                              zIndex: 2,
                            }}
                          >
                            x{orbValue}
                          </div>
                        )}
                        {/* E3: Shimmer overlay nos clusters vencedores */}
                        {isWinning && (
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              overflow: "hidden",
                              borderRadius: "8px",
                              pointerEvents: "none",
                              zIndex: 1,
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                left: "-100%",
                                width: "50%",
                                height: "100%",
                                background: "linear-gradient(100deg, transparent 20%, rgba(255,255,255,0.25) 50%, transparent 80%)",
                                animation: "slot-shimmer-sweep 2s infinite linear",
                              }}
                            />
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
              );
            })()}

            {/* Video Win/Lose feedback — estilo arcade stamp */}
            <AnimatePresence>
              {videoFeedback && (
                <motion.div
                  key={videoFeedback + Date.now()}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: [0, 1, 1, 1, 0], y: [40, 0, 0, 0, -20] }}
                  transition={{ duration: 2.0, times: [0, 0.12, 0.3, 0.7, 1] }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "clamp(2px, 0.5vw, 6px)",
                    zIndex: 20,
                    pointerEvents: "none",
                    background: videoFeedback === "win"
                      ? "radial-gradient(ellipse at center, rgba(212,168,67,0.18) 0%, rgba(212,168,67,0.04) 40%, transparent 70%)"
                      : "radial-gradient(ellipse at center, rgba(255,68,68,0.1) 0%, transparent 60%)",
                  }}
                >
                  {videoFeedback === "win" ? (
                    <>
                      {lastSpinResult && lastSpinResult.totalMultiplier > 1 && (
                        <span
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 800,
                            fontSize: "clamp(18px, 4vw, 32px)",
                            color: "#FFD700",
                            textShadow: "0 0 20px rgba(255,215,0,0.5), 0 0 40px rgba(255,215,0,0.2), 0 2px 8px rgba(0,0,0,0.8)",
                            letterSpacing: 2,
                          }}
                        >
                          x{lastSpinResult.totalMultiplier}
                        </span>
                      )}
                      <span
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 900,
                          fontSize: "clamp(26px, 5.5vw, 48px)",
                          color: "#C9A84C",
                          textShadow: "0 0 24px rgba(212,168,67,0.4), 0 0 48px rgba(212,168,67,0.15), 0 4px 12px rgba(0,0,0,0.9)",
                          letterSpacing: 1,
                        }}
                      >
                        +{currentWin > 0 ? currentWin.toLocaleString(lang === "br" ? "pt-BR" : "en-US") : "0"} {cc.symbol}
                      </span>
                    </>
                  ) : (
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 700,
                        fontSize: "clamp(22px, 4.5vw, 38px)",
                        color: "#FF4444",
                        textShadow: "0 0 16px rgba(255,68,68,0.4), 0 0 32px rgba(255,68,68,0.15), 0 4px 12px rgba(0,0,0,0.9)",
                        letterSpacing: 2,
                        textTransform: "uppercase",
                      }}
                    >
                      {lang === "br" ? "SEM SORTE" : "NO LUCK"}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Painel LED premium — CREDITO / APOSTA / GANHO / JACKPOT */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "clamp(4px, 0.5vw, 8px)",
              padding: "clamp(4px, 0.5vw, 6px)",
              marginTop: "clamp(8px, 1vw, 14px)",
              background: "linear-gradient(180deg, rgba(20,20,20,0.95) 0%, rgba(10,10,10,0.98) 100%)",
              border: "1px solid rgba(212,168,67,0.25)",
              borderRadius: 10,
              boxShadow: "0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(212,168,67,0.1)",
              width: "100%",
            }}
          >
            {[
              { label: lang === "br" ? "CRÉDITO" : "CREDIT", value: saldo.toLocaleString(lang === "br" ? "pt-BR" : "en-US"), color: "#C9A84C" },
              { label: lang === "br" ? "APOSTA" : "BET", value: String(anteBet ? Math.floor(bet * 1.25) : bet), color: "#C9A84C" },
              { label: lang === "br" ? "GANHO" : "WIN", value: currentWin > 0 ? currentWin.toLocaleString(lang === "br" ? "pt-BR" : "en-US") : "--", color: currentWin > 0 ? "#FFD700" : "#444" },
              { label: "JACKPOT", value: jackpotPool.toLocaleString(lang === "br" ? "pt-BR" : "en-US"), color: "#00C853" },
            ].map((item, i) => (
              <div key={i} style={{
                textAlign: "center",
                padding: "clamp(8px, 1vw, 12px) clamp(6px, 0.8vw, 10px)",
                background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%)",
                border: "1px solid rgba(212,168,67,0.15)",
                borderRadius: 8,
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
              }} title={item.label === "JACKPOT" ? t("jackpotTooltip") : undefined}>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "clamp(7px, 0.75vw, 9px)",
                  color: "rgba(212,168,67,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  marginBottom: "clamp(3px, 0.4vw, 5px)",
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: "clamp(14px, 1.8vw, 22px)",
                  color: item.color,
                  textShadow: item.color !== "#444"
                    ? `0 0 10px ${item.color}40`
                    : "none",
                  transition: "all 0.3s ease",
                  lineHeight: 1.1,
                  fontVariantNumeric: "tabular-nums",
                  minHeight: "clamp(16px, 2vw, 24px)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        {/* Fim do container principal */}
        </div>
        {/* Fim da area centralizada */}
        </div>
        
        {/* Controls Bar Premium - estilo Blackout Casino */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(6px, 0.7vw, 10px)",
            padding: "clamp(10px, 1.2vw, 16px) clamp(12px, 2vw, 20px)",
            background: "linear-gradient(180deg, rgba(20,20,20,0.95) 0%, rgba(10,10,10,0.98) 100%)",
            borderTop: "1px solid rgba(212,168,67,0.2)",
            flexShrink: 0,
            zIndex: 5,
            flexWrap: "wrap",
            opacity: isSpinning ? 0.5 : 1,
            pointerEvents: isSpinning ? "none" : "auto",
            transition: "opacity 0.3s ease",
          }}
        >
          {/* Info Button - estilo premium */}
          <motion.button
            onClick={() => setShowPaytable(true)}
            whileHover={{ scale: 1.08, borderColor: "rgba(212,168,67,0.4)" }}
            whileTap={{ scale: 0.95 }}
            title={t("paytable")}
            style={{
              width: "40px",
              height: "40px",
              padding: 0,
              background: "linear-gradient(180deg, rgba(212,168,67,0.08) 0%, rgba(212,168,67,0.03) 100%)",
              border: "1px solid rgba(212,168,67,0.25)",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
          >
            <img
              src={ASSETS.iconInfo}
              alt="Info"
              style={{ width: "18px", height: "18px", opacity: 0.8, filter: "brightness(1.2)" }}
            />
          </motion.button>
          
          {/* History Button - estilo premium */}
          <motion.button
            onClick={() => setShowHistory(true)}
            whileHover={{ scale: 1.08, borderColor: "rgba(212,168,67,0.4)" }}
            whileTap={{ scale: 0.95 }}
            title={t("history")}
            style={{
              width: "40px",
              height: "40px",
              padding: 0,
              background: "linear-gradient(180deg, rgba(212,168,67,0.08) 0%, rgba(212,168,67,0.03) 100%)",
              border: "1px solid rgba(212,168,67,0.25)",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
          >
            <img
              src={ASSETS.iconHistory}
              alt="History"
              style={{ width: "18px", height: "18px", opacity: 0.8, filter: "brightness(1.2)" }}
            />
          </motion.button>
          
          {/* Provably Fair Button - estilo premium */}
          <motion.button
            onClick={() => setShowProvablyFair(true)}
            whileHover={{ scale: 1.08, borderColor: "rgba(212,168,67,0.4)" }}
            whileTap={{ scale: 0.95 }}
            title={lang === "br" ? `Provably Fair (${nonce} spins)` : `Provably Fair (${nonce} spins)`}
            style={{
              width: "40px",
              height: "40px",
              padding: 0,
              background: "linear-gradient(180deg, rgba(212,168,67,0.08) 0%, rgba(212,168,67,0.03) 100%)",
              border: "1px solid rgba(212,168,67,0.25)",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              transition: "all 0.2s ease",
            }}
          >
            <img
              src={ASSETS.iconProvablyFair}
              alt="Provably Fair"
              style={{ width: "18px", height: "18px", opacity: 0.8, filter: "brightness(1.2)" }}
            />
            {nonce > 0 && (
              <span style={{
                position: "absolute",
                top: "-3px",
                right: "-3px",
                minWidth: "16px",
                height: "16px",
                borderRadius: "8px",
                background: nonce >= 50 ? "rgba(255,68,68,0.9)" : "rgba(212,168,67,0.9)",
                color: "#fff",
                fontSize: "9px",
                fontWeight: 700,
                fontFamily: "'Inter', sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 3px",
                lineHeight: 1,
                boxShadow: nonce >= 50 ? "0 0 8px rgba(255,68,68,0.5)" : "0 0 6px rgba(212,168,67,0.4)",
              }}>
                {nonce > 99 ? "99+" : nonce}
              </span>
            )}
          </motion.button>
          
          {/* Separator dourado */}
          <div style={{ width: "1px", height: "28px", background: "rgba(212,168,67,0.2)", margin: "0 2px" }} />
          
          {/* MIN Button - estilo premium */}
          <motion.button
            onClick={() => handleBetChange("min")}
            whileHover={{ scale: 1.05, borderColor: "rgba(212,168,67,0.5)" }}
            whileTap={{ scale: 0.95 }}
            disabled={isSpinning}
            style={{
              minWidth: "40px",
              minHeight: "40px",
              padding: "clamp(4px, 0.5vw, 6px) clamp(10px, 1.2vw, 14px)",
              background: "linear-gradient(180deg, rgba(212,168,67,0.1) 0%, rgba(212,168,67,0.05) 100%)",
              border: "1px solid rgba(212,168,67,0.3)",
              borderRadius: "6px",
              color: "#C9A84C",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              fontSize: "clamp(9px, 1.1vw, 12px)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            MIN
          </motion.button>
          
          {/* Botao - com imagem premium */}
          <motion.button
            onClick={() => handleBetChange("prev")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            disabled={isSpinning}
            style={{
              width: "40px",
              height: "40px",
              padding: 0,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src="/images/slots/video/button-small.png"
              alt="-"
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "contain",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
              }}
            />
            <span style={{
              position: "absolute",
              color: "#FFD700",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "18px",
              textShadow: "0 0 6px rgba(255,215,0,0.4)",
            }}>-</span>
          </motion.button>
          
          {/* Bet Display - estilo premium */}
          <div
            style={{
              padding: "clamp(6px, 0.7vw, 10px) clamp(16px, 2vw, 24px)",
              background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 100%)",
              border: "1px solid rgba(212,168,67,0.35)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "clamp(6px, 0.7vw, 10px)",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: "clamp(8px, 0.9vw, 10px)",
                color: "rgba(212,168,67,0.6)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {t("bet")}:
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: "clamp(13px, 1.5vw, 17px)",
                color: "#FFD700",
                textShadow: "0 0 8px rgba(255,215,0,0.4)",
              }}
            >
              {bet} {cc.symbol}
            </span>
          </div>
          
          {/* Botao + com imagem premium */}
          <motion.button
            onClick={() => handleBetChange("next")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            disabled={isSpinning}
            style={{
              width: "40px",
              height: "40px",
              padding: 0,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src="/images/slots/video/button-small.png"
              alt="+"
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "contain",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
              }}
            />
            <span style={{
              position: "absolute",
              color: "#FFD700",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "18px",
              textShadow: "0 0 6px rgba(255,215,0,0.4)",
            }}>+</span>
          </motion.button>
          
          {/* MAX Button - estilo premium */}
          <motion.button
            onClick={() => handleBetChange("max")}
            whileHover={{ scale: 1.05, borderColor: "rgba(212,168,67,0.5)" }}
            whileTap={{ scale: 0.95 }}
            disabled={isSpinning}
            style={{
              minWidth: "40px",
              minHeight: "40px",
              padding: "clamp(4px, 0.5vw, 6px) clamp(10px, 1.2vw, 14px)",
              background: "linear-gradient(180deg, rgba(212,168,67,0.1) 0%, rgba(212,168,67,0.05) 100%)",
              border: "1px solid rgba(212,168,67,0.3)",
              borderRadius: "6px",
              color: "#C9A84C",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              fontSize: "clamp(9px, 1.1vw, 12px)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            MAX
          </motion.button>
          
          {/* Separator dourado */}
          <div style={{ width: "1px", height: "28px", background: "rgba(212,168,67,0.2)", margin: "0 2px" }} />
          
          {/* Ante Toggle - estilo premium */}
          <motion.button
            onClick={() => setAnteBet(!anteBet)}
            whileHover={{ scale: 1.05, borderColor: anteBet ? "rgba(212,168,67,0.6)" : "rgba(212,168,67,0.4)" }}
            whileTap={{ scale: 0.95 }}
            title={t("anteTooltip")}
            style={{
              minWidth: "40px",
              minHeight: "40px",
              padding: "clamp(4px, 0.5vw, 6px) clamp(10px, 1.2vw, 14px)",
              background: anteBet 
                ? "linear-gradient(180deg, rgba(212,168,67,0.2) 0%, rgba(212,168,67,0.1) 100%)" 
                : "linear-gradient(180deg, rgba(212,168,67,0.08) 0%, rgba(212,168,67,0.03) 100%)",
              border: anteBet ? "1px solid rgba(212,168,67,0.5)" : "1px solid rgba(212,168,67,0.25)",
              borderRadius: "6px",
              color: anteBet ? "#FFD700" : "#888",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: "clamp(9px, 1.1vw, 12px)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: anteBet ? "0 0 8px rgba(212,168,67,0.2)" : "none",
            }}
          >
            {t("ante")}
          </motion.button>
          
          {/* SPIN Button Premium - grande e centralizado */}
          <motion.button
            onClick={handleSpin}
            disabled={isSpinning || bet > saldo}
            whileHover={{ scale: 1.08, boxShadow: isFS ? "0 0 30px rgba(255,215,0,0.6)" : "0 0 25px rgba(0,200,83,0.5)" }}
            whileTap={{ scale: 0.95 }}
            title={t("spinTooltip")}
            style={{
              width: "58px",
              height: "58px",
              borderRadius: "50%",
              background: isFS
                ? "linear-gradient(180deg, #FFD700 0%, #C9A84C 50%, #8B6914 100%)"
                : "linear-gradient(180deg, #00C853 0%, #00A844 50%, #007A32 100%)",
              border: isFS
                ? "3px solid rgba(255,215,0,0.7)"
                : "3px solid rgba(0,200,83,0.5)",
              color: isFS ? "#0A0A0A" : "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isSpinning || bet > saldo ? "not-allowed" : "pointer",
              boxShadow: isFS
                ? "0 0 20px rgba(255,215,0,0.5), inset 0 2px 0 rgba(255,255,255,0.3)"
                : "0 0 15px rgba(0,200,83,0.4), inset 0 2px 0 rgba(255,255,255,0.2)",
              fontFamily: "'Inter', sans-serif",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "1px",
              flexShrink: 0,
              opacity: isSpinning || bet > saldo ? 0.5 : 1,
              transition: "all 0.2s ease",
            }}
          >
            SPIN
          </motion.button>

          {/* G3: Badge saldo insuficiente */}
          {!isSpinning && bet > saldo && onDeposit && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onDeposit}
              whileHover={{ borderColor: "rgba(255,68,68,0.6)" }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                background: "linear-gradient(180deg, rgba(255,68,68,0.15) 0%, rgba(255,68,68,0.08) 100%)",
                border: "1px solid rgba(255,68,68,0.4)",
                color: "#FF6B6B",
                fontSize: "clamp(8px, 0.8vw, 10px)",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
                textShadow: "0 0 6px rgba(255,68,68,0.3)",
              }}
            >
              {lang === "br" ? "Saldo baixo" : "Low balance"}
            </motion.button>
          )}
          
          {/* Separator dourado */}
          <div style={{ width: "1px", height: "28px", background: "rgba(212,168,67,0.2)", margin: "0 2px" }} />
          
          {/* Auto Toggle - estilo premium */}
          <motion.button
            onClick={() => {
              if (autoPlay > 0) {
                setAutoPlay(0);
              } else {
                setShowAutoPlayConfig(!showAutoPlayConfig);
              }
            }}
            whileHover={{ scale: 1.05, borderColor: autoPlay > 0 ? "rgba(212,168,67,0.6)" : "rgba(212,168,67,0.4)" }}
            whileTap={{ scale: 0.95 }}
            title={autoPlay > 0
              ? (lang === "br" ? "Parar auto-play" : "Stop auto-play")
              : (lang === "br" ? "Configurar auto-play" : "Configure auto-play")}
            style={{
              minWidth: "40px",
              minHeight: "40px",
              padding: "clamp(4px, 0.5vw, 6px) clamp(10px, 1.2vw, 14px)",
              background: autoPlay > 0 
                ? "linear-gradient(180deg, rgba(212,168,67,0.2) 0%, rgba(212,168,67,0.1) 100%)" 
                : "linear-gradient(180deg, rgba(212,168,67,0.08) 0%, rgba(212,168,67,0.03) 100%)",
              border: autoPlay > 0 ? "1px solid rgba(212,168,67,0.5)" : "1px solid rgba(212,168,67,0.25)",
              borderRadius: "6px",
              color: autoPlay > 0 ? "#FFD700" : "#888",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: "clamp(9px, 1.1vw, 12px)",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.2s ease",
              boxShadow: autoPlay > 0 ? "0 0 8px rgba(212,168,67,0.2)" : "none",
            }}
          >
            {autoPlay > 0 ? (lang === "br" ? "STOP" : "STOP") : t("auto")}
            {autoPlay > 0 && (
              <span style={{
                position: "absolute", top: "-6px", right: "-6px",
                padding: "1px 5px", borderRadius: "4px",
                background: "rgba(212,168,67,0.05)",
                border: "1px solid rgba(212,168,67,0.1)",
                fontSize: "8px", color: "#C9A84C",
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
              }}>
                {autoPlay}
              </span>
            )}
          </motion.button>

          {/* H1: Auto-play config popover */}
          <AnimatePresence>
            {showAutoPlayConfig && autoPlay === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  right: 0,
                  width: "clamp(220px, 28vw, 280px)",
                  background: "rgba(12,12,16,0.97)",
                  border: "1px solid rgba(212,168,67,0.15)",
                  borderRadius: "10px",
                  padding: "clamp(10px, 1.5vw, 16px)",
                  zIndex: 50,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(10px, 1.1vw, 13px)", color: "#D4A843", fontWeight: 700, letterSpacing: "1px", marginBottom: "4px" }}>
                  {lang === "br" ? "AUTO-PLAY" : "AUTO-PLAY"}
                </div>

                {/* Spin presets */}
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {[10, 25, 50, 100].map(n => (
                    <button key={n} onClick={() => setAutoPlayConfig(c => ({ ...c, spins: n }))}
                      style={{
                        flex: 1, minWidth: "40px", padding: "5px 4px", borderRadius: "4px",
                        background: autoPlayConfig.spins === n ? "rgba(212,168,67,0.15)" : "rgba(255,255,255,0.04)",
                        border: autoPlayConfig.spins === n ? "1px solid rgba(212,168,67,0.4)" : "1px solid rgba(255,255,255,0.06)",
                        color: autoPlayConfig.spins === n ? "#D4A843" : "rgba(255,255,255,0.4)",
                        fontSize: "clamp(10px, 1.1vw, 12px)", fontWeight: 600, fontFamily: "'Inter', sans-serif",
                        cursor: "pointer", outline: "none",
                      }}
                    >{n}</button>
                  ))}
                </div>

                {/* Stop conditions */}
                {([
                  { key: "lossLimit", label: lang === "br" ? "Parar se perder" : "Stop if lose", placeholder: "0 = off" },
                  { key: "singleWinLimit", label: lang === "br" ? "Parar se ganhar" : "Stop if win", placeholder: "0 = off" },
                  { key: "balanceMin", label: lang === "br" ? "Saldo minimo" : "Min balance", placeholder: "0 = off" },
                ] as const).map(({ key, label, placeholder }) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "clamp(8px, 0.8vw, 10px)", color: "rgba(255,255,255,0.35)", fontFamily: "'Inter', sans-serif", flex: 1, minWidth: 0 }}>{label}</span>
                    <input
                      type="number"
                      min={0}
                      value={autoPlayConfig[key] || ""}
                      onChange={e => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setAutoPlayConfig(c => ({ ...c, [key]: val }));
                      }}
                      placeholder={placeholder}
                      style={{
                        width: "70px", padding: "4px 6px", borderRadius: "4px",
                        background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.6)", fontSize: "clamp(9px, 0.9vw, 11px)",
                        fontFamily: "'JetBrains Mono', monospace", outline: "none", textAlign: "right",
                      }}
                    />
                  </div>
                ))}

                {/* Stop on FS toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "clamp(8px, 0.8vw, 10px)", color: "rgba(255,255,255,0.35)", fontFamily: "'Inter', sans-serif", flex: 1 }}>
                    {lang === "br" ? "Parar no Free Spin" : "Stop on Free Spin"}
                  </span>
                  <button
                    onClick={() => setAutoPlayConfig(c => ({ ...c, stopOnFS: !c.stopOnFS }))}
                    style={{
                      width: "36px", height: "20px", borderRadius: "10px",
                      background: autoPlayConfig.stopOnFS ? "rgba(0,230,118,0.3)" : "rgba(255,255,255,0.08)",
                      border: "none", cursor: "pointer", position: "relative", outline: "none",
                      transition: "background 0.2s",
                    }}
                  >
                    <div style={{
                      width: "14px", height: "14px", borderRadius: "50%",
                      background: autoPlayConfig.stopOnFS ? "#00E676" : "rgba(255,255,255,0.3)",
                      position: "absolute", top: "3px",
                      left: autoPlayConfig.stopOnFS ? "19px" : "3px",
                      transition: "all 0.2s",
                    }} />
                  </button>
                </div>

                {/* Start button */}
                <motion.button
                  onClick={() => {
                    autoPlayStartBalance.current = saldo;
                    setAutoPlay(autoPlayConfig.spins);
                    setShowAutoPlayConfig(false);
                  }}
                  whileHover={{ borderColor: "rgba(0,230,118,0.5)", background: "rgba(0,230,118,0.1)" }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: "8px", borderRadius: "6px",
                    background: "rgba(0,230,118,0.06)",
                    border: "1px solid rgba(0,230,118,0.25)",
                    color: "#00E676", fontFamily: "'Cinzel', serif",
                    fontWeight: 700, fontSize: "clamp(10px, 1.1vw, 12px)",
                    letterSpacing: "1px", cursor: "pointer", outline: "none",
                  }}
                >
                  {lang === "br" ? `INICIAR (${autoPlayConfig.spins})` : `START (${autoPlayConfig.spins})`}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Turbo Toggle — H2: com badge pulsante */}
          <motion.button
            onClick={() => setTurboMode(!turboMode)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={turboMode
              ? (lang === "br" ? "Turbo ativo — clique para desativar" : "Turbo active — click to disable")
              : (lang === "br" ? "Ativar modo turbo" : "Enable turbo mode")}
            style={{
              minWidth: "44px",
              minHeight: "44px",
              padding: "clamp(4px, 0.5vw, 6px) clamp(6px, 0.8vw, 10px)",
              background: turboMode ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.05)",
              border: turboMode ? "1px solid rgba(255,215,0,0.3)" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              color: turboMode ? "#FFD700" : "#A8A8A8",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              fontSize: "clamp(9px, 1.1vw, 12px)",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.2s ease",
              boxShadow: turboMode ? "0 0 8px rgba(255,215,0,0.15)" : "none",
            }}
          >
            {t("turbo")}
            {turboMode && (
              <span style={{
                position: "absolute", top: "-4px", right: "-4px",
                padding: "2px 5px", borderRadius: "4px",
                background: "linear-gradient(180deg, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0.15) 100%)",
                border: "1px solid rgba(255,215,0,0.5)",
                fontSize: "7px", fontWeight: 800, color: "#FFD700",
                fontFamily: "'Inter', sans-serif", letterSpacing: "0.5px",
                animation: "slotsTurboPulse 1.5s ease-in-out infinite",
                boxShadow: "0 0 6px rgba(255,215,0,0.3)",
              }}>
                ON
              </span>
            )}
          </motion.button>
          
          {/* BONUS Button - destaque premium dourado */}
          <motion.button
            onClick={() => setShowBuyBonus(true)}
            whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(212,168,67,0.4)" }}
            whileTap={{ scale: 0.95 }}
            title={t("buyFreeSpins")}
            style={{
              minWidth: "40px",
              minHeight: "40px",
              padding: "clamp(6px, 0.7vw, 10px) clamp(14px, 1.8vw, 20px)",
              background: "linear-gradient(180deg, rgba(212,168,67,0.25) 0%, rgba(139,105,20,0.35) 100%)",
              border: "1px solid rgba(212,168,67,0.5)",
              borderRadius: "6px",
              color: "#FFD700",
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: "clamp(10px, 1.2vw, 13px)",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 0 10px rgba(212,168,67,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
              textShadow: "0 0 6px rgba(255,215,0,0.4)",
            }}
          >
            {t("bonus")}
          </motion.button>
        </div>
      </motion.div>
    );
  };

  // ==========================================================================
  // TELA 4 — FREE SPINS TRIGGER
  // ==========================================================================
  
  const renderFSTrigger = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.8)",
        
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(12px, 2vw, 24px)",
      }}
    >
      {/* Titulo FREE SPINS! */}
      <motion.h2
        initial={{ scale: 0, rotate: -10, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
        style={{
          fontFamily: "'Cinzel', serif",
          fontWeight: 900,
          fontSize: "clamp(24px, 5vw, 48px)",
          color: "#FFD700",
          textTransform: "uppercase",
          letterSpacing: "4px",
          textShadow: "0 0 25px rgba(255,215,0,0.6), 0 0 60px rgba(255,215,0,0.3)",
          margin: 0,
        }}
      >
        {t("freeSpins")}
      </motion.h2>
      
      {/* Contagem de rodadas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          fontSize: "clamp(16px, 3vw, 28px)",
          color: "#FFFFFF",
        }}
      >
        {freeSpinsTotal} {t("rounds")}
      </motion.div>
      
      {/* Botao Comecar */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        onClick={handleFSStart}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          marginTop: "clamp(8px, 1.5vw, 16px)",
          padding: "clamp(12px, 1.5vw, 18px) clamp(32px, 4vw, 56px)",
          background: "linear-gradient(180deg, #00C853 0%, #004D25 100%)",
          border: "2px solid rgba(212,168,67,0.06)",
          borderRadius: "12px",
          color: "#FFFFFF",
          fontFamily: "'Cinzel', serif",
          fontWeight: 700,
          fontSize: "clamp(12px, 1.6vw, 18px)",
          textTransform: "uppercase",
          letterSpacing: "3px",
          cursor: "pointer",
          minHeight: "44px",
          boxShadow: "0 0 20px rgba(212,168,67,0.1)",
        }}
      >
        {t("start")}
      </motion.button>
    </motion.div>
  );

  // ==========================================================================
  // TELA 5 — FREE SPINS PLAYING (com HUD)
  // ==========================================================================
  
  const renderFSPlaying = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Tint dourado sutil */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(212,168,67,0.03)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      
      {/* HUD Free Spins — com botao voltar (pede confirmacao) */}
      <div
        style={{
          display: "flex",
          gap: "clamp(8px, 1.2vw, 16px)",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(8px, 1vw, 14px) clamp(12px, 2vw, 24px)",
          background: "linear-gradient(180deg, rgba(212,168,67,0.05), rgba(212,168,67,0.06))",
          borderBottom: "2px solid rgba(255,215,0,0.3)",
          flexShrink: 0,
          zIndex: 5,
          flexWrap: "wrap",
        }}
      >
        {/* Botao Voltar com confirmacao */}
        <motion.button
          onClick={() => {
            if (fsExitConfirm) {
              setScreen("videoIdle");
              setFreeSpinsRemaining(0);
              setFsMultiplier(1);
              setFsTotalWin(0);
              setCurrentWin(0);
              setIsSpinning(false);
              setFsExitConfirm(false);
            } else {
              setFsExitConfirm(true);
              setTimeout(() => setFsExitConfirm(false), 3000);
            }
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={lang === "br" ? "Voltar (perde free spins restantes)" : "Back (lose remaining free spins)"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(3px, 0.4vw, 6px)",
            background: fsExitConfirm ? "rgba(255,68,68,0.15)" : "rgba(0,0,0,0.5)",
            border: fsExitConfirm ? "1px solid rgba(255,68,68,0.5)" : "1px solid rgba(255,215,0,0.3)",
            borderRadius: 8,
            padding: "clamp(4px, 0.5vw, 7px) clamp(6px, 0.8vw, 12px)",
            color: fsExitConfirm ? "#FF4444" : "#C9A84C",
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(8px, 1vw, 11px)",
            cursor: "pointer",
            minHeight: 36,
            letterSpacing: "1px",
            textTransform: "uppercase",
            transition: "all 0.3s ease",
          }}
        >
          <span style={{ fontSize: "clamp(10px, 1.1vw, 14px)" }}>←</span>
          {fsExitConfirm
            ? (lang === "br" ? "CONFIRMAR?" : "CONFIRM?")
            : (lang === "br" ? "SAIR" : "EXIT")}
        </motion.button>

        {/* Badge FREE SPINS */}
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 900,
            fontSize: "clamp(11px, 1.4vw, 16px)",
            color: "#FFD700",
            textTransform: "uppercase",
            letterSpacing: "3px",
            textShadow: "0 0 12px rgba(255,215,0,0.5), 0 2px 4px rgba(0,0,0,0.8)",
            padding: "clamp(3px, 0.4vw, 6px) clamp(8px, 1vw, 14px)",
            background: "rgba(255,215,0,0.08)",
            border: "1px solid rgba(255,215,0,0.3)",
            borderRadius: "8px",
          }}
        >
          FREE SPINS
        </motion.div>

        {/* FS Counter */}
        <motion.div
          key={freeSpinsRemaining}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: "clamp(13px, 1.6vw, 19px)",
            color: "#C9A84C",
            textShadow: "0 0 10px rgba(212,168,67,0.08)",
          }}
        >
          {freeSpinsRemaining}/{freeSpinsTotal}
        </motion.div>
        
        {/* Separador */}
        <div style={{ width: 1, height: "clamp(16px, 2vw, 24px)", background: "rgba(255,215,0,0.25)" }} />

        {/* Multiplicador */}
        <motion.div
          key={fsMultiplier}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(3px, 0.4vw, 6px)",
          }}
        >
          <img
            src="/assets/games/slots/symbols/multiplier_orb.png"
            alt="Multiplier"
            style={{
              width: "clamp(20px, 2.5vw, 30px)",
              height: "clamp(20px, 2.5vw, 30px)",
            }}
          />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 900,
              fontSize: "clamp(14px, 1.8vw, 22px)",
              color: "#FFD700",
              textShadow: "0 0 12px rgba(255,215,0,0.6)",
            }}
          >
            x{fsMultiplier}
          </span>
        </motion.div>

        {/* Separador */}
        <div style={{ width: 1, height: "clamp(16px, 2vw, 24px)", background: "rgba(255,215,0,0.25)" }} />
        
        {/* Total Win */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: "clamp(11px, 1.4vw, 16px)",
            color: "#C9A84C",
            textShadow: "0 0 8px rgba(212,168,67,0.06)",
          }}
        >
          {t("win")}: {fsTotalWin.toLocaleString(lang === "br" ? "pt-BR" : "en-US")} {cc.symbol}
        </div>

        {/* Separador */}
        <div style={{ width: 1, height: "clamp(16px, 2vw, 24px)", background: "rgba(255,215,0,0.25)" }} />

        {/* Saldo */}
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(3px, 0.4vw, 5px)" }}>
          <img src={cc.icon} alt={cc.name} style={{ width: "clamp(12px, 1.3vw, 16px)", height: "clamp(12px, 1.3vw, 16px)" }} />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "clamp(11px, 1.4vw, 16px)",
              color: "#C9A84C",
              textShadow: "0 0 6px rgba(212,168,67,0.1)",
            }}
          >
            {saldo.toLocaleString(lang === "br" ? "pt-BR" : "en-US")}
          </span>
        </div>
      </div>
      
      {/* Grid Area (frame dourado mais forte para FS) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(4px, 0.6vw, 10px)",
          minHeight: 0,
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        {/* Frame Dourado FS */}
        <motion.div
          animate={{
            boxShadow: [
              "0 0 40px rgba(255,215,0,0.12), 0 8px 32px rgba(0,0,0,0.5), inset 0 0 60px rgba(0,0,0,0.3)",
              "0 0 50px rgba(255,215,0,0.2), 0 8px 32px rgba(0,0,0,0.5), inset 0 0 60px rgba(0,0,0,0.3)",
              "0 0 40px rgba(255,215,0,0.12), 0 8px 32px rgba(0,0,0,0.5), inset 0 0 60px rgba(0,0,0,0.3)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "relative",
            padding: "clamp(4px, 0.6vw, 10px)",
            border: "2px solid #FFD700",
            outline: "3px solid rgba(255,215,0,0.25)",
            outlineOffset: "4px",
            borderRadius: "18px",
            background: "linear-gradient(180deg, #0F0F0F 0%, #0A0A0A 100%)",
            width: "clamp(280px, 65vw, 560px)",
            maxHeight: "clamp(200px, 42vh, 360px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Tumble Badge */}
          <AnimatePresence>
            {tumbleCount > 0 && (
              <motion.div
                key={tumbleCount}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                title={t("tumbleTooltip")}
                style={{
                  position: "absolute",
                  top: "clamp(4px, 0.5vw, 8px)",
                  right: "clamp(4px, 0.5vw, 8px)",
                  background: "rgba(212,168,67,0.1)",
                  border: "1px solid rgba(212,168,67,0.1)",
                  borderRadius: "6px",
                  padding: "clamp(2px, 0.3vw, 4px) clamp(6px, 0.8vw, 10px)",
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 600,
                  fontSize: "clamp(9px, 1.1vw, 13px)",
                  color: "#C9A84C",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  zIndex: 10,
                }}
              >
                {t("tumble")} x{tumbleCount}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Grid 8x4 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
              gap: "clamp(2px, 0.3vw, 4px)",
              width: "100%",
              aspectRatio: `${GRID_COLS} / ${GRID_ROWS}`,
            }}
          >
            <AnimatePresence mode="popLayout">
              {grid.map((row, rowIndex) =>
                row.map((symbol, colIndex) => {
                  const posKey = `${rowIndex}-${colIndex}`;
                  const isWinning = winningPositions.has(posKey);
                  const isDimmed = showWinHighlight && !isWinning;
                  const isScatter = symbol.id === "scatter";
                  
                  return (
                    <motion.div
                      key={symbol.uniqueKey}
                      layout
                      initial={{ opacity: 0, y: -80, scale: 0.8 }}
                      animate={{
                        opacity: isDimmed ? 0.3 : 1,
                        y: 0,
                        scale: isWinning ? 1.05 : 1,
                      }}
                      exit={{ opacity: 0, scale: 0.3, transition: { duration: 0.2 } }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                        mass: 0.8,
                        delay: isSpinning ? colIndex * 0.22 : 0,
                      }}
                      style={{
                        aspectRatio: "1",
                        borderRadius: "8px",
                        background: isScatter
                          ? "radial-gradient(circle, rgba(100,180,255,0.06) 0%, transparent 70%)"
                          : "rgba(255,255,255,0.03)",
                        border: isScatter
                          ? "1px solid rgba(100,180,255,0.25)"
                          : isWinning
                          ? `1.5px solid ${symbol.color}80`
                          : "1px solid rgba(255,255,255,0.04)",
                        boxShadow: isWinning
                          ? `0 0 15px ${symbol.color}80`
                          : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        transition: "opacity 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
                      }}
                    >
                      <img
                        src={symbol.path}
                        alt={symbol.id}
                        style={{
                          width: "80%",
                          height: "80%",
                          objectFit: "contain",
                        }}
                      />
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        
        {/* Win Display */}
        <div
          style={{
            textAlign: "center",
            padding: "clamp(4px, 0.5vw, 6px)",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: "clamp(12px, 1.6vw, 18px)",
            color: currentWin > 0 ? "#C9A84C" : "#666666",
            textShadow: currentWin > 0 ? "0 0 10px rgba(212,168,67,0.08)" : "none",
            minHeight: "clamp(20px, 2.5vw, 28px)",
            transition: "all 0.3s ease",
          }}
        >
          {t("win")}: {currentWin > 0 ? `${currentWin.toLocaleString(lang === "br" ? "pt-BR" : "en-US")} ${cc.symbol}` : `-- ${cc.symbol}`}
        </div>
      </div>
      
      {/* Footer FS — spin dourado + bet */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(12px, 2vw, 24px)",
          padding: "clamp(6px, 0.8vw, 10px) clamp(12px, 2vw, 20px)",
          background: "rgba(0,0,0,0.6)",
          borderTop: "1px solid rgba(255,215,0,0.2)",
          flexShrink: 0,
          zIndex: 5,
        }}
      >
        {/* Bet display */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(4px, 0.5vw, 8px)",
            padding: "clamp(3px, 0.4vw, 6px) clamp(8px, 1vw, 14px)",
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,215,0,0.25)",
            borderRadius: "6px",
          }}
        >
          <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: "clamp(8px, 1vw, 11px)", color: "#A8A8A8", textTransform: "uppercase", letterSpacing: "1px" }}>
            {t("bet")}:
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "clamp(12px, 1.4vw, 16px)", color: "#FFD700", textShadow: "0 0 6px rgba(255,215,0,0.4)" }}>
            {bet} {cc.symbol}
          </span>
        </div>

        {/* Spin button DOURADO (FS) */}
        <motion.button
          onClick={() => { if (!isSpinning && freeSpinsRemaining > 0) handleSpin(); }}
          disabled={isSpinning || freeSpinsRemaining <= 0}
          whileHover={!isSpinning && freeSpinsRemaining > 0 ? { scale: 1.08 } : {}}
          whileTap={!isSpinning && freeSpinsRemaining > 0 ? { scale: 0.92 } : {}}
          animate={!isSpinning && freeSpinsRemaining > 0 ? {
            boxShadow: [
              "0 0 15px rgba(255,215,0,0.3), 0 4px 12px rgba(0,0,0,0.5)",
              "0 0 25px rgba(255,215,0,0.5), 0 4px 12px rgba(0,0,0,0.5)",
              "0 0 15px rgba(255,215,0,0.3), 0 4px 12px rgba(0,0,0,0.5)",
            ],
          } : {}}
          transition={!isSpinning ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
          title={lang === "br" ? "Girar (Free Spin gratuito)" : "Spin (Free Spin)"}
          style={{
            width: "clamp(48px, 6vw, 64px)",
            height: "clamp(48px, 6vw, 64px)",
            borderRadius: "50%",
            background: freeSpinsRemaining > 0
              ? "linear-gradient(135deg, #FFD700 0%, #C9A84C 50%, #8B6914 100%)"
              : "linear-gradient(135deg, #444 0%, #333 100%)",
            border: "2px solid rgba(255,255,255,0.2)",
            cursor: freeSpinsRemaining > 0 && !isSpinning ? "pointer" : "not-allowed",
            opacity: isSpinning ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Cinzel', serif",
            fontWeight: 900,
            fontSize: "clamp(9px, 1.1vw, 12px)",
            color: "#0A0A0A",
            letterSpacing: "1px",
            textTransform: "uppercase",
            minWidth: 44,
            minHeight: 44,
          }}
        >
          {isSpinning ? "..." : t("spin")}
        </motion.button>

        {/* Win atual */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: "clamp(11px, 1.4vw, 16px)",
            color: currentWin > 0 ? "#C9A84C" : "#555",
            textShadow: currentWin > 0 ? "0 0 8px rgba(212,168,67,0.06)" : "none",
            minWidth: "clamp(60px, 8vw, 100px)",
            textAlign: "center",
          }}
        >
          {currentWin > 0 ? `+${currentWin.toLocaleString(lang === "br" ? "pt-BR" : "en-US")} ${cc.symbol}` : `-- ${cc.symbol}`}
        </div>
      </div>
    </motion.div>
  );

  // ==========================================================================
  // TELA 6 — WIN OVERLAY (4 tiers)
  // ==========================================================================
  
  const renderWinOverlay = () => {
    if (!winOverlayData) return null;
    
    const { ratio } = winOverlayData;
    
    // Determinar tier
    let tier: "big" | "mega" | "jackpot" = "big";
    let titleText = t("bigWin");
    let titleStyle: React.CSSProperties = {
      fontFamily: "'Cinzel', serif",
      fontWeight: 800,
      fontSize: "clamp(18px, 3vw, 32px)",
      color: "#FFD700",
      textTransform: "uppercase" as const,
      letterSpacing: "3px",
      textShadow: "0 0 15px rgba(255,215,0,0.5), 0 2px 6px rgba(0,0,0,1)",
    };
    let overlayStyle: React.CSSProperties = {
      position: "absolute" as const,
      inset: 0,
      zIndex: 80,
      background: "rgba(0,0,0,0.5)",
      
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      gap: "clamp(12px, 2vw, 24px)",
    };
    
    if (ratio >= 500) {
      tier = "jackpot";
      titleText = t("jackpotWin");
      titleStyle = {
        ...titleStyle,
        fontWeight: 900,
        fontSize: "clamp(26px, 5vw, 48px)",
        letterSpacing: "5px",
        textShadow: "0 0 30px rgba(255,215,0,0.8), 0 0 80px rgba(255,215,0,0.4), 0 0 120px rgba(255,215,0,0.2)",
      };
      overlayStyle = {
        ...overlayStyle,
        zIndex: 100,
        background: "rgba(0,0,0,0.85)",
        
      };
    } else if (ratio >= 50) {
      tier = "mega";
      titleText = t("megaWin");
      titleStyle = {
        ...titleStyle,
        fontWeight: 900,
        fontSize: "clamp(22px, 4vw, 40px)",
        letterSpacing: "4px",
        textShadow: "0 0 25px rgba(255,215,0,0.6), 0 0 60px rgba(255,215,0,0.3), 0 2px 8px rgba(0,0,0,1)",
      };
      overlayStyle = {
        ...overlayStyle,
        zIndex: 90,
        background: "rgba(0,0,0,0.75)",
        
      };
    }
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 1,
          x: tier === "jackpot" ? [0, -3, 3, -2, 2, -1, 1, 0] : 0,
        }}
        transition={{ 
          opacity: { duration: 0.3 },
          x: { duration: 0.5, delay: 0.3 },
        }}
        style={overlayStyle}
      >
        {/* Overlay Image */}
        <img
          src={WIN_OVERLAYS[tier]}
          alt={tier}
          style={{
            position: "absolute",
            width: "80%",
            maxWidth: "400px",
            opacity: 0.3,
            pointerEvents: "none",
          }}
        />
        
        {/* Titulo */}
        <motion.h2
          initial={{ scale: 0, rotate: -10, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
          style={titleStyle}
        >
          {titleText}
        </motion.h2>
        
        {/* Win Amount */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: "clamp(18px, 3.5vw, 36px)",
            color: "#C9A84C",
            textShadow: "0 0 15px rgba(212,168,67,0.1)",
          }}
        >
          +{countUpValue.toLocaleString(lang === "br" ? "pt-BR" : "en-US")} {cc.symbol}
        </motion.div>
        
        {/* Botao Continuar */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ratio >= 500 ? 4.5 : ratio >= 50 ? 3.5 : 2.5 }}
          onClick={handleWinContinue}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            marginTop: "clamp(8px, 1.5vw, 16px)",
            padding: "clamp(8px, 1vw, 12px) clamp(20px, 3vw, 36px)",
            background: "linear-gradient(180deg, #00C853 0%, #004D25 100%)",
            border: "1.5px solid rgba(212,168,67,0.1)",
            borderRadius: "8px",
            color: "#FFFFFF",
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(10px, 1.3vw, 14px)",
            textTransform: "uppercase",
            letterSpacing: "2px",
            cursor: "pointer",
            minHeight: "44px",
          }}
        >
          {t("continue")}
        </motion.button>
      </motion.div>
    );
  };

  // ==========================================================================
  // TELA 7 - CLASSIC SLOT (Maquina Fisica)
  // ==========================================================================

  const handleLeverPull = useCallback(() => {
    if (classicSpinning.some(s => s) || bet > saldo) return;
    setIsLeverPulled(true);
    setTimeout(() => {
      setIsLeverPulled(false);
      handleClassicSpin();
    }, 400);
  }, [classicSpinning, bet, saldo, handleClassicSpin]);

  const renderClassicSlot = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* Area central - maquina fisica com assets reais */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(4px, 0.5vw, 8px) clamp(16px, 3vw, 32px)",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* MAQUINA COM MOLDURA REAL */}
        <motion.div
          animate={classicFeedback === "win" ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
          transition={classicFeedback === "win" ? { duration: 0.4, ease: "easeInOut" } : { duration: 0.1 }}
          style={{
            position: "relative",
            width: "clamp(320px, 52vw, 520px)",
            aspectRatio: "1.05 / 1",
            maxHeight: "clamp(320px, 58vh, 520px)",
          }}
        >
          {/* Moldura da maquina - imagem real */}
          <img
            src="/images/slots/classic/machine-frame.png"
            alt="Slot Machine"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              zIndex: 2,
              pointerEvents: "none",
              filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.6))",
            }}
          />

          {/* D5 — Canvas overlay para gold particles */}
          <canvas
            ref={particleCanvasRef}
            style={{ position: "absolute", inset: 0, zIndex: 25, pointerEvents: "none" }}
          />

          {/* Container dos 3 REELS - posicionado nas janelas da moldura */}
          <div
            style={{
              position: "absolute",
              top: "17%",
              left: "12%",
              right: "12%",
              height: "52%",
              display: "flex",
              gap: "2%",
              zIndex: 1,
              padding: "1.5% 2%",
            }}
          >
            {[0, 1, 2].map((reelIndex) => (
              <div
                key={reelIndex}
                style={{
                  flex: 1,
                  height: "100%",
                  overflow: "hidden",
                  position: "relative",
                  background: "linear-gradient(180deg, #0a0806 0%, #151210 50%, #0a0806 100%)",
                  borderRadius: 4,
                }}
              >
                {/* Sombra topo (profundidade) */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "25%",
                    background: "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%)",
                    zIndex: 3,
                    pointerEvents: "none",
                  }}
                />
                {/* Sombra fundo (profundidade) */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "25%",
                    background: "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)",
                    zIndex: 3,
                    pointerEvents: "none",
                  }}
                />

                {/* Reel inner com animacao */}
                <motion.div
                  animate={
                    classicSpinning[reelIndex]
                      ? { y: [0, -270] }
                      : { y: 0 }
                  }
                  transition={
                    classicSpinning[reelIndex]
                      ? { duration: 0.35, repeat: Infinity, ease: "linear" }
                      : { type: "spring", stiffness: 280, damping: 24 }
                  }
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  {(classicSpinning[reelIndex]
                    ? [
                        ...(classicReels[reelIndex] || []),
                        ...(classicReels[reelIndex] || []),
                      ]
                    : (classicReels[reelIndex] || [])
                  ).map((symbol, symbolIndex) => {
                    const cellKey = `${reelIndex}-${symbolIndex}`;
                    const winCount = classicWinRows.get(cellKey);
                    const isWinCell = !classicSpinning[reelIndex] && !!winCount;
                    const is3of = winCount === 3;
                    return (
                      <div
                        key={`${reelIndex}-${symbolIndex}`}
                        style={{
                          width: "100%",
                          height: "33.33%",
                          minHeight: "clamp(50px, 8vh, 80px)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 4,
                          background: isWinCell ? (is3of ? "rgba(212,168,67,0.2)" : "rgba(212,168,67,0.1)") : "transparent",
                          border: isWinCell ? (is3of ? "2px solid rgba(212,168,67,0.9)" : "2px solid rgba(212,168,67,0.5)") : "2px solid transparent",
                          boxShadow: isWinCell ? (is3of ? "0 0 20px rgba(212,168,67,0.6), inset 0 0 12px rgba(212,168,67,0.2)" : "0 0 10px rgba(212,168,67,0.3)") : "none",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <img
                          src={symbol.path}
                          alt={symbol.id}
                          style={{
                            width: "70%",
                            height: "70%",
                            objectFit: "contain",
                            filter: isWinCell ? (is3of ? "drop-shadow(0 0 10px rgba(255,215,0,0.8))" : "drop-shadow(0 0 5px rgba(255,215,0,0.4))") : "none",
                            transition: "filter 0.2s ease",
                          }}
                        />
                      </div>
                    );
                  })}
                </motion.div>
              </div>
            ))}
          </div>

          {/* Vidro overlay sobre os rolos */}
          <div
            style={{
              position: "absolute",
              top: "16%",
              left: "11%",
              right: "11%",
              height: "54%",
              zIndex: 4,
              pointerEvents: "none",
              background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.02) 100%)",
              borderRadius: 8,
            }}
          />

          {/* MANIVELA REAL - posicionada a direita */}
          <motion.div
            onClick={handleLeverPull}
            whileHover={{ scale: 1.03 }}
            title={t("spinTooltip")}
            style={{
              position: "absolute",
              right: "-12%",
              top: "22%",
              width: "clamp(80px, 14vw, 130px)",
              height: "clamp(120px, 20vw, 180px)",
              cursor: classicSpinning.some(s => s) ? "not-allowed" : "pointer",
              zIndex: 10,
              opacity: classicSpinning.some(s => s) ? 0.6 : 1,
              transition: "opacity 0.3s ease",
            }}
          >
            <motion.img
              src="/images/slots/classic/lever.png"
              alt="Lever"
              animate={{ 
                rotate: isLeverPulled ? 35 : 0,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                transformOrigin: "50% 85%",
                filter: "drop-shadow(4px 4px 8px rgba(0,0,0,0.5))",
              }}
            />
          </motion.div>

          {/* Display LED na area verde da moldura */}
          <div
            style={{
              position: "absolute",
              bottom: "8%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "28%",
              height: "7%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 5,
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: "clamp(10px, 1.4vw, 16px)",
                color: currentWin > 0 ? "#FFD700" : "#00FF88",
                textShadow: currentWin > 0 
                  ? "0 0 10px rgba(255,215,0,0.8), 0 0 20px rgba(255,215,0,0.4)"
                  : "0 0 8px rgba(0,255,136,0.6)",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {currentWin > 0 
                ? `WIN ${currentWin.toLocaleString(lang === "br" ? "pt-BR" : "en-US")}`
                : `BET ${bet}`}
            </div>
          </div>

          {/* Win/Lose feedback — estilo arcade stamp */}
          <AnimatePresence>
            {classicFeedback && (
              <motion.div
                key={classicFeedback + Date.now()}
                initial={{ opacity: 0, scale: 2.5 }}
                animate={{ opacity: [0, 1, 1, 1, 0], scale: [2.5, 0.9, 1.05, 1, 1] }}
                transition={{ duration: 1.6, times: [0, 0.15, 0.25, 0.35, 1] }}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 30,
                  pointerEvents: "none",
                  background: classicFeedback === "win"
                    ? "radial-gradient(ellipse at center, rgba(255,215,0,0.15) 0%, transparent 60%)"
                    : "radial-gradient(ellipse at center, rgba(255,68,68,0.1) 0%, transparent 60%)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 900,
                    fontSize: "clamp(32px, 7vw, 60px)",
                    textTransform: "uppercase",
                    letterSpacing: "clamp(4px, 1vw, 8px)",
                    color: classicFeedback === "win" ? "#FFD700" : "#FF4444",
                    textShadow: classicFeedback === "win"
                      ? "0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(255,215,0,0.5), 0 0 100px rgba(255,215,0,0.3), 0 4px 12px rgba(0,0,0,0.9)"
                      : "0 0 30px rgba(255,68,68,0.7), 0 0 60px rgba(255,68,68,0.4), 0 0 100px rgba(255,68,68,0.2), 0 4px 12px rgba(0,0,0,0.9)",
                    WebkitTextStroke: "1px rgba(0,0,0,0.4)",
                  }}
                >
                  {classicFeedback === "win"
                    ? (lang === "br" ? "GANHOU!" : "YOU WIN!")
                    : (lang === "br" ? "SEM SORTE" : "NO LUCK")}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Controls bar - Estilo luxuoso combinando com a moldura */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(6px, 0.8vw, 12px)",
          padding: "clamp(10px, 1.2vw, 16px) clamp(16px, 2.5vw, 24px)",
          background: "linear-gradient(180deg, rgba(26,22,16,0.95) 0%, rgba(13,11,7,0.98) 100%)",
          borderTop: "2px solid rgba(201,168,76,0.3)",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(201,168,76,0.1)",
          flexShrink: 0,
          zIndex: 5,
          opacity: classicSpinning.some(s => s) ? 0.5 : 1,
          pointerEvents: classicSpinning.some(s => s) ? "none" : "auto",
          transition: "opacity 0.3s ease",
        }}
      >
        {/* Credito display */}
        <div
          style={{
            padding: "clamp(6px, 0.8vw, 10px) clamp(10px, 1.2vw, 14px)",
            background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 100%)",
            border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: 8,
            textAlign: "center",
            minWidth: "clamp(70px, 10vw, 100px)",
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(7px, 0.8vw, 9px)",
              color: "rgba(201,168,76,0.6)",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 2,
            }}
          >
            {lang === "br" ? "CREDITO" : "CREDIT"}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "clamp(11px, 1.3vw, 15px)",
              color: "#C9A84C",
              textShadow: "0 0 6px rgba(201,168,76,0.4)",
            }}
          >
            {saldo.toLocaleString(lang === "br" ? "pt-BR" : "en-US")}
          </div>
        </div>

        {/* Separador dourado */}
        <div style={{ width: 1, height: 32, background: "rgba(201,168,76,0.2)" }} />

        <motion.button
          onClick={() => handleBetChange("min")}
          whileHover={{ scale: 1.05, borderColor: "rgba(201,168,76,0.5)" }}
          whileTap={{ scale: 0.95 }}
          title={lang === "br" ? "Aposta minima" : "Minimum bet"}
          style={{
            minWidth: 40,
            minHeight: 40,
            padding: "clamp(4px, 0.5vw, 6px) clamp(8px, 1vw, 12px)",
            background: "linear-gradient(180deg, rgba(201,168,76,0.1) 0%, rgba(201,168,76,0.05) 100%)",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: 6,
            color: "#C9A84C",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            fontSize: "clamp(9px, 1.1vw, 12px)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          MIN
        </motion.button>

        <motion.button
          onClick={() => handleBetChange("prev")}
          whileHover={{ scale: 1.05, borderColor: "rgba(201,168,76,0.5)" }}
          whileTap={{ scale: 0.95 }}
          title={lang === "br" ? "Aposta anterior" : "Previous bet"}
          style={{
            minWidth: 40,
            minHeight: 40,
            padding: "clamp(4px, 0.5vw, 6px) clamp(10px, 1.2vw, 14px)",
            background: "linear-gradient(180deg, rgba(201,168,76,0.1) 0%, rgba(201,168,76,0.05) 100%)",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: 6,
            color: "#C9A84C",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: "clamp(14px, 1.6vw, 18px)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          -
        </motion.button>

        <div
          style={{
            padding: "clamp(6px, 0.8vw, 10px) clamp(14px, 1.8vw, 22px)",
            background: "linear-gradient(180deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.08) 100%)",
            border: "2px solid rgba(201,168,76,0.4)",
            borderRadius: 8,
            textAlign: "center",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(7px, 0.8vw, 9px)",
              color: "rgba(201,168,76,0.6)",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 2,
            }}
          >
            {t("bet")}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "clamp(13px, 1.6vw, 18px)",
              color: "#FFD700",
              textShadow: "0 0 8px rgba(255,215,0,0.5)",
            }}
          >
            {bet} {cc.symbol}
          </div>
        </div>

        <motion.button
          onClick={() => handleBetChange("next")}
          whileHover={{ scale: 1.05, borderColor: "rgba(201,168,76,0.5)" }}
          whileTap={{ scale: 0.95 }}
          title={lang === "br" ? "Proxima aposta" : "Next bet"}
          style={{
            minWidth: 40,
            minHeight: 40,
            padding: "clamp(4px, 0.5vw, 6px) clamp(10px, 1.2vw, 14px)",
            background: "linear-gradient(180deg, rgba(201,168,76,0.1) 0%, rgba(201,168,76,0.05) 100%)",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: 6,
            color: "#C9A84C",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: "clamp(14px, 1.6vw, 18px)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          +
        </motion.button>

        <motion.button
          onClick={() => handleBetChange("max")}
          whileHover={{ scale: 1.05, borderColor: "rgba(201,168,76,0.5)" }}
          whileTap={{ scale: 0.95 }}
          title={lang === "br" ? "Aposta maxima" : "Maximum bet"}
          style={{
            minWidth: 40,
            minHeight: 40,
            padding: "clamp(4px, 0.5vw, 6px) clamp(8px, 1vw, 12px)",
            background: "linear-gradient(180deg, rgba(201,168,76,0.1) 0%, rgba(201,168,76,0.05) 100%)",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: 6,
            color: "#C9A84C",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            fontSize: "clamp(9px, 1.1vw, 12px)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          MAX
        </motion.button>

        {/* Separador dourado */}
        <div style={{ width: 1, height: 32, background: "rgba(201,168,76,0.2)" }} />

        {/* Spin button - estilo premium */}
        <motion.button
          onClick={handleLeverPull}
          whileHover={{ scale: 1.08, boxShadow: "0 0 30px rgba(201,168,76,0.4)" }}
          whileTap={{ scale: 0.95 }}
          disabled={classicSpinning.some(s => s) || bet > saldo}
          title={t("spinTooltip")}
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: classicSpinning.some(s => s)
              ? "rgba(100,100,100,0.3)"
              : "linear-gradient(135deg, #FFD700 0%, #C9A84C 50%, #8B6914 100%)",
            border: "3px solid rgba(201,168,76,0.6)",
            boxShadow: classicSpinning.some(s => s) 
              ? "none"
              : "0 0 20px rgba(255,215,0,0.4), 0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: classicSpinning.some(s => s) ? "not-allowed" : "pointer",
            opacity: classicSpinning.some(s => s) ? 0.5 : 1,
            flexShrink: 0,
            transition: "all 0.2s ease",
          }}
        >
          <span
            style={{
              fontSize: "clamp(14px, 1.8vw, 20px)",
              color: classicSpinning.some(s => s) ? "#666" : "#1A1610",
              lineHeight: 1,
              fontWeight: 700,
              textShadow: classicSpinning.some(s => s) ? "none" : "0 1px 0 rgba(255,255,255,0.3)",
            }}
          >
            SPIN
          </span>
        </motion.button>

        {/* G3: Badge saldo insuficiente + depositar (classic) */}
        {!classicSpinning.some(s => s) && bet > saldo && onDeposit && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onDeposit}
            whileHover={{ borderColor: "rgba(255,107,107,0.5)" }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              background: "linear-gradient(180deg, rgba(255,107,107,0.15) 0%, rgba(255,107,107,0.08) 100%)",
              border: "1px solid rgba(255,107,107,0.35)",
              color: "#FF6B6B",
              fontSize: "clamp(8px, 0.8vw, 10px)",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              cursor: "pointer",
              outline: "none",
              whiteSpace: "nowrap",
              textShadow: "0 0 8px rgba(255,107,107,0.3)",
            }}
          >
            {lang === "br" ? "Saldo baixo" : "Low balance"}
          </motion.button>
        )}

        {/* Separador dourado */}
        <div style={{ width: 1, height: 32, background: "rgba(201,168,76,0.2)" }} />

        {/* Voltar ao Video */}
        <motion.button
          onClick={() => {
            setMode("video");
            setScreen("videoIdle");
          }}
          whileHover={{ scale: 1.03, borderColor: "rgba(201,168,76,0.5)" }}
          whileTap={{ scale: 0.97 }}
          title={lang === "br" ? "Trocar para modo Video" : "Switch to Video mode"}
          style={{
            minWidth: 40,
            minHeight: 40,
            padding: "clamp(6px, 0.8vw, 10px) clamp(10px, 1.2vw, 16px)",
            background: "linear-gradient(180deg, rgba(201,168,76,0.1) 0%, rgba(201,168,76,0.05) 100%)",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: 8,
            color: "#C9A84C",
            fontFamily: "'Cinzel', serif",
            fontWeight: 600,
            transition: "all 0.2s ease",
            fontSize: "clamp(9px, 1.1vw, 12px)",
            cursor: "pointer",
            letterSpacing: 1,
          }}
        >
          {t("backToVideo")}
        </motion.button>
      </div>
    </motion.div>
  );
  // ==========================================================================
  // TELA 8 — PAYTABLE MODAL (shared component)
  // ==========================================================================

  // Categorias de simbolos pra PaytableModal shared
  const paytableCategories: PaytableCategory[] = [
    {
      id: "premium",
      label: lang === "br" ? "SIMBOLOS PREMIUM" : "PREMIUM SYMBOLS",
      symbols: (["crown", "ring", "hourglass", "chalice"] as const).map(id => {
        const sym = VIDEO_SYMBOLS.find(s => s.id === id)!;
        const names = SYMBOL_NAMES[id];
        return {
          id, name: names?.[lang as "br" | "en"] ?? id, imagePath: sym.path,
          color: sym.color, payouts: sym.payouts as Record<number, number>,
        };
      }),
      payoutLabels: ["8+", "9+", "10+", "11+", "12+"],
    },
    {
      id: "gems",
      label: lang === "br" ? "SIMBOLOS GEMAS" : "GEM SYMBOLS",
      symbols: (["ruby", "sapphire", "emerald", "amethyst", "topaz"] as const).map(id => {
        const sym = VIDEO_SYMBOLS.find(s => s.id === id)!;
        const names = SYMBOL_NAMES[id];
        return {
          id, name: names?.[lang as "br" | "en"] ?? id, imagePath: sym.path,
          color: sym.color, payouts: sym.payouts as Record<number, number>,
        };
      }),
      payoutLabels: ["8+", "9+", "10+", "11+", "12+"],
    },
    {
      id: "special",
      label: lang === "br" ? "SIMBOLOS ESPECIAIS" : "SPECIAL SYMBOLS",
      symbols: [{
        id: "scatter",
        name: "Scatter",
        imagePath: VIDEO_SYMBOLS.find(s => s.id === "scatter")!.path,
        color: "#FFD700",
        payouts: VIDEO_SYMBOLS.find(s => s.id === "scatter")!.payouts as Record<number, number>,
        description: lang === "br"
          ? "4+ Scatters = 10 Free Spins + payout (4=3x, 5=5x, 6=100x aposta)"
          : "4+ Scatters = 10 Free Spins + payout (4=3x, 5=5x, 6=100x bet)",
      }],
      payoutLabels: ["4+", "5+", "6+"],
    },
  ];

  // H4: Paytable Classic — 7 simbolos com payout3 (3-of) e payout2 (2-of)
  const CLASSIC_NAMES: Record<string, Record<string, string>> = {
    seven: { br: "Sete", en: "Seven" },
    bar: { br: "Barra", en: "Bar" },
    diamond: { br: "Diamante", en: "Diamond" },
    bell: { br: "Sino", en: "Bell" },
    cherry: { br: "Cereja", en: "Cherry" },
    lemon: { br: "Limao", en: "Lemon" },
    star: { br: "Estrela", en: "Star" },
  };

  const classicPaytableCategories: PaytableCategory[] = [
    {
      id: "classic-high",
      label: lang === "br" ? "SIMBOLOS PREMIUM" : "PREMIUM SYMBOLS",
      symbols: ENGINE_CLASSIC_SYMBOLS.filter(s => ["seven", "bar", "diamond"].includes(s.id)).map(s => ({
        id: s.id,
        name: CLASSIC_NAMES[s.id]?.[lang] ?? s.id,
        imagePath: s.path,
        color: s.color,
        payouts: { 3: s.payout3, 2: s.payout2 },
      })),
      payoutLabels: ["3-of", "2-of"],
    },
    {
      id: "classic-low",
      label: lang === "br" ? "SIMBOLOS REGULARES" : "REGULAR SYMBOLS",
      symbols: ENGINE_CLASSIC_SYMBOLS.filter(s => ["bell", "cherry", "lemon", "star"].includes(s.id)).map(s => ({
        id: s.id,
        name: CLASSIC_NAMES[s.id]?.[lang] ?? s.id,
        imagePath: s.path,
        color: s.color,
        payouts: { 3: s.payout3, 2: s.payout2 },
      })),
      payoutLabels: ["3-of", "2-of"],
    },
  ];

  // H4: Selecionar paytable pelo modo atual
  const activePaytable = mode === "classic" ? classicPaytableCategories : paytableCategories;

  // PF data memoizado — mostra estado ATUAL da sessao
  // Verificacao usa lastSpinResult internamente no handlePfVerify
  const pfData: PFData = useMemo(() => ({
    serverSeedHash,
    clientSeed,
    nonce,
    serverSeed: pfRevealedSeed,
    isValid: pfIsValid,
  }), [serverSeedHash, clientSeed, nonce, pfRevealedSeed, pfIsValid]);

  // Callbacks estaveis para fechar modais (evita recriar a cada render)
  const closePaytable = useCallback(() => setShowPaytable(false), []);
  const closeHistory = useCallback(() => setShowHistory(false), []);
  const closePf = useCallback(() => setShowProvablyFair(false), []);

  // Handler: verificar PF — recalcula SHA256 e HMAC de verdade
  const handlePfVerify = useCallback(async () => {
    if (pfVerifying) return;
    setPfIsValid(null);
    setPfVerifying(true);
    try {
      if (isFiveM) {
        // FiveM: pedir ao server pra revelar seed e verificar
        const resp = await fetchNui("casino:slot:reveal-seed", {});
        if (resp.error) { setPfIsValid(false); return; }

        setPfRevealedSeed(resp.serverSeed);

        // Verificar: SHA256(seedRevelada) === hash comprometido
        const recalculatedHash = await sha256(resp.serverSeed);
        const hashMatch = recalculatedHash === resp.serverSeedHash;
        setPfIsValid(hashMatch);
        setPfVerifyDetails({ committedHash: resp.serverSeedHash, recalculatedHash, match: hashMatch });

        // Guardar no historico
        setSeedHistory(prev => [{
          serverSeed: resp.serverSeed,
          serverSeedHash: resp.serverSeedHash,
          clientSeed,
          nonce: resp.nonce,
          revealedAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        }, ...prev].slice(0, 5));
      } else {
        // Browser mock: verificacao local completa
        if (!lastSpinResult) { setPfIsValid(false); return; }

        const seedToVerify = serverSeed;
        setPfRevealedSeed(seedToVerify);

        const recalculatedHash = await sha256(seedToVerify);
        if (recalculatedHash !== serverSeedHash) {
          setPfIsValid(false);
          setPfVerifyDetails({ committedHash: serverSeedHash, recalculatedHash, match: false });
          return;
        }

        const spinPf = lastSpinResult.provablyFair;
        const { grid: verifyGrid } = await engineGenerateGrid(
          seedToVerify, spinPf.clientSeed, spinPf.nonce, false
        );

        const originalGrid = lastSpinResult.initialGrid;
        let allMatch = true;
        for (let col = 0; col < verifyGrid.length && allMatch; col++) {
          for (let row = 0; row < verifyGrid[col].length && allMatch; row++) {
            if (verifyGrid[col][row].symbol.id !== originalGrid[col][row].symbol.id) {
              allMatch = false;
            }
          }
        }
        setPfIsValid(allMatch);
        setPfVerifyDetails({ committedHash: serverSeedHash, recalculatedHash, match: allMatch });
      }
    } catch {
      setPfIsValid(false);
      setPfVerifyDetails(null);
    } finally {
      setPfVerifying(false);
    }
  }, [serverSeed, serverSeedHash, clientSeed, lastSpinResult, pfVerifying]);

  // Handler: rotacionar seed
  const handlePfRotate = useCallback(async () => {
    if (isFiveM) {
      // FiveM: server revela seed antiga e cria nova sessao
      const resp = await fetchNui("casino:slot:reveal-seed", {});
      if (resp.error) return;
      // Guardar seed revelada no historico
      setSeedHistory(prev => [{
        serverSeed: resp.serverSeed,
        serverSeedHash: resp.serverSeedHash,
        clientSeed,
        nonce: resp.nonce,
        revealedAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      }, ...prev].slice(0, 5));
      setPfRevealedSeed(resp.serverSeed);
      setServerSeedHash("nova sessao — aguardando spin...");
      setNonce(0);
      setPfIsValid(null);
      setPfVerifyDetails(null);
    } else {
      // Browser mock: revelar local + gerar nova sessao
      if (serverSeed) {
        setSeedHistory(prev => [{
          serverSeed, serverSeedHash, clientSeed, nonce,
          revealedAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        }, ...prev].slice(0, 5));
      }
      const session = await createProvablyFairSession();
      setServerSeed(session.serverSeed);
      setServerSeedHash(session.serverSeedHash);
      setClientSeed(session.clientSeed);
      setNonce(0);
      setPfRevealedSeed("");
      setPfIsValid(null);
      setPfVerifyDetails(null);
    }
  }, [serverSeed, serverSeedHash, clientSeed, nonce]);

  // Handler: jogador altera client seed — valida e reseta nonce (padrao Stake/ProofBets)
  const handleClientSeedChange = useCallback((newSeed: string) => {
    const trimmed = newSeed.replace(/\s/g, "");
    if (trimmed.length > 64) return;
    setClientSeed(trimmed);
    if (trimmed.length >= 4 && trimmed !== clientSeed) {
      setNonce(0);
      setPfIsValid(null);
      setPfVerifyDetails(null);
      setClientSeedChanged(true);
      setTimeout(() => setClientSeedChanged(false), 1200);
    }
  }, [clientSeed]);

  // ==========================================================================
  // ==========================================================================
  // TELA 9 — HISTORY (shared component — ver render section)
  // ==========================================================================

  // Colunas do historico para HistoryModal shared
  const MODE_BADGES: Record<string, { label: string; bg: string; color: string }> = {
    classic: { label: "C", bg: "rgba(100,149,237,0.2)", color: "#6495ED" },
    video:   { label: "V", bg: "rgba(212,168,67,0.2)", color: "#D4A843" },
    fs:      { label: "FS", bg: "rgba(0,230,118,0.2)", color: "#00E676" },
  };

  const historyColumns: HistoryColumn<SpinHistoryEntry>[] = [
    {
      id: "mode", label: lang === "br" ? "MODO" : "MODE", width: "14%",
      render: (row) => {
        const badge = MODE_BADGES[row.mode] || MODE_BADGES.video;
        return (
          <span style={{
            display: "inline-block",
            padding: "2px 6px",
            borderRadius: "4px",
            background: badge.bg,
            color: badge.color,
            fontSize: "clamp(8px, 0.75vw, 10px)",
            fontWeight: 700,
            fontFamily: "'Inter', sans-serif",
            letterSpacing: "0.5px",
          }}>{badge.label}</span>
        );
      },
    },
    {
      id: "time", label: lang === "br" ? "HORA" : "TIME", width: "18%",
      render: (row) => <span style={{ color: "rgba(255,255,255,0.45)" }}>{row.time}</span>,
    },
    {
      id: "bet", label: lang === "br" ? "APOSTA" : "BET", width: "20%",
      render: (row) => <span style={{ fontWeight: 700 }}>{row.bet} {cc.symbol}</span>,
    },
    {
      id: "win", label: lang === "br" ? "GANHO" : "WIN", width: "24%",
      render: (row) => <WinAmount value={row.win} prefix={cc.symbol} />,
    },
    {
      id: "multi", label: "MULTI", width: "24%", align: "right" as const,
      render: (row) => <MultiBadge multi={row.multi} />,
    },
  ];

  // G2: Filtrar historico por modo antes de passar pro HistoryModal
  const filteredHistory = historyFilter === "all"
    ? spinHistory
    : spinHistory.filter(h => h.mode === historyFilter);

  // ==========================================================================
  // TELA 10 — BUY BONUS MODAL
  // ==========================================================================
  // MODAL DE AJUDA — "?" com abas
  // ==========================================================================

  const helpTabs = [
    { br: "Como Jogar", en: "How to Play" },
    { br: "Simbolos", en: "Symbols" },
    { br: "Recursos", en: "Features" },
    { br: "Provably Fair", en: "Provably Fair" },
  ];

  const renderHelpModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.94)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(8px, 1.5vw, 16px)",
      }}
      onClick={() => setShowHelp(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        style={{
          width: "clamp(320px, 65vw, 560px)",
          maxHeight: "85vh",
          background: "linear-gradient(180deg, #1A1610 0%, #0F0D08 100%)",
          border: "1.5px solid rgba(212,168,67,0.05)",
          borderRadius: 16,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 0 40px rgba(0,0,0,0.8), 0 0 20px rgba(212,168,67,0.08)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "clamp(10px, 1.5vw, 16px) clamp(14px, 2vw, 20px)",
          borderBottom: "1px solid rgba(212,168,67,0.05)",
        }}>
          <span style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 800,
            fontSize: "clamp(14px, 2vw, 20px)",
            color: "#FFD700",
            textShadow: "0 0 10px rgba(255,215,0,0.4)",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}>
            {lang === "br" ? "Ajuda" : "Help"}
          </span>
          <motion.button
            onClick={() => setShowHelp(false)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#888", fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </motion.button>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid rgba(212,168,67,0.1)",
          padding: "0 clamp(8px, 1vw, 14px)",
          gap: 2,
          flexShrink: 0,
          overflowX: "auto",
        }}>
          {helpTabs.map((tab, i) => (
            <motion.button
              key={i}
              onClick={() => setHelpTab(i)}
              whileHover={{ scale: 1.02 }}
              style={{
                padding: "clamp(8px, 1vw, 12px) clamp(10px, 1.2vw, 16px)",
                fontFamily: "'Cinzel', serif",
                fontWeight: helpTab === i ? 700 : 500,
                fontSize: "clamp(9px, 1.1vw, 12px)",
                color: helpTab === i ? "#FFD700" : "#888",
                background: helpTab === i ? "rgba(212,168,67,0.1)" : "transparent",
                border: "none",
                borderBottom: helpTab === i ? "2px solid #C9A84C" : "2px solid transparent",
                cursor: "pointer",
                letterSpacing: 1,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              {lang === "br" ? tab.br : tab.en}
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "clamp(12px, 1.5vw, 20px)",
          fontFamily: "'Inter', sans-serif",
          fontSize: "clamp(11px, 1.2vw, 14px)",
          color: "rgba(255,255,255,0.8)",
          lineHeight: 1.8,
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={helpTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {helpTab === 0 && (
                <div>
                  <h3 style={{ color: "#C9A84C", fontFamily: "'Cinzel', serif", fontSize: "clamp(13px, 1.5vw, 17px)", marginBottom: 12, fontWeight: 700 }}>
                    {lang === "br" ? "Como Jogar" : "How to Play"}
                  </h3>
                  <p style={{ marginBottom: 12 }}>
                    {lang === "br"
                      ? "O Slot Machine possui dois modos: Video Slot (grid 8x4 com Tumble Cascade) e Classic Slot (3 rolos tradicionais com paylines)."
                      : "The Slot Machine has two modes: Video Slot (8x4 grid with Tumble Cascade) and Classic Slot (3 traditional reels with paylines)."}
                  </p>
                  <p style={{ color: "#C9A84C", fontWeight: 600, marginBottom: 6 }}>Video Slot:</p>
                  <p style={{ marginBottom: 12 }}>
                    {lang === "br"
                      ? "1. Ajuste sua aposta usando os botoes MIN, −, +, MAX. 2. Clique SPIN ou puxe a manivela. 3. Simbolos caem no grid 8x4. 4. Se 8+ simbolos iguais aparecerem em qualquer posicao, voce ganha! 5. Simbolos vencedores explodem e novos caem de cima (Tumble). 6. O processo repete ate nao haver mais vitorias. 7. Voce paga UMA vez, todos os tumbles sao gratis."
                      : "1. Adjust your bet using MIN, −, +, MAX buttons. 2. Click SPIN or pull the lever. 3. Symbols drop into the 8x4 grid. 4. If 8+ matching symbols land anywhere, you win! 5. Winning symbols explode and new ones fall from above (Tumble). 6. This repeats until no more wins occur. 7. You pay ONCE, all tumbles are free."}
                  </p>
                  <p style={{ color: "#C9A84C", fontWeight: 600, marginBottom: 6 }}>Classic Slot:</p>
                  <p>
                    {lang === "br"
                      ? "3 rolos verticais com simbolos classicos (7, BAR, cereja, diamante, sino, limao, estrela). Alinhe simbolos iguais nas paylines para ganhar. Puxe a manivela ou clique SPIN."
                      : "3 vertical reels with classic symbols (7, BAR, cherry, diamond, bell, lemon, star). Match symbols on paylines to win. Pull the lever or click SPIN."}
                  </p>
                </div>
              )}

              {helpTab === 1 && (
                <div>
                  <h3 style={{ color: "#C9A84C", fontFamily: "'Cinzel', serif", fontSize: "clamp(13px, 1.5vw, 17px)", marginBottom: 12, fontWeight: 700 }}>
                    {lang === "br" ? "Simbolos e Pagamentos" : "Symbols & Payouts"}
                  </h3>
                  <p style={{ color: "#C9A84C", fontWeight: 600, marginBottom: 8 }}>
                    {lang === "br" ? "Simbolos Premium (Video):" : "Premium Symbols (Video):"}
                  </p>
                  <p style={{ marginBottom: 12 }}>
                    {lang === "br"
                      ? "Coroa, Anel, Ampulheta, Calice — pagam mais. Precisam de 8+ para vencer."
                      : "Crown, Ring, Hourglass, Chalice — pay more. Need 8+ to win."}
                  </p>
                  <p style={{ color: "#C9A84C", fontWeight: 600, marginBottom: 8 }}>
                    {lang === "br" ? "Gemas (Video):" : "Gems (Video):"}
                  </p>
                  <p style={{ marginBottom: 12 }}>
                    {lang === "br"
                      ? "Rubi, Safira, Esmeralda, Ametista, Topazio — pagam menos, aparecem mais."
                      : "Ruby, Sapphire, Emerald, Amethyst, Topaz — pay less, appear more often."}
                  </p>
                  <p style={{ color: "#FFD700", fontWeight: 600, marginBottom: 8 }}>
                    {lang === "br" ? "Simbolos Especiais:" : "Special Symbols:"}
                  </p>
                  <p style={{ marginBottom: 8 }}>
                    {lang === "br"
                      ? "Scatter — 4+ ativam Free Spins. Multiplier Orb — aparece durante Free Spins, soma ao multiplicador total."
                      : "Scatter — 4+ trigger Free Spins. Multiplier Orb — appears during Free Spins, adds to total multiplier."}
                  </p>
                </div>
              )}

              {helpTab === 2 && (
                <div>
                  <h3 style={{ color: "#C9A84C", fontFamily: "'Cinzel', serif", fontSize: "clamp(13px, 1.5vw, 17px)", marginBottom: 12, fontWeight: 700 }}>
                    {lang === "br" ? "Recursos do Jogo" : "Game Features"}
                  </h3>
                  <p style={{ color: "#C9A84C", fontWeight: 600, marginBottom: 6 }}>Tumble Cascade:</p>
                  <p style={{ marginBottom: 12 }}>
                    {lang === "br"
                      ? "Apos cada vitoria, simbolos vencedores sao removidos e novos caem. Isso pode criar vitorias consecutivas em um unico spin. Maximo de 20 cascatas por rodada."
                      : "After each win, winning symbols are removed and new ones fall. This can create consecutive wins from a single spin. Maximum 20 cascades per round."}
                  </p>
                  <p style={{ color: "#FFD700", fontWeight: 600, marginBottom: 6 }}>Free Spins:</p>
                  <p style={{ marginBottom: 12 }}>
                    {lang === "br"
                      ? "4+ Scatters ativam rodadas gratis. Multiplicadores sao CUMULATIVOS durante Free Spins — cada orbe soma ao total. 3+ Scatters durante FS concedem +5 spins extras."
                      : "4+ Scatters trigger free rounds. Multipliers are CUMULATIVE during Free Spins — each orb adds to total. 3+ Scatters during FS grant +5 extra spins."}
                  </p>
                  <p style={{ color: "#C9A84C", fontWeight: 600, marginBottom: 6 }}>Buy Bonus:</p>
                  <p style={{ marginBottom: 12 }}>
                    {lang === "br"
                      ? "Pague 100x sua aposta para entrar diretamente em Free Spins sem esperar Scatters."
                      : "Pay 100x your bet to enter Free Spins directly without waiting for Scatters."}
                  </p>
                  <p style={{ color: "#C9A84C", fontWeight: 600, marginBottom: 6 }}>Ante Bet:</p>
                  <p style={{ marginBottom: 12 }}>
                    {lang === "br"
                      ? "Ative para aumentar sua aposta em 25% e dobrar a chance de ativar Free Spins."
                      : "Activate to increase your bet by 25% and double the chance of triggering Free Spins."}
                  </p>
                  <p style={{ color: "#C9A84C", fontWeight: 600, marginBottom: 6 }}>Jackpot:</p>
                  <p>
                    {lang === "br"
                      ? "1.5% de cada aposta contribui para o jackpot progressivo. Vitorias acima de 500x seu bet ativam o Jackpot."
                      : "1.5% of each bet contributes to the progressive jackpot. Wins above 500x your bet trigger the Jackpot."}
                  </p>
                </div>
              )}

              {helpTab === 3 && (
                <div>
                  <h3 style={{ color: "#C9A84C", fontFamily: "'Cinzel', serif", fontSize: "clamp(13px, 1.5vw, 17px)", marginBottom: 12, fontWeight: 700 }}>
                    Provably Fair
                  </h3>
                  <p style={{ marginBottom: 12 }}>
                    {lang === "br"
                      ? "Este jogo usa o sistema Provably Fair com HMAC-SHA256, o mesmo padrao do Stake.com. Cada resultado pode ser verificado matematicamente."
                      : "This game uses the Provably Fair system with HMAC-SHA256, the same standard as Stake.com. Every result can be mathematically verified."}
                  </p>
                  <p style={{ color: "#C9A84C", fontWeight: 600, marginBottom: 6 }}>
                    {lang === "br" ? "Como funciona:" : "How it works:"}
                  </p>
                  <p style={{ marginBottom: 12 }}>
                    {lang === "br"
                      ? "1. O servidor gera uma Server Seed e publica seu hash SHA-256 ANTES de voce jogar. 2. Voce define sua Client Seed (pode mudar a qualquer momento). 3. Cada spin usa: HMAC_SHA256(server_seed, client_seed:nonce). 4. Ao rotacionar a seed, a Server Seed real eh revelada. 5. Voce pode verificar: SHA256(seed_revelada) == hash_publicado."
                      : "1. The server generates a Server Seed and publishes its SHA-256 hash BEFORE you play. 2. You set your Client Seed (can change anytime). 3. Each spin uses: HMAC_SHA256(server_seed, client_seed:nonce). 4. When you rotate seeds, the real Server Seed is revealed. 5. You can verify: SHA256(revealed_seed) == published_hash."}
                  </p>
                  <p style={{ color: "#C9A84C", fontWeight: 600 }}>
                    RTP: 96.50% | {lang === "br" ? "Volatilidade: Alta" : "Volatility: High"}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderBuyBonusModal = () => {
    const cost = bet * 100;
    const canAfford = cost <= saldo;
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowBuyBonus(false)}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 90,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "linear-gradient(135deg, rgba(26,26,46,0.95), rgba(10,10,10,0.98))",
            border: "1px solid rgba(212,168,67,0.08)",
            borderRadius: "18px",
            padding: "clamp(24px, 4vw, 48px)",
            textAlign: "center",
            boxShadow: "0 0 80px rgba(212,168,67,0.05)",
            maxWidth: "clamp(280px, 50vw, 420px)",
          }}
        >
          {/* Scatter Icon */}
          <img
            src="/assets/games/slots/symbols/scatter.png"
            alt="Free Spins"
            style={{
              width: "64px",
              height: "64px",
              marginBottom: "clamp(12px, 1.5vw, 20px)",
            }}
          />
          
          {/* Title */}
          <h2
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: "clamp(16px, 2.2vw, 24px)",
              color: "#C9A84C",
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "clamp(6px, 0.8vw, 10px)",
              textShadow: "0 0 15px rgba(212,168,67,0.06)",
            }}
          >
            {t("buyFreeSpins")}
          </h2>
          
          {/* Subtitle */}
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(11px, 1.3vw, 15px)",
              color: "rgba(255,255,255,0.7)",
              marginBottom: "clamp(16px, 2vw, 24px)",
            }}
          >
            {t("guaranteedSpins")}
          </p>
          
          {/* Cost */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "clamp(18px, 2.5vw, 28px)",
              color: "#FFD700",
              textShadow: "0 0 12px rgba(255,215,0,0.4)",
              marginBottom: "clamp(6px, 0.8vw, 10px)",
            }}
          >
            {t("cost")}: {cost.toLocaleString(lang === "br" ? "pt-BR" : "en-US")} {cc.symbol}
          </div>
          
          {/* Current Balance */}
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(10px, 1.2vw, 14px)",
              color: "rgba(255,255,255,0.5)",
              marginBottom: "clamp(20px, 2.5vw, 32px)",
            }}
          >
            {t("currentBalance")}: {saldo.toLocaleString(lang === "br" ? "pt-BR" : "en-US")} {cc.symbol}
          </p>
          
          {/* Buttons */}
          <div
            style={{
              display: "flex",
              gap: "clamp(10px, 1.2vw, 16px)",
              justifyContent: "center",
            }}
          >
            {/* Cancel */}
            <motion.button
              onClick={() => setShowBuyBonus(false)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: "clamp(10px, 1.2vw, 14px) clamp(20px, 2.5vw, 32px)",
                background: "transparent",
                border: "1.5px solid rgba(212,168,67,0.06)",
                borderRadius: "10px",
                color: "#C9A84C",
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                fontSize: "clamp(11px, 1.3vw, 15px)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                cursor: "pointer",
                minHeight: "44px",
              }}
            >
              {t("cancel")}
            </motion.button>
            
            {/* Confirm */}
            <motion.button
              onClick={handleBuyBonus}
              disabled={!canAfford}
              whileHover={canAfford ? { scale: 1.05 } : {}}
              whileTap={canAfford ? { scale: 0.95 } : {}}
              style={{
                padding: "clamp(10px, 1.2vw, 14px) clamp(20px, 2.5vw, 32px)",
                background: canAfford
                  ? "linear-gradient(180deg, #00C853 0%, #004D25 100%)"
                  : "rgba(128,128,128,0.3)",
                border: canAfford
                  ? "1.5px solid rgba(212,168,67,0.1)"
                  : "1.5px solid rgba(128,128,128,0.3)",
                borderRadius: "10px",
                color: canAfford ? "#FFFFFF" : "rgba(255,255,255,0.3)",
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: "clamp(11px, 1.3vw, 15px)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                cursor: canAfford ? "pointer" : "not-allowed",
                minHeight: "44px",
              }}
            >
              {t("confirm")}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 60,
        backgroundColor: "#0A0A0A",
        backgroundImage: `url('${ASSETS.bgCasino}'), radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,168,67,0.03) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(0,0,0,0.5) 0%, transparent 70%)`,
        backgroundSize: "cover, 100% 100%, 100% 100%",
        boxShadow: "inset 0 0 150px rgba(0,0,0,0.8)",
        borderRadius: "inherit",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Keyframes — copiados do SpotlightLayout (Hero) */}
      <style>{`
        @keyframes slotsShimmerSweep {
          0% { transform: translateX(-100%) rotate(25deg); }
          100% { transform: translateX(200%) rotate(25deg); }
        }
        @keyframes slotsSpotlightBreathe {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.04; }
        }
        @keyframes slotsFloatParticle {
          0% { opacity: 0; transform: translateY(8px) scale(0.4); }
          25% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-35px) scale(0.15); }
        }
        @keyframes slotsTurboPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .slots-modal-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .slots-modal-scroll::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.3);
          border-radius: 3px;
        }
        .slots-modal-scroll::-webkit-scrollbar-thumb {
          background: rgba(212,168,67,0.1);
          border-radius: 3px;
        }
        .slots-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(212,168,67,0.08);
        }
      `}</style>

      {/* Header Global — GameHeader shared */}
      <GameHeader
        onBack={screen === "modeSelect" ? () => {
          if (sessionStatsRef.current.spins > 0) {
            setShowSessionSummary(true);
          } else {
            onBack();
          }
        } : () => {
          setScreen("modeSelect");
          setMode(null);
          setCurrentWin(0);
        }}
        title={lang === "br" ? "SLOT MACHINE" : "SLOT MACHINE"}
        balance={saldo}
        lang={lang === "en" ? "in" : lang as "br"}
        actions={[
          { id: "paytable", icon: ASSETS.iconInfo, tooltip: lang === "br" ? "Tabela de Pagamentos" : "Paytable", onClick: () => setShowPaytable(true) },
          { id: "history", icon: ASSETS.iconHistory, tooltip: lang === "br" ? "Histórico" : "History", onClick: () => setShowHistory(true) },
          { id: "pf", icon: ASSETS.iconProvablyFair, tooltip: "Provably Fair", onClick: () => setShowProvablyFair(true) },
        ]}
        rightSlot={
          <motion.button
            onClick={() => setShowHelp(true)}
            whileHover={{ borderColor: "rgba(212,168,67,0.5)", color: "#D4A843" }}
            whileTap={{ scale: 0.95 }}
            title={lang === "br" ? "Ajuda" : "Help"}
            style={{
              width: "28px", height: "28px", borderRadius: "50%",
              border: "1px solid rgba(212,168,67,0.25)", background: "transparent",
              color: "rgba(212,168,67,0.6)", fontFamily: "'Cinzel', serif",
              fontWeight: 700, fontSize: "13px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ?
          </motion.button>
        }
      />
      
      {/* Conteudo da Tela */}
      <AnimatePresence mode="wait">
        {screen === "modeSelect" && renderModeSelect()}
        {(screen === "videoIdle" || screen === "spinning") && renderVideoSlot()}
        {screen === "fsPlaying" && renderFSPlaying()}
        {(screen === "classicIdle" || screen === "classicSpinning") && renderClassicSlot()}
      </AnimatePresence>
      
      {/* Overlay Free Spins Trigger */}
      <AnimatePresence>
        {screen === "fsTrigger" && renderFSTrigger()}
      </AnimatePresence>
      
      {/* Win Overlay */}
      <AnimatePresence>
        {screen === "winOverlay" && renderWinOverlay()}
      </AnimatePresence>
      
      {/* Paytable Modal (shared) */}
      <PaytableModal
        open={showPaytable}
        onClose={closePaytable}
        title={lang === "br" ? "TABELA DE PAGAMENTOS" : "PAYTABLE"}
        lang={lang === "en" ? "in" : "br"}
        categories={activePaytable}
        footerInfo={
          mode === "classic"
            ? <span>RTP: 96.50% | {lang === "br" ? "3 Reels | 3 Paylines | 7 Simbolos" : "3 Reels | 3 Paylines | 7 Symbols"}</span>
            : <span>RTP: 96.50% | {lang === "br" ? "Grid 8x4 | Scatter Pays 8+ OAK" : "Grid 8x4 | Scatter Pays 8+ OAK"}</span>
        }
      />

      {/* History Modal (shared) */}
      <HistoryModal
        open={showHistory}
        onClose={closeHistory}
        title={lang === "br" ? "HISTORICO" : "HISTORY"}
        lang={lang === "en" ? "in" : "br"}
        columns={historyColumns}
        data={filteredHistory}
        headerContent={
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {(["all", "classic", "video", "fs"] as const).map(f => {
              const labels: Record<string, Record<string, string>> = {
                all: { br: "Todos", en: "All" },
                classic: { br: "Classic", en: "Classic" },
                video: { br: "Video", en: "Video" },
                fs: { br: "Free Spins", en: "Free Spins" },
              };
              const isActive = historyFilter === f;
              return (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "4px",
                    border: isActive ? "1px solid rgba(212,168,67,0.5)" : "1px solid rgba(255,255,255,0.08)",
                    background: isActive ? "rgba(212,168,67,0.12)" : "rgba(255,255,255,0.03)",
                    color: isActive ? "#D4A843" : "rgba(255,255,255,0.35)",
                    fontSize: "clamp(9px, 0.85vw, 11px)",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                >
                  {labels[f][lang] || labels[f].en}
                  {f !== "all" && (
                    <span style={{ marginLeft: "4px", opacity: 0.5 }}>
                      ({spinHistory.filter(h => h.mode === f).length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        }
      />

      {/* Provably Fair Modal (shared) */}
      <ProvablyFairModal
        open={showProvablyFair}
        onClose={closePf}
        lang={lang === "en" ? "in" : "br"}
        pfData={pfData}
        seedHistory={seedHistory}
        onClientSeedChange={handleClientSeedChange}
        onVerify={handlePfVerify}
        onRotateSeed={handlePfRotate}
        verifying={pfVerifying}
        verifyDetails={pfVerifyDetails}
        clientSeedChanged={clientSeedChanged}
        unverifiedCount={nonce}
      />

      {/* G4: Session Summary Modal */}
      <AnimatePresence>
        {showSessionSummary && (() => {
          const s = sessionStatsRef.current;
          const net = s.totalWin - s.totalBet;
          const hitRate = s.spins > 0 ? Math.round((s.wins / s.spins) * 100) : 0;
          const elapsed = Math.floor((Date.now() - s.startTime) / 60000);
          const isProfit = net >= 0;
          return (
            <motion.div
              key="session-summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.7)",
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{
                  width: "clamp(280px, 38vw, 420px)",
                  background: "linear-gradient(160deg, rgba(18,18,22,0.98), rgba(10,10,14,0.98))",
                  border: "1px solid rgba(212,168,67,0.15)",
                  borderRadius: "12px",
                  padding: "clamp(16px, 2.5vw, 28px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                }}
              >
                <div style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: "clamp(13px, 1.5vw, 17px)",
                  color: "#D4A843",
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  textAlign: "center",
                  marginBottom: "clamp(12px, 2vw, 20px)",
                }}>
                  {lang === "br" ? "RESUMO DA SESSAO" : "SESSION SUMMARY"}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
                  {[
                    { label: lang === "br" ? "Spins" : "Spins", value: String(s.spins) },
                    { label: lang === "br" ? "Tempo" : "Time", value: elapsed < 1 ? "<1 min" : `${elapsed} min` },
                    { label: lang === "br" ? "Total apostado" : "Total bet", value: `${s.totalBet.toFixed(0)} ${cc.symbol}` },
                    { label: lang === "br" ? "Total ganho" : "Total won", value: `${s.totalWin.toFixed(0)} ${cc.symbol}` },
                    { label: "Hit Rate", value: `${hitRate}%` },
                    { label: lang === "br" ? "Melhor win" : "Best win", value: s.bestWin > 0 ? `${s.bestWin.toFixed(0)} ${cc.symbol} (x${s.bestMulti.toFixed(1)})` : "-" },
                  ].map((stat, idx) => (
                    <div key={idx} style={{
                      padding: "8px 10px",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}>
                      <div style={{
                        fontSize: "clamp(8px, 0.75vw, 10px)",
                        color: "rgba(255,255,255,0.3)",
                        fontFamily: "'Inter', sans-serif",
                        marginBottom: "3px",
                      }}>{stat.label}</div>
                      <div style={{
                        fontSize: "clamp(12px, 1.3vw, 16px)",
                        color: "rgba(255,255,255,0.8)",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 600,
                      }}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{
                  textAlign: "center",
                  marginTop: "clamp(12px, 2vw, 18px)",
                  padding: "10px",
                  borderRadius: "8px",
                  background: isProfit ? "rgba(0,230,118,0.06)" : "rgba(255,107,107,0.06)",
                  border: `1px solid ${isProfit ? "rgba(0,230,118,0.15)" : "rgba(255,107,107,0.15)"}`,
                }}>
                  <div style={{
                    fontSize: "clamp(9px, 0.9vw, 11px)",
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: "4px",
                  }}>{lang === "br" ? "RESULTADO" : "RESULT"}</div>
                  <div style={{
                    fontSize: "clamp(18px, 2.2vw, 26px)",
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 700,
                    color: isProfit ? "#00E676" : "#FF6B6B",
                    textShadow: isProfit ? "0 0 10px rgba(0,230,118,0.3)" : "none",
                  }}>
                    {isProfit ? "+" : ""}{net.toFixed(0)} {cc.symbol}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "clamp(12px, 2vw, 18px)" }}>
                  <motion.button
                    onClick={() => setShowSessionSummary(false)}
                    whileHover={{ borderColor: "rgba(212,168,67,0.5)" }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      flex: 1,
                      padding: "clamp(8px, 1vw, 12px)",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "rgba(255,255,255,0.5)",
                      fontFamily: "'Cinzel', serif",
                      fontWeight: 600,
                      fontSize: "clamp(10px, 1.1vw, 13px)",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    {lang === "br" ? "CONTINUAR" : "CONTINUE"}
                  </motion.button>
                  <motion.button
                    onClick={() => { setShowSessionSummary(false); onBack(); }}
                    whileHover={{ borderColor: "rgba(212,168,67,0.6)", background: "rgba(212,168,67,0.12)" }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      flex: 1,
                      padding: "clamp(8px, 1vw, 12px)",
                      background: "rgba(212,168,67,0.06)",
                      border: "1px solid rgba(212,168,67,0.3)",
                      borderRadius: "8px",
                      color: "#D4A843",
                      fontFamily: "'Cinzel', serif",
                      fontWeight: 700,
                      fontSize: "clamp(10px, 1.1vw, 13px)",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    {lang === "br" ? "SAIR" : "EXIT"}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Buy Bonus Modal */}
      <AnimatePresence>
        {showBuyBonus && renderBuyBonusModal()}
        {showHelp && renderHelpModal()}
      </AnimatePresence>

      {/* Dev Toolbar — so aparece no localhost */}
      <DevToolbar
        currentScreen={screen}
        screens={[
          { key: "1", label: "Mode Select", action: () => { setScreen("modeSelect"); setMode(null); } },
          { key: "2", label: "Video Idle", action: () => { setScreen("videoIdle"); setMode("video"); } },
          { key: "3", label: "Spinning", action: () => { setScreen("spinning"); setMode("video"); } },
          { key: "4", label: "FS Trigger", action: () => { setScreen("fsTrigger"); setFreeSpinsTotal(10); setFreeSpinsRemaining(10); } },
          { key: "5", label: "FS Playing", action: () => { setScreen("fsPlaying"); setFreeSpinsTotal(10); setFreeSpinsRemaining(7); setFsMultiplier(12); setFsTotalWin(450); } },
          { key: "6", label: "Win Overlay", action: () => { setWinOverlayData({ amount: 250, ratio: 25 }); setScreen("winOverlay"); } },
          { key: "7", label: "Classic Idle", action: () => { setScreen("classicIdle"); setMode("classic"); } },
          { key: "8", label: "Paytable", action: () => setShowPaytable(true) },
          { key: "9", label: "History", action: () => setShowHistory(true) },
          { key: "0", label: "Buy Bonus", action: () => setShowBuyBonus(true) },
        ]}
        extraInfo={{
          saldo: saldo,
          bet: bet,
          mode: mode || "none",
          fsRemaining: freeSpinsRemaining,
          nonce: nonce,
        }}
      />
    </motion.div>
  );
}
