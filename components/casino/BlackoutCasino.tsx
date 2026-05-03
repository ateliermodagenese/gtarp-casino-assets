"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion, useMotionValue, useMotionTemplate } from "framer-motion";
import { UI } from "@/lib/assets";
import { GAMES, TAB_GAMES, TAB_LAYOUTS, TAB_HERO_GAMES } from "@/lib/games";
import { useCasino } from "@/contexts/CasinoContext";
import HeroCarousel from "./HeroCarousel";
import BentoGrid from "./BentoGrid";
import Dock from "./Dock";
import GoldParticles from "./GoldParticles";
import GameModal from "./GameModal";
import ComingSoon from "./ComingSoon";
import DepositModal from "./DepositModal";
import AdminPanel from "./AdminPanel";
import CasinoLogo from "./CasinoLogo";
import CasinoLoading from "./CasinoLoading";
import { useRipple } from "@/hooks/use-ripple";
import { useSoundManager } from "@/hooks/use-sound-manager";
import { useGameAPI } from "@/hooks/use-game-api";
import { useCurrencyConfig } from "@/hooks/use-currency-config";
import LuxuryTooltip from "@/components/shared/LuxuryTooltip";
import { CrashGame } from "@/components/games/crash";
import { AnimalGame } from "@/components/games/bicho";
import { SlotsGame } from "@/components/games/slots";
import { BlackjackGame } from "@/components/games/blackjack";
import { DailyFreeGame } from "@/components/games/daily-free";
import { RouletteGame } from "@/components/games/roulette";

export default function BlackoutCasino() {
  const { lang, setLang, activeTab, setActiveTab, selectedGame, setSelectedGame, activeGame, setActiveGame, saldo, setSaldo, isOpen, setIsOpen } = useCasino();
  const [panelSize, setPanelSize] = useState({ w: 0, h: 0 });
  const [showDeposit, setShowDeposit] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: -9999, y: -9999 });
  const [mouseXY, setMouseXY] = useState({ x: -9999, y: -9999 });

  // Atmosferas por aba — diferenças VISIVEIS ao trocar tab
  const ATMOSFERAS = [
    { name: "cassino",  particles: 50, speed: 1.0, green: 0.12, spark: 0.10, orb: 0.08,
      borderColor: "#D4A843", glowColor: "rgba(212,168,67,0.25)", overlayColor: "rgba(212,168,67,0.03)",
      spotColor: "rgba(212,168,67,0.06)", spotRadius: 350, scanColor: "rgba(212,168,67,0.3)", scanGlow: "rgba(212,168,67,0.15)" },
    { name: "arcade",   particles: 65, speed: 1.5, green: 0.10, spark: 0.20, orb: 0.05,
      borderColor: "#E8E8E8", glowColor: "rgba(255,255,255,0.2)", overlayColor: "rgba(255,255,255,0.02)",
      spotColor: "rgba(255,255,255,0.05)", spotRadius: 420, scanColor: "rgba(255,255,255,0.3)", scanGlow: "rgba(255,255,255,0.15)" },
    { name: "pvp",      particles: 40, speed: 1.0, green: 0.25, spark: 0.10, orb: 0.05,
      borderColor: "#2ECC71", glowColor: "rgba(0,230,118,0.25)", overlayColor: "rgba(0,230,118,0.035)",
      spotColor: "rgba(0,230,118,0.06)", spotRadius: 300, scanColor: "rgba(0,230,118,0.4)", scanGlow: "rgba(0,230,118,0.2)" },
    { name: "loja",     particles: 50, speed: 0.7, green: 0.08, spark: 0.08, orb: 0.20,
      borderColor: "#D4A843", glowColor: "rgba(212,168,67,0.3)", overlayColor: "rgba(212,168,67,0.04)",
      spotColor: "rgba(212,168,67,0.08)", spotRadius: 350, scanColor: "rgba(212,168,67,0.35)", scanGlow: "rgba(212,168,67,0.2)" },
    { name: "eventos",  particles: 70, speed: 1.6, green: 0.10, spark: 0.25, orb: 0.05,
      borderColor: "#FF8C00", glowColor: "rgba(255,140,0,0.3)", overlayColor: "rgba(255,140,0,0.03)",
      spotColor: "rgba(255,140,0,0.06)", spotRadius: 420, scanColor: "rgba(255,140,0,0.4)", scanGlow: "rgba(255,140,0,0.25)" },
  ];
  const atmos = ATMOSFERAS[activeTab] || ATMOSFERAS[0];

  const spotlightX = useMotionValue(0);
  const spotlightY = useMotionValue(0);
  const spotlightBg = useMotionTemplate`radial-gradient(circle ${atmos.spotRadius}px at ${spotlightX}px ${spotlightY}px, ${atmos.spotColor} 0%, transparent 70%)`;

  // ── FASE 8: Ripple + Sons ──
  const ripple = useRipple();
  const sound = useSoundManager();
  const { getSaldo, isFiveM } = useGameAPI();
  const { config: cc, formatCurrency } = useCurrencyConfig();

  // ESC hierarquico: fecha SO o overlay mais recente (LIFO — fonte #3 cssscript)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeGame) { setActiveGame(null); sound.play("click"); }
        else if (showAdmin) { setShowAdmin(false); sound.play("click"); }
        else if (showDeposit) { setShowDeposit(false); sound.play("click"); }
        else if (selectedGame) { setSelectedGame(null); sound.play("click"); }
        else {
          setIsOpen(false);
          fetch("https://bc_casino/casino:panel:close", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          }).catch(() => {});
        }
      }
      // SHIFT+F5: abre/fecha admin (atalho oculto)
      if (e.key === "F5" && e.shiftKey) {
        e.preventDefault();
        if (showAdmin) {
          setShowAdmin(false);
          sound.play("click");
        } else if (!selectedGame && !activeGame && !showDeposit) {
          setShowAdmin(true);
          sound.play("click");
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [activeGame, showAdmin, showDeposit, selectedGame]);

  // Prefetch saldo assim que o painel monta (antes da intro terminar)
  useEffect(() => {
    getSaldo().then((val) => {
      if (val != null && val !== 500) {
        setSaldo(val);
      }
    }).catch(() => {});
  }, []);

  // ── FASE 9: Sequencia cinematografica de entrada ──
  const [introStage, setIntroStage] = useState(0);
  const [showLoading, setShowLoading] = useState(false);
  const loadTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Loading + intro: FiveM=1200ms, web=500ms (useRef protege do StrictMode cleanup)
  useEffect(() => {
    if (!isOpen) { setIntroStage(0); setShowLoading(false); return; }
    loadTimers.current.forEach(clearTimeout);
    const dur = isFiveM ? 1200 : 500;
    setShowLoading(true);
    loadTimers.current = [
      setTimeout(() => setShowLoading(false), dur),
      setTimeout(() => setIntroStage(1), dur + 50),
      setTimeout(() => setIntroStage(2), dur + 150),
      setTimeout(() => setIntroStage(3), dur + 600),
      setTimeout(() => setIntroStage(4), dur + 850),
    ];
  }, [isOpen, isFiveM]);

  // Medir painel para Canvas
  useEffect(() => {
    const measure = () => {
      if (panelRef.current) {
        const r = panelRef.current.getBoundingClientRect();
        setPanelSize({ w: r.width, h: r.height });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // ── FASE 7: Rastrear mouse relativo ao painel (para partículas + spotlight) ──
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    let rafId = 0;
    const handleMove = (e: MouseEvent) => {
      const r = panel.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      mousePos.current = { x, y };
      // Spotlight (Framer Motion — sem re-render)
      spotlightX.set(x);
      spotlightY.set(y);
      // Partículas (state throttled via rAF)
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setMouseXY({ x, y }));
    };
    const handleLeave = () => {
      mousePos.current = { x: -9999, y: -9999 };
      setMouseXY({ x: -9999, y: -9999 });
    };
    panel.addEventListener("mousemove", handleMove);
    panel.addEventListener("mouseleave", handleLeave);
    return () => {
      panel.removeEventListener("mousemove", handleMove);
      panel.removeEventListener("mouseleave", handleLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Nao renderiza nada enquanto o casino estiver fechado
  if (!isOpen) return null;

  return (
    <>
      {/* LOADING SCREEN — aparece instantaneamente ao pressionar F5 */}
      <CasinoLoading visible={showLoading} />

      {/* CAMADA 0+1: OVERLAY ESCURO (fullscreen) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: introStage >= 1 ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed overflow-hidden"
        style={{
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.78)",
          fontFamily: "var(--font-cinzel)",
        }}
      >
        {/* Wrapper relativo para dock e letreiro posicionados na borda */}
        <div style={{ position: "relative" }}>
          {/* CAMADA 2+3: PAINEL FLUTUANTE */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={introStage >= 2 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.85, y: 40 }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`relative overflow-hidden animate-border-glow atmos-${atmos.name} panel-noise`}
            style={{
              width: "80vw",
              maxWidth: "1600px",
              height: "calc(80vw * 8 / 16)",
              maxHeight: "78vh",
              borderRadius: "18px",
              border: `1.5px solid ${atmos.borderColor}`,
              outline: `1.5px solid ${atmos.borderColor}55`,
              outlineOffset: "4px",
              boxShadow: `0 0 25px ${atmos.glowColor}, 0 0 50px ${atmos.glowColor}44, inset 0 0 60px rgba(0,0,0,0.4)`,
              transition: "border 0.6s ease, outline 0.6s ease, box-shadow 0.6s ease",
              backgroundImage: `url("${UI.bg}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "grid",
              gridTemplateRows: "1fr",
              gridTemplateColumns: "minmax(0, 1fr)",
              position: "relative",
            }}
          >
            {/* Mask the bottom border center where dock sits */}
            <div
              className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 z-[6] pointer-events-none"
              style={{
                width: "40%",
                height: "6px",
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.78) 15%, rgba(0,0,0,0.78) 85%, transparent 100%)",
              }}
            />

            {/* Escurecimento leve sobre o fundo */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[15px]"
              style={{ background: "rgba(0,0,0,0.15)", zIndex: 0 }}
            />
            {/* Vignette interna */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[18px]"
              style={{
                zIndex: 1,
                background:
                  "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)",
              }}
            />

            {/* FASE 7: Spotlight cursor — luz sutil segue o mouse */}
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-[18px]"
              style={{
                zIndex: 1,
                background: spotlightBg,
              }}
            />

            {/* Particulas douradas melhoradas */}
            <GoldParticles width={panelSize.w} height={panelSize.h} mouseX={mouseXY.x} mouseY={mouseXY.y} paused={activeGame !== null} maxCount={atmos.particles} speedMult={atmos.speed} greenProb={atmos.green} sparkProb={atmos.spark} orbProb={atmos.orb} />

            {/* Scan line HUD — cor muda por atmosfera */}
            <div
              className="absolute left-0 right-0 pointer-events-none animate-scanline"
              style={{
                height: "2px",
                background: `linear-gradient(90deg, transparent 5%, ${atmos.scanGlow} 20%, ${atmos.scanColor} 50%, ${atmos.scanGlow} 80%, transparent 95%)`,
                boxShadow: `0 0 8px ${atmos.scanGlow}, 0 0 16px ${atmos.scanGlow}`,
                zIndex: 3,
                transition: "background 0.5s ease, box-shadow 0.5s ease",
              }}
            />

            {/* Ambient tint — cor de fundo sutil por atmosfera */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${atmos.overlayColor} 0%, transparent 70%)`,
                zIndex: 1,
                transition: "background 0.8s ease",
                borderRadius: "18px",
              }}
            />

            {/* BENTO GRID — layout por aba (Fase 3) */}
            <BentoGrid
              games={TAB_GAMES[activeTab] || []}
              layout={TAB_LAYOUTS[activeTab] || "arcade"}
              lang={lang}
              onGameSelect={(game) => { sound.play("click"); setSelectedGame(game); }}
              heroContent={
                (TAB_HERO_GAMES[activeTab]?.length > 0) ? (
                  <HeroCarousel lang={lang} games={TAB_HERO_GAMES[activeTab]} onGameSelect={(game) => { sound.play("click"); setSelectedGame(game); }} activeTab={activeTab} />
                ) : undefined
              }
            />

            {/* BANDEIRAS — canto inferior esquerdo do painel */}
            <div
              style={{
                position: "absolute",
                bottom: "clamp(10px, 1.5vw, 20px)",
                left: "clamp(12px, 1.5vw, 24px)",
                zIndex: 15,
                display: "flex",
                gap: "clamp(5px, 0.5vw, 8px)",
                alignItems: "center",
              }}
            >
              {(
                [
                  ["br", UI.flagBR],
                  ["in", UI.flagEN],
                ] as const
              ).map(([key, src]) => (
                <motion.button
                  key={key}
                  onClick={() => { sound.play("click"); setLang(key as "br" | "in"); }}
                  whileHover={{
                    scale: 1.12,
                    filter: "brightness(1.2) drop-shadow(0 0 8px rgba(255,215,0,0.6))",
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer p-0 bg-transparent border-none"
                  title={key === "br" ? "Português" : "English"}
                  style={{
                    width: "clamp(22px, 2vw, 32px)",
                    height: "clamp(22px, 2vw, 32px)",
                    borderRadius: "50%",
                    overflow: "hidden",
                    filter:
                      lang === key
                        ? "brightness(1.1) drop-shadow(0 0 6px rgba(255,215,0,0.4))"
                        : "brightness(0.3) grayscale(0.8)",
                    transition: "filter 0.3s ease",
                  }}
                >
                  <img
                    src={src}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </motion.button>
              ))}
            </div>

            {/* SALDO GCoin — canto inferior direito do painel (clique abre deposito) */}
            <motion.button
              whileHover={{
                boxShadow:
                  "0 0 25px rgba(0,230,118,0.3), 0 0 15px rgba(212,168,67,0.4), inset 0 0 10px rgba(0,0,0,0.4)",
                borderColor: "rgba(0,230,118,0.8)",
                scale: 1.05,
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { sound.play("click"); setShowDeposit(true); }}
              title={lang === "br" ? `Depositar ou sacar ${cc.name}` : `Deposit or withdraw ${cc.name}`}
              className="bg-transparent p-0"
              style={{
                position: "absolute",
                bottom: "clamp(10px, 1.5vw, 20px)",
                right: "clamp(12px, 1.5vw, 24px)",
                zIndex: 15,
                background:
                  "linear-gradient(135deg, rgba(10,18,8,0.95), rgba(5,12,3,0.98))",
                border: "1.5px solid rgba(212,168,67,0.6)",
                borderRadius: "12px",
                padding: "6px 16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow:
                  "0 0 15px rgba(212,168,67,0.2), inset 0 1px 0 rgba(255,215,0,0.1), inset 0 0 10px rgba(0,0,0,0.4)",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(11px, 1.2vw, 17px)",
                  color: "#00E676",
                  fontWeight: 700,
                  textShadow: "0 0 10px rgba(0,230,118,0.5), 0 0 20px rgba(0,230,118,0.2)",
                  letterSpacing: "1.5px",
                }}
              >
                {saldo.toLocaleString(lang === "br" ? "pt-BR" : "en-US")}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "clamp(7px, 0.7vw, 10px)",
                  color: "rgba(212,168,67,0.7)",
                  fontWeight: 600,
                  letterSpacing: "2px",
                  marginLeft: "-4px",
                }}
              >
                {cc.symbol}
              </span>
            </motion.button>

            {/* GAME LOADING SCREEN — dentro do painel, cobre tudo */}
            <AnimatePresence>
              {selectedGame && !activeGame && (
                <GameModal
                  game={selectedGame}
                  lang={lang}
                  onClose={() => { sound.play("click"); setSelectedGame(null); }}
                  onPlay={() => {
                    sound.play("success");
                    const name = selectedGame.cardName.toLowerCase();
                    setActiveGame(name);
                    setSelectedGame(null);
                  }}
                />
              )}
            </AnimatePresence>

            {/* JOGO ATIVO — renderiza DENTRO do painel, cobrindo tudo */}
            <AnimatePresence mode="wait">
              {activeGame === "crash" && (
                <CrashGame
                  key="crash"
                  onBack={() => setActiveGame(null)}
                />
              )}
              {activeGame === "anima-game" && (
                <AnimalGame
                  key="anima-game"
                  onBack={() => setActiveGame(null)}
                  onDeposit={() => setShowDeposit(true)}
                />
              )}
              {activeGame === "slots" && (
                <SlotsGame
                  key="slots"
                  onBack={() => setActiveGame(null)}
                  onDeposit={() => setShowDeposit(true)}
                />
              )}
              {activeGame === "blackjack" && (
                <BlackjackGame
                  key="blackjack"
                  onBack={() => setActiveGame(null)}
                  onDeposit={() => setShowDeposit(true)}
                />
              )}
              {activeGame === "daily-free" && (
                <DailyFreeGame
                  key="daily-free"
                  onBack={() => setActiveGame(null)}
                  onDeposit={() => setShowDeposit(true)}
                />
              )}
              {activeGame === "roulette" && (
                <RouletteGame
                  key="roulette"
                  onBack={() => setActiveGame(null)}
                  onDeposit={() => setShowDeposit(true)}
                />
              )}
              {activeGame && activeGame !== "crash" && activeGame !== "anima-game" && activeGame !== "slots" && activeGame !== "blackjack" && activeGame !== "daily-free" && activeGame !== "roulette" && (
                <ComingSoon
                  key={activeGame}
                  onBack={() => setActiveGame(null)}
                />
              )}
            </AnimatePresence>

            {/* Light leak — cor muda por atmosfera */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: "-15%",
                right: "-8%",
                width: "35%",
                height: "50%",
                background: `radial-gradient(ellipse at center, ${atmos.glowColor} 0%, transparent 70%)`,
                filter: "blur(30px)",
                animation: "light-leak-drift 12s ease-in-out infinite",
                zIndex: 1,
                transition: "background 0.8s ease",
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: "-10%",
                left: "-6%",
                width: "30%",
                height: "40%",
                background: `radial-gradient(ellipse at center, ${atmos.overlayColor} 0%, transparent 70%)`,
                filter: "blur(25px)",
                animation: "light-leak-drift 15s ease-in-out infinite reverse",
                zIndex: 1,
                transition: "background 0.8s ease",
              }}
            />
          </motion.div>

          {/* DEPOSITO — modal de depositar/sacar GCoin */}
          <AnimatePresence>
            {showDeposit && (
              <DepositModal onClose={() => setShowDeposit(false)} />
            )}
          </AnimatePresence>

          {/* ADMIN PANEL */}
          <AnimatePresence>
            {showAdmin && (
              <AdminPanel onClose={() => setShowAdmin(false)} lang={lang} />
            )}
          </AnimatePresence>

          {/* LOGO BLACKOUT CASINO — escudo cravado na borda esquerda, so na aba CASSINO */}
          <CasinoLogo visible={introStage >= 3 && activeTab === 0 && !selectedGame && !activeGame && !showDeposit && !showAdmin} />

          {/* LETREIRO -- fora do painel, na borda entre header e hero */}
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "50%",
              transform: "translate(-50%, -60%)",
              width: "clamp(200px, 28vw, 420px)",
              zIndex: 20,
              pointerEvents: "none",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: -35, scale: 0.8 }}
              animate={
                (selectedGame || activeGame || showDeposit || showAdmin)
                  ? { opacity: 0, y: -20, scale: 0.9 }
                  : introStage >= 3
                    ? { opacity: 1, y: 0, scale: 1 }
                    : { opacity: 0, y: -35, scale: 0.8 }
              }
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
            <div style={{ position: "relative" }}>
              {/* FASE 2: Halo dourado pulsante atrás do letreiro */}
              <div
                className="letreiro-halo"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "160%",
                  height: "250%",
                  background: "radial-gradient(ellipse at center, rgba(212,168,67,0.3) 0%, rgba(255,215,0,0.1) 30%, rgba(212,168,67,0.04) 50%, transparent 70%)",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />
              <img
                src={UI.letreiro}
                alt="Letreiro"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  filter: "drop-shadow(0 0 12px rgba(212,168,67,0.4)) drop-shadow(0 0 25px rgba(212,168,67,0.15))",
                  position: "relative",
                  zIndex: 1,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  paddingBottom: "20px",
                  overflow: "hidden",
                  zIndex: 2,
                  maskImage: "linear-gradient(90deg, transparent 0%, #000 15%, #000 85%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 15%, #000 85%, transparent 100%)",
                }}
              >
                <div
                  className="animate-marquee"
                  style={{ whiteSpace: "nowrap" }}
                >
                  {[0, 1].map((copy) => (
                    <span
                      key={copy}
                      style={{
                        fontFamily: "var(--font-cinzel)",
                        fontWeight: 700,
                        fontSize: "clamp(9px, 1.3vw, 18px)",
                        color: "#FFD700",
                        textShadow:
                          "0 0 12px rgba(255,215,0,0.6), 0 0 30px rgba(255,215,0,0.2)",
                        letterSpacing: "3px",
                        paddingRight: "80px",
                      }}
                    >
                      {lang === "br"
                        ? "✦ BLACKOUT CASINO ✦ O CASSINO MAIS EXCLUSIVO DE LOS SANTOS ✦ FORTUNA FAVORECE OS AUDACIOSOS ✦ VIP UNDERGROUND ✦ ONDE LENDAS SÃO FEITAS ✦ HIGH STAKES ✦ SEM LIMITES ✦"
                        : "✦ BLACKOUT CASINO ✦ THE MOST EXCLUSIVE CASINO IN LOS SANTOS ✦ FORTUNE FAVORS THE BOLD ✦ VIP UNDERGROUND ✦ WHERE LEGENDS ARE MADE ✦ HIGH STAKES ✦ NO LIMITS ✦"
                      }
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
          </div>

          {/* DOCK -- posicionado NA borda inferior */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translate(-50%, 42%)",
              width: "60%",
              zIndex: 20,
              pointerEvents: (selectedGame || activeGame || showDeposit || showAdmin) ? "none" : "auto",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={
                (selectedGame || activeGame || showDeposit || showAdmin)
                  ? { opacity: 0, y: 40, scale: 0.9 }
                  : introStage >= 4
                    ? { opacity: 1, y: 0, scale: 1 }
                    : { opacity: 0, y: 50, scale: 0.9 }
              }
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
            <Dock
              lang={lang}
              activeTab={activeTab}
              setActiveTab={(tab) => { sound.play("tab"); setActiveTab(tab); }}
            />
          </motion.div>
          </div>
        </div>
      </motion.div>

    </>
  );
}
