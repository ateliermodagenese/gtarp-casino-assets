"use client";

// WheelComponent — Roda da Fortuna do Daily-Free (#19)
// VERSAO 3.0 — 30/04/2026 — abordagem HIBRIDA (PNG + SVG overlay + iluminacao)
//
// ARQUITETURA EM 5 CAMADAS (de baixo pra cima na pilha visual):
//
//   [Camada 1] Hub central preto (FIXO, vazio sem logo BC conforme BC pediu)
//   [Camada 2] PNG da roda vazia (FIXO — moldura ornamental + 8 pinos + segments coloridos)
//   [Camada 3] SVG overlay com 11 numeros + Mystery (?) (ROTACIONA com Framer Motion)
//   [Camada 4] SVG iluminacao 8 pinos pulse alternado (ROTACIONA junto com camada 3)
//   [Camada 5] Ponteiro PNG no topo (FIXO, anima bounce no parar)
//
// Camadas 3 e 4 ficam no mesmo <motion.svg> e rotacionam juntas — assim os
// brilhos dos pinos seguem a roda durante o spin, criando ilusao de "luzes
// presas" aos pinos fisicos (BC: "iluminacao acompanhe o ponto").
//
// ANIMACAO DOS PINOS: pulse alternado (pares vs impares) tipo pisca-pisca de
// Natal, com gradient de cor circular ouro -> esmeralda -> ouro conforme
// posicao angular. GPU-friendly (so opacity + scale). 60fps no CEF 103.
//
// MOTIVO DA ABORDAGEM:
// - SVG nativo tinha numeros invadindo moldura (RADIUS_TEXT colidia)
// - Canvas 2D no estudo X0 funcionaria mas seria 280+ linhas
// - PNG completo (Roleta) nao serve por premios dinamicos via SQL
// - HIBRIDO resolve tudo: visual AAA do PNG + numeros vetoriais perfeitos do SVG
//
// SHUFFLE VISUAL (estudo Roleta cita CSS Wheel jamesrwilliams.ca):
// "Shuffle visual das fatias para aparencia aleatoria"
// 1000 vai no segment vermelho 6h (oposto ao ponteiro)
// Mystery (?) adjacente ao 1000 (cria tensao visual)
// Valores 50/100 espalhados sem repetir adjacente

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";

// ============================================================
// PALETA (mood Casino Luxury)
// ============================================================
const GOLD = {
  primary: "#D4A843",
  light: "#FFD700",
  dark: "#8B6914",
  glow: "rgba(212,168,67,0.6)",
};

// ============================================================
// ASSETS — PNGs
// ============================================================
// IMPORTANTE: BC vai trocar wheel-base.png pelo novo PNG da Roda da Fortuna
// gerado via Ideogram (eixo perfeito validado em 30/04/2026).
const WHEEL_BASE_PNG = "/assets/games/daily-free/wheel-base.png";
const WHEEL_POINTER_PNG = "/assets/games/daily-free/icons/wheel-pointer.png";

// ============================================================
// TYPES
// ============================================================
export interface WheelSegment {
  id: number;
  tier: "common" | "good" | "big" | "mystery";
  min: number;
  max: number;
  weight: number;
  icon: string;
}

export interface WheelComponentProps {
  segments: WheelSegment[];
  winningSegmentId: number | null;
  onSpinComplete: () => void;
  size?: string;
}

// ============================================================
// SHUFFLE VISUAL — ordem dos premios na roda (NAO E ordem do SQL)
// Decisao 30/04/2026: 1000 no segment vermelho da 6h, Mystery adjacente
// ============================================================
// VISUAL_ORDER[i] = id do segment do SQL que vai aparecer na posicao visual i
// Posicoes visuais: 0=12h, 1=1h, 2=2h, ..., 11=11h (clockwise)
//
// Mapeamento: posicao visual -> valor desejado -> id do SQL com esse valor
// SQL tem: 5x "50 GC", 4x "100 GC", 1x "200 GC", 1x "500 GC", 1x "1000 GC", 1x "?"
//
// IDs SQL com 50 GC: 1, 3, 6, 10
// IDs SQL com 100 GC: 2, 5, 8, 11
// IDs SQL com 200 GC: 4
// IDs SQL com 500 GC: 7
// IDs SQL com 1000 GC: 9
// IDs SQL Mystery: 12
const VISUAL_ORDER: number[] = [
  2,   // pos 0  (12h, PRETO)    -> 100  -> SQL id 2
  1,   // pos 1  (1h,  VERDE)    -> 50   -> SQL id 1
  3,   // pos 2  (2h,  PRETO)    -> 50   -> SQL id 3
  4,   // pos 3  (3h,  VERDE)    -> 200  -> SQL id 4
  5,   // pos 4  (4h,  PRETO)    -> 100  -> SQL id 5
  7,   // pos 5  (5h,  VERDE)    -> 500  -> SQL id 7
  9,   // pos 6  (6h,  VERMELHO) -> 1000 -> SQL id 9 (PREMIO MAXIMO)
  12,  // pos 7  (7h,  VERDE)    -> ?    -> SQL id 12 (MYSTERY)
  8,   // pos 8  (8h,  PRETO)    -> 100  -> SQL id 8
  6,   // pos 9  (9h,  VERDE)    -> 50   -> SQL id 6
  10,  // pos 10 (10h, PRETO)    -> 50   -> SQL id 10
  11,  // pos 11 (11h, VERDE)    -> 100  -> SQL id 11
];

// Inverso: dado um id SQL, qual posicao visual ele ocupa?
const SQL_ID_TO_VISUAL_POS: Record<number, number> = {};
VISUAL_ORDER.forEach((sqlId, visualPos) => {
  SQL_ID_TO_VISUAL_POS[sqlId] = visualPos;
});

// ============================================================
// GEOMETRIA SVG (viewBox 100x100)
// ============================================================
const VB = 100;
const CENTER = VB / 2;
// FIX 30/04/2026: numeros subiram de 27 para 31 (BC: "subir eles, mais perto
// da moldura"). Wedges vao de raio ~17 (hub) a ~38 (moldura interna), entao
// 31 fica perto da borda externa do wedge mas ainda com 7 unidades de respiro
// pra nao colidir com a moldura PNG. fontSize mantido (BC: "estao grandes",
// nao reduzir).
const RADIUS_TEXT = 31;     // mais perto da moldura externa (era 27)
const RADIUS_PINS = 43;     // pinos visiveis no PNG ficam por aqui (medido empiricamente)
const PIN_COUNT = 8;        // PNG tem 8 pinos visiveis (medido na imagem)
const SEGMENT_COUNT = 12;   // 12 segments (30deg cada)
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT; // 30deg

function wedgeCenterAngle(visualPos: number): number {
  // visualPos 0 = 12h (topo) = -90deg em math; clockwise => +30deg por posicao
  return -90 + visualPos * SEGMENT_ANGLE;
}

function polarToCartesian(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

// ============================================================
// LABELS
// ============================================================
function getSegmentLabel(seg: WheelSegment): string {
  if (seg.tier === "mystery") return "?";
  if (seg.min === seg.max) return String(seg.min);
  return "?";
}

// ============================================================
// COR DO BRILHO DOS PINOS (gradient circular ouro <-> esmeralda)
// ============================================================
// BC: "Todas (gradient circular: dourado→esmeralda→dourado conforme gira)"
// Pino 0 (topo) = dourado puro
// Pino 2 (3h) = esmeralda puro
// Pino 4 (6h) = dourado puro
// Pino 6 (9h) = esmeralda puro
// Diagonais = mistura proporcional (sin de 2*angle = oscilacao)
function getPinColor(pinIndex: number): { glow: string; glowSoft: string } {
  const angleDeg = pinIndex * 45;
  // sin(2*angle) gera 4 transicoes em 360deg (ouro/esmeralda/ouro/esmeralda)
  const wave = (Math.sin((angleDeg * 2 * Math.PI) / 180) + 1) / 2; // 0..1

  // GOLD light:    255, 215, 0
  // EMERALD light: 0,   230, 118
  const r = Math.round(255 * (1 - wave) + 0 * wave);
  const g = Math.round(215 * (1 - wave) + 230 * wave);
  const b = Math.round(0 * (1 - wave) + 118 * wave);

  return {
    glow:     `rgba(${r},${g},${b},0.85)`,
    glowSoft: `rgba(${r},${g},${b},0.4)`,
  };
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function WheelComponent({
  segments,
  winningSegmentId,
  onSpinComplete,
  size = "clamp(340px, 40vw, 540px)",
}: WheelComponentProps) {
  // Mapeia segments do SQL pelas posicoes visuais (shuffle)
  const orderedSegments: WheelSegment[] = useMemo(() => {
    return VISUAL_ORDER.map(sqlId => {
      const seg = segments.find(s => s.id === sqlId);
      return seg ?? segments[0];
    });
  }, [segments]);

  const controls = useAnimation();
  // FIX 30/04/2026: Lock SINCRONO via ref pra resolver "precisa apertar 2x".
  // useState e ASSINCRONO (set agendado pro proximo render), entao a primeira
  // chamada do useEffect via ainda isSpinning=false na clausura, mas a SEGUNDA
  // checagem do useCallback recriado tambem via false porque o set so processa
  // depois. Resultado: primeira chamada nao "agarrava" o lock corretamente.
  // useRef.current e SINCRONO — set imediato, leitura imediata. Resolve.
  // Mantenho useState pra UI (bounce do ponteiro depende dele renderizar).
  const isSpinningRef = useRef(false);
  const [isSpinning, setIsSpinning] = useState(false);

  // Ref pro callback estavel (resolveu issue de "Volte amanha" precoce no fix-1)
  const onSpinCompleteRef = useRef(onSpinComplete);
  useEffect(() => {
    onSpinCompleteRef.current = onSpinComplete;
  }, [onSpinComplete]);

  // ============================================================
  // SPIN: quando winningSegmentId chega, anima rotacao ate parar nele
  // ============================================================
  const startSpin = useCallback(async (sqlId: number) => {
    // Lock sincrono via ref (set imediato, sem aguardar re-render)
    if (isSpinningRef.current) return;
    isSpinningRef.current = true;
    setIsSpinning(true);

    const visualPos = SQL_ID_TO_VISUAL_POS[sqlId] ?? 0;
    const wedgeAngleDeg = wedgeCenterAngle(visualPos);
    // Pra parar com o wedge no topo (-90deg), rotaciona a roda em -90 - wedgeAngle
    const targetRotation = -90 - wedgeAngleDeg;
    // Adiciona 5 voltas completas pra dar sensacao de spin
    const finalRotation = 360 * 5 + targetRotation;

    await controls.start({
      rotate: finalRotation,
      transition: {
        duration: 4.5,
        ease: [0.22, 1, 0.36, 1], // EaseOutQuart Apple-feel
      },
    });

    isSpinningRef.current = false;
    setIsSpinning(false);
    onSpinCompleteRef.current();
  }, [controls]); // dep array sem isSpinning — useCallback nao recria a cada spin

  useEffect(() => {
    if (winningSegmentId != null && !isSpinningRef.current) {
      startSpin(winningSegmentId);
    }
    // startSpin e estavel agora (so deps de controls), entao incluir nao causa loop
  }, [winningSegmentId, startSpin]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div
      style={{
        position: "relative",
        width: size,
        aspectRatio: "1",
        margin: "0 auto",
        filter: `drop-shadow(0 12px 32px rgba(0,0,0,0.6))`,
      }}
    >
      {/* ============== CAMADA 2: PNG da roda (FIXO) ============== */}
      {/*
        O PNG ja inclui o hub central polido (BC pediu vazio, sem logo BC).
        Nao precisa Camada 1 separada — a propria imagem cobre desde a moldura
        externa ate o hub central, com fundo transparente nas areas vazias.
      */}
      <img
        src={WHEEL_BASE_PNG}
        alt=""
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          zIndex: 2,
          pointerEvents: "none",
          userSelect: "none",
        }}
        draggable={false}
      />

      {/* ============== CAMADAS 3 + 4: SVG overlay rotativo ============== */}
      <motion.svg
        viewBox={`0 0 ${VB} ${VB}`}
        animate={controls}
        initial={{ rotate: 0 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 3,
          pointerEvents: "none",
          // CRITICO: rotacao em torno do centro exato do SVG
          transformOrigin: "50% 50%",
        }}
      >
        <defs>
          {/* Glow forte pros pinos pulsando */}
          <filter id="pin-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Glow sutil pro texto */}
          <filter id="text-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ============== CAMADA 4: Iluminacao dos 8 pinos ============== */}
        {/*
          Pulse alternado: pinos PARES (0,2,4,6) acendem em uma fase,
          pinos IMPARES (1,3,5,7) na fase oposta. Cada pino tem cor propria
          (gradient circular gold<->emerald) baseada na posicao angular.
          Periodo: 1.4s (pulse confortavel, nao distrativo).
        */}
        {Array.from({ length: PIN_COUNT }).map((_, i) => {
          const angleDeg = -90 + i * 45;
          const { x, y } = polarToCartesian(angleDeg, RADIUS_PINS);
          const { glow, glowSoft } = getPinColor(i);
          const isPar = i % 2 === 0;

          return (
            <g key={`pin-${i}`}>
              {/* Halo externo grande (sutil, sempre visivel) */}
              <motion.circle
                cx={x}
                cy={y}
                r={3.2}
                fill={glowSoft}
                animate={{
                  opacity: isPar ? [0.15, 0.5, 0.15] : [0.5, 0.15, 0.5],
                  scale:   isPar ? [1, 1.4, 1]       : [1.4, 1, 1.4],
                }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
              {/* Brilho central (intenso, pulsa forte) */}
              <motion.circle
                cx={x}
                cy={y}
                r={1.4}
                fill={glow}
                filter="url(#pin-glow)"
                animate={{
                  opacity: isPar ? [0.4, 1, 0.4]   : [1, 0.4, 1],
                  scale:   isPar ? [0.8, 1.2, 0.8] : [1.2, 0.8, 1.2],
                }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
            </g>
          );
        })}

        {/* ============== CAMADA 3: Numeros nos wedges ============== */}
        {orderedSegments.map((seg, visualPos) => {
          const angleDeg = wedgeCenterAngle(visualPos);
          const { x, y } = polarToCartesian(angleDeg, RADIUS_TEXT);
          const label = getSegmentLabel(seg);
          const isMystery = seg.tier === "mystery";
          // Rotacao do texto pra ficar legivel "saindo do centro" (radial)
          const textRotation = angleDeg + 90;

          const textColor = isMystery ? GOLD.light : "#FFFFFF";
          const fontSize = isMystery ? 7.5 : 5.5;
          const isHighValue = isMystery || (seg.min >= 500);
          const fontWeight = isHighValue ? 800 : 700;

          return (
            <g
              key={`label-${visualPos}`}
              transform={`translate(${x},${y}) rotate(${textRotation})`}
            >
              <text
                x={0}
                y={0}
                fill={textColor}
                fontSize={fontSize}
                fontWeight={fontWeight}
                fontFamily="'Cinzel', 'Cinzel Decorative', serif"
                textAnchor="middle"
                dominantBaseline="middle"
                filter="url(#text-glow)"
                stroke="rgba(0,0,0,0.6)"
                strokeWidth={isMystery ? 0.4 : 0.3}
                paintOrder="stroke"
                style={{
                  letterSpacing: "0.5px",
                  userSelect: "none",
                }}
              >
                {label}
              </text>
            </g>
          );
        })}
      </motion.svg>

      {/* ============== CAMADA 5: Ponteiro PNG no topo (FIXO) ============== */}
      {/*
        FIX 30/04/2026: BC reportou ponteiro deslocado pra DIREITA.
        Causa raiz: motion.div com animate y + transform translateX(-50%)
        misturados podem deixar o navegador aplicar transforms em ordem
        ambigua (Framer Motion as vezes sobrescreve transform inline).

        Solucao: 2 camadas. Wrapper externo (div estatico) cuida de
        POSICIONAMENTO HORIZONTAL com translateX(-50%). motion.div interno
        cuida APENAS da animacao Y do bounce. Concerns separados.

        E o offset compensador (-1.5% da largura da roda) corrige o
        descentralizacao visual reportado por BC. Pode ajustar via CSS var
        --pointer-offset se ainda nao ficar perfeito (ex: -2%, -1%, 0%).
      */}
      <div
        style={{
          position: "absolute",
          top: "-4%",
          left: "50%",
          // Wrapper centraliza horizontalmente. -50% (centra o BBox) + offset
          // compensador (-1.5% padrao, ajustavel via CSS var)
          transform: `translateX(calc(-50% + var(--pointer-offset, -1.5%)))`,
          width: "14%",
          aspectRatio: "1",
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        <motion.div
          animate={{
            y: isSpinning ? [0, -2, 0] : 0,
          }}
          transition={{
            duration: 0.08,
            repeat: isSpinning ? Infinity : 0,
            ease: "easeInOut",
          }}
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <img
            src={WHEEL_POINTER_PNG}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              filter: [
                "drop-shadow(0 4px 8px rgba(0,0,0,0.7))",
                `drop-shadow(0 0 14px ${GOLD.glow})`,
              ].join(" "),
              userSelect: "none",
            }}
            draggable={false}
          />
        </motion.div>
      </div>
    </div>
  );
}
