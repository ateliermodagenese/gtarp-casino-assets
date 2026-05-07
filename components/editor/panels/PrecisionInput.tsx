"use client";

/**
 * PrecisionInput.tsx
 *
 * EM PALAVRAS SIMPLES: input numerico com setinhas. Setas normais
 * mexem 0.1, Shift mexe 1, Ctrl mexe 0.01 (milimetrico). Mesmo
 * funciona com setas do teclado quando o input ta focado.
 *
 * TECNICAMENTE: input controlado com botoes de incremento. Detecta
 * Shift e Ctrl pra ajustar o step. Aplica clamp se min/max passados.
 * Faz round pra evitar float drift acumulado.
 */
import { useEffect, useRef, useState } from "react";

interface Props {
  /** Valor atual */
  value: number;
  /** Callback quando muda */
  onChange: (v: number) => void;
  /** Label antes do input */
  label?: string;
  /** Sufixo apos o input (% / ° / px) */
  suffix?: string;
  /** Step normal (default 0.1) */
  step?: number;
  /** Step grosseiro (Shift, default 1) */
  shiftStep?: number;
  /** Step milimetrico (Ctrl, default 0.01) */
  ctrlStep?: number;
  /** Limite minimo */
  min?: number;
  /** Limite maximo */
  max?: number;
  /** Casas decimais pra round (default 3) */
  decimals?: number;
  /** Disabled (multi-select com valores diferentes mostra "—") */
  mixed?: boolean;
}

export default function PrecisionInput({
  value,
  onChange,
  label,
  suffix,
  step = 0.1,
  shiftStep = 1,
  ctrlStep = 0.01,
  min,
  max,
  decimals = 3,
  mixed = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string>(mixed ? "—" : String(value));

  // Sincroniza draft quando value muda externamente (drag no canvas, undo)
  useEffect(() => {
    if (!mixed && document.activeElement !== inputRef.current) {
      setDraft(String(round(value, decimals)));
    }
    if (mixed) setDraft("—");
  }, [value, mixed, decimals]);

  const apply = (newValue: number) => {
    let v = round(newValue, decimals);
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    setDraft(String(v));
    onChange(v);
  };

  const getStep = (e: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }) => {
    if (e.ctrlKey || e.metaKey) return ctrlStep;
    if (e.shiftKey) return shiftStep;
    return step;
  };

  const handleArrowKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      apply((mixed ? 0 : value) + getStep(e));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      apply((mixed ? 0 : value) - getStep(e));
    } else if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(draft.replace(",", "."));
    if (Number.isFinite(parsed)) {
      apply(parsed);
    } else {
      // Reverte pro valor atual
      setDraft(mixed ? "—" : String(round(value, decimals)));
    }
  };

  const handleStepClick = (
    direction: 1 | -1,
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    apply((mixed ? 0 : value) + direction * getStep(e));
  };

  return (
    <div style={wrapStyle}>
      {label && <span style={labelStyle}>{label}</span>}
      <div style={fieldStyle}>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleArrowKey}
          onFocus={(e) => e.target.select()}
          style={inputStyle}
          inputMode="decimal"
        />
        {suffix && <span style={suffixStyle}>{suffix}</span>}
        <div style={btnColumnStyle}>
          <button
            onClick={(e) => handleStepClick(1, e)}
            onMouseDown={(e) => e.preventDefault()}
            style={stepBtnStyle}
            title="↑ ±0.1 · Shift ±1 · Ctrl ±0.01"
            tabIndex={-1}
          >
            ▲
          </button>
          <button
            onClick={(e) => handleStepClick(-1, e)}
            onMouseDown={(e) => e.preventDefault()}
            style={stepBtnStyle}
            title="↓ ±0.1 · Shift ±1 · Ctrl ±0.01"
            tabIndex={-1}
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

const wrapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  flex: 1,
  minWidth: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#8a8a8a",
  letterSpacing: 0.5,
  textTransform: "uppercase",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  background: "#0a0806",
  border: "1px solid rgba(212,168,67,0.2)",
  borderRadius: 3,
  height: 24,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  color: "#e5e5e5",
  fontSize: 12,
  padding: "0 6px",
  fontFamily: "ui-monospace, monospace",
  width: "100%",
  minWidth: 0,
  outline: "none",
};

const suffixStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#5a5a5a",
  alignSelf: "center",
  paddingRight: 6,
  fontFamily: "ui-monospace, monospace",
};

const btnColumnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  borderLeft: "1px solid rgba(212,168,67,0.15)",
};

const stepBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#8a8a8a",
  cursor: "pointer",
  fontSize: 7,
  width: 16,
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  fontFamily: "inherit",
};
