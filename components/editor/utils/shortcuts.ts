"use client";

/**
 * shortcuts.ts
 *
 * EM PALAVRAS SIMPLES: lista mestre de atalhos de teclado do editor.
 * Tudo num lugar so pra ficar facil de ver, mudar, ou desabilitar.
 *
 * TECNICAMENTE: hook que registra um listener global e despacha
 * para a action correspondente do store. Ignora quando o foco esta
 * em INPUT/TEXTAREA/SELECT/contenteditable. Suporta Ctrl ou Cmd
 * (meta) pra macOS.
 */
import { useEffect } from "react";
import { useEditorStore } from "../state/editorStore";
import { useHistoryControls } from "./history";

export interface ShortcutCategory {
  category: string;
  items: { keys: string; action: string }[];
}

/**
 * Lista declarativa de todos os atalhos. Modal "?" usa isso pra
 * mostrar a tabela de atalhos pro usuario.
 */
export const SHORTCUTS_REFERENCE: ShortcutCategory[] = [
  {
    category: "Selecao",
    items: [
      { keys: "Click", action: "Selecionar elemento" },
      { keys: "Shift + Click", action: "Multi-select toggle" },
      { keys: "Ctrl/Cmd + A", action: "Selecionar tudo da cena" },
      { keys: "Esc", action: "Limpar selecao" },
    ],
  },
  {
    category: "Edicao",
    items: [
      { keys: "Delete / Backspace", action: "Apagar selecionados" },
      { keys: "Ctrl/Cmd + D", action: "Duplicar (cena se nada selecionado, senao elementos)" },
      { keys: "Ctrl/Cmd + Z", action: "Desfazer" },
      { keys: "Ctrl/Cmd + Y", action: "Refazer" },
      { keys: "Ctrl/Cmd + Shift + Z", action: "Refazer (alternativo)" },
    ],
  },
  {
    category: "Movimento (nudge)",
    items: [
      { keys: "Setas", action: "Mover ±0.1%" },
      { keys: "Shift + Setas", action: "Mover ±1%" },
      { keys: "Ctrl/Cmd + Setas", action: "Mover ±0.01% (milimetrico)" },
    ],
  },
  {
    category: "Ordem (z-index)",
    items: [
      { keys: "Ctrl/Cmd + ]", action: "Trazer pra frente (zIndex+1)" },
      { keys: "Ctrl/Cmd + [", action: "Mandar pra tras (zIndex-1)" },
      { keys: "Ctrl/Cmd + Shift + ]", action: "Trazer pra cima de tudo" },
      { keys: "Ctrl/Cmd + Shift + [", action: "Mandar pra baixo de tudo" },
    ],
  },
  {
    category: "Visibilidade",
    items: [
      { keys: "L", action: "Travar / destravar selecionados" },
      { keys: "H", action: "Esconder / mostrar selecionados" },
    ],
  },
  {
    category: "Ajuda",
    items: [{ keys: "?", action: "Abrir modal de ajuda (vem na E10)" }],
  },
];

/**
 * Verifica se o foco do teclado esta num campo de texto (nesse caso
 * NAO interceptamos atalhos pra nao quebrar a digitacao).
 */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!target) return false;
  const el = target as HTMLElement;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

/**
 * Hook que registra TODOS os atalhos do editor. Chamado uma vez no
 * EditorRoot.
 */
export function useEditorShortcuts() {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const setSelection = useEditorStore((s) => s.setSelection);
  const deleteElements = useEditorStore((s) => s.deleteElements);
  const duplicateElements = useEditorStore((s) => s.duplicateElements);
  const duplicateScene = useEditorStore((s) => s.duplicateScene);
  const layout = useEditorStore((s) => s.layout);
  const currentSceneId = useEditorStore((s) => s.currentSceneId);
  const selectAllInScene = useEditorStore((s) => s.selectAllInScene);
  const nudgeSelected = useEditorStore((s) => s.nudgeSelected);
  const bringForward = useEditorStore((s) => s.bringForward);
  const sendBackward = useEditorStore((s) => s.sendBackward);
  const updateElement = useEditorStore((s) => s.updateElement);

  const { undo, redo } = useHistoryControls();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      const meta = e.ctrlKey || e.metaKey;
      const key = e.key;

      // ===== UNDO / REDO =====
      if (meta && key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (meta && (key.toLowerCase() === "y" || (key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      // ===== DELETE =====
      if (key === "Delete" || key === "Backspace") {
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteElements(selectedIds);
        }
        return;
      }

      // ===== ESC =====
      if (key === "Escape") {
        e.preventDefault();
        setSelection([]);
        return;
      }

      // ===== SELECT ALL =====
      if (meta && key.toLowerCase() === "a") {
        e.preventDefault();
        selectAllInScene();
        return;
      }

      // ===== DUPLICATE =====
      if (meta && key.toLowerCase() === "d") {
        e.preventDefault();
        if (selectedIds.length > 0) {
          duplicateElements(selectedIds);
        } else {
          // Fallback: duplica cena ativa
          const orig = layout.scenes.find((s) => s.id === currentSceneId);
          if (orig) {
            const newId = `${orig.id}-copy-${crypto.randomUUID().slice(0, 4)}`;
            duplicateScene(currentSceneId, newId, `${orig.name} (copia)`);
          }
        }
        return;
      }

      // ===== NUDGE (setas) =====
      if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight") {
        if (selectedIds.length === 0) return;
        e.preventDefault();
        const step = meta ? 0.01 : e.shiftKey ? 1 : 0.1;
        const dx = key === "ArrowLeft" ? -step : key === "ArrowRight" ? step : 0;
        const dy = key === "ArrowUp" ? -step : key === "ArrowDown" ? step : 0;
        nudgeSelected(dx, dy);
        return;
      }

      // ===== Z-INDEX =====
      if (meta && key === "]") {
        e.preventDefault();
        bringForward(e.shiftKey);
        return;
      }
      if (meta && key === "[") {
        e.preventDefault();
        sendBackward(e.shiftKey);
        return;
      }

      // ===== TOGGLE LOCK / VISIBLE =====
      if (key.toLowerCase() === "l" && !meta) {
        if (selectedIds.length === 0) return;
        e.preventDefault();
        const scene = layout.scenes.find((s) => s.id === currentSceneId);
        const allLocked = scene?.elements
          .filter((el) => selectedIds.includes(el.id))
          .every((el) => el.locked);
        selectedIds.forEach((id) => updateElement(id, { locked: !allLocked }));
        return;
      }
      if (key.toLowerCase() === "h" && !meta) {
        if (selectedIds.length === 0) return;
        e.preventDefault();
        const scene = layout.scenes.find((s) => s.id === currentSceneId);
        const allVisible = scene?.elements
          .filter((el) => selectedIds.includes(el.id))
          .every((el) => el.visible);
        selectedIds.forEach((id) => updateElement(id, { visible: !allVisible }));
        return;
      }

      // ===== HELP (?) =====
      if (key === "?" && !meta) {
        e.preventDefault();
        // Dispara evento custom — modal de help (E10) escuta isso
        window.dispatchEvent(new CustomEvent("editor:open-help"));
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    selectedIds,
    setSelection,
    deleteElements,
    duplicateElements,
    duplicateScene,
    layout,
    currentSceneId,
    selectAllInScene,
    nudgeSelected,
    bringForward,
    sendBackward,
    updateElement,
    undo,
    redo,
  ]);
}
