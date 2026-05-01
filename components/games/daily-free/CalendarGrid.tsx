"use client";

// CalendarGrid — Calendario 7x4 do Daily-Free com badges PNG nos milestones
// F3.D - 30/04/2026
//
// Estados das 28 celulas:
//   - claimed (dias passados ja reivindicados): numero discreto + check verde esmeralda
//   - today (dia atual): borda dourada brilhante + numero grande + pulse animado
//   - future (proximos dias): numero opaco, sem decoracao
//   - milestone passado (D7/D14/D21 ja claimados): badge PNG colorido + glow tier
//   - milestone presente (D28 sendo atingido agora): badge PNG + pulse celebrativo
//   - milestone futuro (locked): badge PNG dessaturado + icon-lock por cima
//
// Layout responsivo: grid 7 colunas, gap dinamico, celulas aspect-ratio 1
// Bilingue BR/IN: usa badges com sufixo correto (-BR ou -IN)

import { motion } from "framer-motion";

interface CalendarGridProps {
  // Dia atual no ciclo (1-28)
  currentDay: number;
  // Tamanho do ciclo (default 28)
  cycleDays?: number;
  // Idioma (afeta qual badge PNG carrega)
  lang: "br" | "in" | "en";
  // Lista de dias ja claimados [1, 2, 3, ...] — para mostrar checkmarks
  // (em geral sao os dias <= currentDay - 1)
  claimedDays?: number[];
}

const GOLD = {
  primary: "#D4A843",
  light: "#FFD700",
  dark: "#8B6914",
  glow: "rgba(212,168,67,0.5)",
};

const EMERALD = {
  primary: "#00C853",
  light: "#00E676",
  glow: "rgba(0,230,118,0.5)",
};

// Os 4 milestones com seus tiers visuais (paleta progressiva dos badges)
const MILESTONES = [7, 14, 21, 28] as const;
type Milestone = typeof MILESTONES[number];

const MILESTONE_TIERS: Record<Milestone, { glow: string; tierName: string }> = {
  7:  { glow: "rgba(75, 105, 255, 0.5)",  tierName: "azul"   }, // azul royal
  14: { glow: "rgba(155, 95, 230, 0.5)",  tierName: "roxo"   }, // roxo violeta
  21: { glow: "rgba(0, 230, 118, 0.5)",   tierName: "verde"  }, // verde esmeralda
  28: { glow: "rgba(255, 215, 0, 0.6)",   tierName: "ouro"   }, // ouro+diamante
};

function isMilestone(day: number): day is Milestone {
  return MILESTONES.includes(day as Milestone);
}

// Path do badge PNG dependendo do milestone e idioma
function badgePath(milestone: Milestone, lang: "br" | "in"): string {
  return `/assets/games/daily-free/badges/badge-streak-${milestone}-${lang.toUpperCase()}.png`;
}

const ICON_LOCK = "/assets/games/daily-free/icons/icon-lock.png";
const DIVIDER_GOLD = "/assets/shared/ui/divider-ornamental-gold.png";

// Normaliza idioma (projeto canonico usa "br"|"in", mas aceita "en" legado)
function normalizeLang(lang: "br" | "in" | "en"): "br" | "in" {
  return lang === "en" ? "in" : lang;
}

export default function CalendarGrid({
  currentDay,
  cycleDays = 28,
  lang,
  claimedDays,
}: CalendarGridProps) {
  const langNorm = normalizeLang(lang);
  // Se claimedDays nao passado, assume todos os dias < currentDay como claimados
  const claimed = new Set(
    claimedDays ?? Array.from({ length: currentDay - 1 }, (_, i) => i + 1)
  );

  // Texto bilingue do header
  const headerText =
    langNorm === "br" ? `DIA ${currentDay} DE ${cycleDays}` : `DAY ${currentDay} OF ${cycleDays}`;

  // Renderizar celulas (1 a cycleDays)
  const cells = Array.from({ length: cycleDays }, (_, i) => i + 1);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "clamp(12px, 1.6vw, 20px)",
        padding: "clamp(14px, 2vw, 22px)",
        // Container ornamental com fundo escuro + bordas douradas finas
        background: "linear-gradient(180deg, rgba(15,12,8,0.88) 0%, rgba(8,7,6,0.95) 100%)",
        border: `1.5px solid ${GOLD.dark}`,
        borderRadius: "12px",
        boxShadow: [
          `0 0 0 1px rgba(212,168,67,0.15)`,
          "inset 0 1px 2px rgba(255,215,0,0.08)",
          "inset 0 -1px 2px rgba(0,0,0,0.5)",
          "0 8px 24px rgba(0,0,0,0.5)",
        ].join(", "),
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ============== HEADER: divider + texto "DIA X DE Y" ============== */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <h2
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 800,
            fontSize: "clamp(15px, 1.6vw, 20px)",
            background: `linear-gradient(180deg, ${GOLD.light} 0%, ${GOLD.primary} 50%, ${GOLD.dark} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: GOLD.primary, // fallback
            letterSpacing: "3px",
            margin: 0,
            filter: `drop-shadow(0 0 10px ${GOLD.glow})`,
            textAlign: "center",
          }}
        >
          {headerText}
        </h2>

        {/* Divider PNG ornamental dourado */}
        <img
          src={DIVIDER_GOLD}
          alt=""
          aria-hidden
          style={{
            width: "70%",
            maxWidth: "320px",
            height: "auto",
            opacity: 0.85,
            filter: `drop-shadow(0 0 6px ${GOLD.glow})`,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ============== GRID 7x4 ============== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "clamp(4px, 0.6vw, 8px)",
        }}
      >
        {cells.map((day) => {
          const isClaimedDay = claimed.has(day);
          const isToday = day === currentDay;
          const isFuture = day > currentDay;
          const isMilestoneDay = isMilestone(day);
          const milestoneTier = isMilestoneDay ? MILESTONE_TIERS[day] : null;

          return (
            <CalendarCell
              key={day}
              day={day}
              isClaimed={isClaimedDay}
              isToday={isToday}
              isFuture={isFuture}
              isMilestone={isMilestoneDay}
              milestoneTier={milestoneTier}
              lang={langNorm}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// CELULA INDIVIDUAL
// ============================================================
interface CalendarCellProps {
  day: number;
  isClaimed: boolean;
  isToday: boolean;
  isFuture: boolean;
  isMilestone: boolean;
  milestoneTier: { glow: string; tierName: string } | null;
  lang: "br" | "in";
}

function CalendarCell({
  day,
  isClaimed,
  isToday,
  isFuture,
  isMilestone: isMilestoneCell,
  milestoneTier,
  lang,
}: CalendarCellProps) {
  // Estado visual
  let borderColor = "rgba(212,168,67,0.15)";
  let bgGradient =
    "linear-gradient(135deg, rgba(20,16,12,0.6) 0%, rgba(10,8,6,0.8) 100%)";
  let textColor = "rgba(212,168,67,0.4)";
  let glow = "none";
  let textWeight = 600;

  if (isClaimed && !isToday) {
    borderColor = "rgba(0, 200, 83, 0.35)";
    bgGradient =
      "linear-gradient(135deg, rgba(0,80,40,0.18) 0%, rgba(0,40,20,0.25) 100%)";
    textColor = "rgba(255,255,255,0.65)";
    glow = `0 0 8px ${EMERALD.glow}`;
  }

  if (isToday) {
    borderColor = GOLD.primary;
    bgGradient = `linear-gradient(135deg, rgba(212,168,67,0.18) 0%, rgba(212,168,67,0.08) 100%)`;
    textColor = GOLD.light;
    glow = `0 0 16px ${GOLD.glow}, inset 0 0 8px rgba(255,215,0,0.15)`;
    textWeight = 800;
  }

  if (isFuture) {
    textColor = "rgba(212,168,67,0.3)";
  }

  return (
    <motion.div
      initial={false}
      animate={
        isToday
          ? {
              boxShadow: [
                `0 0 12px ${GOLD.glow}, inset 0 0 6px rgba(255,215,0,0.1)`,
                `0 0 22px ${GOLD.light}, inset 0 0 12px rgba(255,215,0,0.2)`,
                `0 0 12px ${GOLD.glow}, inset 0 0 6px rgba(255,215,0,0.1)`,
              ],
            }
          : { boxShadow: glow }
      }
      transition={
        isToday
          ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
          : undefined
      }
      style={{
        position: "relative",
        aspectRatio: "1",
        borderRadius: "8px",
        border: `1.5px solid ${borderColor}`,
        background: bgGradient,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      {/* MILESTONE: badge PNG ocupa a celula inteira */}
      {isMilestoneCell && milestoneTier ? (
        <>
          <img
            src={`/assets/games/daily-free/badges/badge-streak-${day}-${lang.toUpperCase()}.png`}
            alt={`Milestone ${day} dias`}
            style={{
              width: "92%",
              height: "92%",
              objectFit: "contain",
              // Se for futuro: dessatura + opacidade reduzida
              filter: isFuture
                ? "saturate(0.3) brightness(0.55) drop-shadow(0 0 4px rgba(0,0,0,0.6))"
                : `drop-shadow(0 0 8px ${milestoneTier.glow})`,
              opacity: isFuture ? 0.7 : 1,
              transition: "filter 0.2s, opacity 0.2s",
            }}
          />
          {/* Lock por cima se for milestone futuro */}
          {isFuture && (
            <img
              src={ICON_LOCK}
              alt=""
              aria-hidden
              style={{
                position: "absolute",
                width: "36%",
                height: "36%",
                bottom: "8%",
                right: "8%",
                objectFit: "contain",
                filter: `drop-shadow(0 0 4px rgba(0,0,0,0.8))`,
                pointerEvents: "none",
              }}
            />
          )}
        </>
      ) : (
        // CELULA REGULAR: numero + check (se claimado)
        <>
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(13px, 1.4vw, 18px)",
              fontWeight: textWeight,
              color: textColor,
              letterSpacing: "0.5px",
              textShadow: isToday
                ? `0 0 8px ${GOLD.glow}, 0 0 12px ${GOLD.glow}`
                : isClaimed
                ? `0 0 4px ${EMERALD.glow}`
                : "none",
              transition: "color 0.2s",
              userSelect: "none",
            }}
          >
            {day}
          </span>
          {/* Checkmark verde esmeralda no canto se claimado (e nao for hoje) */}
          {isClaimed && !isToday && (
            <svg
              viewBox="0 0 24 24"
              style={{
                position: "absolute",
                width: "32%",
                height: "32%",
                bottom: "10%",
                right: "10%",
                pointerEvents: "none",
              }}
            >
              <path
                d="M 4 12 L 10 18 L 20 6"
                fill="none"
                stroke={EMERALD.light}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  filter: `drop-shadow(0 0 3px ${EMERALD.glow})`,
                }}
              />
            </svg>
          )}
        </>
      )}
    </motion.div>
  );
}
