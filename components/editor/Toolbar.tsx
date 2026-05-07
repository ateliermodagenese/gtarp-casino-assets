"use client";

/**
 * Toolbar.tsx — REESCRITA pra iframe editor (Fase 11)
 *
 * Removidas dependencias do store Konva.
 * Agora dispara custom events que o IframeEditor e paineis escutam.
 */

export default function Toolbar() {
  const dispatch = (event: string, detail?: any) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(event, { detail }));
    }
  };

  return (
    <div style={toolbarStyle}>
      {/* Undo/Redo */}
      <div style={groupStyle}>
        <ToolbarBtn onClick={() => dispatch("editor:undo")} title="Desfazer (Ctrl+Z)" icon="↶" />
        <ToolbarBtn onClick={() => dispatch("editor:redo")} title="Refazer (Ctrl+Y)" icon="↷" />
      </div>
      <div style={dividerStyle} />

      {/* File */}
      <div style={groupStyle}>
        <ToolbarBtn onClick={() => dispatch("editor:save")} title="Salvar mudancas no .tsx" icon="💾" label="Salvar" />
        <ToolbarBtn onClick={() => dispatch("editor:open-history")} title="Historico de backups" icon="🕐" label="Historico" />
        <ToolbarBtn onClick={() => dispatch("editor:open-preview")} title="Preview do jogo" icon="📐" label="Preview" />
      </div>
      <div style={dividerStyle} />

      {/* Selection */}
      <div style={groupStyle}>
        <ToolbarBtn onClick={() => dispatch("editor:deselect")} title="Limpar selecao (Escape)" icon="◌" />
        <ToolbarBtn onClick={() => dispatch("editor:reset-element")} title="Resetar elemento (Delete)" icon="✕" danger />
      </div>
      <div style={dividerStyle} />

      {/* Lock / Hide (Pesquisa X0 #3) */}
      <div style={groupStyle}>
        <ToolbarBtn onClick={() => dispatch("editor:toggle-lock")} title="Travar/destravar (L)" icon="🔒" />
        <ToolbarBtn onClick={() => dispatch("editor:toggle-hide")} title="Ocultar/mostrar (H)" icon="◉" />
      </div>
      <div style={dividerStyle} />

      {/* Z-Index */}
      <div style={groupStyle}>
        <ToolbarBtn onClick={() => dispatch("editor:zindex", { delta: 1 })} title="z-index + (])" icon="⤒" />
        <ToolbarBtn onClick={() => dispatch("editor:zindex", { delta: -1 })} title="z-index − ([)" icon="⤓" />
      </div>
      <div style={dividerStyle} />

      {/* Align */}
      <div style={groupStyle}>
        <ToolbarBtn onClick={() => dispatch("editor:align", { mode: "left" })} title="Alinhar esquerda" icon="⫷" />
        <ToolbarBtn onClick={() => dispatch("editor:align", { mode: "center" })} title="Alinhar centro H" icon="≡" />
        <ToolbarBtn onClick={() => dispatch("editor:align", { mode: "right" })} title="Alinhar direita" icon="⫸" />
        <ToolbarBtn onClick={() => dispatch("editor:align", { mode: "top" })} title="Alinhar topo" icon="⊤" />
        <ToolbarBtn onClick={() => dispatch("editor:align", { mode: "middle" })} title="Alinhar meio V" icon="—" />
        <ToolbarBtn onClick={() => dispatch("editor:align", { mode: "bottom" })} title="Alinhar base" icon="⊥" />
      </div>

      <div style={{ flex: 1 }} />
      <ToolbarBtn onClick={() => dispatch("editor:open-help")} title="Ajuda e atalhos (?)" icon="?" />
    </div>
  );
}

interface BtnProps {
  onClick: () => void;
  title: string;
  icon: string;
  label?: string;
  disabled?: boolean;
  danger?: boolean;
  active?: boolean;
}

function ToolbarBtn({ onClick, title, icon, label, disabled, danger, active }: BtnProps) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} style={{
      ...btnBase,
      ...(disabled ? { opacity: 0.3, cursor: "not-allowed" } : {}),
      ...(danger ? { color: "#dc5050" } : {}),
      ...(active ? { background: "rgba(212,168,67,0.15)", borderColor: "rgba(212,168,67,0.4)", color: "#D4A843" } : {}),
    }}>
      <span>{icon}</span>
      {label && <span style={{ fontSize: 11 }}>{label}</span>}
    </button>
  );
}

const toolbarStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 4,
  background: "#0d0a08", border: "1px solid rgba(212,168,67,0.15)",
  borderRadius: 6, padding: "6px 10px",
};
const groupStyle: React.CSSProperties = { display: "flex", gap: 2 };
const dividerStyle: React.CSSProperties = { width: 1, height: 20, background: "rgba(212,168,67,0.15)", margin: "0 6px" };
const btnBase: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4,
  background: "transparent", border: "1px solid transparent",
  borderRadius: 4, padding: "5px 8px", cursor: "pointer",
  color: "#c5c5c5", fontSize: 14, fontFamily: "inherit",
  height: 28, minWidth: 28, justifyContent: "center",
  transition: "background 0.12s, border-color 0.12s",
};
