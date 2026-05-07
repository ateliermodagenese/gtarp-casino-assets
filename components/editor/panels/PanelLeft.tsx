"use client";

/**
 * PanelLeft.tsx
 *
 * EM PALAVRAS SIMPLES: o painel esquerdo do editor. Junta a lista
 * de cenas em cima e a lista de elementos da cena atual embaixo.
 *
 * TECNICAMENTE: composicao simples ScenesList + ElementsList.
 * Coluna fixa de 240px, scroll interno por secao se passar do limite.
 */
import ScenesList from "./ScenesList";
import ElementsList from "./ElementsList";

export default function PanelLeft() {
  return (
    <aside style={panelStyle}>
      <ScenesList />
      <div style={dividerStyle} />
      <ElementsList />
    </aside>
  );
}

const panelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: 12,
  width: 240,
  flexShrink: 0,
  background: "#0d0a08",
  border: "1px solid rgba(212,168,67,0.15)",
  borderRadius: 8,
  height: "100%",
  minHeight: 0,
};

const dividerStyle: React.CSSProperties = {
  height: 1,
  background: "rgba(212,168,67,0.15)",
  margin: "4px 0",
};
