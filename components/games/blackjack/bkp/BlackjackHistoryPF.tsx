"use client";

// Blackjack Tela 7 — HISTORICO + PROVABLY FAIR
// DELEGA para os componentes SHARED (HistoryModal + ProvablyFairModal)
// Cada jogo do casino usa os mesmos modais pra garantir consistencia visual.
// Aqui so configuramos as colunas customizadas do Blackjack e
// passamos os handlers/dados apropriados.

import {
  HistoryModal,
  ProvablyFairModal,
  type PFData,
  type SeedRecord,
} from "@/components/shared";
import { COLORS, TEXTS, t, formatBalance } from "./BlackjackConstants";
import { BlackjackCard } from "./BlackjackCard";
import type { HistoryEntry, Lang, ResultType } from "./BlackjackTypes";

// ============================================================================
// PROPS UNIFICADA DOS DOIS MODAIS
// ============================================================================

export interface BlackjackHistoryPFProps {
  lang: Lang;

  // === History modal ===
  historyOpen: boolean;
  onCloseHistory: () => void;
  history: HistoryEntry[];

  // === Provably Fair modal ===
  pfOpen: boolean;
  onClosePF: () => void;
  pfData: PFData;
  seedHistory?: SeedRecord[];
  onClientSeedChange: (seed: string) => void;
  onVerify: () => Promise<void>;
  onRotateSeed?: () => Promise<void>;
  verifying?: boolean;
  rotating?: boolean;
  clientSeedChanged?: boolean;
  verifyDetails?: { committedHash: string; recalculatedHash: string; match: boolean } | null;

  // === ESC stack (opcional, o proprio BlackjackGame decide se passa) ===
  escPush?: (id: string, close: () => void) => void;
  escPop?: (id: string) => void;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export default function BlackjackHistoryPF({
  lang,
  historyOpen,
  onCloseHistory,
  history,
  pfOpen,
  onClosePF,
  pfData,
  seedHistory,
  onClientSeedChange,
  onVerify,
  onRotateSeed,
  verifying,
  rotating,
  clientSeedChanged,
  verifyDetails,
  escPush,
  escPop,
}: BlackjackHistoryPFProps) {
  // O HistoryModal compartilhado espera "br" | "in". Nosso Blackjack usa "br" | "en"
  // pra simplificar internamente. Traduzimos aqui na borda:
  const modalLang: "br" | "in" = lang === "br" ? "br" : "in";

  return (
    <>
      {/* === HISTORICO (shared, com row customizado do Blackjack) === */}
      <HistoryModal<HistoryEntry & { id?: string }>
        open={historyOpen}
        onClose={onCloseHistory}
        title={t(TEXTS.history, lang)}
        lang={modalLang}
        columns={[]}
        data={history.map((h) => ({ ...h, id: h.roundId }))}
        emptyMessage={t(TEXTS.noHistory, lang)}
        escPush={escPush}
        escPop={escPop}
        renderCustomRow={(entry, idx) => (
          <BlackjackHistoryRow entry={entry} index={idx} lang={lang} />
        )}
      />

      {/* === PROVABLY FAIR (shared, 100% generico) === */}
      <ProvablyFairModal
        open={pfOpen}
        onClose={onClosePF}
        lang={modalLang}
        pfData={pfData}
        seedHistory={seedHistory}
        onClientSeedChange={onClientSeedChange}
        onVerify={onVerify}
        onRotateSeed={onRotateSeed}
        verifying={verifying}
        rotating={rotating}
        clientSeedChanged={clientSeedChanged}
        unverifiedCount={pfData.nonce}
        verifyDetails={verifyDetails}
        escPush={escPush}
        escPop={escPop}
      />
    </>
  );
}

// ============================================================================
// SUBCOMPONENTE: ROW CUSTOMIZADO DO HISTORICO
// Cada linha mostra: ID da mao, badge do resultado, aposta, payout,
// mini-cartas (player + dealer), timestamp
// ============================================================================

interface BlackjackHistoryRowProps {
  entry: HistoryEntry;
  index: number;
  lang: Lang;
}

function BlackjackHistoryRow({ entry, index, lang }: BlackjackHistoryRowProps) {
  const isWin = entry.totalNetChange > 0;
  const isPush = entry.totalNetChange === 0;
  const isLoss = entry.totalNetChange < 0;

  // Pegar o resultado "principal" (primeiro, ou o mais relevante)
  const mainResult: ResultType = entry.results[0]?.type || "LOSE";

  // Cores do badge
  const { badgeBg, badgeBorder, badgeColor, valueColor } = getRowColors(
    isWin,
    isPush,
    isLoss,
  );

  // Timestamp formatado (HH:MM DD/MM)
  const date = new Date(entry.timestamp);
  const timeStr = date.toLocaleTimeString(lang === "br" ? "pt-BR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = date.toLocaleDateString(lang === "br" ? "pt-BR" : "en-US", {
    day: "2-digit",
    month: "2-digit",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "clamp(8px, 1vw, 12px)",
        padding: "clamp(12px, 1.4vw, 16px)",
        background:
          index % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
        borderRadius: 8,
        border: "1px solid rgba(212,168,67,0.08)",
      }}
    >
      {/* LINHA 1: ID + Badge + Payout/Loss */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(8px, 1vw, 12px)",
        }}
      >
        {/* ID da rodada (curto) */}
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "clamp(10px, 1vw, 12px)",
            color: "rgba(212,168,67,0.5)",
            fontWeight: 500,
          }}
        >
          #{entry.roundId.substring(0, 6)}
        </span>

        {/* Badge de resultado */}
        <span
          style={{
            padding: "2px clamp(6px, 0.8vw, 10px)",
            borderRadius: 4,
            fontSize: "clamp(9px, 0.95vw, 11px)",
            fontWeight: 700,
            fontFamily: "'Cinzel', serif",
            letterSpacing: "1px",
            textTransform: "uppercase",
            background: badgeBg,
            color: badgeColor,
            border: `1px solid ${badgeBorder}`,
          }}
        >
          {getResultLabel(mainResult, lang)}
        </span>

        {/* Timestamp */}
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(10px, 1vw, 12px)",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          {timeStr} · {dateStr}
        </span>

        {/* Valor liquido (direita) */}
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: "clamp(12px, 1.3vw, 15px)",
            color: valueColor,
            textShadow: `0 0 6px ${valueColor}33`,
          }}
        >
          {isWin && "+"}G${formatBalance(Math.abs(entry.totalNetChange))}
        </span>
      </div>

      {/* LINHA 2: Mini-cartas do player + dealer */}
      <div
        style={{
          display: "flex",
          gap: "clamp(16px, 2vw, 24px)",
          alignItems: "center",
        }}
      >
        {/* Player */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(9px, 0.9vw, 10px)",
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}
          >
            {t(TEXTS.player, lang)}
          </span>
          <MiniCardRow cards={entry.playerHands[0]?.cards || []} />
        </div>

        {/* Dealer */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(9px, 0.9vw, 10px)",
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}
          >
            {t(TEXTS.dealer, lang)}
          </span>
          <MiniCardRow cards={entry.dealerHand.cards} />
        </div>
      </div>

      {/* LINHA 3 (opcional): Info extra se teve split ou side bets */}
      {(entry.playerHands.length > 1 ||
        entry.sideBets.PP ||
        entry.sideBets["21+3"] ||
        entry.insurance) && (
        <div
          style={{
            display: "flex",
            gap: "clamp(8px, 1vw, 12px)",
            flexWrap: "wrap",
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(10px, 1vw, 11px)",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          {entry.playerHands.length > 1 && (
            <span style={{ color: COLORS.purpleSplit, fontWeight: 600 }}>
              SPLIT ({entry.playerHands.length})
            </span>
          )}
          {entry.sideBets.PP && entry.sideBets.PP.amount > 0 && (
            <span style={{ color: "rgba(212,168,67,0.6)" }}>
              PP G${entry.sideBets.PP.amount}
            </span>
          )}
          {entry.sideBets["21+3"] &&
            entry.sideBets["21+3"].amount > 0 && (
              <span style={{ color: "rgba(212,168,67,0.6)" }}>
                21+3 G${entry.sideBets["21+3"].amount}
              </span>
            )}
          {entry.insurance !== null && entry.insurance > 0 && (
            <span style={{ color: "rgba(68,138,255,0.7)" }}>
              INSURANCE G${entry.insurance}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: MINI CARD ROW (versao reduzida para historico)
// Usa o BlackjackCard com scale reduzido via wrapper
// ============================================================================

function MiniCardRow({ cards }: { cards: HistoryEntry["dealerHand"]["cards"] }) {
  if (cards.length === 0) {
    return (
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "clamp(10px, 1vw, 12px)",
          color: "rgba(255,255,255,0.25)",
          fontStyle: "italic",
        }}
      >
        —
      </span>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "clamp(-4px, -0.5vw, -6px)",
        transform: "scale(0.65)",
        transformOrigin: "left center",
        marginBottom: "clamp(-20px, -2.5vw, -28px)",
      }}
    >
      {cards.map((card, i) => (
        <BlackjackCard
          key={`mini-${i}`}
          rank={card.rank}
          suit={card.suit}
          faceUp={card.faceUp}
          index={i}
          animate={false}
        />
      ))}
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function getRowColors(isWin: boolean, isPush: boolean, isLoss: boolean) {
  if (isWin) {
    return {
      badgeBg: "rgba(0,230,118,0.1)",
      badgeBorder: "rgba(0,230,118,0.3)",
      badgeColor: COLORS.greenNeon,
      valueColor: COLORS.greenNeon,
    };
  }
  if (isPush) {
    return {
      badgeBg: "rgba(212,168,67,0.1)",
      badgeBorder: "rgba(212,168,67,0.3)",
      badgeColor: COLORS.goldPrimary,
      valueColor: COLORS.goldPrimary,
    };
  }
  // isLoss
  return {
    badgeBg: "rgba(255,59,59,0.1)",
    badgeBorder: "rgba(255,59,59,0.25)",
    badgeColor: COLORS.redSoft,
    valueColor: COLORS.redSoft,
  };
}

function getResultLabel(type: ResultType, lang: Lang): string {
  const map: Record<ResultType, { br: string; en: string }> = {
    WIN: { br: "VITÓRIA", en: "WIN" },
    BLACKJACK: { br: "BLACKJACK", en: "BLACKJACK" },
    BUST: { br: "ESTOUROU", en: "BUST" },
    LOSE: { br: "DERROTA", en: "LOSS" },
    PUSH: { br: "EMPATE", en: "PUSH" },
    SURRENDER: { br: "DESIST.", en: "SURREND." },
  };
  const obj = map[type];
  return lang === "br" ? obj.br : obj.en;
}
