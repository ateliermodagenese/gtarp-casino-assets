"use client";

import { motion } from "framer-motion";

interface DailyFreeIdleProps {
  calendarDays: { day: number; status: "future" | "available" | "claimed" | "missed" }[];
  currentStreak: number;
  milestones: { 7: boolean; 14: boolean; 30: boolean };
  onSpin: () => void;
  lang: "br" | "en";
}

const WHEEL_SEGMENTS = [
  { value: 1000, rotation: 0 },
  { value: 100, rotation: 45 },
  { value: 50, rotation: 90 },
  { value: 200, rotation: 135 },
  { value: 200, rotation: 180 },
  { value: 50, rotation: 225 },
  { value: 100, rotation: 270 },
  { value: 500, rotation: 315 },
];

const TEXTS = {
  br: {
    dayOf: "DIA",
    of: "DE",
    spin: "GIRAR",
    streak: "SEQUENCIA",
    days: "DIAS",
    achieved: "ATINGIDO",
  },
  en: {
    dayOf: "DAY",
    of: "OF",
    spin: "SPIN",
    streak: "STREAK",
    days: "DAYS",
    achieved: "ACHIEVED",
  },
};

export default function DailyFreeIdle({
  calendarDays,
  currentStreak,
  milestones,
  onSpin,
  lang,
}: DailyFreeIdleProps) {
  const t = TEXTS[lang];
  const currentDay = calendarDays.find((d) => d.status === "available")?.day || 1;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "clamp(16px, 3vw, 32px)",
        width: "100%",
        height: "100%",
        padding: "clamp(16px, 2vw, 24px)",
        boxSizing: "border-box",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* LADO ESQUERDO - RODA DA FORTUNA */}
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
        {/* Container da Roda */}
        <div
          style={{
            position: "relative",
            width: "clamp(240px, 32vw, 400px)",
            aspectRatio: "1",
          }}
        >
          {/* Glow externo da roda */}
          <div
            style={{
              position: "absolute",
              inset: "-20px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(212,168,67,0.25) 0%, transparent 70%)",
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
                0 0 30px rgba(212,168,67,0.5),
                0 0 60px rgba(212,168,67,0.3),
                inset 0 2px 4px rgba(255,255,255,0.3),
                inset 0 -2px 4px rgba(0,0,0,0.3)
              `,
            }}
          >
            {/* Area interna da roda */}
            <motion.div
              animate={{ rotate: [-2, 2, -2] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                position: "relative",
                overflow: "hidden",
                background: "#1A1A1A",
              }}
            >
              {/* Segmentos da roda */}
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
                  {/* Texto do premio */}
                  <div
                    style={{
                      position: "absolute",
                      left: "55%",
                      top: "50%",
                      transform: `translateY(-50%) rotate(${-segment.rotation - 22.5}deg)`,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: "clamp(14px, 1.8vw, 24px)",
                      color: "#D4A843",
                      textShadow: "0 0 10px rgba(212,168,67,0.5), 0 2px 4px rgba(0,0,0,0.8)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {segment.value}
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
                    0 0 20px rgba(212,168,67,0.4),
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
            </motion.div>
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
                boxShadow: "0 0 8px rgba(255,215,0,0.8), 0 2px 4px rgba(0,0,0,0.5)",
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

          {/* Ponteiro (diamante verde) */}
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
                  drop-shadow(0 0 6px rgba(0,230,118,0.8))
                  drop-shadow(0 0 12px rgba(0,230,118,0.5))
                  drop-shadow(0 4px 8px rgba(0,0,0,0.6))
                `,
              }}
            />
          </div>
        </div>

        {/* Botao GIRAR */}
        <motion.button
          onClick={onSpin}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{
            width: "clamp(180px, 22vw, 280px)",
            minHeight: "clamp(48px, 6vh, 60px)",
            borderRadius: "10px",
            border: "1.5px solid rgba(0,230,118,0.5)",
            background: "linear-gradient(180deg, #00E676 0%, #00C853 50%, #00A844 100%)",
            boxShadow: `
              0 0 20px rgba(0,230,118,0.4),
              0 0 40px rgba(0,230,118,0.2),
              inset 0 1px 2px rgba(255,255,255,0.3),
              inset 0 -2px 4px rgba(0,0,0,0.2),
              0 4px 12px rgba(0,0,0,0.4)
            `,
            cursor: "pointer",
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(16px, 2vw, 24px)",
            letterSpacing: "3px",
            color: "#000",
            textShadow: "0 1px 2px rgba(255,255,255,0.3)",
            textTransform: "uppercase",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Glow animado do botao */}
          <motion.div
            animate={{
              boxShadow: [
                "0 0 15px rgba(0,230,118,0.5)",
                "0 0 30px rgba(0,230,118,0.7)",
                "0 0 15px rgba(0,230,118,0.5)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              inset: "-2px",
              borderRadius: "12px",
              pointerEvents: "none",
            }}
          />
          {/* Reflexo superior */}
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "10%",
              right: "10%",
              height: "40%",
              background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)",
              borderRadius: "10px 10px 50% 50%",
              pointerEvents: "none",
            }}
          />
          <span style={{ position: "relative", zIndex: 1 }}>{t.spin}</span>
        </motion.button>
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
          {/* Ornamento esquerdo */}
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
          {/* Ornamento direito */}
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
            const isAvailable = dayData.status === "available";
            const isFuture = dayData.status === "future";
            const isMissed = dayData.status === "missed";

            return (
              <motion.div
                key={dayData.day}
                animate={
                  isAvailable
                    ? { scale: [1, 1.04, 1], boxShadow: ["0 0 8px rgba(0,230,118,0.3)", "0 0 16px rgba(0,230,118,0.5)", "0 0 8px rgba(0,230,118,0.3)"] }
                    : {}
                }
                transition={isAvailable ? { duration: 2, repeat: Infinity } : {}}
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
                  fontWeight: isAvailable ? 700 : 500,
                  cursor: isAvailable ? "pointer" : "default",
                  transition: "all 0.2s ease",
                  ...(isFuture && {
                    background: "#1A1A1A",
                    border: "1px solid rgba(212,168,67,0.1)",
                    color: "rgba(212,168,67,0.35)",
                  }),
                  ...(isAvailable && {
                    background: "rgba(0,230,118,0.08)",
                    border: "2px solid #00E676",
                    color: "#FFFFFF",
                    boxShadow: "0 0 12px rgba(0,230,118,0.4)",
                  }),
                  ...(isClaimed && {
                    background: "rgba(0,230,118,0.05)",
                    border: "1px solid rgba(212,168,67,0.3)",
                    color: "rgba(255,255,255,0.4)",
                  }),
                  ...(isMissed && {
                    background: "#1A1A1A",
                    border: "1px solid rgba(255,68,68,0.2)",
                    color: "rgba(255,255,255,0.2)",
                    opacity: 0.4,
                  }),
                }}
              >
                {/* Numero do dia */}
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

                {/* X vermelho para dias perdidos */}
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
              </motion.div>
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
          {/* 7 dias - Atingido */}
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

          {/* 14 dias - Futuro */}
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

          {/* 30 dias - Futuro */}
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
  );
}

// Dados mock para preview
DailyFreeIdle.defaultProps = {
  calendarDays: Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    status: i < 11 ? "claimed" : i === 11 ? "available" : "future",
  })) as { day: number; status: "future" | "available" | "claimed" | "missed" }[],
  currentStreak: 12,
  milestones: { 7: true, 14: false, 30: false },
  onSpin: () => console.log("Spin!"),
  lang: "br" as const,
};
