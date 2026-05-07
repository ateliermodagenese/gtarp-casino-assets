/**
 * /game/[id]/page.tsx (Server Component)
 *
 * Wrapper server-side que exporta generateStaticParams
 * (necessario pro output:'export' do casino) e renderiza
 * o GameClient que eh "use client".
 */
import GameClient from "./GameClient";

export function generateStaticParams() {
  return [
    { id: "slots" },
    { id: "blackjack" },
    { id: "crash" },
    { id: "bicho" },
    { id: "anima-game" },
    { id: "daily-free" },
    { id: "roulette" },
    { id: "poker" },
  ];
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GameClient id={id} />;
}
