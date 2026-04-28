"use client";

// Blackjack Tela 5 — DEALER TURN (vez do dealer)
// Dealer revela hole card (flip dramatico) e compra cartas ate 17+
// Controles do jogador ficam DIMMED (opacity 0.3, pointerEvents none)
// Badge total do dealer muda de cor conforme vai atingindo 17+/bust

import { motion } from "framer-motion";
import { ASSETS, COLORS, TEXTS, t, ACTION_BUTTONS } from "./BlackjackConstants";
import type { Action, Hand, Lang } from "./BlackjackTypes";
import { BlackjackCard, HandTotalBadge } from "./BlackjackCard";
import BlackjackTable from "./BlackjackTable";

// ============================================================================
// PROPS
// ============================================================================

export interface BlackjackDealerTurnProps {
  lang: Lang;
  /** Mao(s) do jogador, podem ser multiplas se houve split */
  playerHands: Hand[];
  /** Mao do dealer (todas face-up agora, hole card ja foi revelado) */
  dealerHand: Hand;
  /** Aposta total do jogador */
  totalBet: number;
  /** Se true, desenha a animacao de flip do hole card */
  flipAnimation?: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function BlackjackDealerTurn({
  lang,
  playerHands,
  dealerHand,
  totalBet,
  flipAnimation = false,
}: BlackjackDealerTurnProps) {
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
          dealerHand={dealerHand}
          lang={lang}
          flipAnimation={flipAnimation}
        />
      </div>

      {/* PAINEL LATERAL - botoes TODOS dimmed */}
      <PainelAcoesDimmed lang={lang} totalBet={totalBet} />
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: MESA (dealer com todas as cartas face-up)
// ============================================================================

interface MesaProps {
  playerHands: Hand[];
  dealerHand: Hand;
  lang: Lang;
  flipAnimation: boolean;
}

function Mesa({ playerHands, dealerHand, lang, flipAnimation }: MesaProps) {
  const isMultiHand = playerHands.length > 1;

  return (
    <BlackjackTable>

      {/* DEALER AREA com glow dourado transitorio durante o flip */}
      <motion.div
        animate={
          flipAnimation
            ? {
                boxShadow: [
                  "0 0 0 rgba(212,168,67,0)",
                  "0 0 40px rgba(212,168,67,0.5)",
                  "0 0 0 rgba(212,168,67,0)",
                ],
              }
            : {}
        }
        transition={{ duration: 0.7, times: [0, 0.5, 1] }}
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(6px, 1vw, 12px)",
          padding: "clamp(8px, 1vw, 14px)",
          borderRadius: 12,
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
              faceUp={true}
              index={i}
              animate={i >= 2}
            />
          ))}
        </div>
        <HandTotalBadge
          total={dealerHand.total}
          isSoft={dealerHand.isSoft}
          isBust={dealerHand.isBust}
          softAlt={dealerHand.isSoft ? dealerHand.total - 10 : undefined}
        />
      </motion.div>

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

      {/* AREA DO JOGADOR (1 ou varias maos) */}
      {isMultiHand ? (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            gap: "clamp(12px, 2vw, 28px)",
            width: "100%",
          }}
        >
          {playerHands.map((hand, i) => (
            <PlayerHandView key={`ph-${i}`} hand={hand} index={i} lang={lang} />
          ))}
        </div>
      ) : (
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
          <div style={{ display: "flex", gap: "clamp(-8px, -1vw, -12px)" }}>
            {playerHands[0]?.cards.map((card, i) => (
              <BlackjackCard
                key={`player-${i}`}
                rank={card.rank}
                suit={card.suit}
                faceUp={card.faceUp}
                index={i}
                animate={false}
              />
            ))}
          </div>
          {playerHands[0] && (
            <HandTotalBadge
              total={playerHands[0].total}
              isSoft={playerHands[0].isSoft}
              isBust={playerHands[0].isBust}
              softAlt={
                playerHands[0].isSoft
                  ? playerHands[0].total - 10
                  : undefined
              }
            />
          )}
        </div>
      )}

      <Label text={t(TEXTS.player, lang)} />
    </BlackjackTable>
  );
}

// ============================================================================
// SUBCOMPONENTE: LABEL
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
// SUBCOMPONENTE: VIEW DE MAO DO JOGADOR (para split)
// ============================================================================

interface PlayerHandViewProps {
  hand: Hand;
  index: number;
  lang: Lang;
}

function PlayerHandView({ hand, index, lang }: PlayerHandViewProps) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "clamp(6px, 1vw, 10px)",
        padding: "clamp(12px, 1.5vw, 18px) clamp(8px, 1vw, 14px)",
        border: "1.5px solid rgba(212,168,67,0.2)",
        borderRadius: 12,
        opacity: 0.75,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "clamp(-12px, -1.5vw, -8px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(10,10,10,0.9)",
          padding: "2px clamp(6px, 0.8vw, 10px)",
          borderRadius: 4,
          border: "1px solid rgba(212,168,67,0.2)",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          fontSize: "clamp(8px, 1vw, 11px)",
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: "rgba(212,168,67,0.6)",
          whiteSpace: "nowrap",
        }}
      >
        {lang === "br" ? `MÃO ${index + 1}` : `HAND ${index + 1}`}
      </div>
      <div style={{ display: "flex", gap: "clamp(-6px, -0.8vw, -10px)" }}>
        {hand.cards.map((card, i) => (
          <BlackjackCard
            key={`h${index}c${i}`}
            rank={card.rank}
            suit={card.suit}
            faceUp={true}
            index={i}
            animate={false}
          />
        ))}
      </div>
      <HandTotalBadge
        total={hand.total}
        isSoft={hand.isSoft}
        isBust={hand.isBust}
        softAlt={hand.isSoft ? hand.total - 10 : undefined}
      />
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: PAINEL DE ACOES DIMMED (tudo cinza escuro)
// ============================================================================

interface PainelAcoesDimmedProps {
  lang: Lang;
  totalBet: number;
}

function PainelAcoesDimmed({ lang, totalBet }: PainelAcoesDimmedProps) {
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
        {/* Label AGUARDANDO */}
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
                "linear-gradient(90deg, transparent, rgba(212,168,67,0.3))",
            }}
          />
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: "clamp(10px, 1.1vw, 13px)",
              color: "rgba(212,168,67,0.5)",
              letterSpacing: "3px",
              textTransform: "uppercase",
              padding: "0 clamp(4px, 0.5vw, 6px)",
              whiteSpace: "nowrap",
            }}
          >
            {lang === "br" ? "AGUARDANDO" : "WAITING"}
          </span>
          <div
            style={{
              flex: 1,
              height: 1,
              background:
                "linear-gradient(90deg, rgba(212,168,67,0.3), transparent)",
            }}
          />
        </div>

        {/* Botoes TODOS dimmed */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(8px, 1vw, 12px)",
            pointerEvents: "none",
          }}
        >
          {ACTION_BUTTONS.map((btn) => {
            const iconPath = btn.iconKey ? ASSETS[btn.iconKey] : null;
            const textObj = TEXTS[btn.textKey] as {
              br: string;
              en: string;
            };
            const label = lang === "br" ? textObj.br : textObj.en;

            return (
              <div
                key={btn.id}
                style={{
                  padding:
                    "clamp(10px, 1.2vw, 14px) clamp(14px, 1.8vw, 20px)",
                  background: "#1A1A1A",
                  border: "1.5px solid rgba(255,255,255,0.05)",
                  borderRadius: 8,
                  color: "#FFFFFF",
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: "clamp(11px, 1.3vw, 15px)",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  minHeight: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "clamp(6px, 0.8vw, 10px)",
                  opacity: 0.3,
                  cursor: "not-allowed",
                  filter: "grayscale(0.5)",
                }}
              >
                {iconPath && (
                  <img
                    src={iconPath}
                    alt=""
                    style={{
                      width: "clamp(16px, 1.8vw, 22px)",
                      height: "clamp(16px, 1.8vw, 22px)",
                      flexShrink: 0,
                      opacity: 0.5,
                    }}
                    draggable={false}
                  />
                )}
                {label}
              </div>
            );
          })}
        </div>

        {/* Total da aposta */}
        <div style={{ marginTop: "auto" }}>
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
              <span
                style={{ fontSize: "0.55em", opacity: 0.75, marginRight: 2 }}
              >
                G$
              </span>
              {totalBet}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
