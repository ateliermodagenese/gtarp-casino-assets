"use client";

/**
 * DomPropsPanel.tsx
 *
 * Painel de propriedades do elemento DOM selecionado no iframe.
 * Le valores via getComputedStyle e aplica mudancas via element.style.
 *
 * Categorias: Posicao, Dimensoes, Transformacao, Tipografia,
 * Cores/Background, Borda, Efeitos (opacity, shadow, blur).
 */
import { useCallback, useEffect, useState } from "react";
import type { DomElementInfo } from "../IframeEditor";
import EffectsPanel from "./EffectsPanel";

interface Props {
  selected: DomElementInfo | null;
}

/** Propriedade editavel */
interface PropDef {
  key: string;
  label: string;
  cssProp: string;
  type: "px" | "deg" | "percent" | "color" | "text" | "select";
  step?: number;
  min?: number;
  max?: number;
  options?: string[];
}

const POSITION_PROPS: PropDef[] = [
  { key: "left", label: "X", cssProp: "left", type: "px", step: 1 },
  { key: "top", label: "Y", cssProp: "top", type: "px", step: 1 },
];

const SIZE_PROPS: PropDef[] = [
  { key: "width", label: "Largura", cssProp: "width", type: "px", step: 1, min: 0 },
  { key: "height", label: "Altura", cssProp: "height", type: "px", step: 1, min: 0 },
  { key: "minWidth", label: "Min W", cssProp: "minWidth", type: "px", step: 1, min: 0 },
  { key: "minHeight", label: "Min H", cssProp: "minHeight", type: "px", step: 1, min: 0 },
  { key: "maxWidth", label: "Max W", cssProp: "maxWidth", type: "px", step: 1, min: 0 },
  { key: "maxHeight", label: "Max H", cssProp: "maxHeight", type: "px", step: 1, min: 0 },
];

const TRANSFORM_PROPS: PropDef[] = [
  { key: "rotate", label: "Rotacao", cssProp: "rotate", type: "deg", step: 1, min: -360, max: 360 },
  { key: "scale", label: "Escala", cssProp: "scale", type: "text", step: 0.01 },
  { key: "opacity", label: "Opacidade", cssProp: "opacity", type: "text", step: 0.05, min: 0, max: 1 },
];

const SPACING_PROPS: PropDef[] = [
  { key: "marginTop", label: "Margin T", cssProp: "marginTop", type: "px", step: 1 },
  { key: "marginRight", label: "Margin R", cssProp: "marginRight", type: "px", step: 1 },
  { key: "marginBottom", label: "Margin B", cssProp: "marginBottom", type: "px", step: 1 },
  { key: "marginLeft", label: "Margin L", cssProp: "marginLeft", type: "px", step: 1 },
  { key: "paddingTop", label: "Padding T", cssProp: "paddingTop", type: "px", step: 1 },
  { key: "paddingRight", label: "Padding R", cssProp: "paddingRight", type: "px", step: 1 },
  { key: "paddingBottom", label: "Padding B", cssProp: "paddingBottom", type: "px", step: 1 },
  { key: "paddingLeft", label: "Padding L", cssProp: "paddingLeft", type: "px", step: 1 },
];

const TYPO_PROPS: PropDef[] = [
  { key: "fontSize", label: "Tamanho", cssProp: "fontSize", type: "px", step: 1, min: 1 },
  { key: "fontWeight", label: "Peso", cssProp: "fontWeight", type: "text" },
  { key: "lineHeight", label: "Entrelinha", cssProp: "lineHeight", type: "px", step: 1 },
  { key: "letterSpacing", label: "Espacamento", cssProp: "letterSpacing", type: "px", step: 0.5 },
  { key: "textAlign", label: "Alinhamento", cssProp: "textAlign", type: "select", options: ["left", "center", "right", "justify"] },
];

const COLOR_PROPS: PropDef[] = [
  { key: "color", label: "Cor texto", cssProp: "color", type: "color" },
  { key: "backgroundColor", label: "Fundo", cssProp: "backgroundColor", type: "color" },
];

const BORDER_PROPS: PropDef[] = [
  { key: "borderRadius", label: "Raio borda", cssProp: "borderRadius", type: "px", step: 1, min: 0 },
  { key: "borderWidth", label: "Espessura", cssProp: "borderWidth", type: "px", step: 1, min: 0 },
  { key: "borderColor", label: "Cor borda", cssProp: "borderColor", type: "color" },
  { key: "borderStyle", label: "Estilo", cssProp: "borderStyle", type: "select", options: ["none", "solid", "dashed", "dotted", "double", "groove"] },
];

const EFFECT_PROPS: PropDef[] = [
  { key: "boxShadow", label: "Sombra", cssProp: "boxShadow", type: "text" },
  { key: "backdropFilter", label: "Blur fundo", cssProp: "backdropFilter", type: "text" },
  { key: "zIndex", label: "Z-Index", cssProp: "zIndex", type: "text" },
];

/** Converte "123px" → 123, "2.5deg" → 2.5, etc */
function parseNum(val: string): number {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

/** Converte rgb(r,g,b) pra #hex */
function rgbToHex(rgb: string): string {
  const match = rgb.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) return rgb.startsWith("#") ? rgb : "#000000";
  const r = parseInt(match[1]).toString(16).padStart(2, "0");
  const g = parseInt(match[2]).toString(16).padStart(2, "0");
  const b = parseInt(match[3]).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

export default function DomPropsPanel({ selected }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    position: true,
    size: true,
    transform: true,
    spacing: false,
    typo: false,
    color: true,
    border: false,
    effect: false,
  });

  // Le propriedades computadas do elemento selecionado
  const readProps = useCallback(() => {
    if (!selected) {
      setValues({});
      return;
    }
    try {
      const el = selected.element;
      const win = el.ownerDocument.defaultView;
      if (!win) return;
      const computed = win.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      const vals: Record<string, string> = {};
      // Posicao: usar rect (mais preciso que computed pra elementos nao-positioned)
      vals.left = `${Math.round(rect.left)}px`;
      vals.top = `${Math.round(rect.top)}px`;
      // Dimensoes
      vals.width = `${Math.round(rect.width)}px`;
      vals.height = `${Math.round(rect.height)}px`;

      // Todas as propriedades
      const allProps = [...SIZE_PROPS, ...TRANSFORM_PROPS, ...SPACING_PROPS, ...TYPO_PROPS, ...COLOR_PROPS, ...BORDER_PROPS, ...EFFECT_PROPS];
      for (const p of allProps) {
        if (vals[p.key]) continue;
        const raw = computed.getPropertyValue(
          p.cssProp.replace(/([A-Z])/g, "-$1").toLowerCase()
        );
        vals[p.key] = raw || "";
      }
      setValues(vals);
    } catch {
      setValues({});
    }
  }, [selected]);

  useEffect(() => {
    readProps();
  }, [readProps]);

  // Aplica uma mudanca no estilo do elemento
  const applyStyle = useCallback((cssProp: string, value: string) => {
    if (!selected) return;
    try {
      // Notificar IframeEditor pra salvar snapshot (undo)
      window.dispatchEvent(new CustomEvent("editor:push-undo", {
        detail: { element: selected.element },
      }));
      (selected.element.style as Record<string, string>)[cssProp] = value;
      readProps();
    } catch { /* ignore */ }
  }, [selected, readProps]);

  if (!selected) {
    return (
      <aside style={panelStyle}>
        <div style={emptyStyle}>
          <p style={{ color: "#D4A843", fontWeight: 600, fontSize: 13 }}>
            Nenhum elemento selecionado
          </p>
          <p style={{ color: "#6a6a6a", fontSize: 11, marginTop: 6 }}>
            Clique num elemento no iframe pra editar propriedades.
          </p>
        </div>
      </aside>
    );
  }

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderInput = (prop: PropDef) => {
    const rawVal = values[prop.key] || "";

    if (prop.type === "color") {
      const hexVal = rgbToHex(rawVal);
      return (
        <div style={rowStyle} key={prop.key}>
          <label style={labelStyle}>{prop.label}</label>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <input
              type="color"
              value={hexVal}
              onChange={(e) => applyStyle(prop.cssProp, e.target.value)}
              style={{ width: 28, height: 22, border: "1px solid rgba(212,168,67,0.3)", borderRadius: 3, background: "transparent", cursor: "pointer", padding: 0 }}
            />
            <input
              type="text"
              value={rawVal}
              onChange={(e) => applyStyle(prop.cssProp, e.target.value)}
              style={textInputStyle}
            />
          </div>
        </div>
      );
    }

    if (prop.type === "select") {
      return (
        <div style={rowStyle} key={prop.key}>
          <label style={labelStyle}>{prop.label}</label>
          <select
            value={rawVal}
            onChange={(e) => applyStyle(prop.cssProp, e.target.value)}
            style={selectInputStyle}
          >
            {prop.options?.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    }

    // px, deg, percent, text — input numerico com +/-
    const numVal = parseNum(rawVal);
    const suffix = prop.type === "px" ? "px" : prop.type === "deg" ? "deg" : "";
    const step = prop.step ?? 1;

    const adjust = (delta: number) => {
      let next = numVal + delta;
      if (prop.min !== undefined) next = Math.max(prop.min, next);
      if (prop.max !== undefined) next = Math.min(prop.max, next);
      applyStyle(prop.cssProp, `${next}${suffix}`);
    };

    return (
      <div style={rowStyle} key={prop.key}>
        <label style={labelStyle}>{prop.label}</label>
        <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
          <button onClick={() => adjust(-step * 10)} style={adjBtnStyle} title="-10">
            &#x226A;
          </button>
          <button onClick={() => adjust(-step)} style={adjBtnStyle} title="-1">
            -
          </button>
          <input
            type="text"
            value={rawVal}
            onChange={(e) => applyStyle(prop.cssProp, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") { e.preventDefault(); adjust(e.shiftKey ? step * 10 : step); }
              if (e.key === "ArrowDown") { e.preventDefault(); adjust(e.shiftKey ? -step * 10 : -step); }
            }}
            style={{ ...numInputStyle, width: prop.type === "text" ? 90 : 60 }}
          />
          <button onClick={() => adjust(step)} style={adjBtnStyle} title="+1">
            +
          </button>
          <button onClick={() => adjust(step * 10)} style={adjBtnStyle} title="+10">
            &#x226B;
          </button>
        </div>
      </div>
    );
  };

  const renderGroup = (title: string, key: string, props: PropDef[]) => {
    const isOpen = expandedGroups[key] !== false;
    return (
      <div key={key} style={groupStyle}>
        <button onClick={() => toggleGroup(key)} style={groupHeaderStyle}>
          <span style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.15s", display: "inline-block", fontSize: 10 }}>
            &#9654;
          </span>
          <span>{title}</span>
        </button>
        {isOpen && (
          <div style={groupBodyStyle}>
            {props.map(renderInput)}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside style={panelStyle}>
      {/* Header com info do elemento */}
      <div style={headerStyle}>
        <span style={{ color: "#D4A843", fontWeight: 700, fontSize: 12 }}>
          &lt;{selected.tag}&gt;
        </span>
        {selected.text && (
          <span style={{ color: "#8a8a8a", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selected.text.slice(0, 25)}
          </span>
        )}
      </div>

      <div style={scrollStyle} className="editor-scroll">
        {renderGroup("POSICAO", "position", POSITION_PROPS)}
        {renderGroup("DIMENSOES", "size", SIZE_PROPS)}
        {renderGroup("TRANSFORMACAO", "transform", TRANSFORM_PROPS)}
        {renderGroup("ESPACAMENTO", "spacing", SPACING_PROPS)}
        {renderGroup("TIPOGRAFIA", "typo", TYPO_PROPS)}
        {renderGroup("CORES", "color", COLOR_PROPS)}
        {renderGroup("BORDA", "border", BORDER_PROPS)}
        {renderGroup("EFEITOS", "effect", EFFECT_PROPS)}

        <EffectsPanel
          selected={selected}
          pushUndo={() => {
            window.dispatchEvent(new CustomEvent("editor:push-undo", {
              detail: { element: selected.element },
            }));
          }}
        />
      </div>
    </aside>
  );
}

// ===== ESTILOS =====
const panelStyle: React.CSSProperties = {
  width: 280,
  background: "#0d0a08",
  border: "1px solid rgba(212,168,67,0.15)",
  borderRadius: 8,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  maxHeight: "calc(100vh - 200px)",
};

const emptyStyle: React.CSSProperties = {
  padding: 20,
  textAlign: "center",
};

const headerStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid rgba(212,168,67,0.12)",
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const scrollStyle: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  padding: 4,
};

const groupStyle: React.CSSProperties = {
  marginBottom: 2,
};

const groupHeaderStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 8px",
  background: "rgba(212,168,67,0.06)",
  border: "none",
  borderRadius: 4,
  color: "#D4A843",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.8,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "left",
};

const groupBodyStyle: React.CSSProperties = {
  padding: "4px 4px 8px",
  display: "flex",
  flexDirection: "column",
  gap: 3,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 4,
  padding: "2px 4px",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#8a8a8a",
  minWidth: 60,
  whiteSpace: "nowrap",
};

const numInputStyle: React.CSSProperties = {
  width: 60,
  background: "#0a0806",
  color: "#e5e5e5",
  border: "1px solid rgba(212,168,67,0.2)",
  borderRadius: 3,
  padding: "3px 4px",
  fontSize: 11,
  fontFamily: "ui-monospace, monospace",
  textAlign: "center",
};

const textInputStyle: React.CSSProperties = {
  width: 90,
  background: "#0a0806",
  color: "#e5e5e5",
  border: "1px solid rgba(212,168,67,0.2)",
  borderRadius: 3,
  padding: "3px 4px",
  fontSize: 10,
  fontFamily: "ui-monospace, monospace",
};

const selectInputStyle: React.CSSProperties = {
  background: "#0a0806",
  color: "#e5e5e5",
  border: "1px solid rgba(212,168,67,0.2)",
  borderRadius: 3,
  padding: "3px 6px",
  fontSize: 10,
  fontFamily: "inherit",
};

const adjBtnStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(212,168,67,0.08)",
  border: "1px solid rgba(212,168,67,0.2)",
  borderRadius: 3,
  color: "#D4A843",
  fontSize: 10,
  cursor: "pointer",
  fontFamily: "inherit",
  padding: 0,
};
