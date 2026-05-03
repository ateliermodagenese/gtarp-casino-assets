"use client";

// ============================================================================
// ROULETTE WHEEL — Roda europeia com animacao Framer Motion
// ============================================================================
// A roda gira no eixo correto (rotate) e a bola orbita no sentido contrario
// Usa imagem real wheel-european.png (NAO Canvas/SVG)
// ============================================================================

import { useState, useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import { WHEEL_SEQUENCE, getNumberColor, type RouletteMode, type LightningNumber } from "./RouletteGame";

// Assets
const ASSETS = {
  wheelEuropean: "/assets/games/roulette/wheel-european.png",
  ball: "/assets/games/roulette/ball.png",
  frameWheel: "/assets/games/roulette/frame-wheel.png",
  lightningBolt: "/assets/games/roulette/lightning-bolt.png",
};

// Paleta
const ROULETTE = {
  lightningGold: "#FFD700",
  lightningGlow: "rgba(255,215,0,0.6)",
};

// Config
const CONFIG = {
  SPIN_DURATION: 4.5, // segundos
  SPIN_ROTATIONS: 5, // voltas completas
  BALL_ORBIT_RADIUS: 0.38, // % do raio da roda
};

interface RouletteWheelProps {
  isSpinning: boolean;
  resultNumber: number | null;
  mode: RouletteMode;
  lightningNumbers: LightningNumber[];
}

export default function RouletteWheel({
  isSpinning,
  resultNumber,
  mode,
  lightningNumbers,
}: RouletteWheelProps) {
  const wheelControls = useAnimation();
  const ballControls = useAnimation();
  const [showBall, setShowBall] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);

  // Calcular angulo do numero na roda
  const getNumberAngle = (num: number): number => {
    const index = WHEEL_SEQUENCE.indexOf(num);
    if (index === -1) return 0;
    // Cada pocket = 360/37 graus (aproximadamente 9.73 graus)
    // O 0 esta no topo, entao angulo 0 = topo
    return (index * 360) / 37;
  };

  // Animar quando isSpinning muda
  useEffect(() => {
    if (isSpinning && resultNumber !== null) {
      // Calcular angulo final para parar no numero correto
      const targetAngle = getNumberAngle(resultNumber);
      // A roda gira no sentido horario, queremos que o numero pare no topo
      // Final = rotacoes completas + angulo para alinhar
      const totalRotation = CONFIG.SPIN_ROTATIONS * 360 + (360 - targetAngle);

      setShowBall(true);

      // Animar roda
      wheelControls.start({
        rotate: wheelRotation + totalRotation,
        transition: {
          duration: CONFIG.SPIN_DURATION,
          ease: [0.25, 0.1, 0.25, 1], // cubic-bezier suave
        },
      }).then(() => {
        setWheelRotation(prev => prev + totalRotation);
      });

      // Animar bola (orbita reversa + cai no pocket)
      ballControls.start({
        rotate: -(wheelRotation + totalRotation) * 1.3, // Sentido contrario, mais rapido
        scale: [1, 1, 1, 0.8, 0.6],
        opacity: [1, 1, 1, 1, 0],
        transition: {
          duration: CONFIG.SPIN_DURATION,
          ease: [0.25, 0.1, 0.25, 1],
        },
      }).then(() => {
        setShowBall(false);
      });
    }
  }, [isSpinning, resultNumber]);

  // Lightning flash no modo relampago
  const isLightningWin = mode === "lightning" && 
    resultNumber !== null && 
    lightningNumbers.some(ln => ln.number === resultNumber);

  return (
    <div
      style={{
        position: "relative",
        width: "clamp(220px, 30vw, 400px)",
        aspectRatio: "1/1",
      }}
    >
      {/* Frame dourado (camada superior) */}
      <div
        style={{
          position: "absolute",
          inset: "-8%",
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        <img
          src={ASSETS.frameWheel}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: isLightningWin 
              ? `drop-shadow(0 0 30px ${ROULETTE.lightningGlow})`
              : "drop-shadow(0 0 20px rgba(212,168,67,0.3))",
            transition: "filter 0.3s ease",
          }}
        />
      </div>

      {/* Container da roda girando */}
      <motion.div
        animate={wheelControls}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
        }}
      >
        <img
          src={ASSETS.wheelEuropean}
          alt="Roulette Wheel"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 0 15px rgba(0,0,0,0.5))",
          }}
        />
      </motion.div>

      {/* Bola orbitando */}
      {showBall && (
        <motion.div
          animate={ballControls}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: `${50 - CONFIG.BALL_ORBIT_RADIUS * 100}%`,
              left: "50%",
              transform: "translateX(-50%)",
              width: "clamp(12px, 1.5vw, 20px)",
              height: "clamp(12px, 1.5vw, 20px)",
            }}
          >
            <img
              src={ASSETS.ball}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Indicador de resultado (aparece apos spin) */}
      {!isSpinning && resultNumber !== null && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 4,
            width: "clamp(48px, 6vw, 80px)",
            height: "clamp(48px, 6vw, 80px)",
            borderRadius: "50%",
            background: getNumberColor(resultNumber) === "red"
              ? "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)"
              : getNumberColor(resultNumber) === "black"
                ? "linear-gradient(135deg, #2D2D2D 0%, #1A1A1A 100%)"
                : "linear-gradient(135deg, #15803D 0%, #166534 100%)",
            border: isLightningWin 
              ? `3px solid ${ROULETTE.lightningGold}`
              : "3px solid rgba(255,255,255,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "clamp(20px, 3vw, 36px)",
            fontWeight: 800,
            color: "#fff",
            boxShadow: isLightningWin
              ? `0 0 30px ${ROULETTE.lightningGlow}, 0 0 60px ${ROULETTE.lightningGlow}`
              : "0 0 20px rgba(0,0,0,0.5)",
            animation: isLightningWin ? "megaPulse 1s ease-in-out infinite" : "none",
          }}
        >
          {resultNumber}
        </motion.div>
      )}

      {/* Lightning effect overlay */}
      {isLightningWin && (
        <>
          {[...Array(4)].map((_, i) => (
            <motion.img
              key={i}
              src={ASSETS.lightningBolt}
              alt=""
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.2, 0],
                rotate: i * 90,
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.1,
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
              style={{
                position: "absolute",
                width: "clamp(40px, 5vw, 70px)",
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-80%)`,
                zIndex: 5,
                filter: `drop-shadow(0 0 15px ${ROULETTE.lightningGlow})`,
                pointerEvents: "none",
              }}
            />
          ))}
        </>
      )}

      {/* Glow effect */}
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          background: isLightningWin
            ? `radial-gradient(circle, ${ROULETTE.lightningGlow} 0%, transparent 60%)`
            : "radial-gradient(circle, rgba(212,168,67,0.15) 0%, transparent 60%)",
          zIndex: 0,
          pointerEvents: "none",
          transition: "background 0.5s ease",
        }}
      />
    </div>
  );
}
