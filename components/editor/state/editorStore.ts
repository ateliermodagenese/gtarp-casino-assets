/**
 * editorStore.ts
 *
 * EM PALAVRAS SIMPLES: o "cerebro" do editor. Guarda o estado
 * (qual jogo, qual cena, quais elementos selecionados, o layout
 * inteiro) e permite desfazer (Ctrl+Z) e refazer (Ctrl+Y).
 *
 * TECNICAMENTE: zustand store com middleware temporal (zundo) pra
 * undo/redo. Partialize: so layout e selectedIds entram no historico.
 * Limit: 50 estados. Equality: shallow pra otimizar.
 *
 * Pause/resume manuais sao essenciais durante drag — sem isso o
 * historico ganha 60 entries por segundo de arrasto, memoria explode.
 */
import { create } from "zustand";
import { temporal } from "zundo";
import { shallow } from "zustand/shallow";
import type {
  GameElement,
  GameLayout,
  GameScene,
} from "./schema";
import { createEmptyLayout } from "./schema";

interface EditorStateData {
  /** Jogo atual (id de EDITOR_TARGETS) */
  targetId: string;
  /** Layout completo do jogo atual */
  layout: GameLayout;
  /** Cena ativa */
  currentSceneId: string;
  /** Ids selecionados (multi-select) */
  selectedIds: string[];
}

interface EditorActions {
  /** Trocar de jogo (recria layout vazio) */
  setTarget: (
    targetId: string,
    baseRes: { width: number; height: number },
    bgSrc: string,
  ) => void;
  /** Substituir layout inteiro (uso pelo load do API) */
  setLayout: (layout: GameLayout) => void;
  /** Trocar de cena */
  setCurrentScene: (sceneId: string) => void;
  /** Atualizar selecao */
  setSelection: (ids: string[]) => void;
  /** Adicionar elemento na cena atual */
  addElement: (element: GameElement) => void;
  /** Atualizar campos de um elemento */
  updateElement: (elementId: string, patch: Partial<GameElement>) => void;
  /** Remover elementos (multi) */
  deleteElements: (ids: string[]) => void;
  /** Adicionar nova cena */
  addScene: (scene: GameScene) => void;
  /** Duplicar cena (Ctrl+D na cena) */
  duplicateScene: (sceneId: string, newId: string, newName: string) => void;
  /** Renomear cena */
  renameScene: (sceneId: string, newName: string) => void;
  /** Atualiza background da cena (image/video src) */
  setSceneBackground: (sceneId: string, bg: { type: "image" | "video"; src: string; poster?: string }) => void;
  /** Deletar cena (proibe deletar a ultima) */
  deleteScene: (sceneId: string) => void;
  /** Reordenar zIndex (drag-reorder no painel esquerdo) */
  reorderElement: (elementId: string, newZIndex: number) => void;
  /** Reordenar lista de elementos da cena por troca de indices */
  reorderElementsList: (fromIndex: number, toIndex: number) => void;
  /** Alterna o flag locked do elemento */
  toggleElementLock: (elementId: string) => void;
  /** Alterna o flag visible do elemento */
  toggleElementVisible: (elementId: string) => void;
  /** Duplica os elementos passados (Ctrl+D em elemento) */
  duplicateElements: (ids: string[]) => void;
  /** Seleciona todos os elementos da cena atual */
  selectAllInScene: () => void;
  /** Move selecionados em delta% (nudge via setas) */
  nudgeSelected: (deltaX: number, deltaY: number) => void;
  /** Traz selecionados pra frente (zIndex max+1 ou cada +1) */
  bringForward: (toFront: boolean) => void;
  /** Manda selecionados pra tras (zIndex min-1 ou cada -1) */
  sendBackward: (toBack: boolean) => void;
  /** Alinha selecionados (>=2): left/center/right/top/middle/bottom */
  alignSelected: (mode: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  /** Registra uma mudanca DOM feita pelo iframe editor (pra undo/redo) */
  addChange: (change: DomChange) => void;
  /** Lista de mudancas DOM pendentes (nao salvas) */
  domChanges: DomChange[];
  /** Limpar mudancas apos save */
  clearDomChanges: () => void;
}

/** Mudanca feita num elemento DOM do iframe */
export interface DomChange {
  editorId: string;
  property: string;
  oldValue: string;
  newValue: string;
  deltaX?: number;
  deltaY?: number;
}

export type EditorState = EditorStateData & EditorActions;

export const useEditorStore = create<EditorState>()(
  temporal(
    (set) => ({
      // ===== STATE INICIAL =====
      targetId: "",
      layout: createEmptyLayout("none", { width: 1920, height: 1080 }, ""),
      currentSceneId: "default",
      selectedIds: [],
      domChanges: [],

      // ===== ACTIONS =====
      setTarget: (targetId, baseRes, bgSrc) =>
        set(() => {
          const layout = createEmptyLayout(targetId, baseRes, bgSrc);
          return { targetId, layout, currentSceneId: layout.defaultSceneId, selectedIds: [] };
        }),

      setLayout: (layout) =>
        set(() => ({ layout, currentSceneId: layout.defaultSceneId, selectedIds: [] })),

      setCurrentScene: (sceneId) => set(() => ({ currentSceneId: sceneId, selectedIds: [] })),

      setSelection: (ids) => set(() => ({ selectedIds: ids })),

      addElement: (element) =>
        set((state) => ({
          layout: {
            ...state.layout,
            scenes: state.layout.scenes.map((s) =>
              s.id !== state.currentSceneId
                ? s
                : { ...s, elements: [...s.elements, element] },
            ),
            metadata: { ...state.layout.metadata, updatedAt: new Date().toISOString() },
          },
          selectedIds: [element.id],
        })),

      updateElement: (elementId, patch) =>
        set((state) => ({
          layout: {
            ...state.layout,
            scenes: state.layout.scenes.map((s) =>
              s.id !== state.currentSceneId
                ? s
                : {
                    ...s,
                    elements: s.elements.map((el) =>
                      el.id !== elementId ? el : ({ ...el, ...patch } as GameElement),
                    ),
                  },
            ),
            metadata: { ...state.layout.metadata, updatedAt: new Date().toISOString() },
          },
        })),

      deleteElements: (ids) =>
        set((state) => ({
          layout: {
            ...state.layout,
            scenes: state.layout.scenes.map((s) =>
              s.id !== state.currentSceneId
                ? s
                : { ...s, elements: s.elements.filter((el) => !ids.includes(el.id)) },
            ),
            metadata: { ...state.layout.metadata, updatedAt: new Date().toISOString() },
          },
          selectedIds: [],
        })),

      addScene: (scene) =>
        set((state) => ({
          layout: { ...state.layout, scenes: [...state.layout.scenes, scene] },
          currentSceneId: scene.id,
          selectedIds: [],
        })),

      duplicateScene: (sceneId, newId, newName) =>
        set((state) => {
          const orig = state.layout.scenes.find((s) => s.id === sceneId);
          if (!orig) return state;
          const copy: GameScene = {
            ...orig,
            id: newId,
            name: newName,
            elements: orig.elements.map((el) => ({ ...el, id: crypto.randomUUID() })),
          };
          return {
            layout: { ...state.layout, scenes: [...state.layout.scenes, copy] },
            currentSceneId: newId,
            selectedIds: [],
          };
        }),

      renameScene: (sceneId, newName) =>
        set((state) => ({
          layout: {
            ...state.layout,
            scenes: state.layout.scenes.map((s) => (s.id !== sceneId ? s : { ...s, name: newName })),
          },
        })),

      setSceneBackground: (sceneId, bg) =>
        set((state) => ({
          layout: {
            ...state.layout,
            scenes: state.layout.scenes.map((s) => (s.id !== sceneId ? s : { ...s, background: bg })),
            metadata: { ...state.layout.metadata, updatedAt: new Date().toISOString() },
          },
        })),

      deleteScene: (sceneId) =>
        set((state) => {
          if (state.layout.scenes.length <= 1) return state; // proibe deletar ultima
          const newScenes = state.layout.scenes.filter((s) => s.id !== sceneId);
          const newCurrent =
            state.currentSceneId === sceneId ? newScenes[0]?.id ?? "" : state.currentSceneId;
          return {
            layout: { ...state.layout, scenes: newScenes },
            currentSceneId: newCurrent,
            selectedIds: [],
          };
        }),

      reorderElement: (elementId, newZIndex) =>
        set((state) => ({
          layout: {
            ...state.layout,
            scenes: state.layout.scenes.map((s) =>
              s.id !== state.currentSceneId
                ? s
                : {
                    ...s,
                    elements: s.elements.map((el) =>
                      el.id !== elementId ? el : { ...el, zIndex: newZIndex },
                    ),
                  },
            ),
          },
        })),

      reorderElementsList: (fromIndex, toIndex) =>
        set((state) => ({
          layout: {
            ...state.layout,
            scenes: state.layout.scenes.map((s) => {
              if (s.id !== state.currentSceneId) return s;
              const arr = [...s.elements];
              const [moved] = arr.splice(fromIndex, 1);
              arr.splice(toIndex, 0, moved);
              // Re-atribui zIndex sequencialmente baseado na nova ordem
              const reindexed = arr.map((el, i) => ({ ...el, zIndex: i }));
              return { ...s, elements: reindexed };
            }),
            metadata: { ...state.layout.metadata, updatedAt: new Date().toISOString() },
          },
        })),

      toggleElementLock: (elementId) =>
        set((state) => ({
          layout: {
            ...state.layout,
            scenes: state.layout.scenes.map((s) =>
              s.id !== state.currentSceneId
                ? s
                : {
                    ...s,
                    elements: s.elements.map((el) =>
                      el.id !== elementId ? el : { ...el, locked: !el.locked },
                    ),
                  },
            ),
          },
        })),

      toggleElementVisible: (elementId) =>
        set((state) => ({
          layout: {
            ...state.layout,
            scenes: state.layout.scenes.map((s) =>
              s.id !== state.currentSceneId
                ? s
                : {
                    ...s,
                    elements: s.elements.map((el) =>
                      el.id !== elementId ? el : { ...el, visible: !el.visible },
                    ),
                  },
            ),
          },
        })),

      duplicateElements: (ids) =>
        set((state) => {
          const scene = state.layout.scenes.find((s) => s.id === state.currentSceneId);
          if (!scene) return state;
          const toDup = scene.elements.filter((el) => ids.includes(el.id));
          if (toDup.length === 0) return state;
          const copies = toDup.map((el) => ({
            ...el,
            id: crypto.randomUUID(),
            name: `${el.name} (copia)`,
            x: Math.min(100, el.x + 2),
            y: Math.min(100, el.y + 2),
            zIndex: scene.elements.length,
          }));
          return {
            layout: {
              ...state.layout,
              scenes: state.layout.scenes.map((s) =>
                s.id !== state.currentSceneId ? s : { ...s, elements: [...s.elements, ...copies] },
              ),
              metadata: { ...state.layout.metadata, updatedAt: new Date().toISOString() },
            },
            selectedIds: copies.map((c) => c.id),
          };
        }),

      selectAllInScene: () =>
        set((state) => {
          const scene = state.layout.scenes.find((s) => s.id === state.currentSceneId);
          if (!scene) return state;
          return { selectedIds: scene.elements.filter((el) => !el.locked).map((el) => el.id) };
        }),

      nudgeSelected: (deltaX, deltaY) =>
        set((state) => ({
          layout: {
            ...state.layout,
            scenes: state.layout.scenes.map((s) =>
              s.id !== state.currentSceneId
                ? s
                : {
                    ...s,
                    elements: s.elements.map((el) =>
                      !state.selectedIds.includes(el.id) || el.locked
                        ? el
                        : {
                            ...el,
                            x: Math.max(-100, Math.min(200, el.x + deltaX)),
                            y: Math.max(-100, Math.min(200, el.y + deltaY)),
                          },
                    ),
                  },
            ),
            metadata: { ...state.layout.metadata, updatedAt: new Date().toISOString() },
          },
        })),

      bringForward: (toFront) =>
        set((state) => {
          const scene = state.layout.scenes.find((s) => s.id === state.currentSceneId);
          if (!scene) return state;
          const maxZ = Math.max(0, ...scene.elements.map((el) => el.zIndex));
          return {
            layout: {
              ...state.layout,
              scenes: state.layout.scenes.map((s) =>
                s.id !== state.currentSceneId
                  ? s
                  : {
                      ...s,
                      elements: s.elements.map((el) =>
                        !state.selectedIds.includes(el.id)
                          ? el
                          : { ...el, zIndex: toFront ? maxZ + 1 : el.zIndex + 1 },
                      ),
                    },
              ),
            },
          };
        }),

      sendBackward: (toBack) =>
        set((state) => {
          const scene = state.layout.scenes.find((s) => s.id === state.currentSceneId);
          if (!scene) return state;
          const minZ = Math.min(0, ...scene.elements.map((el) => el.zIndex));
          return {
            layout: {
              ...state.layout,
              scenes: state.layout.scenes.map((s) =>
                s.id !== state.currentSceneId
                  ? s
                  : {
                      ...s,
                      elements: s.elements.map((el) =>
                        !state.selectedIds.includes(el.id)
                          ? el
                          : { ...el, zIndex: toBack ? minZ - 1 : el.zIndex - 1 },
                      ),
                    },
              ),
            },
          };
        }),

      alignSelected: (mode) =>
        set((state) => {
          const scene = state.layout.scenes.find((s) => s.id === state.currentSceneId);
          if (!scene) return state;
          const sel = scene.elements.filter((el) => state.selectedIds.includes(el.id));
          if (sel.length < 2) return state;

          // Calcula referencia (mais a esquerda, no centro, mais a direita, etc)
          let refValue = 0;
          if (mode === "left") refValue = Math.min(...sel.map((el) => el.x));
          else if (mode === "right") refValue = Math.max(...sel.map((el) => el.x + el.width));
          else if (mode === "center") {
            const minX = Math.min(...sel.map((el) => el.x));
            const maxX = Math.max(...sel.map((el) => el.x + el.width));
            refValue = (minX + maxX) / 2;
          } else if (mode === "top") refValue = Math.min(...sel.map((el) => el.y));
          else if (mode === "bottom") refValue = Math.max(...sel.map((el) => el.y + el.height));
          else if (mode === "middle") {
            const minY = Math.min(...sel.map((el) => el.y));
            const maxY = Math.max(...sel.map((el) => el.y + el.height));
            refValue = (minY + maxY) / 2;
          }

          return {
            layout: {
              ...state.layout,
              scenes: state.layout.scenes.map((s) => {
                if (s.id !== state.currentSceneId) return s;
                return {
                  ...s,
                  elements: s.elements.map((el) => {
                    if (!state.selectedIds.includes(el.id)) return el;
                    if (mode === "left") return { ...el, x: refValue };
                    if (mode === "right") return { ...el, x: refValue - el.width };
                    if (mode === "center") return { ...el, x: refValue - el.width / 2 };
                    if (mode === "top") return { ...el, y: refValue };
                    if (mode === "bottom") return { ...el, y: refValue - el.height };
                    if (mode === "middle") return { ...el, y: refValue - el.height / 2 };
                    return el;
                  }),
                };
              }),
              metadata: { ...state.layout.metadata, updatedAt: new Date().toISOString() },
            },
          };
        }),

      addChange: (change) =>
        set((state) => ({
          domChanges: [...state.domChanges, change],
        })),

      clearDomChanges: () =>
        set(() => ({
          domChanges: [],
        })),
    }),
    {
      // Apenas layout e selectedIds vao pro historico (UI state nao polui)
      partialize: (state) => ({
        layout: state.layout,
        selectedIds: state.selectedIds,
        domChanges: state.domChanges,
      }),
      limit: 50,
      equality: shallow,
    },
  ),
);

/**
 * Hook helper pra acessar a temporal API.
 * Uso: const { undo, redo, pause, resume } = useTemporal();
 */
export function useTemporal() {
  return useEditorStore.temporal.getState();
}
