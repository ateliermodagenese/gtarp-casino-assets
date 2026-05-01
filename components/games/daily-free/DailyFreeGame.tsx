"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameHeader } from "@/components/shared";
import RewardOverlay from "./RewardOverlay";
import MilestoneOverlay from "./MilestoneOverlay";
import ClaimedOverlay from "./ClaimedOverlay";

// ===========================================================================
// DAILY-FREE (#19) — Blackout Casino GTARP
// Bônus diário gratuito com roda da fortuna e streak de 28 dias
// CSS inline, zero Tailwind, Framer Motion
// ===========================================================================

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
  // Estado
  const [phase, setPhase] = useState<GamePhase>(canSpin ? "IDLE" : "CLAIMED");
  const [streak, setStreak] = useState(initialStreak);
  const [currentDay, setCurrentDay] = useState(initialDay);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [winningSegment, setWinningSegment] = useState<WheelSegment | null>(null);
  const [timer, setTimer] = useState(remainingMs);
  const [isHoveringWheel, setIsHoveringWheel] = useState(false);
  const [isHoveringSpin, setIsHoveringSpin] = useState(false);
  
  // Refs
  const wheelRef = useRef<HTMLDivElement>(null);
  const spinButtonRef = useRef<HTMLButtonElement>(null);
  
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
  const handleSpin = useCallback(() => {
    if (phase !== "IDLE") return;
    
    setPhase("SPINNING");
    
    // Sortear segmento baseado em probabilidades
    const rand = Math.random() * 100;
    let selectedSegment: WheelSegment;
    
    if (rand < 64) {
      // Common (64%)
      const commons = WHEEL_SEGMENTS.filter(s => s.tier === "common");
      selectedSegment = commons[Math.floor(Math.random() * commons.length)];
    } else if (rand < 88) {
      // Good (24%)
      const goods = WHEEL_SEGMENTS.filter(s => s.tier === "good");
      selectedSegment = goods[Math.floor(Math.random() * goods.length)];
    } else if (rand < 96) {
      // Big (8%)
      selectedSegment = WHEEL_SEGMENTS.find(s => s.tier === "big")!;
    } else {
      // Mystery (4%)
      selectedSegment = WHEEL_SEGMENTS.find(s => s.tier === "mystery")!;
    }
    
    setWinningSegment(selectedSegment);
    
    // Calcular angulo final (5-8 voltas + angulo do segmento)
    const spins = 5 + Math.random() * 3;
    const targetAngle = spins * 360 + (360 - selectedSegment.angle);
    
    setWheelRotation(prev => prev + targetAngle);
    
    // Timeout para resultado
    setTimeout(() => {
      const newStreak = streak + 1;
      const newDay = currentDay;
      
      // Verificar milestone
      if ([7, 14, 21, 28].includes(newStreak)) {
        setStreak(newStreak);
        setPhase("MILESTONE");
      } else {
        setStreak(newStreak);
        setPhase("RESULT");
      }
    }, 5000);
  }, [phase, streak, currentDay]);

  // Handler de coletar premio
  const handleCollect = useCallback(() => {
    setPhase("CLAIMED");
    setTimer(24 * 60 * 60 * 1000); // 24h
    // Aqui seria a chamada real ao servidor
  }, []);

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
      overflow: "hidden",
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
      transition: phase === "SPINNING" ? "none" : "transform 0.3s ease-out",
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
          <span style={styles.milestoneAmount}>{bonus}</span>
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
      `}</style>

      {/* Header */}
      <GameHeader
        title={TEXTS.title[lang]}
        onBack={onBack}
        lang={lang}
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
              <span style={styles.streakLabel}>{TEXTS.streakCurrent[lang]}</span>
              <span style={styles.streakValue}>{streak}</span>
              <span style={styles.streakDays}>{TEXTS.days[lang]}</span>
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

            {/* Roda base (gira) */}
            <motion.img
              src={ASSETS.wheelBase}
              alt="Wheel"
              style={styles.wheelBase}
              animate={{ rotate: wheelRotation }}
              transition={{
                duration: phase === "SPINNING" ? 5 : 0.3,
                ease: phase === "SPINNING" ? [0.2, 0.8, 0.3, 1] : "easeOut",
              }}
            />

            {/* Moldura (estatica) */}
            <img
              src={ASSETS.wheelMoldura}
              alt=""
              style={styles.wheelMoldura}
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
              {TEXTS.spin[lang]}
            </motion.button>
            <span style={styles.spinSubtext}>{TEXTS.freeSpinPerDay[lang]}</span>
          </div>

          {/* Info e Timer */}
          <div style={styles.bottomInfo}>
            <button style={styles.howItWorksBtn}>
              <img src={ASSETS.iconInfo} alt="" style={styles.howItWorksIcon} />
              <span style={styles.howItWorksText}>{TEXTS.howItWorks[lang]}</span>
            </button>

            {phase === "CLAIMED" && timer > 0 && (
              <div style={styles.timerBox}>
                <span style={styles.timerLabel}>{TEXTS.nextSpinIn[lang]}</span>
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
              {TEXTS.dayOf[lang]} {currentDay} {TEXTS.of28[lang]}
            </span>
            <div style={styles.calendarDivider} />
          </div>

          {/* Header da semana */}
          <div style={styles.weekHeader}>
            {TEXTS.weekDays[lang].map((day, i) => (
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
            <span style={styles.rewardsDividerText}>{TEXTS.streakRewards[lang]}</span>
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
              <span style={styles.footerText}>{TEXTS.recoveryTokens[lang]}:</span>
              <span style={styles.footerValue}>{makeUpTokens}/3</span>
            </div>
            <div style={styles.footerItem}>
              <span style={styles.footerText}>{TEXTS.monthlyReset[lang]}:</span>
              <span style={{ ...styles.footerValue, color: "#00E676" }}>{cycleResetDays} {TEXTS.days[lang]}</span>
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
            multiplier={multiplier}
            currencyName={currencyName}
            currentDay={currentDay}
            lang={lang}
            onCollect={handleCollect}
          />
        )}
        {phase === "MILESTONE" && (
          <MilestoneOverlay
            key="milestone"
            day={(streak) as 7 | 14 | 21 | 28}
            multiplier={multiplier}
            currencyName={currencyName}
            lang={lang}
            onCollect={handleCollect}
          />
        )}
        {phase === "CLAIMED" && timer > 0 && (
          <ClaimedOverlay
            key="claimed"
            remainingMs={timer}
            lang={lang}
            onExpired={() => setPhase("IDLE")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


