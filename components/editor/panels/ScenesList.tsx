"use client";

/**
 * ScenesList.tsx
 *
 * EM PALAVRAS SIMPLES: a lista das cenas (Tela inicial, Vitoria,
 * Modal Regras, etc) que aparece no painel esquerdo. Tem botao
 * "+ Nova cena" no topo. Quando voce so tem 1 cena nao da pra deletar.
 *
 * TECNICAMENTE: subscribe no store. Atalho Ctrl+D duplica a cena
 * ativa. Modal de confirmacao em deletes.
 */
import { useEffect, useState } from "react";
import { useEditorStore } from "../state/editorStore";
import SceneRow from "./SceneRow";
import ConfirmModal from "./ConfirmModal";

export default function ScenesList() {
  const scenes = useEditorStore((s) => s.layout.scenes);
  const currentSceneId = useEditorStore((s) => s.currentSceneId);
  const setCurrentScene = useEditorStore((s) => s.setCurrentScene);
  const addScene = useEditorStore((s) => s.addScene);
  const renameScene = useEditorStore((s) => s.renameScene);
  const duplicateScene = useEditorStore((s) => s.duplicateScene);
  const deleteScene = useEditorStore((s) => s.deleteScene);

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  // Ctrl+D duplica a cena ativa
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() !== "d") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      handleDuplicate(currentSceneId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentSceneId]);

  const handleAdd = () => {
    const newId = `scene-${Date.now()}`;
    const newName = `Nova cena ${scenes.length + 1}`;
    // Reusa background da cena atual como ponto de partida
    const current = scenes.find((s) => s.id === currentSceneId);
    addScene({
      id: newId,
      name: newName,
      background: current?.background ?? { type: "image", src: "" },
      elements: [],
    });
  };

  const handleDuplicate = (id: string) => {
    const orig = scenes.find((s) => s.id === id);
    if (!orig) return;
    const newId = `${id}-copy-${Date.now()}`;
    const newName = `${orig.name} (copia)`;
    duplicateScene(id, newId, newName);
  };

  const sceneToDelete = pendingDelete ? scenes.find((s) => s.id === pendingDelete) : null;

  return (
    <>
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <span style={titleStyle}>CENAS</span>
          <button onClick={handleAdd} style={addBtnStyle} title="Nova cena">
            +
          </button>
        </div>

        <div style={listStyle}>
          {scenes.map((s) => (
            <SceneRow
              key={s.id}
              id={s.id}
              name={s.name}
              isActive={s.id === currentSceneId}
              canDelete={scenes.length > 1}
              onSelect={() => setCurrentScene(s.id)}
              onRename={(newName) => renameScene(s.id, newName)}
              onDuplicate={() => handleDuplicate(s.id)}
              onDelete={() => setPendingDelete(s.id)}
            />
          ))}
        </div>
      </div>

      <ConfirmModal
        open={pendingDelete !== null}
        title="Deletar cena?"
        message={
          sceneToDelete
            ? `A cena "${sceneToDelete.name}" e seus ${sceneToDelete.elements.length} elemento(s) serao removidos. Voce ainda pode desfazer com Ctrl+Z depois.`
            : ""
        }
        confirmLabel="Deletar"
        danger
        onConfirm={() => {
          if (pendingDelete) {
            deleteScene(pendingDelete);
            setPendingDelete(null);
          }
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
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

const addBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(212,168,67,0.3)",
  color: "#D4A843",
  cursor: "pointer",
  borderRadius: 3,
  width: 20,
  height: 20,
  fontSize: 13,
  padding: 0,
  fontFamily: "inherit",
  lineHeight: 1,
};

const listStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  maxHeight: 200,
  overflowY: "auto",
};
