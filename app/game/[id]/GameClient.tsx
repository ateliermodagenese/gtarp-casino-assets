"use client";

/**
 * /game/[id]/GameClient.tsx
 *
 * Client component que renderiza o jogo isolado.
 * Suporta ?file=ComponentName pra renderizar componentes individuais.
 *
 * Exemplos:
 *   /game/slots           -> SlotsGame (principal)
 *   /game/blackjack?file=BlackjackBetting -> BlackjackBetting
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CasinoProvider } from "@/contexts/CasinoContext";

// === MAPA DE JOGOS PRINCIPAIS ===
import { CrashGame } from "@/components/games/crash";
import { AnimalGame } from "@/components/games/bicho";
import { SlotsGame } from "@/components/games/slots";
import { BlackjackGame } from "@/components/games/blackjack";
import { DailyFreeGame } from "@/components/games/daily-free";
import { RouletteGame } from "@/components/games/roulette";
import { PokerGame } from "@/components/games/poker";
import { PoolGame } from "@/components/games/pool";

type GameComp = React.ComponentType<{ onBack: () => void; onDeposit?: () => void }>;

const GAME_MAP: Record<string, GameComp> = {
  slots: SlotsGame,
  blackjack: BlackjackGame,
  crash: CrashGame,
  "anima-game": AnimalGame,
  bicho: AnimalGame,
  "daily-free": DailyFreeGame,
  roulette: RouletteGame,
  poker: PokerGame,
  "pool-game": PoolGame,
  pool: PoolGame,
};

// === MAPA DE COMPONENTES INDIVIDUAIS (telas/modais) ===
const COMPONENT_LOADERS: Record<string, () => Promise<{ default: React.ComponentType<unknown> }>> = {
  // Blackjack
  BlackjackBetting: () => import("@/components/games/blackjack/BlackjackBetting"),
  BlackjackCard: () => import("@/components/games/blackjack/BlackjackCard"),
  BlackjackDealerTurn: () => import("@/components/games/blackjack/BlackjackDealerTurn"),
  BlackjackInsurance: () => import("@/components/games/blackjack/BlackjackInsurance"),
  BlackjackPlayerTurn: () => import("@/components/games/blackjack/BlackjackPlayerTurn"),
  BlackjackResult: () => import("@/components/games/blackjack/BlackjackResult"),
  BlackjackSplit: () => import("@/components/games/blackjack/BlackjackSplit"),
  BlackjackHistoryPF: () => import("@/components/games/blackjack/BlackjackHistoryPF"),
  // Crash
  CrashAutoBet: () => import("@/components/games/crash/CrashAutoBet"),
  CrashBetFeed: () => import("@/components/games/crash/CrashBetFeed"),
  CrashBigWin: () => import("@/components/games/crash/CrashBigWin"),
  CrashCanvas: () => import("@/components/games/crash/CrashCanvas"),
  CrashControls: () => import("@/components/games/crash/CrashControls"),
  CrashHistory: () => import("@/components/games/crash/CrashHistory"),
  CrashMilestone: () => import("@/components/games/crash/CrashMilestone"),
  // Daily Free
  ClaimedOverlay: () => import("@/components/games/daily-free/ClaimedOverlay"),
  MilestoneOverlay: () => import("@/components/games/daily-free/MilestoneOverlay"),
  RewardOverlay: () => import("@/components/games/daily-free/RewardOverlay"),
  // Roulette
  RouletteBettingTable: () => import("@/components/games/roulette/RouletteBettingTable"),
  RouletteChipSelector: () => import("@/components/games/roulette/RouletteChipSelector"),
  RouletteLightningPhase: () => import("@/components/games/roulette/RouletteLightningPhase"),
  RouletteWheel: () => import("@/components/games/roulette/RouletteWheel"),
};

const noop = () => {};

interface Props {
  id: string;
}

export default function GameClient({ id }: Props) {
  const searchParams = useSearchParams();
  const fileParam = searchParams.get("file");

  // Gate de hidratacao: renderizar jogos SOMENTE no client
  // O DevToolbar e outros componentes usam APIs de browser (window)
  // que geram HTML diferente no server vs client = hydration crash.
  // Solucao oficial: nao renderizar nada no server, so no client.
  // Ref: https://nextjs.org/docs/messages/react-hydration-error
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const [DynComp, setDynComp] = useState<React.ComponentType<unknown> | null>(null);
  const [dynError, setDynError] = useState("");
  const [dynLoading, setDynLoading] = useState(false);

  useEffect(() => {
    if (!fileParam) {
      setDynComp(null);
      setDynError("");
      return;
    }

    const name = fileParam.replace(/\.(tsx|ts)$/, "");
    const loader = COMPONENT_LOADERS[name];

    // Se nao esta no mapa de sub-componentes, mostrar jogo principal
    // (acontece quando FilePanel lista o arquivo principal como SlotsGame, AnimalGame, etc)
    if (!loader) {
      setDynComp(null);
      setDynError("");
      return;
    }

    setDynLoading(true);
    setDynError("");
    loader()
      .then((mod) => {
        setDynComp(() => mod.default);
        setDynLoading(false);
      })
      .catch((err) => {
        setDynError(`Erro ao carregar ${name}: ${err.message}`);
        setDynLoading(false);
      });
  }, [fileParam]);

  const MainGameComponent = GAME_MAP[id];

  // Antes do client montar, mostrar placeholder (match server HTML = zero hydration error)
  if (!isClient) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#0a0a0a" }} />
    );
  }

  if (!MainGameComponent && !fileParam) {
    return (
      <div style={msgStyle("#8a8a8a")}>
        <p>Jogo <code style={{ color: "#D4A843" }}>{id}</code> nao encontrado.</p>
        <p style={{ fontSize: 12, marginTop: 8 }}>
          Disponiveis: {Object.keys(GAME_MAP).join(", ")}
        </p>
      </div>
    );
  }

  return (
    <CasinoProvider>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#0a0a0a",
          overflow: "hidden",
          position: "relative",
        }}
        data-editor-game={id}
        data-editor-file={fileParam || "main"}
      >
        {fileParam && dynLoading && (
          <div style={msgStyle("#D4A843")}>Carregando {fileParam}...</div>
        )}
        {fileParam && dynError && (
          <div style={msgStyle("#ff6b6b")}>{dynError}</div>
        )}
        {fileParam && DynComp && <DynComp />}
        {!fileParam && MainGameComponent && (
          <MainGameComponent onBack={noop} onDeposit={noop} />
        )}
      </div>
    </CasinoProvider>
  );
}

function msgStyle(color: string): React.CSSProperties {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    color,
    fontSize: 14,
    background: "#0a0a0a",
    padding: 40,
    textAlign: "center",
  };
}
