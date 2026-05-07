"use client";

/**
 * ElementRow.tsx
 *
 * EM PALAVRAS SIMPLES: cada linha da lista de elementos no painel
 * esquerdo. Mostra um icone do tipo (rect/text/image/placeholder),
 * o nome, e botoes pra travar/desativar/deletar.
 *
 * TECNICAMENTE: row clicavel que sincroniza selecao com o canvas.
 * Drag-reorder fica pra E9 (precisa de @dnd-kit). Por enquanto, a
 * ordem segue zIndex — botoes ↑/↓ podem vir num refactor futuro.
 */
import type { GameElement } from "../state/schema";

interface Props {
  element: GameElement;
  isSelected: boolean;
  onSelect: (shiftKey: boolean) => void;
  onToggleLock: () => void;
  onToggleVisible: () => void;
  onDelete: () => void;
}

const TYPE_ICONS: Record<GameElement["type"], string> = {
  rect: "▭",
  text: "T",
  image: "▣",
  placeholder: "▢",
};

export default function ElementRow({
  element,
  isSelected,
  onSelect,
  onToggleLock,
  onToggleVisible,
  onDelete,
}: Props) {
  return (
    <div
      style={{
        ...rowStyle,
        ...(isSelected ? selectedRowStyle : {}),
        ...(element.visible ? {} : { opacity: 0.45 }),
      }}
      onClick={(e) => onSelect(e.shiftKey)}
      title={`${element.type} · z=${element.zIndex}`}
    >
      <span style={iconStyle}>{TYPE_ICONS[element.type]}</span>
      <span style={nameStyle}>{element.name}</span>

      <div style={actionsStyle}>
        <button
          title={element.locked ? "Destravar" : "Travar"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          style={element.locked ? iconBtnActiveStyle : iconBtnStyle}
        >
          {element.locked ? "⊠" : "⊡"}
        </button>
        <button
          title={element.visible ? "Esconder" : "Mostrar"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisible();
          }}
          style={element.visible ? iconBtnStyle : iconBtnActiveStyle}
        >
          {element.visible ? "◉" : "◎"}
        </button>
        <button
          title="Deletar"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={iconBtnDangerStyle}
        >
          ×
        </button>
      </div>
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 8px",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 12,
  color: "#c5c5c5",
  border: "1px solid transparent",
  userSelect: "none",
};

const selectedRowStyle: React.CSSProperties = {
  background: "rgba(212,168,67,0.12)",
  border: "1px solid rgba(212,168,67,0.4)",
  color: "#D4A843",
};

const iconStyle: React.CSSProperties = {
  width: 16,
  textAlign: "center",
  color: "#8a8a8a",
  fontSize: 13,
};

const nameStyle: React.CSSProperties = {
  flex: 1,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 2,
};

const iconBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#5a5a5a",
  cursor: "pointer",
  fontSize: 12,
  padding: "2px 4px",
  borderRadius: 2,
  fontFamily: "inherit",
  width: 20,
  height: 20,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const iconBtnActiveStyle: React.CSSProperties = {
  ...iconBtnStyle,
  color: "#D4A843",
};

const iconBtnDangerStyle: React.CSSProperties = {
  ...iconBtnStyle,
  color: "#c45050",
  fontSize: 14,
};
