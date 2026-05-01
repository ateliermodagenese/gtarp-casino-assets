"use client";

// DailyFreeGame — Orquestrador final do Daily-Free (#19)
// F3.H - 30/04/2026
//
// Junta todos os 7 subcomponentes premium em uma tela so:
//   - GameHeader (shared)         - topo com saldo + botoes acao
//   - WheelComponent              - roleta luxo PNG AAA + SVG
//   - CalendarGrid                - 7x4 com badges PNG nos milestones
//   - StreakCounter               - footer triplo (sequencia + countdown + ajuda)
//   - RewardOverlay               - modal "PARABENS!" pos-spin
//   - ClaimedState                - estado "volte amanha" se ja claimou
//   - HelpGameModal (shared)      - ajuda bilingue com sidebar
//
// Maquina de estados: loading → idle → spinning → result → claimed
// Usa hook use-daily-api (auto-detecta FiveM vs browser → mock)
//
// Layout split 50/50: wheel a esquerda, calendar a direita (estilo Imagem 8/9)
// Mobile responsivo: stack vertical em telas <= 900px

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GameHeader,
  HelpGameModal,
  HistoryModal,
  ProvablyFairModal,
} from "@/components/shared";
import type {
  HistoryColumn,
  PFData,
} from "@/components/shared";
import { useCasino } from "@/contexts/CasinoContext";
import { useDailyAPI, type DailyState, type DailyClaimResult, type DailyHistoryItem } from "@/hooks/use-daily-api";
import WheelComponent from "./WheelComponent";
import CalendarGrid from "./CalendarGrid";
import StreakCounter from "./StreakCounter";
import RewardOverlay from "./RewardOverlay";
import ClaimedState from "./ClaimedState";
import { DAILY_FREE_HELP_SECTIONS } from "./DailyFreeHelpSections";

interface DailyFreeGameProps {
  onBack: () => void;
}

type GameScreen = "loading" | "idle" | "spinning" | "result" | "claimed";

const GOLD = {
  primary: "#D4A843",
  light: "#FFD700",
  dark: "#8B6914",
  glow: "rgba(212,168,67,0.45)",
};

const EMERALD = {
  primary: "#00C853",
  light: "#00E676",
  glow: "rgba(0,230,118,0.4)",
};

export default function DailyFreeGame({ onBack }: DailyFreeGameProps) {
  const { lang, saldo, setSaldo } = useCasino();
  const api = useDailyAPI();

  // Estado da tela
  const [screen, setScreen] = useState<GameScreen>("loading");

  // Estado do jogo (vem do server)
  const [state, setState] = useState<DailyState | null>(null);

  // Resultado do ultimo claim (passado pra RewardOverlay)
  const [lastClaim, setLastClaim] = useState<DailyClaimResult | null>(null);

  // Modais auxiliares
  const [showHelp, setShowHelp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPF, setShowPF] = useState(false);

  // Historico (carregado on-demand quando abrir modal)
  const [historyData, setHistoryData] = useState<DailyHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Provably Fair: dados editaveis pelo usuario
  const [pfClientSeed, setPfClientSeed] = useState<string>("");
  const [pfRevealedSeed, setPfRevealedSeed] = useState<string>("");
  const [pfIsValid, setPfIsValid] = useState<boolean | null>(null);
  const [pfVerifying, setPfVerifying] = useState(false);
  const [pfRotating, setPfRotating] = useState(false);
  const [pfClientSeedChanged, setPfClientSeedChanged] = useState(false);
  const [pfVerifyDetails, setPfVerifyDetails] = useState<{ committedHash: string; recalculatedHash: string; match: boolean } | null>(null);

  // Erro (se houver)
  const [error, setError] = useState<string | null>(null);

  // Ref pra detectar se componente foi desmontado (evita setState apos unmount)
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ============================================================
  // CARREGAR ESTADO INICIAL
  // ============================================================
  const loadState = useCallback(async () => {
    try {
      const newState = await api.getState();
      if (!mountedRef.current) return;

      if (!newState.ok) {
        setError("server_error");
        return;
      }

      setState(newState);
      setSaldo(newState.saldo);

      // Decide tela inicial:
      // - Se NAO pode claim (cooldown ativo) → ClaimedState
      // - Se pode claim → idle
      if (newState.can_claim) {
        setScreen("idle");
      } else {
        setScreen("claimed");
      }
    } catch (err) {
      console.error("[DailyFree] loadState error:", err);
      if (mountedRef.current) setError("network_error");
    }
  }, [api, setSaldo]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  // ============================================================
  // HANDLER: GIRAR (chama claim no server)
  // ============================================================
  const handleSpin = useCallback(async () => {
    if (!state || !state.can_claim || screen !== "idle") return;

    setScreen("spinning");
    try {
      const result = await api.claim();
      if (!mountedRef.current) return;

      if (!result.ok) {
        setError("claim_failed");
        setScreen("idle");
        return;
      }

      // Salva resultado pro RewardOverlay
      setLastClaim(result);

      // A wheel vai animar girando ate o segment_id retornado pelo server.
      // Quando o spin terminar, WheelComponent dispara onSpinComplete →
      // a gente troca pra screen "result" mostrando o RewardOverlay.
      // (Estamos em "spinning" enquanto a animacao roda)
    } catch (err) {
      console.error("[DailyFree] claim error:", err);
      if (mountedRef.current) {
        setError("network_error");
        setScreen("idle");
      }
    }
  }, [api, state, screen]);

  // ============================================================
  // HANDLER: WheelComponent terminou de girar → mostra RewardOverlay
  // ============================================================
  const handleSpinComplete = useCallback(() => {
    if (lastClaim) {
      setScreen("result");
    }
  }, [lastClaim]);

  // ============================================================
  // HANDLER: jogador coletou o premio do RewardOverlay
  // ============================================================
  const handleCollect = useCallback(async () => {
    setLastClaim(null);
    // Re-fetch state pra atualizar saldo, streak, cooldown
    await loadState();
  }, [loadState]);

  // ============================================================
  // HANDLER: cooldown expirou → re-fetch (ja pode girar de novo)
  // ============================================================
  const handleCooldownExpired = useCallback(() => {
    loadState();
  }, [loadState]);

  // ============================================================
  // FIX 30/04/2026: Handlers Help/PF/Historico (BC: "padrao tem
  // sistema de ajuda, tem provably fair, tem historico")
  // ============================================================

  // Inicializa client seed quando state carrega
  useEffect(() => {
    if (state?.wheel?.client_seed && !pfClientSeed) {
      setPfClientSeed(state.wheel.client_seed);
    }
  }, [state?.wheel?.client_seed, pfClientSeed]);

  // Carrega historico ao abrir modal (lazy)
  const openHistory = useCallback(async () => {
    setShowHistory(true);
    if (historyData.length === 0 && !historyLoading) {
      setHistoryLoading(true);
      try {
        const res = await api.getHistory(50, 0);
        if (mountedRef.current && res?.ok && res.items) {
          setHistoryData(res.items);
        }
      } catch (err) {
        console.error("[DailyFree] history fetch error:", err);
      } finally {
        if (mountedRef.current) setHistoryLoading(false);
      }
    }
  }, [api, historyData.length, historyLoading]);

  const closeHistory = useCallback(() => setShowHistory(false), []);
  const closePF = useCallback(() => setShowPF(false), []);

  // PF: usuario edita client seed
  const handleClientSeedChange = useCallback((seed: string) => {
    setPfClientSeed(seed);
    setPfClientSeedChanged(true);
  }, []);

  // PF: rotacionar seed (chama backend)
  const handlePfRotate = useCallback(async () => {
    if (pfRotating) return;
    setPfRotating(true);
    try {
      const res = await api.rotateSeed(pfClientSeed);
      if (mountedRef.current && res?.ok) {
        // Reset state - server gera novo server_seed_hash
        setPfClientSeedChanged(false);
        // Recarrega state pra pegar novo hash
        await loadState();
      }
    } catch (err) {
      console.error("[DailyFree] rotate seed error:", err);
    } finally {
      if (mountedRef.current) setPfRotating(false);
    }
  }, [api, pfClientSeed, pfRotating, loadState]);

  // PF: verificar resultado do ultimo claim
  const handlePfVerify = useCallback(async () => {
    if (pfVerifying || !lastClaim?.claim_id) return;
    setPfVerifying(true);
    setPfIsValid(null);
    try {
      const res = await api.verifyClaim(lastClaim.claim_id);
      if (mountedRef.current && res?.ok) {
        const verified = res.verified === true;
        setPfIsValid(verified);
        setPfRevealedSeed(res.server_seed || "");
        setPfVerifyDetails({
          committedHash: res.server_seed_hash || "",
          recalculatedHash: res.recalculated_hash || "",
          match: verified,
        });
      } else {
        setPfIsValid(false);
      }
    } catch (err) {
      console.error("[DailyFree] verify error:", err);
      if (mountedRef.current) setPfIsValid(false);
    } finally {
      if (mountedRef.current) setPfVerifying(false);
    }
  }, [api, lastClaim?.claim_id, pfVerifying]);

  // PF: dados consolidados pro modal
  const pfData: PFData = useMemo(() => ({
    serverSeedHash: state?.wheel?.server_seed_hash || "",
    clientSeed: pfClientSeed,
    nonce: state?.wheel?.next_nonce ?? 0,
    serverSeed: pfRevealedSeed,
    isValid: pfIsValid,
  }), [state?.wheel?.server_seed_hash, pfClientSeed, state?.wheel?.next_nonce, pfRevealedSeed, pfIsValid]);

  // Historico: colunas formatadas (Cinzel + ouro/verde)
  const historyColumns: HistoryColumn<DailyHistoryItem>[] = useMemo(() => [
    {
      id: "created_at",
      label: lang === "br" ? "DATA" : "DATE",
      render: (row) => {
        const d = new Date(row.created_at);
        const dia = String(d.getDate()).padStart(2, "0");
        const mes = String(d.getMonth() + 1).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `${dia}/${mes} ${hh}:${mm}`;
      },
      width: "20%",
    },
    {
      id: "wheel_segment_tier",
      label: lang === "br" ? "PREMIO" : "PRIZE",
      render: (row) => {
        const tierLabels: Record<string, string> = {
          common: lang === "br" ? "Comum" : "Common",
          good: lang === "br" ? "Bom" : "Good",
          big: lang === "br" ? "Grande" : "Big",
          mystery: lang === "br" ? "Misterio" : "Mystery",
        };
        return tierLabels[row.wheel_segment_tier] || row.wheel_segment_tier;
      },
      width: "20%",
    },
    {
      id: "streak_at_claim",
      label: lang === "br" ? "DIA" : "DAY",
      render: (row) => `D${row.cycle_day_at_claim}`,
      width: "15%",
      align: "center",
    },
    {
      id: "total_awarded",
      label: lang === "br" ? "VALOR" : "AMOUNT",
      render: (row) => (
        <span style={{
          color: "#00E676",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
        }}>
          +{row.total_awarded.toLocaleString()} GC
        </span>
      ),
      width: "25%",
      align: "right",
    },
    {
      id: "milestone_bonus",
      label: lang === "br" ? "BONUS" : "BONUS",
      render: (row) => row.milestone_day
        ? `D${row.milestone_day}: +${row.milestone_bonus}`
        : "—",
      width: "20%",
      align: "right",
    },
  ], [lang]);

  // ============================================================
  // RENDER
  // ============================================================

  // Tela LOADING (carregando estado inicial)
  if (screen === "loading" || !state) {
    return (
      <Container>
        <GameHeader
          onBack={onBack}
          title={lang === "br" ? "DAILY-FREE" : "DAILY-FREE"}
          balance={saldo}
          lang={lang}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: GOLD.primary,
            fontFamily: "'Cinzel', serif",
            fontSize: "clamp(14px, 1.4vw, 18px)",
            letterSpacing: "2px",
          }}
        >
          {error
            ? lang === "br"
              ? "Erro ao carregar..."
              : "Loading error..."
            : lang === "br"
              ? "Carregando..."
              : "Loading..."}
        </div>
      </Container>
    );
  }

  // Tela CLAIMED (volte amanha)
  if (screen === "claimed") {
    return (
      <Container>
        <GameHeader
          onBack={onBack}
          title={lang === "br" ? "DAILY-FREE" : "DAILY-FREE"}
          balance={saldo}
          lang={lang}
          actions={[
            {
              id: "help",
              icon: "/assets/shared/icons/icon-info.png",
              tooltip: lang === "br" ? "Como funciona" : "How it works",
              onClick: () => setShowHelp(true),
            },
            {
              id: "history",
              icon: "/assets/shared/icons/icon-history.png",
              tooltip: lang === "br" ? "Historico" : "History",
              onClick: openHistory,
            },
            {
              id: "pf",
              icon: "/assets/shared/icons/icon-provably-fair.png",
              tooltip: "Provably Fair",
              onClick: () => setShowPF(true),
            },
          ]}
        />
        <ClaimedState
          lastClaimAt={state.streak.last_claim_at!}
          cooldownHours={state.config.cooldown_hours}
          currentStreak={state.streak.current}
          lang={lang}
          onCooldownExpired={handleCooldownExpired}
        />
        <HelpGameModal
          open={showHelp}
          onClose={() => setShowHelp(false)}
          lang={lang}
          gameTitle={lang === "br" ? "Bonus Diario" : "Daily Free"}
          gameLogo="/assets/games/daily-free/logo-mini.png"
          sections={DAILY_FREE_HELP_SECTIONS}
          escId="daily-free-help"
        />
        {/* Modais Historico e PF tambem disponiveis no estado claimed */}
        <HistoryModal
          open={showHistory}
          onClose={closeHistory}
          title={lang === "br" ? "HISTORICO DAILY-FREE" : "DAILY-FREE HISTORY"}
          lang={lang === "en" ? "in" : lang as "br"}
          columns={historyColumns}
          data={historyData}
          loading={historyLoading}
          emptyMessage={lang === "br" ? "Nenhum giro ainda" : "No spins yet"}
        />
        <ProvablyFairModal
          open={showPF}
          onClose={closePF}
          lang={lang === "en" ? "in" : lang as "br"}
          pfData={pfData}
          onClientSeedChange={handleClientSeedChange}
          onVerify={handlePfVerify}
          onRotateSeed={handlePfRotate}
          verifying={pfVerifying}
          rotating={pfRotating}
          clientSeedChanged={pfClientSeedChanged}
          verifyDetails={pfVerifyDetails}
          unverifiedCount={state?.wheel?.next_nonce ?? 0}
        />
      </Container>
    );
  }

  // ====== Tela IDLE / SPINNING / RESULT (compartilham mesmo layout) ======

  // Para o WheelComponent: passa o segment_id vencedor APENAS quando estivermos em spinning
  // (em idle e result, passa null pra wheel ficar parada)
  const winningSegmentId =
    screen === "spinning" && lastClaim ? lastClaim.result.segment_id : null;

  return (
    <Container>
      <GameHeader
        onBack={onBack}
        title={lang === "br" ? "DAILY-FREE" : "DAILY-FREE"}
        balance={saldo}
        lang={lang}
        actions={[
          {
            id: "help",
            icon: "/assets/shared/icons/icon-info.png",
            tooltip: lang === "br" ? "Como funciona" : "How it works",
            onClick: () => setShowHelp(true),
          },
          {
            id: "history",
            icon: "/assets/shared/icons/icon-history.png",
            tooltip: lang === "br" ? "Historico" : "History",
            onClick: openHistory,
          },
          {
            id: "pf",
            icon: "/assets/shared/icons/icon-provably-fair.png",
            tooltip: "Provably Fair",
            onClick: () => setShowPF(true),
          },
        ]}
      />

      {/* ============== AREA DE JOGO ============== */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "clamp(14px, 2vw, 24px)",
          padding: "clamp(14px, 2vw, 28px)",
          overflow: "auto",
        }}
      >
        {/* SPLIT 50/50: WHEEL | CALENDAR (responsivo via CSS grid) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(14px, 2vw, 24px)",
            // Mobile responsivo: < 900px vira coluna unica
            // (controlado por CSS no Container abaixo)
          }}
          className="daily-free-split"
        >
          {/* COLUNA 1: WHEEL + BOTAO GIRAR */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "clamp(14px, 2vw, 24px)",
              padding: "clamp(14px, 2vw, 24px)",
              background:
                "linear-gradient(180deg, rgba(15,12,8,0.6) 0%, rgba(8,7,6,0.8) 100%)",
              // FIX 30/04/2026: borda dupla com halo (DOUBLE OUTLINE pattern
              // §1.3 do GUIA-VISUAL). border principal + outline com offset
              // = sensacao de "anel duplo" / convite de casamento luxury.
              // Funciona em CEF 103 (CSS classico).
              border: `1.5px solid ${GOLD.primary}`,
              outline: `1px solid rgba(212,168,67,0.25)`,
              outlineOffset: "4px",
              borderRadius: "14px",
              boxShadow: [
                // Glow expansivo dourado (multi-camada — regra #13 efeitos AAA)
                `0 0 25px rgba(212,168,67,0.20)`,
                `0 0 50px rgba(212,168,67,0.10)`,
                // Inset shimmer topo (metalizado)
                "inset 0 1px 2px rgba(255,215,0,0.12)",
                // Drop shadow profundo
                "0 8px 24px rgba(0,0,0,0.5)",
                // Vinheta interna (atmosfera)
                "inset 0 0 60px rgba(0,0,0,0.4)",
              ].join(", "),
              minHeight: "clamp(360px, 42vw, 520px)",
            }}
          >
            <WheelComponent
              segments={state.wheel.segments}
              winningSegmentId={winningSegmentId}
              onSpinComplete={handleSpinComplete}
              size="clamp(340px, 40vw, 540px)"
            />

            {/* BOTAO GIRAR (so visivel em idle) */}
            {/*
              FIX 30/04/2026: Botao GIRAR redesenhado seguindo padroes premium
              dos guias visuais (GUIA-VISUAL-EFEITOS-PREMIUM.md + X0-DESIGN-
              PATTERNS-AVANCADOS.md). Mood "Casino Luxury":
              - Cinzel weight 800 + letter-spacing 0.18em (tracking CAPS premium)
              - Borda dupla com halo dourado (DOUBLE OUTLINE pattern §1.3)
              - Background gradient esmeralda dramatico com bevel ::before topo
              - Shine sweep no hover (pattern §2.3) — listra de luz atravessa
              - Spring bounce no tap (microinteracao §10.2) com scale 0.92
              - Glow pulsante GPU-friendly (so transform + opacity = 60fps)
              - 2 camadas: container externo (halo dourado) + botao interno (CTA)
            */}
            <AnimatePresence mode="wait">
              {screen === "idle" && (
                <motion.div
                  key="spin-button-wrapper"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: "relative",
                    display: "inline-block",
                    // Halo dourado externo (DOUBLE OUTLINE pattern §1.3)
                    padding: "3px",
                    borderRadius: "14px",
                    background: `linear-gradient(135deg, ${GOLD.dark} 0%, ${GOLD.primary} 50%, ${GOLD.dark} 100%)`,
                    boxShadow: [
                      // Halo expansivo dourado pulsante (multi-camada)
                      `0 0 28px ${GOLD.glow}`,
                      `0 0 56px rgba(212,168,67,0.18)`,
                      // Drop shadow profundo
                      `0 6px 18px rgba(0,0,0,0.55)`,
                      // Inset shimmer dourado topo (efeito metalizado)
                      `inset 0 1.5px 0 rgba(255,215,0,0.4)`,
                    ].join(", "),
                    // Glow pulsante via animation keyframe (GPU - so transform/box-shadow)
                    animation: "spinBtnHalo 2.4s ease-in-out infinite",
                  }}
                >
                  <motion.button
                    onClick={handleSpin}
                    // Hover: shine sweep + scale sutil
                    whileHover="hover"
                    // Tap: spring bounce dramatico (§10.2)
                    whileTap={{ scale: 0.92 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 15,
                    }}
                    variants={{
                      hover: { scale: 1.04 },
                    }}
                    style={{
                      // Reset
                      border: "none",
                      outline: "none",
                      cursor: "pointer",
                      // Layout
                      padding: "clamp(14px, 1.9vw, 22px) clamp(56px, 8vw, 96px)",
                      borderRadius: "11px",
                      minWidth: "clamp(200px, 24vw, 300px)",
                      // Background gradient esmeralda dramatico (3 stops)
                      background: `linear-gradient(180deg,
                        ${EMERALD.light} 0%,
                        ${EMERALD.primary} 45%,
                        #006A2A 100%)`,
                      // Tipografia premium
                      fontFamily: "'Cinzel', 'Cinzel Decorative', serif",
                      fontWeight: 800,
                      fontSize: "clamp(17px, 2vw, 24px)",
                      color: "#FFFFFF",
                      // Tracking premium em CAPS (+0.18em do guia)
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      textShadow: [
                        "0 2px 4px rgba(0,0,0,0.6)",
                        "0 0 14px rgba(0,230,118,0.5)",
                        "0 0 24px rgba(0,230,118,0.3)",
                      ].join(", "),
                      // Box shadow inset = bevel (luz topo + sombra base)
                      boxShadow: [
                        // Inset bevel topo (clarear topo do botao = ilusao 3D)
                        "inset 0 1px 0 rgba(255,255,255,0.35)",
                        "inset 0 2px 8px rgba(255,255,255,0.18)",
                        // Inset bevel base (escurecer = profundidade)
                        "inset 0 -2px 6px rgba(0,0,0,0.4)",
                        // Glow esmeralda externa
                        `0 0 18px ${EMERALD.glow}`,
                        `0 0 0 1px rgba(0,230,118,0.5)`,
                      ].join(", "),
                      // Shine sweep usa overflow hidden + ::after pseudo
                      position: "relative",
                      overflow: "hidden",
                      // Indica que vai animar transform (GPU)
                      willChange: "transform",
                      // Z para texto ficar acima do shine sweep
                      zIndex: 1,
                    }}
                  >
                    {/* Shine sweep — listra de luz atravessa no hover */}
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        top: 0,
                        left: "-150%",
                        width: "60%",
                        height: "100%",
                        background:
                          "linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.0) 30%, rgba(255,255,255,0.42) 50%, rgba(255,255,255,0.0) 70%, transparent 100%)",
                        transform: "skewX(-22deg)",
                        transition:
                          "left 0.85s cubic-bezier(0.22, 1, 0.36, 1)",
                        pointerEvents: "none",
                        zIndex: -1,
                      }}
                      className="spin-btn-shine"
                    />
                    {lang === "br" ? "GIRAR" : "SPIN"}
                  </motion.button>
                </motion.div>
              )}

              {screen === "spinning" && (
                <motion.div
                  key="spinning-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 700,
                    fontSize: "clamp(13px, 1.4vw, 17px)",
                    color: GOLD.light,
                    letterSpacing: "3px",
                    textShadow: `0 0 12px ${GOLD.glow}`,
                    minHeight: "clamp(54px, 5.4vw, 72px)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {lang === "br" ? "GIRANDO..." : "SPINNING..."}
                </motion.div>
              )}

              {screen === "result" && (
                <motion.div
                  key="result-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    minHeight: "clamp(54px, 5.4vw, 72px)",
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* COLUNA 2: CALENDAR */}
          <CalendarGrid
            currentDay={state.streak.cycle_day}
            cycleDays={state.config.cycle_days}
            lang={lang}
          />
        </div>

        {/* FOOTER TRIPLO: SEQUENCIA + PROXIMO GIRO + COMO FUNCIONA */}
        <StreakCounter
          currentStreak={state.streak.current}
          lastClaimAt={state.streak.last_claim_at}
          cooldownHours={state.config.cooldown_hours}
          lang={lang}
          onHelpClick={() => setShowHelp(true)}
        />
      </div>

      {/* ============== OVERLAY DE PREMIO (sobre tudo) ============== */}
      {lastClaim && (
        <RewardOverlay
          open={screen === "result"}
          onCollect={handleCollect}
          reward={{
            wheelAmount: lastClaim.result.wheel_amount,
            segmentTier: lastClaim.result.segment_tier,
            mysteryAmount: lastClaim.result.mystery_amount,
            milestoneDay: lastClaim.result.milestone_day,
            milestoneBonus: lastClaim.result.milestone_bonus,
            totalAwarded: lastClaim.result.total_awarded,
            isAnchor: lastClaim.result.is_anchor,
          }}
          currentDay={state.streak.cycle_day}
          cycleDays={state.config.cycle_days}
          lang={lang}
        />
      )}

      {/* ============== MODAL DE AJUDA ============== */}
      <HelpGameModal
        open={showHelp}
        onClose={() => setShowHelp(false)}
        lang={lang}
        gameTitle={lang === "br" ? "Bonus Diario" : "Daily Free"}
        gameLogo="/assets/games/daily-free/logo-mini.png"
        sections={DAILY_FREE_HELP_SECTIONS}
        escId="daily-free-help"
      />

      {/* ============== MODAL HISTORICO (shared) ============== */}
      <HistoryModal
        open={showHistory}
        onClose={closeHistory}
        title={lang === "br" ? "HISTORICO DAILY-FREE" : "DAILY-FREE HISTORY"}
        lang={lang === "en" ? "in" : lang as "br"}
        columns={historyColumns}
        data={historyData}
        loading={historyLoading}
        emptyMessage={lang === "br" ? "Nenhum giro ainda" : "No spins yet"}
      />

      {/* ============== MODAL PROVABLY FAIR (shared) ============== */}
      <ProvablyFairModal
        open={showPF}
        onClose={closePF}
        lang={lang === "en" ? "in" : lang as "br"}
        pfData={pfData}
        onClientSeedChange={handleClientSeedChange}
        onVerify={handlePfVerify}
        onRotateSeed={handlePfRotate}
        verifying={pfVerifying}
        rotating={pfRotating}
        clientSeedChanged={pfClientSeedChanged}
        verifyDetails={pfVerifyDetails}
        unverifiedCount={state?.wheel?.next_nonce ?? 0}
      />
    </Container>
  );
}

// ============================================================
// CONTAINER (wrapper visual da tela inteira)
// ============================================================
function Container({ children }: { children: React.ReactNode }) {
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
        // Background com bg-casino + glow ambiental
        backgroundImage: `
          url("/assets/shared/ui/bg-casino.png"),
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
      {children}

      {/* CSS responsivo + animacoes do botao GIRAR */}
      <style>{`
        @media (max-width: 900px) {
          .daily-free-split {
            grid-template-columns: 1fr !important;
          }
        }

        /*
          FIX 30/04/2026: animacoes do botao GIRAR luxo.
          Halo dourado pulsante (anima box-shadow + transform = GPU).
          Shine sweep no hover (anima left = soh em pseudo-elemento, ok).
        */
        @keyframes spinBtnHalo {
          0%, 100% {
            box-shadow:
              0 0 28px rgba(212,168,67,0.4),
              0 0 56px rgba(212,168,67,0.18),
              0 6px 18px rgba(0,0,0,0.55),
              inset 0 1.5px 0 rgba(255,215,0,0.4);
          }
          50% {
            box-shadow:
              0 0 42px rgba(212,168,67,0.6),
              0 0 80px rgba(212,168,67,0.28),
              0 6px 22px rgba(0,0,0,0.6),
              inset 0 1.5px 0 rgba(255,215,0,0.55);
          }
        }
        button:hover .spin-btn-shine {
          left: 200% !important;
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="spinBtnHalo"] {
            animation: none !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
