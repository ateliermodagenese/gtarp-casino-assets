"use client";

/**
 * EffectsPanel.tsx
 *
 * Painel de presets de efeitos visuais. Cada preset aplica CSS
 * no elemento selecionado com 1 click. Cor editavel em todos.
 *
 * Categorias: Glow, Borda Animada, Glass, Texto, Animacao
 */
import { useState, useCallback } from "react";
import type { DomElementInfo } from "../IframeEditor";

interface Props {
  selected: DomElementInfo | null;
  pushUndo: () => void;
}

interface Preset {
  id: string;
  name: string;
  category: string;
  apply: (el: HTMLElement, color: string) => void;
  remove: (el: HTMLElement) => void;
  needsKeyframes?: string;
}

/** Hex pra rgba com alpha */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Injetar @keyframes no iframe (se nao existir) */
function injectKeyframes(el: HTMLElement, name: string, css: string) {
  const doc = el.ownerDocument;
  if (doc.getElementById(`ed-kf-${name}`)) return;
  const style = doc.createElement("style");
  style.id = `ed-kf-${name}`;
  style.textContent = css;
  doc.head.appendChild(style);
}

// ===== PRESETS =====

const PRESETS: Preset[] = [
  // --- GLOW ---
  {
    id: "glow-casino",
    name: "Glow Casino",
    category: "glow",
    apply: (el, c) => {
      el.style.boxShadow = `0 0 10px ${hexToRgba(c, 0.5)}, 0 0 20px ${hexToRgba(c, 0.3)}, 0 0 40px ${hexToRgba(c, 0.15)}`;
    },
    remove: (el) => { el.style.boxShadow = ""; },
  },
  {
    id: "neon-pulse",
    name: "Neon Pulse",
    category: "glow",
    apply: (el, c) => {
      injectKeyframes(el, "neonPulse", `
        @keyframes edNeonPulse {
          0%, 100% { box-shadow: 0 0 10px ${hexToRgba(c, 0.6)}, 0 0 20px ${hexToRgba(c, 0.4)}, 0 0 40px ${hexToRgba(c, 0.2)}; }
          50% { box-shadow: 0 0 20px ${hexToRgba(c, 0.8)}, 0 0 40px ${hexToRgba(c, 0.5)}, 0 0 80px ${hexToRgba(c, 0.3)}; }
        }
      `);
      el.style.animation = "edNeonPulse 2s ease-in-out infinite";
    },
    remove: (el) => { el.style.animation = ""; el.style.boxShadow = ""; },
  },
  {
    id: "soft-shadow",
    name: "Soft Shadow",
    category: "glow",
    apply: (el) => {
      el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)";
    },
    remove: (el) => { el.style.boxShadow = ""; },
  },
  {
    id: "inner-glow",
    name: "Inner Glow",
    category: "glow",
    apply: (el, c) => {
      el.style.boxShadow = `inset 0 0 20px ${hexToRgba(c, 0.4)}, inset 0 0 40px ${hexToRgba(c, 0.15)}`;
    },
    remove: (el) => { el.style.boxShadow = ""; },
  },
  {
    id: "multi-layer",
    name: "Multi Layer",
    category: "glow",
    apply: (el, c) => {
      el.style.boxShadow = `inset 0 0 15px ${hexToRgba(c, 0.2)}, 0 0 15px ${hexToRgba(c, 0.4)}, 0 0 40px ${hexToRgba(c, 0.15)}`;
    },
    remove: (el) => { el.style.boxShadow = ""; },
  },

  // --- BORDA ANIMADA ---
  {
    id: "beam-gold",
    name: "Feixo Dourado",
    category: "borda",
    apply: (el, c) => {
      injectKeyframes(el, "borderSpin", `
        @property --ed-border-angle { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
        @keyframes edBorderSpin { from { --ed-border-angle: 0deg; } to { --ed-border-angle: 360deg; } }
      `);
      el.style.border = "none";
      el.style.outline = `2px solid ${hexToRgba(c, 0.4)}`;
      el.style.boxShadow = `0 0 15px ${hexToRgba(c, 0.2)}, inset 0 0 15px ${hexToRgba(c, 0.05)}`;
      el.style.animation = "edBorderSpin 4s linear infinite";
    },
    remove: (el) => { el.style.border = ""; el.style.outline = ""; el.style.boxShadow = ""; el.style.animation = ""; },
  },
  {
    id: "pulsar-border",
    name: "Pulsar Border",
    category: "borda",
    apply: (el, c) => {
      injectKeyframes(el, "pulsarBorder", `
        @keyframes edPulsarBorder {
          0%, 100% { outline-color: ${hexToRgba(c, 0.8)}; box-shadow: 0 0 8px ${hexToRgba(c, 0.3)}; }
          50% { outline-color: ${hexToRgba(c, 0.2)}; box-shadow: 0 0 2px ${hexToRgba(c, 0.1)}; }
        }
      `);
      el.style.outline = `2px solid ${c}`;
      el.style.animation = "edPulsarBorder 2s ease-in-out infinite";
    },
    remove: (el) => { el.style.outline = ""; el.style.animation = ""; el.style.boxShadow = ""; },
  },

  // --- GLASS ---
  {
    id: "glassmorphism",
    name: "Glassmorphism",
    category: "glass",
    apply: (el) => {
      el.style.backdropFilter = "blur(12px) saturate(1.2)";
      el.style.background = "rgba(255,255,255,0.05)";
      el.style.border = "1px solid rgba(255,255,255,0.1)";
    },
    remove: (el) => { el.style.backdropFilter = ""; el.style.background = ""; el.style.border = ""; },
  },
  {
    id: "dark-glass",
    name: "Dark Glass",
    category: "glass",
    apply: (el) => {
      el.style.backdropFilter = "blur(8px)";
      el.style.background = "rgba(0,0,0,0.6)";
      el.style.border = "1px solid rgba(255,255,255,0.08)";
    },
    remove: (el) => { el.style.backdropFilter = ""; el.style.background = ""; el.style.border = ""; },
  },
  {
    id: "frosted",
    name: "Frosted",
    category: "glass",
    apply: (el) => {
      el.style.backdropFilter = "blur(20px) saturate(1.5)";
      el.style.background = "rgba(255,255,255,0.02)";
    },
    remove: (el) => { el.style.backdropFilter = ""; el.style.background = ""; },
  },

  // --- TEXTO ---
  {
    id: "neon-text",
    name: "Neon Text",
    category: "texto",
    apply: (el, c) => {
      el.style.textShadow = `0 0 7px ${c}, 0 0 10px ${c}, 0 0 21px ${c}, 0 0 42px ${hexToRgba(c, 0.8)}`;
    },
    remove: (el) => { el.style.textShadow = ""; },
  },
  {
    id: "gold-emboss",
    name: "Gold Emboss",
    category: "texto",
    apply: (el, c) => {
      el.style.textShadow = `1px 1px 0 ${hexToRgba(c, 0.8)}, 2px 2px 0 ${hexToRgba(c, 0.4)}, 0 0 10px ${hexToRgba(c, 0.2)}`;
    },
    remove: (el) => { el.style.textShadow = ""; },
  },
  {
    id: "outline-text",
    name: "Outline",
    category: "texto",
    apply: (el, c) => {
      (el.style as Record<string, string>)["-webkit-text-stroke"] = `1px ${c}`;
    },
    remove: (el) => { (el.style as Record<string, string>)["-webkit-text-stroke"] = ""; },
  },

  // --- ANIMACAO ---
  {
    id: "pulse",
    name: "Pulse",
    category: "animacao",
    apply: (el) => {
      injectKeyframes(el, "edPulse", `
        @keyframes edPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      `);
      el.style.animation = "edPulse 2s ease-in-out infinite";
    },
    remove: (el) => { el.style.animation = ""; },
  },
  {
    id: "float",
    name: "Float",
    category: "animacao",
    apply: (el) => {
      injectKeyframes(el, "edFloat", `
        @keyframes edFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `);
      el.style.animation = "edFloat 3s ease-in-out infinite";
    },
    remove: (el) => { el.style.animation = ""; },
  },
  {
    id: "flicker",
    name: "Flicker (Neon)",
    category: "animacao",
    apply: (el) => {
      injectKeyframes(el, "edFlicker", `
        @keyframes edFlicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
          20%, 24%, 55% { opacity: 0.4; }
        }
      `);
      el.style.animation = "edFlicker 3s linear infinite";
    },
    remove: (el) => { el.style.animation = ""; },
  },
  {
    id: "glow-breathe",
    name: "Glow Breathe",
    category: "animacao",
    apply: (el, c) => {
      injectKeyframes(el, "edGlowBreathe", `
        @keyframes edGlowBreathe {
          0%, 100% { box-shadow: 0 0 10px ${hexToRgba(c, 0.3)}; }
          50% { box-shadow: 0 0 30px ${hexToRgba(c, 0.6)}, 0 0 60px ${hexToRgba(c, 0.2)}; }
        }
      `);
      el.style.animation = "edGlowBreathe 3s ease-in-out infinite";
    },
    remove: (el) => { el.style.animation = ""; el.style.boxShadow = ""; },
  },
  {
    id: "spin-slow",
    name: "Spin Lento",
    category: "animacao",
    apply: (el) => {
      injectKeyframes(el, "edSpinSlow", `
        @keyframes edSpinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `);
      el.style.animation = "edSpinSlow 20s linear infinite";
    },
    remove: (el) => { el.style.animation = ""; },
  },
];

const CATEGORIES = [
  { id: "glow", label: "GLOW / SHADOW", icon: "✦" },
  { id: "borda", label: "BORDA ANIMADA", icon: "◇" },
  { id: "glass", label: "GLASS / MATERIAL", icon: "◻" },
  { id: "texto", label: "TEXTO", icon: "A" },
  { id: "animacao", label: "ANIMACAO", icon: "▷" },
];

export default function EffectsPanel({ selected, pushUndo }: Props) {
  const [color, setColor] = useState("#D4A843");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [expandedCat, setExpandedCat] = useState<string>("glow");

  const applyPreset = useCallback((preset: Preset) => {
    if (!selected) return;
    pushUndo();
    // Remover preset anterior se houver
    if (activePreset) {
      const prev = PRESETS.find((p) => p.id === activePreset);
      if (prev) prev.remove(selected.element);
    }
    preset.apply(selected.element, color);
    setActivePreset(preset.id);
  }, [selected, color, activePreset, pushUndo]);

  const removeEffect = useCallback(() => {
    if (!selected || !activePreset) return;
    pushUndo();
    const preset = PRESETS.find((p) => p.id === activePreset);
    if (preset) preset.remove(selected.element);
    setActivePreset(null);
  }, [selected, activePreset, pushUndo]);

  if (!selected) return null;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span>EFEITOS RAPIDOS</span>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={colorPickerStyle}
          title="Cor base dos efeitos"
        />
      </div>

      {activePreset && (
        <button onClick={removeEffect} style={removeBtnStyle}>
          ✕ Remover efeito ({PRESETS.find((p) => p.id === activePreset)?.name})
        </button>
      )}

      {CATEGORIES.map((cat) => {
        const catPresets = PRESETS.filter((p) => p.category === cat.id);
        const isOpen = expandedCat === cat.id;
        return (
          <div key={cat.id}>
            <button
              onClick={() => setExpandedCat(isOpen ? "" : cat.id)}
              style={catHeaderStyle}
            >
              <span style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.15s", display: "inline-block", fontSize: 9 }}>▶</span>
              <span>{cat.icon} {cat.label}</span>
              <span style={{ marginLeft: "auto", fontSize: 9, color: "#5a5a5a" }}>{catPresets.length}</span>
            </button>
            {isOpen && (
              <div style={catBodyStyle}>
                {catPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    style={{
                      ...presetBtnStyle,
                      borderColor: activePreset === preset.id ? color : "rgba(212,168,67,0.15)",
                      background: activePreset === preset.id ? "rgba(212,168,67,0.1)" : "transparent",
                    }}
                    title={`Aplicar ${preset.name} com cor ${color}`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  padding: "8px 4px",
  borderTop: "1px solid rgba(212,168,67,0.1)",
  marginTop: 4,
};
const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "4px 6px",
  fontSize: 10,
  fontWeight: 700,
  color: "#D4A843",
  letterSpacing: 0.8,
};
const colorPickerStyle: React.CSSProperties = {
  width: 24,
  height: 20,
  border: "1px solid rgba(212,168,67,0.3)",
  borderRadius: 3,
  background: "transparent",
  cursor: "pointer",
  padding: 0,
};
const removeBtnStyle: React.CSSProperties = {
  padding: "4px 8px",
  background: "rgba(255,68,68,0.1)",
  border: "1px solid rgba(255,68,68,0.3)",
  borderRadius: 4,
  color: "#FF6B6B",
  fontSize: 10,
  cursor: "pointer",
  fontFamily: "inherit",
  margin: "2px 4px",
};
const catHeaderStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 6px",
  background: "rgba(212,168,67,0.04)",
  border: "none",
  borderRadius: 3,
  color: "#D4A843",
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: 0.5,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "left",
};
const catBodyStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  padding: "4px 6px 8px",
};
const presetBtnStyle: React.CSSProperties = {
  padding: "4px 8px",
  border: "1px solid rgba(212,168,67,0.15)",
  borderRadius: 4,
  background: "transparent",
  color: "#ccc",
  fontSize: 10,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "all 0.15s",
};
