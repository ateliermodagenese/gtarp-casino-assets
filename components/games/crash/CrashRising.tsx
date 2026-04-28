"use client";

import { useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface FeedBet {
  name: string;
  amount: number;
  status: "betting" | "cashed" | "lost";
}

interface CrashRisingProps {
  historyResults: number[];
  currentMultiplier: number;
  betAmount: number;
  onCashout: () => void;
  feedBets: FeedBet[];
  lang: "br" | "en";
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const TEXTS = {
  br: {
    cashout: "SACAR",
    yourBet: "Aposta:",
    cashed: "Sacou",
    lost: "Perdeu",
    betting: "Apostou",
  },
  en: {
    cashout: "CASHOUT",
    yourBet: "Bet:",
    cashed: "Cashed",
    lost: "Lost",
    betting: "Betting",
  },
};

/* ─────────────────────────────────────────────────────────────
   HELPER: Badge color by multiplier
───────────────────────────────────────────────────────────── */
function getBadgeStyle(mult: number): { background: string; color: string } {
  if (mult >= 10) {
    return { background: "rgba(212,168,67,0.15)", color: "#D4A843" };
  }
  if (mult >= 2) {
    return { background: "rgba(0,230,118,0.1)", color: "#00E676" };
  }
  return { background: "rgba(255,68,68,0.1)", color: "#FF4444" };
}

/* ─────────────────────────────────────────────────────────────
   HELPER: Multiplier color by tier
───────────────────────────────────────────────────────────── */
function getMultiplierColor(mult: number): string {
  if (mult >= 100) return "#AA00FF";
  if (mult >= 10) return "#FF4444";
  if (mult >= 5) return "#FF9800";
  if (mult >= 2) return "#FFD700";
  return "#00E676";
}

/* ─────────────────────────────────────────────────────────────
   HELPER: Status badge style
───────────────────────────────────────────────────────────── */
function getStatusStyle(status: FeedBet["status"]): { background: string; color: string } {
  switch (status) {
    case "cashed":
      return { background: "rgba(0,230,118,0.15)", color: "#00E676" };
    case "lost":
      return { background: "rgba(255,68,68,0.15)", color: "#FF4444" };
    default:
      return { background: "rgba(212,168,67,0.1)", color: "#D4A843" };
  }
}

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */
export default function CrashRising({
  historyResults,
  currentMultiplier,
  betAmount,
  onCashout,
  feedBets,
  lang,
}: CrashRisingProps) {
  const t = TEXTS[lang];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rocketImgRef = useRef<HTMLImageElement | null>(null);

  const multiplierColor = useMemo(() => getMultiplierColor(currentMultiplier), [currentMultiplier]);
  const cashoutValue = useMemo(() => Math.floor(betAmount * currentMultiplier), [betAmount, currentMultiplier]);

  const truncateName = (name: string, max: number) =>
    name.length > max ? name.slice(0, max) + "..." : name;

  /* ─────────────────────────────────────────────────────────
     Canvas Drawing
  ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load rocket image
    if (!rocketImgRef.current) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = "/assets/games/crash/rocket-flying.png";
      rocketImgRef.current = img;
    }

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = "rgba(212,168,67,0.04)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        const y = h - (h * i) / 5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Y-axis labels
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(212,168,67,0.3)";
      ctx.textAlign = "left";
      const labels = ["1x", "2x", "5x", "10x"];
      const labelPositions = [0.9, 0.7, 0.4, 0.15];
      labels.forEach((label, i) => {
        ctx.fillText(label, 8, h * labelPositions[i]);
      });

      // Draw exponential curve
      const progress = Math.min((currentMultiplier - 1) / 9, 1);
      const curvePoints: { x: number; y: number }[] = [];
      const numPoints = 60;

      for (let i = 0; i <= numPoints * progress; i++) {
        const t = i / numPoints;
        const x = t * w * 0.85 + w * 0.05;
        const expY = Math.pow(t, 0.5);
        const y = h - expY * h * 0.75 - h * 0.1;
        curvePoints.push({ x, y });
      }

      if (curvePoints.length > 1) {
        // Glow effect
        ctx.save();
        ctx.shadowColor = "rgba(0,230,118,0.4)";
        ctx.shadowBlur = 8;
        ctx.strokeStyle = "#00E676";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
        for (let i = 1; i < curvePoints.length; i++) {
          ctx.lineTo(curvePoints[i].x, curvePoints[i].y);
        }
        ctx.stroke();
        ctx.restore();

        // Draw rocket at end of curve
        const lastPoint = curvePoints[curvePoints.length - 1];
        const prevPoint = curvePoints[Math.max(0, curvePoints.length - 5)];
        
        // Calculate angle
        const dx = lastPoint.x - prevPoint.x;
        const dy = lastPoint.y - prevPoint.y;
        const angle = Math.atan2(dy, dx);

        if (rocketImgRef.current && rocketImgRef.current.complete) {
          ctx.save();
          ctx.translate(lastPoint.x, lastPoint.y);
          ctx.rotate(angle - Math.PI / 2);
          ctx.drawImage(rocketImgRef.current, -24, -24, 48, 48);
          ctx.restore();
        }
      }
    };

    draw();

    // Redraw on resize
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentMultiplier]);

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: "clamp(8px, 1.5vw, 14px)",
        padding: "clamp(8px, 1.5vw, 14px)",
        boxSizing: "border-box",
      }}
    >
      {/* ══════════════════════════════════════════════════════════
          1. HISTORY BAR
      ══════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          overflowY: "hidden",
          paddingBottom: "4px",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(212,168,67,0.4) transparent",
        }}
      >
        {historyResults.map((mult, idx) => {
          const badgeStyle = getBadgeStyle(mult);
          return (
            <div
              key={idx}
              style={{
                flexShrink: 0,
                background: badgeStyle.background,
                color: badgeStyle.color,
                borderRadius: "6px",
                padding: "2px 8px",
                fontSize: "clamp(10px, 1vw, 13px)",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {mult.toFixed(2)}x
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. CANVAS AREA
      ══════════════════════════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0D0B08",
          border: "1px solid rgba(212,168,67,0.12)",
          borderRadius: "10px",
          overflow: "hidden",
          minHeight: "clamp(200px, 40vh, 400px)",
        }}
      >
        {/* Stars background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/assets/games/crash/stars-bg.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.1,
            pointerEvents: "none",
          }}
        />

        {/* Frame canvas */}
        <img
          src="/assets/games/crash/frame-canvas.png"
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            opacity: 0.5,
          }}
        />

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />

        {/* Multiplier Overlay */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "relative",
            zIndex: 5,
            fontFamily: "'Cinzel Decorative', serif",
            fontWeight: 900,
            fontSize: "clamp(32px, 5vw, 64px)",
            color: multiplierColor,
            textShadow: `0 0 20px ${multiplierColor}99, 0 4px 8px rgba(0,0,0,0.8)`,
            letterSpacing: "2px",
          }}
        >
          {currentMultiplier.toFixed(2)}x
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          3. BOTTOM PANEL
      ══════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "clamp(8px, 2vw, 16px)",
          flexWrap: "wrap",
        }}
      >
        {/* Bet Info */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "clamp(11px, 1.2vw, 14px)",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          {t.yourBet}{" "}
          <span style={{ color: "#00E676", fontWeight: 700 }}>
            {betAmount.toLocaleString()} GC
          </span>
        </div>

        {/* Cashout Button */}
        <motion.button
          onClick={onCashout}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontFamily: "'Cinzel Decorative', serif",
            fontWeight: 700,
            fontSize: "clamp(14px, 1.8vw, 22px)",
            color: "#FFFFFF",
            background: "linear-gradient(180deg, #FF6B6B, #FF4444)",
            border: "none",
            borderRadius: "10px",
            minHeight: "52px",
            width: "clamp(180px, 35vw, 300px)",
            cursor: "pointer",
            boxShadow: "0 0 15px rgba(255,68,68,0.4)",
            animation: "cashoutPulse 1s ease-in-out infinite",
          }}
        >
          <img
            src="/assets/shared/icons/icon-cashout.png"
            alt=""
            style={{ width: "20px", height: "20px" }}
          />
          {t.cashout} {cashoutValue.toLocaleString()} GC
        </motion.button>

        {/* Compact Feed */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            maxHeight: "80px",
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(212,168,67,0.4) transparent",
            flex: "0 1 clamp(140px, 25%, 200px)",
          }}
        >
          {feedBets.slice(0, 3).map((bet, idx) => {
            const statusStyle = getStatusStyle(bet.status);
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "6px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "4px",
                  padding: "4px 6px",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "clamp(9px, 0.9vw, 11px)",
                    color: "rgba(255,255,255,0.6)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "60px",
                  }}
                >
                  {truncateName(bet.name, 8)}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: "clamp(9px, 0.9vw, 11px)",
                    color: statusStyle.color,
                  }}
                >
                  {bet.amount.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyframe animation for cashout pulse */}
      <style>
        {`
          @keyframes cashoutPulse {
            0%, 100% {
              box-shadow: 0 0 10px rgba(255,68,68,0.3);
            }
            50% {
              box-shadow: 0 0 25px rgba(255,68,68,0.6);
            }
          }
        `}
      </style>
    </div>
  );
}
