"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GameHeader } from "@/components/shared";

type Lang = "pt" | "en";

const GOLD = "#D4A843";
const EMERALD = "#00E676";

const ASSETS = {
  gcoin: "/assets/shared/icons/icon-gcoin.png",
  cue: "/assets/games/pool/cue.png",
  check: "/assets/shared/icons/icon-check.png",
};

interface Cue {
  id: number;
  name: string;
  price: number;
  gradient: string;
  stats: { aim: number; power: number; spin: number; time: number };
}

const CUES: Cue[] = [
  {
    id: 1,
    name: "Básico",
    price: 0,
    gradient: "linear-gradient(90deg, #3A2A1A, #5A4A2A, #8B5E3C)",
    stats: { aim: 20, power: 20, spin: 10, time: 30 },
  },
  {
    id: 2,
    name: "Prata",
    price: 2000,
    gradient: "linear-gradient(90deg, #3A3A3A, #888888, #C0C0C0)",
    stats: { aim: 40, power: 35, spin: 25, time: 40 },
  },
  {
    id: 3,
    name: "Dourado",
    price: 5000,
    gradient: "linear-gradient(90deg, #462523, #8B6914, #D4A843, #F6E27A)",
    stats: { aim: 60, power: 55, spin: 50, time: 50 },
  },
  {
    id: 4,
    name: "Diamante",
    price: 15000,
    gradient: "linear-gradient(90deg, #1A2A3A, #4A8AAA, #A8D8EA)",
    stats: { aim: 80, power: 75, spin: 70, time: 65 },
  },
  {
    id: 5,
    name: "Blackout",
    price: 50000,
    gradient: "linear-gradient(90deg, #0A0A0A, #462523, #D4A843, #FFD700)",
    stats: { aim: 95, power: 90, spin: 85, time: 80 },
  },
];

const TEXT: Record<Lang, Record<string, string>> = {
  pt: {
    title: "ARSENAL DE TACOS",
    free: "GRÁTIS",
    buy: "COMPRAR",
    equip: "EQUIPAR",
    equipped: "EQUIPADO",
    aim: "AIM",
    power: "POWER",
    spin: "SPIN",
    time: "TIME",
  },
  en: {
    title: "CUE ARSENAL",
    free: "FREE",
    buy: "BUY",
    equip: "EQUIP",
    equipped: "EQUIPPED",
    aim: "AIM",
    power: "POWER",
    spin: "SPIN",
    time: "TIME",
  },
};

export default function PoolCueShop({
  onBack,
  cues = { owned: [1, 2], locked: [3, 4, 5] },
  equippedId = 1,
  balance = 8250,
  onBuy,
  onEquip,
  lang = "pt",
}: {
  onBack: () => void;
  cues?: { owned: number[]; locked: number[] };
  equippedId?: number;
  balance?: number;
  onBuy?: (id: number) => void;
  onEquip?: (id: number) => void;
  lang: Lang;
}) {
  const t = TEXT[lang];
  const [selectedId, setSelectedId] = useState(equippedId);

  const selectedCue = CUES.find((c) => c.id === selectedId) || CUES[0];
  const isOwned = cues.owned.includes(selectedId);
  const isEquipped = selectedId === equippedId;
  const canAfford = balance >= selectedCue.price;

  const statLabels = ["aim", "power", "spin", "time"] as const;

  return (
    <div
      style={{
        position: "absolute",
        inset: "6px",
        zIndex: 60,
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#080604",
        backgroundImage: "url('/assets/shared/ui/bg-casino.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <GameHeader
        onBack={onBack}
        title={t.title}
        balance={balance}
        lang={lang}
        actions={[]}
      />

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(16px,3vw,32px)",
          gap: "clamp(16px,2.5vw,28px)",
        }}
      >
        {/* Selected Cue Display */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "clamp(8px,1.5vw,16px)",
          }}
        >
          {/* Color line */}
          <div
            style={{
              width: "clamp(100px,15vw,160px)",
              height: "3px",
              background: selectedCue.gradient,
              borderRadius: "2px",
            }}
          />

          {/* Cue image */}
          <motion.img
            key={selectedId}
            src={ASSETS.cue}
            alt={selectedCue.name}
            initial={{ opacity: 0, rotate: 20 }}
            animate={{ opacity: 1, rotate: 30 }}
            transition={{ duration: 0.3 }}
            style={{
              height: "clamp(120px,18vw,200px)",
              transform: "rotate(30deg)",
              filter: selectedCue.id === 5 ? "brightness(0.9) contrast(1.1)" : "none",
            }}
          />

          {/* Name */}
          <h2
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 800,
              fontSize: "clamp(16px,2.5vw,28px)",
              color: GOLD,
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            {selectedCue.name}
          </h2>

          {/* Price */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {selectedCue.price > 0 && (
              <img
                src={ASSETS.gcoin}
                alt="GCoin"
                style={{ width: "18px", height: "18px" }}
              />
            )}
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: "clamp(14px,2vw,22px)",
                color: EMERALD,
              }}
            >
              {selectedCue.price === 0
                ? t.free
                : `G$${selectedCue.price.toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Carousel */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            padding: "8px 4px",
            maxWidth: "100%",
          }}
        >
          {CUES.map((cue) => {
            const owned = cues.owned.includes(cue.id);
            const isSelected = cue.id === selectedId;
            const locked = !owned && !canAfford && cue.price > balance;

            return (
              <motion.div
                key={cue.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedId(cue.id)}
                style={{
                  width: "clamp(60px,9vw,80px)",
                  height: "clamp(70px,10vw,90px)",
                  background: "rgba(15,12,5,0.95)",
                  border: `1.5px solid rgba(212,168,67,${isSelected ? 0.6 : 0.18})`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  scrollSnapAlign: "center",
                  flexShrink: 0,
                  boxShadow: isSelected
                    ? "0 0 15px rgba(212,168,67,0.1)"
                    : "none",
                  opacity: locked ? 0.5 : 1,
                  filter: locked ? "grayscale(0.3)" : "none",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Top gradient line */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: cue.gradient,
                  }}
                />

                {/* Mini cue */}
                <img
                  src={ASSETS.cue}
                  alt={cue.name}
                  style={{
                    height: "40px",
                    transform: "rotate(45deg)",
                  }}
                />

                {/* Name */}
                <span
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "8px",
                    color: GOLD,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {cue.name}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Stats */}
        <div
          style={{
            width: "100%",
            maxWidth: "clamp(260px,40vw,360px)",
            display: "flex",
            flexDirection: "column",
            gap: "clamp(8px,1.2vw,14px)",
          }}
        >
          {statLabels.map((stat, index) => (
            <div
              key={stat}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(8px,1.2vw,14px)",
              }}
            >
              {/* Label */}
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "clamp(9px,1vw,12px)",
                  color: "rgba(255,255,255,0.5)",
                  width: "50px",
                  textTransform: "uppercase",
                }}
              >
                {t[stat]}
              </span>

              {/* Track */}
              <div
                style={{
                  flex: 1,
                  height: "clamp(4px,0.6vw,7px)",
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                {/* Fill */}
                <motion.div
                  key={`${selectedId}-${stat}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedCue.stats[stat]}%` }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: "easeOut",
                  }}
                  style={{
                    height: "100%",
                    background: `linear-gradient(90deg, ${EMERALD}, ${GOLD})`,
                    borderRadius: "4px",
                  }}
                />
              </div>

              {/* Value */}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "clamp(9px,1vw,12px)",
                  color: "rgba(255,255,255,0.4)",
                  width: "30px",
                  textAlign: "right",
                }}
              >
                {selectedCue.stats[stat]}%
              </span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div style={{ marginTop: "clamp(8px,1.5vw,16px)" }}>
          {isEquipped ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(0,230,118,0.1)",
                border: "1.5px solid rgba(0,230,118,0.3)",
                borderRadius: "8px",
                padding: "12px 24px",
                minHeight: "48px",
              }}
            >
              <img
                src={ASSETS.check}
                alt="Check"
                style={{ width: "16px", height: "16px" }}
              />
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: "clamp(11px,1.4vw,15px)",
                  color: EMERALD,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {t.equipped}
              </span>
            </div>
          ) : isOwned ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onEquip?.(selectedId)}
              style={{
                background: "linear-gradient(180deg, #D4A843, #8B6914)",
                border: "none",
                borderRadius: "8px",
                padding: "12px 32px",
                minHeight: "48px",
                cursor: "pointer",
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: "clamp(12px,1.6vw,17px)",
                color: "#FFFFFF",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
              }}
            >
              {t.equip}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: canAfford ? 1.03 : 1 }}
              whileTap={{ scale: canAfford ? 0.97 : 1 }}
              onClick={() => canAfford && onBuy?.(selectedId)}
              style={{
                background: canAfford
                  ? "linear-gradient(180deg, #00E676, #00C853)"
                  : "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: "8px",
                padding: "12px 32px",
                minHeight: "48px",
                cursor: canAfford ? "pointer" : "not-allowed",
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: "clamp(12px,1.6vw,17px)",
                color: canAfford ? "#FFFFFF" : "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {t.buy}
              <img
                src={ASSETS.gcoin}
                alt="GCoin"
                style={{
                  width: "14px",
                  height: "14px",
                  opacity: canAfford ? 1 : 0.4,
                }}
              />
              <span>G${selectedCue.price.toLocaleString()}</span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
