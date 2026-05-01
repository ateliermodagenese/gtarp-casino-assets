"use client";

// ClaimedState — Overlay "Volte amanha" do Daily-Free
// F3.G - 30/04/2026
//
// Aparece sobre a wheel quando jogador ja claimou hoje (cooldown 24h ativo).
// Visual luxo (referencia: Imagem 9 do BC):
//   - Frame ornamental dourado em volta
//   - Relogio SVG gigante (countdown HH:MM:SS atualiza a cada segundo)
//   - Texto "VOLTE AMANHA" Cinzel dourado
//   - Botao Make-Up Token (so aparece se restam tokens E houve gap > 24h)
//
// Bilingue BR/IN automatico

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ClaimedStateProps {
  // Timestamp ISO do ultimo claim (para calcular cooldown 24h-rolling)
  lastClaimAt: string;
  cooldownHours?: number;
  // Tokens de recuperacao restantes (pra mostrar opcao se streak em risco)
  makeupTokensRemaining: number;
  // Flag: streak em risco? (so true se gap > 24h + grace period)
  // Quando true e tokens > 0, mostra botao "Recuperar Streak"
  streakAtRisk: boolean;
  onUseMakeupToken: () => void;
  lang: "br" | "in" | "en";
}

const GOLD = {
  primary: "#D4A843",
  light: "#FFD700",
  dark: "#8B6914",
  glow: "rgba(212,168,67,0.55)",
};

const EMERALD = {
  primary: "#00C853",
  light: "#00E676",
  glow: "rgba(0,230,118,0.45)",
};

const FRAME_LUXO = "/assets/games/daily-free/frame-luxo-ornamental.png";
const DIVIDER_GOLD = "/assets/shared/ui/divider-ornamental-gold.png";

function normalizeLang(lang: "br" | "in" | "en"): "br" | "in" {
  return lang === "en" ? "in" : lang;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, "0")).join(":");
}

function calculateCooldownMs(lastClaimAt: string, cooldownHours: number): number {
  const lastMs = new Date(lastClaimAt).getTime();
  const expireMs = lastMs + cooldownHours * 3600000;
  return Math.max(0, expireMs - Date.now());
}

export default function ClaimedState({
  lastClaimAt,
  cooldownHours = 24,
  makeupTokensRemaining,
  streakAtRisk,
  onUseMakeupToken,
  lang,
}: ClaimedStateProps) {
  const langNorm = normalizeLang(lang);
  const [remainingMs, setRemainingMs] = useState(() =>
    calculateCooldownMs(lastClaimAt, cooldownHours)
  );

  // Timer ticking a cada segundo
  useEffect(() => {
    const update = () => setRemainingMs(calculateCooldownMs(lastClaimAt, cooldownHours));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lastClaimAt, cooldownHours]);

  // Mostrar botao de Make-Up apenas se streak em risco E tokens disponiveis
  const showMakeupButton = streakAtRisk && makeupTokensRemaining > 0;

  // Textos bilingues
  const T = {
    br: {
      titulo: "VOLTE AMANHÃ",
      subtitulo: "Próximo giro disponível em",
      streakRiskTitle: "STREAK EM RISCO!",
      streakRiskSub: "Use um Token de Recuperação para manter sua sequência",
      makeupBtn: "RECUPERAR STREAK",
      makeupRemaining: (n: number) =>
        `${n} ${n === 1 ? "token disponível" : "tokens disponíveis"}`,
      voltaJa: "Disponível agora!",
    },
    in: {
      titulo: "COME BACK TOMORROW",
      subtitulo: "Next spin available in",
      streakRiskTitle: "STREAK AT RISK!",
      streakRiskSub: "Use a Make-Up Token to keep your streak alive",
      makeupBtn: "RECOVER STREAK",
      makeupRemaining: (n: number) =>
        `${n} ${n === 1 ? "token available" : "tokens available"}`,
      voltaJa: "Available now!",
    },
  }[langNorm];

  // Caso especial: cooldown ja expirou (deveria ter mudado de tela mas garante visual)
  const expired = remainingMs <= 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Backdrop com blur leve no que esta atras (wheel/calendar/streak)
        background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        padding: "clamp(20px, 3vw, 40px)",
      }}
    >
      {/* CARD CENTRAL com frame ornamental dourado */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        style={{
          position: "relative",
          maxWidth: "min(540px, 90vw)",
          width: "100%",
          padding: "clamp(40px, 5vw, 60px) clamp(24px, 3.5vw, 48px)",
          // Frame PNG ornamental como background
          backgroundImage: `url("${FRAME_LUXO}")`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          // Fundo escuro por dentro (atras do PNG semi-transparente)
          background: `
            url("${FRAME_LUXO}") center / 100% 100% no-repeat,
            linear-gradient(180deg, rgba(20,16,12,0.92) 0%, rgba(8,7,6,0.96) 100%)
          `,
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(14px, 2vw, 24px)",
          textAlign: "center",
          boxShadow: [
            `0 0 40px ${GOLD.glow}`,
            `0 0 80px rgba(212,168,67,0.2)`,
            "0 20px 60px rgba(0,0,0,0.7)",
          ].join(", "),
        }}
      >
        {/* RELOGIO SVG GIGANTE com countdown */}
        <ClockSVG canClaim={expired} />

        {/* Texto principal */}
        <h2
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 800,
            fontSize: "clamp(20px, 2.6vw, 32px)",
            background: `linear-gradient(180deg, ${GOLD.light} 0%, ${GOLD.primary} 50%, ${GOLD.dark} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: GOLD.primary,
            letterSpacing: "4px",
            margin: 0,
            filter: `drop-shadow(0 0 12px ${GOLD.glow}) drop-shadow(0 2px 4px rgba(0,0,0,0.6))`,
            lineHeight: 1.1,
          }}
        >
          {expired ? T.voltaJa : T.titulo}
        </h2>

        {/* Subtitle */}
        {!expired && (
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 600,
              fontSize: "clamp(11px, 1.1vw, 13px)",
              color: "rgba(212,168,67,0.7)",
              letterSpacing: "2px",
              marginTop: "-6px",
            }}
          >
            {T.subtitulo}
          </div>
        )}

        {/* COUNTDOWN GIGANTE */}
        {!expired && (
          <motion.div
            animate={{
              textShadow: [
                `0 0 12px ${GOLD.glow}, 0 2px 4px rgba(0,0,0,0.7)`,
                `0 0 20px ${GOLD.light}, 0 0 40px ${GOLD.glow}, 0 2px 4px rgba(0,0,0,0.7)`,
                `0 0 12px ${GOLD.glow}, 0 2px 4px rgba(0,0,0,0.7)`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "clamp(36px, 5.5vw, 60px)",
              color: GOLD.light,
              letterSpacing: "4px",
              fontVariantNumeric: "tabular-nums" as const,
              lineHeight: 1,
              padding: "clamp(8px, 1.2vw, 14px) clamp(16px, 2.4vw, 28px)",
              background: "linear-gradient(180deg, rgba(20,16,12,0.7) 0%, rgba(8,7,6,0.85) 100%)",
              border: `1.5px solid ${GOLD.dark}`,
              borderRadius: "10px",
              boxShadow: [
                `inset 0 1px 2px rgba(255,215,0,0.15)`,
                "inset 0 -1px 3px rgba(0,0,0,0.6)",
              ].join(", "),
            }}
          >
            {formatCountdown(remainingMs)}
          </motion.div>
        )}

        {/* DIVIDER + Make-Up Token (so aparece se streak em risco) */}
        {showMakeupButton && (
          <>
            <img
              src={DIVIDER_GOLD}
              alt=""
              aria-hidden
              style={{
                width: "70%",
                height: "auto",
                opacity: 0.85,
                filter: `drop-shadow(0 0 6px ${GOLD.glow})`,
              }}
            />

            {/* Aviso de streak em risco */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                width: "100%",
              }}
            >
              <div
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 800,
                  fontSize: "clamp(13px, 1.4vw, 16px)",
                  color: "#FF6B6B",
                  letterSpacing: "2px",
                  textShadow: "0 0 10px rgba(255,107,107,0.5)",
                }}
              >
                ⚠ {T.streakRiskTitle}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: "clamp(11px, 1.1vw, 13px)",
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: 1.5,
                }}
              >
                {T.streakRiskSub}
              </div>
            </div>

            {/* BOTAO RECUPERAR STREAK */}
            <motion.button
              onClick={onUseMakeupToken}
              whileHover={{
                scale: 1.04,
                boxShadow: `0 0 24px ${EMERALD.glow}, 0 0 0 2px ${EMERALD.light}, inset 0 0 12px rgba(0,230,118,0.25)`,
              }}
              whileTap={{ scale: 0.96 }}
              animate={{
                boxShadow: [
                  `0 0 14px ${EMERALD.glow}, 0 0 0 1.5px ${EMERALD.primary}, inset 0 1px 2px rgba(0,230,118,0.2)`,
                  `0 0 24px ${EMERALD.light}, 0 0 0 2px ${EMERALD.light}, inset 0 1px 2px rgba(0,230,118,0.3)`,
                  `0 0 14px ${EMERALD.glow}, 0 0 0 1.5px ${EMERALD.primary}, inset 0 1px 2px rgba(0,230,118,0.2)`,
                ],
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              style={{
                padding: "clamp(10px, 1.4vw, 14px) clamp(28px, 4vw, 44px)",
                background: `linear-gradient(180deg, ${EMERALD.light} 0%, ${EMERALD.primary} 50%, #007530 100%)`,
                border: `2px solid ${EMERALD.light}`,
                borderRadius: "10px",
                cursor: "pointer",
                fontFamily: "'Cinzel', serif",
                fontWeight: 800,
                fontSize: "clamp(12px, 1.3vw, 15px)",
                color: "#FFFFFF",
                letterSpacing: "3px",
                textShadow: "0 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(0,230,118,0.4)",
                minWidth: "clamp(180px, 24vw, 280px)",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                alignItems: "center",
              }}
            >
              <span>{T.makeupBtn}</span>
              <span
                style={{
                  fontSize: "clamp(9px, 0.95vw, 11px)",
                  fontWeight: 600,
                  letterSpacing: "1.5px",
                  opacity: 0.85,
                  textTransform: "none",
                }}
              >
                {T.makeupRemaining(makeupTokensRemaining)}
              </span>
            </motion.button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// SUBCOMPONENTE: ClockSVG (relogio dourado decorativo)
// ============================================================
function ClockSVG({ canClaim }: { canClaim: boolean }) {
  const color = canClaim ? EMERALD.light : GOLD.primary;
  const glow = canClaim ? EMERALD.glow : GOLD.glow;

  return (
    <motion.svg
      viewBox="0 0 100 100"
      width="clamp(80px, 10vw, 130px)"
      height="clamp(80px, 10vw, 130px)"
      animate={
        canClaim
          ? {
              scale: [1, 1.08, 1],
              filter: [
                `drop-shadow(0 0 12px ${glow})`,
                `drop-shadow(0 0 24px ${glow})`,
                `drop-shadow(0 0 12px ${glow})`,
              ],
            }
          : undefined
      }
      transition={canClaim ? { duration: 1.5, repeat: Infinity } : undefined}
      style={{
        filter: !canClaim ? `drop-shadow(0 0 14px ${glow})` : undefined,
      }}
    >
      {/* Aro externo grosso dourado (textura metalica via gradient) */}
      <defs>
        <radialGradient id="clock-gold-grad" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor={GOLD.light} />
          <stop offset="60%" stopColor={GOLD.primary} />
          <stop offset="100%" stopColor={GOLD.dark} />
        </radialGradient>
      </defs>

      {/* Aro externo */}
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="url(#clock-gold-grad)"
        strokeWidth="5"
      />
      {/* Aro interno */}
      <circle cx="50" cy="50" r="38" fill="rgba(8,7,6,0.7)" stroke={color} strokeWidth="1" />

      {/* Marcacoes das 12 horas */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const isHour3 = i === 0 || i === 3 || i === 6 || i === 9;
        const x1 = 50 + Math.cos(angle) * 33;
        const y1 = 50 + Math.sin(angle) * 33;
        const x2 = 50 + Math.cos(angle) * (isHour3 ? 25 : 28);
        const y2 = 50 + Math.sin(angle) * (isHour3 ? 25 : 28);
        return (
          <line
            key={`mark-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={isHour3 ? "2" : "1.2"}
            strokeLinecap="round"
          />
        );
      })}

      {/* Ponteiro das horas (decorativo, posicao fixa em ~10:10 padrao de catalogo) */}
      <line
        x1="50"
        y1="50"
        x2="38"
        y2="32"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${glow})` }}
      />
      {/* Ponteiro dos minutos */}
      <line
        x1="50"
        y1="50"
        x2="64"
        y2="22"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${glow})` }}
      />
      {/* Ponteiro dos segundos animado (girando) */}
      <motion.line
        x1="50"
        y1="50"
        x2="50"
        y2="14"
        stroke={EMERALD.light}
        strokeWidth="1.2"
        strokeLinecap="round"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        style={{
          transformOrigin: "50px 50px",
          filter: `drop-shadow(0 0 4px ${EMERALD.glow})`,
        }}
      />
      {/* Pino central */}
      <circle cx="50" cy="50" r="2.5" fill={GOLD.light} />
    </motion.svg>
  );
}
