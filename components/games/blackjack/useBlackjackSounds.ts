// useBlackjackSounds — Web Audio procedural para o Blackjack
// Mesmo padrao do Bicho (useAnimalSounds): osciladores sinteticos,
// sem arquivos MP3, zero dependencias externas.
// 15 eventos sonoros mapeados conforme spec dos 43 docs de estudo.

import { useRef, useCallback } from "react";

export function useBlackjackSounds(enabled: boolean) {
  const ctx = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctx.current) ctx.current = new AudioContext();
    return ctx.current;
  }, []);

  /** Toca um tom simples (freq Hz, duracao seg, tipo onda, volume 0-1) */
  const tone = useCallback(
    (freq: number, dur: number, type: OscillatorType = "sine", vol = 0.15) => {
      if (!enabled) return;
      try {
        const c = getCtx();
        if (c.state === "suspended") c.resume();
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
        osc.connect(gain).connect(c.destination);
        osc.start();
        osc.stop(c.currentTime + dur);
      } catch {
        /* AudioContext indisponivel */
      }
    },
    [enabled, getCtx],
  );

  /** Toca sequencia de tons com delay entre cada */
  const sequence = useCallback(
    (notes: { freq: number; dur: number; type?: OscillatorType; vol?: number }[], gap = 80) => {
      notes.forEach((n, i) =>
        setTimeout(() => tone(n.freq, n.dur, n.type || "sine", n.vol || 0.12), i * gap),
      );
    },
    [tone],
  );

  return {
    // === BETTING (Tela 1) ===

    /** Ficha selecionada no chip tray */
    chipSelect: () => tone(700, 0.1, "sine", 0.08),

    /** Ficha colocada na area de aposta */
    chipPlace: () => tone(500, 0.12, "triangle", 0.1),

    /** Aposta limpa (CLEAR) */
    betClear: () => tone(350, 0.15, "sine", 0.06),

    /** Side bet ativada (PP ou 21+3) */
    sideBetToggle: () => {
      tone(600, 0.08, "sine", 0.08);
      setTimeout(() => tone(800, 0.08, "sine", 0.08), 60);
    },

    /** Botao DEAL pressionado — sequencia ascendente */
    deal: () => sequence([
      { freq: 400, dur: 0.1 },
      { freq: 600, dur: 0.1 },
      { freq: 900, dur: 0.2 },
    ], 60),

    // === CARTAS (distribuicao + flip) ===

    /** Carta saindo do shoe (stagger por index) */
    cardDeal: () => tone(800, 0.08, "sine", 0.06),

    /** Flip do hole card do dealer (reveal dramatico) */
    cardFlip: () => {
      tone(600, 0.15, "triangle", 0.1);
      setTimeout(() => tone(1000, 0.2, "sine", 0.08), 100);
    },

    // === PLAYER TURN (Tela 2) ===

    /** HIT — tom rapido ascendente */
    hit: () => tone(880, 0.12, "sine", 0.1),

    /** STAND — tom grave firme */
    stand: () => tone(440, 0.2, "triangle", 0.08),

    /** DOUBLE DOWN — tom enfatico duplo */
    double: () => {
      tone(660, 0.1, "sine", 0.1);
      setTimeout(() => tone(880, 0.15, "sine", 0.12), 80);
    },

    /** SPLIT — som de separacao (dois tons divergentes) */
    split: () => {
      tone(600, 0.15, "sine", 0.08);
      setTimeout(() => tone(400, 0.15, "sine", 0.08), 100);
      setTimeout(() => tone(800, 0.15, "sine", 0.08), 100);
    },

    /** SURRENDER — tom descendente sutil */
    surrender: () => tone(500, 0.3, "triangle", 0.05),

    // === INSURANCE (Tela 3) ===

    /** Modal de insurance apareceu */
    insurancePrompt: () => {
      tone(600, 0.2, "triangle", 0.08);
      setTimeout(() => tone(500, 0.2, "triangle", 0.08), 150);
    },

    /** Timer de insurance chegou na zona vermelha (<3s) */
    insuranceUrgent: () => tone(1200, 0.08, "sawtooth", 0.04),

    // === RESULTADOS (Tela 6) ===

    /** Vitoria normal (1:1) */
    winNormal: () => sequence([
      { freq: 660, dur: 0.2 },
      { freq: 880, dur: 0.2 },
      { freq: 1100, dur: 0.3 },
    ], 100),

    /** Blackjack natural (3:2) — fanfarra */
    winBlackjack: () => sequence([
      { freq: 523, dur: 0.3, vol: 0.15 },
      { freq: 659, dur: 0.3, vol: 0.15 },
      { freq: 784, dur: 0.3, vol: 0.15 },
      { freq: 1047, dur: 0.4, vol: 0.18 },
      { freq: 1319, dur: 0.5, vol: 0.2 },
    ], 120),

    /** Bust (>21) — tom grave descendente */
    bust: () => tone(250, 0.4, "sawtooth", 0.06),

    /** Push (empate) — tom neutro */
    push: () => tone(440, 0.3, "triangle", 0.05),

    /** Lose (dealer venceu) — tom triste curto */
    lose: () => tone(300, 0.4, "triangle", 0.05),

    // === UI GERAL ===

    /** Hover em elemento interativo */
    hover: () => tone(1000, 0.04, "sine", 0.02),

    /** Copiar texto (PF, historico) */
    copy: () => {
      tone(900, 0.06, "sine", 0.06);
      setTimeout(() => tone(1200, 0.06, "sine", 0.06), 50);
    },

    /** Abrir modal (historico, PF) */
    modalOpen: () => tone(500, 0.15, "triangle", 0.05),

    /** Nova mao (reset) */
    newHand: () => {
      tone(400, 0.1, "sine", 0.06);
      setTimeout(() => tone(600, 0.1, "sine", 0.06), 60);
    },
  };
}
