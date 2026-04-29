"use client";

import { useCallback, useRef } from "react";

// ===========================================================================
// CRASH SOUND MANAGER — Web Audio API procedural para o jogo Crash
// Zero dependencias externas. Sons gerados proceduralmente.
// ===========================================================================

export function useCrashSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const risingOscRef = useRef<OscillatorNode | null>(null);
  const risingGainRef = useRef<GainNode | null>(null);

  // Lazy init do AudioContext
  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // Som generico
  const playTone = useCallback(
    (freq: number, durMs: number, volume: number, type: OscillatorType = "sine") => {
      try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durMs / 1000);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + durMs / 1000);
      } catch {
        // Silence AudioContext errors
      }
    },
    [getCtx]
  );

  // ========================================================================
  // SONS DO CRASH
  // ========================================================================

  // Click generico
  const playClick = useCallback(() => {
    playTone(800, 60, 0.06, "sine");
  }, [playTone]);

  // Countdown tick
  const playCountdown = useCallback(() => {
    playTone(600, 100, 0.05, "sine");
  }, [playTone]);

  // Aposta colocada
  const playBet = useCallback(() => {
    playTone(523, 80, 0.07, "sine"); // Do
    setTimeout(() => playTone(659, 80, 0.06, "sine"), 50); // Mi
  }, [playTone]);

  // Iniciar tom ascendente (durante RISING)
  const startRisingTone = useCallback(() => {
    try {
      const ctx = getCtx();
      
      // Parar tom anterior se existir
      if (risingOscRef.current) {
        risingOscRef.current.stop();
        risingOscRef.current.disconnect();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(200, ctx.currentTime); // Comeca em 200Hz
      gain.gain.setValueAtTime(0.04, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);

      risingOscRef.current = osc;
      risingGainRef.current = gain;
    } catch {
      // Silence errors
    }
  }, [getCtx]);

  // Atualizar frequencia do tom ascendente baseado no multiplicador
  const updateRisingTone = useCallback((multiplier: number) => {
    try {
      if (!risingOscRef.current || !ctxRef.current) return;

      // Frequencia: 200Hz -> 2000Hz proporcional ao log(multiplicador)
      // log(1) = 0 -> 200Hz
      // log(10) = 2.3 -> ~700Hz
      // log(100) = 4.6 -> ~1400Hz
      const minFreq = 200;
      const maxFreq = 2000;
      const logMult = Math.log(Math.max(1, multiplier));
      const freq = Math.min(maxFreq, minFreq + (logMult / 5) * (maxFreq - minFreq));

      risingOscRef.current.frequency.setValueAtTime(freq, ctxRef.current.currentTime);
    } catch {
      // Silence errors
    }
  }, []);

  // Parar tom ascendente
  const stopRisingTone = useCallback(() => {
    try {
      if (risingGainRef.current && ctxRef.current) {
        risingGainRef.current.gain.exponentialRampToValueAtTime(
          0.001,
          ctxRef.current.currentTime + 0.1
        );
      }
      if (risingOscRef.current) {
        setTimeout(() => {
          risingOscRef.current?.stop();
          risingOscRef.current?.disconnect();
          risingOscRef.current = null;
          risingGainRef.current = null;
        }, 150);
      }
    } catch {
      // Silence errors
    }
  }, []);

  // Som de cashout (sucesso)
  const playCashout = useCallback(() => {
    // Acorde ascendente (Do-Mi-Sol)
    playTone(523, 120, 0.08, "sine");
    setTimeout(() => playTone(659, 120, 0.07, "sine"), 60);
    setTimeout(() => playTone(784, 150, 0.06, "sine"), 120);
    setTimeout(() => playTone(1047, 200, 0.05, "sine"), 180);
  }, [playTone]);

  // Som de crash (explosao)
  const playCrash = useCallback(() => {
    try {
      const ctx = getCtx();

      // Ruido de explosao
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(ctx.currentTime);

      // Tom descendente
      playTone(300, 200, 0.1, "sawtooth");
      setTimeout(() => playTone(150, 150, 0.08, "sawtooth"), 50);
      setTimeout(() => playTone(80, 150, 0.06, "sawtooth"), 100);
    } catch {
      // Silence errors
    }
  }, [getCtx, playTone]);

  // Som de perda
  const playLose = useCallback(() => {
    playTone(200, 300, 0.08, "square");
    setTimeout(() => playTone(150, 200, 0.06, "square"), 100);
  }, [playTone]);

  // Som de milestone (2x, 5x, 10x+)
  const playMilestone = useCallback((level: number) => {
    if (level <= 2) {
      playTone(1200, 80, 0.06, "sine");
    } else if (level <= 5) {
      playTone(1200, 80, 0.06, "sine");
      setTimeout(() => playTone(1600, 80, 0.05, "sine"), 60);
    } else {
      playTone(800, 60, 0.07, "sine");
      setTimeout(() => playTone(1000, 60, 0.06, "sine"), 50);
      setTimeout(() => playTone(1200, 80, 0.05, "sine"), 100);
    }
  }, [playTone]);

  // Som de big win (>=5x cashout)
  const playBigWin = useCallback(() => {
    playTone(523, 150, 0.08, "sine");
    setTimeout(() => playTone(659, 150, 0.07, "sine"), 120);
    setTimeout(() => playTone(784, 150, 0.06, "sine"), 240);
    setTimeout(() => playTone(1047, 200, 0.08, "sine"), 360);
    setTimeout(() => playTone(1319, 300, 0.06, "sine"), 500);
  }, [playTone]);

  // Som de aposta rejeitada (saldo insuficiente)
  const playBetReject = useCallback(() => {
    playTone(200, 150, 0.08, "square");
  }, [playTone]);

  // Cleanup
  const cleanup = useCallback(() => {
    stopRisingTone();
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
  }, [stopRisingTone]);

  return {
    playClick,
    playCountdown,
    playBet,
    startRisingTone,
    updateRisingTone,
    stopRisingTone,
    playCashout,
    playCrash,
    playLose,
    playMilestone,
    playBigWin,
    playBetReject,
    cleanup,
  };
}
