"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CrashPhase } from "./CrashGame";

// ===========================================================================
// CRASH CANVAS — Curva 2D + Multiplicador + Estados Visuais
// ===========================================================================

interface CrashCanvasProps {
  phase: CrashPhase;
  multiplier: number;
  curvePoints: { x: number; y: number }[];
  countdown: number;
  crashPoint?: number;
  lang?: "br" | "en";
}

// Assets
const STARS_BG = "/assets/games/crash/stars-bg.png";
const ROCKET = "/assets/games/crash/rocket-flying.png";
const ROCKET_IDLE = "/assets/games/crash/rocket-idle.png";
const TRAIL_FIRE = "/assets/games/crash/trail-fire.png";

// Cores
const COLORS = {
  gold: "#D4A843",
  goldLight: "#FFD700",
  green: "#00E676",
  red: "#FF4444",
  gridLine: "rgba(212,168,67,0.15)",
  gridLineStrong: "rgba(212,168,67,0.25)",
};

export function CrashCanvas({
  phase,
  multiplier,
  curvePoints,
  countdown,
  crashPoint,
  lang = "br",
}: CrashCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const rocketRef = useRef<HTMLImageElement | null>(null);
  const rocketIdleRef = useRef<HTMLImageElement | null>(null);
  const trailRef = useRef<HTMLImageElement | null>(null);

  // Carregar imagens
  useEffect(() => {
    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.src = STARS_BG;
    bgImg.onload = () => { bgImageRef.current = bgImg; };

    const rktImg = new Image();
    rktImg.crossOrigin = "anonymous";
    rktImg.src = ROCKET;
    rktImg.onload = () => { rocketRef.current = rktImg; };

    const rktIdleImg = new Image();
    rktIdleImg.crossOrigin = "anonymous";
    rktIdleImg.src = ROCKET_IDLE;
    rktIdleImg.onload = () => { rocketIdleRef.current = rktIdleImg; };

    const trailImg = new Image();
    trailImg.crossOrigin = "anonymous";
    trailImg.src = TRAIL_FIRE;
    trailImg.onload = () => { trailRef.current = trailImg; };
  }, []);

  // ResizeObserver para canvas responsivo
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setDimensions({ 
          width: Math.floor(width * window.devicePixelRatio),
          height: Math.floor(height * window.devicePixelRatio),
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Renderizar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;

    // Configurar canvas
    canvas.width = width;
    canvas.height = height;

    // Limpar
    ctx.clearRect(0, 0, width, height);

    // Fundo estrelado
    if (bgImageRef.current) {
      ctx.drawImage(bgImageRef.current, 0, 0, width, height);
    } else {
      // Fallback gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#0A0A0A");
      bgGrad.addColorStop(1, "#050505");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // Escurecimento sobre o fundo
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0, 0, width, height);

    // ====================================================================
    // GRID DOURADO
    // ====================================================================
    const gridSpacingX = width / 12;
    const gridSpacingY = height / 8;

    // Linhas verticais
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1 * dpr;
    for (let x = gridSpacingX; x < width; x += gridSpacingX) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Linhas horizontais
    for (let y = gridSpacingY; y < height; y += gridSpacingY) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Eixos mais fortes
    ctx.strokeStyle = COLORS.gridLineStrong;
    ctx.lineWidth = 2 * dpr;
    // Eixo X (base)
    ctx.beginPath();
    ctx.moveTo(0, height - gridSpacingY);
    ctx.lineTo(width, height - gridSpacingY);
    ctx.stroke();
    // Eixo Y
    ctx.beginPath();
    ctx.moveTo(gridSpacingX, 0);
    ctx.lineTo(gridSpacingX, height);
    ctx.stroke();

    // ====================================================================
    // FOGUETE IDLE (WAITING/BETTING) — indica onde a acao vai acontecer
    // ====================================================================
    if ((phase === "WAITING" || phase === "BETTING") && rocketIdleRef.current) {
      const rocketSize = Math.max(50, Math.min(100, height * 0.18));
      const rx = width * 0.12;
      const ry = height - height * 0.18;
      ctx.globalAlpha = phase === "WAITING" ? 0.5 : 0.8;
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(-Math.PI / 6);
      ctx.drawImage(rocketIdleRef.current, -rocketSize / 2, -rocketSize / 2, rocketSize, rocketSize);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // ====================================================================
    // CURVA DO CRASH
    // ====================================================================
    if (phase === "RISING" || phase === "CRASHED") {
      // Margem interna para a curva NUNCA vazar
      const marginX = width * 0.08;
      const marginY = height * 0.1;
      const graphWidth = width - marginX * 2;
      const graphHeight = height - marginY * 2;

      // Clip — curva confinada dentro da area do grafico
      ctx.save();
      ctx.beginPath();
      ctx.rect(marginX, marginY, graphWidth, graphHeight);
      ctx.clip();

      if (curvePoints.length > 1) {
        // 5 tiers de cor conforme estudo (DS P5-ADENDO)
        let curveColor: string;
        if (phase === "CRASHED") {
          curveColor = COLORS.red;
        } else if (multiplier >= 100) {
          curveColor = "#AA00FF"; // roxo legendary
        } else if (multiplier >= 10) {
          curveColor = "#FF1744"; // vermelho intenso
        } else if (multiplier >= 5) {
          curveColor = "#FF9800"; // laranja
        } else if (multiplier >= 2) {
          curveColor = COLORS.goldLight; // dourado
        } else {
          curveColor = COLORS.green; // verde padrao
        }

        // Helper segura para gerar rgba a partir de qualquer formato
        function toRgba(color: string, alpha: number): string {
          if (color.startsWith("rgba")) return color.replace(/[\d.]+\)$/, `${alpha})`);
          if (color.startsWith("rgb")) return color.replace("rgb", "rgba").replace(")", `,${alpha})`);
          // Hex -> rgba
          const hex = color.replace("#", "");
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          return `rgba(${r},${g},${b},${alpha})`;
        }

        // Normalizar pontos DENTRO da area do grafico
        const maxX = Math.max(...curvePoints.map(p => p.x), 1);
        const maxY = Math.max(...curvePoints.map(p => p.y), 1);

        const normalizedPoints = curvePoints.map(p => ({
          x: marginX + (p.x / maxX) * graphWidth,
          y: height - marginY - (p.y / maxY) * graphHeight,
        }));

        // Camada de glow (linha grossa transparente)
        ctx.beginPath();
        ctx.moveTo(normalizedPoints[0].x, normalizedPoints[0].y);
        for (let i = 1; i < normalizedPoints.length; i++) {
          ctx.lineTo(normalizedPoints[i].x, normalizedPoints[i].y);
        }
        ctx.strokeStyle = toRgba(curveColor, 0.25);
        ctx.lineWidth = 14;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        // Camada media
        ctx.beginPath();
        ctx.moveTo(normalizedPoints[0].x, normalizedPoints[0].y);
        for (let i = 1; i < normalizedPoints.length; i++) {
          ctx.lineTo(normalizedPoints[i].x, normalizedPoints[i].y);
        }
        ctx.strokeStyle = toRgba(curveColor, 0.5);
        ctx.lineWidth = 6;
        ctx.stroke();

        // Curva principal
        ctx.beginPath();
        ctx.moveTo(normalizedPoints[0].x, normalizedPoints[0].y);
        for (let i = 1; i < normalizedPoints.length; i++) {
          ctx.lineTo(normalizedPoints[i].x, normalizedPoints[i].y);
        }
        ctx.strokeStyle = curveColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Foguete na ponta da curva (RISING) — escalado por DPR
        if (phase === "RISING" && normalizedPoints.length > 2 && rocketRef.current) {
          const last = normalizedPoints[normalizedPoints.length - 1];
          const prev = normalizedPoints[Math.max(0, normalizedPoints.length - 6)];
          const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
          const rocketSize = Math.max(40, Math.min(80, height * 0.12));

          // Trail de fogo atras do foguete
          if (trailRef.current && normalizedPoints.length > 8) {
            const trailSize = rocketSize * 1.2;
            for (let t = 1; t <= 4; t++) {
              const idx = Math.max(0, normalizedPoints.length - 1 - t * 4);
              const tp = normalizedPoints[idx];
              const tpPrev = normalizedPoints[Math.max(0, idx - 3)];
              const tAngle = Math.atan2(tp.y - tpPrev.y, tp.x - tpPrev.x);
              ctx.globalAlpha = 0.6 - t * 0.12;
              ctx.save();
              ctx.translate(tp.x, tp.y);
              ctx.rotate(tAngle - Math.PI / 2);
              ctx.drawImage(trailRef.current, -trailSize / 2, -trailSize * 0.3, trailSize, trailSize);
              ctx.restore();
            }
            ctx.globalAlpha = 1;
          }

          ctx.save();
          ctx.translate(last.x, last.y);
          ctx.rotate(angle - Math.PI / 2);
          ctx.drawImage(rocketRef.current, -rocketSize / 2, -rocketSize / 2, rocketSize, rocketSize);
          ctx.restore();
        }

        // Glow no ponto final (fallback se foguete nao carregou)
        if (phase === "RISING" && normalizedPoints.length > 0 && !rocketRef.current) {
          const lastPoint = normalizedPoints[normalizedPoints.length - 1];
          const glowSize = Math.max(12, height * 0.03);
          const pointGrad = ctx.createRadialGradient(lastPoint.x, lastPoint.y, 0, lastPoint.x, lastPoint.y, glowSize);
          pointGrad.addColorStop(0, curveColor);
          pointGrad.addColorStop(1, "transparent");
          ctx.fillStyle = pointGrad;
          ctx.beginPath();
          ctx.arc(lastPoint.x, lastPoint.y, glowSize, 0, Math.PI * 2);
          ctx.fill();
        }

        // Labels do eixo Y (1x, 2x, 5x, 10x)
        ctx.font = `${Math.max(10, height * 0.028)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = "rgba(212,168,67,0.4)";
        ctx.textAlign = "right";
        const yLabels = [1, 2, 5, 10, 50];
        for (const label of yLabels) {
          const logLabel = Math.log(label);
          const logMax = Math.log(Math.max(multiplier, 2));
          if (logLabel <= logMax) {
            const yPos = height - marginY - (logLabel / logMax) * graphHeight;
            if (yPos > marginY && yPos < height - marginY) {
              ctx.fillText(`${label}x`, marginX - 6, yPos + 4);
              // Linha tracejada horizontal
              ctx.setLineDash([4, 6]);
              ctx.strokeStyle = "rgba(212,168,67,0.08)";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(marginX, yPos);
              ctx.lineTo(marginX + graphWidth, yPos);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        }
      }

      ctx.restore(); // Remove clip
    }

    // ====================================================================
    // FLASH VERMELHO (fase CRASHED) — efeito leve no Canvas
    // Explosao real feita via CSS overlay animado no JSX
    // ====================================================================
    if (phase === "CRASHED") {
      ctx.fillStyle = "rgba(255,68,68,0.06)";
      ctx.fillRect(0, 0, width, height);
    }
  }, [phase, multiplier, curvePoints, dimensions]);

  // ========================================================================
  // OVERLAY DE TEXTO (Multiplicador, Countdown, Status)
  // ========================================================================
  
  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* ================================================================
          EXPLOSAO CSS — particulas animadas na fase CRASHED
          ================================================================ */}
      <AnimatePresence>
        {phase === "CRASHED" && (
          <>
            {/* Flash vermelho */}
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(circle at center, rgba(255,68,68,0.25) 0%, transparent 70%)",
                pointerEvents: "none",
                zIndex: 5,
              }}
            />
            {/* Particulas de explosao */}
            {Array.from({ length: 20 }).map((_, i) => {
              const angle = (i / 20) * 360;
              const dist = 80 + Math.random() * 120;
              const size = 3 + Math.random() * 5;
              const colors = ["#FFD700", "#D4A843", "#FF4444", "#FF6B6B", "#FFFFFF"];
              const color = colors[i % colors.length];
              const duration = 0.6 + Math.random() * 0.6;
              return (
                <motion.div
                  key={`particle-${i}`}
                  initial={{
                    x: 0,
                    y: 0,
                    scale: 1,
                    opacity: 1,
                  }}
                  animate={{
                    x: Math.cos((angle * Math.PI) / 180) * dist,
                    y: Math.sin((angle * Math.PI) / 180) * dist,
                    scale: 0,
                    opacity: 0,
                  }}
                  transition={{ duration, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    background: color,
                    boxShadow: `0 0 ${size * 2}px ${color}, 0 0 ${size * 4}px ${color}`,
                    pointerEvents: "none",
                    zIndex: 6,
                  }}
                />
              );
            })}
            {/* Onda de choque */}
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 60,
                height: 60,
                marginLeft: -30,
                marginTop: -30,
                borderRadius: "50%",
                border: "2px solid rgba(255,68,68,0.6)",
                boxShadow: "0 0 30px rgba(255,68,68,0.3), inset 0 0 20px rgba(255,170,0,0.2)",
                pointerEvents: "none",
                zIndex: 6,
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* ================================================================
          TEXTO CENTRAL — Multiplicador ou Status
          ================================================================ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <AnimatePresence mode="wait">
          {/* WAITING: Countdown */}
          {phase === "WAITING" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{ textAlign: "center" }}
            >
              <div
                style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "clamp(12px, 1.5vw, 18px)",
                  fontWeight: 600,
                  color: "rgba(212,168,67,0.8)",
                  textTransform: "uppercase",
                  letterSpacing: "3px",
                  marginBottom: "clamp(8px, 1vw, 16px)",
                }}
              >
                {lang === "br" ? "PRÓXIMO ROUND EM" : "NEXT ROUND IN"}
              </div>
              <motion.div
                key={countdown}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(48px, 8vw, 96px)",
                  fontWeight: 800,
                  color: COLORS.goldLight,
                  textShadow: `
                    0 0 20px rgba(255,215,0,0.8),
                    0 0 40px rgba(255,215,0,0.4),
                    0 0 60px rgba(255,215,0,0.2)
                  `,
                }}
              >
                {countdown}
              </motion.div>
            </motion.div>
          )}

          {/* BETTING: Aposte Agora */}
          {phase === "BETTING" && (
            <motion.div
              key="betting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ textAlign: "center" }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  textShadow: [
                    "0 0 20px rgba(0,230,118,0.6), 0 0 40px rgba(0,230,118,0.3)",
                    "0 0 40px rgba(0,230,118,0.9), 0 0 80px rgba(0,230,118,0.5)",
                    "0 0 20px rgba(0,230,118,0.6), 0 0 40px rgba(0,230,118,0.3)",
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "clamp(24px, 4vw, 48px)",
                  fontWeight: 800,
                  color: COLORS.green,
                  textTransform: "uppercase",
                  letterSpacing: "4px",
                }}
              >
                {lang === "br" ? "APOSTE AGORA!" : "BET NOW!"}
              </motion.div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(14px, 1.8vw, 22px)",
                  fontWeight: 600,
                  color: "rgba(212,168,67,0.7)",
                  marginTop: "clamp(8px, 1vw, 16px)",
                }}
              >
                1.00x
              </div>
            </motion.div>
          )}

          {/* RISING: Multiplicador */}
          {phase === "RISING" && (
            <motion.div
              key="rising"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: "center" }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.02, 1],
                }}
                transition={{ duration: 0.5, repeat: Infinity }}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(36px, 7vw, 80px)",
                  fontWeight: 800,
                  color: multiplier >= 100 ? "#AA00FF"
                    : multiplier >= 10 ? "#FF1744"
                    : multiplier >= 5 ? "#FF9800"
                    : multiplier >= 2 ? COLORS.goldLight
                    : COLORS.green,
                  textShadow: `
                    0 0 30px ${multiplier >= 10 ? "rgba(255,23,68,0.8)" : multiplier >= 5 ? "rgba(255,152,0,0.8)" : multiplier >= 2 ? "rgba(255,215,0,0.8)" : "rgba(0,230,118,0.8)"},
                    0 0 60px ${multiplier >= 10 ? "rgba(255,23,68,0.4)" : multiplier >= 5 ? "rgba(255,152,0,0.4)" : multiplier >= 2 ? "rgba(255,215,0,0.4)" : "rgba(0,230,118,0.4)"},
                    0 0 90px ${multiplier >= 10 ? "rgba(255,23,68,0.2)" : multiplier >= 5 ? "rgba(255,152,0,0.2)" : multiplier >= 2 ? "rgba(255,215,0,0.2)" : "rgba(0,230,118,0.2)"}
                  `,
                }}
              >
                {multiplier.toFixed(2)}x
              </motion.div>
            </motion.div>
          )}

          {/* CRASHED: Crash Point */}
          {phase === "CRASHED" && crashPoint && (
            <motion.div
              key="crashed"
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 10 }}
              style={{ textAlign: "center" }}
            >
              <motion.div
                animate={{
                  opacity: [1, 0.7, 1],
                }}
                transition={{ duration: 0.3, repeat: 3 }}
                style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "clamp(14px, 1.8vw, 22px)",
                  fontWeight: 700,
                  color: COLORS.red,
                  textTransform: "uppercase",
                  letterSpacing: "4px",
                  marginBottom: "clamp(8px, 1vw, 12px)",
                }}
              >
                CRASHED!
              </motion.div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(32px, 6vw, 72px)",
                  fontWeight: 800,
                  color: COLORS.red,
                  textShadow: `
                    0 0 30px rgba(255,68,68,0.8),
                    0 0 60px rgba(255,68,68,0.4)
                  `,
                }}
              >
                {crashPoint.toFixed(2)}x
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
