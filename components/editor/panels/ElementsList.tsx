"use client";

/**
 * ElementsList.tsx
 *
 * EM PALAVRAS SIMPLES: a lista de elementos da cena atual no painel
 * esquerdo. Cada item mostra icone + nome + botoes de
 * lock/visible/delete. Botoes de adicionar (+ Rect/Text/Image/
 * Placeholder) ficam no topo.
 *
 * TECNICAMENTE: subscribe no store. Drag-reorder por enquanto
 * simplificado (botoes ↑ ↓ via arrows da row — implementar full
 * drag-and-drop fica pra E9 com lib dedicada).
 */
import { useEditorStore } from "../state/editorStore";
import { createBaseElement } from "../state/schema";
import type {
  GameElement,
  ImageElement,
  RectElement,
  TextElement,
  PlaceholderElement,
} from "../state/schema";
import ElementRow from "./ElementRow";

export default function ElementsList() {
  const layout = useEditorStore((s) => s.layout);
  const currentSceneId = useEditorStore((s) => s.currentSceneId);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const setSelection = useEditorStore((s) => s.setSelection);
  const addElement = useEditorStore((s) => s.addElement);
  const updateElement = useEditorStore((s) => s.updateElement);
  const deleteElements = useEditorStore((s) => s.deleteElements);

  const scene = layout.scenes.find((s) => s.id === currentSceneId);
  const elements = scene?.elements ?? [];

  const handleAdd = (type: GameElement["type"]) => {
    const base = createBaseElement({
      type,
      name: `Novo ${type}`,
      x: 40,
      y: 40,
      width: 20,
      height: 15,
      zIndex: elements.length,
    });

    let element: GameElement;
    if (type === "image") {
      element = { ...base, type: "image", src: "/assets/cards/card-back.png", opacity: 1 } as ImageElement;
    } else if (type === "rect") {
      element = { ...base, type: "rect", fill: "#D4A843", cornerRadius: 4 } as RectElement;
    } else if (type === "text") {
      element = {
        ...base,
        type: "text",
        text: "Texto",
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: 4,
        color: "#FFFFFF",
        align: "center",
      } as TextElement;
    } else {
      element = {
        ...base,
        type: "placeholder",
        placeholderId: "novo-placeholder",
        description: "Descreva onde isso vai",
      } as PlaceholderElement;
    }
    addElement(element);
  };

  const handleSelect = (id: string, shiftKey: boolean) => {
    if (shiftKey) {
      setSelection(
        selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id],
      );
    } else {
      setSelection([id]);
    }
  };

  // Lista ordenada: maiores zIndex em cima (UI inverte ordem visual)
  const sorted = elements.slice().sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>ELEMENTOS</span>
        <span style={countStyle}>{elements.length}</span>
      </div>

      <div style={addBtnsStyle}>
        <button onClick={() => handleAdd("rect")} style={smallBtnStyle} title="Adicionar Rect">
          ▭
        </button>
        <button onClick={() => handleAdd("text")} style={smallBtnStyle} title="Adicionar Text">
          T
        </button>
        <button onClick={() => handleAdd("image")} style={smallBtnStyle} title="Adicionar Image">
          🖼
        </button>
        <button onClick={() => handleAdd("placeholder")} style={smallBtnStyle} title="Adicionar Placeholder">
          ⊞
        </button>
      </div>

      <div style={listStyle}>
        {sorted.length === 0 ? (
          <p style={emptyStyle}>Nenhum elemento.<br />Use os botoes acima.</p>
        ) : (
          sorted.map((el) => (
            <ElementRow
              key={el.id}
              element={el}
              isSelected={selectedIds.includes(el.id)}
              onSelect={(shiftKey) => handleSelect(el.id, shiftKey)}
              onToggleLock={() => updateElement(el.id, { locked: !el.locked })}
              onToggleVisible={() => updateElement(el.id, { visible: !el.visible })}
              onDelete={() => deleteElements([el.id])}
            />
          ))
        )}
      </div>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  flex: 1,
  minHeight: 0,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 4px",
};

const titleStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "#8a8a8a",
  letterSpacing: 1.5,
};

const countStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#5a5a5a",
  fontFamily: "ui-monospace, monospace",
};

const addBtnsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr 1fr",
  gap: 3,
  padding: "0 4px",
};

const smallBtnStyle: React.CSSProperties = {
  background: "rgba(212,168,67,0.08)",
  color: "#D4A843",
  border: "1px solid rgba(212,168,67,0.3)",
  borderRadius: 3,
  padding: "4px 0",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "inherit",
};

const listStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 1,
  flex: 1,
  overflowY: "auto",
  minHeight: 0,
};

const emptyStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#5a5a5a",
  textAlign: "center",
  padding: 16,
  lineHeight: 1.5,
};
