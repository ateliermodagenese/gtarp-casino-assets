/**
 * history.ts
 *
 * EM PALAVRAS SIMPLES: hooks de undo/redo. useHistoryControls da
 * voce undo, redo, canUndo, canRedo. useDragHistoryGate ativa o
 * pause/resume automaticamente durante drag/resize/rotate, evitando
 * 60 entradas no historico por segundo de arrasto.
 *
 * TECNICAMENTE: wrappers em volta de zundo's temporal API. O gate
 * mantem um contador de operacoes continuas ativas (drag + transform
 * podem se sobrepor) e so resume quando todas terminam.
 */
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useEditorStore } from "../state/editorStore";

/**
 * Hook que retorna controles de undo/redo + flags reativas de
 * canUndo/canRedo (atualizam quando o stack muda).
 */
export function useHistoryControls() {
  const t = useEditorStore.temporal;

  // Subscribe pro stack pra atualizar canUndo/canRedo em tempo real
  const subscribe = useCallback((cb: () => void) => t.subscribe(cb), [t]);
  const getSnapshot = useCallback(() => {
    const s = t.getState();
    return `${s.pastStates.length}|${s.futureStates.length}`;
  }, [t]);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const state = t.getState();

  return {
    undo: () => t.getState().undo(),
    redo: () => t.getState().redo(),
    clear: () => t.getState().clear(),
    canUndo: state.pastStates.length > 0,
    canRedo: state.futureStates.length > 0,
    pause: () => t.getState().pause(),
    resume: () => t.getState().resume(),
  };
}

/**
 * Hook que da pause/resume seguros pra usar em onDragStart/onDragEnd
 * e onTransformStart/onTransformEnd. Conta operacoes simultaneas pra
 * lidar com casos onde drag e transform se sobrepoem.
 */
export function useDragHistoryGate() {
  const counter = useRef(0);
  const t = useEditorStore.temporal;

  const begin = useCallback(() => {
    counter.current += 1;
    if (counter.current === 1) {
      t.getState().pause();
    }
  }, [t]);

  const end = useCallback(() => {
    counter.current = Math.max(0, counter.current - 1);
    if (counter.current === 0) {
      t.getState().resume();
    }
  }, [t]);

  return { begin, end };
}

/**
 * Hook que escuta atalhos globais de undo/redo:
 * - Ctrl/Cmd+Z = undo
 * - Ctrl/Cmd+Y ou Ctrl/Cmd+Shift+Z = redo
 *
 * Ignora quando esta digitando em input/textarea.
 */
export function useUndoRedoShortcuts() {
  const { undo, redo } = useHistoryControls();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;

      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);
}
