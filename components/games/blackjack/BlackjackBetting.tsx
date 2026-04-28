"use client";

// Blackjack Tela 1 — BETTING (posicionando apostas)
// Mesa central com felt + painel lateral Art Deco
// 6 fichas PNG em grid 2x3, side bets PP e 21+3
// Botao DISTRIBUIR no rodape do painel

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ASSETS, COLORS, CHIPS, TEXTS, t } from "./BlackjackConstants";
import type { Lang } from "./BlackjackTypes";
import BlackjackTable from "./BlackjackTable";
import LuxuryTooltip from "@/components/shared/LuxuryTooltip";

// ============================================================================
// PROPS
// ============================================================================

export interface BlackjackBettingProps {
  lang: Lang;
  balance: number;
  onDeal: (bet: { main: number; pp: number; plus21: number }) => void;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export default function BlackjackBetting({
  lang,
  balance,
  onDeal,
}: BlackjackBettingProps) {
  const [mainBet, setMainBet] = useState(0);
  const [selectedChipIndex, setSelectedChipIndex] = useState<number | null>(
    null,
  );
  const [sideBetPP, setSideBetPP] = useState(0);
  const [sideBet21, setSideBet21] = useState(0);

  const totalBet = mainBet + sideBetPP + sideBet21;
  const remaining = balance - totalBet;
  const canDeal = mainBet > 0;

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleChipClick = useCallback(
    (index: number) => {
      const chipValue = CHIPS[index].value;
      if (chipValue > remaining) return;
      setSelectedChipIndex(index);
      setMainBet((prev) => prev + chipValue);
    },
    [remaining],
  );

  const handleClear = useCallback(() => {
    setMainBet(0);
    setSideBetPP(0);
    setSideBet21(0);
    setSelectedChipIndex(null);
  }, []);

  const handleToggleSideBet = useCallback(
    (type: "PP" | "21+3") => {
      const chipValue =
        selectedChipIndex !== null ? CHIPS[selectedChipIndex].value : 10;

      if (type === "PP") {
        setSideBetPP((prev) =>
          prev > 0 ? 0 : Math.min(chipValue, balance - mainBet - sideBet21),
        );
      } else {
        setSideBet21((prev) =>
          prev > 0 ? 0 : Math.min(chipValue, balance - mainBet - sideBetPP),
        );
      }
    },
    [selectedChipIndex, balance, mainBet, sideBetPP, sideBet21],
  );

  const handleDeal = useCallback(() => {
    if (!canDeal) return;
    onDeal({ main: mainBet, pp: sideBetPP, plus21: sideBet21 });
  }, [canDeal, mainBet, sideBetPP, sideBet21, onDeal]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

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
          mainBet={mainBet}
          sideBetPP={sideBetPP}
          sideBet21={sideBet21}
          lang={lang}
          onTogglePP={() => handleToggleSideBet("PP")}
          onToggle21={() => handleToggleSideBet("21+3")}
        />
      </div>

      {/* PAINEL LATERAL DIREITO */}
      <PainelLateral
        lang={lang}
        totalBet={totalBet}
        selectedChipIndex={selectedChipIndex}
        remaining={remaining}
        canDeal={canDeal}
        onChipClick={handleChipClick}
        onClear={handleClear}
        onDeal={handleDeal}
      />
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: MESA (centralizada)
// ============================================================================

interface MesaProps {
  mainBet: number;
  sideBetPP: number;
  sideBet21: number;
  lang: Lang;
  onTogglePP: () => void;
  onToggle21: () => void;
}

function Mesa({
  mainBet,
  sideBetPP,
  sideBet21,
  lang,
  onTogglePP,
  onToggle21,
}: MesaProps) {
  return (
    <BlackjackTable>
      {/* Label DEALER */}
      <Label text={t(TEXTS.dealer, lang)} />

      {/* Area do dealer (vazia na Tela 1) */}
      <div style={{ height: "clamp(80px, 12vw, 140px)", width: "100%" }} />

      {/* Divider central dourado */}
      <div
        style={{
          width: "60%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(212,168,67,0.15), transparent)",
        }}
      />

      {/* Side bets PP e 21+3 nas laterais */}
      <LuxuryTooltip text={t(TEXTS.tooltips.pp, lang)} position="right">
        <SideBetBox
          type="PP"
          position="left"
          value={sideBetPP}
          onClick={onTogglePP}
        />
      </LuxuryTooltip>
      <LuxuryTooltip text={t(TEXTS.tooltips.twentyOnePlus3, lang)} position="left">
        <SideBetBox
          type="21+3"
          position="right"
          value={sideBet21}
          onClick={onToggle21}
        />
      </LuxuryTooltip>

      {/* Area de aposta principal - CENTRO */}
      <BetArea value={mainBet} lang={lang} />

      {/* Label PLAYER */}
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
        position: "relative",
        zIndex: 1,
      }}
    >
      {text}
    </span>
  );
}

// ============================================================================
// SUBCOMPONENTE: BET AREA (area de aposta principal)
// ============================================================================

interface BetAreaProps {
  value: number;
  lang: Lang;
}

function BetArea({ value, lang }: BetAreaProps) {
  const isEmpty = value === 0;

  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        minWidth: "clamp(140px, 20vw, 220px)",
        minHeight: "clamp(70px, 10vw, 110px)",
        padding: "clamp(10px, 1.5vw, 18px)",
        border: isEmpty
          ? "2px dashed rgba(212,168,67,0.25)"
          : "2px solid rgba(0,230,118,0.3)",
        borderRadius: "clamp(6px, 1vw, 10px)",
        background: isEmpty
          ? "rgba(255,255,255,0.02)"
          : "rgba(0,230,118,0.03)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(4px, 0.5vw, 6px)",
      }}
    >
      {isEmpty ? (
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 600,
            fontSize: "clamp(10px, 1.2vw, 13px)",
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          {t(TEXTS.placeBet, lang)}
        </span>
      ) : (
        <>
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 600,
              fontSize: "clamp(9px, 1vw, 11px)",
              color: "rgba(212,168,67,0.7)",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            {t(TEXTS.currentBet, lang)}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 800,
              fontSize: "clamp(18px, 2.5vw, 30px)",
              color: COLORS.greenNeon,
              textShadow:
                "0 0 12px rgba(0,230,118,0.6), 0 1px 2px rgba(0,0,0,0.8)",
              lineHeight: 1,
            }}
          >
            <span style={{ fontSize: "0.55em", opacity: 0.75 }}>G$</span>
            {value}
          </span>
        </>
      )}
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: SIDE BET BOX (PP ou 21+3)
// ============================================================================

interface SideBetBoxProps {
  type: "PP" | "21+3";
  position: "left" | "right";
  value: number;
  onClick: () => void;
}

function SideBetBox({ type, position, value, onClick }: SideBetBoxProps) {
  const hasBet = value > 0;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        position: "absolute",
        top: "50%",
        [position]: "clamp(16px, 3vw, 40px)",
        transform: "translateY(-50%)",
        width: "clamp(52px, 7vw, 72px)",
        minHeight: "clamp(52px, 7vw, 72px)",
        padding: "clamp(6px, 0.8vw, 10px)",
        background: hasBet
          ? "rgba(0,230,118,0.08)"
          : "rgba(212,168,67,0.04)",
        border: hasBet
          ? `1.5px solid rgba(0,230,118,0.5)`
          : `1px solid rgba(212,168,67,0.2)`,
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        cursor: "pointer",
        zIndex: 2,
      }}
    >
      <span
        style={{
          fontFamily: "'Cinzel', serif",
          fontWeight: 700,
          fontSize: "clamp(9px, 1.1vw, 12px)",
          color: hasBet ? COLORS.greenNeon : "rgba(212,168,67,0.6)",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        {type}
      </span>
      {hasBet && (
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: "clamp(10px, 1.1vw, 13px)",
            color: COLORS.greenNeon,
            textShadow: "0 0 6px rgba(0,230,118,0.5)",
          }}
        >
          {value}
        </span>
      )}
    </motion.button>
  );
}

// ============================================================================
// SUBCOMPONENTE: PAINEL LATERAL DIREITO (Art Deco)
// ============================================================================

interface PainelLateralProps {
  lang: Lang;
  totalBet: number;
  selectedChipIndex: number | null;
  remaining: number;
  canDeal: boolean;
  onChipClick: (index: number) => void;
  onClear: () => void;
  onDeal: () => void;
}

function PainelLateral({
  lang,
  totalBet,
  selectedChipIndex,
  remaining,
  canDeal,
  onChipClick,
  onClear,
  onDeal,
}: PainelLateralProps) {
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
        {/* Label "SUAS FICHAS" */}
        <OrnamentLabel text={t(TEXTS.yourChips, lang)} />

        {/* Chip tray (bandeja de fichas) */}
        <ChipTray
          selectedIndex={selectedChipIndex}
          remaining={remaining}
          onChipClick={onChipClick}
        />

        {/* Separador ornamentado */}
        <OrnamentSeparator />

        {/* Display da aposta atual */}
        <BetDisplay value={totalBet} lang={lang} onClear={onClear} />

        {/* Botao DISTRIBUIR (empurra pro rodape) */}
        <div style={{ marginTop: "auto" }}>
          <LuxuryTooltip text={t(TEXTS.tooltips.deal, lang)} position="top">
            <DealButton lang={lang} enabled={canDeal} onClick={onDeal} />
          </LuxuryTooltip>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: LABEL ORNAMENTADO ("--- SUAS FICHAS ---")
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
// SUBCOMPONENTE: CHIP TRAY (bandeja de fichas 2x3)
// ============================================================================

interface ChipTrayProps {
  selectedIndex: number | null;
  remaining: number;
  onChipClick: (index: number) => void;
}

function ChipTray({ selectedIndex, remaining, onChipClick }: ChipTrayProps) {
  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "clamp(14px, 1.8vw, 22px)",
        padding: "clamp(16px, 2vw, 24px) clamp(12px, 1.5vw, 18px)",
        background:
          "radial-gradient(ellipse at 50% 50%, rgba(30,20,8,0.6) 0%, rgba(10,6,2,0.8) 100%)",
        border: "1px solid rgba(212,168,67,0.25)",
        borderRadius: 4,
        boxShadow:
          "inset 0 2px 8px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(212,168,67,0.15), inset 0 1px 0 rgba(0,0,0,0.9), 0 1px 0 rgba(212,168,67,0.1)",
      }}
    >
      {CHIPS.map((chip, i) => {
        const selected = selectedIndex === i;
        const disabled = chip.value > remaining + (selected ? chip.value : 0);

        return (
          <div
            key={chip.path}
            onClick={() => !disabled && onChipClick(i)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(6px, 0.8vw, 10px)",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.35 : 1,
            }}
          >
            <img
              src={chip.path}
              alt={`G$${chip.value}`}
              style={{
                width: "clamp(60px, 7vw, 88px)",
                height: "clamp(60px, 7vw, 88px)",
                filter: selected
                  ? "drop-shadow(0 4px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 16px rgba(212,168,67,0.9)) drop-shadow(0 0 32px rgba(255,215,0,0.6))"
                  : "drop-shadow(0 3px 6px rgba(0,0,0,0.5))",
                transform: selected ? "scale(1.12) translateY(-2px)" : "scale(1)",
                transition:
                  "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                animation: selected
                  ? "bjChipPulse 1.5s ease-in-out infinite"
                  : "none",
                pointerEvents: "none",
                userSelect: "none",
              }}
              draggable={false}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: "clamp(10px, 1.1vw, 13px)",
                color: selected
                  ? COLORS.goldLight
                  : "rgba(212,168,67,0.75)",
                textShadow: selected
                  ? "0 0 8px rgba(255,215,0,0.6)"
                  : "0 1px 2px rgba(0,0,0,0.8)",
                letterSpacing: "0.5px",
                transition: "all 0.2s",
              }}
            >
              {chip.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: SEPARADOR ORNAMENTADO (diamante central)
// ============================================================================

function OrnamentSeparator() {
  return (
    <div
      style={{
        position: "relative",
        width: "80%",
        alignSelf: "center",
        height: 2,
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
// SUBCOMPONENTE: BET DISPLAY (aposta atual + botao limpar)
// ============================================================================

interface BetDisplayProps {
  value: number;
  lang: Lang;
  onClear: () => void;
}

function BetDisplay({ value, lang, onClear }: BetDisplayProps) {
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
        border: `1px solid rgba(0,230,118,0.2)`,
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
        {t(TEXTS.currentBet, lang)}
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

      {value > 0 && (
        <motion.button
          whileHover={{ borderColor: "rgba(255,82,82,0.6)" }}
          whileTap={{ scale: 0.97 }}
          onClick={onClear}
          style={{
            padding: "clamp(4px, 0.5vw, 6px) clamp(10px, 1.3vw, 14px)",
            background: "transparent",
            border: "1px solid rgba(255,82,82,0.3)",
            borderRadius: 4,
            color: "rgba(255,82,82,0.8)",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: "clamp(9px, 1vw, 11px)",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {t(TEXTS.clear, lang)}
        </motion.button>
      )}
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: DEAL BUTTON (DISTRIBUIR)
// ============================================================================

interface DealButtonProps {
  lang: Lang;
  enabled: boolean;
  onClick: () => void;
}

function DealButton({ lang, enabled, onClick }: DealButtonProps) {
  return (
    <motion.button
      whileHover={enabled ? { translateY: -2 } : {}}
      whileTap={enabled ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={!enabled}
      style={{
        position: "relative",
        width: "100%",
        padding: "clamp(14px, 1.8vw, 20px)",
        background: enabled
          ? `linear-gradient(180deg, ${COLORS.greenNeon} 0%, ${COLORS.greenMid} 40%, ${COLORS.greenMid} 60%, ${COLORS.greenDark} 100%)`
          : "#1A1A1A",
        border: enabled
          ? `1.5px solid rgba(0,230,118,0.5)`
          : "1.5px solid rgba(255,255,255,0.05)",
        borderRadius: 8,
        color: "#FFFFFF",
        fontFamily: "'Cinzel', serif",
        fontWeight: 800,
        fontSize: "clamp(13px, 1.5vw, 18px)",
        letterSpacing: "3px",
        textTransform: "uppercase",
        textShadow: enabled
          ? "0 1px 3px rgba(0,0,0,0.7), 0 0 12px rgba(0,230,118,0.5)"
          : "none",
        cursor: enabled ? "pointer" : "not-allowed",
        minHeight: 56,
        overflow: "hidden",
        boxShadow: enabled
          ? "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 20px rgba(0,200,83,0.4), 0 2px 8px rgba(0,0,0,0.5)"
          : "none",
        opacity: enabled ? 1 : 0.35,
        transition: "all 0.2s",
      }}
    >
      {/* Bevel highlight topo */}
      {enabled && (
        <div
          style={{
            position: "absolute",
            top: 2,
            left: "15%",
            right: "15%",
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
          }}
        />
      )}
      {t(TEXTS.deal, lang)}
    </motion.button>
  );
}
