"use client";

/**
 * useEditorKeys.ts
 *
 * Hook de atalhos de teclado do editor iframe.
 * 20 atalhos pra produtividade maxima.
 */
import { useCallback, useEffect } from "react";
import type { DomElementInfo } from "../IframeEditor";

interface UseEditorKeysProps {
  selected: DomElementInfo | null;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  gameMode: boolean;
  setGameMode: (v: boolean | ((p: boolean) => boolean)) => void;
  setSelected: (v: DomElementInfo | null) => void;
  onSelectElement?: (info: DomElementInfo | null) => void;
  pushUndo: (el: HTMLElement, desc?: string) => void;
  handleUndo: () => void;
  handleRedo: () => void;
  makeInfo: (el: HTMLElement) => DomElementInfo;
  updateHighlight: () => void;
  toggleLock?: (el: HTMLElement) => void;
  toggleHide?: (el: HTMLElement) => void;
}

export function useEditorKeys({
  selected,
  iframeRef,
  gameMode,
  setGameMode,
  setSelected,
  onSelectElement,
  pushUndo,
  handleUndo,
  handleRedo,
  makeInfo,
  updateHighlight,
  toggleLock,
  toggleHide,
}: UseEditorKeysProps) {

  /** Mover elemento selecionado por delta px */
  const nudge = useCallback((dx: number, dy: number) => {
    if (!selected) return;
    pushUndo(selected.element);
    const el = selected.element;
    const current = el.style.transform || "";
    const match = current.match(/translate\(([^,]+),\s*([^)]+)\)/);
    const prevX = match ? parseFloat(match[1]) : 0;
    const prevY = match ? parseFloat(match[2]) : 0;
    const clean = current.replace(/translate\([^)]*\)/g, "").trim();
    el.style.transform = `${clean} translate(${prevX + dx}px, ${prevY + dy}px)`.trim();
    updateHighlight();
    // Atualizar painel
    const info = makeInfo(el);
    setSelected(info);
    onSelectElement?.(info);
  }, [selected, pushUndo, updateHighlight, makeInfo, setSelected, onSelectElement]);

  /** Selecionar pai do elemento atual */
  const selectParent = useCallback(() => {
    if (!selected) return;
    const parent = selected.element.parentElement;
    if (!parent || parent.tagName === "BODY" || parent.tagName === "HTML") return;
    const info = makeInfo(parent);
    setSelected(info);
    onSelectElement?.(info);
    updateHighlight();
  }, [selected, makeInfo, setSelected, onSelectElement, updateHighlight]);

  /** Selecionar primeiro filho do elemento atual */
  const selectChild = useCallback(() => {
    if (!selected) return;
    const child = selected.element.children[0] as HTMLElement | undefined;
    if (!child) return;
    const info = makeInfo(child);
    setSelected(info);
    onSelectElement?.(info);
    updateHighlight();
  }, [selected, makeInfo, setSelected, onSelectElement, updateHighlight]);

  /** Selecionar proximo irmao */
  const selectNext = useCallback(() => {
    if (!selected) return;
    const next = selected.element.nextElementSibling as HTMLElement | null;
    if (!next) return;
    const info = makeInfo(next);
    setSelected(info);
    onSelectElement?.(info);
    updateHighlight();
  }, [selected, makeInfo, setSelected, onSelectElement, updateHighlight]);

  /** Selecionar irmao anterior */
  const selectPrev = useCallback(() => {
    if (!selected) return;
    const prev = selected.element.previousElementSibling as HTMLElement | null;
    if (!prev) return;
    const info = makeInfo(prev);
    setSelected(info);
    onSelectElement?.(info);
    updateHighlight();
  }, [selected, makeInfo, setSelected, onSelectElement, updateHighlight]);

  /** Esconder/mostrar elemento */
  const toggleVisibility = useCallback(() => {
    if (!selected) return;
    // Usar sistema de hide centralizado se disponivel (Pesquisa X0 #3)
    if (toggleHide) {
      toggleHide(selected.element);
      // Deselecionar pois elemento ficou oculto
      setSelected(null);
      onSelectElement?.(null);
      updateHighlight();
      return;
    }
    // Fallback: toggle direto
    pushUndo(selected.element, `hide ${selected.tag}`);
    const el = selected.element;
    if (el.style.visibility === "hidden") {
      el.style.visibility = "";
      el.style.opacity = "";
    } else {
      el.style.visibility = "hidden";
      el.style.opacity = "0";
    }
  }, [selected, pushUndo, toggleHide, setSelected, onSelectElement, updateHighlight]);

  /** Lock toggle */
  const handleToggleLock = useCallback(() => {
    if (!selected || !toggleLock) return;
    toggleLock(selected.element);
  }, [selected, toggleLock]);

  /** Resetar mudancas do elemento */
  const resetElement = useCallback(() => {
    if (!selected) return;
    pushUndo(selected.element);
    selected.element.setAttribute("style", selected.originalStyle);
    const info = makeInfo(selected.element);
    setSelected(info);
    onSelectElement?.(info);
    updateHighlight();
  }, [selected, pushUndo, makeInfo, setSelected, onSelectElement, updateHighlight]);

  /** Rotacionar */
  const rotate = useCallback((deg: number) => {
    if (!selected) return;
    pushUndo(selected.element);
    const el = selected.element;
    const current = el.style.transform || "";
    const match = current.match(/rotate\(([^)]+)\)/);
    const prevDeg = match ? parseFloat(match[1]) : 0;
    const clean = current.replace(/rotate\([^)]*\)/g, "").trim();
    el.style.transform = `${clean} rotate(${prevDeg + deg}deg)`.trim();
    updateHighlight();
  }, [selected, pushUndo, updateHighlight]);

  /** Z-index */
  const changeZIndex = useCallback((delta: number) => {
    if (!selected) return;
    pushUndo(selected.element);
    const el = selected.element;
    const current = parseInt(el.style.zIndex || "0", 10) || 0;
    el.style.zIndex = String(current + delta);
  }, [selected, pushUndo]);

  /** Resetar transformacoes */
  const resetTransform = useCallback(() => {
    if (!selected) return;
    pushUndo(selected.element);
    selected.element.style.transform = "";
    updateHighlight();
  }, [selected, pushUndo, updateHighlight]);

  // Handler principal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      // Ctrl+Z / Ctrl+Y — funciona sempre
      if ((e.ctrlKey || e.metaKey) && !isInput) {
        if (e.key === "z" || e.key === "Z") {
          e.preventDefault();
          if (e.shiftKey) handleRedo(); else handleUndo();
          return;
        }
        if (e.key === "y" || e.key === "Y") {
          e.preventDefault();
          handleRedo();
          return;
        }
      }

      // Nao processar outros atalhos se esta num input
      if (isInput) return;

      // G — Toggle Modo Jogo
      if (e.key === "g" || e.key === "G") {
        if (e.ctrlKey || e.metaKey) return;
        e.preventDefault();
        setGameMode((prev: boolean) => !prev);
        return;
      }

      // Escape — Deselecionar ou sair do Modo Jogo
      if (e.key === "Escape") {
        e.preventDefault();
        if (gameMode) {
          setGameMode(false);
        } else {
          setSelected(null);
          onSelectElement?.(null);
        }
        return;
      }

      // Setas — mover elemento
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && selected) {
        e.preventDefault();
        const step = e.ctrlKey ? 0.1 : e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        nudge(dx, dy);
        return;
      }

      // Tab / Shift+Tab — navegar entre irmaos
      if (e.key === "Tab" && selected) {
        e.preventDefault();
        if (e.shiftKey) selectPrev(); else selectNext();
        return;
      }

      // Space — selecionar pai
      if (e.key === " " && selected) {
        e.preventDefault();
        selectParent();
        return;
      }

      // Enter — selecionar filho
      if (e.key === "Enter" && selected) {
        e.preventDefault();
        selectChild();
        return;
      }

      // H — esconder/mostrar
      if ((e.key === "h" || e.key === "H") && selected) {
        e.preventDefault();
        toggleVisibility();
        return;
      }

      // L — toggle lock no elemento selecionado (Pesquisa X0 #3)
      if ((e.key === "l" || e.key === "L") && selected && !e.ctrlKey) {
        e.preventDefault();
        handleToggleLock();
        return;
      }

      // Delete / Backspace — resetar mudancas
      if ((e.key === "Delete" || e.key === "Backspace") && selected) {
        e.preventDefault();
        resetElement();
        return;
      }

      // R — rotacionar +15, Shift+R — rotacionar -15
      if (e.key === "r" && selected) {
        e.preventDefault();
        rotate(15);
        return;
      }
      if (e.key === "R" && selected) {
        e.preventDefault();
        rotate(-15);
        return;
      }

      // [ ] — z-index
      if (e.key === "[" && selected) {
        e.preventDefault();
        changeZIndex(-1);
        return;
      }
      if (e.key === "]" && selected) {
        e.preventDefault();
        changeZIndex(1);
        return;
      }

      // 0 — resetar transformacoes
      if (e.key === "0" && selected && !e.ctrlKey) {
        e.preventDefault();
        resetTransform();
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    selected, gameMode, handleUndo, handleRedo, setGameMode,
    setSelected, onSelectElement, nudge, selectParent, selectChild,
    selectNext, selectPrev, toggleVisibility, resetElement,
    rotate, changeZIndex, resetTransform, handleToggleLock,
  ]);
}
