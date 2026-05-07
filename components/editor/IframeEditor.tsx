"use client";

/**
 * IframeEditor.tsx
 *
 * Centro do editor. Carrega o jogo real via iframe e coloca
 * um overlay transparente por cima pra interceptar cliques.
 *
 * Quando o usuario clica, usa elementFromPoint no DOM do iframe
 * pra identificar o elemento, e mostra highlight ao redor.
 *
 * Quando arrasta, move o elemento atualizando style.transform.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "./state/editorStore";
import { useEditorKeys } from "./utils/useEditorKeys";
import ResizeHandles from "./ResizeHandles";

/** Info do elemento DOM selecionado */
export interface DomElementInfo {
  /** Referencia ao elemento DOM real dentro do iframe */
  element: HTMLElement;
  /** Tag name (div, span, button, img, etc) */
  tag: string;
  /** Texto visivel (truncado) */
  text: string;
  /** Rect original (antes de qualquer edicao) */
  originalRect: DOMRect;
  /** Style original (snapshot pra undo) */
  originalStyle: string;
  /** ID unico gerado pro elemento (data-editor-idx) */
  editorId: string;
}

/**
 * URL do jogo usa path relativo (/game/X) — o next.config.mjs com
 * EDITOR_MODE=1 faz rewrite /game/* → casino:3000/game/*.
 * Resultado: iframe mesma origin = contentWindow.document acessivel.
 */

/** Gerar ID unico pra cada elemento descoberto */
let idCounter = 0;
function nextEditorId(): string {
  return `ed-${++idCounter}`;
}

interface Props {
  /** ID do alvo selecionado (ex: "slots", "blackjack") */
  gameId: string | null;
  /** Nome do componente especifico (ex: "BlackjackResult") ou "" pra principal */
  activeFile?: string;
  /** Callback quando elemento eh selecionado (pra painel de propriedades) */
  onSelectElement?: (info: DomElementInfo | null) => void;
  /** Ref callback pra expor iframe ref pro pai (DomTreePanel) */
  onIframeRef?: (ref: React.RefObject<HTMLIFrameElement | null>) => void;
  /** Callback pra expor iframeLoaded */
  onIframeLoaded?: (loaded: boolean) => void;
}

export default function IframeEditor({ gameId, activeFile = "", onSelectElement, onIframeRef, onIframeLoaded }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Expor iframe ref pro pai (DomTreePanel)
  useEffect(() => {
    onIframeRef?.(iframeRef);
  }, [onIframeRef]);

  // Elemento DOM selecionado (primario — ultimo clicado)
  const [selected, setSelected] = useState<DomElementInfo | null>(null);
  // Multi-select: elementos adicionais selecionados com Shift+Click
  const [multiSelected, setMultiSelected] = useState<DomElementInfo[]>([]);
  // Highlight rect (posicao relativa ao container)
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  // Multi highlight rects
  const [multiRects, setMultiRects] = useState<DOMRect[]>([]);
  // Hover rect (elemento sob o mouse)
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  // Context menu pra selecionar entre elementos sobrepostos (estilo Figma)
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number;
    elements: { el: HTMLElement; tag: string; text: string; depth: number }[];
  } | null>(null);
  // Iframe carregado
  const [iframeLoaded, setIframeLoaded] = useState(false);
  // Scale ref — atualizado quando scale muda, usado em callbacks que rodam antes da declaracao de scale
  const scaleRef = useRef(0.5);
  // Drag state
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; origLeft: number; origTop: number } | null>(null);

  // Modo Jogo: desativa overlay pra interagir com o jogo
  const [gameMode, setGameMode] = useState(false);
  // Hand tool: modo pan permanente (maozinha)
  const [handTool, setHandTool] = useState(false);

  // Undo/Redo stack — SOMENTE edicoes (zoom/pan/selecao NUNCA entram)
  // Pesquisa X0: Photoshop, VS Code, Figma — navegacao nao eh edicao
  const UNDO_LIMIT = 50;
  type UndoEntry = {
    type: "style";
    element: HTMLElement;
    styleSnapshot: string;
    description: string; // ex: "drag div +26px"
    elementTag: string;  // ex: "div.container > img"
  };
  const undoStack = useRef<UndoEntry[]>([]);
  const redoStack = useRef<UndoEntry[]>([]);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastUndoDesc, setLastUndoDesc] = useState("");

  /** Gerar descricao legivel do elemento */
  const describeElement = useCallback((el: HTMLElement): string => {
    const tag = el.tagName.toLowerCase();
    const cls = el.className ? `.${el.className.toString().split(" ")[0]}` : "";
    const text = (el.textContent || "").trim().slice(0, 15);
    return text ? `${tag}${cls} "${text}"` : `${tag}${cls}`;
  }, []);

  /** Salvar snapshot do style atual ANTES de uma mudanca */
  const pushUndo = useCallback((el: HTMLElement, desc?: string) => {
    const elementTag = describeElement(el);
    undoStack.current.push({
      type: "style",
      element: el,
      styleSnapshot: el.getAttribute("style") || "",
      description: desc || `edit ${elementTag}`,
      elementTag,
    });
    if (undoStack.current.length > UNDO_LIMIT) {
      undoStack.current.shift();
    }
    redoStack.current = [];
    setUndoCount(undoStack.current.length);
    setRedoCount(0);
    setHasChanges(true);
  }, [describeElement]);

  /** Ctrl+Z: desfazer — SOMENTE edicoes, nunca zoom/pan */
  const handleUndo = useCallback(() => {
    const entry = undoStack.current.pop();
    if (!entry) return;
    redoStack.current.push({
      ...entry,
      styleSnapshot: entry.element.getAttribute("style") || "",
    });
    entry.element.setAttribute("style", entry.styleSnapshot);
    // Se o undo restaurou um elemento que estava oculto, sincronizar hiddenIds
    if (entry.description.startsWith('hide ') || entry.description.startsWith('show ')) {
      const eid = entry.element.getAttribute('data-editor-idx');
      if (eid) {
        const restoredStyle = entry.styleSnapshot;
        const isNowHidden = restoredStyle.includes('opacity: 0') || restoredStyle.includes('opacity:0');
        setHiddenIds(prev => {
          const next = new Set(prev);
          if (isNowHidden) next.add(eid);
          else { next.delete(eid); hiddenElements.current.delete(eid); }
          return next;
        });
        if (!isNowHidden) {
          hiddenElements.current.delete(eid);
        }
      }
    }
    setUndoCount(undoStack.current.length);
    setRedoCount(redoStack.current.length);
    setLastUndoDesc(`Desfeito: ${entry.description}`);
    if (undoStack.current.length === 0) setHasChanges(false);
  }, []);

  /** Ctrl+Y: refazer */
  const handleRedo = useCallback(() => {
    const entry = redoStack.current.pop();
    if (!entry) return;
    undoStack.current.push({
      ...entry,
      styleSnapshot: entry.element.getAttribute("style") || "",
    });
    entry.element.setAttribute("style", entry.styleSnapshot);
    setUndoCount(undoStack.current.length);
    setRedoCount(redoStack.current.length);
    setLastUndoDesc(`Refeito: ${entry.description}`);
    setHasChanges(true);
  }, []);

  // Expor pushUndo pra o DomPropsPanel via window event
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.element) pushUndo(detail.element);
    };
    window.addEventListener("editor:push-undo", handler);
    return () => window.removeEventListener("editor:push-undo", handler);
  }, [pushUndo]);

  // Store
  const addChange = useEditorStore((s) => s.addChange);

  // ═══════════════════════════════════════════════════════
  // LOCK + SMART SELECT (Pesquisa X0 #3 — Protecao de Elementos)
  // ═══════════════════════════════════════════════════════
  // Auto-lock: niveis 0-2 do DOM travados por padrao (body, root, wrapper)
  // Manual lock: usuario pode travar/destravar via atalho L
  // Hidden: ocultar elementos que atrapalham via atalho H
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());
  const [manualLockedIds, setManualLockedIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [smartSelect, setSmartSelect] = useState(true); // ON por padrao

  /** Verificar se elemento eh visualmente relevante (nao eh wrapper vazio) */
  const isVisuallyRelevant = useCallback((el: HTMLElement): boolean => {
    try {
      const style = window.getComputedStyle
        ? el.ownerDocument.defaultView!.getComputedStyle(el)
        : (el as any).currentStyle;
      if (!style) return true;
      const hasBg = style.backgroundColor !== 'rgba(0, 0, 0, 0)'
        && style.backgroundColor !== 'transparent'
        && style.backgroundColor !== '';
      const hasBgImage = style.backgroundImage !== 'none' && style.backgroundImage !== '';
      const hasBorder = parseFloat(style.borderWidth || '0') > 0
        && style.borderStyle !== 'none';
      const hasText = el.childNodes.length > 0
        && Array.from(el.childNodes).some(n =>
          n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length > 0);
      const isVisualTag = ['IMG', 'VIDEO', 'CANVAS', 'SVG', 'BUTTON', 'INPUT', 'A', 'SELECT', 'TEXTAREA']
        .includes(el.tagName);
      return hasBg || hasBgImage || hasBorder || hasText || isVisualTag;
    } catch { return true; }
  }, []);

  /** Verificar se elemento deve ser ignorado na selecao (auto-lock via lockedIds) */
  const isAutoLocked = useCallback((el: HTMLElement): boolean => {
    if (el.tagName === 'BODY' || el.tagName === 'HTML') return true;
    // Auto-lock eh populado no iframe onLoad (niveis 0-1)
    // Entao basta checar se o id esta no set
    const eid = el.getAttribute('data-editor-idx');
    return eid ? lockedIds.has(eid) : false;
  }, [lockedIds]);

  /** Verificar se elemento esta locked (auto ou manual — tudo em lockedIds) */
  const isLocked = useCallback((el: HTMLElement): boolean => {
    if (el.tagName === 'BODY' || el.tagName === 'HTML') return true;
    const eid = el.getAttribute('data-editor-idx');
    return eid ? lockedIds.has(eid) : false;
  }, [lockedIds]);

  /** Toggle lock manual */
  /** Toggle lock manual — separado do auto-lock pra não confundir */
  const toggleLock = useCallback((el: HTMLElement) => {
    let eid = el.getAttribute('data-editor-idx');
    if (!eid) {
      eid = nextEditorId();
      el.setAttribute('data-editor-idx', eid);
    }
    // Toggle no manual lock
    setManualLockedIds(prev => {
      const next = new Set(prev);
      if (next.has(eid!)) next.delete(eid!);
      else next.add(eid!);
      return next;
    });
    // Tambem toggle no lockedIds geral
    setLockedIds(prev => {
      const next = new Set(prev);
      if (next.has(eid!)) next.delete(eid!);
      else next.add(eid!);
      return next;
    });
  }, []);

  /** Toggle hide — oculta com opacity 0 + pointer-events none (mantém layout)
   *  IMPORTANTE: pushUndo ANTES de ocultar pra Ctrl+Z restaurar
   */
  const hiddenElements = useRef<Map<string, HTMLElement>>(new Map());
  const toggleHide = useCallback((el: HTMLElement) => {
    let eid = el.getAttribute('data-editor-idx');
    if (!eid) {
      eid = nextEditorId();
      el.setAttribute('data-editor-idx', eid);
    }
    const isCurrentlyHidden = hiddenIds.has(eid);
    // Snapshot ANTES da mudanca — permite Ctrl+Z restaurar
    pushUndo(el, isCurrentlyHidden ? `show ${el.tagName.toLowerCase()}` : `hide ${el.tagName.toLowerCase()}`);
    if (isCurrentlyHidden) {
      // Restaurar
      el.style.opacity = '';
      el.style.pointerEvents = '';
      hiddenElements.current.delete(eid);
      setHiddenIds(prev => {
        const next = new Set(prev);
        next.delete(eid!);
        return next;
      });
    } else {
      // Ocultar — usa opacity 0 (nao visibility hidden que quebra layout)
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      hiddenElements.current.set(eid, el);
      setHiddenIds(prev => {
        const next = new Set(prev);
        next.add(eid!);
        return next;
      });
    }
  }, [hiddenIds, pushUndo]);

  /** Restaurar TODOS os ocultos */
  const unhideAll = useCallback(() => {
    hiddenElements.current.forEach((el) => {
      el.style.opacity = '';
      el.style.pointerEvents = '';
    });
    hiddenElements.current.clear();
    setHiddenIds(new Set());
  }, []);

  /** Restaurar UM oculto por id */
  const unhideOne = useCallback((eid: string) => {
    const el = hiddenElements.current.get(eid);
    if (el) {
      el.style.opacity = '';
      el.style.pointerEvents = '';
      hiddenElements.current.delete(eid);
    }
    setHiddenIds(prev => {
      const next = new Set(prev);
      next.delete(eid);
      return next;
    });
  }, []);

  // URL do jogo no iframe — relativa pra mesma origin (proxy via rewrite)
  const iframeSrc = gameId
    ? `/game/${gameId}${activeFile ? `?file=${activeFile}` : ""}`
    : "";

  // Reset quando troca de jogo ou arquivo
  useEffect(() => {
    setSelected(null);
    setMultiSelected([]);
    setHighlightRect(null);
    setMultiRects([]);
    setHoverRect(null);
    setContextMenu(null);
    setIframeLoaded(false);
    setZoomLevel(1);
    setHandTool(false);
    idCounter = 0;
    // Reset scroll position
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
      containerRef.current.scrollTop = 0;
    }
  }, [gameId, activeFile]);

  /** Calcular rect relativo ao WRAPPER (mesmo parent do iframe e highlights)
   *  Formula corrigida: como highlight e iframe compartilham o mesmo wrapper,
   *  a posicao do highlight = posicao interna do iframe * escala.
   *  Sem offsets extras — o scroll do container move o wrapper inteiro.
   *  Ref: Pesquisa X0 — floating-ui #1594, Gutenberg PR #46845
   */
  const calcRect = useCallback((el: HTMLElement): DOMRect | null => {
    if (!iframeRef.current || !containerRef.current) return null;
    try {
      const s = scaleRef.current;
      const elRect = el.getBoundingClientRect(); // coords INTERNAS do iframe (sem escala)
      // Highlight e iframe estao no mesmo wrapper, ambos position:absolute
      // Entao a posicao visual = coords internas * escala
      return new DOMRect(
        elRect.left * s,
        elRect.top * s,
        elRect.width * s,
        elRect.height * s,
      );
    } catch { return null; }
  }, []);

  // Atualizar highlight quando selecionado muda ou window resize
  const updateHighlight = useCallback(() => {
    if (!selected || !iframeRef.current || !containerRef.current) {
      setHighlightRect(null);
      setMultiRects([]);
      return;
    }
    setHighlightRect(calcRect(selected.element));
    setMultiRects(
      multiSelected.map((m) => calcRect(m.element)).filter(Boolean) as DOMRect[]
    );
  }, [selected, multiSelected, calcRect]);

  useEffect(() => {
    updateHighlight();
    window.addEventListener("resize", updateHighlight);
    return () => window.removeEventListener("resize", updateHighlight);
  }, [updateHighlight]);

  // Refresh highlight periodico (jogo pode animar/mover coisas)
  useEffect(() => {
    if (!selected) return;
    const interval = setInterval(updateHighlight, 500);
    return () => clearInterval(interval);
  }, [selected, updateHighlight]);

  /** Dado coords do mouse no overlay, encontra o elemento MAIS PROFUNDO no iframe
   *  Respeita: lock (auto + manual), hidden, smart select (Pesquisa X0 #3)
   */
  const elementAtPoint = useCallback(
    (clientX: number, clientY: number): HTMLElement | null => {
      if (!iframeRef.current) return null;
      try {
        const iframeRect = iframeRef.current.getBoundingClientRect();
        // Compensar escala: coords visuais → coords reais do iframe
        const s = scaleRef.current;
        const x = (clientX - iframeRect.left) / s;
        const y = (clientY - iframeRect.top) / s;
        const doc = iframeRef.current.contentWindow?.document;
        if (!doc) return null;
        let el = doc.elementFromPoint(x, y) as HTMLElement | null;
        if (!el) return null;
        if (el.tagName === "BODY" || el.tagName === "HTML") return null;

        // Drill down: buscar o filho mais profundo que contem o ponto
        let deepest = el;
        let changed = true;
        while (changed) {
          changed = false;
          const children = deepest.children;
          for (let i = children.length - 1; i >= 0; i--) {
            const child = children[i] as HTMLElement;
            if (!child.getBoundingClientRect) continue;
            const cr = child.getBoundingClientRect();
            if (x >= cr.left && x <= cr.right && y >= cr.top && y <= cr.bottom) {
              deepest = child;
              changed = true;
              break;
            }
          }
        }

        // Se o deepest eh muito pequeno (<8px), usar o pai
        const dr = deepest.getBoundingClientRect();
        if (dr.width < 8 || dr.height < 8) {
          deepest = (deepest.parentElement as HTMLElement) || el;
        }

        if (deepest.tagName === "BODY" || deepest.tagName === "HTML") return el;

        // ═══ FILTRO DE SELECAO (simplificado) ═══
        // Regras:
        // 1. Hidden (opacity 0 via H) = ignorar
        // 2. Manual lock (via L) = BLOQUEAR sempre, não importa o que
        // 3. Auto-lock (containers nivel 0-1) = BYPASS, drill pro filho
        // 4. Smart Select = preferir elementos visuais
        // 5. Qualquer elemento NÃO locked = SEMPRE selecionável (inclusive após drag)

        let candidate = deepest;

        // 1. Hidden?
        const candId = candidate.getAttribute('data-editor-idx');
        if (candId && hiddenIds.has(candId)) return null;

        // 2. Manual lock? (usuario apertou L neste elemento)
        if (candId && manualLockedIds.has(candId)) {
          return null; // Travado pelo usuario — nao seleciona
        }

        // 3. Auto-lock? (container de nivel 0-1, populado no iframe load)
        // Se auto-locked mas NAO manual-locked, tentar drill pro filho
        if (isLocked(candidate) && !(candId && manualLockedIds.has(candId))) {
          const findChild = (parent: HTMLElement): HTMLElement | null => {
            for (let i = parent.children.length - 1; i >= 0; i--) {
              const child = parent.children[i] as HTMLElement;
              if (!child.getBoundingClientRect) continue;
              const cr = child.getBoundingClientRect();
              if (x >= cr.left && x <= cr.right && y >= cr.top && y <= cr.bottom) {
                const cid = child.getAttribute('data-editor-idx');
                // Pular hidden
                if (cid && hiddenIds.has(cid)) continue;
                // Pular manual locked
                if (cid && manualLockedIds.has(cid)) continue;
                // Se nao eh auto-locked, retornar
                if (!isLocked(child)) return child;
                // Se eh auto-locked, drill mais fundo
                const found = findChild(child);
                if (found) return found;
              }
            }
            return null;
          };
          const found = findChild(candidate);
          if (found) candidate = found;
          else return null;
        }

        // 4. Smart Select: preferir visuais (pular wrappers vazios)
        if (smartSelect && !isVisuallyRelevant(candidate)) {
          const findVisual = (parent: HTMLElement): HTMLElement | null => {
            for (let i = parent.children.length - 1; i >= 0; i--) {
              const child = parent.children[i] as HTMLElement;
              if (!child.getBoundingClientRect) continue;
              const cr = child.getBoundingClientRect();
              if (x >= cr.left && x <= cr.right && y >= cr.top && y <= cr.bottom) {
                if (isVisuallyRelevant(child) && !isLocked(child)) return child;
                const found = findVisual(child);
                if (found) return found;
              }
            }
            return null;
          };
          const visual = findVisual(candidate);
          if (visual) candidate = visual;
        }

        // 5. Retornar — elemento SEMPRE selecionavel se passou os filtros
        return candidate;
      } catch {
        return null;
      }
    },
    [hiddenIds, isLocked, smartSelect, isVisuallyRelevant, manualLockedIds],
  );

  // Manter scaleRef sincronizado — sera usado por calcRect e elementAtPoint
  // (declarado aqui pra referencia, atualizado mais abaixo quando scale eh computado)

  /** Criar DomElementInfo a partir de um HTMLElement */
  const makeInfo = useCallback((el: HTMLElement): DomElementInfo => {
    // Se ja tem ID do editor, reutilizar
    let eid = el.getAttribute("data-editor-idx");
    if (!eid) {
      eid = nextEditorId();
      el.setAttribute("data-editor-idx", eid);
    }
    const text = (el.textContent || "").trim().slice(0, 40);
    return {
      element: el,
      tag: el.tagName.toLowerCase(),
      text,
      originalRect: el.getBoundingClientRect(),
      originalStyle: el.getAttribute("style") || "",
      editorId: eid,
    };
  }, []);

  // Atalhos de teclado (20 atalhos — hook dedicado)
  useEditorKeys({
    selected, iframeRef, gameMode, setGameMode,
    setSelected, onSelectElement, pushUndo,
    handleUndo, handleRedo, makeInfo, updateHighlight,
    toggleLock, toggleHide,
  });

  // Toolbar event listeners (Fase 11 — Toolbar reescrita sem Konva)
  useEffect(() => {
    const onUndo = () => handleUndo();
    const onRedo = () => handleRedo();
    const onDeselect = () => {
      setSelected(null);
      setMultiSelected([]);
      setHighlightRect(null);
      setMultiRects([]);
      onSelectElement?.(null);
    };
    const onResetEl = () => {
      if (!selected) return;
      pushUndo(selected.element, `reset ${selected.tag}`);
      selected.element.setAttribute("style", selected.originalStyle);
      const info = makeInfo(selected.element);
      setSelected(info);
      onSelectElement?.(info);
      updateHighlight();
    };
    const onToggleLock = () => { if (selected) toggleLock(selected.element); };
    const onToggleHide = () => { if (selected) toggleHide(selected.element); };
    const onZindex = (e: Event) => {
      if (!selected) return;
      const delta = (e as CustomEvent).detail?.delta || 0;
      pushUndo(selected.element, `z-index ${delta > 0 ? '+' : ''}${delta}`);
      const current = parseInt(selected.element.style.zIndex || '0', 10);
      selected.element.style.zIndex = String(current + delta);
    };

    window.addEventListener("editor:undo", onUndo);
    window.addEventListener("editor:redo", onRedo);
    window.addEventListener("editor:deselect", onDeselect);
    window.addEventListener("editor:reset-element", onResetEl);
    window.addEventListener("editor:toggle-lock", onToggleLock);
    window.addEventListener("editor:toggle-hide", onToggleHide);
    window.addEventListener("editor:zindex", onZindex);
    return () => {
      window.removeEventListener("editor:undo", onUndo);
      window.removeEventListener("editor:redo", onRedo);
      window.removeEventListener("editor:deselect", onDeselect);
      window.removeEventListener("editor:reset-element", onResetEl);
      window.removeEventListener("editor:toggle-lock", onToggleLock);
      window.removeEventListener("editor:toggle-hide", onToggleHide);
      window.removeEventListener("editor:zindex", onZindex);
    };
  }, [selected, handleUndo, handleRedo, pushUndo, makeInfo, updateHighlight, toggleLock, toggleHide, onSelectElement]);

  /** Hover: mostra contorno azul claro no elemento sob o mouse */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragging || !iframeLoaded) return;
      const el = elementAtPoint(e.clientX, e.clientY);
      if (!el || !iframeRef.current || !containerRef.current) {
        setHoverRect(null);
        return;
      }
      const s = scaleRef.current;
      const elRect = el.getBoundingClientRect();
      // Mesma logica do calcRect: highlight e iframe no mesmo wrapper
      setHoverRect(
        new DOMRect(
          elRect.left * s,
          elRect.top * s,
          elRect.width * s,
          elRect.height * s,
        ),
      );
    },
    [dragging, iframeLoaded, elementAtPoint],
  );

  /** Click: seleciona elemento. Shift+Click = multi-select. Middle button = pan */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!iframeLoaded) return;
      e.preventDefault();
      e.stopPropagation();
      setContextMenu(null);

      // Middle mouse button OU hand tool = start pan via scroll nativo (Pesquisa X0)
      // Hand tool SEMPRE faz pan, independente do zoom level
      if (e.button === 1 || (e.button === 0 && e.altKey) || (e.button === 0 && handTool)) {
        isPanning.current = true;
        const container = containerRef.current;
        panStart.current = {
          x: e.clientX,
          y: e.clientY,
          scrollX: container?.scrollLeft || 0,
          scrollY: container?.scrollTop || 0,
        };
        return;
      }

      const el = elementAtPoint(e.clientX, e.clientY);
      if (!el) {
        setSelected(null);
        setMultiSelected([]);
        setHighlightRect(null);
        setMultiRects([]);
        onSelectElement?.(null);
        return;
      }

      const info = makeInfo(el);

      // Shift+Click: adicionar/remover da multi-selecao
      if (e.shiftKey && selected) {
        const alreadySelected = multiSelected.find((m) => m.element === el);
        if (alreadySelected) {
          // Remover da selecao
          setMultiSelected((prev) => prev.filter((m) => m.element !== el));
        } else if (el !== selected.element) {
          // Adicionar
          setMultiSelected((prev) => [...prev, info]);
        }
        return;
      }

      // Click normal: selecao unica
      setSelected(info);
      setMultiSelected([]);
      onSelectElement?.(info);

      // Setar highlight IMEDIATAMENTE
      setHighlightRect(calcRect(el));
      setMultiRects([]);

      // Preparar drag
      const elRect = el.getBoundingClientRect();
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        origLeft: elRect.left,
        origTop: elRect.top,
      };
    },
    [iframeLoaded, elementAtPoint, makeInfo],
  );

  /** Drag: mover elemento OU pan */
  const handleOverlayMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Pan mode (middle button or Alt+drag) — scroll nativo (Pesquisa X0)
      if (isPanning.current) {
        const container = containerRef.current;
        if (container) {
          const dx = e.clientX - panStart.current.x;
          const dy = e.clientY - panStart.current.y;
          container.scrollLeft = panStart.current.scrollX - dx;
          container.scrollTop  = panStart.current.scrollY - dy;
        }
        return;
      }
      if (!dragStart.current || !selected) {
        handleMouseMove(e);
        return;
      }

      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      // Comecar drag so apos 3px de movimento (evita click acidental)
      if (!dragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        setDragging(true);
        // Snapshot pra undo — elemento primario + todos multi-selected
        pushUndo(selected.element, `drag ${selected.tag}`);
        multiSelected.forEach((m) => pushUndo(m.element, `drag ${m.tag}`));
      }

      if (!dragging && Math.abs(dx) <= 3 && Math.abs(dy) <= 3) return;

      // Aplicar deslocamento via transform — primario
      const applyTranslate = (el: HTMLElement) => {
        const current = el.style.transform || "";
        const clean = current.replace(/translate\([^)]*\)/g, "").trim();
        el.style.transform = `${clean} translate(${dx}px, ${dy}px)`.trim();
      };

      applyTranslate(selected.element);
      // Mover todos os multi-selected juntos
      multiSelected.forEach((m) => applyTranslate(m.element));

      updateHighlight();
    },
    [selected, multiSelected, dragging, handleMouseMove, updateHighlight, pushUndo],
  );

  /** Drop: finalizar drag ou pan */
  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      // Finalizar pan
      if (isPanning.current) {
        isPanning.current = false;
        return;
      }

      if (dragging && selected && dragStart.current) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;

        // Registrar mudanca no store (pra undo/redo)
        addChange({
          editorId: selected.editorId,
          property: "transform",
          oldValue: selected.originalStyle,
          newValue: selected.element.getAttribute("style") || "",
          deltaX: dx,
          deltaY: dy,
        });

        // Atualizar info do selected com novo rect
        setSelected(makeInfo(selected.element));
      }

      setDragging(false);
      dragStart.current = null;
      updateHighlight();
    },
    [dragging, selected, addChange, makeInfo, updateHighlight],
  );

  // Sem jogo selecionado — renderiza empty state (mas hooks ja foram chamados acima)
  // Calcular escala pra caber o iframe 1920x1080 no container disponivel
  // NOTA: hooks DEVEM ficar antes de qualquer return condicional (Rules of Hooks)
  const [containerWidth, setContainerWidth] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  // Pan via scroll nativo (Pesquisa X0: Figma approach — overflow:auto no container)
  // panOffset REMOVIDO — pan agora eh scrollLeft/scrollTop do container
  const zoomLevelRef = useRef(1);
  // Manter ref sincronizado com state
  useEffect(() => { zoomLevelRef.current = zoomLevel; }, [zoomLevel]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, scrollX: 0, scrollY: 0 });
  useEffect(() => {
    const update = () => {
      if (wrapperRef.current) {
        setContainerWidth(wrapperRef.current.clientWidth);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Zoom com Ctrl+Scroll (centrado no cursor — Pesquisa X0)
  // Zoom NAO entra no undo (eh navegacao, nao edicao)
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.altKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const newZoom = Math.max(0.2, Math.min(3, +(zoomLevelRef.current + delta).toFixed(2)));

      // Zoom centrado no cursor (Pesquisa X0: Figma/Blender approach)
      const container = containerRef.current;
      if (container && newZoom !== zoomLevelRef.current) {
        const rect = container.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;
        const oldScale = baseScaleRef.current * zoomLevelRef.current;
        const newScale = baseScaleRef.current * newZoom;
        // Ponto no conteudo sob o cursor ANTES do zoom
        const contentX = (container.scrollLeft + cursorX) / oldScale;
        const contentY = (container.scrollTop + cursorY) / oldScale;
        setZoomLevel(newZoom);
        // Apos render, ajustar scroll pra manter cursor sobre mesmo ponto
        requestAnimationFrame(() => {
          container.scrollLeft = (contentX * newScale) - cursorX;
          container.scrollTop  = (contentY * newScale) - cursorY;
        });
      } else {
        setZoomLevel(newZoom);
      }
    };
    wrapper.addEventListener("wheel", onWheel, { passive: false });
    return () => wrapper.removeEventListener("wheel", onWheel);
  }, []);

  const GAME_W = 1920;
  const GAME_H = 1080;
  const baseScale = containerWidth > 0 ? containerWidth / GAME_W : 0.5;
  const baseScaleRef = useRef(baseScale);
  baseScaleRef.current = baseScale;
  // Container height stays fixed (based on baseScale, NOT zoom)
  const scaledH = GAME_H * baseScale;
  // Effective scale pra calculos de coords (base * zoom)
  const scale = baseScale * zoomLevel;
  scaleRef.current = scale;
  // Tamanho REAL do conteudo escalado (pra overflow:auto gerar scrollbars)
  const scaledContentW = GAME_W * scale;
  const scaledContentH = GAME_H * scale;

  if (!gameId) {
    return (
      <div style={emptyStyle}>
        <p style={{ color: "#D4A843", fontSize: 16, fontWeight: 600 }}>
          Selecione um alvo no painel esquerdo
        </p>
        <p style={{ color: "#8a8a8a", fontSize: 13, marginTop: 8 }}>
          O jogo sera carregado aqui em tempo real
        </p>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="editor-scroll" style={{ width: "100%", minHeight: 0 }}>
    {/* Container com overflow:auto — scroll nativo quando zoom > fit (Pesquisa X0) */}
    <div
      ref={containerRef}
      style={{
        width: containerWidth || "100%",
        height: scaledH || 400,
        position: "relative",
        background: "#0a0a0a",
        border: gameMode ? "2px solid #00E676" : "1px solid rgba(212,168,67,0.2)",
        borderRadius: 8,
        overflow: zoomLevel > 1 ? "auto" : "hidden",
        padding: 0,
      }}
      className="editor-scroll"
      onScroll={updateHighlight}
    >
      {/* Wrapper dimensionado pro conteudo escalado — gera scrollbars quando > container */}
      <div style={{
        width: Math.max(scaledContentW, containerWidth || 0),
        height: Math.max(scaledContentH, scaledH || 0),
        position: "relative",
      }}>
      {/* Iframe 1920x1080 — zoom aplicado via transform scale, SEM translate (pan eh scroll nativo) */}
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        onLoad={() => {
          setIframeLoaded(true);
          onIframeLoaded?.(true);
          // AUTO-LOCK: travar containers de nivel 0-1 (Pesquisa X0 #3)
          try {
            const doc = iframeRef.current?.contentWindow?.document;
            if (doc) {
              const autoLock = new Set<string>();
              // Nivel 0: filhos diretos do body
              const bodyChildren = doc.body.children;
              for (let i = 0; i < bodyChildren.length; i++) {
                const child = bodyChildren[i] as HTMLElement;
                if (!child.tagName || child.tagName === 'SCRIPT' || child.tagName === 'STYLE') continue;
                let eid = child.getAttribute('data-editor-idx');
                if (!eid) { eid = nextEditorId(); child.setAttribute('data-editor-idx', eid); }
                autoLock.add(eid);
                // Nivel 1: filhos dos filhos do body
                for (let j = 0; j < child.children.length; j++) {
                  const grandchild = child.children[j] as HTMLElement;
                  if (!grandchild.tagName || grandchild.tagName === 'SCRIPT' || grandchild.tagName === 'STYLE') continue;
                  let geid = grandchild.getAttribute('data-editor-idx');
                  if (!geid) { geid = nextEditorId(); grandchild.setAttribute('data-editor-idx', geid); }
                  autoLock.add(geid);
                }
              }
              setLockedIds(prev => {
                const next = new Set(prev);
                autoLock.forEach(id => next.add(id));
                return next;
              });
            }
          } catch { /* iframe access error */ }
        }}
        style={{
          width: GAME_W,
          height: GAME_H,
          border: "none",
          display: "block",
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
          position: "absolute",
          left: 0,
          top: 0,
        }}
        title={`Editor: ${gameId}`}
      />

      {/* Overlay transparente pra interceptar eventos (desativado no Modo Jogo) */}
      {!gameMode && (
        <div
          ref={overlayRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleOverlayMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu(null);
            // Coletar TODOS os elementos no ponto (da superficie ate o fundo)
            if (!iframeRef.current) return;
            try {
              const iframeRect = iframeRef.current.getBoundingClientRect();
              const s = scaleRef.current;
              const x = (e.clientX - iframeRect.left) / s;
              const y = (e.clientY - iframeRect.top) / s;
              const doc = iframeRef.current.contentWindow?.document;
              if (!doc) return;
              const elements: { el: HTMLElement; tag: string; text: string; depth: number }[] = [];
              const collectAtPoint = (el: HTMLElement, depth: number) => {
                const rect = el.getBoundingClientRect();
                if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                  if (el.tagName !== "BODY" && el.tagName !== "HTML" && el.tagName !== "SCRIPT" && el.tagName !== "STYLE") {
                    const text = (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3)
                      ? (el.childNodes[0].textContent || "").trim().slice(0, 25)
                      : "";
                    elements.push({ el, tag: el.tagName.toLowerCase(), text, depth });
                  }
                  for (let i = 0; i < el.children.length; i++) {
                    collectAtPoint(el.children[i] as HTMLElement, depth + 1);
                  }
                }
              };
              collectAtPoint(doc.body, 0);
              if (elements.length > 0) {
                const containerRect = containerRef.current!.getBoundingClientRect();
                setContextMenu({
                  x: e.clientX - containerRect.left,
                  y: e.clientY - containerRect.top,
                  elements,
                });
              }
            } catch { /* ignore */ }
          }}
          onMouseLeave={() => {
            setHoverRect(null);
            if (dragging) handleMouseUp({} as React.MouseEvent);
          }}
          style={{
            position: "absolute",
            inset: 0,
            cursor: isPanning.current ? "grabbing" : handTool ? "grab" : dragging ? "grabbing" : "crosshair",
            zIndex: 10,
          }}
        />
      )}

      {/* Hover highlight (azul claro) */}
      {hoverRect && !dragging && (
        <div
          style={{
            position: "absolute",
            left: hoverRect.x,
            top: hoverRect.y,
            width: hoverRect.width,
            height: hoverRect.height,
            border: "1px solid rgba(100,180,255,0.6)",
            background: "rgba(100,180,255,0.08)",
            pointerEvents: "none",
            zIndex: 11,
            transition: "all 0.1s ease",
          }}
        />
      )}

      {/* Selection highlight (dourado) */}
      {highlightRect && (
        <div
          style={{
            position: "absolute",
            left: highlightRect.x,
            top: highlightRect.y,
            width: highlightRect.width,
            height: highlightRect.height,
            border: "2px solid #D4A843",
            background: "rgba(212,168,67,0.06)",
            pointerEvents: "none",
            zIndex: 12,
            boxShadow: "0 0 8px rgba(212,168,67,0.3)",
          }}
        >
          {/* Tag label */}
          <span
            style={{
              position: "absolute",
              top: -20,
              left: 0,
              fontSize: 10,
              color: "#080604",
              background: "#D4A843",
              padding: "1px 6px",
              borderRadius: "3px 3px 0 0",
              fontFamily: "ui-monospace, monospace",
              whiteSpace: "nowrap",
            }}
          >
            {selected?.tag}
            {selected?.text ? ` "${selected.text.slice(0, 20)}"` : ""}
            {multiSelected.length > 0 && ` +${multiSelected.length}`}
          </span>
        </div>
      )}

      {/* Resize handles (8 pontos ao redor do elemento) */}
      {highlightRect && selected && !dragging && !gameMode && (
        <ResizeHandles
          rect={highlightRect}
          element={selected.element}
          scale={scale}
          onResizeStart={() => pushUndo(selected.element)}
          onResizeEnd={() => {
            updateHighlight();
            setSelected(makeInfo(selected.element));
            onSelectElement?.(makeInfo(selected.element));
          }}
          onResizeMove={updateHighlight}
        />
      )}

      {/* Multi-select highlights (dourado mais claro) */}
      {multiRects.map((rect, i) => (
        <div
          key={`multi-${i}`}
          style={{
            position: "absolute",
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
            border: "1.5px dashed #D4A843",
            background: "rgba(212,168,67,0.04)",
            pointerEvents: "none",
            zIndex: 12,
          }}
        />
      ))}

      {/* Loading indicator */}
      {!iframeLoaded && gameId && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(10,10,10,0.9)",
            zIndex: 20,
            color: "#D4A843",
            fontSize: 14,
          }}
        >
          Carregando {gameId}...
        </div>
      )}

      {/* Barra de status com undo/redo e modo jogo */}

      {/* Context menu: selecionar entre elementos sobrepostos (right-click) */}
      {contextMenu && (
        <div
          style={{
            position: "absolute",
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 30,
            background: "linear-gradient(135deg, #1a1410 0%, #0e0c09 100%)",
            border: "1px solid rgba(212,168,67,0.4)",
            borderRadius: 6,
            padding: "4px 0",
            minWidth: 200,
            maxHeight: 300,
            overflow: "auto",
            boxShadow: "0 4px 20px rgba(0,0,0,0.8)",
          }}
          className="editor-scroll"
          onMouseLeave={() => setContextMenu(null)}
        >
          <div style={{ padding: "4px 10px 6px", fontSize: 9, color: "#8a8a8a", fontWeight: 700, letterSpacing: 0.5, borderBottom: "1px solid rgba(212,168,67,0.12)", marginBottom: 2 }}>
            SELECIONAR ELEMENTO ({contextMenu.elements.length})
          </div>
          {contextMenu.elements.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                const info = makeInfo(item.el);
                setSelected(info);
                setMultiSelected([]);
                onSelectElement?.(info);
                setHighlightRect(calcRect(item.el));
                setContextMenu(null);
              }}
              onMouseEnter={() => {
                // Preview highlight ao passar o mouse no menu
                const rect = calcRect(item.el);
                if (rect) setHoverRect(rect);
              }}
              onMouseLeave={() => setHoverRect(null)}
              style={{
                display: "block",
                width: "100%",
                padding: "4px 10px",
                paddingLeft: `${10 + item.depth * 8}px`,
                background: "transparent",
                border: "none",
                color: "#e5e5e5",
                fontSize: 10,
                fontFamily: "ui-monospace, monospace",
                cursor: "pointer",
                textAlign: "left",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <span style={{ color: "#8cb4d4" }}>{item.tag}</span>
              {item.text && <span style={{ color: "#6a6a6a", marginLeft: 4 }}>&quot;{item.text}&quot;</span>}
            </button>
          ))}
        </div>
      )}

      {/* Indicador visual Modo Jogo (borda verde) */}
      {gameMode && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "3px solid rgba(0,230,118,0.6)",
            borderRadius: 8,
            pointerEvents: "none",
            zIndex: 25,
          }}
        />
      )}

      </div>{/* fecha wrapper do conteudo escalado */}
    </div>{/* fecha container com overflow:auto */}
    {/* Barra de status — FORA do container do iframe */}
    <div
      style={{
        width: "100%",
        height: 30,
        background: "rgba(8,6,4,0.95)",
        borderTop: "1px solid rgba(212,168,67,0.25)",
        border: "1px solid rgba(212,168,67,0.15)",
        borderRadius: "0 0 8px 8px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 8px",
        fontSize: 11,
        fontFamily: "ui-monospace, monospace",
        color: "#8a8a8a",
        flexShrink: 0,
      }}
    >
        {/* Botao Modo Jogo */}
        <button
          onClick={() => {
            setGameMode((prev) => !prev);
            setHoverRect(null);
            setHighlightRect(null);
          }}
          style={{
            padding: "3px 8px",
            background: gameMode ? "rgba(0,230,118,0.2)" : "rgba(212,168,67,0.1)",
            border: `1px solid ${gameMode ? "rgba(0,230,118,0.5)" : "rgba(212,168,67,0.3)"}`,
            borderRadius: 4,
            color: gameMode ? "#00E676" : "#D4A843",
            fontSize: 10,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: 0.5,
          }}
          title={gameMode ? "Voltar pro Modo Editor (overlay ativado)" : "Modo Jogo: interagir com o jogo (overlay desativado)"}
        >
          {gameMode ? "MODO JOGO ●" : "MODO EDITOR"}
        </button>

        {/* Botao Congelar — pausa animacoes CSS pra editar tela parada */}
        <button
          onClick={() => {
            try {
              const doc = iframeRef.current?.contentWindow?.document;
              if (!doc) return;
              const root = doc.documentElement;
              const frozen = root.style.getPropertyValue("--editor-frozen") === "1";
              if (frozen) {
                root.style.removeProperty("--editor-frozen");
                const freezeStyle = doc.getElementById("editor-freeze-style");
                if (freezeStyle) freezeStyle.remove();
              } else {
                root.style.setProperty("--editor-frozen", "1");
                const style = doc.createElement("style");
                style.id = "editor-freeze-style";
                style.textContent = `*, *::before, *::after { animation-play-state: paused !important; transition: none !important; }`;
                doc.head.appendChild(style);
              }
            } catch { /* iframe access error */ }
          }}
          style={{
            padding: "3px 6px",
            background: "rgba(100,180,255,0.08)",
            border: "1px solid rgba(100,180,255,0.2)",
            borderRadius: 4,
            color: "#80B4FF",
            fontSize: 9,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
          title="Congelar: pausa todas as animacoes e transitions do jogo"
        >
          ❄ FREEZE
        </button>

        {/* Undo/Redo */}
        <button
          onClick={handleUndo}
          disabled={undoCount === 0}
          style={{ ...statusBtnStyle, opacity: undoCount > 0 ? 1 : 0.3 }}
          title={`Desfazer (Ctrl+Z) — ${undoCount} acao(oes)`}
        >
          ↩ {undoCount}
        </button>
        <button
          onClick={handleRedo}
          disabled={redoCount === 0}
          style={{ ...statusBtnStyle, opacity: redoCount > 0 ? 1 : 0.3 }}
          title={`Refazer (Ctrl+Y) — ${redoCount} acao(oes)`}
        >
          ↪ {redoCount}
        </button>

        {/* Indicador de mudancas */}
        {hasChanges && (
          <span style={{ color: "#FF8C00", fontSize: 10 }}>● nao salvo</span>
        )}

        {/* Undo description toast */}
        {lastUndoDesc && (
          <span style={{ color: "#aaa", fontSize: 9, fontStyle: "italic", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {lastUndoDesc}
          </span>
        )}

        {/* Zoom controls — zoom NAO entra no undo (eh navegacao) */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          marginLeft: 4,
          background: "rgba(212,168,67,0.05)",
          border: "1px solid rgba(212,168,67,0.18)",
          borderRadius: 4,
          overflow: "hidden",
        }}>
          <button
            onClick={() => {
              setZoomLevel((prev) => Math.max(0.2, +(prev - 0.1).toFixed(2)));
            }}
            style={zoomBtnStyle}
            title="Zoom out (−10%)"
          >
            −
          </button>
          <div style={{ width: 1, height: 16, background: "rgba(212,168,67,0.12)" }} />
          <button
            onClick={() => {
              setZoomLevel(1);
              if (containerRef.current) {
                containerRef.current.scrollLeft = 0;
                containerRef.current.scrollTop = 0;
              }
            }}
            style={{
              ...zoomBtnStyle,
              minWidth: 44,
              color: zoomLevel === 1 ? "#8a8a8a" : "#D4A843",
              fontWeight: 600,
            }}
            title="Resetar zoom (100%) — Ctrl+Scroll pra zoom — Middle click+drag pra mover"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <div style={{ width: 1, height: 16, background: "rgba(212,168,67,0.12)" }} />
          <button
            onClick={() => {
              setZoomLevel((prev) => Math.min(3, +(prev + 0.1).toFixed(2)));
            }}
            style={zoomBtnStyle}
            title="Zoom in (+10%)"
          >
            +
          </button>
          <div style={{ width: 1, height: 16, background: "rgba(212,168,67,0.12)" }} />
          <button
            onClick={() => {
              setZoomLevel(1);
              if (containerRef.current) {
                containerRef.current.scrollLeft = 0;
                containerRef.current.scrollTop = 0;
              }
            }}
            style={{ ...zoomBtnStyle, fontSize: 8, letterSpacing: 0.5, padding: "0 6px" }}
            title="Ajustar pra caber (Fit to screen) — reseta zoom e scroll"
          >
            FIT
          </button>
          <div style={{ width: 1, height: 16, background: "rgba(212,168,67,0.12)" }} />
          <button
            onClick={() => setHandTool((prev) => !prev)}
            style={{
              ...zoomBtnStyle,
              fontSize: 12,
              padding: "0 6px",
              background: handTool ? "rgba(212,168,67,0.2)" : "transparent",
              color: handTool ? "#FFD700" : "#D4A843",
            }}
            title={handTool ? "Desativar maozinha (voltar pra selecao)" : "Maozinha: mover tela com zoom (middle click ou Alt+drag tambem funciona)"}
          >
            ✋
          </button>
        </div>

        {/* Info do elemento */}
        {selected && !gameMode && (
          <>
            <span style={{ color: "#D4A843", fontWeight: 600, marginLeft: 8 }}>
              &lt;{selected.tag}&gt;
              {multiSelected.length > 0 && (
                <span style={{ color: "#aaa", fontWeight: 400 }}>
                  {" "}+{multiSelected.length} (Shift+click pra mais)
                </span>
              )}
            </span>
            <span style={{ color: "#5a5a5a" }}>
              {Math.round(selected.originalRect.width)}x{Math.round(selected.originalRect.height)}
            </span>
            {/* Lock/Hide indicators + legend for selected element */}
            {selected.element.getAttribute('data-editor-idx') && lockedIds.has(selected.element.getAttribute('data-editor-idx')!) && (
              <span style={{ color: "#FF6B6B", fontSize: 9 }} title="Elemento travado — pressione L pra destravar">🔒</span>
            )}
            {/* Atalhos legend quando elemento selecionado */}
            <span style={{ color: "#555", fontSize: 8, marginLeft: 4 }} title="L=travar H=ocultar Del=resetar R=rotacionar []=z-index">
              L:trava H:oculta
            </span>
          </>
        )}

        {gameMode && (
          <span style={{ marginLeft: 8, color: "#00E676", fontSize: 10 }}>
            Interaja com o jogo — clique no botao pra voltar ao editor
          </span>
        )}

        {/* Smart Select toggle */}
        <button
          onClick={() => setSmartSelect(prev => !prev)}
          style={{
            ...statusBtnStyle,
            marginLeft: 4,
            color: smartSelect ? "#00E676" : "#666",
            borderColor: smartSelect ? "rgba(0,230,118,0.3)" : "rgba(100,100,100,0.2)",
            fontSize: 8,
          }}
          title={smartSelect
            ? "Smart Select ON: pula divs vazias sem visual, seleciona o que voce VE (img, button, div com bg). Clique pra desligar."
            : "Smart Select OFF: seleciona qualquer elemento incluindo wrappers invisíveis. Clique pra ligar."}
        >
          {smartSelect ? "◆ SMART" : "◇ SMART"}
        </button>
        {/* Hidden elements indicator + restore button */}
        {hiddenIds.size > 0 && (
          <button
            onClick={unhideAll}
            style={{ ...statusBtnStyle, color: "#FFD700", fontSize: 8 }}
            title={`${hiddenIds.size} elemento(s) oculto(s) — clique pra restaurar todos`}
          >
            👁 {hiddenIds.size} ocultos
          </button>
        )}
        {/* Lock count indicator */}
        {lockedIds.size > 0 && (
          <span style={{ color: "#666", fontSize: 8 }} title={`${lockedIds.size} elementos travados (auto-lock nos containers + manual via L)`}>
            🔒{lockedIds.size}
          </span>
        )}

        {/* Botao RESET — volta tudo ao estado original */}
        <button
          onClick={() => {
            // Resetar zoom e scroll
            setZoomLevel(1);
            if (containerRef.current) {
              containerRef.current.scrollLeft = 0;
              containerRef.current.scrollTop = 0;
            }
            setHandTool(false);
            // Resetar selecao
            setSelected(null);
            setMultiSelected([]);
            setHighlightRect(null);
            setMultiRects([]);
            setHoverRect(null);
            onSelectElement?.(null);
          }}
          style={{ ...zoomBtnStyle, fontSize: 8, color: "#FF8C00", marginLeft: "auto" }}
          title="Resetar tudo: zoom, scroll, selecao"
        >
          RESET
        </button>
      </div>
    </div>
  );
}

const emptyStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "16/9",
  background: "#1a1410",
  border: "1px dashed rgba(212,168,67,0.3)",
  borderRadius: 8,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

const statusBtnStyle: React.CSSProperties = {
  padding: "2px 6px",
  background: "rgba(212,168,67,0.08)",
  border: "1px solid rgba(212,168,67,0.2)",
  borderRadius: 3,
  color: "#D4A843",
  fontSize: 10,
  cursor: "pointer",
  fontFamily: "ui-monospace, monospace",
};

const zoomBtnStyle: React.CSSProperties = {
  padding: "2px 8px",
  background: "transparent",
  border: "none",
  color: "#D4A843",
  fontSize: 11,
  cursor: "pointer",
  fontFamily: "ui-monospace, monospace",
  height: 22,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.1s",
};
