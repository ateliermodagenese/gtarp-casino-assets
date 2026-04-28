"use client";

// Blackjack Tela 4 — SPLIT (multiplas maos apos split)
// Mostra ate 4 maos lado a lado com indicador visual da mao ativa
// Cada mao com seu proprio total e dot pulse na ativa
// Painel lateral mantem os 5 botoes de acao (contextual a mao ativa)

import { motion, AnimatePresence } from "framer-motion";
import { ASSETS, COLORS, TEXTS, t, ACTION_BUTTONS } from "./BlackjackConstants";
import type { Action, Hand, Lang } from "./BlackjackTypes";
import { BlackjackCard, HandTotalBadge, DotPulse } from "./BlackjackCard";
import BlackjackTable from "./BlackjackTable";
import LuxuryTooltip from "@/components/shared/LuxuryTooltip";

// ============================================================================
// PROPS
// ============================================================================

export interface BlackjackSplitProps {
  lang: Lang;
  /** Todas as maos do jogador (2-4 apos splits) */
  playerHands: Hand[];
  /** Indice da mao ativa no momento */
  activeHandIndex: number;
  /** Mao do dealer (1 face-up + hole card) */
  dealerHand: Hand;
  /** Total visivel do dealer */
  dealerVisibleTotal: number;
  /** Acoes disponiveis para a mao ativa */
  availableActions: Action[];
  /** Callback ao escolher acao */
  onAction: (action: Action) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function BlackjackSplit({
  lang,
  playerHands,
  activeHandIndex,
  dealerHand,
  dealerVisibleTotal,
  availableActions,
  onAction,
}: BlackjackSplitProps) {
  // Aposta total ativa eh a soma de todas as maos
  const totalActiveBet = playerHands.reduce((sum, h) => sum + h.bet, 0);

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
          playerHands={playerHands}
          activeHandIndex={activeHandIndex}
          dealerHand={dealerHand}
          dealerVisibleTotal={dealerVisibleTotal}
          lang={lang}
        />
      </div>

      {/* PAINEL LATERAL */}
      <PainelAcoes
        lang={lang}
        totalBet={totalActiveBet}
        availableActions={availableActions}
        onAction={onAction}
      />
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: MESA COM MULTIPLAS MAOS
// ============================================================================

interface MesaProps {
  playerHands: Hand[];
  activeHandIndex: number;
  dealerHand: Hand;
  dealerVisibleTotal: number;
  lang: Lang;
}

function Mesa({
  playerHands,
  activeHandIndex,
  dealerHand,
  dealerVisibleTotal,
  lang,
}: MesaProps) {
  return (
    <BlackjackTable
      width="clamp(340px, 65vw, 820px)"
      minHeight="clamp(320px, 58vh, 580px)"
    >
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
        <div
          style={{
            display: "flex",
            gap: "clamp(-8px, -1vw, -12px)",
          }}
        >
          {dealerHand.cards.map((card, i) => (
            <BlackjackCard
              key={`dealer-${i}`}
              rank={card.rank}
              suit={card.suit}
              faceUp={card.faceUp}
              index={i}
              animate={true}
            />
          ))}
        </div>
        <HandTotalBadge total={dealerVisibleTotal} isDealer={true} />
      </div>

      {/* Divider */}
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

      {/* AREA DO JOGADOR - MULTIPLAS MAOS LADO A LADO */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: "clamp(12px, 2vw, 28px)",
          width: "100%",
        }}
      >
        <AnimatePresence>
          {playerHands.map((hand, i) => (
            <PlayerHandBox
              key={`hand-${i}`}
              hand={hand}
              index={i}
              isActive={i === activeHandIndex}
              lang={lang}
            />
          ))}
        </AnimatePresence>
      </div>

      <Label text={t(TEXTS.player, lang)} />
    </BlackjackTable>
  );
}

// ============================================================================
// SUBCOMPONENTE: LABEL (DEALER / PLAYER)
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
// SUBCOMPONENTE: CAIXA DE UMA MAO DO JOGADOR (com indicador de estado)
// ============================================================================

interface PlayerHandBoxProps {
  hand: Hand;
  index: number;
  isActive: boolean;
  lang: Lang;
}

function PlayerHandBox({ hand, index, isActive, lang }: PlayerHandBoxProps) {
  const isCompleted = hand.isStanding || hand.isBust || hand.isBlackjack;

  // Estilo do container da mao (ativa / inativa / completada)
  let border: string;
  let background: string;
  let boxShadow: string;
  let opacity: number;
  let labelColor: string;

  if (isActive) {
    border = "1.5px solid rgba(0,230,118,0.5)";
    background = "rgba(0,230,118,0.03)";
    boxShadow = "0 0 12px rgba(0,230,118,0.15)";
    opacity = 1;
    labelColor = COLORS.greenNeon;
  } else if (isCompleted) {
    border = "1.5px solid rgba(212,168,67,0.2)";
    background = "rgba(212,168,67,0.02)";
    boxShadow = "none";
    opacity = 0.5;
    labelColor = "rgba(212,168,67,0.5)";
  } else {
    // inativa (aguardando)
    border = "1.5px solid rgba(255,255,255,0.05)";
    background = "rgba(255,255,255,0.01)";
    boxShadow = "none";
    opacity = 0.7;
    labelColor = COLORS.textDim;
  }

  const handLabel = lang === "br" ? `MÃO ${index + 1}` : `HAND ${index + 1}`;

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity, y: 0 }}
      exit={{ scale: 0.85, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "clamp(6px, 1vw, 10px)",
        padding: "clamp(14px, 1.8vw, 20px) clamp(10px, 1.2vw, 16px)",
        border,
        background,
        borderRadius: 12,
        boxShadow,
      }}
    >
      {/* Label "MAO 1", "MAO 2", etc */}
      <div
        style={{
          position: "absolute",
          top: "clamp(-12px, -1.5vw, -8px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(10,10,10,0.9)",
          padding: "2px clamp(6px, 0.8vw, 10px)",
          borderRadius: 4,
          border: `1px solid ${labelColor === COLORS.greenNeon ? "rgba(0,230,118,0.4)" : "rgba(255,255,255,0.1)"}`,
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          fontSize: "clamp(8px, 1vw, 11px)",
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: labelColor,
          whiteSpace: "nowrap",
        }}
      >
        {handLabel}
      </div>

      {/* Cartas da mao */}
      <div
        style={{
          display: "flex",
          gap: "clamp(-6px, -0.8vw, -10px)",
        }}
      >
        {hand.cards.map((card, i) => (
          <BlackjackCard
            key={`hand${index}-card${i}`}
            rank={card.rank}
            suit={card.suit}
            faceUp={card.faceUp}
            index={i}
            animate={true}
          />
        ))}
      </div>

      {/* Badge total */}
      <HandTotalBadge
        total={hand.total}
        isSoft={hand.isSoft}
        isBust={hand.isBust}
        softAlt={hand.isSoft ? hand.total - 10 : undefined}
      />

      {/* Dot pulse aparece soh na mao ativa */}
      {isActive && <DotPulse />}

      {/* Display de aposta desta mao */}
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          fontSize: "clamp(10px, 1.2vw, 13px)",
          color: hand.isDoubled ? COLORS.blueDouble : COLORS.greenNeon,
          textShadow: hand.isDoubled
            ? "0 0 6px rgba(68,138,255,0.4)"
            : "0 0 6px rgba(0,230,118,0.4)",
          opacity: 0.85,
        }}
      >
        <span style={{ fontSize: "0.75em", opacity: 0.7 }}>G$</span>
        {hand.bet}
        {hand.isDoubled && (
          <span style={{ marginLeft: 4, fontSize: "0.8em", opacity: 0.7 }}>
            ×2
          </span>
        )}
      </span>
    </motion.div>
  );
}

// ============================================================================
// SUBCOMPONENTE: PAINEL DE ACOES (direita)
// ============================================================================

interface PainelAcoesProps {
  lang: Lang;
  totalBet: number;
  availableActions: Action[];
  onAction: (action: Action) => void;
}

function PainelAcoes({
  lang,
  totalBet,
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
        <OrnamentLabel text={t(TEXTS.actions, lang)} />

        {/* 5 botoes */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(8px, 1vw, 12px)",
          }}
        >
          {ACTION_BUTTONS.map((btn, i) => {
            const enabled = availableActions.includes(btn.id);
            const iconPath = btn.iconKey ? ASSETS[btn.iconKey] : null;
            const textObj = TEXTS[btn.textKey] as { br: string; en: string };
            const label = lang === "br" ? textObj.br : textObj.en;
            const tooltipKey = btn.textKey as keyof typeof TEXTS.tooltips;
            const tooltipText = TEXTS.tooltips[tooltipKey];

            return (
              <LuxuryTooltip
                key={btn.id}
                text={t(tooltipText, lang)}
                position="left"
              >
                <motion.button
                key={btn.id}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                whileHover={enabled ? { translateY: -2 } : {}}
                whileTap={enabled ? { scale: 0.97 } : {}}
                onClick={() => enabled && onAction(btn.id)}
                disabled={!enabled}
                style={{
                  padding: "clamp(10px, 1.2vw, 14px) clamp(14px, 1.8vw, 20px)",
                  background: enabled ? btn.gradient : "#1A1A1A",
                  border: enabled
                    ? `1.5px solid ${btn.borderColor}`
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
                  textShadow: enabled ? "0 1px 2px rgba(0,0,0,0.6)" : "none",
                  boxShadow: enabled ? btn.shadowColor : "none",
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
              </LuxuryTooltip>
            );
          })}
        </div>

        {/* Total apostado (soma de todas as maos) */}
        <div style={{ marginTop: "auto" }}>
          <OrnamentSeparator />
          <TotalBetDisplay value={totalBet} lang={lang} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTES AUXILIARES (OrnamentLabel, Separator, TotalBetDisplay)
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

function TotalBetDisplay({ value, lang }: { value: number; lang: Lang }) {
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
          fontSize: "clamp(22px, 2.8vw, 36px)",
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
