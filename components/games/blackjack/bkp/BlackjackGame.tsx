"use client";

// BlackjackGame — componente raiz do jogo
// Orquestra as 7 telas via FSM (Finite State Machine)
// Engine real: BlackjackEngine.ts (deck, shuffle, hand value, side bets, dealer AI)
// Dual mode: browser (engine local) / FiveM (fetchNui → server handler)

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameHeader, type PFData, type SeedRecord } from "@/components/shared";
import { useEscStack } from "@/components/shared/useEscStack";
import { sha256, createSeedPair } from "@/components/shared/crypto";
import { useCasino } from "@/contexts/CasinoContext";
import { useGameAPI } from "@/hooks/use-game-api";

// FiveM NUI: fetchNui local para endpoints blackjack-especificos
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

// Constantes
import { ASSETS, TEXTS, t } from "./BlackjackConstants";

// Tipos
import type {
  Phase,
  Hand,
  Card,
  HandResult,
  Action,
  Lang,
} from "./BlackjackTypes";

// Engine real
import {
  createShoe,
  shuffleDeck,
  dealInitial,
  executeAction,
  resolveDealer,
  determineResults,
  totalPayout,
  getAvailableActions,
  evaluatePerfectPairs,
  evaluate21Plus3,
  resolveInsurance,
  buildHand,
  calculateHandValue,
} from "./BlackjackEngine";

// Telas
import BlackjackBetting from "./BlackjackBetting";
import BlackjackPlayerTurn from "./BlackjackPlayerTurn";
import BlackjackInsurance from "./BlackjackInsurance";
import BlackjackSplit from "./BlackjackSplit";
import BlackjackDealerTurn from "./BlackjackDealerTurn";
import BlackjackResult from "./BlackjackResult";
import BlackjackHistoryPF from "./BlackjackHistoryPF";

// Sons
import { useBlackjackSounds } from "./useBlackjackSounds";

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function BlackjackGame({
  onBack,
  onDeposit,
}: {
  onBack: () => void;
  onDeposit?: () => void;
}) {
  // Contexto global do casino
  const { saldo, setSaldo, lang: ctxLang } = useCasino();

  // Converte "br" | "in" (contexto) para "br" | "en" (interno do modulo)
  const lang: Lang = ctxLang === "br" ? "br" : "en";

  // Sons procedurais (Web Audio — mesmo padrao do Bicho)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const sounds = useBlackjackSounds(soundEnabled);

  // ==========================================================================
  // STATE CORE — FSM
  // ==========================================================================

  const [phase, setPhase] = useState<Phase>("BETTING");

  // Usa o saldo do contexto (fonte unica de verdade)
  const balance = saldo;
  const setBalance = setSaldo;

  // Shoe (baralho) persistente entre rodadas — ref pra nao causar re-render
  const shoeRef = useRef<Card[]>(shuffleDeck(createShoe()));

  // Apostas
  const [mainBet, setMainBet] = useState(0);
  const [sideBetPP, setSideBetPP] = useState(0);
  const [sideBet21, setSideBet21] = useState(0);
  const [insurance, setInsurance] = useState<number | null>(null);

  // Maos
  const emptyHand: Hand = buildHand([], 0, { isActive: false });
  const [playerHands, setPlayerHands] = useState<Hand[]>([]);
  const [activeHandIndex, setActiveHandIndex] = useState(0);
  const [dealerHand, setDealerHand] = useState<Hand>(emptyHand);

  // Resultados (final da rodada)
  const [results, setResults] = useState<HandResult[]>([]);

  // Animacao flip
  const [flipAnimation, setFlipAnimation] = useState(false);

  // ==========================================================================
  // STATE — MODAIS (Historico + PF)
  // ==========================================================================

  const [showHistory, setShowHistory] = useState(false);
  const [showPF, setShowPF] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Provably Fair — seed real via crypto.ts (mesmo padrao do Bicho)
  const serverSeedRef = useRef<string>("");
  const [pfData, setPfData] = useState<PFData>({
    serverSeedHash: "",
    clientSeed: "blackjack-" + Math.random().toString(36).substring(2, 10),
    nonce: 0,
    serverSeed: "",
    isValid: null,
  });
  const [seedHistory, setSeedHistory] = useState<SeedRecord[]>([]);
  const [clientSeedChanged, setClientSeedChanged] = useState(false);
  const [verifyDetails, setVerifyDetails] = useState<{
    committedHash: string;
    recalculatedHash: string;
    match: boolean;
  } | null>(null);
  const [rotating, setRotating] = useState(false);

  // Gerar par de seeds real na montagem
  useEffect(() => {
    createSeedPair().then(({ serverSeed, serverSeedHash }) => {
      serverSeedRef.current = serverSeed;
      setPfData((prev) => ({ ...prev, serverSeedHash }));
    });
  }, []);

  // ==========================================================================
  // ESC STACK — fecha modais na ordem LIFO, depois sai do jogo
  // ==========================================================================

  const { push: escPush, pop: escPop } = useEscStack(onBack);

  useEffect(() => {
    if (showHistory) escPush("history", () => setShowHistory(false));
    else escPop("history");
  }, [showHistory, escPush, escPop]);

  useEffect(() => {
    if (showPF) escPush("pf", () => setShowPF(false));
    else escPop("pf");
  }, [showPF, escPush, escPop]);

  // ==========================================================================
  // HANDLERS PRINCIPAIS
  // ==========================================================================

  /** Tela 1 → Distribuir: dual mode (web = engine local, FiveM = fetchNui) */
  const handleDeal = useCallback(
    async (bet: { main: number; pp: number; plus21: number }) => {
      const totalBetCost = bet.main + bet.pp + bet.plus21;
      if (totalBetCost > balance) return;

      sounds.deal();

      setMainBet(bet.main);
      setSideBetPP(bet.pp);
      setSideBet21(bet.plus21);

      if (isFiveM) {
        // FiveM: server calcula tudo
        try {
          const resp = await fetchNui("casino:blackjack:deal", {
            main: bet.main,
            pp: bet.pp,
            plus21: bet.plus21,
          });
          if (resp.error) return;

          setBalance(resp.balance);
          setPlayerHands([buildHand(resp.playerCards, bet.main)]);
          setActiveHandIndex(0);
          setDealerHand(buildHand(resp.dealerCards, 0, { isActive: false }));
          setPfData((pd) => ({
            ...pd,
            serverSeedHash: resp.serverSeedHash || pd.serverSeedHash,
            nonce: resp.nonce || pd.nonce + 1,
          }));

          if (resp.dealerShowsAce) {
            setPhase("INSURANCE");
          } else {
            setPhase("PLAYER_TURN");
          }
        } catch (err) {
          console.log("[BJ] deal error", err);
        }
      } else {
        // Web: engine local
        setBalance(balance - totalBetCost);

        if (shoeRef.current.length < 94) {
          shoeRef.current = shuffleDeck(createShoe());
        }

        const dealResult = dealInitial(shoeRef.current, bet.main);
        shoeRef.current = dealResult.remainingShoe;

        setPlayerHands([dealResult.playerHand]);
        setActiveHandIndex(0);
        setDealerHand(dealResult.dealerHand);
        setPfData((pd) => ({ ...pd, nonce: pd.nonce + 1 }));

        if (dealResult.dealerShowsAce) {
          setPhase("INSURANCE");
        } else {
          setPhase("PLAYER_TURN");
        }
      }
    },
    [balance],
  );

  /** Tela 3 → SIM no seguro */
  const handleInsuranceAccept = useCallback(async () => {
    const cost = Math.floor(mainBet / 2);
    if (cost > balance) return;
    sounds.chipPlace();

    if (isFiveM) {
      try {
        const resp = await fetchNui("casino:blackjack:insurance", { accept: true });
        if (resp.error) return;
        setBalance(resp.balance);
        setInsurance(resp.insurance);
      } catch {}
    } else {
      setBalance(balance - cost);
      setInsurance(cost);
    }
    setPhase("PLAYER_TURN");
  }, [mainBet, balance]);

  /** Tela 3 → NAO / timer zerou */
  const handleInsuranceDecline = useCallback(async () => {
    if (isFiveM) {
      try {
        await fetchNui("casino:blackjack:insurance", { accept: false });
      } catch {}
    }
    setInsurance(null);
    setPhase("PLAYER_TURN");
  }, []);

  /** Tela 2/4 → Acao do jogador via engine real */
  const handleAction = useCallback(
    async (action: Action) => {
      const activeHand = playerHands[activeHandIndex];
      if (!activeHand) return;

      // Som da acao
      const actionSoundMap: Record<Action, () => void> = {
        HIT: sounds.hit,
        STAND: sounds.stand,
        DOUBLE: sounds.double,
        SPLIT: sounds.split,
        SURRENDER: sounds.surrender,
      };
      actionSoundMap[action]();

      if (isFiveM) {
        // FiveM: server executa a acao
        const endpointMap: Record<Action, string> = {
          HIT: "casino:blackjack:hit",
          STAND: "casino:blackjack:stand",
          DOUBLE: "casino:blackjack:double",
          SPLIT: "casino:blackjack:split",
          SURRENDER: "casino:blackjack:stand", // surrender tratado como stand no server
        };

        // Surrender client-side (metade da aposta devolvida)
        if (action === "SURRENDER") {
          const halfBet = Math.floor(mainBet / 2);
          setResults([{ handIndex: 0, type: "SURRENDER", payout: halfBet, netChange: -halfBet }]);
          if (!isFiveM) setBalance(balance + halfBet);
          setPhase("RESULT");
          return;
        }

        try {
          const resp = await fetchNui(endpointMap[action], {});
          if (resp.error) return;

          // Atualizar maos com resposta do server
          const serverHands = resp.playerHands.map((h: any) =>
            buildHand(h.cards, h.bet, {
              isDoubled: h.isDoubled,
              isFromSplit: h.isFromSplit,
              isStanding: h.isStanding,
            }),
          );
          setPlayerHands(serverHands);
          setActiveHandIndex(resp.activeHandIndex >= 0 ? resp.activeHandIndex : 0);
          setBalance(resp.balance);

          if (resp.allDone) {
            // Server ja resolveu dealer + resultados
            if (resp.dealerCards) {
              setDealerHand(buildHand(resp.dealerCards, 0, { isStanding: true, isActive: false }));
            }
            if (resp.results) {
              setResults(resp.results);
              setBalance(resp.balance);
              // Alimentar historico
              addToHistory(resp.results, serverHands, resp.dealerCards || dealerHand.cards);
            }
            setPhase("RESULT");
          } else if (serverHands.length > 1) {
            setPhase("SPLIT_PLAY");
          }
        } catch (err) {
          console.log("[BJ] action error", err);
        }
      } else {
        // Web: engine local

        // SURRENDER: resolver inline
        if (action === "SURRENDER") {
          const halfBet = Math.floor(mainBet / 2);
          setResults([{ handIndex: 0, type: "SURRENDER", payout: halfBet, netChange: -halfBet }]);
          setBalance(balance + halfBet);
          setPhase("RESULT");
          return;
        }

        // Executar acao via engine
        const actionResult = executeAction(action, playerHands, activeHandIndex, shoeRef.current);
        shoeRef.current = actionResult.remainingShoe;
        setPlayerHands(actionResult.updatedHands);
        setActiveHandIndex(actionResult.activeHandIndex);

        if (actionResult.extraCost > 0) {
          setBalance(balance - actionResult.extraCost);
        }

        if (actionResult.allHandsDone) {
          setPhase("DEALER_TURN");
          setFlipAnimation(true);
          return;
        }

        if (actionResult.updatedHands.length > 1 && phase !== "SPLIT_PLAY") {
          setPhase("SPLIT_PLAY");
        }
      }
    },
    [playerHands, activeHandIndex, mainBet, balance, phase, dealerHand],
  );

  /** Helper: adicionar rodada ao historico local */
  const addToHistory = useCallback(
    (handResults: HandResult[], hands: Hand[], dCards: Card[]) => {
      const entry = {
        id: Date.now(),
        roundId: `local-${Date.now()}`,
        playerCards: hands.map((h) => h.cards),
        dealerCards: dCards,
        results: handResults,
        mainBet,
        sideBetPP,
        sideBet21,
        createdAt: new Date().toISOString(),
      };
      setHistory((prev) => [entry, ...prev].slice(0, 20));
    },
    [mainBet, sideBetPP, sideBet21],
  );

  /** DEALER_TURN → engine resolve dealer + resultados (SOMENTE web, FiveM ja resolveu no handleAction) */
  useEffect(() => {
    if (phase !== "DEALER_TURN") return;
    // No FiveM, o server ja resolveu tudo no handleAction — esse useEffect nao roda
    if (isFiveM) return;

    // Resolver dealer via engine (revela hole card + hit ate S17)
    const { finalHand, remainingShoe } = resolveDealer(dealerHand, shoeRef.current);
    shoeRef.current = remainingShoe;
    setDealerHand(finalHand);
    sounds.cardFlip();

    // Delay pra dar tempo da animacao do flip
    const timer = setTimeout(() => {
      const handResults = determineResults(playerHands, finalHand);
      let totalPayoutValue = totalPayout(handResults);

      // Side bet PP
      if (sideBetPP > 0 && playerHands[0]) {
        const pp = evaluatePerfectPairs(playerHands[0].cards);
        if (pp.multiplier > 0) {
          totalPayoutValue += sideBetPP * (pp.multiplier + 1);
        }
      }

      // Side bet 21+3
      if (sideBet21 > 0 && playerHands[0] && finalHand.cards[0]) {
        const t3 = evaluate21Plus3(playerHands[0].cards, finalHand.cards[0]);
        if (t3.multiplier > 0) {
          totalPayoutValue += sideBet21 * (t3.multiplier + 1);
        }
      }

      // Insurance
      if (insurance !== null && insurance > 0) {
        const insResult = resolveInsurance(finalHand, insurance);
        if (insResult.won) {
          totalPayoutValue += insResult.payout;
        }
      }

      setResults(handResults);
      setBalance(balance + totalPayoutValue);

      // Alimentar historico local
      addToHistory(handResults, playerHands, finalHand.cards);

      // Som do resultado principal
      const mainType = handResults[0]?.type;
      if (mainType === "BLACKJACK") sounds.winBlackjack();
      else if (mainType === "WIN") sounds.winNormal();
      else if (mainType === "BUST") sounds.bust();
      else if (mainType === "PUSH") sounds.push();
      else sounds.lose();

      setPhase("RESULT");
      setFlipAnimation(false);
    }, 2000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /** Tela 6 → NOVA MAO: reset state, manter shoe */
  const handleNewHand = useCallback(() => {
    sounds.newHand();
    setMainBet(0);
    setSideBetPP(0);
    setSideBet21(0);
    setInsurance(null);
    setPlayerHands([]);
    setActiveHandIndex(0);
    setDealerHand(buildHand([], 0, { isActive: false }));
    setResults([]);
    setFlipAnimation(false);
    setPhase("BETTING");
  }, []);

  // ==========================================================================
  // HANDLERS PF (verificacao real via crypto.ts — mesmo padrao do Bicho)
  // ==========================================================================

  const handleClientSeedChange = useCallback((seed: string) => {
    setPfData((pd) => ({ ...pd, clientSeed: seed, nonce: 0 }));
    setVerifyDetails(null);
    setClientSeedChanged(true);
    setTimeout(() => setClientSeedChanged(false), 2000);
  }, []);

  const handleVerify = useCallback(async () => {
    if (isFiveM) {
      // FiveM: server verifica
      try {
        const resp = await fetchNui("casino:blackjack:verify", {});
        if (resp.error) {
          setPfData((pd) => ({ ...pd, isValid: false }));
          return;
        }
        setPfData((pd) => ({
          ...pd,
          serverSeed: resp.serverSeed,
          isValid: resp.valido,
        }));
        setVerifyDetails({
          committedHash: resp.serverSeedHash,
          recalculatedHash: resp.hashRecalculado,
          match: resp.valido,
        });
      } catch {
        setPfData((pd) => ({ ...pd, isValid: false }));
      }
    } else {
      // Web: verificacao local via sha256
      if (!pfData.serverSeed) {
        setPfData((pd) => ({ ...pd, isValid: false }));
        return;
      }
      try {
        const recalculatedHash = await sha256(pfData.serverSeed);
        const hashMatch = recalculatedHash === pfData.serverSeedHash;
        setVerifyDetails({
          committedHash: pfData.serverSeedHash,
          recalculatedHash,
          match: hashMatch,
        });
        setPfData((pd) => ({ ...pd, isValid: hashMatch }));
      } catch {
        setPfData((pd) => ({ ...pd, isValid: false }));
        setVerifyDetails(null);
      }
    }
  }, [pfData.serverSeed, pfData.serverSeedHash]);

  const handleRotateSeed = useCallback(async () => {
    if (rotating || phase !== "BETTING") return;
    setRotating(true);
    try {
      if (isFiveM) {
        // FiveM: server rotaciona
        const resp = await fetchNui("casino:blackjack:rotateSeed", {
          clientSeed: pfData.clientSeed,
        });
        if (!resp.error) {
          setSeedHistory((prev) =>
            [
              {
                serverSeed: resp.revealedSeed,
                serverSeedHash: resp.revealedHash,
                clientSeed: pfData.clientSeed,
                nonce: pfData.nonce,
                revealedAt: new Date().toISOString(),
              },
              ...prev,
            ].slice(0, 20),
          );
          setPfData((pd) => ({
            ...pd,
            serverSeedHash: resp.newSeedHash,
            serverSeed: "",
            nonce: 0,
            isValid: null,
          }));
          setVerifyDetails(null);
        }
      } else {
        // Web: rotacao local
        const revealedSeed = serverSeedRef.current;
        const revealedHash = pfData.serverSeedHash;
        setSeedHistory((prev) =>
          [
            {
              serverSeed: revealedSeed,
              serverSeedHash: revealedHash,
              clientSeed: pfData.clientSeed,
              nonce: pfData.nonce,
              revealedAt: new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 20),
        );

        const { serverSeed: newSeed, serverSeedHash: newHash } = await createSeedPair();
        serverSeedRef.current = newSeed;
        setPfData((pd) => ({
          ...pd,
          serverSeedHash: newHash,
          serverSeed: revealedSeed,
          nonce: 0,
          isValid: null,
        }));
        setVerifyDetails(null);
      }
    } catch {}
    setRotating(false);
  }, [rotating, phase, pfData.clientSeed, pfData.nonce, pfData.serverSeedHash]);

  // ==========================================================================
  // CALCULOS AUXILIARES
  // ==========================================================================

  /** Determina acoes disponiveis via engine real */
  const availableActions: Action[] = (() => {
    if (phase !== "PLAYER_TURN" && phase !== "SPLIT_PLAY") return [];
    const activeHand = playerHands[activeHandIndex];
    if (!activeHand) return [];
    return getAvailableActions(activeHand, balance, phase, playerHands.length);
  })();

  /** Total visivel do dealer (apenas carta face-up antes do DEALER_TURN) */
  const dealerVisibleTotal =
    phase === "DEALER_TURN" || phase === "RESULT"
      ? dealerHand.total
      : calculateHandValue(dealerHand.cards.filter((c) => c.faceUp)).total;

  /** Total apostado no momento (principal + todas as maos se split) */
  const totalActiveBet = playerHands.reduce((sum, h) => sum + h.bet, 0) || mainBet;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div
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
      {/* HEADER COMUM */}
      <GameHeader
        onBack={onBack}
        title={t(TEXTS.title, lang)}
        balance={balance}
        lang={lang}
        actions={[
          {
            id: "sound",
            icon: soundEnabled ? ASSETS.iconSoundOn : ASSETS.iconSoundOff,
            tooltip: soundEnabled
              ? (lang === "br" ? "Desativar som" : "Mute sound")
              : (lang === "br" ? "Ativar som" : "Enable sound"),
            onClick: () => setSoundEnabled((s) => !s),
          },
          {
            id: "history",
            icon: ASSETS.iconHistory,
            tooltip: t(TEXTS.history, lang),
            onClick: () => { setShowHistory(true); sounds.modalOpen(); },
          },
          {
            id: "pf",
            icon: ASSETS.iconProvablyFair,
            tooltip: t(TEXTS.provablyFair, lang),
            onClick: () => { setShowPF(true); sounds.modalOpen(); },
          },
        ]}
      />

      {/* AREA DO JOGO (abaixo do header) */}
      <div
        style={{
          position: "relative",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <AnimatePresence mode="wait">
          {/* TELA 1: BETTING */}
          {phase === "BETTING" && (
            <motion.div
              key="betting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: "absolute", inset: 0 }}
            >
              <BlackjackBetting
                lang={lang}
                balance={balance}
                onDeal={handleDeal}
              />
            </motion.div>
          )}

          {/* TELA 2: PLAYER TURN */}
          {phase === "PLAYER_TURN" && playerHands[0] && (
            <motion.div
              key="player-turn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: "absolute", inset: 0 }}
            >
              <BlackjackPlayerTurn
                lang={lang}
                playerHand={playerHands[0]}
                dealerHand={dealerHand}
                dealerVisibleTotal={dealerVisibleTotal}
                mainBet={mainBet}
                sideBetPP={
                  sideBetPP > 0
                    ? {
                        amount: sideBetPP,
                        result: null,
                        payout: 0,
                      }
                    : null
                }
                sideBet21={
                  sideBet21 > 0
                    ? {
                        amount: sideBet21,
                        result: null,
                        payout: 0,
                      }
                    : null
                }
                availableActions={availableActions}
                onAction={handleAction}
              />
            </motion.div>
          )}

          {/* TELA 4: SPLIT */}
          {phase === "SPLIT_PLAY" && (
            <motion.div
              key="split"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: "absolute", inset: 0 }}
            >
              <BlackjackSplit
                lang={lang}
                playerHands={playerHands}
                activeHandIndex={activeHandIndex}
                dealerHand={dealerHand}
                dealerVisibleTotal={dealerVisibleTotal}
                availableActions={availableActions}
                onAction={handleAction}
              />
            </motion.div>
          )}

          {/* TELA 5: DEALER TURN */}
          {phase === "DEALER_TURN" && (
            <motion.div
              key="dealer-turn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: "absolute", inset: 0 }}
            >
              <BlackjackDealerTurn
                lang={lang}
                playerHands={playerHands}
                dealerHand={dealerHand}
                totalBet={totalActiveBet}
                flipAnimation={flipAnimation}
              />
            </motion.div>
          )}

          {/* TELA 6: RESULT */}
          {phase === "RESULT" && (
            <motion.div
              key="result-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: "absolute", inset: 0 }}
            >
              {/* Mantem a mesa de DEALER_TURN no fundo enquanto overlay aparece */}
              <BlackjackDealerTurn
                lang={lang}
                playerHands={playerHands}
                dealerHand={dealerHand}
                totalBet={totalActiveBet}
                flipAnimation={false}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* TELA 3: INSURANCE MODAL (overlay sobre PLAYER_TURN) */}
        <AnimatePresence>
          {phase === "INSURANCE" && (
            <BlackjackInsurance
              key="insurance"
              lang={lang}
              betAmount={mainBet}
              onAccept={handleInsuranceAccept}
              onDecline={handleInsuranceDecline}
            />
          )}
        </AnimatePresence>

        {/* TELA 6: RESULT OVERLAY (sobre a mesa) */}
        <AnimatePresence>
          {phase === "RESULT" && (
            <BlackjackResult
              key="result"
              lang={lang}
              results={results}
              onNewHand={handleNewHand}
              onBack={onBack}
            />
          )}
        </AnimatePresence>
      </div>

      {/* TELA 7: HISTORY + PROVABLY FAIR (modais sempre disponiveis) */}
      <BlackjackHistoryPF
        lang={lang}
        historyOpen={showHistory}
        onCloseHistory={() => setShowHistory(false)}
        history={history}
        pfOpen={showPF}
        onClosePF={() => setShowPF(false)}
        pfData={pfData}
        seedHistory={seedHistory}
        onClientSeedChange={handleClientSeedChange}
        onVerify={handleVerify}
        onRotateSeed={handleRotateSeed}
        clientSeedChanged={clientSeedChanged}
        verifying={false}
        rotating={rotating}
        verifyDetails={verifyDetails}
        escPush={escPush}
        escPop={escPop}
      />
    </div>
  );
}
