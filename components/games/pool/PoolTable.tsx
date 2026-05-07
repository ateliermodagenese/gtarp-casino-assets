"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { GameHeader } from "@/components/shared";

// ===========================================================================
// POOL TABLE — Tela de gameplay do Pool Game (#22)
// Vista top-down da mesa, mira, forca, spin, bolas Canvas 2D
// CSS inline, zero Tailwind, Framer Motion
// ===========================================================================

type Lang = "br" | "in";

interface Ball {
  id: number;
  x: number;
  y: number;
  color: string;
  type: "solid" | "stripe" | "cue" | "eight";
  pocketed: boolean;
}

interface Player {
  id: string;
  name: string;
  initials: string;
  ballsPocketed: string[];
  isActive: boolean;
}

// ===========================================================================
// CONSTANTES
// ===========================================================================

const ASSETS = {
  bgCasino: "/assets/shared/ui/bg-casino.png",
  bgPoolTable: "/assets/games/pool/bg-pool-table.png",
  iconGcoin: "/assets/shared/icons/icon-gcoin.png",
};

const TEXTS = {
  title: { br: "POOL GAME", in: "POOL GAME" },
  shoot: { br: "DISPARAR", in: "SHOOT" },
  pot: { br: "POT", in: "POT" },
  spin: { br: "SPIN", in: "SPIN" },
  pwr: { br: "PWR", in: "PWR" },
};

const GOLD = {
  primary: "#D4A843",
  light: "#FFD700",
  dark: "#8B6914",
  glow: "rgba(212,168,67,0.5)",
};

const EMERALD = {
  primary: "#00C853",
  light: "#00E676",
  dark: "#004D25",
};

// Cores das bolas
const BALL_COLORS = {
  1: "#F5C518", // amarelo
  2: "#1565C0", // azul
  3: "#C62828", // vermelho
  4: "#6A1B9A", // roxo
  5: "#E65100", // laranja
  6: "#2E7D32", // verde
  7: "#4E342E", // marrom
  8: "#1A1A1A", // preta
  9: "#F5C518",
  10: "#1565C0",
  11: "#C62828",
  12: "#6A1B9A",
  13: "#E65100",
  14: "#2E7D32",
  15: "#4E342E",
};

// Posicoes mockadas das bolas (percentual da mesa)
const MOCK_BALLS: Ball[] = [
  { id: 0, x: 25, y: 50, color: "#FFFFFF", type: "cue", pocketed: false },
  { id: 1, x: 70, y: 50, color: BALL_COLORS[1], type: "solid", pocketed: false },
  { id: 2, x: 73, y: 46, color: BALL_COLORS[2], type: "solid", pocketed: false },
  { id: 3, x: 73, y: 54, color: BALL_COLORS[3], type: "solid", pocketed: false },
  { id: 4, x: 76, y: 42, color: BALL_COLORS[4], type: "solid", pocketed: false },
  { id: 5, x: 76, y: 50, color: BALL_COLORS[5], type: "solid", pocketed: false },
  { id: 6, x: 76, y: 58, color: BALL_COLORS[6], type: "solid", pocketed: true },
  { id: 7, x: 79, y: 38, color: BALL_COLORS[7], type: "solid", pocketed: true },
  { id: 8, x: 79, y: 50, color: BALL_COLORS[8], type: "eight", pocketed: false },
  { id: 9, x: 79, y: 62, color: BALL_COLORS[9], type: "stripe", pocketed: false },
  { id: 10, x: 82, y: 34, color: BALL_COLORS[10], type: "stripe", pocketed: true },
  { id: 11, x: 82, y: 46, color: BALL_COLORS[11], type: "stripe", pocketed: false },
  { id: 12, x: 82, y: 54, color: BALL_COLORS[12], type: "stripe", pocketed: false },
  { id: 13, x: 82, y: 66, color: BALL_COLORS[13], type: "stripe", pocketed: false },
  { id: 14, x: 85, y: 42, color: BALL_COLORS[14], type: "stripe", pocketed: false },
  { id: 15, x: 85, y: 58, color: BALL_COLORS[15], type: "stripe", pocketed: true },
];

const MOCK_PLAYERS: Player[] = [
  {
    id: "a",
    name: "BC",
    initials: "BC",
    ballsPocketed: [BALL_COLORS[1], BALL_COLORS[2], BALL_COLORS[3]],
    isActive: true,
  },
  {
    id: "b",
    name: "Oponente",
    initials: "OP",
    ballsPocketed: [BALL_COLORS[9], BALL_COLORS[10]],
    isActive: false,
  },
];

// ===========================================================================
// COMPONENTE BOLA (Canvas-like div com radialGradient)
// ===========================================================================

function PoolBall({
  ball,
  tableWidth,
  tableHeight,
}: {
  ball: Ball;
  tableWidth: number;
  tableHeight: number;
}) {
  if (ball.pocketed) return null;

  const size = Math.max(14, Math.min(24, tableWidth * 0.028));
  const left = (ball.x / 100) * tableWidth - size / 2;
  const top = (ball.y / 100) * tableHeight - size / 2;

  // Highlight offset para efeito 3D (35%, 30%)
  const highlightX = 35;
  const highlightY = 30;

  const isStripe = ball.type === "stripe";
  const isEight = ball.type === "eight";
  const isCue = ball.type === "cue";

  let background = "";
  if (isCue) {
    background = `radial-gradient(circle at ${highlightX}% ${highlightY}%, #FFFFFF 0%, #E8E8E8 40%, #CCCCCC 100%)`;
  } else if (isStripe) {
    background = `radial-gradient(circle at ${highlightX}% ${highlightY}%, #FFFFFF 0%, #F5F5F5 40%, #E0E0E0 100%)`;
  } else {
    background = `radial-gradient(circle at ${highlightX}% ${highlightY}%, ${lightenColor(ball.color, 40)} 0%, ${ball.color} 50%, ${darkenColor(ball.color, 30)} 100%)`;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: `${left}px`,
        top: `${top}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background,
        boxShadow: `0 2px 4px rgba(0,0,0,0.4), inset 0 -1px 2px rgba(0,0,0,0.2)`,
        zIndex: isCue ? 10 : 5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Faixa colorida para listradas */}
      {isStripe && (
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "40%",
            background: `linear-gradient(180deg, ${darkenColor(ball.color, 10)} 0%, ${ball.color} 50%, ${darkenColor(ball.color, 10)} 100%)`,
            top: "30%",
          }}
        />
      )}

      {/* Circulo branco e numero para bola 8 */}
      {isEight && (
        <div
          style={{
            width: "45%",
            height: "45%",
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: `${size * 0.35}px`,
            color: "#000000",
            zIndex: 2,
          }}
        >
          8
        </div>
      )}
    </div>
  );
}

// Helpers para cores
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
}

// ===========================================================================
// COMPONENTE PRINCIPAL
// ===========================================================================

export default function PoolTable({
  onBack,
  onGameEnd,
  pot: initialPot,
  mode,
  lang,
  balance,
}: {
  onBack: () => void;
  onGameEnd?: (won: boolean) => void;
  pot?: number;
  mode?: "8ball" | "9ball";
  lang: Lang;
  balance?: number;
}) {
  const [balls] = useState<Ball[]>(MOCK_BALLS);
  const [players] = useState<Player[]>(MOCK_PLAYERS);
  const [power, setPower] = useState(65);
  const [timer] = useState(25);
  const [pot] = useState(initialPot || 2000);
  const [aimAngle, setAimAngle] = useState(0); // graus
  const [spinX, setSpinX] = useState(0); // -1 a 1
  const [spinY, setSpinY] = useState(0); // -1 a 1

  const tableRef = useRef<HTMLDivElement>(null);
  const [tableDimensions, setTableDimensions] = useState({ width: 600, height: 300 });

  // Atualiza dimensoes da mesa
  useEffect(() => {
    const updateDimensions = () => {
      if (tableRef.current) {
        const rect = tableRef.current.getBoundingClientRect();
        setTableDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Cue ball para guideline
  const cueBall = balls.find((b) => b.type === "cue");

  // Cacapas (6 posicoes em percentual)
  const pockets = [
    { x: 3, y: 5 },
    { x: 50, y: 3 },
    { x: 97, y: 5 },
    { x: 3, y: 95 },
    { x: 50, y: 97 },
    { x: 97, y: 95 },
  ];

  return (
    <div
      style={{
        position: "absolute",
        inset: "6px",
        zIndex: 60,
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#080604",
        backgroundImage: `url('${ASSETS.bgCasino}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}
      <GameHeader
        onBack={onBack}
        title={TEXTS.title[lang]}
        balance={8250}
        lang={lang}
        actions={[]}
      />

      {/* CONTEUDO PRINCIPAL */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          padding: "clamp(8px, 1.5vw, 16px)",
          overflow: "hidden",
        }}
      >
        {/* HUD SUPERIOR */}
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "16px",
            right: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            zIndex: 10,
          }}
        >
          {/* JOGADOR A (Esquerda) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${GOLD.primary}, ${GOLD.dark})`,
                border: players[0].isActive
                  ? `2px solid rgba(0,230,118,0.7)`
                  : `2px solid rgba(212,168,67,0.3)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: "12px",
                color: "#FFFFFF",
                boxShadow: players[0].isActive
                  ? `0 0 12px rgba(0,230,118,0.4)`
                  : "none",
              }}
            >
              {players[0].initials}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: "clamp(10px, 1.2vw, 14px)",
                  color: "#FFFFFF",
                }}
              >
                {players[0].name}
              </span>
              <div style={{ display: "flex", gap: "4px" }}>
                {players[0].ballsPocketed.map((color, i) => (
                  <div
                    key={i}
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: color,
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* CENTRO - POT E TIMER */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: "clamp(12px, 1.6vw, 20px)",
                  color: EMERALD.light,
                }}
              >
                {TEXTS.pot[lang]}:
              </span>
              <img
                src={ASSETS.iconGcoin}
                alt=""
                style={{ width: "16px", height: "16px" }}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: "clamp(12px, 1.6vw, 20px)",
                  color: EMERALD.light,
                }}
              >
                {pot.toLocaleString()}
              </span>
            </div>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: "clamp(11px, 1.3vw, 16px)",
                color: GOLD.primary,
              }}
            >
              {String(Math.floor(timer / 60)).padStart(2, "0")}:
              {String(timer % 60).padStart(2, "0")}
            </span>
          </div>

          {/* JOGADOR B (Direita) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: "clamp(10px, 1.2vw, 14px)",
                  color: "#FFFFFF",
                }}
              >
                {players[1].name}
              </span>
              <div style={{ display: "flex", gap: "4px" }}>
                {players[1].ballsPocketed.map((color, i) => (
                  <div
                    key={i}
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: color,
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />
                ))}
              </div>
            </div>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${GOLD.primary}, ${GOLD.dark})`,
                border: players[1].isActive
                  ? `2px solid rgba(0,230,118,0.7)`
                  : `2px solid rgba(212,168,67,0.3)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: "12px",
                color: "#FFFFFF",
              }}
            >
              {players[1].initials}
            </div>
          </div>
        </div>

        {/* MESA CENTRAL */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: "clamp(48px, 8vh, 72px)",
            paddingBottom: "clamp(80px, 12vh, 120px)",
          }}
        >
          <div
            ref={tableRef}
            style={{
              position: "relative",
              aspectRatio: "2 / 1",
              maxWidth: "90%",
              width: "100%",
              maxHeight: "100%",
              backgroundImage: `url('${ASSETS.bgPoolTable}')`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              borderRadius: "8px",
              border: `2px solid rgba(212,168,67,0.4)`,
              boxShadow: `0 0 30px rgba(0,0,0,0.6), 0 0 8px rgba(212,168,67,0.08)`,
            }}
          >
            {/* Area de jogo interna */}
            <div
              style={{
                position: "absolute",
                inset: "6%",
                overflow: "hidden",
              }}
            >
              {/* Cacapas */}
              {pockets.map((pocket, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${pocket.x}%`,
                    top: `${pocket.y}%`,
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: "#0A0A0A",
                    border: `1.5px solid rgba(212,168,67,0.3)`,
                    transform: "translate(-50%, -50%)",
                    boxShadow: "inset 0 2px 6px rgba(0,0,0,0.8)",
                  }}
                />
              ))}

              {/* Bolas */}
              {balls.map((ball) => (
                <PoolBall
                  key={ball.id}
                  ball={ball}
                  tableWidth={tableDimensions.width * 0.88}
                  tableHeight={tableDimensions.height * 0.88}
                />
              ))}

              {/* Guideline - linha de mira */}
              {cueBall && (
                <svg
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                  }}
                >
                  <line
                    x1={`${cueBall.x}%`}
                    y1={`${cueBall.y}%`}
                    x2={`${cueBall.x + Math.cos((aimAngle * Math.PI) / 180) * 60}%`}
                    y2={`${cueBall.y + Math.sin((aimAngle * Math.PI) / 180) * 30}%`}
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                  {/* Ghost ball */}
                  <circle
                    cx={`${cueBall.x + Math.cos((aimAngle * Math.PI) / 180) * 45}%`}
                    cy={`${cueBall.y + Math.sin((aimAngle * Math.PI) / 180) * 22}%`}
                    r="10"
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* POWER BAR (lateral direita) */}
        <div
          style={{
            position: "absolute",
            right: "clamp(8px, 2vw, 24px)",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <div
            style={{
              width: "clamp(22px, 3vw, 30px)",
              height: "clamp(120px, 20vh, 180px)",
              background: "rgba(0,0,0,0.5)",
              borderRadius: "6px",
              border: `1px solid rgba(212,168,67,0.2)`,
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const y = e.clientY - rect.top;
              const percent = 100 - (y / rect.height) * 100;
              setPower(Math.max(5, Math.min(100, percent)));
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: `${power}%`,
                background: `linear-gradient(to top, ${EMERALD.light} 0%, #FFD700 65%, #FF6600 80%, #FF1744 100%)`,
                borderRadius: "5px",
                transition: "height 0.1s ease-out",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "clamp(7px, 0.85vw, 10px)",
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
            }}
          >
            {TEXTS.pwr[lang]}
          </span>
        </div>

        {/* SPIN SELECTOR (canto inferior esquerdo) */}
        <div
          style={{
            position: "absolute",
            left: "clamp(12px, 3vw, 32px)",
            bottom: "clamp(12px, 3vh, 24px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {/* Labels F/B/L/R */}
          <div
            style={{
              position: "relative",
              width: "clamp(48px, 6vw, 64px)",
              height: "clamp(48px, 6vw, 64px)",
            }}
          >
            {/* F - top */}
            <span
              style={{
                position: "absolute",
                top: "-14px",
                left: "50%",
                transform: "translateX(-50%)",
                fontFamily: "'Cinzel', serif",
                fontSize: "clamp(7px, 0.8vw, 10px)",
                color: "rgba(212,168,67,0.4)",
              }}
            >
              F
            </span>
            {/* B - bottom */}
            <span
              style={{
                position: "absolute",
                bottom: "-14px",
                left: "50%",
                transform: "translateX(-50%)",
                fontFamily: "'Cinzel', serif",
                fontSize: "clamp(7px, 0.8vw, 10px)",
                color: "rgba(212,168,67,0.4)",
              }}
            >
              B
            </span>
            {/* L - left */}
            <span
              style={{
                position: "absolute",
                left: "-10px",
                top: "50%",
                transform: "translateY(-50%)",
                fontFamily: "'Cinzel', serif",
                fontSize: "clamp(7px, 0.8vw, 10px)",
                color: "rgba(212,168,67,0.4)",
              }}
            >
              L
            </span>
            {/* R - right */}
            <span
              style={{
                position: "absolute",
                right: "-10px",
                top: "50%",
                transform: "translateY(-50%)",
                fontFamily: "'Cinzel', serif",
                fontSize: "clamp(7px, 0.8vw, 10px)",
                color: "rgba(212,168,67,0.4)",
              }}
            >
              R
            </span>

            {/* Circulo da cue ball (selector) */}
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: `radial-gradient(circle at 35% 30%, #FFFFFF 0%, #E8E8E8 40%, #CCCCCC 100%)`,
                border: `1.5px solid rgba(212,168,67,0.3)`,
                position: "relative",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
                setSpinX(Math.max(-1, Math.min(1, x)));
                setSpinY(Math.max(-1, Math.min(1, y)));
              }}
            >
              {/* Ponto vermelho (hit point) */}
              <div
                style={{
                  position: "absolute",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#FF1744",
                  left: `calc(50% + ${spinX * 35}% - 4px)`,
                  top: `calc(50% + ${spinY * 35}% - 4px)`,
                  boxShadow: "0 0 4px rgba(255,23,68,0.5)",
                  transition: "left 0.1s, top 0.1s",
                }}
              />
            </div>
          </div>
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 600,
              fontSize: "clamp(8px, 1vw, 11px)",
              color: "rgba(212,168,67,0.5)",
              textTransform: "uppercase",
            }}
          >
            {TEXTS.spin[lang]}
          </span>
        </div>

        {/* BOTAO SHOOT (centro inferior) */}
        <div
          style={{
            position: "absolute",
            bottom: "clamp(12px, 3vh, 24px)",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onShoot}
            style={{
              minHeight: "48px",
              width: "clamp(160px, 25vw, 220px)",
              borderRadius: "10px",
              cursor: "pointer",
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: "clamp(12px, 1.5vw, 18px)",
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: "#FFFFFF",
              background: `linear-gradient(180deg, ${EMERALD.primary}, ${EMERALD.dark})`,
              border: `1.5px solid rgba(0,230,118,0.3)`,
              boxShadow: `0 0 15px rgba(0,230,118,0.15)`,
              transition: "all 0.2s",
            }}
          >
            {TEXTS.shoot[lang]}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
