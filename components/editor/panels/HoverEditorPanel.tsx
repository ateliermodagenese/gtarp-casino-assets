"use client";

/**
 * HoverEditorPanel.tsx
 *
 * Editor de estados CSS (Normal / Hover / Active / Focus).
 * Injeta <style> no iframe com regras :hover, :active, :focus.
 * Toggle entre estados pra editar propriedades de cada um.
 *
 * Tecnica: adiciona classe temporaria (ed-hover-xxx) no elemento
 * e injeta regra `.ed-hover-xxx:hover { ... }` no iframe.
 * Pra forcar preview do hover sem mouse: aplica classe
 * `.ed-force-hover` com mesmos estilos inline.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { DomElementInfo } from "../IframeEditor";

type CssState = "normal" | "hover" | "active" | "focus";

interface HoverEditorPanelProps {
  selected: DomElementInfo | null;
  pushUndo: () => void;
}

interface StateStyles {
  hover: Record<string, string>;
  active: Record<string, string>;
  focus: Record<string, string>;
}

const EDITABLE_PROPS = [
  { key: "backgroundColor", label: "Fundo" },
  { key: "color", label: "Cor texto" },
  { key: "borderColor", label: "Cor borda" },
  { key: "boxShadow", label: "Sombra" },
  { key: "transform", label: "Transform" },
  { key: "opacity", label: "Opacidade" },
  { key: "filter", label: "Filtro" },
];

export default function HoverEditorPanel({ selected, pushUndo }: HoverEditorPanelProps) {
  const [activeState, setActiveState] = useState<CssState>("normal");
  const [stateStyles, setStateStyles] = useState<StateStyles>({
    hover: {},
    active: {},
    focus: {},
  });
  const [previewing, setPreviewing] = useState(false);
  const styleElRef = useRef<HTMLStyleElement | null>(null);

  // Reset quando troca de elemento
  useEffect(() => {
    setActiveState("normal");
    setStateStyles({ hover: {}, active: {}, focus: {} });
    setPreviewing(false);
  }, [selected?.editorId]);

  /** Garantir que o elemento tem classe editavel */
  const ensureClass = useCallback((): string => {
    if (!selected) return "";
    let cls = selected.element.getAttribute("data-editor-hover-cls");
    if (!cls) {
      cls = `ed-hover-${selected.editorId}`;
      selected.element.setAttribute("data-editor-hover-cls", cls);
      selected.element.classList.add(cls);
    }
    return cls;
  }, [selected]);

  /** Injetar/atualizar <style> no iframe */
  const injectStyles = useCallback(() => {
    if (!selected) return;
    const cls = ensureClass();
    if (!cls) return;

    try {
      const doc = selected.element.ownerDocument;
      if (!doc) return;

      // Remover style anterior
      if (styleElRef.current && styleElRef.current.parentNode) {
        styleElRef.current.parentNode.removeChild(styleElRef.current);
      }

      const styleEl = doc.createElement("style");
      styleEl.setAttribute("data-editor-hover-styles", "true");

      let css = "";
      // Hover
      const hoverProps = Object.entries(stateStyles.hover);
      if (hoverProps.length > 0) {
        css += `.${cls}:hover { ${hoverProps.map(([k, v]) => `${camelToKebab(k)}: ${v} !important`).join("; ")}; }\n`;
      }
      // Active
      const activeProps = Object.entries(stateStyles.active);
      if (activeProps.length > 0) {
        css += `.${cls}:active { ${activeProps.map(([k, v]) => `${camelToKebab(k)}: ${v} !important`).join("; ")}; }\n`;
      }
      // Focus
      const focusProps = Object.entries(stateStyles.focus);
      if (focusProps.length > 0) {
        css += `.${cls}:focus { ${focusProps.map(([k, v]) => `${camelToKebab(k)}: ${v} !important`).join("; ")}; }\n`;
      }

      // Force preview class
      if (previewing && activeState !== "normal") {
        const previewProps = Object.entries(stateStyles[activeState] || {});
        if (previewProps.length > 0) {
          css += `.ed-force-${activeState} { ${previewProps.map(([k, v]) => `${camelToKebab(k)}: ${v} !important`).join("; ")}; }\n`;
        }
      }

      styleEl.textContent = css;
      doc.head.appendChild(styleEl);
      styleElRef.current = styleEl;
    } catch { /* iframe access error */ }
  }, [selected, stateStyles, ensureClass, previewing, activeState]);

  useEffect(() => {
    injectStyles();
  }, [injectStyles]);

  /** Toggle preview (forcar estado sem mouse) */
  const togglePreview = useCallback(() => {
    if (!selected || activeState === "normal") return;
    const next = !previewing;
    setPreviewing(next);
    if (next) {
      selected.element.classList.add(`ed-force-${activeState}`);
    } else {
      selected.element.classList.remove(`ed-force-hover`, `ed-force-active`, `ed-force-focus`);
    }
  }, [selected, activeState, previewing]);

  // Limpar classes ao desmontar ou trocar estado
  useEffect(() => {
    return () => {
      if (selected) {
        selected.element.classList.remove("ed-force-hover", "ed-force-active", "ed-force-focus");
      }
    };
  }, [selected, activeState]);

  const updateProp = useCallback((state: CssState, prop: string, value: string) => {
    if (state === "normal") return;
    pushUndo();
    setStateStyles((prev) => ({
      ...prev,
      [state]: {
        ...prev[state as keyof StateStyles],
        [prop]: value,
      },
    }));
  }, [pushUndo]);

  const removeProp = useCallback((state: CssState, prop: string) => {
    if (state === "normal") return;
    setStateStyles((prev) => {
      const copy = { ...prev[state as keyof StateStyles] };
      delete copy[prop];
      return { ...prev, [state]: copy };
    });
  }, []);

  const removeAllState = useCallback((state: CssState) => {
    if (state === "normal") return;
    setStateStyles((prev) => ({ ...prev, [state]: {} }));
    if (selected) {
      selected.element.classList.remove(`ed-force-${state}`);
    }
  }, [selected]);

  if (!selected) return null;

  const currentStateProps = activeState === "normal"
    ? {}
    : stateStyles[activeState as keyof StateStyles] || {};

  const stateCount = (s: CssState) => {
    if (s === "normal") return 0;
    return Object.keys(stateStyles[s as keyof StateStyles] || {}).length;
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={{ color: "#D4A843", fontWeight: 700, fontSize: 10, letterSpacing: 0.8 }}>
          ESTADOS CSS
        </span>
      </div>

      {/* State tabs */}
      <div style={tabsStyle}>
        {(["normal", "hover", "active", "focus"] as CssState[]).map((state) => (
          <button
            key={state}
            onClick={() => {
              if (selected) selected.element.classList.remove("ed-force-hover", "ed-force-active", "ed-force-focus");
              setPreviewing(false);
              setActiveState(state);
            }}
            style={activeState === state ? tabActiveStyle : tabStyle}
          >
            {state.charAt(0).toUpperCase() + state.slice(1)}
            {stateCount(state) > 0 && (
              <span style={{ marginLeft: 3, color: "#D4A843", fontSize: 8 }}>
                ({stateCount(state)})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conteudo do estado */}
      <div style={bodyStyle}>
        {activeState === "normal" ? (
          <p style={{ color: "#6a6a6a", fontSize: 10, textAlign: "center", padding: 8 }}>
            Estado normal — edite via painel de propriedades acima.
          </p>
        ) : (
          <>
            {/* Preview toggle */}
            <button
              onClick={togglePreview}
              style={{
                ...previewBtnStyle,
                background: previewing ? "rgba(0,230,118,0.15)" : "rgba(212,168,67,0.08)",
                borderColor: previewing ? "rgba(0,230,118,0.4)" : "rgba(212,168,67,0.2)",
                color: previewing ? "#00E676" : "#D4A843",
              }}
            >
              {previewing ? `Previewing :${activeState}` : `Preview :${activeState}`}
            </button>

            {/* Propriedades editaveis */}
            {EDITABLE_PROPS.map((prop) => {
              const val = currentStateProps[prop.key] || "";
              return (
                <div key={prop.key} style={rowStyle}>
                  <label style={labelStyle}>{prop.label}</label>
                  <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => updateProp(activeState, prop.key, e.target.value)}
                      placeholder="—"
                      style={inputStyle}
                    />
                    {val && (
                      <button
                        onClick={() => removeProp(activeState, prop.key)}
                        style={removePropBtnStyle}
                        title="Remover"
                      >
                        &#x2715;
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Limpar estado */}
            {Object.keys(currentStateProps).length > 0 && (
              <button
                onClick={() => removeAllState(activeState)}
                style={clearBtnStyle}
              >
                Remover todos os estilos :{activeState}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function camelToKebab(s: string): string {
  return s.replace(/([A-Z])/g, "-$1").toLowerCase();
}

const containerStyle: React.CSSProperties = { marginTop: 2 };

const headerStyle: React.CSSProperties = {
  padding: "6px 8px",
  background: "rgba(212,168,67,0.06)",
  borderRadius: 4,
};

const tabsStyle: React.CSSProperties = {
  display: "flex",
  gap: 2,
  padding: "6px 8px 2px",
};

const tabStyle: React.CSSProperties = {
  padding: "3px 8px",
  background: "rgba(212,168,67,0.04)",
  border: "1px solid rgba(212,168,67,0.12)",
  borderRadius: 3,
  color: "#8a8a8a",
  fontSize: 9,
  cursor: "pointer",
  fontFamily: "inherit",
};

const tabActiveStyle: React.CSSProperties = {
  ...tabStyle,
  background: "rgba(212,168,67,0.15)",
  borderColor: "rgba(212,168,67,0.4)",
  color: "#D4A843",
  fontWeight: 600,
};

const bodyStyle: React.CSSProperties = {
  padding: "4px 8px 8px",
};

const previewBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "4px 8px",
  border: "1px solid",
  borderRadius: 3,
  fontSize: 10,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  marginBottom: 6,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 4,
  padding: "2px 0",
};

const labelStyle: React.CSSProperties = {
  fontSize: 9,
  color: "#8a8a8a",
  minWidth: 55,
};

const inputStyle: React.CSSProperties = {
  width: 110,
  background: "#0a0806",
  color: "#e5e5e5",
  border: "1px solid rgba(212,168,67,0.2)",
  borderRadius: 3,
  padding: "3px 4px",
  fontSize: 10,
  fontFamily: "ui-monospace, monospace",
};

const removePropBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#FF6666",
  cursor: "pointer",
  fontSize: 9,
  padding: "0 2px",
};

const clearBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "4px 8px",
  marginTop: 6,
  background: "rgba(255,68,68,0.08)",
  border: "1px solid rgba(255,68,68,0.2)",
  borderRadius: 3,
  color: "#FF6666",
  fontSize: 9,
  cursor: "pointer",
  fontFamily: "inherit",
};
