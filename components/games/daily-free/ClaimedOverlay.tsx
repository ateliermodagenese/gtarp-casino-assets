"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";

// ===========================================================================
// MODAL 3: CLAIMED (VOLTE AMANHÃ) — Daily-Free
// Overlay que aparece quando o jogador já usou o giro diário
// CSS inline, zero Tailwind, Framer Motion
// ===========================================================================

type Lang = "br" | "in";

interface ClaimedOverlayProps {
  remainingMs: number;
  lang: Lang;
  onExpired: () => void;
}

const ASSETS = {
  frameLuxo: "/assets/games/daily-free/frame-luxo-ornamental.png",
  gemGreen: "/assets/games/daily-free/prizes/gem-green.png",
};

const TEXTS = {
  comeBackTomorrow: { br: "VOLTE AMANHÃ", in: "COME BACK TOMORROW" },
  nextSpinIn: { br: "PRÓXIMO GIRO DISPONÍVEL EM", in: "NEXT SPIN AVAILABLE IN" },
  hours: { br: "HORAS", in: "HOURS" },
  minutes: { br: "MINUTOS", in: "MINUTES" },
  seconds: { br: "SEGUNDOS", in: "SECONDS" },
  alreadyUsed: { br: "Você já utilizou seu giro diário.", in: "You already used your daily spin." },
  comeBackToSpin: { br: "Volte amanhã para girar novamente!", in: "Come back tomorrow to spin again!" },
};

function formatTime(ms: number): { hours: string; minutes: string; seconds: string } {
  if (ms <= 0) return { hours: "00", minutes: "00", seconds: "00" };
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return {
    hours: String(h).padStart(2, "0"),
    minutes: String(m).padStart(2, "0"),
    seconds: String(s).padStart(2, "0"),
  };
}

// Relogio SVG dourado
function ClockIcon() {
  const markers = useMemo(() => 
    Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 30 - 90) * Math.PI / 180;
      return {
        x1: 50 + 36 * Math.cos(angle),
        y1: 50 + 36 * Math.sin(angle),
        x2: 50 + 42 * Math.cos(angle),
        y2: 50 + 42 * Math.sin(angle),
      };
    })
  , []);

  return (
    <motion.svg
      viewBox="0 0 100 100"
      initial={{ scale: 0, rotate: -90 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 0.2, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        width: "clamp(70px, 9vw, 110px)",
        height: "clamp(70px, 9vw, 110px)",
        filter: "drop-shadow(0 0 25px rgba(255,215,0,0.6))",
      }}
    >
      {/* Anel externo */}
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="#D4A843"
        strokeWidth="3"
      />
      {/* Fundo do relogio */}
      <circle
        cx="50"
        cy="50"
        r="43"
        fill="rgba(8,6,4,0.95)"
        stroke="#8B6914"
        strokeWidth="1.5"
      />
      {/* Anel interno dourado */}
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke="#FFD700"
        strokeWidth="0.5"
        opacity="0.4"
      />
      {/* Marcadores de hora */}
      {markers.map((m, i) => (
        <line
          key={i}
          x1={m.x1}
          y1={m.y1}
          x2={m.x2}
          y2={m.y2}
          stroke={i % 3 === 0 ? "#FFD700" : "#D4A843"}
          strokeWidth={i % 3 === 0 ? "2.5" : "1.5"}
          strokeLinecap="round"
        />
      ))}
      {/* Numeros romanos principais */}
      <text x="50" y="20" fill="#D4A843" fontSize="7" fontFamily="Cinzel, serif" textAnchor="middle">XII</text>
      <text x="83" y="53" fill="#D4A843" fontSize="6" fontFamily="Cinzel, serif" textAnchor="middle">III</text>
      <text x="50" y="86" fill="#D4A843" fontSize="6" fontFamily="Cinzel, serif" textAnchor="middle">VI</text>
      <text x="17" y="53" fill="#D4A843" fontSize="6" fontFamily="Cinzel, serif" textAnchor="middle">IX</text>
      {/* Ponteiro hora */}
      <motion.line
        x1="50"
        y1="50"
        x2="50"
        y2="28"
        stroke="#FFD700"
        strokeWidth="3"
        strokeLinecap="round"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 43200, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "50px 50px" }}
      />
      {/* Ponteiro minuto */}
      <motion.line
        x1="50"
        y1="50"
        x2="50"
        y2="20"
        stroke="#00E676"
        strokeWidth="2"
        strokeLinecap="round"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 3600, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "50px 50px" }}
      />
      {/* Ponteiro segundo */}
      <motion.line
        x1="50"
        y1="50"
        x2="50"
        y2="18"
        stroke="#FF6B6B"
        strokeWidth="1"
        strokeLinecap="round"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "50px 50px" }}
      />
      {/* Centro */}
      <circle cx="50" cy="50" r="4" fill="#FFD700" />
      <circle cx="50" cy="50" r="2" fill="#8B6914" />
      {/* Gema decorativa no topo */}
      <polygon
        points="50,3 53,8 50,6 47,8"
        fill="#00E676"
        style={{ filter: "drop-shadow(0 0 4px rgba(0,230,118,0.6))" }}
      />
    </motion.svg>
  );
}

// Particulas de poeira dourada
function GoldDust() {
  const particles = useMemo(() =>
    Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 3,
      opacity: 0.3 + Math.random() * 0.4,
    }))
  , []);

  return (
    <div style={{
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: 0,
    }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ 
            x: `${p.x}%`,
            y: `${p.y}%`,
            opacity: 0,
          }}
          animate={{
            y: [`${p.y}%`, `${p.y - 20}%`, `${p.y}%`],
            opacity: [0, p.opacity, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            backgroundColor: "#FFD700",
            borderRadius: "50%",
            boxShadow: "0 0 4px rgba(255,215,0,0.6)",
          }}
        />
      ))}
    </div>
  );
}

export default function ClaimedOverlay({
  remainingMs,
  lang,
  onExpired,
}: ClaimedOverlayProps) {
  const [timer, setTimer] = useState(remainingMs);
  const time = formatTime(timer);

  // Timer countdown
  useEffect(() => {
    if (timer <= 0) {
      onExpired();
      return;
    }
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1000) {
          onExpired();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, onExpired]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 90,
        background: "radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.92) 100%)",
        backdropFilter: "blur(3px)",
      }}
    >
      {/* Poeira dourada */}
      <GoldDust />

      {/* Card com frame ornamental */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative",
          width: "clamp(360px, 46vw, 580px)",
          aspectRatio: "1.4 / 1",
          zIndex: 1,
        }}
      >
        {/* Frame ornamental por cima */}
        <img
          src={ASSETS.frameLuxo}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "fill",
            zIndex: 2,
            pointerEvents: "none",
            filter: "drop-shadow(0 0 40px rgba(255,215,0,0.35))",
          }}
        />

        {/* Conteudo dentro do frame */}
        <div style={{
          position: "absolute",
          inset: "10% 12%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(12px, 1.6vw, 22px)",
          zIndex: 1,
        }}>
          {/* Icone de relogio */}
          <ClockIcon />

          {/* Titulo VOLTE AMANHA */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 900,
              fontSize: "clamp(22px, 2.8vw, 36px)",
              color: "#D4A843",
              letterSpacing: "4px",
              textTransform: "uppercase",
              textShadow: `
                0 0 20px rgba(212,168,67,0.6),
                0 2px 4px rgba(0,0,0,0.6)
              `,
              margin: 0,
              textAlign: "center",
            }}
          >
            {TEXTS.comeBackTomorrow[lang]}
          </motion.h1>

          {/* Subtitulo */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 500,
              fontSize: "clamp(10px, 1.1vw, 14px)",
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            {TEXTS.nextSpinIn[lang]}
          </motion.span>

          {/* Timer countdown */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(8px, 1vw, 14px)",
            }}
          >
            {/* Horas */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}>
              <motion.div
                key={time.hours}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{
                  padding: "clamp(8px, 1vw, 14px) clamp(12px, 1.5vw, 20px)",
                  background: "rgba(0,0,0,0.7)",
                  border: "1.5px solid rgba(212,168,67,0.4)",
                  borderRadius: "10px",
                  boxShadow: "inset 0 0 20px rgba(0,0,0,0.6), 0 0 20px rgba(255,215,0,0.15)",
                }}
              >
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: "clamp(32px, 4vw, 54px)",
                  color: "#FFD700",
                  textShadow: "0 0 16px rgba(255,215,0,0.7), 0 2px 4px rgba(0,0,0,0.7)",
                  lineHeight: 1,
                }}>
                  {time.hours}
                </span>
              </motion.div>
              <span style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "clamp(7px, 0.8vw, 10px)",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}>
                {TEXTS.hours[lang]}
              </span>
            </div>

            {/* Separador */}
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "clamp(28px, 3.5vw, 48px)",
              color: "#D4A843",
              marginBottom: "20px",
            }}>:</span>

            {/* Minutos */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}>
              <motion.div
                key={time.minutes}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{
                  padding: "clamp(8px, 1vw, 14px) clamp(12px, 1.5vw, 20px)",
                  background: "rgba(0,0,0,0.7)",
                  border: "1.5px solid rgba(212,168,67,0.4)",
                  borderRadius: "10px",
                  boxShadow: "inset 0 0 20px rgba(0,0,0,0.6), 0 0 20px rgba(255,215,0,0.15)",
                }}
              >
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: "clamp(32px, 4vw, 54px)",
                  color: "#FFD700",
                  textShadow: "0 0 16px rgba(255,215,0,0.7), 0 2px 4px rgba(0,0,0,0.7)",
                  lineHeight: 1,
                }}>
                  {time.minutes}
                </span>
              </motion.div>
              <span style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "clamp(7px, 0.8vw, 10px)",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}>
                {TEXTS.minutes[lang]}
              </span>
            </div>

            {/* Separador */}
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "clamp(28px, 3.5vw, 48px)",
              color: "#D4A843",
              marginBottom: "20px",
            }}>:</span>

            {/* Segundos */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}>
              <motion.div
                key={time.seconds}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{
                  padding: "clamp(8px, 1vw, 14px) clamp(12px, 1.5vw, 20px)",
                  background: "rgba(0,0,0,0.7)",
                  border: "1.5px solid rgba(212,168,67,0.4)",
                  borderRadius: "10px",
                  boxShadow: "inset 0 0 20px rgba(0,0,0,0.6), 0 0 20px rgba(255,215,0,0.15)",
                }}
              >
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: "clamp(32px, 4vw, 54px)",
                  color: "#FFD700",
                  textShadow: "0 0 16px rgba(255,215,0,0.7), 0 2px 4px rgba(0,0,0,0.7)",
                  lineHeight: 1,
                }}>
                  {time.seconds}
                </span>
              </motion.div>
              <span style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "clamp(7px, 0.8vw, 10px)",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}>
                {TEXTS.seconds[lang]}
              </span>
            </div>
          </motion.div>

          {/* Mensagem final */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              marginTop: "clamp(4px, 0.5vw, 8px)",
            }}
          >
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(10px, 1.1vw, 14px)",
              color: "rgba(255,255,255,0.45)",
              textAlign: "center",
            }}>
              {TEXTS.alreadyUsed[lang]}
            </span>
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(10px, 1.1vw, 14px)",
              color: "rgba(0,230,118,0.7)",
              textAlign: "center",
            }}>
              {TEXTS.comeBackToSpin[lang]}
            </span>
          </motion.div>
        </div>

        {/* Gemas decorativas */}
        <img
          src={ASSETS.gemGreen}
          alt=""
          style={{
            position: "absolute",
            bottom: "5%",
            left: "3%",
            width: "clamp(18px, 2.2vw, 30px)",
            height: "clamp(18px, 2.2vw, 30px)",
            objectFit: "contain",
            opacity: 0.6,
            filter: "drop-shadow(0 0 8px rgba(0,230,118,0.5))",
            zIndex: 3,
          }}
        />
        <img
          src={ASSETS.gemGreen}
          alt=""
          style={{
            position: "absolute",
            top: "8%",
            right: "4%",
            width: "clamp(14px, 1.8vw, 24px)",
            height: "clamp(14px, 1.8vw, 24px)",
            objectFit: "contain",
            opacity: 0.5,
            filter: "drop-shadow(0 0 8px rgba(0,230,118,0.5))",
            transform: "rotate(20deg)",
            zIndex: 3,
          }}
        />
      </motion.div>
    </motion.div>
  );
}
