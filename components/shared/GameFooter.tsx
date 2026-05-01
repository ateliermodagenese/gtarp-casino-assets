"use client";

// GameFooter — Footer premium AAA compartilhado para todos os jogos
// F6 — 30/04/2026
//
// Container flexivel com 3 slots (leftSlot / centerSlot / rightSlot)
// Cada jogo preenche com o que faz sentido pra sua mecanica:
//   - Slots: [bet display] | [SPIN button] | [win amount]
//   - Crash: [bet input] | [BET/CASHOUT button] | [autobet toggle]
//   - Bicho: [aposta atual] | [APOSTAR button] | [proximo sorteio]
//   - Daily: [streak] | [next spin countdown] | [help] (StreakCounter ja faz)
//
// Visual:
//   - PNG footer-frame-ornamental.png nas duas pontas (espelhado)
//   - Animacao shimmer dourado infinito
//   - Bordas duplas + glow ambiental
//   - Backdrop blur premium
//
// Features:
//   - Mode: "default" (3 slots) | "compact" (1 slot central)
//   - Sticky opcional (sempre visivel)
//   - Helpers exportados: InfoChip, PrimaryActionButton, SecondaryActionButton,
//                         BalanceDisplay, WinAmountDisplay, ChipsRow
//   - Mobile responsive: <768px = coluna unica

import { type ReactNode, type CSSProperties } from "react";
import { motion } from "framer-motion";

// ============================================================
// TIPOS PUBLICOS
// ============================================================

export interface GameFooterProps {
  // 3 slots (qualquer um pode ser null)
  leftSlot?: ReactNode;
  centerSlot?: ReactNode;
  rightSlot?: ReactNode;

  // Modo compacto (so center, sem slots laterais)
  mode?: "default" | "compact";

  // Sticky (sempre visivel no fundo do container pai)
  sticky?: boolean;

  // Mostrar PNG ornamental nas pontas (default true)
  showOrnamentalFrames?: boolean;

  // Animacao shimmer dourado (default true)
  showShimmer?: boolean;

  // Custom style overrides
  style?: CSSProperties;

  // ClassName opcional
  className?: string;
}

// ============================================================
// PALETA
// ============================================================
const GOLD = {
  primary: "#D4A843",
  light: "#FFD700",
  dark: "#8B6914",
  glow: "rgba(212,168,67,0.4)",
  glowSoft: "rgba(212,168,67,0.15)",
};
const EMERALD = {
  primary: "#00C853",
  light: "#00E676",
  glow: "rgba(0,230,118,0.4)",
};
const RED = {
  light: "#FF6B6B",
  primary: "#FF4444",
  glow: "rgba(255,68,68,0.3)",
};

const FOOTER_FRAME_PNG = "/assets/shared/ui/footer-frame-ornamental.png";

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function GameFooter({
  leftSlot,
  centerSlot,
  rightSlot,
  mode = "default",
  sticky = false,
  showOrnamentalFrames = true,
  showShimmer = true,
  style,
  className,
}: GameFooterProps) {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={className}
      style={{
        position: sticky ? "sticky" : "relative",
        bottom: sticky ? 0 : undefined,
        zIndex: sticky ? 10 : undefined,
        width: "100%",
        padding: "clamp(8px, 1vw, 14px) clamp(14px, 2vw, 28px)",
        background: "linear-gradient(180deg, rgba(15,12,8,0.85) 0%, rgba(8,7,6,0.95) 100%)",
        borderTop: `1.5px solid ${GOLD.dark}`,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow: [
          `0 0 0 1px ${GOLD.glowSoft}`,
          `0 -4px 16px ${GOLD.glowSoft}`,
          "inset 0 1px 1px rgba(255,215,0,0.06)",
          "inset 0 -1px 0 rgba(0,0,0,0.4)",
        ].join(", "),
        overflow: "hidden",
        ...style,
      }}
    >
      {/* SHIMMER ANIMADO (overlay sutil dourado) */}
      {showShimmer && (
        <motion.div
          aria-hidden
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(90deg, transparent 30%, ${GOLD.glowSoft} 50%, transparent 70%)`,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      {/* PNG ORNAMENTAL ESQUERDA */}
      {showOrnamentalFrames && (
        <img
          src={FOOTER_FRAME_PNG}
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            left: "clamp(4px, 0.6vw, 8px)",
            top: "50%",
            transform: "translateY(-50%)",
            height: "clamp(32px, 4vw, 48px)",
            width: "auto",
            opacity: 0.85,
            filter: `drop-shadow(0 0 8px ${GOLD.glow})`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      {/* PNG ORNAMENTAL DIREITA (espelhado) */}
      {showOrnamentalFrames && (
        <img
          src={FOOTER_FRAME_PNG}
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            right: "clamp(4px, 0.6vw, 8px)",
            top: "50%",
            transform: "translateY(-50%) scaleX(-1)",
            height: "clamp(32px, 4vw, 48px)",
            width: "auto",
            opacity: 0.85,
            filter: `drop-shadow(0 0 8px ${GOLD.glow})`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      {/* CONTEUDO */}
      <div
        className="game-footer-content"
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: mode === "compact" ? "center" : "space-between",
          gap: "clamp(12px, 1.8vw, 24px)",
          minHeight: "clamp(48px, 5.5vw, 64px)",
          // Padding lateral pra nao sobrepor as molduras PNG
          padding: showOrnamentalFrames
            ? "0 clamp(48px, 6vw, 72px)"
            : "0",
        }}
      >
        {mode === "compact" ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {centerSlot}
          </div>
        ) : (
          <>
            {/* SLOT ESQUERDO */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(6px, 0.8vw, 12px)",
                flex: "1 1 0",
                minWidth: 0,
                justifyContent: "flex-start",
              }}
            >
              {leftSlot}
            </div>

            {/* SLOT CENTRAL (proeminente, geralmente botao primario) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "clamp(8px, 1vw, 14px)",
                flex: "0 0 auto",
              }}
            >
              {centerSlot}
            </div>

            {/* SLOT DIREITO */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(6px, 0.8vw, 12px)",
                flex: "1 1 0",
                minWidth: 0,
                justifyContent: "flex-end",
              }}
            >
              {rightSlot}
            </div>
          </>
        )}
      </div>

      {/* CSS responsive: < 768px stack vertical */}
      <style>{`
        @media (max-width: 768px) {
          .game-footer-content {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: clamp(8px, 1.5vw, 12px) !important;
            padding: 0 clamp(40px, 5vw, 56px) !important;
          }
          .game-footer-content > div {
            justify-content: center !important;
          }
        }
      `}</style>
    </motion.footer>
  );
}

// ============================================================
// HELPERS PUBLICOS — pra cada jogo usar dentro dos slots
// ============================================================

// ----------- INFO CHIP (label + value, ex: "BET: 100 GC") -----------
export interface InfoChipProps {
  label: string;
  value: string | number;
  // Cor do valor (default golden)
  valueColor?: string;
  // Cor do glow (default golden glow)
  valueGlow?: string;
  // Icone PNG opcional
  icon?: string;
  // Pulse animado (ex: "GANHOU +500" pulsando)
  pulse?: boolean;
  // Tooltip
  tooltip?: string;
  // Tamanho: "sm" | "md" | "lg"
  size?: "sm" | "md" | "lg";
}

export function InfoChip({
  label,
  value,
  valueColor = GOLD.light,
  valueGlow = GOLD.glow,
  icon,
  pulse = false,
  tooltip,
  size = "md",
}: InfoChipProps) {
  const sizeMap = {
    sm: { padding: "4px 10px", labelSize: "8px, 0.7vw, 9px", valueSize: "11px, 1vw, 13px", iconSize: "12px, 1.2vw, 14px" },
    md: { padding: "5px 12px", labelSize: "9px, 0.85vw, 11px", valueSize: "12px, 1.2vw, 15px", iconSize: "14px, 1.4vw, 16px" },
    lg: { padding: "8px 16px", labelSize: "10px, 0.95vw, 12px", valueSize: "14px, 1.5vw, 18px", iconSize: "16px, 1.6vw, 18px" },
  }[size];

  const content = (
    <motion.div
      animate={pulse ? { boxShadow: [`0 0 8px ${valueGlow}`, `0 0 16px ${valueGlow}`, `0 0 8px ${valueGlow}`] } : {}}
      transition={pulse ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "clamp(4px, 0.5vw, 7px)",
        padding: `clamp(${sizeMap.padding.split(" ").join(", ")})`,
        background: "rgba(0,0,0,0.5)",
        border: `1px solid ${GOLD.glowSoft}`,
        borderRadius: "6px",
        boxShadow: `0 0 8px ${valueGlow}30, inset 0 1px 1px rgba(255,215,0,0.04)`,
        whiteSpace: "nowrap" as const,
      }}
    >
      {icon && (
        <img
          src={icon}
          alt=""
          style={{
            width: `clamp(${sizeMap.iconSize})`,
            height: `clamp(${sizeMap.iconSize})`,
            filter: `drop-shadow(0 0 4px ${valueGlow})`,
            flexShrink: 0,
          }}
        />
      )}
      <span
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: `clamp(${sizeMap.labelSize})`,
          fontWeight: 600,
          color: "rgba(212,168,67,0.6)",
          letterSpacing: "1.2px",
          textTransform: "uppercase" as const,
        }}
      >
        {label}:
      </span>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: `clamp(${sizeMap.valueSize})`,
          fontWeight: 700,
          color: valueColor,
          textShadow: `0 0 8px ${valueGlow}`,
          fontVariantNumeric: "tabular-nums" as const,
          letterSpacing: "0.3px",
        }}
      >
        {value}
      </span>
    </motion.div>
  );

  if (tooltip) {
    return <div title={tooltip}>{content}</div>;
  }
  return content;
}

// ----------- PRIMARY ACTION BUTTON (centro, grande, circular ou retangular) -----------
export interface PrimaryActionButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  // Cor: "gold" (apostas) | "emerald" (girar/spin/play) | "red" (cashout/sair)
  variant?: "gold" | "emerald" | "red";
  // Forma: "circle" (ex: SPIN do slots) | "rectangle" (ex: APOSTAR retangular)
  shape?: "circle" | "rectangle";
  // Tamanho: "md" | "lg"
  size?: "md" | "lg";
  // Pulse glow ambiente (default true se nao disabled)
  pulse?: boolean;
  // Tooltip
  tooltip?: string;
  // Icone opcional (PNG ou ReactNode)
  icon?: ReactNode;
  // Loading state
  loading?: boolean;
  // Loading label (ex: "GIRANDO...")
  loadingLabel?: string;
}

export function PrimaryActionButton({
  onClick,
  disabled = false,
  label,
  variant = "emerald",
  shape = "rectangle",
  size = "md",
  pulse = true,
  tooltip,
  icon,
  loading = false,
  loadingLabel,
}: PrimaryActionButtonProps) {
  const palette = {
    gold: { mid: GOLD.primary, light: GOLD.light, dark: GOLD.dark, glow: GOLD.glow, fg: "#1a1300" },
    emerald: { mid: EMERALD.primary, light: EMERALD.light, dark: "#007530", glow: EMERALD.glow, fg: "#FFFFFF" },
    red: { mid: RED.primary, light: RED.light, dark: "#8B0000", glow: RED.glow, fg: "#FFFFFF" },
  }[variant];

  const isCircle = shape === "circle";
  const isLg = size === "lg";

  const dimensions = isCircle
    ? {
        width: isLg ? "clamp(56px, 7vw, 80px)" : "clamp(48px, 5.5vw, 64px)",
        height: isLg ? "clamp(56px, 7vw, 80px)" : "clamp(48px, 5.5vw, 64px)",
        borderRadius: "50%",
        padding: "0",
        fontSize: isLg ? "clamp(11px, 1.2vw, 14px)" : "clamp(9px, 1vw, 12px)",
      }
    : {
        width: "auto",
        height: "auto",
        borderRadius: "10px",
        padding: isLg
          ? "clamp(14px, 1.6vw, 18px) clamp(28px, 3.5vw, 44px)"
          : "clamp(10px, 1.2vw, 14px) clamp(20px, 2.5vw, 32px)",
        fontSize: isLg ? "clamp(13px, 1.4vw, 17px)" : "clamp(11px, 1.2vw, 14px)",
      };

  const isActive = !disabled && !loading;

  return (
    <motion.button
      onClick={isActive ? onClick : undefined}
      disabled={disabled || loading}
      whileHover={isActive ? {
        scale: isCircle ? 1.08 : 1.03,
        boxShadow: [
          `0 0 28px ${palette.glow}`,
          `0 0 0 2px ${palette.light}`,
          `inset 0 1px 1px rgba(255,255,255,0.25)`,
          "0 6px 16px rgba(0,0,0,0.5)",
        ].join(", "),
      } : undefined}
      whileTap={isActive ? { scale: isCircle ? 0.92 : 0.97 } : undefined}
      animate={isActive && pulse && !loading ? {
        boxShadow: [
          `0 0 14px ${palette.glow}, inset 0 1px 1px rgba(255,255,255,0.2), 0 4px 10px rgba(0,0,0,0.4)`,
          `0 0 24px ${palette.glow}, inset 0 1px 1px rgba(255,255,255,0.2), 0 4px 10px rgba(0,0,0,0.4)`,
          `0 0 14px ${palette.glow}, inset 0 1px 1px rgba(255,255,255,0.2), 0 4px 10px rgba(0,0,0,0.4)`,
        ],
      } : {}}
      transition={isActive && pulse && !loading ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : undefined}
      title={tooltip}
      style={{
        ...dimensions,
        background: disabled
          ? "linear-gradient(180deg, #444 0%, #333 100%)"
          : `linear-gradient(180deg, ${palette.light} 0%, ${palette.mid} 50%, ${palette.dark} 100%)`,
        color: disabled ? "rgba(255,255,255,0.3)" : palette.fg,
        border: `2px solid ${disabled ? "#555" : palette.light}`,
        cursor: disabled ? "not-allowed" : loading ? "wait" : "pointer",
        opacity: disabled ? 0.45 : 1,
        fontFamily: "'Cinzel', serif",
        fontWeight: 800,
        letterSpacing: isCircle ? "1.5px" : "3px",
        textTransform: "uppercase" as const,
        textShadow: disabled ? "none" : `0 2px 4px rgba(0,0,0,0.5), 0 0 10px ${palette.glow}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        minWidth: isCircle ? undefined : "clamp(120px, 15vw, 180px)",
        minHeight: 44,
        boxShadow: disabled ? "0 2px 6px rgba(0,0,0,0.4)" : undefined,
        transition: "opacity 0.2s",
      }}
    >
      {loading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              width: isLg ? "16px" : "14px",
              height: isLg ? "16px" : "14px",
              border: `2.5px solid ${palette.fg}`,
              borderTopColor: "transparent",
              borderRadius: "50%",
            }}
          />
          {loadingLabel || label}
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </motion.button>
  );
}

// ----------- SECONDARY ACTION BUTTON (botoes menores, MIN/MAX, settings, etc) -----------
export interface SecondaryActionButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  variant?: "gold" | "emerald" | "neutral";
  tooltip?: string;
  icon?: ReactNode;
}

export function SecondaryActionButton({
  onClick,
  disabled = false,
  label,
  variant = "gold",
  tooltip,
  icon,
}: SecondaryActionButtonProps) {
  const palette = {
    gold: { color: GOLD.primary, hover: GOLD.light, border: GOLD.glowSoft, hoverBorder: GOLD.primary, glow: GOLD.glow },
    emerald: { color: EMERALD.light, hover: "#7FFFC4", border: "rgba(0,230,118,0.18)", hoverBorder: EMERALD.primary, glow: EMERALD.glow },
    neutral: { color: "rgba(255,255,255,0.7)", hover: "#FFFFFF", border: "rgba(255,255,255,0.12)", hoverBorder: "rgba(255,255,255,0.5)", glow: "rgba(255,255,255,0.2)" },
  }[variant];

  return (
    <motion.button
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      whileHover={!disabled ? {
        scale: 1.05,
        backgroundColor: `${palette.color}15`,
        borderColor: palette.hoverBorder,
        color: palette.hover,
      } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      title={tooltip}
      style={{
        padding: "clamp(5px, 0.6vw, 8px) clamp(10px, 1.2vw, 14px)",
        background: "rgba(212,168,67,0.06)",
        border: `1px solid ${palette.border}`,
        borderRadius: "6px",
        color: palette.color,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        fontFamily: "'Cinzel', serif",
        fontSize: "clamp(9px, 0.95vw, 11px)",
        fontWeight: 700,
        letterSpacing: "1.2px",
        textTransform: "uppercase" as const,
        minWidth: "44px",
        minHeight: "44px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "5px",
        transition: "all 0.2s",
      }}
    >
      {icon}
      {label}
    </motion.button>
  );
}

// ----------- BALANCE DISPLAY (saldo formatado BR/IN) -----------
export interface BalanceDisplayProps {
  balance: number;
  lang?: "br" | "in";
  // Label custom (default "SALDO" / "BALANCE")
  label?: string;
  // Cor (default golden)
  color?: string;
  // Suffix da moeda (default "GC")
  suffix?: string;
  // Animacao quando balance muda (highlight verde se positivo, vermelho se negativo)
  flashOnChange?: boolean;
  // Direcao do flash (auto-detect se nao passado)
  flashDirection?: "up" | "down" | null;
}

export function BalanceDisplay({
  balance,
  lang = "br",
  label,
  color = GOLD.light,
  suffix = "GC",
  flashOnChange = false,
  flashDirection = null,
}: BalanceDisplayProps) {
  const labelText = label || (lang === "br" ? "SALDO" : "BALANCE");
  const formatted = balance.toLocaleString(lang === "br" ? "pt-BR" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const flashColor = flashDirection === "up" ? EMERALD.glow : flashDirection === "down" ? RED.glow : null;

  return (
    <motion.div
      animate={flashOnChange && flashColor ? {
        backgroundColor: [`rgba(0,0,0,0.5)`, flashColor.replace("0.4", "0.15"), `rgba(0,0,0,0.5)`],
      } : {}}
      transition={flashOnChange && flashColor ? { duration: 0.6 } : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "clamp(5px, 0.6vw, 8px)",
        padding: "clamp(6px, 0.8vw, 10px) clamp(12px, 1.4vw, 16px)",
        background: "rgba(0,0,0,0.55)",
        border: `1px solid ${GOLD.glowSoft}`,
        borderRadius: "8px",
        boxShadow: `0 0 12px ${GOLD.glow}, inset 0 1px 1px rgba(255,215,0,0.06)`,
      }}
    >
      <span
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "clamp(8px, 0.85vw, 10px)",
          fontWeight: 600,
          color: "rgba(212,168,67,0.55)",
          letterSpacing: "1.5px",
        }}
      >
        {labelText}:
      </span>
      <motion.span
        key={balance}
        initial={flashOnChange ? { scale: 0.95 } : undefined}
        animate={flashOnChange ? { scale: 1 } : undefined}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "clamp(13px, 1.5vw, 18px)",
          fontWeight: 700,
          color,
          textShadow: `0 0 10px ${color}66`,
          fontVariantNumeric: "tabular-nums" as const,
          letterSpacing: "0.5px",
        }}
      >
        {formatted}
      </motion.span>
      <span
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "clamp(9px, 0.95vw, 11px)",
          fontWeight: 600,
          color: "rgba(212,168,67,0.55)",
        }}
      >
        {suffix}
      </span>
    </motion.div>
  );
}

// ----------- WIN AMOUNT DISPLAY (valor ganho com pulse esmeralda) -----------
export interface WinAmountDisplayProps {
  amount: number;
  lang?: "br" | "in";
  suffix?: string;
  // Reset trigger (qualquer mudanca aqui dispara animacao count-up)
  showAnimation?: boolean;
  // Modo: "win" (verde + glow) | "loss" (vermelho)
  mode?: "win" | "loss";
}

export function WinAmountDisplay({
  amount,
  lang = "br",
  suffix = "GC",
  showAnimation = false,
  mode = "win",
}: WinAmountDisplayProps) {
  if (amount === 0) return null;

  const palette = mode === "win"
    ? { color: EMERALD.light, glow: EMERALD.glow, sign: "+", bg: "rgba(0,230,118,0.06)" }
    : { color: RED.light, glow: RED.glow, sign: "-", bg: "rgba(255,68,68,0.06)" };

  const formatted = Math.abs(amount).toLocaleString(lang === "br" ? "pt-BR" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <motion.div
      key={`${amount}-${mode}`}
      initial={showAnimation ? { scale: 0.7, opacity: 0, y: 10 } : undefined}
      animate={showAnimation ? { scale: 1, opacity: 1, y: 0 } : undefined}
      transition={{ type: "spring", stiffness: 280, damping: 16 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "clamp(4px, 0.5vw, 6px)",
        padding: "clamp(6px, 0.8vw, 10px) clamp(12px, 1.4vw, 16px)",
        background: palette.bg,
        border: `1.5px solid ${palette.color}`,
        borderRadius: "8px",
        boxShadow: `0 0 16px ${palette.glow}, inset 0 1px 1px rgba(255,255,255,0.05)`,
      }}
    >
      <motion.span
        animate={{
          textShadow: [
            `0 0 8px ${palette.glow}`,
            `0 0 16px ${palette.glow}`,
            `0 0 8px ${palette.glow}`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "clamp(14px, 1.6vw, 19px)",
          fontWeight: 800,
          color: palette.color,
          fontVariantNumeric: "tabular-nums" as const,
          letterSpacing: "0.5px",
        }}
      >
        {palette.sign}{formatted}
      </motion.span>
      <span
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "clamp(10px, 1vw, 12px)",
          fontWeight: 600,
          color: palette.color,
          opacity: 0.75,
        }}
      >
        {suffix}
      </span>
    </motion.div>
  );
}

// ----------- CHIPS ROW (linha de chips de aposta MIN x2 /2 MAX) -----------
export interface ChipsRowProps {
  // Lista de botoes
  chips: { label: string; onClick: () => void; tooltip?: string; disabled?: boolean }[];
}

export function ChipsRow({ chips }: ChipsRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "clamp(3px, 0.4vw, 5px)",
      }}
    >
      {chips.map((chip, idx) => (
        <SecondaryActionButton
          key={idx}
          label={chip.label}
          onClick={chip.onClick}
          tooltip={chip.tooltip}
          disabled={chip.disabled}
          variant="gold"
        />
      ))}
    </div>
  );
}

// ----------- COUNTDOWN DISPLAY (timer regressivo HH:MM:SS) -----------
export interface CountdownDisplayProps {
  // Tempo restante em ms
  remainingMs: number;
  label?: string;
  lang?: "br" | "in";
  // Tamanho
  size?: "sm" | "md" | "lg";
  // Cor (auto: dourado normal, vermelho se < 1 min)
  color?: string;
}

export function CountdownDisplay({
  remainingMs,
  label,
  lang = "br",
  size = "md",
  color,
}: CountdownDisplayProps) {
  const labelText = label || (lang === "br" ? "PROXIMO" : "NEXT");
  const isUrgent = remainingMs < 60000 && remainingMs > 0;
  const finalColor = color || (isUrgent ? RED.light : GOLD.light);
  const finalGlow = isUrgent ? RED.glow : GOLD.glow;

  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const formatted = hours > 0
    ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    : `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const sizeMap = {
    sm: { label: "8px, 0.75vw, 10px", value: "12px, 1.3vw, 15px", padding: "5px 10px" },
    md: { label: "9px, 0.85vw, 11px", value: "14px, 1.5vw, 18px", padding: "6px 12px" },
    lg: { label: "10px, 0.95vw, 12px", value: "18px, 2vw, 24px", padding: "8px 16px" },
  }[size];

  return (
    <motion.div
      animate={isUrgent ? { scale: [1, 1.04, 1] } : {}}
      transition={isUrgent ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "clamp(5px, 0.6vw, 8px)",
        padding: `clamp(${sizeMap.padding.split(" ").join(", ")})`,
        background: "rgba(0,0,0,0.55)",
        border: `1px solid ${finalColor}30`,
        borderRadius: "6px",
        boxShadow: `0 0 10px ${finalGlow}40`,
      }}
    >
      <span
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: `clamp(${sizeMap.label})`,
          fontWeight: 600,
          color: "rgba(212,168,67,0.55)",
          letterSpacing: "1.5px",
          textTransform: "uppercase" as const,
        }}
      >
        {labelText}:
      </span>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: `clamp(${sizeMap.value})`,
          fontWeight: 700,
          color: finalColor,
          textShadow: `0 0 8px ${finalGlow}`,
          fontVariantNumeric: "tabular-nums" as const,
          letterSpacing: "1px",
        }}
      >
        {formatted}
      </span>
    </motion.div>
  );
}
