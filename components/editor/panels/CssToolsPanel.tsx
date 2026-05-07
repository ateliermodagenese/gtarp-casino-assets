"use client";

/**
 * CssToolsPanel.tsx
 *
 * Fase 8 — Copiar CSS + Filtros CSS visuais.
 * 8.1: Botao "Copiar CSS" que copia computed style formatado.
 * 8.2: 7 sliders de filtros CSS com preview em tempo real.
 */
import { useCallback, useEffect, useState } from "react";
import type { DomElementInfo } from "../IframeEditor";

interface CssToolsPanelProps {
  selected: DomElementInfo | null;
  pushUndo: () => void;
}

interface FilterState {
  brightness: number;
  contrast: number;
  saturate: number;
  hueRotate: number;
  blur: number;
  grayscale: number;
  sepia: number;
}

const DEFAULT_FILTERS: FilterState = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  hueRotate: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0,
};

const FILTER_DEFS = [
  { key: "brightness" as const, label: "Brilho", unit: "%", min: 0, max: 300, step: 5 },
  { key: "contrast" as const, label: "Contraste", unit: "%", min: 0, max: 300, step: 5 },
  { key: "saturate" as const, label: "Saturacao", unit: "%", min: 0, max: 300, step: 5 },
  { key: "hueRotate" as const, label: "Matiz", unit: "deg", min: 0, max: 360, step: 5 },
  { key: "blur" as const, label: "Desfoque", unit: "px", min: 0, max: 20, step: 0.5 },
  { key: "grayscale" as const, label: "P&B", unit: "%", min: 0, max: 100, step: 5 },
  { key: "sepia" as const, label: "Sepia", unit: "%", min: 0, max: 100, step: 5 },
];

function filtersToCSS(f: FilterState): string {
  const parts: string[] = [];
  if (f.brightness !== 100) parts.push(`brightness(${f.brightness}%)`);
  if (f.contrast !== 100) parts.push(`contrast(${f.contrast}%)`);
  if (f.saturate !== 100) parts.push(`saturate(${f.saturate}%)`);
  if (f.hueRotate !== 0) parts.push(`hue-rotate(${f.hueRotate}deg)`);
  if (f.blur !== 0) parts.push(`blur(${f.blur}px)`);
  if (f.grayscale !== 0) parts.push(`grayscale(${f.grayscale}%)`);
  if (f.sepia !== 0) parts.push(`sepia(${f.sepia}%)`);
  return parts.join(" ");
}

export default function CssToolsPanel({ selected, pushUndo }: CssToolsPanelProps) {
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });
  const [copied, setCopied] = useState(false);

  // Reset filtros quando troca de elemento
  useEffect(() => {
    setFilters({ ...DEFAULT_FILTERS });
    setCopied(false);
  }, [selected?.editorId]);

  // Ler filtros atuais do elemento
  useEffect(() => {
    if (!selected) return;
    try {
      const current = selected.element.style.filter || "";
      const f = { ...DEFAULT_FILTERS };
      const bMatch = current.match(/brightness\((\d+)%?\)/);
      if (bMatch) f.brightness = parseFloat(bMatch[1]);
      const cMatch = current.match(/contrast\((\d+)%?\)/);
      if (cMatch) f.contrast = parseFloat(cMatch[1]);
      const sMatch = current.match(/saturate\((\d+)%?\)/);
      if (sMatch) f.saturate = parseFloat(sMatch[1]);
      const hMatch = current.match(/hue-rotate\((\d+)deg\)/);
      if (hMatch) f.hueRotate = parseFloat(hMatch[1]);
      const blMatch = current.match(/blur\(([\d.]+)px\)/);
      if (blMatch) f.blur = parseFloat(blMatch[1]);
      const gMatch = current.match(/grayscale\((\d+)%?\)/);
      if (gMatch) f.grayscale = parseFloat(gMatch[1]);
      const spMatch = current.match(/sepia\((\d+)%?\)/);
      if (spMatch) f.sepia = parseFloat(spMatch[1]);
      setFilters(f);
    } catch { /* ignore */ }
  }, [selected?.editorId]);

  const applyFilters = useCallback((newFilters: FilterState) => {
    if (!selected) return;
    pushUndo();
    const css = filtersToCSS(newFilters);
    selected.element.style.filter = css;
    setFilters(newFilters);
  }, [selected, pushUndo]);

  const resetFilters = useCallback(() => {
    if (!selected) return;
    pushUndo();
    selected.element.style.filter = "";
    setFilters({ ...DEFAULT_FILTERS });
  }, [selected, pushUndo]);

  const handleCopyCSS = useCallback(async () => {
    if (!selected) return;
    try {
      const el = selected.element;
      const win = el.ownerDocument.defaultView;
      if (!win) return;
      const computed = win.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      const props: Record<string, string> = {};
      props.position = computed.position;
      props.left = `${Math.round(rect.left)}px`;
      props.top = `${Math.round(rect.top)}px`;
      props.width = `${Math.round(rect.width)}px`;
      props.height = `${Math.round(rect.height)}px`;

      const importantProps = [
        "display", "flexDirection", "alignItems", "justifyContent", "gap",
        "padding", "margin", "background", "backgroundColor", "color",
        "fontSize", "fontWeight", "fontFamily", "lineHeight", "letterSpacing",
        "border", "borderRadius", "boxShadow", "opacity", "transform",
        "filter", "backdropFilter", "zIndex", "overflow",
      ];

      for (const prop of importantProps) {
        const val = computed.getPropertyValue(prop.replace(/([A-Z])/g, "-$1").toLowerCase());
        if (val && val !== "none" && val !== "normal" && val !== "0px" && val !== "rgba(0, 0, 0, 0)") {
          props[prop] = val;
        }
      }

      const formatted = JSON.stringify(props, null, 2);
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      window.dispatchEvent(new CustomEvent("editor:toast", {
        detail: { type: "success", message: "CSS copiado pro clipboard" },
      }));
    } catch {
      window.dispatchEvent(new CustomEvent("editor:toast", {
        detail: { type: "error", message: "Falha ao copiar" },
      }));
    }
  }, [selected]);

  if (!selected) return null;

  const hasActiveFilters = filtersToCSS(filters) !== "";

  return (
    <div style={containerStyle}>
      {/* Copiar CSS */}
      <div style={headerStyle}>
        <span style={{ color: "#D4A843", fontWeight: 700, fontSize: 10, letterSpacing: 0.8 }}>
          CSS TOOLS
        </span>
      </div>

      <div style={bodyStyle}>
        <button onClick={handleCopyCSS} style={copyBtnStyle}>
          {copied ? "Copiado!" : "Copiar CSS"}
        </button>

        {/* Filtros CSS */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ color: "#D4A843", fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>
              FILTROS
            </span>
            {hasActiveFilters && (
              <button onClick={resetFilters} style={resetBtnStyle}>
                Resetar
              </button>
            )}
          </div>

          {FILTER_DEFS.map((def) => (
            <div key={def.key} style={filterRowStyle}>
              <label style={filterLabelStyle}>{def.label}</label>
              <input
                type="range"
                min={def.min}
                max={def.max}
                step={def.step}
                value={filters[def.key]}
                onChange={(e) => {
                  const newVal = parseFloat(e.target.value);
                  applyFilters({ ...filters, [def.key]: newVal });
                }}
                style={sliderStyle}
              />
              <span style={filterValueStyle}>
                {filters[def.key]}{def.unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = { marginTop: 2 };
const headerStyle: React.CSSProperties = {
  padding: "6px 8px",
  background: "rgba(212,168,67,0.06)",
  borderRadius: 4,
};
const bodyStyle: React.CSSProperties = { padding: "6px 8px" };
const copyBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  background: "rgba(100,180,255,0.1)",
  border: "1px solid rgba(100,180,255,0.3)",
  borderRadius: 4,
  color: "#80B4FF",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};
const resetBtnStyle: React.CSSProperties = {
  padding: "2px 6px",
  background: "rgba(255,68,68,0.08)",
  border: "1px solid rgba(255,68,68,0.2)",
  borderRadius: 3,
  color: "#FF6666",
  fontSize: 8,
  cursor: "pointer",
  fontFamily: "inherit",
};
const filterRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "2px 0",
};
const filterLabelStyle: React.CSSProperties = {
  fontSize: 9,
  color: "#8a8a8a",
  minWidth: 52,
};
const sliderStyle: React.CSSProperties = {
  flex: 1,
  height: 3,
  accentColor: "#D4A843",
  cursor: "pointer",
};
const filterValueStyle: React.CSSProperties = {
  fontSize: 9,
  color: "#6a6a6a",
  minWidth: 36,
  textAlign: "right",
  fontFamily: "ui-monospace, monospace",
};
