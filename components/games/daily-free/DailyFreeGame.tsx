"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameHeader } from "@/components/shared";
import HelpGameModal, { HelpCard } from "@/components/shared/HelpGameModal";
import type { HelpSection } from "@/components/shared/HelpGameModal";
import { useCasino } from "@/contexts/CasinoContext";
import { useEconomyConfig } from "@/components/shared/economy/useEconomyConfig";
import RewardOverlay from "./RewardOverlay";
import MilestoneOverlay from "./MilestoneOverlay";
import ClaimedOverlay from "./ClaimedOverlay";

// ===========================================================================
// DAILY-FREE (#19) — Blackout Casino GTARP
// Bônus diário gratuito com roda da fortuna e streak de 28 dias
// CSS inline, zero Tailwind, Framer Motion
// ===========================================================================

// Deteccao de ambiente FiveM vs Web
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

type Lang = "br" | "in";
type GamePhase = "IDLE" | "SPINNING" | "RESULT" | "MILESTONE" | "CLAIMED";

interface DailyFreeGameProps {
  onBack: () => void;
  lang?: Lang;
  // Mock data - será substituído por props reais do servidor
  initialStreak?: number;
  initialDay?: number;
  canSpin?: boolean;
  remainingMs?: number;
  isVip?: boolean;
  makeUpTokens?: number;
  cycleResetDays?: number;
  multiplier?: number;
  currencyName?: string;
}

interface WheelSegment {
  value: number;
  tier: "common" | "good" | "big" | "mystery";
  angle: number;
}

interface CalendarDay {
  day: number;
  status: "claimed" | "available" | "future" | "missed";
  isMilestone: boolean;
}

// ===========================================================================
// CONSTANTES
// ===========================================================================

const ASSETS = {
  // Roda
  wheelBase: "/assets/games/daily-free/wheel-base.png",
  wheelMoldura: "/assets/games/daily-free/wheel-moldura-anel.png",
  wheelPointer: "/assets/games/daily-free/icons/wheel-pointer.png",
  // Icones
  iconFlame: "/assets/games/daily-free/icons/icon-flame.png",
  iconTrophy: "/assets/games/daily-free/icons/icon-trophy.png",
  iconLock: "/assets/games/daily-free/icons/icon-lock.png",
  // Premios
  coinSmall: "/assets/games/daily-free/prizes/coin-small.png",
  coinMedium: "/assets/games/daily-free/prizes/coin-medium.png",
  coinStack: "/assets/games/daily-free/prizes/coin-stack.png",
  gemGreen: "/assets/games/daily-free/prizes/gem-green.png",
  treasure: "/assets/games/daily-free/prizes/treasure.png",
  // Decoracoes
  brasaoVitoria: "/assets/games/daily-free/brasao-vitoria.png",
  frameLuxo: "/assets/games/daily-free/frame-luxo-ornamental.png",
  // Badges (funcao para pegar por dia e lang)
  getBadge: (day: number, lang: Lang) => 
    `/assets/games/daily-free/badges/badge-streak-${day}-${lang.toUpperCase()}.png`,
  // Shared
  bgCasino: "/assets/shared/ui/bg-casino.png",
  iconGcoin: "/assets/shared/icons/icon-gcoin.png",
  iconInfo: "/assets/shared/icons/icon-info.png",
  iconCheck: "/assets/shared/icons/icon-check.png",
  dividerOrnamental: "/assets/shared/ui/divider-ornamental-gold.png",
};

// 12 segmentos + 1 mystery = 13 fatias (cada 27.69°)
const WHEEL_SEGMENTS: WheelSegment[] = [
  { value: 50, tier: "common", angle: 0 },
  { value: 100, tier: "common", angle: 27.69 },
  { value: 50, tier: "common", angle: 55.38 },
  { value: 200, tier: "good", angle: 83.08 },
  { value: 50, tier: "common", angle: 110.77 },
  { value: 100, tier: "common", angle: 138.46 },
  { value: 500, tier: "good", angle: 166.15 },
  { value: 50, tier: "common", angle: 193.85 },
  { value: 100, tier: "common", angle: 221.54 },
  { value: 1000, tier: "big", angle: 249.23 },
  { value: 50, tier: "common", angle: 276.92 },
  { value: 100, tier: "common", angle: 304.62 },
  { value: 0, tier: "mystery", angle: 332.31 }, // Mystery: 1000-5000
];

const MILESTONE_BONUSES: Record<number, number> = {
  7: 500,
  14: 1000,
  21: 1500,
  28: 2500,
};

const MILESTONE_COLORS: Record<number, { color: string; glow: string }> = {
  7: { color: "#4B69FF", glow: "rgba(75,105,255,0.4)" },
  14: { color: "#8847FF", glow: "rgba(136,71,255,0.4)" },
  21: { color: "#C0C0FF", glow: "rgba(192,192,255,0.4)" },
  28: { color: "#FFD700", glow: "rgba(255,215,0,0.5)" },
};

const TEXTS = {
  title: { br: "GIRO DIÁRIO", in: "DAILY SPIN" },
  back: { br: "VOLTAR", in: "BACK" },
  dayOf: { br: "DIA", in: "DAY" },
  of28: { br: "DE 28", in: "OF 28" },
  spin: { br: "GIRAR", in: "SPIN" },
  freeSpinPerDay: { br: "1 GIRO GRÁTIS POR DIA", in: "1 FREE SPIN PER DAY" },
  nextSpinIn: { br: "PRÓXIMO GIRO EM", in: "NEXT SPIN IN" },
  streakCurrent: { br: "STREAK ATUAL", in: "CURRENT STREAK" },
  days: { br: "DIAS", in: "DAYS" },
  streakRewards: { br: "RECOMPENSAS DE STREAK", in: "STREAK REWARDS" },
  recoveryTokens: { br: "TOKENS DE RECUPERAÇÃO", in: "RECOVERY TOKENS" },
  monthlyReset: { br: "RESET MENSAL EM", in: "MONTHLY RESET IN" },
  howItWorks: { br: "COMO FUNCIONA?", in: "HOW IT WORKS?" },
  weekDays: {
    br: ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"],
    in: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
  },
};

// ===========================================================================
// HELPERS
// ===========================================================================

function formatTime(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

function generateCalendar(currentDay: number, streak: number): CalendarDay[] {
  const days: CalendarDay[] = [];
  for (let d = 1; d <= 28; d++) {
    const isMilestone = [7, 14, 21, 28].includes(d);
    let status: CalendarDay["status"];
    
    if (d < currentDay) {
      // Dias passados: claimado se dentro do streak, senão perdido
      status = d > currentDay - streak - 1 ? "claimed" : "missed";
    } else if (d === currentDay) {
      status = "available";
    } else {
      status = "future";
    }
    
    days.push({ day: d, status, isMilestone });
  }
  return days;
}

// ===========================================================================
// SONS PROCEDURAIS (Web Audio API — padrao GUIA-REFERENCIA secao 12)
// ===========================================================================

function useDailyFreeSounds(enabled: boolean) {
  const ctx = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctx.current) ctx.current = new AudioContext();
    if (ctx.current.state === "suspended") ctx.current.resume();
    return ctx.current;
  }, []);

  const tone = useCallback((freq: number, dur: number, type: OscillatorType = "sine", vol = 0.12) => {
    if (!enabled) return;
    try {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = vol;
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + dur);
    } catch {}
  }, [enabled, getCtx]);

  return useMemo(() => ({
    // Tick da roda passando por cada segmento
    tick: () => tone(1200 + Math.random() * 400, 0.04, "square", 0.06),
    // Botao GIRAR pressionado
    spinStart: () => {
      tone(440, 0.15, "sine", 0.1);
      setTimeout(() => tone(660, 0.12, "sine", 0.08), 80);
    },
    // Resultado — fanfarra ascendente
    win: () => {
      tone(523, 0.15, "sine", 0.12);
      setTimeout(() => tone(659, 0.15, "sine", 0.12), 120);
      setTimeout(() => tone(784, 0.2, "sine", 0.14), 240);
      setTimeout(() => tone(1047, 0.3, "triangle", 0.1), 400);
    },
    // Milestone — fanfarra mais longa
    milestone: () => {
      tone(523, 0.12, "sine", 0.1);
      setTimeout(() => tone(659, 0.12, "sine", 0.1), 100);
      setTimeout(() => tone(784, 0.12, "sine", 0.12), 200);
      setTimeout(() => tone(1047, 0.15, "sine", 0.14), 300);
      setTimeout(() => tone(1319, 0.25, "triangle", 0.12), 450);
      setTimeout(() => tone(1568, 0.35, "triangle", 0.1), 600);
    },
  }), [tone]);
}

// ===========================================================================
// AJUDA — secoes do modal "Como funciona?" (bilingue BR/EN)
// ===========================================================================

const DAILY_FREE_HELP: HelpSection[] = [
  {
    id: "como-jogar",
    icon: "🎰",
    titleBR: "Como Jogar",
    titleIN: "How to Play",
    content: (lang) => {
      const br = lang === "br";
      return (
        <>
          <HelpCard icon="🎡" title={br ? "Giro Diario Gratuito" : "Free Daily Spin"}>
            {br
              ? "Voce tem direito a 1 giro gratuito por dia na Roda da Fortuna. Basta clicar no botao GIRAR e aguardar o resultado. O premio eh creditado automaticamente no seu saldo."
              : "You get 1 free spin per day on the Fortune Wheel. Just click the SPIN button and wait for the result. The prize is credited to your balance automatically."}
          </HelpCard>
          <HelpCard icon="⏰" title={br ? "Quando Posso Girar?" : "When Can I Spin?"}>
            {br
              ? "Apos usar seu giro diario, um timer de 24 horas aparece. Quando o timer zerar, um novo giro estara disponivel. Voce nao perde nada se nao jogar — mas perde a sequencia!"
              : "After using your daily spin, a 24-hour timer appears. When it reaches zero, a new spin is available. You don't lose anything by not playing — but you lose your streak!"}
          </HelpCard>
        </>
      );
    },
  },
  {
    id: "premios",
    icon: "💰",
    titleBR: "Premios da Roda",
    titleIN: "Wheel Prizes",
    content: (lang) => {
      const br = lang === "br";
      return (
        <>
          <HelpCard icon="🟢" title={br ? "Premios Comuns (64%)" : "Common Prizes (64%)"}>
            {br
              ? "A maioria dos segmentos da roda sao premios comuns — valores menores mas frequentes. Garantem que voce sempre ganha algo."
              : "Most wheel segments are common prizes — smaller but frequent values. They ensure you always win something."}
          </HelpCard>
          <HelpCard icon="🔵" title={br ? "Premios Bons (24%)" : "Good Prizes (24%)"} variant="tip">
            {br
              ? "Segmentos com valores intermediarios. Aparecem em cerca de 1 a cada 4 giros."
              : "Segments with medium values. They appear roughly 1 in every 4 spins."}
          </HelpCard>
          <HelpCard icon="⭐" title={br ? "Premio Grande (8%)" : "Big Prize (8%)"} variant="win">
            {br
              ? "O segmento de maior valor fixo da roda. Raro mas recompensador — aparece em media 1 a cada 12 giros."
              : "The highest fixed-value segment on the wheel. Rare but rewarding — appears roughly 1 in every 12 spins."}
          </HelpCard>
          <HelpCard icon="❓" title={br ? "Mystery — Surpresa (4%)" : "Mystery — Surprise (4%)"} variant="warning">
            {br
              ? "O segmento '?' sorteia um valor aleatorio entre um minimo e um maximo. Pode ser o maior premio da roda! Aparece em media 1 a cada 25 giros."
              : "The '?' segment draws a random value between a minimum and maximum. It can be the biggest prize on the wheel! Appears roughly 1 in every 25 spins."}
          </HelpCard>
        </>
      );
    },
  },
  {
    id: "sequencia",
    icon: "🔥",
    titleBR: "Sequencia (Streak)",
    titleIN: "Streak System",
    content: (lang) => {
      const br = lang === "br";
      return (
        <>
          <HelpCard icon="📅" title={br ? "Ciclo de 28 Dias" : "28-Day Cycle"}>
            {br
              ? "O calendario tem 28 dias. Cada dia que voce joga, marca um dia no calendario e aumenta sua sequencia. Se voce perder um dia, sua sequencia zera!"
              : "The calendar has 28 days. Each day you play, you mark a day on the calendar and increase your streak. If you miss a day, your streak resets!"}
          </HelpCard>
          <HelpCard icon="🏆" title={br ? "Bonus de Sequencia" : "Streak Bonuses"} variant="win">
            {br
              ? "A cada 7 dias consecutivos, voce ganha um BONUS especial alem do premio da roda. Os bonus crescem: Dia 7, Dia 14, Dia 21 e Dia 28. O bonus do Dia 28 eh o maior de todos!"
              : "Every 7 consecutive days, you earn a special BONUS on top of the wheel prize. Bonuses grow: Day 7, Day 14, Day 21, and Day 28. The Day 28 bonus is the biggest!"}
          </HelpCard>
          <HelpCard icon="💔" title={br ? "Cuidado com a Sequencia!" : "Watch Your Streak!"} variant="warning">
            {br
              ? "Se voce perder UM unico dia, sua sequencia volta a zero e voce perde os bonus acumulados. Faca do giro diario um habito!"
              : "If you miss a SINGLE day, your streak resets to zero and you lose accumulated bonuses. Make the daily spin a habit!"}
          </HelpCard>
        </>
      );
    },
  },
  {
    id: "recuperacao",
    icon: "🎟",
    titleBR: "Tokens de Recuperacao",
    titleIN: "Recovery Tokens",
    content: (lang) => {
      const br = lang === "br";
      return (
        <>
          <HelpCard icon="🎟" title={br ? "O Que Sao?" : "What Are They?"}>
            {br
              ? "Tokens de Recuperacao permitem que voce 'resgate' um dia perdido sem quebrar sua sequencia. Voce recebe 3 tokens por mes."
              : "Recovery Tokens let you 'redeem' a missed day without breaking your streak. You receive 3 tokens per month."}
          </HelpCard>
          <HelpCard icon="📋" title={br ? "Como Usar" : "How to Use"} variant="tip">
            {br
              ? "Se voce perdeu ontem, ao abrir o jogo hoje o sistema pergunta se quer usar um token. Se aceitar, o dia perdido eh marcado como jogado e sua sequencia continua intacta."
              : "If you missed yesterday, when you open the game today the system asks if you want to use a token. If you accept, the missed day is marked as played and your streak continues intact."}
          </HelpCard>
          <HelpCard icon="🔄" title={br ? "Reset Mensal" : "Monthly Reset"} variant="warning">
            {br
              ? "Apos 28 dias, o calendario e os tokens resetam. Uma nova jornada comeca do Dia 1. Seus ganhos anteriores sao mantidos no saldo."
              : "After 28 days, the calendar and tokens reset. A new journey starts from Day 1. Your previous earnings are kept in your balance."}
          </HelpCard>
        </>
      );
    },
  },
];

// ===========================================================================
// COMPONENTE PRINCIPAL
// ===========================================================================

export default function DailyFreeGame({
  onBack,
  lang = "br",
  initialStreak = 11,
  initialDay = 11,
  canSpin = true,
  remainingMs = 0,
  isVip = false,
  makeUpTokens = 2,
  cycleResetDays = 16,
  multiplier = 5,
  currencyName = "GCoin",
}: DailyFreeGameProps) {
  // Casino context (saldo, idioma)
  const { saldo, lang: casinoLang } = useCasino();
  const activeLang = lang || casinoLang || "br";

  // Economy config (multiplier + moeda do servidor)
  const { economy } = useEconomyConfig("daily-free");
  const effectiveMultiplier = multiplier !== 5 ? multiplier : economy.multiplier;
  const effectiveCurrency = currencyName !== "GCoin" ? currencyName : economy.currency.name;

  // Estado
  const [phase, setPhase] = useState<GamePhase>(canSpin ? "IDLE" : "CLAIMED");
  const [streak, setStreak] = useState(initialStreak);
  const [currentDay, setCurrentDay] = useState(initialDay);
  const [wheelRotation, setWheelRotation] = useState(() => Math.random() * 360);
  const [winningSegment, setWinningSegment] = useState<WheelSegment | null>(null);
  const [timer, setTimer] = useState(remainingMs);
  const [isHoveringWheel, setIsHoveringWheel] = useState(false);
  const [isHoveringSpin, setIsHoveringSpin] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  
  // Sons procedurais
  const sounds = useDailyFreeSounds(soundEnabled);
  
  // Ref para controle de spin
  const spinCompleteRef = useRef(false);
  
  // Refs
  const wheelRef = useRef<HTMLDivElement>(null);
  const spinButtonRef = useRef<HTMLButtonElement>(null);
  const rotationRef = useRef(Math.random() * 360); // evita comecar em 0 (fix giro duplo)
  
  // Calendario
  const calendar = useMemo(() => generateCalendar(currentDay, streak), [currentDay, streak]);
  
  // Timer countdown
  useEffect(() => {
    if (phase !== "CLAIMED" || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1000) {
          setPhase("IDLE");
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, timer]);

  // Handler de giro
  const handleSpin = useCallback(async () => {
    if (phase !== "IDLE") return;
    
    setPhase("SPINNING");
    spinCompleteRef.current = false;
    sounds.spinStart();
    
    let selectedSegment: WheelSegment;

    if (isFiveM) {
      // FiveM: server decide resultado
      try {
        const resp = await fetchNui("casino:daily:claim", {});
        if (resp.error) {
          setPhase("IDLE");
          return;
        }
        const idx = resp.segmentIndex ?? 0;
        selectedSegment = WHEEL_SEGMENTS[idx] || WHEEL_SEGMENTS[0];
      } catch {
        setPhase("IDLE");
        return;
      }
    } else {
      // Web: engine local
      const rand = Math.random() * 100;
      
      if (rand < 64) {
        const commons = WHEEL_SEGMENTS.filter(s => s.tier === "common");
        selectedSegment = commons[Math.floor(Math.random() * commons.length)];
      } else if (rand < 88) {
        const goods = WHEEL_SEGMENTS.filter(s => s.tier === "good");
        selectedSegment = goods[Math.floor(Math.random() * goods.length)];
      } else if (rand < 96) {
        selectedSegment = WHEEL_SEGMENTS.find(s => s.tier === "big")!;
      } else {
        selectedSegment = WHEEL_SEGMENTS.find(s => s.tier === "mystery")!;
      }
    }
    
    setWinningSegment(selectedSegment);
    
    // Calcular angulo final (8-12 voltas + angulo do segmento)
    const spins = 8 + Math.random() * 4;
    const targetAngle = spins * 360 + (360 - selectedSegment.angle);
    
    setWheelRotation(prev => prev + targetAngle);
    
    // Marcar que spin completou apos duracao da animacao
    const animDuration = 8400; // 8s animacao + 400ms buffer (easing longo)
    setTimeout(() => {
      spinCompleteRef.current = true;
    }, animDuration);
  }, [phase]);

  // Efeito que observa quando a animacao completou pra trocar phase
  useEffect(() => {
    if (phase !== "SPINNING") return;
    
    const checkInterval = setInterval(() => {
      if (spinCompleteRef.current) {
        clearInterval(checkInterval);
        const newStreak = streak + 1;
        setStreak(newStreak);
        sounds.win();
        setPhase("RESULT");
      }
    }, 100);
    
    return () => clearInterval(checkInterval);
  }, [phase, streak, sounds]);

  // Tick sonoro durante giro (intervalo crescente = desacelera)
  useEffect(() => {
    if (phase !== "SPINNING") return;
    let tickDelay = 80;
    let elapsed = 0;
    let tickTimer: ReturnType<typeof setTimeout>;

    const scheduleTick = () => {
      tickTimer = setTimeout(() => {
        elapsed += tickDelay;
        if (elapsed < 7500) {
          sounds.tick();
          // Intervalo cresce: rapido no inicio, lento no fim
          tickDelay = Math.min(tickDelay * 1.08, 500);
          scheduleTick();
        }
      }, tickDelay);
    };
    scheduleTick();

    return () => clearTimeout(tickTimer);
  }, [phase, sounds]);

  // Handler de coletar premio
  const handleCollect = useCallback(() => {
    if (phase === "RESULT") {
      if ([7, 14, 21, 28].includes(streak)) {
        sounds.milestone();
        setPhase("MILESTONE");
        return;
      }
    }
    setPhase("CLAIMED");
    setCurrentDay(prev => Math.min(prev + 1, 28));
    setTimer(24 * 60 * 60 * 1000);
  }, [phase, streak, sounds]);

  // ===========================================================================
  // STYLES
  // ===========================================================================

  const styles = useMemo(() => ({
    container: {
      position: "absolute" as const,
      inset: "6px",
      zIndex: 60,
      borderRadius: "12px",
      overflow: "hidden",
      backgroundColor: "#080604",
      backgroundImage: `url('${ASSETS.bgCasino}'), radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,168,67,0.03) 0%, transparent 70%)`,
      backgroundSize: "cover, 100% 100%",
      border: "1.5px solid rgba(212,168,67,0.35)",
      boxShadow: "inset 0 0 80px rgba(0,0,0,0.9), 0 0 30px rgba(212,168,67,0.06)",
      display: "flex",
      flexDirection: "column" as const,
      fontFamily: "'Inter', sans-serif",
    },
    mainContent: {
      display: "flex",
      flex: 1,
      padding: "clamp(8px, 1vw, 16px)",
      gap: "clamp(12px, 2vw, 24px)",
      overflow: "hidden",
      minHeight: 0,
    },
    // Lado esquerdo: Roda
    leftPanel: {
      flex: "0 0 55%",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      gap: "clamp(8px, 1vw, 16px)",
      position: "relative" as const,
    },
    // Lado direito: Calendario
    rightPanel: {
      flex: "0 0 45%",
      display: "flex",
      flexDirection: "column" as const,
      gap: "clamp(8px, 1vw, 12px)",
      overflowY: "auto" as const,
      overflowX: "hidden" as const,
      scrollbarWidth: "thin" as const,
      scrollbarColor: "rgba(212,168,67,0.3) transparent",
    },
    // Streak counter
    streakCounter: {
      position: "absolute" as const,
      top: "clamp(8px, 1vw, 16px)",
      left: "clamp(8px, 1vw, 16px)",
      display: "flex",
      alignItems: "center",
      gap: "clamp(6px, 0.8vw, 10px)",
      padding: "clamp(8px, 1vw, 12px) clamp(12px, 1.5vw, 18px)",
      background: "rgba(0,0,0,0.85)",
      border: "1.5px solid rgba(212,168,67,0.4)",
      borderRadius: "12px",
      boxShadow: "0 0 20px rgba(0,0,0,0.6), inset 0 0 15px rgba(0,0,0,0.5)",
    },
    streakFlame: {
      width: "clamp(28px, 3vw, 40px)",
      height: "clamp(28px, 3vw, 40px)",
      objectFit: "contain" as const,
      filter: "drop-shadow(0 0 8px rgba(255,100,0,0.6))",
    },
    streakText: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
    },
    streakLabel: {
      fontFamily: "'Cinzel', serif",
      fontWeight: 600,
      fontSize: "clamp(7px, 0.8vw, 10px)",
      color: "rgba(255,255,255,0.5)",
      letterSpacing: "1px",
      textTransform: "uppercase" as const,
    },
    streakValue: {
      fontFamily: "'Cinzel', serif",
      fontWeight: 900,
      fontSize: "clamp(24px, 3vw, 36px)",
      color: "#FFD700",
      lineHeight: 1,
      textShadow: "0 0 12px rgba(255,215,0,0.6)",
    },
    streakDays: {
      fontFamily: "'Cinzel', serif",
      fontWeight: 600,
      fontSize: "clamp(8px, 0.9vw, 11px)",
      color: "rgba(255,255,255,0.6)",
      letterSpacing: "2px",
      textTransform: "uppercase" as const,
    },
    // Roda container
    wheelContainer: {
      position: "relative" as const,
      width: "clamp(280px, 38vw, 480px)",
      height: "clamp(280px, 38vw, 480px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    wheelBase: {
      position: "absolute" as const,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
    },
    wheelMoldura: {
      position: "absolute" as const,
      width: "100%",
      height: "100%",
      pointerEvents: "none" as const,
      filter: "drop-shadow(0 0 30px rgba(255,215,0,0.4))",
      zIndex: 2,
    },
    wheelPointer: {
      position: "absolute" as const,
      top: "-4%",
      left: "50%",
      transform: "translateX(-50%)",
      width: "clamp(40px, 5vw, 60px)",
      height: "clamp(50px, 6vw, 75px)",
      objectFit: "contain" as const,
      zIndex: 3,
      filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.8))",
    },
    // Botao GIRAR
    spinButtonContainer: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      gap: "clamp(4px, 0.5vw, 8px)",
    },
    spinButton: {
      position: "relative" as const,
      fontFamily: "'Cinzel', serif",
      fontWeight: 900,
      fontSize: "clamp(18px, 2.2vw, 28px)",
      letterSpacing: "4px",
      textTransform: "uppercase" as const,
      color: "#FFFFFF",
      padding: "clamp(14px, 1.8vw, 22px) clamp(50px, 6vw, 80px)",
      borderRadius: "12px",
      border: "2px solid rgba(0,230,118,0.5)",
      background: "linear-gradient(180deg, #00E676 0%, #00C853 50%, #004D25 100%)",
      boxShadow: `
        0 0 30px rgba(0,230,118,0.5),
        0 8px 24px rgba(0,0,0,0.5),
        inset 0 2px 0 rgba(255,255,255,0.25),
        inset 0 -2px 4px rgba(0,0,0,0.3)
      `,
      cursor: "pointer",
      overflow: "hidden",
    },
    spinButtonDisabled: {
      background: "linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 50%, #1a1a1a 100%)",
      border: "2px solid rgba(100,100,100,0.3)",
      boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
      cursor: "not-allowed",
      color: "rgba(255,255,255,0.3)",
    },
    spinSubtext: {
      fontFamily: "'Cinzel', serif",
      fontWeight: 500,
      fontSize: "clamp(9px, 1vw, 12px)",
      color: "rgba(255,255,255,0.5)",
      letterSpacing: "2px",
      textTransform: "uppercase" as const,
    },
    // Info e timer
    bottomInfo: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      maxWidth: "clamp(280px, 38vw, 480px)",
      marginTop: "clamp(4px, 0.5vw, 8px)",
    },
    howItWorksBtn: {
      display: "flex",
      alignItems: "center",
      gap: "clamp(4px, 0.5vw, 8px)",
      padding: "clamp(6px, 0.8vw, 10px) clamp(10px, 1.2vw, 16px)",
      background: "rgba(0,0,0,0.6)",
      border: "1px solid rgba(212,168,67,0.3)",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    howItWorksIcon: {
      width: "clamp(14px, 1.6vw, 20px)",
      height: "clamp(14px, 1.6vw, 20px)",
      opacity: 0.7,
    },
    howItWorksText: {
      fontFamily: "'Cinzel', serif",
      fontWeight: 600,
      fontSize: "clamp(8px, 0.9vw, 11px)",
      color: "rgba(255,255,255,0.6)",
      letterSpacing: "1px",
    },
    timerBox: {
      display: "flex",
      alignItems: "center",
      gap: "clamp(6px, 0.8vw, 10px)",
      padding: "clamp(6px, 0.8vw, 10px) clamp(10px, 1.2vw, 16px)",
      background: "rgba(0,0,0,0.6)",
      border: "1px solid rgba(212,168,67,0.3)",
      borderRadius: "8px",
    },
    timerLabel: {
      fontFamily: "'Cinzel', serif",
      fontWeight: 500,
      fontSize: "clamp(8px, 0.9vw, 11px)",
      color: "rgba(255,255,255,0.5)",
      letterSpacing: "1px",
    },
    timerValue: {
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 700,
      fontSize: "clamp(12px, 1.4vw, 18px)",
      color: "#FFD700",
      textShadow: "0 0 8px rgba(255,215,0,0.5)",
    },
    // Titulo do calendario
    calendarTitle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "clamp(8px, 1vw, 14px)",
    },
    calendarTitleText: {
      fontFamily: "'Cinzel', serif",
      fontWeight: 900,
      fontSize: "clamp(18px, 2.2vw, 28px)",
      color: "#D4A843",
      letterSpacing: "3px",
      textShadow: "0 0 12px rgba(212,168,67,0.5)",
    },
    calendarDivider: {
      width: "clamp(40px, 5vw, 70px)",
      height: "2px",
      background: "linear-gradient(90deg, transparent, rgba(212,168,67,0.6), transparent)",
    },
    // Header da semana
    weekHeader: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: "clamp(2px, 0.3vw, 4px)",
      marginTop: "clamp(4px, 0.5vw, 8px)",
    },
    weekDay: {
      fontFamily: "'Cinzel', serif",
      fontWeight: 600,
      fontSize: "clamp(8px, 0.9vw, 11px)",
      color: "rgba(255,255,255,0.4)",
      textAlign: "center" as const,
      letterSpacing: "1px",
    },
    // Grid do calendario
    calendarGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gridTemplateRows: "repeat(4, 1fr)",
      gap: "clamp(3px, 0.4vw, 6px)",
      flex: 1,
      minHeight: 0,
    },
    calendarDay: {
      position: "relative" as const,
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      aspectRatio: "1",
      background: "rgba(0,0,0,0.5)",
      border: "1px solid rgba(212,168,67,0.2)",
      borderRadius: "clamp(4px, 0.5vw, 8px)",
      transition: "all 0.2s ease",
    },
    calendarDayAvailable: {
      border: "2px solid #FFD700",
      boxShadow: "0 0 20px rgba(255,215,0,0.4), inset 0 0 15px rgba(255,215,0,0.1)",
      animation: "pulseGlow 2s ease-in-out infinite",
    },
    calendarDayClaimed: {
      background: "rgba(0,230,118,0.1)",
      border: "1px solid rgba(0,230,118,0.3)",
    },
    calendarDayMissed: {
      background: "rgba(255,0,0,0.05)",
      border: "1px solid rgba(255,0,0,0.2)",
      opacity: 0.5,
    },
    calendarDayFuture: {
      opacity: 0.4,
    },
    calendarDayNumber: {
      fontFamily: "'Cinzel', serif",
      fontWeight: 700,
      fontSize: "clamp(11px, 1.3vw, 16px)",
      color: "rgba(255,255,255,0.8)",
    },
    calendarDayIcon: {
      position: "absolute" as const,
      width: "clamp(14px, 1.6vw, 20px)",
      height: "clamp(14px, 1.6vw, 20px)",
      objectFit: "contain" as const,
    },
    // Divisor de recompensas
    rewardsDivider: {
      display: "flex",
      alignItems: "center",
      gap: "clamp(8px, 1vw, 14px)",
      margin: "clamp(4px, 0.5vw, 8px) 0",
    },
    rewardsDividerLine: {
      flex: 1,
      height: "1px",
      background: "linear-gradient(90deg, transparent, rgba(212,168,67,0.4), transparent)",
    },
    rewardsDividerText: {
      fontFamily: "'Cinzel', serif",
      fontWeight: 600,
      fontSize: "clamp(9px, 1vw, 12px)",
      color: "rgba(212,168,67,0.7)",
      letterSpacing: "2px",
      textTransform: "uppercase" as const,
      whiteSpace: "nowrap" as const,
    },
    // Milestones
    milestonesRow: {
      display: "flex",
      gap: "clamp(6px, 0.8vw, 10px)",
      justifyContent: "center",
    },
    milestoneCard: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      gap: "clamp(4px, 0.5vw, 8px)",
      padding: "clamp(8px, 1vw, 14px)",
      background: "rgba(0,0,0,0.6)",
      borderRadius: "clamp(8px, 1vw, 12px)",
      transition: "all 0.3s ease",
      flex: 1,
      maxWidth: "clamp(70px, 9vw, 100px)",
    },
    milestoneBadge: {
      width: "clamp(50px, 6vw, 80px)",
      height: "clamp(50px, 6vw, 80px)",
      objectFit: "contain" as const,
    },
    milestoneValue: {
      display: "flex",
      alignItems: "center",
      gap: "clamp(2px, 0.3vw, 4px)",
    },
    milestoneAmount: {
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 700,
      fontSize: "clamp(11px, 1.3vw, 16px)",
      color: "#FFD700",
    },
    milestoneCoin: {
      width: "clamp(12px, 1.4vw, 18px)",
      height: "clamp(12px, 1.4vw, 18px)",
    },
    milestoneLabel: {
      fontFamily: "'Inter', sans-serif",
      fontSize: "clamp(8px, 0.9vw, 11px)",
      color: "rgba(255,255,255,0.5)",
    },
    // Footer info
    footerInfo: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "clamp(6px, 0.8vw, 10px) clamp(10px, 1.2vw, 16px)",
      background: "rgba(0,0,0,0.5)",
      borderTop: "1px solid rgba(212,168,67,0.15)",
      borderRadius: "0 0 10px 10px",
    },
    footerItem: {
      display: "flex",
      alignItems: "center",
      gap: "clamp(4px, 0.5vw, 8px)",
    },
    footerIcon: {
      width: "clamp(14px, 1.6vw, 20px)",
      height: "clamp(14px, 1.6vw, 20px)",
      opacity: 0.6,
    },
    footerText: {
      fontFamily: "'Inter', sans-serif",
      fontSize: "clamp(9px, 1vw, 12px)",
      color: "rgba(255,255,255,0.5)",
    },
    footerValue: {
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 600,
      fontSize: "clamp(10px, 1.1vw, 14px)",
      color: "#00E676",
    },
  }), [phase]);

  // ===========================================================================
  // RENDER
  // ===========================================================================

  const renderCalendarDay = (day: CalendarDay) => {
    const baseStyle = { ...styles.calendarDay };
    
    if (day.status === "available") Object.assign(baseStyle, styles.calendarDayAvailable);
    else if (day.status === "claimed") Object.assign(baseStyle, styles.calendarDayClaimed);
    else if (day.status === "missed") Object.assign(baseStyle, styles.calendarDayMissed);
    else if (day.status === "future") Object.assign(baseStyle, styles.calendarDayFuture);
    
    // Cor especial para milestones
    if (day.isMilestone) {
      const mc = MILESTONE_COLORS[day.day as 7 | 14 | 21 | 28];
      if (day.status === "claimed") {
        baseStyle.border = `2px solid ${mc.color}`;
        baseStyle.boxShadow = `0 0 15px ${mc.glow}`;
      }
    }

    return (
      <motion.div
        key={day.day}
        style={baseStyle}
        whileHover={day.status === "available" ? { scale: 1.05 } : undefined}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: day.status === "future" ? 0.4 : 1, scale: 1 }}
        transition={{ delay: day.day * 0.02 }}
      >
        <span style={styles.calendarDayNumber}>{day.day}</span>
        
        {/* Icone baseado no status */}
        {day.status === "claimed" && (
          <img
            src={ASSETS.iconCheck}
            alt=""
            style={{
              ...styles.calendarDayIcon,
              bottom: "4px",
              filter: "brightness(0) saturate(100%) invert(72%) sepia(59%) saturate(4476%) hue-rotate(88deg) brightness(107%) contrast(108%)",
            }}
          />
        )}
        {day.status === "future" && (
          <img
            src={ASSETS.iconLock}
            alt=""
            style={{
              ...styles.calendarDayIcon,
              bottom: "4px",
              opacity: 0.4,
            }}
          />
        )}
      </motion.div>
    );
  };

  const renderMilestoneCard = (day: 7 | 14 | 21 | 28) => {
    const mc = MILESTONE_COLORS[day];
    const bonus = MILESTONE_BONUSES[day];
    const isAchieved = streak >= day;
    const isNext = streak < day && streak >= day - 7;

    return (
      <motion.div
        key={day}
        style={{
          ...styles.milestoneCard,
          border: `1.5px solid ${isAchieved ? mc.color : "rgba(212,168,67,0.2)"}`,
          boxShadow: isAchieved ? `0 0 20px ${mc.glow}` : "none",
          opacity: isAchieved ? 1 : isNext ? 0.7 : 0.4,
        }}
        whileHover={{ scale: 1.05, boxShadow: `0 0 25px ${mc.glow}` }}
      >
        <img
          src={ASSETS.getBadge(day, lang)}
          alt={`${day} days`}
          style={{
            ...styles.milestoneBadge,
            filter: isAchieved ? `drop-shadow(0 0 10px ${mc.glow})` : "grayscale(0.8) brightness(0.6)",
          }}
        />
        <div style={styles.milestoneValue}>
          <span style={styles.milestoneAmount}>{Math.floor(bonus * multiplier)}</span>
          <img src={ASSETS.iconGcoin} alt="" style={styles.milestoneCoin} />
        </div>
        <span style={styles.milestoneLabel}>{currencyName}</span>
        {isAchieved && (
          <img
            src={ASSETS.iconCheck}
            alt=""
            style={{
              width: "clamp(12px, 1.4vw, 18px)",
              height: "clamp(12px, 1.4vw, 18px)",
              filter: "brightness(0) saturate(100%) invert(72%) sepia(59%) saturate(4476%) hue-rotate(88deg) brightness(107%) contrast(108%)",
            }}
          />
        )}
      </motion.div>
    );
  };

  return (
    <div style={styles.container}>
      {/* CSS Keyframes */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,215,0,0.4), inset 0 0 15px rgba(255,215,0,0.1); }
          50% { box-shadow: 0 0 35px rgba(255,215,0,0.6), inset 0 0 25px rgba(255,215,0,0.2); }
        }
        @keyframes shinePass {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
        @keyframes pointerBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(4px); }
        }
        /* Scrollbar dourada CEF103-safe (webkit) */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: rgba(212,168,67,0.3);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(212,168,67,0.5);
        }
      `}</style>

      {/* Header — padrao shared (Bicho/Slots) */}
      <GameHeader
        title={TEXTS.title[activeLang]}
        onBack={onBack}
        balance={saldo}
        lang={activeLang}
        actions={[
          {
            id: "sound",
            icon: soundEnabled
              ? "/assets/shared/icons/icon-sound-on.png"
              : "/assets/shared/icons/icon-sound-off.png",
            tooltip: soundEnabled
              ? (activeLang === "br" ? "Desativar som" : "Mute sound")
              : (activeLang === "br" ? "Ativar som" : "Enable sound"),
            onClick: () => setSoundEnabled(s => !s),
          },
        ]}
        rightSlot={
          <motion.button
            onClick={() => setShowHelp(true)}
            whileHover={{ borderColor: "rgba(212,168,67,0.5)", color: "#D4A843" }}
            whileTap={{ scale: 0.95 }}
            title={activeLang === "br" ? "Como funciona?" : "How it works?"}
            style={{
              width: "clamp(34px, 3vw, 42px)",
              height: "clamp(34px, 3vw, 42px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, rgba(15,12,8,0.85), rgba(8,7,6,0.95))",
              border: "1.5px solid rgba(139,105,20,0.6)",
              borderRadius: "8px",
              color: "rgba(212,168,67,0.7)",
              fontFamily: "'Cinzel', serif",
              fontWeight: 800,
              fontSize: "clamp(14px, 1.4vw, 18px)",
              cursor: "pointer",
              boxShadow: "inset 0 1px 1px rgba(255,215,0,0.15), 0 2px 6px rgba(0,0,0,0.4)",
            }}
          >
            ?
          </motion.button>
        }
      />

      {/* Conteudo principal */}
      <div style={styles.mainContent}>
        {/* Painel esquerdo: Roda */}
        <div style={styles.leftPanel}>
          {/* Streak Counter */}
          <motion.div
            style={styles.streakCounter}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <img src={ASSETS.iconFlame} alt="" style={styles.streakFlame} />
            <div style={styles.streakText}>
              <span style={styles.streakLabel}>{TEXTS.streakCurrent[activeLang]}</span>
              <span style={styles.streakValue}>{streak}</span>
              <span style={styles.streakDays}>{TEXTS.days[activeLang]}</span>
            </div>
          </motion.div>

          {/* Roda da Fortuna */}
          <div
            style={styles.wheelContainer}
            ref={wheelRef}
            onMouseEnter={() => setIsHoveringWheel(true)}
            onMouseLeave={() => setIsHoveringWheel(false)}
          >
            {/* Ponteiro */}
            <motion.img
              src={ASSETS.wheelPointer}
              alt=""
              style={styles.wheelPointer}
              animate={phase === "SPINNING" ? { y: [0, 4, 0] } : {}}
              transition={{ duration: 0.15, repeat: phase === "SPINNING" ? Infinity : 0 }}
            />

            {/* Roda base (gira) — wrapper div garante eixo central */}
            <motion.div
              style={{
                position: "absolute" as const,
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              animate={{ rotate: wheelRotation }}
              transition={{
                duration: phase === "SPINNING" ? 8 : 0.3,
                ease: phase === "SPINNING" ? [0.12, 0.75, 0.22, 1] : "easeOut",
              }}
            >
              <img
                src={ASSETS.wheelBase}
                alt="Wheel"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  borderRadius: "50%",
                }}
              />
            </motion.div>

            {/* Moldura (estatica, sobrepoe a roda) */}
            <img
              src={ASSETS.wheelMoldura}
              alt=""
              style={{
                position: "absolute" as const,
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                pointerEvents: "none" as const,
                filter: "drop-shadow(0 0 30px rgba(255,215,0,0.4))",
                zIndex: 2,
              }}
            />
          </div>

          {/* Botao GIRAR */}
          <div style={styles.spinButtonContainer}>
            <motion.button
              ref={spinButtonRef}
              style={{
                ...styles.spinButton,
                ...(phase !== "IDLE" ? styles.spinButtonDisabled : {}),
              }}
              onClick={handleSpin}
              disabled={phase !== "IDLE"}
              whileHover={phase === "IDLE" ? { scale: 1.03 } : undefined}
              whileTap={phase === "IDLE" ? { scale: 0.97 } : undefined}
              onMouseEnter={() => setIsHoveringSpin(true)}
              onMouseLeave={() => setIsHoveringSpin(false)}
            >
              {/* Shine effect */}
              {phase === "IDLE" && (
                <motion.div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "50%",
                    height: "100%",
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                    pointerEvents: "none",
                  }}
                  animate={{ x: ["0%", "300%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                />
              )}
              {TEXTS.spin[activeLang]}
            </motion.button>
            <span style={styles.spinSubtext}>{TEXTS.freeSpinPerDay[activeLang]}</span>
          </div>

          {/* Info e Timer */}
          <div style={styles.bottomInfo}>
            <button style={styles.howItWorksBtn}>
              <img src={ASSETS.iconInfo} alt="" style={styles.howItWorksIcon} />
              <span style={styles.howItWorksText}>{TEXTS.howItWorks[activeLang]}</span>
            </button>

            {phase === "CLAIMED" && timer > 0 && (
              <div style={styles.timerBox}>
                <span style={styles.timerLabel}>{TEXTS.nextSpinIn[activeLang]}</span>
                <span style={styles.timerValue}>{formatTime(timer)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Painel direito: Calendario */}
        <div style={styles.rightPanel}>
          {/* Titulo */}
          <div style={styles.calendarTitle}>
            <div style={styles.calendarDivider} />
            <span style={styles.calendarTitleText}>
              {TEXTS.dayOf[activeLang]} {currentDay} {TEXTS.of28[activeLang]}
            </span>
            <div style={styles.calendarDivider} />
          </div>

          {/* Header da semana */}
          <div style={styles.weekHeader}>
            {TEXTS.weekDays[activeLang].map((day, i) => (
              <span key={i} style={styles.weekDay}>{day}</span>
            ))}
          </div>

          {/* Grid do calendario */}
          <div style={styles.calendarGrid}>
            {calendar.map(renderCalendarDay)}
          </div>

          {/* Divisor de recompensas */}
          <div style={styles.rewardsDivider}>
            <div style={styles.rewardsDividerLine} />
            <span style={styles.rewardsDividerText}>{TEXTS.streakRewards[activeLang]}</span>
            <div style={styles.rewardsDividerLine} />
          </div>

          {/* Milestones */}
          <div style={styles.milestonesRow}>
            {([7, 14, 21, 28] as const).map(renderMilestoneCard)}
          </div>

          {/* Footer info */}
          <div style={styles.footerInfo}>
            <div style={styles.footerItem}>
              <img src={ASSETS.iconTrophy} alt="" style={styles.footerIcon} />
              <span style={styles.footerText}>{TEXTS.recoveryTokens[activeLang]}:</span>
              <span style={styles.footerValue}>{makeUpTokens}/3</span>
            </div>
            <div style={styles.footerItem}>
              <span style={styles.footerText}>{TEXTS.monthlyReset[activeLang]}:</span>
              <span style={{ ...styles.footerValue, color: "#00E676" }}>{cycleResetDays} {TEXTS.days[activeLang]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAIS - Serao renderizados via AnimatePresence */}
      <AnimatePresence>
        {phase === "RESULT" && winningSegment && (
          <RewardOverlay
            key="reward"
            segment={winningSegment}
            multiplier={effectiveMultiplier}
            currencyName={effectiveCurrency}
            currentDay={currentDay}
            lang={activeLang}
            onCollect={handleCollect}
          />
        )}
        {phase === "MILESTONE" && (
          <MilestoneOverlay
            key="milestone"
            day={(streak) as 7 | 14 | 21 | 28}
            multiplier={effectiveMultiplier}
            currencyName={effectiveCurrency}
            lang={activeLang}
            onCollect={handleCollect}
          />
        )}
        {phase === "CLAIMED" && timer > 0 && (
          <ClaimedOverlay
            key="claimed"
            remainingMs={timer}
            lang={activeLang}
            onExpired={() => setPhase("IDLE")}
          />
        )}
      </AnimatePresence>

      {/* Modal de Ajuda — "Como funciona?" */}
      <HelpGameModal
        open={showHelp}
        onClose={() => setShowHelp(false)}
        lang={activeLang}
        gameTitle={activeLang === "br" ? "Giro Diario" : "Daily Spin"}
        sections={DAILY_FREE_HELP}
      />
    </div>
  );
}


