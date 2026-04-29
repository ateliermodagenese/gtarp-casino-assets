"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface DailyFreeClaimedProps {
  calendarDays: { day: number; status: "future" | "available" | "claimed" | "missed" }[];
  currentStreak: number;
  milestones: { 7: boolean; 14: boolean; 30: boolean };
  timeLeft: number;
  todayPrize: number;
  lang: "br" | "en";
}

const WHEEL_SEGMENTS = [
  { value: 1000, rotation: 0, icon: "/assets/games/daily-free/prizes/treasure.png" },
  { value: 100, rotation: 45, icon: "/assets/games/daily-free/prizes/coin-medium.png" },
  { value: 50, rotation: 90, icon: "/assets/games/daily-free/prizes/coin-small.png" },
  { value: 200, rotation: 135, icon: "/assets/games/daily-free/prizes/coin-stack.png" },
  { value: 200, rotation: 180, icon: "/assets/games/daily-free/prizes/coin-stack.png" },
  { value: 50, rotation: 225, icon: "/assets/games/daily-free/prizes/coin-small.png" },
  { value: 500, rotation: 270, icon: "/assets/games/daily-free/prizes/gem-green.png" },
  { value: 500, rotation: 315, icon: "/assets/games/daily-free/prizes/gem-green.png" },
];

const TEXTS = {
  br: {
    dayOf: "DIA",
    of: "DE",
    streak: "SEQUENCIA",
    days: "DIAS",
    achieved: "ATINGIDO",
    comeBackTomorrow: "VOLTE AMANHA",
    almostThere: "QUASE LA!",
    nextSpin: "PROXIMO GIRO",
    availableIn: "Disponivel em",
    howItWorks: "COMO FUNCIONA",
    howItWorksDesc: "Gire 1x por dia e ganhe GCoins gratis!",
  },
  en: {
    dayOf: "DAY",
    of: "OF",
    streak: "STREAK",
    days: "DAYS",
    achieved: "ACHIEVED",
    comeBackTomorrow: "COME BACK TOMORROW",
    almostThere: "ALMOST THERE!",
    nextSpin: "NEXT SPIN",
    availableIn: "Available in",
    howItWorks: "HOW IT WORKS",
    howItWorksDesc: "Spin 1x per day and earn free GCoins!",
  },
};

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function DailyFreeClaimed({
  calendarDays,
  currentStreak,
  milestones,
  timeLeft: initialTimeLeft,
  todayPrize,
  lang,
}: DailyFreeClaimedProps) {
  const t = TEXTS[lang];
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
  const isUrgent = timeLeft < 3600000; // menos de 1 hora

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Encontrar o dia atual (ultimo claimed)
  const claimedDays = calendarDays.filter((d) => d.status === "claimed");
  const currentDay = claimedDays.length > 0 ? claimedDays[claimedDays.length - 1].day : 1;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Conteudo principal */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "clamp(16px, 3vw, 32px)",
          flex: 1,
          padding: "clamp(16px, 2vw, 24px)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* LADO ESQUERDO - RODA DA FORTUNA (DIMMED) */}
        <div
          style={{
            flex: "0 0 55%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(20px, 3vw, 36px)",
          }}
        >
          {/* Container da Roda - DIMMED */}
          <div
            style={{
              position: "relative",
              width: "clamp(240px, 32vw, 400px)",
              aspectRatio: "1",
              opacity: 0.4,
              filter: "saturate(0.5) brightness(0.6)",
              transition: "all 0.4s ease",
            }}
          >
            {/* Glow externo da roda */}
            <div
              style={{
                position: "absolute",
                inset: "-20px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(212,168,67,0.15) 0%, transparent 70%)",
                filter: "blur(20px)",
                pointerEvents: "none",
              }}
            />

            {/* Moldura dourada externa */}
            <div
              style={{
                position: "absolute",
                inset: "0",
                borderRadius: "50%",
                padding: "8px",
                background: "linear-gradient(135deg, #8B6914 0%, #D4A843 25%, #F6E27A 50%, #D4A843 75%, #8B6914 100%)",
                boxShadow: `
                  0 0 20px rgba(212,168,67,0.3),
                  inset 0 2px 4px rgba(255,255,255,0.2),
                  inset 0 -2px 4px rgba(0,0,0,0.3)
                `,
              }}
            >
              {/* Area interna da roda - SEM ANIMACAO */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  position: "relative",
                  overflow: "hidden",
                  background: "#1A1A1A",
                }}
              >
                {/* Segmentos da roda com icones */}
                {WHEEL_SEGMENTS.map((segment, index) => (
                  <div
                    key={index}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: "50%",
                      height: "2px",
                      transformOrigin: "left center",
                      transform: `rotate(${segment.rotation + 22.5}deg)`,
                    }}
                  >
                    {/* Linha divisoria do segmento */}
                    <div
                      style={{
                        position: "absolute",
                        top: "-1px",
                        left: "15%",
                        right: "0",
                        height: "2px",
                        background: "linear-gradient(90deg, transparent, rgba(212,168,67,0.4))",
                      }}
                    />
                    {/* Container do premio */}
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: `translateY(-50%) rotate(${-segment.rotation - 22.5}deg)`,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "2px",
                      }}
                    >
                      <img
                        src={segment.icon}
                        alt={`${segment.value} GCoin`}
                        style={{
                          width: "clamp(20px, 2.5vw, 32px)",
                          height: "clamp(20px, 2.5vw, 32px)",
                          objectFit: "contain",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 700,
                          fontSize: "clamp(10px, 1.3vw, 16px)",
                          color: "#D4A843",
                          textShadow: "0 0 6px rgba(212,168,67,0.5), 0 2px 4px rgba(0,0,0,0.8)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {segment.value}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Linhas radiais entre segmentos */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={`line-${i}`}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: "50%",
                      height: "1px",
                      background: "linear-gradient(90deg, transparent 15%, rgba(212,168,67,0.3) 100%)",
                      transformOrigin: "left center",
                      transform: `rotate(${i * 45}deg)`,
                    }}
                  />
                ))}

                {/* Hub central */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "clamp(50px, 7vw, 80px)",
                    height: "clamp(50px, 7vw, 80px)",
                    borderRadius: "50%",
                    background: "radial-gradient(circle at 30% 30%, #2A2A2A, #0A0A0A)",
                    border: "3px solid #D4A843",
                    boxShadow: `
                      0 0 15px rgba(212,168,67,0.3),
                      inset 0 2px 8px rgba(0,0,0,0.8)
                    `,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src="/assets/games/daily-free/logo-mini.png"
                    alt="Logo"
                    style={{
                      width: "clamp(30px, 4vw, 50px)",
                      height: "clamp(30px, 4vw, 50px)",
                      objectFit: "contain",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Pinos dourados nos pontos cardinais */}
            {[0, 90, 180, 270].map((angle) => (
              <div
                key={`pin-${angle}`}
                style={{
                  position: "absolute",
                  width: "clamp(10px, 1.2vw, 14px)",
                  height: "clamp(10px, 1.2vw, 14px)",
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 30% 30%, #FFD700, #B8860B)",
                  boxShadow: "0 0 6px rgba(255,215,0,0.5), 0 2px 4px rgba(0,0,0,0.5)",
                  top: angle === 0 ? "4px" : angle === 180 ? "auto" : "50%",
                  bottom: angle === 180 ? "4px" : "auto",
                  left: angle === 270 ? "4px" : angle === 90 ? "auto" : "50%",
                  right: angle === 90 ? "4px" : "auto",
                  transform:
                    angle === 0 || angle === 180
                      ? "translateX(-50%)"
                      : "translateY(-50%)",
                }}
              />
            ))}

            {/* Ponteiro (diamante verde) - herda opacity */}
            <div
              style={{
                position: "absolute",
                top: "-12px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
              }}
            >
              <img
                src="/assets/games/daily-free/icons/wheel-pointer.png"
                alt="Pointer"
                style={{
                  width: "clamp(28px, 3.5vw, 44px)",
                  height: "auto",
                  filter: `
                    drop-shadow(0 0 4px rgba(0,230,118,0.4))
                    drop-shadow(0 4px 8px rgba(0,0,0,0.6))
                  `,
                }}
              />
            </div>
          </div>

          {/* Botao TIMER (substitui GIRAR) */}
          <motion.div
            animate={
              isUrgent
                ? { opacity: [0.8, 1, 0.8] }
                : {}
            }
            transition={isUrgent ? { duration: 1.5, repeat: Infinity } : {}}
            style={{
              width: "clamp(180px, 22vw, 280px)",
              minHeight: "clamp(52px, 6.5vw, 68px)",
              borderRadius: "10px",
              border: "1.5px solid rgba(212,168,67,0.2)",
              background: "linear-gradient(180deg, #1A1A1A 0%, #222222 50%, #141414 100%)",
              boxShadow: `
                inset 0 1px 2px rgba(255,255,255,0.05),
                inset 0 -2px 4px rgba(0,0,0,0.3),
                0 4px 12px rgba(0,0,0,0.5)
              `,
              cursor: "default",
              pointerEvents: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "clamp(8px, 1vw, 12px)",
            }}
          >
            {/* Linha 1: VOLTE AMANHA ou QUASE LA! */}
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                fontSize: "clamp(10px, 1.2vw, 14px)",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: isUrgent ? "#FF6B6B" : "#D4A843",
                opacity: isUrgent ? 0.9 : 0.6,
              }}
            >
              {isUrgent ? t.almostThere : t.comeBackTomorrow}
            </span>
            {/* Linha 2: Timer */}
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: "clamp(14px, 1.8vw, 22px)",
                color: isUrgent ? "#FF6B6B" : "#D4A843",
                opacity: 0.8,
              }}
            >
              {formatTime(timeLeft)}
            </span>
          </motion.div>
        </div>

        {/* LADO DIREITO - CALENDARIO + STREAK */}
        <div
          style={{
            flex: "0 0 45%",
            display: "flex",
            flexDirection: "column",
            gap: "clamp(12px, 1.5vw, 20px)",
            padding: "clamp(16px, 2vw, 24px)",
            background: "rgba(0,0,0,0.3)",
            borderRadius: "12px",
            border: "1px solid rgba(212,168,67,0.2)",
          }}
        >
          {/* Titulo DIA X DE 30 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "clamp(8px, 1vw, 16px)",
            }}
          >
            <div
              style={{
                width: "clamp(30px, 4vw, 60px)",
                height: "2px",
                background: "linear-gradient(90deg, transparent, #D4A843)",
              }}
            />
            <h2
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: "clamp(14px, 1.8vw, 22px)",
                color: "#D4A843",
                textTransform: "uppercase",
                letterSpacing: "3px",
                textShadow: "0 0 10px rgba(212,168,67,0.5)",
                margin: 0,
                whiteSpace: "nowrap",
              }}
            >
              {t.dayOf} {currentDay} {t.of} 30
            </h2>
            <div
              style={{
                width: "clamp(30px, 4vw, 60px)",
                height: "2px",
                background: "linear-gradient(90deg, #D4A843, transparent)",
              }}
            />
          </div>

          {/* Grid de 30 dias */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "clamp(4px, 0.5vw, 8px)",
            }}
          >
            {calendarDays.map((dayData) => {
              const isMilestone7 = dayData.day === 7;
              const isClaimed = dayData.status === "claimed";
              const isFuture = dayData.status === "future";
              const isMissed = dayData.status === "missed";
              const isToday = dayData.day === currentDay;

              return (
                <div
                  key={dayData.day}
                  style={{
                    position: "relative",
                    aspectRatio: "1",
                    borderRadius: "6px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "clamp(11px, 1.3vw, 16px)",
                    fontWeight: isToday ? 700 : 500,
                    transition: "all 0.2s ease",
                    ...(isFuture && {
                      background: "#1A1A1A",
                      border: "1px solid rgba(212,168,67,0.1)",
                      color: "rgba(212,168,67,0.35)",
                    }),
                    ...(isClaimed && !isToday && {
                      background: "rgba(0,230,118,0.05)",
                      border: "1px solid rgba(212,168,67,0.3)",
                      color: "rgba(255,255,255,0.4)",
                    }),
                    ...(isClaimed && isToday && {
                      background: "rgba(212,168,67,0.1)",
                      border: "2px solid #D4A843",
                      color: "#FFFFFF",
                      boxShadow: "0 0 12px rgba(212,168,67,0.4)",
                    }),
                    ...(isMissed && {
                      background: "#1A1A1A",
                      border: "1px solid rgba(255,68,68,0.2)",
                      color: "rgba(255,255,255,0.2)",
                      opacity: 0.4,
                    }),
                  }}
                >
                  <span>{dayData.day}</span>

                  {/* Check verde para dias claimados */}
                  {isClaimed && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{
                        position: "absolute",
                        bottom: "2px",
                      }}
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="#00E676"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}

                  {/* Badge milestone azul no dia 7 */}
                  {isMilestone7 && milestones[7] && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-4px",
                        right: "-4px",
                        width: "clamp(12px, 1.4vw, 18px)",
                        height: "clamp(12px, 1.4vw, 18px)",
                        borderRadius: "50%",
                        background: "#4B69FF",
                        border: "2px solid #080604",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 8px rgba(75,105,255,0.6)",
                      }}
                    >
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                  )}

                  {isMissed && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{
                        position: "absolute",
                        bottom: "2px",
                        opacity: 0.6,
                      }}
                    >
                      <path
                        d="M6 6l12 12M18 6l-12 12"
                        stroke="#FF4444"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>

          {/* Streak Counter */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "clamp(8px, 1vw, 12px)",
              marginTop: "clamp(4px, 0.5vw, 8px)",
            }}
          >
            <motion.img
              src="/assets/games/daily-free/icons/icon-flame.png"
              alt="Flame"
              animate={{ scale: [1, 1.1, 1], rotate: [-3, 3, -3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                width: "clamp(24px, 3vw, 36px)",
                height: "clamp(24px, 3vw, 36px)",
                filter: "drop-shadow(0 0 8px rgba(255,165,0,0.6))",
              }}
            />
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: "clamp(14px, 1.8vw, 22px)",
                color: "#D4A843",
                textShadow: "0 0 10px rgba(212,168,67,0.5)",
                letterSpacing: "2px",
              }}
            >
              {t.streak}: {currentStreak} {t.days}
            </span>
          </div>

          {/* Badges de Milestone */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "clamp(8px, 1vw, 14px)",
              marginTop: "clamp(4px, 0.5vw, 8px)",
            }}
          >
            {/* 7 dias */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "clamp(6px, 0.8vw, 10px) clamp(12px, 1.5vw, 20px)",
                borderRadius: "8px",
                background: milestones[7] ? "rgba(75,105,255,0.2)" : "transparent",
                border: milestones[7] ? "1px solid #4B69FF" : "1px dashed rgba(255,255,255,0.15)",
                boxShadow: milestones[7] ? "0 0 12px rgba(75,105,255,0.4)" : "none",
              }}
            >
              {!milestones[7] && (
                <img
                  src="/assets/games/daily-free/icons/icon-lock.png"
                  alt="Lock"
                  style={{
                    width: "clamp(12px, 1.5vw, 16px)",
                    height: "clamp(12px, 1.5vw, 16px)",
                    opacity: 0.4,
                    marginBottom: "2px",
                  }}
                />
              )}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: "clamp(10px, 1.2vw, 14px)",
                  color: milestones[7] ? "#FFFFFF" : "rgba(255,255,255,0.35)",
                }}
              >
                7d +500
              </span>
              {milestones[7] && (
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "clamp(8px, 0.9vw, 10px)",
                    color: "#4B69FF",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginTop: "2px",
                  }}
                >
                  {t.achieved}
                </span>
              )}
            </div>

            {/* 14 dias */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "clamp(6px, 0.8vw, 10px) clamp(12px, 1.5vw, 20px)",
                borderRadius: "8px",
                background: milestones[14] ? "rgba(136,71,255,0.2)" : "transparent",
                border: milestones[14] ? "1px solid #8847FF" : "1px dashed rgba(255,255,255,0.15)",
                boxShadow: milestones[14] ? "0 0 12px rgba(136,71,255,0.4)" : "none",
              }}
            >
              {!milestones[14] && (
                <img
                  src="/assets/games/daily-free/icons/icon-lock.png"
                  alt="Lock"
                  style={{
                    width: "clamp(12px, 1.5vw, 16px)",
                    height: "clamp(12px, 1.5vw, 16px)",
                    opacity: 0.4,
                    marginBottom: "2px",
                  }}
                />
              )}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: "clamp(10px, 1.2vw, 14px)",
                  color: milestones[14] ? "#FFFFFF" : "rgba(255,255,255,0.35)",
                }}
              >
                14d +1000
              </span>
              {milestones[14] && (
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "clamp(8px, 0.9vw, 10px)",
                    color: "#8847FF",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginTop: "2px",
                  }}
                >
                  {t.achieved}
                </span>
              )}
            </div>

            {/* 30 dias */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "clamp(6px, 0.8vw, 10px) clamp(12px, 1.5vw, 20px)",
                borderRadius: "8px",
                background: milestones[30] ? "rgba(255,215,0,0.2)" : "transparent",
                border: milestones[30] ? "1px solid #FFD700" : "1px dashed rgba(255,255,255,0.15)",
                boxShadow: milestones[30] ? "0 0 12px rgba(255,215,0,0.4)" : "none",
              }}
            >
              {!milestones[30] && (
                <img
                  src="/assets/games/daily-free/icons/icon-lock.png"
                  alt="Lock"
                  style={{
                    width: "clamp(12px, 1.5vw, 16px)",
                    height: "clamp(12px, 1.5vw, 16px)",
                    opacity: 0.4,
                    marginBottom: "2px",
                  }}
                />
              )}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: "clamp(10px, 1.2vw, 14px)",
                  color: milestones[30] ? "#FFFFFF" : "rgba(255,255,255,0.35)",
                }}
              >
                30d +5000
              </span>
              {milestones[30] && (
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "clamp(8px, 0.9vw, 10px)",
                    color: "#FFD700",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginTop: "2px",
                  }}
                >
                  {t.achieved}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE STATUS INFERIOR */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "clamp(12px, 2vw, 24px)",
          padding: "clamp(12px, 1.5vw, 20px) clamp(16px, 2vw, 24px)",
          margin: "0 clamp(16px, 2vw, 24px) clamp(16px, 2vw, 24px)",
          background: "rgba(0,0,0,0.4)",
          borderRadius: "10px",
          border: "1px solid rgba(212,168,67,0.15)",
        }}
      >
        {/* BLOCO 1: SEQUENCIA */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: "clamp(10px, 1.2vw, 16px)",
          }}
        >
          <motion.img
            src="/assets/games/daily-free/icons/icon-flame.png"
            alt="Flame"
            animate={{ scale: [1, 1.15, 1], rotate: [-5, 5, -5] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{
              width: "clamp(32px, 4vw, 48px)",
              height: "clamp(32px, 4vw, 48px)",
              filter: "drop-shadow(0 0 10px rgba(255,165,0,0.7))",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                fontSize: "clamp(10px, 1.2vw, 14px)",
                color: "#D4A843",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {t.streak}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: "clamp(16px, 2vw, 24px)",
                color: "#FFFFFF",
              }}
            >
              {currentStreak} {t.days}
            </span>
          </div>
        </div>

        {/* BLOCO 2: PROXIMO GIRO */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: "clamp(10px, 1.2vw, 16px)",
            borderLeft: "1px solid rgba(212,168,67,0.15)",
            borderRight: "1px solid rgba(212,168,67,0.15)",
            paddingLeft: "clamp(12px, 1.5vw, 20px)",
            paddingRight: "clamp(12px, 1.5vw, 20px)",
          }}
        >
          <img
            src="/assets/shared/icons/icon-calendar.png"
            alt="Calendar"
            style={{
              width: "clamp(32px, 4vw, 48px)",
              height: "clamp(32px, 4vw, 48px)",
              opacity: 0.8,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                fontSize: "clamp(10px, 1.2vw, 14px)",
                color: "#D4A843",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {t.nextSpin}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: "clamp(16px, 2vw, 24px)",
                color: "#FFFFFF",
              }}
            >
              {formatTime(timeLeft)}
            </span>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "clamp(9px, 1vw, 12px)",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {t.availableIn}
            </span>
          </div>
        </div>

        {/* BLOCO 3: COMO FUNCIONA */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: "clamp(10px, 1.2vw, 16px)",
          }}
        >
          <div
            style={{
              width: "clamp(32px, 4vw, 48px)",
              height: "clamp(32px, 4vw, 48px)",
              borderRadius: "50%",
              border: "2px solid #D4A843",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(212,168,67,0.1)",
            }}
          >
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: "clamp(16px, 2vw, 24px)",
                color: "#D4A843",
              }}
            >
              ?
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                fontSize: "clamp(10px, 1.2vw, 14px)",
                color: "#D4A843",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {t.howItWorks}
            </span>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "clamp(10px, 1.1vw, 13px)",
                color: "rgba(255,255,255,0.6)",
                maxWidth: "clamp(120px, 15vw, 200px)",
              }}
            >
              {t.howItWorksDesc}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dados mock para preview
DailyFreeClaimed.defaultProps = {
  calendarDays: Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    status: i < 12 ? "claimed" : "future",
  })) as { day: number; status: "future" | "available" | "claimed" | "missed" }[],
  currentStreak: 12,
  milestones: { 7: true, 14: false, 30: false },
  timeLeft: 85200000,
  todayPrize: 200,
  lang: "br" as const,
};
