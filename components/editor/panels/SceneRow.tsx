"use client";

/**
 * SceneRow.tsx
 *
 * EM PALAVRAS SIMPLES: cada linha da lista de cenas. Nome, e quando
 * voce passa o mouse aparecem botoes pra duplicar, renomear, deletar.
 * Double-click no nome eh atalho pra renomear inline.
 *
 * TECNICAMENTE: row com hover-reveal. State local pra modo de
 * renomeacao (input controlado). Cancela com Esc, confirma com Enter.
 */
import { useEffect, useRef, useState } from "react";

interface Props {
  id: string;
  name: string;
  isActive: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onRename: (newName: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export default function SceneRow({
  id,
  name,
  isActive,
  canDelete,
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) onRename(trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(name);
    setEditing(false);
  };

  return (
    <div
      style={{ ...rowStyle, ...(isActive ? activeRowStyle : {}) }}
      onClick={() => !editing && onSelect()}
      onDoubleClick={() => setEditing(true)}
      data-scene-id={id}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          style={inputStyle}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span style={nameStyle}>{name}</span>
      )}

      <div style={actionsStyle} className="scene-actions">
        <button
          title="Renomear (double-click)"
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          style={iconBtnStyle}
        >
          ✎
        </button>
        <button
          title="Duplicar (Ctrl+D)"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          style={iconBtnStyle}
        >
          ⎘
        </button>
        {canDelete && (
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
        )}
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
};

const activeRowStyle: React.CSSProperties = {
  background: "rgba(212,168,67,0.12)",
  border: "1px solid rgba(212,168,67,0.4)",
  color: "#D4A843",
};

const nameStyle: React.CSSProperties = {
  flex: 1,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: "#0a0806",
  border: "1px solid rgba(212,168,67,0.5)",
  borderRadius: 3,
  padding: "2px 6px",
  fontSize: 12,
  color: "#e5e5e5",
  fontFamily: "inherit",
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 2,
  opacity: 0.6,
};

const iconBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#8a8a8a",
  cursor: "pointer",
  fontSize: 12,
  padding: "2px 6px",
  borderRadius: 2,
  fontFamily: "inherit",
};

const iconBtnDangerStyle: React.CSSProperties = {
  ...iconBtnStyle,
  color: "#c45050",
  fontSize: 14,
};
