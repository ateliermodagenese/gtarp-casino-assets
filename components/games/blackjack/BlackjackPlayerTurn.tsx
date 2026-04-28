"use client";

// Blackjack Tela 2 — PLAYER TURN (vez do jogador)
// Mesa com cartas distribuidas + painel lateral com 5 botoes de acao
// 5 botoes com cores unicas: HIT verde / STAND dourado / DOUBLE azul /
// SPLIT roxo / SURRENDER vermelho

import { motion } from "framer-motion";
import { ASSETS, COLORS, TEXTS, t, ACTION_BUTTONS } from "./BlackjackConstants";
import type { Action, Card, Hand, Lang } from "./BlackjackTypes";
import { BlackjackCard, HandTotalBadge, DotPulse } from "./BlackjackCard";
import BlackjackTable from "./BlackjackTable";
import LuxuryTooltip from "@/components/shared/LuxuryTooltip";

// ============================================================================
// PROPS DO COMPONENTE
// ============================================================================

export interface BlackjackPlayerTurnProps {
  lang: Lang;
  /** Mao ativa do jogador */
  playerHand: Hand;
  /** Mao do dealer (apenas uma carta face up + hole card) */
  dealerHand: Hand;
  /** Total visivel do dealer (apenas carta face up) */
  dealerVisibleTotal: number;
  /** Aposta atual do jogador */
  mainBet: number;
  /** Side bet PP (se jogador apostou) */
  sideBetPP?: { amount: number; result: "win" | "lose" | null; payout: number } | null;
  /** Side bet 21+3 (se jogador apostou) */
  sideBet21?: { amount: number; result: "win" | "lose" | null; payout: number } | null;
  /** Lista de acoes disponiveis no momento */
  availableActions: Action[];
  /** Callback quando jogador escolhe acao */
  onAction: (action: Action) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function BlackjackPlayerTurn({
  lang,
  playerHand,
  dealerHand,
  dealerVisibleTotal,
  mainBet,
  sideBetPP,
  sideBet21,
  availableActions,
  onAction,
}: BlackjackPlayerTurnProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
      }}
    >
      {/* AREA CENTRAL - MESA */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(20px, 3vw, 48px)",
        }}
      >
        <Mesa
          playerHand={playerHand}
          dealerHand={dealerHand}
          dealerVisibleTotal={dealerVisibleTotal}
          sideBetPP={sideBetPP}
          sideBet21={sideBet21}
          lang={lang}
        />
      </div>

      {/* PAINEL LATERAL DIREITO - 5 BOTOES DE ACAO */}
      <PainelAcoes
        lang={lang}
        mainBet={mainBet}
        availableActions={availableActions}
        onAction={onAction}
      />
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: MESA COM CARTAS DISTRIBUIDAS
// ============================================================================

interface MesaProps {
  playerHand: Hand;
  dealerHand: Hand;
  dealerVisibleTotal: number;
  sideBetPP?: BlackjackPlayerTurnProps["sideBetPP"];
  sideBet21?: BlackjackPlayerTurnProps["sideBet21"];
  lang: Lang;
}

function Mesa({
  playerHand,
  dealerHand,
  dealerVisibleTotal,
  sideBetPP,
  sideBet21,
  lang,
}: MesaProps) {
  return (
    <BlackjackTable>
      {/* Side bets nas laterais */}
      <SideBetResult type="PP" position="left" bet={sideBetPP} />
      <SideBetResult type="21+3" position="right" bet={sideBet21} />

      {/* AREA DO DEALER */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(6px, 1vw, 12px)",
        }}
      >
        <Label text={t(TEXTS.dealer, lang)} />
        <CardRow cards={dealerHand.cards} />
        <HandTotalBadge
          total={dealerVisibleTotal}
          isDealer={true}
        />
      </div>

      {/* Divider central */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "60%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(212,168,67,0.15), transparent)",
        }}
      />

      {/* AREA DO JOGADOR */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(6px, 1vw, 12px)",
        }}
      >
        <CardRow cards={playerHand.cards} />
        <HandTotalBadge
          total={playerHand.total}
          isSoft={playerHand.isSoft}
          isBust={playerHand.isBust}
          softAlt={
            playerHand.isSoft ? playerHand.total - 10 : undefined
          }
        />
        <DotPulse />
        <Label text={t(TEXTS.player, lang)} />
      </div>
    </BlackjackTable>
  );
}

// ============================================================================
// SUBCOMPONENTE: LABEL DEALER/PLAYER
// ============================================================================

function Label({ text }: { text: string }) {
  return (
    <span
      style={{
        fontFamily: "'Cinzel', serif",
        fontWeight: 700,
        fontSize: "clamp(10px, 1.3vw, 14px)",
        color: "rgba(255,255,255,0.12)",
        textTransform: "uppercase",
        letterSpacing: "3px",
        pointerEvents: "none",
      }}
    >
      {text}
    </span>
  );
}

// ============================================================================
// SUBCOMPONENTE: LINHA DE CARTAS (com overlap leve)
// ============================================================================

function CardRow({ cards }: { cards: Card[] }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "clamp(-8px, -1vw, -12px)",
        position: "relative",
      }}
    >
      {cards.map((card, i) => (
        <BlackjackCard
          key={`${card.rank}-${card.suit}-${i}`}
          rank={card.rank}
          suit={card.suit}
          faceUp={card.faceUp}
          index={i}
          animate={true}
        />
      ))}
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: SIDE BET RESULT (PP ou 21+3 com estado win/lose/neutral)
// ============================================================================

interface SideBetResultProps {
  type: "PP" | "21+3";
  position: "left" | "right";
  bet: BlackjackPlayerTurnProps["sideBetPP"];
}

function SideBetResult({ type, position, bet }: SideBetResultProps) {
  const hasBet = bet && bet.amount > 0;
  const isWin = bet?.result === "win";
  const isLose = bet?.result === "lose";

  let borderColor = "rgba(212,168,67,0.15)";
  let background = "rgba(212,168,67,0.04)";
  let labelColor = "rgba(212,168,67,0.5)";
  let animation: string | undefined;
  let opacity = 1;

  if (isWin) {
    borderColor = "rgba(0,230,118,0.5)";
    background = "rgba(0,230,118,0.08)";
    labelColor = COLORS.greenNeon;
    animation = "bjSideBetGlow 1.5s ease-in-out infinite";
  } else if (isLose) {
    borderColor = "rgba(255,255,255,0.05)";
    labelColor = COLORS.textDim;
    opacity = 0.4;
  } else if (hasBet) {
    borderColor = "rgba(0,230,118,0.3)";
    background = "rgba(0,230,118,0.03)";
    labelColor = COLORS.greenNeon;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        [position]: "clamp(16px, 3vw, 40px)",
        transform: "translateY(-50%)",
        width: "clamp(52px, 7vw, 72px)",
        minHeight: "clamp(52px, 7vw, 72px)",
        padding: "clamp(6px, 0.8vw, 10px)",
        background,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        zIndex: 2,
        opacity,
        animation: animation || "none",
      }}
    >
      <span
        style={{
          fontFamily: "'Cinzel', serif",
          fontWeight: 700,
          fontSize: "clamp(9px, 1.1vw, 12px)",
          color: labelColor,
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        {type}
      </span>

      {isWin && bet && (
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: "clamp(10px, 1.2vw, 14px)",
            color: COLORS.greenNeon,
            textShadow: "0 0 6px rgba(0,230,118,0.6)",
          }}
        >
          +{bet.payout}
        </span>
      )}

      {isLose && (
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: "clamp(10px, 1.2vw, 14px)",
            color: COLORS.textDim,
          }}
        >
          —
        </span>
      )}

      {hasBet && !isWin && !isLose && (
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: "clamp(10px, 1.1vw, 13px)",
            color: COLORS.greenNeon,
            textShadow: "0 0 6px rgba(0,230,118,0.5)",
          }}
        >
          {bet.amount}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: PAINEL DE ACOES (direita)
// ============================================================================

interface PainelAcoesProps {
  lang: Lang;
  mainBet: number;
  availableActions: Action[];
  onAction: (action: Action) => void;
}

function PainelAcoes({
  lang,
  mainBet,
  availableActions,
  onAction,
}: PainelAcoesProps) {
  return (
    <div
      style={{
        position: "relative",
        flexShrink: 0,
        width: "clamp(220px, 22vw, 300px)",
        padding: "clamp(10px, 1.2vw, 16px)",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(180deg, rgba(20,16,8,0.95) 0%, rgba(10,8,4,0.9) 50%, rgba(20,16,8,0.95) 100%)",
        borderLeft: "1px solid rgba(212,168,67,0.3)",
        boxShadow:
          "inset 1px 0 0 rgba(212,168,67,0.4), inset 3px 0 0 rgba(0,0,0,0.4), inset 4px 0 0 rgba(212,168,67,0.15), -4px 0 20px rgba(0,0,0,0.6)",
        backgroundImage:
          "radial-gradient(circle at 20% 30%, rgba(212,168,67,0.04) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(212,168,67,0.03) 0%, transparent 40%)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      {/* Moldura interna */}
      <div
        style={{
          position: "absolute",
          top: "clamp(8px, 1vw, 14px)",
          bottom: "clamp(8px, 1vw, 14px)",
          left: "clamp(8px, 1vw, 14px)",
          right: "clamp(8px, 1vw, 14px)",
          border: "1px solid rgba(212,168,67,0.2)",
          borderRadius: 2,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Conteudo */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: "clamp(16px, 2vw, 24px) clamp(12px, 1.5vw, 18px)",
          gap: "clamp(12px, 1.5vw, 20px)",
        }}
      >
        {/* Label ACOES */}
        <OrnamentLabel text={t(TEXTS.actions, lang)} />

        {/* 5 botoes de acao verticais */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(8px, 1vw, 12px)",
          }}
        >
          {ACTION_BUTTONS.map((btn, i) => {
            const enabled = availableActions.includes(btn.id);
            const tooltipKey = btn.textKey as keyof typeof TEXTS.tooltips;
            const tooltipText = TEXTS.tooltips[tooltipKey];
            return (
              <LuxuryTooltip
                key={btn.id}
                text={t(tooltipText, lang)}
                position="left"
              >
                <ActionButton
                  config={btn}
                  lang={lang}
                  enabled={enabled}
                  index={i}
                  onClick={() => enabled && onAction(btn.id)}
                />
              </LuxuryTooltip>
            );
          })}
        </div>

        {/* Separador + display aposta ativa */}
        <div style={{ marginTop: "auto" }}>
          <OrnamentSeparator />
          <ActiveBetDisplay value={mainBet} lang={lang} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: BOTAO DE ACAO INDIVIDUAL
// ============================================================================

interface ActionButtonProps {
  config: ActionConfig;
  lang: Lang;
  enabled: boolean;
  index: number;
  onClick: () => void;
}

function ActionButton({
  config,
  lang,
  enabled,
  index,
  onClick,
}: ActionButtonProps) {
  const iconPath = config.iconKey ? ASSETS[config.iconKey] : null;
  const textObj = TEXTS[config.textKey] as { br: string; en: string };
  const label = lang === "br" ? textObj.br : textObj.en;

  return (
    <motion.button
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.3 + index * 0.08 }}
      whileHover={enabled ? { translateY: -2 } : {}}
      whileTap={enabled ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={!enabled}
      style={{
        padding: "clamp(10px, 1.2vw, 14px) clamp(14px, 1.8vw, 20px)",
        background: enabled ? config.gradient : "#1A1A1A",
        border: enabled
          ? `1.5px solid ${config.borderColor}`
          : "1.5px solid rgba(255,255,255,0.05)",
        borderRadius: 8,
        color: "#FFFFFF",
        fontFamily: "'Cinzel', serif",
        fontWeight: 700,
        fontSize: "clamp(11px, 1.3vw, 15px)",
        letterSpacing: "2px",
        textTransform: "uppercase",
        cursor: enabled ? "pointer" : "not-allowed",
        minHeight: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(6px, 0.8vw, 10px)",
        transition: "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        position: "relative",
        overflow: "hidden",
        textShadow: enabled ? "0 1px 2px rgba(0,0,0,0.6)" : "none",
        boxShadow: enabled ? config.shadowColor : "none",
        opacity: enabled ? 1 : 0.35,
      }}
    >
      {iconPath && enabled && (
        <img
          src={iconPath}
          alt=""
          style={{
            width: "clamp(16px, 1.8vw, 22px)",
            height: "clamp(16px, 1.8vw, 22px)",
            flexShrink: 0,
          }}
          draggable={false}
        />
      )}
      {label}
    </motion.button>
  );
}

// ============================================================================
// SUBCOMPONENTE: LABEL ORNAMENTADO
// ============================================================================

function OrnamentLabel({ text }: { text: string }) {
  return (
    <div
      style={{
        position: "relative",
        alignSelf: "stretch",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(8px, 1vw, 12px)",
      }}
    >
      <div
        style={{
          flex: 1,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(212,168,67,0.5))",
        }}
      />
      <span
        style={{
          fontFamily: "'Cinzel', serif",
          fontWeight: 700,
          fontSize: "clamp(10px, 1.1vw, 13px)",
          color: COLORS.goldPrimary,
          letterSpacing: "3px",
          textTransform: "uppercase",
          textShadow:
            "0 0 12px rgba(212,168,67,0.5), 0 1px 2px rgba(0,0,0,0.8)",
          padding: "0 clamp(4px, 0.5vw, 6px)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
      <div
        style={{
          flex: 1,
          height: 1,
          background:
            "linear-gradient(90deg, rgba(212,168,67,0.5), transparent)",
        }}
      />
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: SEPARADOR ORNAMENTADO
// ============================================================================

function OrnamentSeparator() {
  return (
    <div
      style={{
        position: "relative",
        width: "80%",
        alignSelf: "center",
        height: 2,
        margin: "clamp(18px, 2vw, 28px) auto",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(212,168,67,0.4), transparent)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "20%",
          right: "20%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(212,168,67,0.25), transparent)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -3,
          left: "50%",
          transform: "translateX(-50%) rotate(45deg)",
          width: 6,
          height: 6,
          background: COLORS.goldPrimary,
          boxShadow: "0 0 8px rgba(212,168,67,0.6)",
        }}
      />
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: ACTIVE BET DISPLAY (aposta travada, sem LIMPAR)
// ============================================================================

interface ActiveBetDisplayProps {
  value: number;
  lang: Lang;
}

function ActiveBetDisplay({ value, lang }: ActiveBetDisplayProps) {
  return (
    <div
      style={{
        position: "relative",
        alignSelf: "stretch",
        margin: "0 clamp(4px, 0.5vw, 8px)",
        padding: "clamp(14px, 1.8vw, 22px) clamp(12px, 1.5vw, 18px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "clamp(6px, 0.8vw, 10px)",
        background:
          "radial-gradient(ellipse at 50% 50%, rgba(0,77,37,0.3) 0%, rgba(0,0,0,0.5) 100%)",
        border: "1px solid rgba(0,230,118,0.2)",
        borderRadius: 6,
        boxShadow:
          "inset 0 0 20px rgba(0,230,118,0.1), inset 0 1px 0 rgba(0,230,118,0.15), 0 2px 8px rgba(0,0,0,0.5)",
      }}
    >
      <span
        style={{
          fontFamily: "'Cinzel', serif",
          fontWeight: 600,
          fontSize: "clamp(9px, 1vw, 11px)",
          color: "rgba(212,168,67,0.6)",
          letterSpacing: "2px",
          textTransform: "uppercase",
        }}
      >
        {t(TEXTS.activeBet, lang)}
      </span>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 800,
          fontSize: "clamp(24px, 3vw, 40px)",
          color: COLORS.greenNeon,
          textShadow:
            "0 0 16px rgba(0,230,118,0.8), 0 0 32px rgba(0,230,118,0.4), 0 1px 2px rgba(0,0,0,0.8)",
          letterSpacing: "1px",
          lineHeight: 1,
        }}
      >
        <span style={{ fontSize: "0.55em", opacity: 0.75, marginRight: 2 }}>
          G$
        </span>
        {value}
      </span>
    </div>
  );
}
