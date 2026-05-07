(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/editor/state/schema.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * schema.ts
 *
 * Tipos TypeScript do schema de layout do editor.
 *
 * EM PALAVRAS SIMPLES: define como cada elemento e cada cena de um jogo
 * sao representados em codigo. O editor le e escreve esses tipos.
 *
 * TECNICAMENTE: define o JSON Schema do GameLayout, incluindo
 * elementos polimorficos (image/rect/text/placeholder), cenas
 * (variantes do mesmo jogo), background (image ou video) e
 * coordenadas em percentual da baseResolution.
 *
 * REGRA ABSOLUTA: NUNCA edite [Jogo]Layout.ts manualmente.
 * O arquivo eh auto-gerado pelo editor.
 */ // ===== Posicao e geometria =====
/**
 * Vec2: ponto 2D em coordenadas % do canvas.
 * Simples: {x: 50, y: 50} = centro.
 */ __turbopack_context__.s([
    "createBaseElement",
    ()=>createBaseElement,
    "createEmptyLayout",
    ()=>createEmptyLayout
]);
function createEmptyLayout(game, baseResolution, defaultBackground) {
    const now = new Date().toISOString();
    return {
        version: 1,
        game,
        baseResolution,
        scenes: [
            {
                id: "default",
                name: "Tela inicial",
                background: {
                    type: "image",
                    src: defaultBackground
                },
                elements: []
            }
        ],
        defaultSceneId: "default",
        metadata: {
            createdAt: now,
            updatedAt: now
        }
    };
}
function createBaseElement(overrides = {}) {
    return {
        id: crypto.randomUUID(),
        type: "rect",
        name: "Novo elemento",
        x: 50,
        y: 50,
        width: 10,
        height: 10,
        rotation: 0,
        zIndex: 0,
        anchor: "topLeft",
        locked: false,
        visible: true,
        opacity: 1,
        ...overrides
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/state/editorStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useEditorStore",
    ()=>useEditorStore,
    "useTemporal",
    ()=>useTemporal
]);
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
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zundo$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zundo/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$vanilla$2f$shallow$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/vanilla/shallow.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$schema$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/state/schema.ts [app-client] (ecmascript)");
;
;
;
;
const useEditorStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zundo$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["temporal"])((set)=>({
        // ===== STATE INICIAL =====
        targetId: "",
        layout: (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$schema$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEmptyLayout"])("none", {
            width: 1920,
            height: 1080
        }, ""),
        currentSceneId: "default",
        selectedIds: [],
        domChanges: [],
        // ===== ACTIONS =====
        setTarget: (targetId, baseRes, bgSrc)=>set(()=>{
                const layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$schema$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEmptyLayout"])(targetId, baseRes, bgSrc);
                return {
                    targetId,
                    layout,
                    currentSceneId: layout.defaultSceneId,
                    selectedIds: []
                };
            }),
        setLayout: (layout)=>set(()=>({
                    layout,
                    currentSceneId: layout.defaultSceneId,
                    selectedIds: []
                })),
        setCurrentScene: (sceneId)=>set(()=>({
                    currentSceneId: sceneId,
                    selectedIds: []
                })),
        setSelection: (ids)=>set(()=>({
                    selectedIds: ids
                })),
        addElement: (element)=>set((state)=>({
                    layout: {
                        ...state.layout,
                        scenes: state.layout.scenes.map((s)=>s.id !== state.currentSceneId ? s : {
                                ...s,
                                elements: [
                                    ...s.elements,
                                    element
                                ]
                            }),
                        metadata: {
                            ...state.layout.metadata,
                            updatedAt: new Date().toISOString()
                        }
                    },
                    selectedIds: [
                        element.id
                    ]
                })),
        updateElement: (elementId, patch)=>set((state)=>({
                    layout: {
                        ...state.layout,
                        scenes: state.layout.scenes.map((s)=>s.id !== state.currentSceneId ? s : {
                                ...s,
                                elements: s.elements.map((el)=>el.id !== elementId ? el : {
                                        ...el,
                                        ...patch
                                    })
                            }),
                        metadata: {
                            ...state.layout.metadata,
                            updatedAt: new Date().toISOString()
                        }
                    }
                })),
        deleteElements: (ids)=>set((state)=>({
                    layout: {
                        ...state.layout,
                        scenes: state.layout.scenes.map((s)=>s.id !== state.currentSceneId ? s : {
                                ...s,
                                elements: s.elements.filter((el)=>!ids.includes(el.id))
                            }),
                        metadata: {
                            ...state.layout.metadata,
                            updatedAt: new Date().toISOString()
                        }
                    },
                    selectedIds: []
                })),
        addScene: (scene)=>set((state)=>({
                    layout: {
                        ...state.layout,
                        scenes: [
                            ...state.layout.scenes,
                            scene
                        ]
                    },
                    currentSceneId: scene.id,
                    selectedIds: []
                })),
        duplicateScene: (sceneId, newId, newName)=>set((state)=>{
                const orig = state.layout.scenes.find((s)=>s.id === sceneId);
                if (!orig) return state;
                const copy = {
                    ...orig,
                    id: newId,
                    name: newName,
                    elements: orig.elements.map((el)=>({
                            ...el,
                            id: crypto.randomUUID()
                        }))
                };
                return {
                    layout: {
                        ...state.layout,
                        scenes: [
                            ...state.layout.scenes,
                            copy
                        ]
                    },
                    currentSceneId: newId,
                    selectedIds: []
                };
            }),
        renameScene: (sceneId, newName)=>set((state)=>({
                    layout: {
                        ...state.layout,
                        scenes: state.layout.scenes.map((s)=>s.id !== sceneId ? s : {
                                ...s,
                                name: newName
                            })
                    }
                })),
        setSceneBackground: (sceneId, bg)=>set((state)=>({
                    layout: {
                        ...state.layout,
                        scenes: state.layout.scenes.map((s)=>s.id !== sceneId ? s : {
                                ...s,
                                background: bg
                            }),
                        metadata: {
                            ...state.layout.metadata,
                            updatedAt: new Date().toISOString()
                        }
                    }
                })),
        deleteScene: (sceneId)=>set((state)=>{
                if (state.layout.scenes.length <= 1) return state; // proibe deletar ultima
                const newScenes = state.layout.scenes.filter((s)=>s.id !== sceneId);
                const newCurrent = state.currentSceneId === sceneId ? newScenes[0]?.id ?? "" : state.currentSceneId;
                return {
                    layout: {
                        ...state.layout,
                        scenes: newScenes
                    },
                    currentSceneId: newCurrent,
                    selectedIds: []
                };
            }),
        reorderElement: (elementId, newZIndex)=>set((state)=>({
                    layout: {
                        ...state.layout,
                        scenes: state.layout.scenes.map((s)=>s.id !== state.currentSceneId ? s : {
                                ...s,
                                elements: s.elements.map((el)=>el.id !== elementId ? el : {
                                        ...el,
                                        zIndex: newZIndex
                                    })
                            })
                    }
                })),
        reorderElementsList: (fromIndex, toIndex)=>set((state)=>({
                    layout: {
                        ...state.layout,
                        scenes: state.layout.scenes.map((s)=>{
                            if (s.id !== state.currentSceneId) return s;
                            const arr = [
                                ...s.elements
                            ];
                            const [moved] = arr.splice(fromIndex, 1);
                            arr.splice(toIndex, 0, moved);
                            // Re-atribui zIndex sequencialmente baseado na nova ordem
                            const reindexed = arr.map((el, i)=>({
                                    ...el,
                                    zIndex: i
                                }));
                            return {
                                ...s,
                                elements: reindexed
                            };
                        }),
                        metadata: {
                            ...state.layout.metadata,
                            updatedAt: new Date().toISOString()
                        }
                    }
                })),
        toggleElementLock: (elementId)=>set((state)=>({
                    layout: {
                        ...state.layout,
                        scenes: state.layout.scenes.map((s)=>s.id !== state.currentSceneId ? s : {
                                ...s,
                                elements: s.elements.map((el)=>el.id !== elementId ? el : {
                                        ...el,
                                        locked: !el.locked
                                    })
                            })
                    }
                })),
        toggleElementVisible: (elementId)=>set((state)=>({
                    layout: {
                        ...state.layout,
                        scenes: state.layout.scenes.map((s)=>s.id !== state.currentSceneId ? s : {
                                ...s,
                                elements: s.elements.map((el)=>el.id !== elementId ? el : {
                                        ...el,
                                        visible: !el.visible
                                    })
                            })
                    }
                })),
        duplicateElements: (ids)=>set((state)=>{
                const scene = state.layout.scenes.find((s)=>s.id === state.currentSceneId);
                if (!scene) return state;
                const toDup = scene.elements.filter((el)=>ids.includes(el.id));
                if (toDup.length === 0) return state;
                const copies = toDup.map((el)=>({
                        ...el,
                        id: crypto.randomUUID(),
                        name: `${el.name} (copia)`,
                        x: Math.min(100, el.x + 2),
                        y: Math.min(100, el.y + 2),
                        zIndex: scene.elements.length
                    }));
                return {
                    layout: {
                        ...state.layout,
                        scenes: state.layout.scenes.map((s)=>s.id !== state.currentSceneId ? s : {
                                ...s,
                                elements: [
                                    ...s.elements,
                                    ...copies
                                ]
                            }),
                        metadata: {
                            ...state.layout.metadata,
                            updatedAt: new Date().toISOString()
                        }
                    },
                    selectedIds: copies.map((c)=>c.id)
                };
            }),
        selectAllInScene: ()=>set((state)=>{
                const scene = state.layout.scenes.find((s)=>s.id === state.currentSceneId);
                if (!scene) return state;
                return {
                    selectedIds: scene.elements.filter((el)=>!el.locked).map((el)=>el.id)
                };
            }),
        nudgeSelected: (deltaX, deltaY)=>set((state)=>({
                    layout: {
                        ...state.layout,
                        scenes: state.layout.scenes.map((s)=>s.id !== state.currentSceneId ? s : {
                                ...s,
                                elements: s.elements.map((el)=>!state.selectedIds.includes(el.id) || el.locked ? el : {
                                        ...el,
                                        x: Math.max(-100, Math.min(200, el.x + deltaX)),
                                        y: Math.max(-100, Math.min(200, el.y + deltaY))
                                    })
                            }),
                        metadata: {
                            ...state.layout.metadata,
                            updatedAt: new Date().toISOString()
                        }
                    }
                })),
        bringForward: (toFront)=>set((state)=>{
                const scene = state.layout.scenes.find((s)=>s.id === state.currentSceneId);
                if (!scene) return state;
                const maxZ = Math.max(0, ...scene.elements.map((el)=>el.zIndex));
                return {
                    layout: {
                        ...state.layout,
                        scenes: state.layout.scenes.map((s)=>s.id !== state.currentSceneId ? s : {
                                ...s,
                                elements: s.elements.map((el)=>!state.selectedIds.includes(el.id) ? el : {
                                        ...el,
                                        zIndex: toFront ? maxZ + 1 : el.zIndex + 1
                                    })
                            })
                    }
                };
            }),
        sendBackward: (toBack)=>set((state)=>{
                const scene = state.layout.scenes.find((s)=>s.id === state.currentSceneId);
                if (!scene) return state;
                const minZ = Math.min(0, ...scene.elements.map((el)=>el.zIndex));
                return {
                    layout: {
                        ...state.layout,
                        scenes: state.layout.scenes.map((s)=>s.id !== state.currentSceneId ? s : {
                                ...s,
                                elements: s.elements.map((el)=>!state.selectedIds.includes(el.id) ? el : {
                                        ...el,
                                        zIndex: toBack ? minZ - 1 : el.zIndex - 1
                                    })
                            })
                    }
                };
            }),
        alignSelected: (mode)=>set((state)=>{
                const scene = state.layout.scenes.find((s)=>s.id === state.currentSceneId);
                if (!scene) return state;
                const sel = scene.elements.filter((el)=>state.selectedIds.includes(el.id));
                if (sel.length < 2) return state;
                // Calcula referencia (mais a esquerda, no centro, mais a direita, etc)
                let refValue = 0;
                if (mode === "left") refValue = Math.min(...sel.map((el)=>el.x));
                else if (mode === "right") refValue = Math.max(...sel.map((el)=>el.x + el.width));
                else if (mode === "center") {
                    const minX = Math.min(...sel.map((el)=>el.x));
                    const maxX = Math.max(...sel.map((el)=>el.x + el.width));
                    refValue = (minX + maxX) / 2;
                } else if (mode === "top") refValue = Math.min(...sel.map((el)=>el.y));
                else if (mode === "bottom") refValue = Math.max(...sel.map((el)=>el.y + el.height));
                else if (mode === "middle") {
                    const minY = Math.min(...sel.map((el)=>el.y));
                    const maxY = Math.max(...sel.map((el)=>el.y + el.height));
                    refValue = (minY + maxY) / 2;
                }
                return {
                    layout: {
                        ...state.layout,
                        scenes: state.layout.scenes.map((s)=>{
                            if (s.id !== state.currentSceneId) return s;
                            return {
                                ...s,
                                elements: s.elements.map((el)=>{
                                    if (!state.selectedIds.includes(el.id)) return el;
                                    if (mode === "left") return {
                                        ...el,
                                        x: refValue
                                    };
                                    if (mode === "right") return {
                                        ...el,
                                        x: refValue - el.width
                                    };
                                    if (mode === "center") return {
                                        ...el,
                                        x: refValue - el.width / 2
                                    };
                                    if (mode === "top") return {
                                        ...el,
                                        y: refValue
                                    };
                                    if (mode === "bottom") return {
                                        ...el,
                                        y: refValue - el.height
                                    };
                                    if (mode === "middle") return {
                                        ...el,
                                        y: refValue - el.height / 2
                                    };
                                    return el;
                                })
                            };
                        }),
                        metadata: {
                            ...state.layout.metadata,
                            updatedAt: new Date().toISOString()
                        }
                    }
                };
            }),
        addChange: (change)=>set((state)=>({
                    domChanges: [
                        ...state.domChanges,
                        change
                    ]
                })),
        clearDomChanges: ()=>set(()=>({
                    domChanges: []
                }))
    }), {
    // Apenas layout e selectedIds vao pro historico (UI state nao polui)
    partialize: (state)=>({
            layout: state.layout,
            selectedIds: state.selectedIds,
            domChanges: state.domChanges
        }),
    limit: 50,
    equality: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$vanilla$2f$shallow$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shallow"]
}));
function useTemporal() {
    return useEditorStore.temporal.getState();
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/utils/useEditorKeys.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useEditorKeys",
    ()=>useEditorKeys
]);
/**
 * useEditorKeys.ts
 *
 * Hook de atalhos de teclado do editor iframe.
 * 20 atalhos pra produtividade maxima.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
function useEditorKeys({ selected, iframeRef, gameMode, setGameMode, setSelected, onSelectElement, pushUndo, handleUndo, handleRedo, makeInfo, updateHighlight, toggleLock, toggleHide }) {
    _s();
    /** Mover elemento selecionado por delta px */ const nudge = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useEditorKeys.useCallback[nudge]": (dx, dy)=>{
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
        }
    }["useEditorKeys.useCallback[nudge]"], [
        selected,
        pushUndo,
        updateHighlight,
        makeInfo,
        setSelected,
        onSelectElement
    ]);
    /** Selecionar pai do elemento atual */ const selectParent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useEditorKeys.useCallback[selectParent]": ()=>{
            if (!selected) return;
            const parent = selected.element.parentElement;
            if (!parent || parent.tagName === "BODY" || parent.tagName === "HTML") return;
            const info = makeInfo(parent);
            setSelected(info);
            onSelectElement?.(info);
            updateHighlight();
        }
    }["useEditorKeys.useCallback[selectParent]"], [
        selected,
        makeInfo,
        setSelected,
        onSelectElement,
        updateHighlight
    ]);
    /** Selecionar primeiro filho do elemento atual */ const selectChild = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useEditorKeys.useCallback[selectChild]": ()=>{
            if (!selected) return;
            const child = selected.element.children[0];
            if (!child) return;
            const info = makeInfo(child);
            setSelected(info);
            onSelectElement?.(info);
            updateHighlight();
        }
    }["useEditorKeys.useCallback[selectChild]"], [
        selected,
        makeInfo,
        setSelected,
        onSelectElement,
        updateHighlight
    ]);
    /** Selecionar proximo irmao */ const selectNext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useEditorKeys.useCallback[selectNext]": ()=>{
            if (!selected) return;
            const next = selected.element.nextElementSibling;
            if (!next) return;
            const info = makeInfo(next);
            setSelected(info);
            onSelectElement?.(info);
            updateHighlight();
        }
    }["useEditorKeys.useCallback[selectNext]"], [
        selected,
        makeInfo,
        setSelected,
        onSelectElement,
        updateHighlight
    ]);
    /** Selecionar irmao anterior */ const selectPrev = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useEditorKeys.useCallback[selectPrev]": ()=>{
            if (!selected) return;
            const prev = selected.element.previousElementSibling;
            if (!prev) return;
            const info = makeInfo(prev);
            setSelected(info);
            onSelectElement?.(info);
            updateHighlight();
        }
    }["useEditorKeys.useCallback[selectPrev]"], [
        selected,
        makeInfo,
        setSelected,
        onSelectElement,
        updateHighlight
    ]);
    /** Esconder/mostrar elemento */ const toggleVisibility = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useEditorKeys.useCallback[toggleVisibility]": ()=>{
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
        }
    }["useEditorKeys.useCallback[toggleVisibility]"], [
        selected,
        pushUndo,
        toggleHide,
        setSelected,
        onSelectElement,
        updateHighlight
    ]);
    /** Lock toggle */ const handleToggleLock = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useEditorKeys.useCallback[handleToggleLock]": ()=>{
            if (!selected || !toggleLock) return;
            toggleLock(selected.element);
        }
    }["useEditorKeys.useCallback[handleToggleLock]"], [
        selected,
        toggleLock
    ]);
    /** Resetar mudancas do elemento */ const resetElement = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useEditorKeys.useCallback[resetElement]": ()=>{
            if (!selected) return;
            pushUndo(selected.element);
            selected.element.setAttribute("style", selected.originalStyle);
            const info = makeInfo(selected.element);
            setSelected(info);
            onSelectElement?.(info);
            updateHighlight();
        }
    }["useEditorKeys.useCallback[resetElement]"], [
        selected,
        pushUndo,
        makeInfo,
        setSelected,
        onSelectElement,
        updateHighlight
    ]);
    /** Rotacionar */ const rotate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useEditorKeys.useCallback[rotate]": (deg)=>{
            if (!selected) return;
            pushUndo(selected.element);
            const el = selected.element;
            const current = el.style.transform || "";
            const match = current.match(/rotate\(([^)]+)\)/);
            const prevDeg = match ? parseFloat(match[1]) : 0;
            const clean = current.replace(/rotate\([^)]*\)/g, "").trim();
            el.style.transform = `${clean} rotate(${prevDeg + deg}deg)`.trim();
            updateHighlight();
        }
    }["useEditorKeys.useCallback[rotate]"], [
        selected,
        pushUndo,
        updateHighlight
    ]);
    /** Z-index */ const changeZIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useEditorKeys.useCallback[changeZIndex]": (delta)=>{
            if (!selected) return;
            pushUndo(selected.element);
            const el = selected.element;
            const current = parseInt(el.style.zIndex || "0", 10) || 0;
            el.style.zIndex = String(current + delta);
        }
    }["useEditorKeys.useCallback[changeZIndex]"], [
        selected,
        pushUndo
    ]);
    /** Resetar transformacoes */ const resetTransform = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useEditorKeys.useCallback[resetTransform]": ()=>{
            if (!selected) return;
            pushUndo(selected.element);
            selected.element.style.transform = "";
            updateHighlight();
        }
    }["useEditorKeys.useCallback[resetTransform]"], [
        selected,
        pushUndo,
        updateHighlight
    ]);
    // Handler principal
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useEditorKeys.useEffect": ()=>{
            const onKey = {
                "useEditorKeys.useEffect.onKey": (e)=>{
                    const tag = e.target?.tagName;
                    const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
                    // Ctrl+Z / Ctrl+Y — funciona sempre
                    if ((e.ctrlKey || e.metaKey) && !isInput) {
                        if (e.key === "z" || e.key === "Z") {
                            e.preventDefault();
                            if (e.shiftKey) handleRedo();
                            else handleUndo();
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
                        setGameMode({
                            "useEditorKeys.useEffect.onKey": (prev)=>!prev
                        }["useEditorKeys.useEffect.onKey"]);
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
                    if ([
                        "ArrowUp",
                        "ArrowDown",
                        "ArrowLeft",
                        "ArrowRight"
                    ].includes(e.key) && selected) {
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
                        if (e.shiftKey) selectPrev();
                        else selectNext();
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
                }
            }["useEditorKeys.useEffect.onKey"];
            window.addEventListener("keydown", onKey);
            return ({
                "useEditorKeys.useEffect": ()=>window.removeEventListener("keydown", onKey)
            })["useEditorKeys.useEffect"];
        }
    }["useEditorKeys.useEffect"], [
        selected,
        gameMode,
        handleUndo,
        handleRedo,
        setGameMode,
        setSelected,
        onSelectElement,
        nudge,
        selectParent,
        selectChild,
        selectNext,
        selectPrev,
        toggleVisibility,
        resetElement,
        rotate,
        changeZIndex,
        resetTransform,
        handleToggleLock
    ]);
}
_s(useEditorKeys, "93G5gJN69DxCxsEdapMd1vwcv3c=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/ResizeHandles.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ResizeHandles
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * ResizeHandles.tsx
 *
 * 8 handles de resize ao redor do elemento selecionado.
 * Cantos: nw, ne, sw, se. Lados: n, s, e, w.
 * Shift = manter proporcao. Ctrl = resize simetrico.
 *
 * Recebe highlightRect (coords no espaco do container),
 * o elemento DOM real, e callbacks pra pushUndo + updateHighlight.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
const HANDLE_SIZE = 8;
const HANDLE_CURSORS = {
    nw: "nw-resize",
    n: "n-resize",
    ne: "ne-resize",
    e: "e-resize",
    se: "se-resize",
    s: "s-resize",
    sw: "sw-resize",
    w: "w-resize"
};
/** Posicao de cada handle relativa ao rect */ function handlePosition(pos, rect) {
    const half = HANDLE_SIZE / 2;
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    switch(pos){
        case "nw":
            return {
                left: rect.x - half,
                top: rect.y - half
            };
        case "n":
            return {
                left: cx - half,
                top: rect.y - half
            };
        case "ne":
            return {
                left: rect.x + rect.width - half,
                top: rect.y - half
            };
        case "e":
            return {
                left: rect.x + rect.width - half,
                top: cy - half
            };
        case "se":
            return {
                left: rect.x + rect.width - half,
                top: rect.y + rect.height - half
            };
        case "s":
            return {
                left: cx - half,
                top: rect.y + rect.height - half
            };
        case "sw":
            return {
                left: rect.x - half,
                top: rect.y + rect.height - half
            };
        case "w":
            return {
                left: rect.x - half,
                top: cy - half
            };
    }
}
function ResizeHandles({ rect, element, scale, onResizeStart, onResizeEnd, onResizeMove }) {
    _s();
    const [activeHandle, setActiveHandle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const startRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const handleMouseDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ResizeHandles.useCallback[handleMouseDown]": (pos, e)=>{
            e.preventDefault();
            e.stopPropagation();
            const elRect = element.getBoundingClientRect();
            const origWidth = elRect.width;
            const origHeight = elRect.height;
            startRef.current = {
                mouseX: e.clientX,
                mouseY: e.clientY,
                origWidth,
                origHeight,
                origLeft: elRect.left,
                origTop: elRect.top,
                aspectRatio: origWidth / (origHeight || 1)
            };
            setActiveHandle(pos);
            onResizeStart();
            const onMove = {
                "ResizeHandles.useCallback[handleMouseDown].onMove": (me)=>{
                    if (!startRef.current) return;
                    const s = startRef.current;
                    // Delta em pixels reais do iframe (compensar escala)
                    let dxReal = (me.clientX - s.mouseX) / scale;
                    let dyReal = (me.clientY - s.mouseY) / scale;
                    let newW = s.origWidth;
                    let newH = s.origHeight;
                    // Calcular novo tamanho baseado na posicao do handle
                    const affectsRight = pos === "e" || pos === "ne" || pos === "se";
                    const affectsLeft = pos === "w" || pos === "nw" || pos === "sw";
                    const affectsBottom = pos === "s" || pos === "se" || pos === "sw";
                    const affectsTop = pos === "n" || pos === "nw" || pos === "ne";
                    if (affectsRight) newW = s.origWidth + dxReal;
                    if (affectsLeft) newW = s.origWidth - dxReal;
                    if (affectsBottom) newH = s.origHeight + dyReal;
                    if (affectsTop) newH = s.origHeight - dyReal;
                    // Shift = manter proporcao
                    if (me.shiftKey) {
                        const isCorner = pos === "nw" || pos === "ne" || pos === "sw" || pos === "se";
                        if (isCorner) {
                            const ratio = s.aspectRatio;
                            if (Math.abs(dxReal) > Math.abs(dyReal)) {
                                newH = newW / ratio;
                            } else {
                                newW = newH * ratio;
                            }
                        }
                    }
                    // Minimo 10px
                    newW = Math.max(10, newW);
                    newH = Math.max(10, newH);
                    // Aplicar ao elemento
                    element.style.width = `${Math.round(newW)}px`;
                    element.style.height = `${Math.round(newH)}px`;
                    // Se redimensionou pela esquerda ou topo, compensar posicao
                    if (affectsLeft) {
                        const offsetX = s.origWidth - newW;
                        const currentTransform = element.style.transform || "";
                        const matchT = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                        const baseX = matchT ? parseFloat(matchT[1]) : 0;
                        const baseY = matchT ? parseFloat(matchT[2]) : 0;
                        const cleanT = currentTransform.replace(/translate\([^)]*\)/g, "").trim();
                        element.style.transform = `${cleanT} translate(${baseX + offsetX}px, ${baseY}px)`.trim();
                    }
                    if (affectsTop) {
                        const offsetY = s.origHeight - newH;
                        const currentTransform = element.style.transform || "";
                        const matchT = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                        const baseX = matchT ? parseFloat(matchT[1]) : 0;
                        const baseY = matchT ? parseFloat(matchT[2]) : 0;
                        const cleanT = currentTransform.replace(/translate\([^)]*\)/g, "").trim();
                        element.style.transform = `${cleanT} translate(${baseX}px, ${baseY + offsetY}px)`.trim();
                    }
                    onResizeMove();
                }
            }["ResizeHandles.useCallback[handleMouseDown].onMove"];
            const onUp = {
                "ResizeHandles.useCallback[handleMouseDown].onUp": ()=>{
                    setActiveHandle(null);
                    startRef.current = null;
                    document.removeEventListener("mousemove", onMove);
                    document.removeEventListener("mouseup", onUp);
                    onResizeEnd();
                }
            }["ResizeHandles.useCallback[handleMouseDown].onUp"];
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        }
    }["ResizeHandles.useCallback[handleMouseDown]"], [
        element,
        scale,
        onResizeStart,
        onResizeEnd,
        onResizeMove
    ]);
    const handles = [
        "nw",
        "n",
        "ne",
        "e",
        "se",
        "s",
        "sw",
        "w"
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: handles.map((pos)=>{
            const { left, top } = handlePosition(pos, rect);
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                onMouseDown: (e)=>handleMouseDown(pos, e),
                style: {
                    position: "absolute",
                    left,
                    top,
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                    background: activeHandle === pos ? "#FFD700" : "#D4A843",
                    border: "1px solid #080604",
                    borderRadius: pos === "n" || pos === "s" || pos === "e" || pos === "w" ? 1 : 2,
                    cursor: HANDLE_CURSORS[pos],
                    zIndex: 14,
                    boxShadow: "0 0 4px rgba(0,0,0,0.5)",
                    transition: activeHandle ? "none" : "background 0.1s"
                },
                title: `Resize ${pos}${"\n"}Shift = proporcional`
            }, pos, false, {
                fileName: "[project]/components/editor/ResizeHandles.tsx",
                lineNumber: 189,
                columnNumber: 11
            }, this);
        })
    }, void 0, false);
}
_s(ResizeHandles, "/GerW7//2EdQeuz2lBuq/0pM/60=");
_c = ResizeHandles;
var _c;
__turbopack_context__.k.register(_c, "ResizeHandles");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/IframeEditor.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>IframeEditor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
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
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/state/editorStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$utils$2f$useEditorKeys$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/utils/useEditorKeys.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$ResizeHandles$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/ResizeHandles.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
/**
 * URL do jogo usa path relativo (/game/X) — o next.config.mjs com
 * EDITOR_MODE=1 faz rewrite /game/* → casino:3000/game/*.
 * Resultado: iframe mesma origin = contentWindow.document acessivel.
 */ /** Gerar ID unico pra cada elemento descoberto */ let idCounter = 0;
function nextEditorId() {
    return `ed-${++idCounter}`;
}
function IframeEditor({ gameId, activeFile = "", onSelectElement, onIframeRef, onIframeLoaded }) {
    _s();
    const iframeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const overlayRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Expor iframe ref pro pai (DomTreePanel)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "IframeEditor.useEffect": ()=>{
            onIframeRef?.(iframeRef);
        }
    }["IframeEditor.useEffect"], [
        onIframeRef
    ]);
    // Elemento DOM selecionado (primario — ultimo clicado)
    const [selected, setSelected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Multi-select: elementos adicionais selecionados com Shift+Click
    const [multiSelected, setMultiSelected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    // Highlight rect (posicao relativa ao container)
    const [highlightRect, setHighlightRect] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Multi highlight rects
    const [multiRects, setMultiRects] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    // Hover rect (elemento sob o mouse)
    const [hoverRect, setHoverRect] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Context menu pra selecionar entre elementos sobrepostos (estilo Figma)
    const [contextMenu, setContextMenu] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Iframe carregado
    const [iframeLoaded, setIframeLoaded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Scale ref — atualizado quando scale muda, usado em callbacks que rodam antes da declaracao de scale
    const scaleRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0.5);
    // Drag state
    const [dragging, setDragging] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const dragStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Modo Jogo: desativa overlay pra interagir com o jogo
    const [gameMode, setGameMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Hand tool: modo pan permanente (maozinha)
    const [handTool, setHandTool] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Undo/Redo stack — SOMENTE edicoes (zoom/pan/selecao NUNCA entram)
    // Pesquisa X0: Photoshop, VS Code, Figma — navegacao nao eh edicao
    const UNDO_LIMIT = 50;
    const undoStack = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const redoStack = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const [undoCount, setUndoCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [redoCount, setRedoCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [hasChanges, setHasChanges] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [lastUndoDesc, setLastUndoDesc] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    /** Gerar descricao legivel do elemento */ const describeElement = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IframeEditor.useCallback[describeElement]": (el)=>{
            const tag = el.tagName.toLowerCase();
            const cls = el.className ? `.${el.className.toString().split(" ")[0]}` : "";
            const text = (el.textContent || "").trim().slice(0, 15);
            return text ? `${tag}${cls} "${text}"` : `${tag}${cls}`;
        }
    }["IframeEditor.useCallback[describeElement]"], []);
    /** Salvar snapshot do style atual ANTES de uma mudanca */ const pushUndo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IframeEditor.useCallback[pushUndo]": (el, desc)=>{
            const elementTag = describeElement(el);
            undoStack.current.push({
                type: "style",
                element: el,
                styleSnapshot: el.getAttribute("style") || "",
                description: desc || `edit ${elementTag}`,
                elementTag
            });
            if (undoStack.current.length > UNDO_LIMIT) {
                undoStack.current.shift();
            }
            redoStack.current = [];
            setUndoCount(undoStack.current.length);
            setRedoCount(0);
            setHasChanges(true);
        }
    }["IframeEditor.useCallback[pushUndo]"], [
        describeElement
    ]);
    /** Ctrl+Z: desfazer — SOMENTE edicoes, nunca zoom/pan */ const handleUndo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IframeEditor.useCallback[handleUndo]": ()=>{
            const entry = undoStack.current.pop();
            if (!entry) return;
            redoStack.current.push({
                ...entry,
                styleSnapshot: entry.element.getAttribute("style") || ""
            });
            entry.element.setAttribute("style", entry.styleSnapshot);
            // Se o undo restaurou um elemento que estava oculto, sincronizar hiddenIds
            if (entry.description.startsWith('hide ') || entry.description.startsWith('show ')) {
                const eid = entry.element.getAttribute('data-editor-idx');
                if (eid) {
                    const restoredStyle = entry.styleSnapshot;
                    const isNowHidden = restoredStyle.includes('opacity: 0') || restoredStyle.includes('opacity:0');
                    setHiddenIds({
                        "IframeEditor.useCallback[handleUndo]": (prev)=>{
                            const next = new Set(prev);
                            if (isNowHidden) next.add(eid);
                            else {
                                next.delete(eid);
                                hiddenElements.current.delete(eid);
                            }
                            return next;
                        }
                    }["IframeEditor.useCallback[handleUndo]"]);
                    if (!isNowHidden) {
                        hiddenElements.current.delete(eid);
                    }
                }
            }
            setUndoCount(undoStack.current.length);
            setRedoCount(redoStack.current.length);
            setLastUndoDesc(`Desfeito: ${entry.description}`);
            if (undoStack.current.length === 0) setHasChanges(false);
        }
    }["IframeEditor.useCallback[handleUndo]"], []);
    /** Ctrl+Y: refazer */ const handleRedo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IframeEditor.useCallback[handleRedo]": ()=>{
            const entry = redoStack.current.pop();
            if (!entry) return;
            undoStack.current.push({
                ...entry,
                styleSnapshot: entry.element.getAttribute("style") || ""
            });
            entry.element.setAttribute("style", entry.styleSnapshot);
            setUndoCount(undoStack.current.length);
            setRedoCount(redoStack.current.length);
            setLastUndoDesc(`Refeito: ${entry.description}`);
            setHasChanges(true);
        }
    }["IframeEditor.useCallback[handleRedo]"], []);
    // Expor pushUndo pra o DomPropsPanel via window event
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "IframeEditor.useEffect": ()=>{
            const handler = {
                "IframeEditor.useEffect.handler": (e)=>{
                    const detail = e.detail;
                    if (detail?.element) pushUndo(detail.element);
                }
            }["IframeEditor.useEffect.handler"];
            window.addEventListener("editor:push-undo", handler);
            return ({
                "IframeEditor.useEffect": ()=>window.removeEventListener("editor:push-undo", handler)
            })["IframeEditor.useEffect"];
        }
    }["IframeEditor.useEffect"], [
        pushUndo
    ]);
    // Store
    const addChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "IframeEditor.useEditorStore[addChange]": (s)=>s.addChange
    }["IframeEditor.useEditorStore[addChange]"]);
    // ═══════════════════════════════════════════════════════
    // LOCK + SMART SELECT (Pesquisa X0 #3 — Protecao de Elementos)
    // ═══════════════════════════════════════════════════════
    // Auto-lock: niveis 0-2 do DOM travados por padrao (body, root, wrapper)
    // Manual lock: usuario pode travar/destravar via atalho L
    // Hidden: ocultar elementos que atrapalham via atalho H
    const [lockedIds, setLockedIds] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const [manualLockedIds, setManualLockedIds] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const [hiddenIds, setHiddenIds] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const [smartSelect, setSmartSelect] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true); // ON por padrao
    /** Verificar se elemento eh visualmente relevante (nao eh wrapper vazio) */ const isVisuallyRelevant = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IframeEditor.useCallback[isVisuallyRelevant]": (el)=>{
            try {
                const style = window.getComputedStyle ? el.ownerDocument.defaultView.getComputedStyle(el) : el.currentStyle;
                if (!style) return true;
                const hasBg = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent' && style.backgroundColor !== '';
                const hasBgImage = style.backgroundImage !== 'none' && style.backgroundImage !== '';
                const hasBorder = parseFloat(style.borderWidth || '0') > 0 && style.borderStyle !== 'none';
                const hasText = el.childNodes.length > 0 && Array.from(el.childNodes).some({
                    "IframeEditor.useCallback[isVisuallyRelevant]": (n)=>n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length > 0
                }["IframeEditor.useCallback[isVisuallyRelevant]"]);
                const isVisualTag = [
                    'IMG',
                    'VIDEO',
                    'CANVAS',
                    'SVG',
                    'BUTTON',
                    'INPUT',
                    'A',
                    'SELECT',
                    'TEXTAREA'
                ].includes(el.tagName);
                return hasBg || hasBgImage || hasBorder || hasText || isVisualTag;
            } catch  {
                return true;
            }
        }
    }["IframeEditor.useCallback[isVisuallyRelevant]"], []);
    /** Verificar se elemento deve ser ignorado na selecao (auto-lock via lockedIds) */ const isAutoLocked = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IframeEditor.useCallback[isAutoLocked]": (el)=>{
            if (el.tagName === 'BODY' || el.tagName === 'HTML') return true;
            // Auto-lock eh populado no iframe onLoad (niveis 0-1)
            // Entao basta checar se o id esta no set
            const eid = el.getAttribute('data-editor-idx');
            return eid ? lockedIds.has(eid) : false;
        }
    }["IframeEditor.useCallback[isAutoLocked]"], [
        lockedIds
    ]);
    /** Verificar se elemento esta locked (auto ou manual — tudo em lockedIds) */ const isLocked = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IframeEditor.useCallback[isLocked]": (el)=>{
            if (el.tagName === 'BODY' || el.tagName === 'HTML') return true;
            const eid = el.getAttribute('data-editor-idx');
            return eid ? lockedIds.has(eid) : false;
        }
    }["IframeEditor.useCallback[isLocked]"], [
        lockedIds
    ]);
    /** Toggle lock manual */ /** Toggle lock manual — separado do auto-lock pra não confundir */ const toggleLock = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IframeEditor.useCallback[toggleLock]": (el)=>{
            let eid = el.getAttribute('data-editor-idx');
            if (!eid) {
                eid = nextEditorId();
                el.setAttribute('data-editor-idx', eid);
            }
            // Toggle no manual lock
            setManualLockedIds({
                "IframeEditor.useCallback[toggleLock]": (prev)=>{
                    const next = new Set(prev);
                    if (next.has(eid)) next.delete(eid);
                    else next.add(eid);
                    return next;
                }
            }["IframeEditor.useCallback[toggleLock]"]);
            // Tambem toggle no lockedIds geral
            setLockedIds({
                "IframeEditor.useCallback[toggleLock]": (prev)=>{
                    const next = new Set(prev);
                    if (next.has(eid)) next.delete(eid);
                    else next.add(eid);
                    return next;
                }
            }["IframeEditor.useCallback[toggleLock]"]);
        }
    }["IframeEditor.useCallback[toggleLock]"], []);
    /** Toggle hide — oculta com opacity 0 + pointer-events none (mantém layout)
   *  IMPORTANTE: pushUndo ANTES de ocultar pra Ctrl+Z restaurar
   */ const hiddenElements = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Map());
    const toggleHide = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IframeEditor.useCallback[toggleHide]": (el)=>{
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
                setHiddenIds({
                    "IframeEditor.useCallback[toggleHide]": (prev)=>{
                        const next = new Set(prev);
                        next.delete(eid);
                        return next;
                    }
                }["IframeEditor.useCallback[toggleHide]"]);
            } else {
                // Ocultar — usa opacity 0 (nao visibility hidden que quebra layout)
                el.style.opacity = '0';
                el.style.pointerEvents = 'none';
                hiddenElements.current.set(eid, el);
                setHiddenIds({
                    "IframeEditor.useCallback[toggleHide]": (prev)=>{
                        const next = new Set(prev);
                        next.add(eid);
                        return next;
                    }
                }["IframeEditor.useCallback[toggleHide]"]);
            }
        }
    }["IframeEditor.useCallback[toggleHide]"], [
        hiddenIds,
        pushUndo
    ]);
    /** Restaurar TODOS os ocultos */ const unhideAll = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IframeEditor.useCallback[unhideAll]": ()=>{
            hiddenElements.current.forEach({
                "IframeEditor.useCallback[unhideAll]": (el)=>{
                    el.style.opacity = '';
                    el.style.pointerEvents = '';
                }
            }["IframeEditor.useCallback[unhideAll]"]);
            hiddenElements.current.clear();
            setHiddenIds(new Set());
        }
    }["IframeEditor.useCallback[unhideAll]"], []);
    /** Restaurar UM oculto por id */ const unhideOne = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IframeEditor.useCallback[unhideOne]": (eid)=>{
            const el = hiddenElements.current.get(eid);
            if (el) {
                el.style.opacity = '';
                el.style.pointerEvents = '';
                hiddenElements.current.delete(eid);
            }
            setHiddenIds({
                "IframeEditor.useCallback[unhideOne]": (prev)=>{
                    const next = new Set(prev);
                    next.delete(eid);
                    return next;
                }
            }["IframeEditor.useCallback[unhideOne]"]);
        }
    }["IframeEditor.useCallback[unhideOne]"], []);
    // URL do jogo no iframe — relativa pra mesma origin (proxy via rewrite)
    const iframeSrc = gameId ? `/game/${gameId}${activeFile ? `?file=${activeFile}` : ""}` : "";
    // Reset quando troca de jogo ou arquivo
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "IframeEditor.useEffect": ()=>{
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
        }
    }["IframeEditor.useEffect"], [
        gameId,
        activeFile
    ]);
    /** Calcular rect relativo ao WRAPPER (mesmo parent do iframe e highlights)
   *  Formula corrigida: como highlight e iframe compartilham o mesmo wrapper,
   *  a posicao do highlight = posicao interna do iframe * escala.
   *  Sem offsets extras — o scroll do container move o wrapper inteiro.
   *  Ref: Pesquisa X0 — floating-ui #1594, Gutenberg PR #46845
   */ const calcRect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IframeEditor.useCallback[calcRect]": (el)=>{
            if (!iframeRef.current || !containerRef.current) return null;
            try {
                const s = scaleRef.current;
                const elRect = el.getBoundingClientRect(); // coords INTERNAS do iframe (sem escala)
                // Highlight e iframe estao no mesmo wrapper, ambos position:absolute
                // Entao a posicao visual = coords internas * escala
                return new DOMRect(elRect.left * s, elRect.top * s, elRect.width * s, elRect.height * s);
            } catch  {
                return null;
            }
        }
    }["IframeEditor.useCallback[calcRect]"], []);
    // Atualizar highlight quando selecionado muda ou window resize
    const updateHighlight = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IframeEditor.useCallback[updateHighlight]": ()=>{
            if (!selected || !iframeRef.current || !containerRef.current) {
                setHighlightRect(null);
                setMultiRects([]);
                return;
            }
            setHighlightRect(calcRect(selected.element));
            setMultiRects(multiSelected.map({
                "IframeEditor.useCallback[updateHighlight]": (m)=>calcRect(m.element)
            }["IframeEditor.useCallback[updateHighlight]"]).filter(Boolean));
        }
    }["IframeEditor.useCallback[updateHighlight]"], [
        selected,
        multiSelected,
        calcRect
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "IframeEditor.useEffect": ()=>{
            updateHighlight();
            window.addEventListener("resize", updateHighlight);
            return ({
                "IframeEditor.useEffect": ()=>window.removeEventListener("resize", updateHighlight)
            })["IframeEditor.useEffect"];
        }
    }["IframeEditor.useEffect"], [
        updateHighlight
    ]);
    // Refresh highlight periodico (jogo pode animar/mover coisas)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "IframeEditor.useEffect": ()=>{
            if (!selected) return;
            const interval = setInterval(updateHighlight, 500);
            return ({
                "IframeEditor.useEffect": ()=>clearInterval(interval)
            })["IframeEditor.useEffect"];
        }
    }["IframeEditor.useEffect"], [
        selected,
        updateHighlight
    ]);
    /** Dado coords do mouse no overlay, encontra o elemento MAIS PROFUNDO no iframe
   *  Respeita: lock (auto + manual), hidden, smart select (Pesquisa X0 #3)
   */ const elementAtPoint = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IframeEditor.useCallback[elementAtPoint]": (clientX, clientY)=>{
            if (!iframeRef.current) return null;
            try {
                const iframeRect = iframeRef.current.getBoundingClientRect();
                // Compensar escala: coords visuais → coords reais do iframe
                const s = scaleRef.current;
                const x = (clientX - iframeRect.left) / s;
                const y = (clientY - iframeRect.top) / s;
                const doc = iframeRef.current.contentWindow?.document;
                if (!doc) return null;
                let el = doc.elementFromPoint(x, y);
                if (!el) return null;
                if (el.tagName === "BODY" || el.tagName === "HTML") return null;
                // Drill down: buscar o filho mais profundo que contem o ponto
                let deepest = el;
                let changed = true;
                while(changed){
                    changed = false;
                    const children = deepest.children;
                    for(let i = children.length - 1; i >= 0; i--){
                        const child = children[i];
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
                    deepest = deepest.parentElement || el;
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
                    const findChild = {
                        "IframeEditor.useCallback[elementAtPoint].findChild": (parent)=>{
                            for(let i = parent.children.length - 1; i >= 0; i--){
                                const child = parent.children[i];
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
                        }
                    }["IframeEditor.useCallback[elementAtPoint].findChild"];
                    const found = findChild(candidate);
                    if (found) candidate = found;
                    else return null;
                }
                // 4. Smart Select: preferir visuais (pular wrappers vazios)
                if (smartSelect && !isVisuallyRelevant(candidate)) {
                    const findVisual = {
                        "IframeEditor.useCallback[elementAtPoint].findVisual": (parent)=>{
                            for(let i = parent.children.length - 1; i >= 0; i--){
                                const child = parent.children[i];
                                if (!child.getBoundingClientRect) continue;
                                const cr = child.getBoundingClientRect();
                                if (x >= cr.left && x <= cr.right && y >= cr.top && y <= cr.bottom) {
                                    if (isVisuallyRelevant(child) && !isLocked(child)) return child;
                                    const found = findVisual(child);
                                    if (found) return found;
                                }
                            }
                            return null;
                        }
                    }["IframeEditor.useCallback[elementAtPoint].findVisual"];
                    const visual = findVisual(candidate);
                    if (visual) candidate = visual;
                }
                // 5. Retornar — elemento SEMPRE selecionavel se passou os filtros
                return candidate;
            } catch  {
                return null;
            }
        }
    }["IframeEditor.useCallback[elementAtPoint]"], [
        hiddenIds,
        isLocked,
        smartSelect,
        isVisuallyRelevant,
        manualLockedIds
    ]);
    // Manter scaleRef sincronizado — sera usado por calcRect e elementAtPoint
    // (declarado aqui pra referencia, atualizado mais abaixo quando scale eh computado)
    /** Criar DomElementInfo a partir de um HTMLElement */ const makeInfo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IframeEditor.useCallback[makeInfo]": (el)=>{
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
                editorId: eid
            };
        }
    }["IframeEditor.useCallback[makeInfo]"], []);
    // Atalhos de teclado (20 atalhos — hook dedicado)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$utils$2f$useEditorKeys$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorKeys"])({
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
        toggleHide
    });
    // Toolbar event listeners (Fase 11 — Toolbar reescrita sem Konva)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "IframeEditor.useEffect": ()=>{
            const onUndo = {
                "IframeEditor.useEffect.onUndo": ()=>handleUndo()
            }["IframeEditor.useEffect.onUndo"];
            const onRedo = {
                "IframeEditor.useEffect.onRedo": ()=>handleRedo()
            }["IframeEditor.useEffect.onRedo"];
            const onDeselect = {
                "IframeEditor.useEffect.onDeselect": ()=>{
                    setSelected(null);
                    setMultiSelected([]);
                    setHighlightRect(null);
                    setMultiRects([]);
                    onSelectElement?.(null);
                }
            }["IframeEditor.useEffect.onDeselect"];
            const onResetEl = {
                "IframeEditor.useEffect.onResetEl": ()=>{
                    if (!selected) return;
                    pushUndo(selected.element, `reset ${selected.tag}`);
                    selected.element.setAttribute("style", selected.originalStyle);
                    const info = makeInfo(selected.element);
                    setSelected(info);
                    onSelectElement?.(info);
                    updateHighlight();
                }
            }["IframeEditor.useEffect.onResetEl"];
            const onToggleLock = {
                "IframeEditor.useEffect.onToggleLock": ()=>{
                    if (selected) toggleLock(selected.element);
                }
            }["IframeEditor.useEffect.onToggleLock"];
            const onToggleHide = {
                "IframeEditor.useEffect.onToggleHide": ()=>{
                    if (selected) toggleHide(selected.element);
                }
            }["IframeEditor.useEffect.onToggleHide"];
            const onZindex = {
                "IframeEditor.useEffect.onZindex": (e)=>{
                    if (!selected) return;
                    const delta = e.detail?.delta || 0;
                    pushUndo(selected.element, `z-index ${delta > 0 ? '+' : ''}${delta}`);
                    const current = parseInt(selected.element.style.zIndex || '0', 10);
                    selected.element.style.zIndex = String(current + delta);
                }
            }["IframeEditor.useEffect.onZindex"];
            window.addEventListener("editor:undo", onUndo);
            window.addEventListener("editor:redo", onRedo);
            window.addEventListener("editor:deselect", onDeselect);
            window.addEventListener("editor:reset-element", onResetEl);
            window.addEventListener("editor:toggle-lock", onToggleLock);
            window.addEventListener("editor:toggle-hide", onToggleHide);
            window.addEventListener("editor:zindex", onZindex);
            return ({
                "IframeEditor.useEffect": ()=>{
                    window.removeEventListener("editor:undo", onUndo);
                    window.removeEventListener("editor:redo", onRedo);
                    window.removeEventListener("editor:deselect", onDeselect);
                    window.removeEventListener("editor:reset-element", onResetEl);
                    window.removeEventListener("editor:toggle-lock", onToggleLock);
                    window.removeEventListener("editor:toggle-hide", onToggleHide);
                    window.removeEventListener("editor:zindex", onZindex);
                }
            })["IframeEditor.useEffect"];
        }
    }["IframeEditor.useEffect"], [
        selected,
        handleUndo,
        handleRedo,
        pushUndo,
        makeInfo,
        updateHighlight,
        toggleLock,
        toggleHide,
        onSelectElement
    ]);
    /** Hover: mostra contorno azul claro no elemento sob o mouse */ const handleMouseMove = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IframeEditor.useCallback[handleMouseMove]": (e)=>{
            if (dragging || !iframeLoaded) return;
            const el = elementAtPoint(e.clientX, e.clientY);
            if (!el || !iframeRef.current || !containerRef.current) {
                setHoverRect(null);
                return;
            }
            const s = scaleRef.current;
            const elRect = el.getBoundingClientRect();
            // Mesma logica do calcRect: highlight e iframe no mesmo wrapper
            setHoverRect(new DOMRect(elRect.left * s, elRect.top * s, elRect.width * s, elRect.height * s));
        }
    }["IframeEditor.useCallback[handleMouseMove]"], [
        dragging,
        iframeLoaded,
        elementAtPoint
    ]);
    /** Click: seleciona elemento. Shift+Click = multi-select. Middle button = pan */ const handleMouseDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IframeEditor.useCallback[handleMouseDown]": (e)=>{
            if (!iframeLoaded) return;
            e.preventDefault();
            e.stopPropagation();
            setContextMenu(null);
            // Middle mouse button OU hand tool = start pan via scroll nativo (Pesquisa X0)
            // Hand tool SEMPRE faz pan, independente do zoom level
            if (e.button === 1 || e.button === 0 && e.altKey || e.button === 0 && handTool) {
                isPanning.current = true;
                const container = containerRef.current;
                panStart.current = {
                    x: e.clientX,
                    y: e.clientY,
                    scrollX: container?.scrollLeft || 0,
                    scrollY: container?.scrollTop || 0
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
                const alreadySelected = multiSelected.find({
                    "IframeEditor.useCallback[handleMouseDown].alreadySelected": (m)=>m.element === el
                }["IframeEditor.useCallback[handleMouseDown].alreadySelected"]);
                if (alreadySelected) {
                    // Remover da selecao
                    setMultiSelected({
                        "IframeEditor.useCallback[handleMouseDown]": (prev)=>prev.filter({
                                "IframeEditor.useCallback[handleMouseDown]": (m)=>m.element !== el
                            }["IframeEditor.useCallback[handleMouseDown]"])
                    }["IframeEditor.useCallback[handleMouseDown]"]);
                } else if (el !== selected.element) {
                    // Adicionar
                    setMultiSelected({
                        "IframeEditor.useCallback[handleMouseDown]": (prev)=>[
                                ...prev,
                                info
                            ]
                    }["IframeEditor.useCallback[handleMouseDown]"]);
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
                origTop: elRect.top
            };
        }
    }["IframeEditor.useCallback[handleMouseDown]"], [
        iframeLoaded,
        elementAtPoint,
        makeInfo
    ]);
    /** Drag: mover elemento OU pan */ const handleOverlayMouseMove = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IframeEditor.useCallback[handleOverlayMouseMove]": (e)=>{
            // Pan mode (middle button or Alt+drag) — scroll nativo (Pesquisa X0)
            if (isPanning.current) {
                const container = containerRef.current;
                if (container) {
                    const dx = e.clientX - panStart.current.x;
                    const dy = e.clientY - panStart.current.y;
                    container.scrollLeft = panStart.current.scrollX - dx;
                    container.scrollTop = panStart.current.scrollY - dy;
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
                multiSelected.forEach({
                    "IframeEditor.useCallback[handleOverlayMouseMove]": (m)=>pushUndo(m.element, `drag ${m.tag}`)
                }["IframeEditor.useCallback[handleOverlayMouseMove]"]);
            }
            if (!dragging && Math.abs(dx) <= 3 && Math.abs(dy) <= 3) return;
            // Aplicar deslocamento via transform — primario
            const applyTranslate = {
                "IframeEditor.useCallback[handleOverlayMouseMove].applyTranslate": (el)=>{
                    const current = el.style.transform || "";
                    const clean = current.replace(/translate\([^)]*\)/g, "").trim();
                    el.style.transform = `${clean} translate(${dx}px, ${dy}px)`.trim();
                }
            }["IframeEditor.useCallback[handleOverlayMouseMove].applyTranslate"];
            applyTranslate(selected.element);
            // Mover todos os multi-selected juntos
            multiSelected.forEach({
                "IframeEditor.useCallback[handleOverlayMouseMove]": (m)=>applyTranslate(m.element)
            }["IframeEditor.useCallback[handleOverlayMouseMove]"]);
            updateHighlight();
        }
    }["IframeEditor.useCallback[handleOverlayMouseMove]"], [
        selected,
        multiSelected,
        dragging,
        handleMouseMove,
        updateHighlight,
        pushUndo
    ]);
    /** Drop: finalizar drag ou pan */ const handleMouseUp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IframeEditor.useCallback[handleMouseUp]": (e)=>{
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
                    deltaY: dy
                });
                // Atualizar info do selected com novo rect
                setSelected(makeInfo(selected.element));
            }
            setDragging(false);
            dragStart.current = null;
            updateHighlight();
        }
    }["IframeEditor.useCallback[handleMouseUp]"], [
        dragging,
        selected,
        addChange,
        makeInfo,
        updateHighlight
    ]);
    // Sem jogo selecionado — renderiza empty state (mas hooks ja foram chamados acima)
    // Calcular escala pra caber o iframe 1920x1080 no container disponivel
    // NOTA: hooks DEVEM ficar antes de qualquer return condicional (Rules of Hooks)
    const [containerWidth, setContainerWidth] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [zoomLevel, setZoomLevel] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    // Pan via scroll nativo (Pesquisa X0: Figma approach — overflow:auto no container)
    // panOffset REMOVIDO — pan agora eh scrollLeft/scrollTop do container
    const zoomLevelRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(1);
    // Manter ref sincronizado com state
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "IframeEditor.useEffect": ()=>{
            zoomLevelRef.current = zoomLevel;
        }
    }["IframeEditor.useEffect"], [
        zoomLevel
    ]);
    const wrapperRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const isPanning = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const panStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "IframeEditor.useEffect": ()=>{
            const update = {
                "IframeEditor.useEffect.update": ()=>{
                    if (wrapperRef.current) {
                        setContainerWidth(wrapperRef.current.clientWidth);
                    }
                }
            }["IframeEditor.useEffect.update"];
            update();
            window.addEventListener("resize", update);
            return ({
                "IframeEditor.useEffect": ()=>window.removeEventListener("resize", update)
            })["IframeEditor.useEffect"];
        }
    }["IframeEditor.useEffect"], []);
    // Zoom com Ctrl+Scroll (centrado no cursor — Pesquisa X0)
    // Zoom NAO entra no undo (eh navegacao, nao edicao)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "IframeEditor.useEffect": ()=>{
            const wrapper = wrapperRef.current;
            if (!wrapper) return;
            const onWheel = {
                "IframeEditor.useEffect.onWheel": (e)=>{
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
                        requestAnimationFrame({
                            "IframeEditor.useEffect.onWheel": ()=>{
                                container.scrollLeft = contentX * newScale - cursorX;
                                container.scrollTop = contentY * newScale - cursorY;
                            }
                        }["IframeEditor.useEffect.onWheel"]);
                    } else {
                        setZoomLevel(newZoom);
                    }
                }
            }["IframeEditor.useEffect.onWheel"];
            wrapper.addEventListener("wheel", onWheel, {
                passive: false
            });
            return ({
                "IframeEditor.useEffect": ()=>wrapper.removeEventListener("wheel", onWheel)
            })["IframeEditor.useEffect"];
        }
    }["IframeEditor.useEffect"], []);
    const GAME_W = 1920;
    const GAME_H = 1080;
    const baseScale = containerWidth > 0 ? containerWidth / GAME_W : 0.5;
    const baseScaleRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(baseScale);
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
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: emptyStyle,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    style: {
                        color: "#D4A843",
                        fontSize: 16,
                        fontWeight: 600
                    },
                    children: "Selecione um alvo no painel esquerdo"
                }, void 0, false, {
                    fileName: "[project]/components/editor/IframeEditor.tsx",
                    lineNumber: 856,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    style: {
                        color: "#8a8a8a",
                        fontSize: 13,
                        marginTop: 8
                    },
                    children: "O jogo sera carregado aqui em tempo real"
                }, void 0, false, {
                    fileName: "[project]/components/editor/IframeEditor.tsx",
                    lineNumber: 859,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/editor/IframeEditor.tsx",
            lineNumber: 855,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: wrapperRef,
        className: "editor-scroll",
        style: {
            width: "100%",
            minHeight: 0
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: containerRef,
                style: {
                    width: containerWidth || "100%",
                    height: scaledH || 400,
                    position: "relative",
                    background: "#0a0a0a",
                    border: gameMode ? "2px solid #00E676" : "1px solid rgba(212,168,67,0.2)",
                    borderRadius: 8,
                    overflow: zoomLevel > 1 ? "auto" : "hidden",
                    padding: 0
                },
                className: "editor-scroll",
                onScroll: updateHighlight,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        width: Math.max(scaledContentW, containerWidth || 0),
                        height: Math.max(scaledContentH, scaledH || 0),
                        position: "relative"
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("iframe", {
                            ref: iframeRef,
                            src: iframeSrc,
                            onLoad: ()=>{
                                setIframeLoaded(true);
                                onIframeLoaded?.(true);
                                // AUTO-LOCK: travar containers de nivel 0-1 (Pesquisa X0 #3)
                                try {
                                    const doc = iframeRef.current?.contentWindow?.document;
                                    if (doc) {
                                        const autoLock = new Set();
                                        // Nivel 0: filhos diretos do body
                                        const bodyChildren = doc.body.children;
                                        for(let i = 0; i < bodyChildren.length; i++){
                                            const child = bodyChildren[i];
                                            if (!child.tagName || child.tagName === 'SCRIPT' || child.tagName === 'STYLE') continue;
                                            let eid = child.getAttribute('data-editor-idx');
                                            if (!eid) {
                                                eid = nextEditorId();
                                                child.setAttribute('data-editor-idx', eid);
                                            }
                                            autoLock.add(eid);
                                            // Nivel 1: filhos dos filhos do body
                                            for(let j = 0; j < child.children.length; j++){
                                                const grandchild = child.children[j];
                                                if (!grandchild.tagName || grandchild.tagName === 'SCRIPT' || grandchild.tagName === 'STYLE') continue;
                                                let geid = grandchild.getAttribute('data-editor-idx');
                                                if (!geid) {
                                                    geid = nextEditorId();
                                                    grandchild.setAttribute('data-editor-idx', geid);
                                                }
                                                autoLock.add(geid);
                                            }
                                        }
                                        setLockedIds((prev)=>{
                                            const next = new Set(prev);
                                            autoLock.forEach((id)=>next.add(id));
                                            return next;
                                        });
                                    }
                                } catch  {}
                            },
                            style: {
                                width: GAME_W,
                                height: GAME_H,
                                border: "none",
                                display: "block",
                                transform: `scale(${scale})`,
                                transformOrigin: "0 0",
                                position: "absolute",
                                left: 0,
                                top: 0
                            },
                            title: `Editor: ${gameId}`
                        }, void 0, false, {
                            fileName: "[project]/components/editor/IframeEditor.tsx",
                            lineNumber: 891,
                            columnNumber: 7
                        }, this),
                        !gameMode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            ref: overlayRef,
                            onMouseDown: handleMouseDown,
                            onMouseMove: handleOverlayMouseMove,
                            onMouseUp: handleMouseUp,
                            onContextMenu: (e)=>{
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
                                    const elements = [];
                                    const collectAtPoint = (el, depth)=>{
                                        const rect = el.getBoundingClientRect();
                                        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                                            if (el.tagName !== "BODY" && el.tagName !== "HTML" && el.tagName !== "SCRIPT" && el.tagName !== "STYLE") {
                                                const text = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 ? (el.childNodes[0].textContent || "").trim().slice(0, 25) : "";
                                                elements.push({
                                                    el,
                                                    tag: el.tagName.toLowerCase(),
                                                    text,
                                                    depth
                                                });
                                            }
                                            for(let i = 0; i < el.children.length; i++){
                                                collectAtPoint(el.children[i], depth + 1);
                                            }
                                        }
                                    };
                                    collectAtPoint(doc.body, 0);
                                    if (elements.length > 0) {
                                        const containerRect = containerRef.current.getBoundingClientRect();
                                        setContextMenu({
                                            x: e.clientX - containerRect.left,
                                            y: e.clientY - containerRect.top,
                                            elements
                                        });
                                    }
                                } catch  {}
                            },
                            onMouseLeave: ()=>{
                                setHoverRect(null);
                                if (dragging) handleMouseUp({});
                            },
                            style: {
                                position: "absolute",
                                inset: 0,
                                cursor: isPanning.current ? "grabbing" : handTool ? "grab" : dragging ? "grabbing" : "crosshair",
                                zIndex: 10
                            }
                        }, void 0, false, {
                            fileName: "[project]/components/editor/IframeEditor.tsx",
                            lineNumber: 943,
                            columnNumber: 9
                        }, this),
                        hoverRect && !dragging && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                position: "absolute",
                                left: hoverRect.x,
                                top: hoverRect.y,
                                width: hoverRect.width,
                                height: hoverRect.height,
                                border: "1px solid rgba(100,180,255,0.6)",
                                background: "rgba(100,180,255,0.08)",
                                pointerEvents: "none",
                                zIndex: 11,
                                transition: "all 0.1s ease"
                            }
                        }, void 0, false, {
                            fileName: "[project]/components/editor/IframeEditor.tsx",
                            lineNumber: 1002,
                            columnNumber: 9
                        }, this),
                        highlightRect && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                position: "absolute",
                                left: highlightRect.x,
                                top: highlightRect.y,
                                width: highlightRect.width,
                                height: highlightRect.height,
                                border: "2px solid #D4A843",
                                background: "rgba(212,168,67,0.06)",
                                pointerEvents: "none",
                                zIndex: 12,
                                boxShadow: "0 0 8px rgba(212,168,67,0.3)"
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    position: "absolute",
                                    top: -20,
                                    left: 0,
                                    fontSize: 10,
                                    color: "#080604",
                                    background: "#D4A843",
                                    padding: "1px 6px",
                                    borderRadius: "3px 3px 0 0",
                                    fontFamily: "ui-monospace, monospace",
                                    whiteSpace: "nowrap"
                                },
                                children: [
                                    selected?.tag,
                                    selected?.text ? ` "${selected.text.slice(0, 20)}"` : "",
                                    multiSelected.length > 0 && ` +${multiSelected.length}`
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/editor/IframeEditor.tsx",
                                lineNumber: 1035,
                                columnNumber: 11
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/editor/IframeEditor.tsx",
                            lineNumber: 1020,
                            columnNumber: 9
                        }, this),
                        highlightRect && selected && !dragging && !gameMode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$ResizeHandles$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            rect: highlightRect,
                            element: selected.element,
                            scale: scale,
                            onResizeStart: ()=>pushUndo(selected.element),
                            onResizeEnd: ()=>{
                                updateHighlight();
                                setSelected(makeInfo(selected.element));
                                onSelectElement?.(makeInfo(selected.element));
                            },
                            onResizeMove: updateHighlight
                        }, void 0, false, {
                            fileName: "[project]/components/editor/IframeEditor.tsx",
                            lineNumber: 1058,
                            columnNumber: 9
                        }, this),
                        multiRects.map((rect, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    position: "absolute",
                                    left: rect.x,
                                    top: rect.y,
                                    width: rect.width,
                                    height: rect.height,
                                    border: "1.5px dashed #D4A843",
                                    background: "rgba(212,168,67,0.04)",
                                    pointerEvents: "none",
                                    zIndex: 12
                                }
                            }, `multi-${i}`, false, {
                                fileName: "[project]/components/editor/IframeEditor.tsx",
                                lineNumber: 1074,
                                columnNumber: 9
                            }, this)),
                        !iframeLoaded && gameId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(10,10,10,0.9)",
                                zIndex: 20,
                                color: "#D4A843",
                                fontSize: 14
                            },
                            children: [
                                "Carregando ",
                                gameId,
                                "..."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/editor/IframeEditor.tsx",
                            lineNumber: 1092,
                            columnNumber: 9
                        }, this),
                        contextMenu && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
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
                                boxShadow: "0 4px 20px rgba(0,0,0,0.8)"
                            },
                            className: "editor-scroll",
                            onMouseLeave: ()=>setContextMenu(null),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        padding: "4px 10px 6px",
                                        fontSize: 9,
                                        color: "#8a8a8a",
                                        fontWeight: 700,
                                        letterSpacing: 0.5,
                                        borderBottom: "1px solid rgba(212,168,67,0.12)",
                                        marginBottom: 2
                                    },
                                    children: [
                                        "SELECIONAR ELEMENTO (",
                                        contextMenu.elements.length,
                                        ")"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/editor/IframeEditor.tsx",
                                    lineNumber: 1131,
                                    columnNumber: 11
                                }, this),
                                contextMenu.elements.map((item, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            const info = makeInfo(item.el);
                                            setSelected(info);
                                            setMultiSelected([]);
                                            onSelectElement?.(info);
                                            setHighlightRect(calcRect(item.el));
                                            setContextMenu(null);
                                        },
                                        onMouseEnter: ()=>{
                                            // Preview highlight ao passar o mouse no menu
                                            const rect = calcRect(item.el);
                                            if (rect) setHoverRect(rect);
                                        },
                                        onMouseLeave: ()=>setHoverRect(null),
                                        style: {
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
                                            textOverflow: "ellipsis"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    color: "#8cb4d4"
                                                },
                                                children: item.tag
                                            }, void 0, false, {
                                                fileName: "[project]/components/editor/IframeEditor.tsx",
                                                lineNumber: 1168,
                                                columnNumber: 15
                                            }, this),
                                            item.text && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    color: "#6a6a6a",
                                                    marginLeft: 4
                                                },
                                                children: [
                                                    '"',
                                                    item.text,
                                                    '"'
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/editor/IframeEditor.tsx",
                                                lineNumber: 1169,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, idx, true, {
                                        fileName: "[project]/components/editor/IframeEditor.tsx",
                                        lineNumber: 1135,
                                        columnNumber: 13
                                    }, this))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/editor/IframeEditor.tsx",
                            lineNumber: 1113,
                            columnNumber: 9
                        }, this),
                        gameMode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                position: "absolute",
                                inset: 0,
                                border: "3px solid rgba(0,230,118,0.6)",
                                borderRadius: 8,
                                pointerEvents: "none",
                                zIndex: 25
                            }
                        }, void 0, false, {
                            fileName: "[project]/components/editor/IframeEditor.tsx",
                            lineNumber: 1177,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/editor/IframeEditor.tsx",
                    lineNumber: 885,
                    columnNumber: 7
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/editor/IframeEditor.tsx",
                lineNumber: 869,
                columnNumber: 5
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
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
                    flexShrink: 0
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>{
                            setGameMode((prev)=>!prev);
                            setHoverRect(null);
                            setHighlightRect(null);
                        },
                        style: {
                            padding: "3px 8px",
                            background: gameMode ? "rgba(0,230,118,0.2)" : "rgba(212,168,67,0.1)",
                            border: `1px solid ${gameMode ? "rgba(0,230,118,0.5)" : "rgba(212,168,67,0.3)"}`,
                            borderRadius: 4,
                            color: gameMode ? "#00E676" : "#D4A843",
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            letterSpacing: 0.5
                        },
                        title: gameMode ? "Voltar pro Modo Editor (overlay ativado)" : "Modo Jogo: interagir com o jogo (overlay desativado)",
                        children: gameMode ? "MODO JOGO ●" : "MODO EDITOR"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/IframeEditor.tsx",
                        lineNumber: 1211,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>{
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
                            } catch  {}
                        },
                        style: {
                            padding: "3px 6px",
                            background: "rgba(100,180,255,0.08)",
                            border: "1px solid rgba(100,180,255,0.2)",
                            borderRadius: 4,
                            color: "#80B4FF",
                            fontSize: 9,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "inherit"
                        },
                        title: "Congelar: pausa todas as animacoes e transitions do jogo",
                        children: "❄ FREEZE"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/IframeEditor.tsx",
                        lineNumber: 1235,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleUndo,
                        disabled: undoCount === 0,
                        style: {
                            ...statusBtnStyle,
                            opacity: undoCount > 0 ? 1 : 0.3
                        },
                        title: `Desfazer (Ctrl+Z) — ${undoCount} acao(oes)`,
                        children: [
                            "↩ ",
                            undoCount
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/IframeEditor.tsx",
                        lineNumber: 1272,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleRedo,
                        disabled: redoCount === 0,
                        style: {
                            ...statusBtnStyle,
                            opacity: redoCount > 0 ? 1 : 0.3
                        },
                        title: `Refazer (Ctrl+Y) — ${redoCount} acao(oes)`,
                        children: [
                            "↪ ",
                            redoCount
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/IframeEditor.tsx",
                        lineNumber: 1280,
                        columnNumber: 9
                    }, this),
                    hasChanges && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            color: "#FF8C00",
                            fontSize: 10
                        },
                        children: "● nao salvo"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/IframeEditor.tsx",
                        lineNumber: 1291,
                        columnNumber: 11
                    }, this),
                    lastUndoDesc && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            color: "#aaa",
                            fontSize: 9,
                            fontStyle: "italic",
                            maxWidth: 150,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                        },
                        children: lastUndoDesc
                    }, void 0, false, {
                        fileName: "[project]/components/editor/IframeEditor.tsx",
                        lineNumber: 1296,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 0,
                            marginLeft: 4,
                            background: "rgba(212,168,67,0.05)",
                            border: "1px solid rgba(212,168,67,0.18)",
                            borderRadius: 4,
                            overflow: "hidden"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    setZoomLevel((prev)=>Math.max(0.2, +(prev - 0.1).toFixed(2)));
                                },
                                style: zoomBtnStyle,
                                title: "Zoom out (−10%)",
                                children: "−"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/IframeEditor.tsx",
                                lineNumber: 1312,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    width: 1,
                                    height: 16,
                                    background: "rgba(212,168,67,0.12)"
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/editor/IframeEditor.tsx",
                                lineNumber: 1321,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    setZoomLevel(1);
                                    if (containerRef.current) {
                                        containerRef.current.scrollLeft = 0;
                                        containerRef.current.scrollTop = 0;
                                    }
                                },
                                style: {
                                    ...zoomBtnStyle,
                                    minWidth: 44,
                                    color: zoomLevel === 1 ? "#8a8a8a" : "#D4A843",
                                    fontWeight: 600
                                },
                                title: "Resetar zoom (100%) — Ctrl+Scroll pra zoom — Middle click+drag pra mover",
                                children: [
                                    Math.round(zoomLevel * 100),
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/editor/IframeEditor.tsx",
                                lineNumber: 1322,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    width: 1,
                                    height: 16,
                                    background: "rgba(212,168,67,0.12)"
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/editor/IframeEditor.tsx",
                                lineNumber: 1340,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    setZoomLevel((prev)=>Math.min(3, +(prev + 0.1).toFixed(2)));
                                },
                                style: zoomBtnStyle,
                                title: "Zoom in (+10%)",
                                children: "+"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/IframeEditor.tsx",
                                lineNumber: 1341,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    width: 1,
                                    height: 16,
                                    background: "rgba(212,168,67,0.12)"
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/editor/IframeEditor.tsx",
                                lineNumber: 1350,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    setZoomLevel(1);
                                    if (containerRef.current) {
                                        containerRef.current.scrollLeft = 0;
                                        containerRef.current.scrollTop = 0;
                                    }
                                },
                                style: {
                                    ...zoomBtnStyle,
                                    fontSize: 8,
                                    letterSpacing: 0.5,
                                    padding: "0 6px"
                                },
                                title: "Ajustar pra caber (Fit to screen) — reseta zoom e scroll",
                                children: "FIT"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/IframeEditor.tsx",
                                lineNumber: 1351,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    width: 1,
                                    height: 16,
                                    background: "rgba(212,168,67,0.12)"
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/editor/IframeEditor.tsx",
                                lineNumber: 1364,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setHandTool((prev)=>!prev),
                                style: {
                                    ...zoomBtnStyle,
                                    fontSize: 12,
                                    padding: "0 6px",
                                    background: handTool ? "rgba(212,168,67,0.2)" : "transparent",
                                    color: handTool ? "#FFD700" : "#D4A843"
                                },
                                title: handTool ? "Desativar maozinha (voltar pra selecao)" : "Maozinha: mover tela com zoom (middle click ou Alt+drag tambem funciona)",
                                children: "✋"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/IframeEditor.tsx",
                                lineNumber: 1365,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/IframeEditor.tsx",
                        lineNumber: 1302,
                        columnNumber: 9
                    }, this),
                    selected && !gameMode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    color: "#D4A843",
                                    fontWeight: 600,
                                    marginLeft: 8
                                },
                                children: [
                                    "<",
                                    selected.tag,
                                    ">",
                                    multiSelected.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            color: "#aaa",
                                            fontWeight: 400
                                        },
                                        children: [
                                            " ",
                                            "+",
                                            multiSelected.length,
                                            " (Shift+click pra mais)"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/editor/IframeEditor.tsx",
                                        lineNumber: 1386,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/editor/IframeEditor.tsx",
                                lineNumber: 1383,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    color: "#5a5a5a"
                                },
                                children: [
                                    Math.round(selected.originalRect.width),
                                    "x",
                                    Math.round(selected.originalRect.height)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/editor/IframeEditor.tsx",
                                lineNumber: 1391,
                                columnNumber: 13
                            }, this),
                            selected.element.getAttribute('data-editor-idx') && lockedIds.has(selected.element.getAttribute('data-editor-idx')) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    color: "#FF6B6B",
                                    fontSize: 9
                                },
                                title: "Elemento travado — pressione L pra destravar",
                                children: "🔒"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/IframeEditor.tsx",
                                lineNumber: 1396,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    color: "#555",
                                    fontSize: 8,
                                    marginLeft: 4
                                },
                                title: "L=travar H=ocultar Del=resetar R=rotacionar []=z-index",
                                children: "L:trava H:oculta"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/IframeEditor.tsx",
                                lineNumber: 1399,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true),
                    gameMode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            marginLeft: 8,
                            color: "#00E676",
                            fontSize: 10
                        },
                        children: "Interaja com o jogo — clique no botao pra voltar ao editor"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/IframeEditor.tsx",
                        lineNumber: 1406,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setSmartSelect((prev)=>!prev),
                        style: {
                            ...statusBtnStyle,
                            marginLeft: 4,
                            color: smartSelect ? "#00E676" : "#666",
                            borderColor: smartSelect ? "rgba(0,230,118,0.3)" : "rgba(100,100,100,0.2)",
                            fontSize: 8
                        },
                        title: smartSelect ? "Smart Select ON: pula divs vazias sem visual, seleciona o que voce VE (img, button, div com bg). Clique pra desligar." : "Smart Select OFF: seleciona qualquer elemento incluindo wrappers invisíveis. Clique pra ligar.",
                        children: smartSelect ? "◆ SMART" : "◇ SMART"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/IframeEditor.tsx",
                        lineNumber: 1412,
                        columnNumber: 9
                    }, this),
                    hiddenIds.size > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: unhideAll,
                        style: {
                            ...statusBtnStyle,
                            color: "#FFD700",
                            fontSize: 8
                        },
                        title: `${hiddenIds.size} elemento(s) oculto(s) — clique pra restaurar todos`,
                        children: [
                            "👁 ",
                            hiddenIds.size,
                            " ocultos"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/IframeEditor.tsx",
                        lineNumber: 1429,
                        columnNumber: 11
                    }, this),
                    lockedIds.size > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            color: "#666",
                            fontSize: 8
                        },
                        title: `${lockedIds.size} elementos travados (auto-lock nos containers + manual via L)`,
                        children: [
                            "🔒",
                            lockedIds.size
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/IframeEditor.tsx",
                        lineNumber: 1439,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>{
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
                        },
                        style: {
                            ...zoomBtnStyle,
                            fontSize: 8,
                            color: "#FF8C00",
                            marginLeft: "auto"
                        },
                        title: "Resetar tudo: zoom, scroll, selecao",
                        children: "RESET"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/IframeEditor.tsx",
                        lineNumber: 1445,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/IframeEditor.tsx",
                lineNumber: 1192,
                columnNumber: 5
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/editor/IframeEditor.tsx",
        lineNumber: 867,
        columnNumber: 5
    }, this);
}
_s(IframeEditor, "y5Mp+U15u0Pd92Z5WJC/Wq4GqS0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$utils$2f$useEditorKeys$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorKeys"]
    ];
});
_c = IframeEditor;
const emptyStyle = {
    width: "100%",
    aspectRatio: "16/9",
    background: "#1a1410",
    border: "1px dashed rgba(212,168,67,0.3)",
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
};
const statusBtnStyle = {
    padding: "2px 6px",
    background: "rgba(212,168,67,0.08)",
    border: "1px solid rgba(212,168,67,0.2)",
    borderRadius: 3,
    color: "#D4A843",
    fontSize: 10,
    cursor: "pointer",
    fontFamily: "ui-monospace, monospace"
};
const zoomBtnStyle = {
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
    transition: "background 0.1s"
};
var _c;
__turbopack_context__.k.register(_c, "IframeEditor");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/Toolbar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Toolbar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
"use client";
;
function Toolbar() {
    const dispatch = (event, detail)=>{
        if ("TURBOPACK compile-time truthy", 1) {
            window.dispatchEvent(new CustomEvent(event, {
                detail
            }));
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: toolbarStyle,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: groupStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToolbarBtn, {
                        onClick: ()=>dispatch("editor:undo"),
                        title: "Desfazer (Ctrl+Z)",
                        icon: "↶"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/Toolbar.tsx",
                        lineNumber: 21,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToolbarBtn, {
                        onClick: ()=>dispatch("editor:redo"),
                        title: "Refazer (Ctrl+Y)",
                        icon: "↷"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/Toolbar.tsx",
                        lineNumber: 22,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/Toolbar.tsx",
                lineNumber: 20,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: dividerStyle
            }, void 0, false, {
                fileName: "[project]/components/editor/Toolbar.tsx",
                lineNumber: 24,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: groupStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToolbarBtn, {
                        onClick: ()=>dispatch("editor:save"),
                        title: "Salvar mudancas no .tsx",
                        icon: "💾",
                        label: "Salvar"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/Toolbar.tsx",
                        lineNumber: 28,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToolbarBtn, {
                        onClick: ()=>dispatch("editor:open-history"),
                        title: "Historico de backups",
                        icon: "🕐",
                        label: "Historico"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/Toolbar.tsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToolbarBtn, {
                        onClick: ()=>dispatch("editor:open-preview"),
                        title: "Preview do jogo",
                        icon: "📐",
                        label: "Preview"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/Toolbar.tsx",
                        lineNumber: 30,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/Toolbar.tsx",
                lineNumber: 27,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: dividerStyle
            }, void 0, false, {
                fileName: "[project]/components/editor/Toolbar.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: groupStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToolbarBtn, {
                        onClick: ()=>dispatch("editor:deselect"),
                        title: "Limpar selecao (Escape)",
                        icon: "◌"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/Toolbar.tsx",
                        lineNumber: 36,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToolbarBtn, {
                        onClick: ()=>dispatch("editor:reset-element"),
                        title: "Resetar elemento (Delete)",
                        icon: "✕",
                        danger: true
                    }, void 0, false, {
                        fileName: "[project]/components/editor/Toolbar.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/Toolbar.tsx",
                lineNumber: 35,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: dividerStyle
            }, void 0, false, {
                fileName: "[project]/components/editor/Toolbar.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: groupStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToolbarBtn, {
                        onClick: ()=>dispatch("editor:toggle-lock"),
                        title: "Travar/destravar (L)",
                        icon: "🔒"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/Toolbar.tsx",
                        lineNumber: 43,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToolbarBtn, {
                        onClick: ()=>dispatch("editor:toggle-hide"),
                        title: "Ocultar/mostrar (H)",
                        icon: "◉"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/Toolbar.tsx",
                        lineNumber: 44,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/Toolbar.tsx",
                lineNumber: 42,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: dividerStyle
            }, void 0, false, {
                fileName: "[project]/components/editor/Toolbar.tsx",
                lineNumber: 46,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: groupStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToolbarBtn, {
                        onClick: ()=>dispatch("editor:zindex", {
                                delta: 1
                            }),
                        title: "z-index + (])",
                        icon: "⤒"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/Toolbar.tsx",
                        lineNumber: 50,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToolbarBtn, {
                        onClick: ()=>dispatch("editor:zindex", {
                                delta: -1
                            }),
                        title: "z-index − ([)",
                        icon: "⤓"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/Toolbar.tsx",
                        lineNumber: 51,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/Toolbar.tsx",
                lineNumber: 49,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: dividerStyle
            }, void 0, false, {
                fileName: "[project]/components/editor/Toolbar.tsx",
                lineNumber: 53,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: groupStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToolbarBtn, {
                        onClick: ()=>dispatch("editor:align", {
                                mode: "left"
                            }),
                        title: "Alinhar esquerda",
                        icon: "⫷"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/Toolbar.tsx",
                        lineNumber: 57,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToolbarBtn, {
                        onClick: ()=>dispatch("editor:align", {
                                mode: "center"
                            }),
                        title: "Alinhar centro H",
                        icon: "≡"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/Toolbar.tsx",
                        lineNumber: 58,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToolbarBtn, {
                        onClick: ()=>dispatch("editor:align", {
                                mode: "right"
                            }),
                        title: "Alinhar direita",
                        icon: "⫸"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/Toolbar.tsx",
                        lineNumber: 59,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToolbarBtn, {
                        onClick: ()=>dispatch("editor:align", {
                                mode: "top"
                            }),
                        title: "Alinhar topo",
                        icon: "⊤"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/Toolbar.tsx",
                        lineNumber: 60,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToolbarBtn, {
                        onClick: ()=>dispatch("editor:align", {
                                mode: "middle"
                            }),
                        title: "Alinhar meio V",
                        icon: "—"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/Toolbar.tsx",
                        lineNumber: 61,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToolbarBtn, {
                        onClick: ()=>dispatch("editor:align", {
                                mode: "bottom"
                            }),
                        title: "Alinhar base",
                        icon: "⊥"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/Toolbar.tsx",
                        lineNumber: 62,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/Toolbar.tsx",
                lineNumber: 56,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    flex: 1
                }
            }, void 0, false, {
                fileName: "[project]/components/editor/Toolbar.tsx",
                lineNumber: 65,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToolbarBtn, {
                onClick: ()=>dispatch("editor:open-help"),
                title: "Ajuda e atalhos (?)",
                icon: "?"
            }, void 0, false, {
                fileName: "[project]/components/editor/Toolbar.tsx",
                lineNumber: 66,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/editor/Toolbar.tsx",
        lineNumber: 18,
        columnNumber: 5
    }, this);
}
_c = Toolbar;
function ToolbarBtn({ onClick, title, icon, label, disabled, danger, active }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        onClick: onClick,
        disabled: disabled,
        title: title,
        style: {
            ...btnBase,
            ...disabled ? {
                opacity: 0.3,
                cursor: "not-allowed"
            } : {},
            ...danger ? {
                color: "#dc5050"
            } : {},
            ...active ? {
                background: "rgba(212,168,67,0.15)",
                borderColor: "rgba(212,168,67,0.4)",
                color: "#D4A843"
            } : {}
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: icon
            }, void 0, false, {
                fileName: "[project]/components/editor/Toolbar.tsx",
                lineNumber: 89,
                columnNumber: 7
            }, this),
            label && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                style: {
                    fontSize: 11
                },
                children: label
            }, void 0, false, {
                fileName: "[project]/components/editor/Toolbar.tsx",
                lineNumber: 90,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/editor/Toolbar.tsx",
        lineNumber: 83,
        columnNumber: 5
    }, this);
}
_c1 = ToolbarBtn;
const toolbarStyle = {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "#0d0a08",
    border: "1px solid rgba(212,168,67,0.15)",
    borderRadius: 6,
    padding: "6px 10px"
};
const groupStyle = {
    display: "flex",
    gap: 2
};
const dividerStyle = {
    width: 1,
    height: 20,
    background: "rgba(212,168,67,0.15)",
    margin: "0 6px"
};
const btnBase = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: 4,
    padding: "5px 8px",
    cursor: "pointer",
    color: "#c5c5c5",
    fontSize: 14,
    fontFamily: "inherit",
    height: 28,
    minWidth: 28,
    justifyContent: "center",
    transition: "background 0.12s, border-color 0.12s"
};
var _c, _c1;
__turbopack_context__.k.register(_c, "Toolbar");
__turbopack_context__.k.register(_c1, "ToolbarBtn");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/panels/EffectsPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>EffectsPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * EffectsPanel.tsx
 *
 * Painel de presets de efeitos visuais. Cada preset aplica CSS
 * no elemento selecionado com 1 click. Cor editavel em todos.
 *
 * Categorias: Glow, Borda Animada, Glass, Texto, Animacao
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
/** Hex pra rgba com alpha */ function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
/** Injetar @keyframes no iframe (se nao existir) */ function injectKeyframes(el, name, css) {
    const doc = el.ownerDocument;
    if (doc.getElementById(`ed-kf-${name}`)) return;
    const style = doc.createElement("style");
    style.id = `ed-kf-${name}`;
    style.textContent = css;
    doc.head.appendChild(style);
}
// ===== PRESETS =====
const PRESETS = [
    // --- GLOW ---
    {
        id: "glow-casino",
        name: "Glow Casino",
        category: "glow",
        apply: (el, c)=>{
            el.style.boxShadow = `0 0 10px ${hexToRgba(c, 0.5)}, 0 0 20px ${hexToRgba(c, 0.3)}, 0 0 40px ${hexToRgba(c, 0.15)}`;
        },
        remove: (el)=>{
            el.style.boxShadow = "";
        }
    },
    {
        id: "neon-pulse",
        name: "Neon Pulse",
        category: "glow",
        apply: (el, c)=>{
            injectKeyframes(el, "neonPulse", `
        @keyframes edNeonPulse {
          0%, 100% { box-shadow: 0 0 10px ${hexToRgba(c, 0.6)}, 0 0 20px ${hexToRgba(c, 0.4)}, 0 0 40px ${hexToRgba(c, 0.2)}; }
          50% { box-shadow: 0 0 20px ${hexToRgba(c, 0.8)}, 0 0 40px ${hexToRgba(c, 0.5)}, 0 0 80px ${hexToRgba(c, 0.3)}; }
        }
      `);
            el.style.animation = "edNeonPulse 2s ease-in-out infinite";
        },
        remove: (el)=>{
            el.style.animation = "";
            el.style.boxShadow = "";
        }
    },
    {
        id: "soft-shadow",
        name: "Soft Shadow",
        category: "glow",
        apply: (el)=>{
            el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)";
        },
        remove: (el)=>{
            el.style.boxShadow = "";
        }
    },
    {
        id: "inner-glow",
        name: "Inner Glow",
        category: "glow",
        apply: (el, c)=>{
            el.style.boxShadow = `inset 0 0 20px ${hexToRgba(c, 0.4)}, inset 0 0 40px ${hexToRgba(c, 0.15)}`;
        },
        remove: (el)=>{
            el.style.boxShadow = "";
        }
    },
    {
        id: "multi-layer",
        name: "Multi Layer",
        category: "glow",
        apply: (el, c)=>{
            el.style.boxShadow = `inset 0 0 15px ${hexToRgba(c, 0.2)}, 0 0 15px ${hexToRgba(c, 0.4)}, 0 0 40px ${hexToRgba(c, 0.15)}`;
        },
        remove: (el)=>{
            el.style.boxShadow = "";
        }
    },
    // --- BORDA ANIMADA ---
    {
        id: "beam-gold",
        name: "Feixo Dourado",
        category: "borda",
        apply: (el, c)=>{
            injectKeyframes(el, "borderSpin", `
        @property --ed-border-angle { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
        @keyframes edBorderSpin { from { --ed-border-angle: 0deg; } to { --ed-border-angle: 360deg; } }
      `);
            el.style.border = "none";
            el.style.outline = `2px solid ${hexToRgba(c, 0.4)}`;
            el.style.boxShadow = `0 0 15px ${hexToRgba(c, 0.2)}, inset 0 0 15px ${hexToRgba(c, 0.05)}`;
            el.style.animation = "edBorderSpin 4s linear infinite";
        },
        remove: (el)=>{
            el.style.border = "";
            el.style.outline = "";
            el.style.boxShadow = "";
            el.style.animation = "";
        }
    },
    {
        id: "pulsar-border",
        name: "Pulsar Border",
        category: "borda",
        apply: (el, c)=>{
            injectKeyframes(el, "pulsarBorder", `
        @keyframes edPulsarBorder {
          0%, 100% { outline-color: ${hexToRgba(c, 0.8)}; box-shadow: 0 0 8px ${hexToRgba(c, 0.3)}; }
          50% { outline-color: ${hexToRgba(c, 0.2)}; box-shadow: 0 0 2px ${hexToRgba(c, 0.1)}; }
        }
      `);
            el.style.outline = `2px solid ${c}`;
            el.style.animation = "edPulsarBorder 2s ease-in-out infinite";
        },
        remove: (el)=>{
            el.style.outline = "";
            el.style.animation = "";
            el.style.boxShadow = "";
        }
    },
    // --- GLASS ---
    {
        id: "glassmorphism",
        name: "Glassmorphism",
        category: "glass",
        apply: (el)=>{
            el.style.backdropFilter = "blur(12px) saturate(1.2)";
            el.style.background = "rgba(255,255,255,0.05)";
            el.style.border = "1px solid rgba(255,255,255,0.1)";
        },
        remove: (el)=>{
            el.style.backdropFilter = "";
            el.style.background = "";
            el.style.border = "";
        }
    },
    {
        id: "dark-glass",
        name: "Dark Glass",
        category: "glass",
        apply: (el)=>{
            el.style.backdropFilter = "blur(8px)";
            el.style.background = "rgba(0,0,0,0.6)";
            el.style.border = "1px solid rgba(255,255,255,0.08)";
        },
        remove: (el)=>{
            el.style.backdropFilter = "";
            el.style.background = "";
            el.style.border = "";
        }
    },
    {
        id: "frosted",
        name: "Frosted",
        category: "glass",
        apply: (el)=>{
            el.style.backdropFilter = "blur(20px) saturate(1.5)";
            el.style.background = "rgba(255,255,255,0.02)";
        },
        remove: (el)=>{
            el.style.backdropFilter = "";
            el.style.background = "";
        }
    },
    // --- TEXTO ---
    {
        id: "neon-text",
        name: "Neon Text",
        category: "texto",
        apply: (el, c)=>{
            el.style.textShadow = `0 0 7px ${c}, 0 0 10px ${c}, 0 0 21px ${c}, 0 0 42px ${hexToRgba(c, 0.8)}`;
        },
        remove: (el)=>{
            el.style.textShadow = "";
        }
    },
    {
        id: "gold-emboss",
        name: "Gold Emboss",
        category: "texto",
        apply: (el, c)=>{
            el.style.textShadow = `1px 1px 0 ${hexToRgba(c, 0.8)}, 2px 2px 0 ${hexToRgba(c, 0.4)}, 0 0 10px ${hexToRgba(c, 0.2)}`;
        },
        remove: (el)=>{
            el.style.textShadow = "";
        }
    },
    {
        id: "outline-text",
        name: "Outline",
        category: "texto",
        apply: (el, c)=>{
            el.style["-webkit-text-stroke"] = `1px ${c}`;
        },
        remove: (el)=>{
            el.style["-webkit-text-stroke"] = "";
        }
    },
    // --- ANIMACAO ---
    {
        id: "pulse",
        name: "Pulse",
        category: "animacao",
        apply: (el)=>{
            injectKeyframes(el, "edPulse", `
        @keyframes edPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      `);
            el.style.animation = "edPulse 2s ease-in-out infinite";
        },
        remove: (el)=>{
            el.style.animation = "";
        }
    },
    {
        id: "float",
        name: "Float",
        category: "animacao",
        apply: (el)=>{
            injectKeyframes(el, "edFloat", `
        @keyframes edFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `);
            el.style.animation = "edFloat 3s ease-in-out infinite";
        },
        remove: (el)=>{
            el.style.animation = "";
        }
    },
    {
        id: "flicker",
        name: "Flicker (Neon)",
        category: "animacao",
        apply: (el)=>{
            injectKeyframes(el, "edFlicker", `
        @keyframes edFlicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
          20%, 24%, 55% { opacity: 0.4; }
        }
      `);
            el.style.animation = "edFlicker 3s linear infinite";
        },
        remove: (el)=>{
            el.style.animation = "";
        }
    },
    {
        id: "glow-breathe",
        name: "Glow Breathe",
        category: "animacao",
        apply: (el, c)=>{
            injectKeyframes(el, "edGlowBreathe", `
        @keyframes edGlowBreathe {
          0%, 100% { box-shadow: 0 0 10px ${hexToRgba(c, 0.3)}; }
          50% { box-shadow: 0 0 30px ${hexToRgba(c, 0.6)}, 0 0 60px ${hexToRgba(c, 0.2)}; }
        }
      `);
            el.style.animation = "edGlowBreathe 3s ease-in-out infinite";
        },
        remove: (el)=>{
            el.style.animation = "";
            el.style.boxShadow = "";
        }
    },
    {
        id: "spin-slow",
        name: "Spin Lento",
        category: "animacao",
        apply: (el)=>{
            injectKeyframes(el, "edSpinSlow", `
        @keyframes edSpinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `);
            el.style.animation = "edSpinSlow 20s linear infinite";
        },
        remove: (el)=>{
            el.style.animation = "";
        }
    }
];
const CATEGORIES = [
    {
        id: "glow",
        label: "GLOW / SHADOW",
        icon: "✦"
    },
    {
        id: "borda",
        label: "BORDA ANIMADA",
        icon: "◇"
    },
    {
        id: "glass",
        label: "GLASS / MATERIAL",
        icon: "◻"
    },
    {
        id: "texto",
        label: "TEXTO",
        icon: "A"
    },
    {
        id: "animacao",
        label: "ANIMACAO",
        icon: "▷"
    }
];
function EffectsPanel({ selected, pushUndo }) {
    _s();
    const [color, setColor] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("#D4A843");
    const [activePreset, setActivePreset] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [expandedCat, setExpandedCat] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("glow");
    const applyPreset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "EffectsPanel.useCallback[applyPreset]": (preset)=>{
            if (!selected) return;
            pushUndo();
            // Remover preset anterior se houver
            if (activePreset) {
                const prev = PRESETS.find({
                    "EffectsPanel.useCallback[applyPreset].prev": (p)=>p.id === activePreset
                }["EffectsPanel.useCallback[applyPreset].prev"]);
                if (prev) prev.remove(selected.element);
            }
            preset.apply(selected.element, color);
            setActivePreset(preset.id);
        }
    }["EffectsPanel.useCallback[applyPreset]"], [
        selected,
        color,
        activePreset,
        pushUndo
    ]);
    const removeEffect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "EffectsPanel.useCallback[removeEffect]": ()=>{
            if (!selected || !activePreset) return;
            pushUndo();
            const preset = PRESETS.find({
                "EffectsPanel.useCallback[removeEffect].preset": (p)=>p.id === activePreset
            }["EffectsPanel.useCallback[removeEffect].preset"]);
            if (preset) preset.remove(selected.element);
            setActivePreset(null);
        }
    }["EffectsPanel.useCallback[removeEffect]"], [
        selected,
        activePreset,
        pushUndo
    ]);
    if (!selected) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: containerStyle,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: headerStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "EFEITOS RAPIDOS"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/EffectsPanel.tsx",
                        lineNumber: 306,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "color",
                        value: color,
                        onChange: (e)=>setColor(e.target.value),
                        style: colorPickerStyle,
                        title: "Cor base dos efeitos"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/EffectsPanel.tsx",
                        lineNumber: 307,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/EffectsPanel.tsx",
                lineNumber: 305,
                columnNumber: 7
            }, this),
            activePreset && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: removeEffect,
                style: removeBtnStyle,
                children: [
                    "✕ Remover efeito (",
                    PRESETS.find((p)=>p.id === activePreset)?.name,
                    ")"
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/EffectsPanel.tsx",
                lineNumber: 317,
                columnNumber: 9
            }, this),
            CATEGORIES.map((cat)=>{
                const catPresets = PRESETS.filter((p)=>p.category === cat.id);
                const isOpen = expandedCat === cat.id;
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setExpandedCat(isOpen ? "" : cat.id),
                            style: catHeaderStyle,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: {
                                        transform: isOpen ? "rotate(90deg)" : "rotate(0)",
                                        transition: "transform 0.15s",
                                        display: "inline-block",
                                        fontSize: 9
                                    },
                                    children: "▶"
                                }, void 0, false, {
                                    fileName: "[project]/components/editor/panels/EffectsPanel.tsx",
                                    lineNumber: 331,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: [
                                        cat.icon,
                                        " ",
                                        cat.label
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/editor/panels/EffectsPanel.tsx",
                                    lineNumber: 332,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: {
                                        marginLeft: "auto",
                                        fontSize: 9,
                                        color: "#5a5a5a"
                                    },
                                    children: catPresets.length
                                }, void 0, false, {
                                    fileName: "[project]/components/editor/panels/EffectsPanel.tsx",
                                    lineNumber: 333,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/editor/panels/EffectsPanel.tsx",
                            lineNumber: 327,
                            columnNumber: 13
                        }, this),
                        isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: catBodyStyle,
                            children: catPresets.map((preset)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>applyPreset(preset),
                                    style: {
                                        ...presetBtnStyle,
                                        borderColor: activePreset === preset.id ? color : "rgba(212,168,67,0.15)",
                                        background: activePreset === preset.id ? "rgba(212,168,67,0.1)" : "transparent"
                                    },
                                    title: `Aplicar ${preset.name} com cor ${color}`,
                                    children: preset.name
                                }, preset.id, false, {
                                    fileName: "[project]/components/editor/panels/EffectsPanel.tsx",
                                    lineNumber: 338,
                                    columnNumber: 19
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/EffectsPanel.tsx",
                            lineNumber: 336,
                            columnNumber: 15
                        }, this)
                    ]
                }, cat.id, true, {
                    fileName: "[project]/components/editor/panels/EffectsPanel.tsx",
                    lineNumber: 326,
                    columnNumber: 11
                }, this);
            })
        ]
    }, void 0, true, {
        fileName: "[project]/components/editor/panels/EffectsPanel.tsx",
        lineNumber: 304,
        columnNumber: 5
    }, this);
}
_s(EffectsPanel, "OZMyUyb5798kJi6XooFypJjb/DM=");
_c = EffectsPanel;
const containerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    padding: "8px 4px",
    borderTop: "1px solid rgba(212,168,67,0.1)",
    marginTop: 4
};
const headerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 6px",
    fontSize: 10,
    fontWeight: 700,
    color: "#D4A843",
    letterSpacing: 0.8
};
const colorPickerStyle = {
    width: 24,
    height: 20,
    border: "1px solid rgba(212,168,67,0.3)",
    borderRadius: 3,
    background: "transparent",
    cursor: "pointer",
    padding: 0
};
const removeBtnStyle = {
    padding: "4px 8px",
    background: "rgba(255,68,68,0.1)",
    border: "1px solid rgba(255,68,68,0.3)",
    borderRadius: 4,
    color: "#FF6B6B",
    fontSize: 10,
    cursor: "pointer",
    fontFamily: "inherit",
    margin: "2px 4px"
};
const catHeaderStyle = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 6px",
    background: "rgba(212,168,67,0.04)",
    border: "none",
    borderRadius: 3,
    color: "#D4A843",
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: 0.5,
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left"
};
const catBodyStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
    padding: "4px 6px 8px"
};
const presetBtnStyle = {
    padding: "4px 8px",
    border: "1px solid rgba(212,168,67,0.15)",
    borderRadius: 4,
    background: "transparent",
    color: "#ccc",
    fontSize: 10,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s"
};
var _c;
__turbopack_context__.k.register(_c, "EffectsPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/panels/DomPropsPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DomPropsPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * DomPropsPanel.tsx
 *
 * Painel de propriedades do elemento DOM selecionado no iframe.
 * Le valores via getComputedStyle e aplica mudancas via element.style.
 *
 * Categorias: Posicao, Dimensoes, Transformacao, Tipografia,
 * Cores/Background, Borda, Efeitos (opacity, shadow, blur).
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$EffectsPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/panels/EffectsPanel.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const POSITION_PROPS = [
    {
        key: "left",
        label: "X",
        cssProp: "left",
        type: "px",
        step: 1
    },
    {
        key: "top",
        label: "Y",
        cssProp: "top",
        type: "px",
        step: 1
    }
];
const SIZE_PROPS = [
    {
        key: "width",
        label: "Largura",
        cssProp: "width",
        type: "px",
        step: 1,
        min: 0
    },
    {
        key: "height",
        label: "Altura",
        cssProp: "height",
        type: "px",
        step: 1,
        min: 0
    },
    {
        key: "minWidth",
        label: "Min W",
        cssProp: "minWidth",
        type: "px",
        step: 1,
        min: 0
    },
    {
        key: "minHeight",
        label: "Min H",
        cssProp: "minHeight",
        type: "px",
        step: 1,
        min: 0
    },
    {
        key: "maxWidth",
        label: "Max W",
        cssProp: "maxWidth",
        type: "px",
        step: 1,
        min: 0
    },
    {
        key: "maxHeight",
        label: "Max H",
        cssProp: "maxHeight",
        type: "px",
        step: 1,
        min: 0
    }
];
const TRANSFORM_PROPS = [
    {
        key: "rotate",
        label: "Rotacao",
        cssProp: "rotate",
        type: "deg",
        step: 1,
        min: -360,
        max: 360
    },
    {
        key: "scale",
        label: "Escala",
        cssProp: "scale",
        type: "text",
        step: 0.01
    },
    {
        key: "opacity",
        label: "Opacidade",
        cssProp: "opacity",
        type: "text",
        step: 0.05,
        min: 0,
        max: 1
    }
];
const SPACING_PROPS = [
    {
        key: "marginTop",
        label: "Margin T",
        cssProp: "marginTop",
        type: "px",
        step: 1
    },
    {
        key: "marginRight",
        label: "Margin R",
        cssProp: "marginRight",
        type: "px",
        step: 1
    },
    {
        key: "marginBottom",
        label: "Margin B",
        cssProp: "marginBottom",
        type: "px",
        step: 1
    },
    {
        key: "marginLeft",
        label: "Margin L",
        cssProp: "marginLeft",
        type: "px",
        step: 1
    },
    {
        key: "paddingTop",
        label: "Padding T",
        cssProp: "paddingTop",
        type: "px",
        step: 1
    },
    {
        key: "paddingRight",
        label: "Padding R",
        cssProp: "paddingRight",
        type: "px",
        step: 1
    },
    {
        key: "paddingBottom",
        label: "Padding B",
        cssProp: "paddingBottom",
        type: "px",
        step: 1
    },
    {
        key: "paddingLeft",
        label: "Padding L",
        cssProp: "paddingLeft",
        type: "px",
        step: 1
    }
];
const TYPO_PROPS = [
    {
        key: "fontSize",
        label: "Tamanho",
        cssProp: "fontSize",
        type: "px",
        step: 1,
        min: 1
    },
    {
        key: "fontWeight",
        label: "Peso",
        cssProp: "fontWeight",
        type: "text"
    },
    {
        key: "lineHeight",
        label: "Entrelinha",
        cssProp: "lineHeight",
        type: "px",
        step: 1
    },
    {
        key: "letterSpacing",
        label: "Espacamento",
        cssProp: "letterSpacing",
        type: "px",
        step: 0.5
    },
    {
        key: "textAlign",
        label: "Alinhamento",
        cssProp: "textAlign",
        type: "select",
        options: [
            "left",
            "center",
            "right",
            "justify"
        ]
    }
];
const COLOR_PROPS = [
    {
        key: "color",
        label: "Cor texto",
        cssProp: "color",
        type: "color"
    },
    {
        key: "backgroundColor",
        label: "Fundo",
        cssProp: "backgroundColor",
        type: "color"
    }
];
const BORDER_PROPS = [
    {
        key: "borderRadius",
        label: "Raio borda",
        cssProp: "borderRadius",
        type: "px",
        step: 1,
        min: 0
    },
    {
        key: "borderWidth",
        label: "Espessura",
        cssProp: "borderWidth",
        type: "px",
        step: 1,
        min: 0
    },
    {
        key: "borderColor",
        label: "Cor borda",
        cssProp: "borderColor",
        type: "color"
    },
    {
        key: "borderStyle",
        label: "Estilo",
        cssProp: "borderStyle",
        type: "select",
        options: [
            "none",
            "solid",
            "dashed",
            "dotted",
            "double",
            "groove"
        ]
    }
];
const EFFECT_PROPS = [
    {
        key: "boxShadow",
        label: "Sombra",
        cssProp: "boxShadow",
        type: "text"
    },
    {
        key: "backdropFilter",
        label: "Blur fundo",
        cssProp: "backdropFilter",
        type: "text"
    },
    {
        key: "zIndex",
        label: "Z-Index",
        cssProp: "zIndex",
        type: "text"
    }
];
/** Converte "123px" → 123, "2.5deg" → 2.5, etc */ function parseNum(val) {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
}
/** Converte rgb(r,g,b) pra #hex */ function rgbToHex(rgb) {
    const match = rgb.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!match) return rgb.startsWith("#") ? rgb : "#000000";
    const r = parseInt(match[1]).toString(16).padStart(2, "0");
    const g = parseInt(match[2]).toString(16).padStart(2, "0");
    const b = parseInt(match[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
}
function DomPropsPanel({ selected }) {
    _s();
    const [values, setValues] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [expandedGroups, setExpandedGroups] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        position: true,
        size: true,
        transform: true,
        spacing: false,
        typo: false,
        color: true,
        border: false,
        effect: false
    });
    // Le propriedades computadas do elemento selecionado
    const readProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DomPropsPanel.useCallback[readProps]": ()=>{
            if (!selected) {
                setValues({});
                return;
            }
            try {
                const el = selected.element;
                const win = el.ownerDocument.defaultView;
                if (!win) return;
                const computed = win.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                const vals = {};
                // Posicao: usar rect (mais preciso que computed pra elementos nao-positioned)
                vals.left = `${Math.round(rect.left)}px`;
                vals.top = `${Math.round(rect.top)}px`;
                // Dimensoes
                vals.width = `${Math.round(rect.width)}px`;
                vals.height = `${Math.round(rect.height)}px`;
                // Todas as propriedades
                const allProps = [
                    ...SIZE_PROPS,
                    ...TRANSFORM_PROPS,
                    ...SPACING_PROPS,
                    ...TYPO_PROPS,
                    ...COLOR_PROPS,
                    ...BORDER_PROPS,
                    ...EFFECT_PROPS
                ];
                for (const p of allProps){
                    if (vals[p.key]) continue;
                    const raw = computed.getPropertyValue(p.cssProp.replace(/([A-Z])/g, "-$1").toLowerCase());
                    vals[p.key] = raw || "";
                }
                setValues(vals);
            } catch  {
                setValues({});
            }
        }
    }["DomPropsPanel.useCallback[readProps]"], [
        selected
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DomPropsPanel.useEffect": ()=>{
            readProps();
        }
    }["DomPropsPanel.useEffect"], [
        readProps
    ]);
    // Aplica uma mudanca no estilo do elemento
    const applyStyle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DomPropsPanel.useCallback[applyStyle]": (cssProp, value)=>{
            if (!selected) return;
            try {
                // Notificar IframeEditor pra salvar snapshot (undo)
                window.dispatchEvent(new CustomEvent("editor:push-undo", {
                    detail: {
                        element: selected.element
                    }
                }));
                selected.element.style[cssProp] = value;
                readProps();
            } catch  {}
        }
    }["DomPropsPanel.useCallback[applyStyle]"], [
        selected,
        readProps
    ]);
    if (!selected) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
            style: panelStyle,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: emptyStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            color: "#D4A843",
                            fontWeight: 600,
                            fontSize: 13
                        },
                        children: "Nenhum elemento selecionado"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                        lineNumber: 175,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            color: "#6a6a6a",
                            fontSize: 11,
                            marginTop: 6
                        },
                        children: "Clique num elemento no iframe pra editar propriedades."
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                        lineNumber: 178,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                lineNumber: 174,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
            lineNumber: 173,
            columnNumber: 7
        }, this);
    }
    const toggleGroup = (key)=>{
        setExpandedGroups((prev)=>({
                ...prev,
                [key]: !prev[key]
            }));
    };
    const renderInput = (prop)=>{
        const rawVal = values[prop.key] || "";
        if (prop.type === "color") {
            const hexVal = rgbToHex(rawVal);
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: rowStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: labelStyle,
                        children: prop.label
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                        lineNumber: 197,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            gap: 4,
                            alignItems: "center"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "color",
                                value: hexVal,
                                onChange: (e)=>applyStyle(prop.cssProp, e.target.value),
                                style: {
                                    width: 28,
                                    height: 22,
                                    border: "1px solid rgba(212,168,67,0.3)",
                                    borderRadius: 3,
                                    background: "transparent",
                                    cursor: "pointer",
                                    padding: 0
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                                lineNumber: 199,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                value: rawVal,
                                onChange: (e)=>applyStyle(prop.cssProp, e.target.value),
                                style: textInputStyle
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                                lineNumber: 205,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                        lineNumber: 198,
                        columnNumber: 11
                    }, this)
                ]
            }, prop.key, true, {
                fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                lineNumber: 196,
                columnNumber: 9
            }, this);
        }
        if (prop.type === "select") {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: rowStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: labelStyle,
                        children: prop.label
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                        lineNumber: 219,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: rawVal,
                        onChange: (e)=>applyStyle(prop.cssProp, e.target.value),
                        style: selectInputStyle,
                        children: prop.options?.map((o)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: o,
                                children: o
                            }, o, false, {
                                fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                                lineNumber: 225,
                                columnNumber: 39
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                        lineNumber: 220,
                        columnNumber: 11
                    }, this)
                ]
            }, prop.key, true, {
                fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                lineNumber: 218,
                columnNumber: 9
            }, this);
        }
        // px, deg, percent, text — input numerico com +/-
        const numVal = parseNum(rawVal);
        const suffix = prop.type === "px" ? "px" : prop.type === "deg" ? "deg" : "";
        const step = prop.step ?? 1;
        const adjust = (delta)=>{
            let next = numVal + delta;
            if (prop.min !== undefined) next = Math.max(prop.min, next);
            if (prop.max !== undefined) next = Math.min(prop.max, next);
            applyStyle(prop.cssProp, `${next}${suffix}`);
        };
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: rowStyle,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                    style: labelStyle,
                    children: prop.label
                }, void 0, false, {
                    fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                    lineNumber: 245,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        display: "flex",
                        gap: 2,
                        alignItems: "center"
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>adjust(-step * 10),
                            style: adjBtnStyle,
                            title: "-10",
                            children: "≪"
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                            lineNumber: 247,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>adjust(-step),
                            style: adjBtnStyle,
                            title: "-1",
                            children: "-"
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                            lineNumber: 250,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "text",
                            value: rawVal,
                            onChange: (e)=>applyStyle(prop.cssProp, e.target.value),
                            onKeyDown: (e)=>{
                                if (e.key === "ArrowUp") {
                                    e.preventDefault();
                                    adjust(e.shiftKey ? step * 10 : step);
                                }
                                if (e.key === "ArrowDown") {
                                    e.preventDefault();
                                    adjust(e.shiftKey ? -step * 10 : -step);
                                }
                            },
                            style: {
                                ...numInputStyle,
                                width: prop.type === "text" ? 90 : 60
                            }
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                            lineNumber: 253,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>adjust(step),
                            style: adjBtnStyle,
                            title: "+1",
                            children: "+"
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                            lineNumber: 263,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>adjust(step * 10),
                            style: adjBtnStyle,
                            title: "+10",
                            children: "≫"
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                            lineNumber: 266,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                    lineNumber: 246,
                    columnNumber: 9
                }, this)
            ]
        }, prop.key, true, {
            fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
            lineNumber: 244,
            columnNumber: 7
        }, this);
    };
    const renderGroup = (title, key, props)=>{
        const isOpen = expandedGroups[key] !== false;
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: groupStyle,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: ()=>toggleGroup(key),
                    style: groupHeaderStyle,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            style: {
                                transform: isOpen ? "rotate(90deg)" : "rotate(0)",
                                transition: "transform 0.15s",
                                display: "inline-block",
                                fontSize: 10
                            },
                            children: "▶"
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                            lineNumber: 279,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: title
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                            lineNumber: 282,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                    lineNumber: 278,
                    columnNumber: 9
                }, this),
                isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: groupBodyStyle,
                    children: props.map(renderInput)
                }, void 0, false, {
                    fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                    lineNumber: 285,
                    columnNumber: 11
                }, this)
            ]
        }, key, true, {
            fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
            lineNumber: 277,
            columnNumber: 7
        }, this);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
        style: panelStyle,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: headerStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            color: "#D4A843",
                            fontWeight: 700,
                            fontSize: 12
                        },
                        children: [
                            "<",
                            selected.tag,
                            ">"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                        lineNumber: 297,
                        columnNumber: 9
                    }, this),
                    selected.text && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            color: "#8a8a8a",
                            fontSize: 10,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                        },
                        children: selected.text.slice(0, 25)
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                        lineNumber: 301,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                lineNumber: 296,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: scrollStyle,
                className: "editor-scroll",
                children: [
                    renderGroup("POSICAO", "position", POSITION_PROPS),
                    renderGroup("DIMENSOES", "size", SIZE_PROPS),
                    renderGroup("TRANSFORMACAO", "transform", TRANSFORM_PROPS),
                    renderGroup("ESPACAMENTO", "spacing", SPACING_PROPS),
                    renderGroup("TIPOGRAFIA", "typo", TYPO_PROPS),
                    renderGroup("CORES", "color", COLOR_PROPS),
                    renderGroup("BORDA", "border", BORDER_PROPS),
                    renderGroup("EFEITOS", "effect", EFFECT_PROPS),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$EffectsPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        selected: selected,
                        pushUndo: ()=>{
                            window.dispatchEvent(new CustomEvent("editor:push-undo", {
                                detail: {
                                    element: selected.element
                                }
                            }));
                        }
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                        lineNumber: 317,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
                lineNumber: 307,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/editor/panels/DomPropsPanel.tsx",
        lineNumber: 294,
        columnNumber: 5
    }, this);
}
_s(DomPropsPanel, "ehpG5ADquRyJB1qyRSVWfcs0nRk=");
_c = DomPropsPanel;
// ===== ESTILOS =====
const panelStyle = {
    width: 280,
    background: "#0d0a08",
    border: "1px solid rgba(212,168,67,0.15)",
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    maxHeight: "calc(100vh - 200px)"
};
const emptyStyle = {
    padding: 20,
    textAlign: "center"
};
const headerStyle = {
    padding: "10px 12px",
    borderBottom: "1px solid rgba(212,168,67,0.12)",
    display: "flex",
    gap: 8,
    alignItems: "center"
};
const scrollStyle = {
    flex: 1,
    overflow: "auto",
    padding: 4
};
const groupStyle = {
    marginBottom: 2
};
const groupHeaderStyle = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 8px",
    background: "rgba(212,168,67,0.06)",
    border: "none",
    borderRadius: 4,
    color: "#D4A843",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.8,
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left"
};
const groupBodyStyle = {
    padding: "4px 4px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 3
};
const rowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
    padding: "2px 4px"
};
const labelStyle = {
    fontSize: 10,
    color: "#8a8a8a",
    minWidth: 60,
    whiteSpace: "nowrap"
};
const numInputStyle = {
    width: 60,
    background: "#0a0806",
    color: "#e5e5e5",
    border: "1px solid rgba(212,168,67,0.2)",
    borderRadius: 3,
    padding: "3px 4px",
    fontSize: 11,
    fontFamily: "ui-monospace, monospace",
    textAlign: "center"
};
const textInputStyle = {
    width: 90,
    background: "#0a0806",
    color: "#e5e5e5",
    border: "1px solid rgba(212,168,67,0.2)",
    borderRadius: 3,
    padding: "3px 4px",
    fontSize: 10,
    fontFamily: "ui-monospace, monospace"
};
const selectInputStyle = {
    background: "#0a0806",
    color: "#e5e5e5",
    border: "1px solid rgba(212,168,67,0.2)",
    borderRadius: 3,
    padding: "3px 6px",
    fontSize: 10,
    fontFamily: "inherit"
};
const adjBtnStyle = {
    width: 20,
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(212,168,67,0.08)",
    border: "1px solid rgba(212,168,67,0.2)",
    borderRadius: 3,
    color: "#D4A843",
    fontSize: 10,
    cursor: "pointer",
    fontFamily: "inherit",
    padding: 0
};
var _c;
__turbopack_context__.k.register(_c, "DomPropsPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/panels/FilePanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FilePanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * FilePanel.tsx
 *
 * Lista os arquivos .tsx do alvo selecionado. Ao clicar num
 * arquivo, emite evento pro IframeEditor trocar o ?file= no iframe,
 * renderizando aquele componente isolado.
 *
 * O primeiro item "Tela principal" carrega o jogo completo (sem ?file).
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/state/editorStore.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function FilePanel({ activeFile, onSelectFile }) {
    _s();
    const targetId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "FilePanel.useEditorStore[targetId]": (s)=>s.targetId
    }["FilePanel.useEditorStore[targetId]"]);
    const [files, setFiles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "FilePanel.useEffect": ()=>{
            if (!targetId) {
                setFiles([]);
                return;
            }
            setLoading(true);
            fetch(`/api/editor/list-tsx?game=${encodeURIComponent(targetId)}`).then({
                "FilePanel.useEffect": (r)=>r.json()
            }["FilePanel.useEffect"]).then({
                "FilePanel.useEffect": (data)=>{
                    if (data.ok && Array.isArray(data.files)) {
                        setFiles(data.files);
                    }
                    setLoading(false);
                }
            }["FilePanel.useEffect"]).catch({
                "FilePanel.useEffect": ()=>setLoading(false)
            }["FilePanel.useEffect"]);
        }
    }["FilePanel.useEffect"], [
        targetId
    ]);
    if (!targetId) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: containerStyle,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: headerStyle,
                    children: "ARQUIVOS"
                }, void 0, false, {
                    fileName: "[project]/components/editor/panels/FilePanel.tsx",
                    lineNumber: 55,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    style: emptyStyle,
                    children: "Selecione um alvo"
                }, void 0, false, {
                    fileName: "[project]/components/editor/panels/FilePanel.tsx",
                    lineNumber: 56,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/editor/panels/FilePanel.tsx",
            lineNumber: 54,
            columnNumber: 7
        }, this);
    }
    const formatSize = (bytes)=>{
        if (bytes < 1024) return `${bytes} B`;
        return `${Math.round(bytes / 1024)} KB`;
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: containerStyle,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: headerStyle,
                children: [
                    "ARQUIVOS",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: countStyle,
                        children: files.length
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/FilePanel.tsx",
                        lineNumber: 70,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/FilePanel.tsx",
                lineNumber: 68,
                columnNumber: 7
            }, this),
            loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                style: emptyStyle,
                children: "Carregando..."
            }, void 0, false, {
                fileName: "[project]/components/editor/panels/FilePanel.tsx",
                lineNumber: 73,
                columnNumber: 19
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: listStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>onSelectFile(""),
                        style: {
                            ...itemStyle,
                            background: activeFile === "" ? "rgba(212,168,67,0.15)" : "transparent",
                            borderLeft: activeFile === "" ? "2px solid #D4A843" : "2px solid transparent"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: iconStyle,
                                children: "▶"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/FilePanel.tsx",
                                lineNumber: 85,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: nameStyle,
                                children: "Tela principal"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/FilePanel.tsx",
                                lineNumber: 86,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: tagStyle,
                                children: "GAME"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/FilePanel.tsx",
                                lineNumber: 87,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/FilePanel.tsx",
                        lineNumber: 77,
                        columnNumber: 9
                    }, this),
                    files.map((f)=>{
                        const baseName = f.name.replace(/\.(tsx|ts)$/, "");
                        const isTsx = f.isTsx;
                        // Classificacao baseada na analise dos 7 jogos:
                        // Tipo A: componente principal (*Game.tsx) → carrega tela completa
                        // Tipo B: sub-tela .tsx (Betting, Result, Overlay, etc) → carrega isolado via ?file=
                        // Tipo C: codigo puro .ts (Constants, Engine, Types, hooks) → nao renderizavel
                        const isMainGame = isTsx && /Game$/i.test(baseName);
                        const isCodeOnly = !isTsx; // .ts = constants, engine, types, hooks
                        const isSubComponent = isTsx && !isMainGame;
                        // Destacar se esta ativo
                        const isActive = isMainGame ? activeFile === "" : activeFile === baseName;
                        const handleClick = ()=>{
                            if (isCodeOnly) return; // .ts nao renderiza
                            if (isMainGame) {
                                onSelectFile(""); // tela completa, sem ?file=
                            } else {
                                onSelectFile(baseName); // sub-tela via ?file=
                            }
                        };
                        // Icone e label por tipo
                        let icon = "TS";
                        let label = "";
                        if (isMainGame) {
                            icon = "▶";
                            label = "GAME";
                        } else if (isSubComponent) {
                            icon = "⚛";
                            label = "";
                        } else {
                            icon = "TS";
                            label = "codigo";
                        }
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleClick,
                            style: {
                                ...itemStyle,
                                background: isActive ? "rgba(212,168,67,0.15)" : "transparent",
                                borderLeft: isActive ? "2px solid #D4A843" : "2px solid transparent",
                                opacity: isCodeOnly ? 0.35 : 1,
                                cursor: isCodeOnly ? "default" : "pointer"
                            },
                            title: isCodeOnly ? `${baseName} — arquivo de codigo (nao visual)` : isMainGame ? `${baseName} — tela completa do jogo` : `${baseName} — sub-componente (carrega isolado)`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: iconStyle,
                                    children: icon
                                }, void 0, false, {
                                    fileName: "[project]/components/editor/panels/FilePanel.tsx",
                                    lineNumber: 143,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: nameStyle,
                                    children: baseName
                                }, void 0, false, {
                                    fileName: "[project]/components/editor/panels/FilePanel.tsx",
                                    lineNumber: 144,
                                    columnNumber: 15
                                }, this),
                                label === "GAME" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: tagStyle,
                                    children: "GAME"
                                }, void 0, false, {
                                    fileName: "[project]/components/editor/panels/FilePanel.tsx",
                                    lineNumber: 146,
                                    columnNumber: 17
                                }, this) : label === "codigo" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: {
                                        ...sizeStyle,
                                        color: "#3a3a3a"
                                    },
                                    children: formatSize(f.size)
                                }, void 0, false, {
                                    fileName: "[project]/components/editor/panels/FilePanel.tsx",
                                    lineNumber: 148,
                                    columnNumber: 17
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: sizeStyle,
                                    children: formatSize(f.size)
                                }, void 0, false, {
                                    fileName: "[project]/components/editor/panels/FilePanel.tsx",
                                    lineNumber: 152,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, f.name, true, {
                            fileName: "[project]/components/editor/panels/FilePanel.tsx",
                            lineNumber: 125,
                            columnNumber: 13
                        }, this);
                    })
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/FilePanel.tsx",
                lineNumber: 75,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/editor/panels/FilePanel.tsx",
        lineNumber: 67,
        columnNumber: 5
    }, this);
}
_s(FilePanel, "eVSz9gZKNJCjEDwJD5JRp+G/wJI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"]
    ];
});
_c = FilePanel;
const containerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: 8,
    background: "#0d0a08",
    border: "1px solid rgba(212,168,67,0.15)",
    borderRadius: 8,
    maxHeight: 300,
    overflow: "hidden"
};
const headerStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: "#D4A843",
    letterSpacing: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 4px 8px",
    borderBottom: "1px solid rgba(212,168,67,0.1)"
};
const countStyle = {
    fontSize: 10,
    color: "#8a8a8a",
    fontWeight: 400
};
const listStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    overflow: "auto",
    flex: 1
};
const itemStyle = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 6px",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "ui-monospace, monospace",
    fontSize: 11,
    color: "#e5e5e5",
    textAlign: "left",
    width: "100%",
    transition: "background 0.15s"
};
const iconStyle = {
    fontSize: 10,
    width: 16,
    textAlign: "center",
    flexShrink: 0
};
const nameStyle = {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
};
const sizeStyle = {
    fontSize: 9,
    color: "#5a5a5a",
    flexShrink: 0
};
const tagStyle = {
    fontSize: 8,
    color: "#D4A843",
    border: "1px solid rgba(212,168,67,0.3)",
    borderRadius: 3,
    padding: "1px 4px",
    flexShrink: 0,
    letterSpacing: 0.5
};
const emptyStyle = {
    fontSize: 11,
    color: "#5a5a5a",
    padding: "12px 4px",
    textAlign: "center"
};
var _c;
__turbopack_context__.k.register(_c, "FilePanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/panels/DomTreePanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DomTreePanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * DomTreePanel.tsx
 *
 * Arvore DOM do iframe. Mostra hierarquia completa dos elementos
 * com expand/collapse, busca, e click pra selecionar.
 * Breadcrumbs no topo mostrando caminho ate o elemento selecionado.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
/** Montar arvore a partir do body do iframe */ function buildTree(el, depth, maxDepth) {
    if (depth > maxDepth) return null;
    if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "LINK") return null;
    const tag = el.tagName.toLowerCase();
    const id = el.id || "";
    const classList = el.className && typeof el.className === "string" ? el.className.split(/\s+/).filter(Boolean).slice(0, 3).join(".") : "";
    const textContent = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 ? (el.childNodes[0].textContent || "").trim().slice(0, 20) : "";
    const children = [];
    for(let i = 0; i < el.children.length; i++){
        const child = el.children[i];
        const node = buildTree(child, depth + 1, maxDepth);
        if (node) children.push(node);
    }
    return {
        element: el,
        tag,
        id,
        classes: classList,
        text: textContent,
        children,
        depth
    };
}
/** Obter caminho breadcrumb ate o root */ function getBreadcrumb(el) {
    const path = [];
    let current = el;
    while(current && current.tagName !== "BODY" && current.tagName !== "HTML"){
        path.unshift(current);
        current = current.parentElement;
    }
    return path;
}
function DomTreePanel({ iframeRef, iframeLoaded, selected, onSelect }) {
    _s();
    const [tree, setTree] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [expanded, setExpanded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [breadcrumb, setBreadcrumb] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const scrollRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Reconstruir arvore quando iframe carrega ou a cada 3s (pra pegar mudancas)
    const rebuildTree = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DomTreePanel.useCallback[rebuildTree]": ()=>{
            if (!iframeRef.current || !iframeLoaded) {
                setTree(null);
                return;
            }
            try {
                const doc = iframeRef.current.contentWindow?.document;
                if (!doc?.body) return;
                const root = buildTree(doc.body, 0, 15);
                setTree(root);
            } catch  {
                setTree(null);
            }
        }
    }["DomTreePanel.useCallback[rebuildTree]"], [
        iframeRef,
        iframeLoaded
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DomTreePanel.useEffect": ()=>{
            rebuildTree();
            const interval = setInterval(rebuildTree, 3000);
            return ({
                "DomTreePanel.useEffect": ()=>clearInterval(interval)
            })["DomTreePanel.useEffect"];
        }
    }["DomTreePanel.useEffect"], [
        rebuildTree
    ]);
    // Atualizar breadcrumb quando selecionado muda
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DomTreePanel.useEffect": ()=>{
            if (selected) {
                setBreadcrumb(getBreadcrumb(selected.element));
                // Auto-expand pais do elemento selecionado
                const path = getBreadcrumb(selected.element);
                setExpanded({
                    "DomTreePanel.useEffect": (prev)=>{
                        const next = new Set(prev);
                        path.forEach({
                            "DomTreePanel.useEffect": (el)=>next.add(el)
                        }["DomTreePanel.useEffect"]);
                        return next;
                    }
                }["DomTreePanel.useEffect"]);
            } else {
                setBreadcrumb([]);
            }
        }
    }["DomTreePanel.useEffect"], [
        selected
    ]);
    const toggleExpand = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DomTreePanel.useCallback[toggleExpand]": (el)=>{
            setExpanded({
                "DomTreePanel.useCallback[toggleExpand]": (prev)=>{
                    const next = new Set(prev);
                    if (next.has(el)) next.delete(el);
                    else next.add(el);
                    return next;
                }
            }["DomTreePanel.useCallback[toggleExpand]"]);
        }
    }["DomTreePanel.useCallback[toggleExpand]"], []);
    const handleSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DomTreePanel.useCallback[handleSelect]": (el)=>{
            onSelect(el);
        }
    }["DomTreePanel.useCallback[handleSelect]"], [
        onSelect
    ]);
    const matchesSearch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DomTreePanel.useCallback[matchesSearch]": (node)=>{
            if (!search) return true;
            const q = search.toLowerCase();
            return node.tag.includes(q) || node.id.toLowerCase().includes(q) || node.classes.toLowerCase().includes(q) || node.text.toLowerCase().includes(q);
        }
    }["DomTreePanel.useCallback[matchesSearch]"], [
        search
    ]);
    /** Checar se algum descendente bate com a busca */ const hasMatchingDescendant = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DomTreePanel.useCallback[hasMatchingDescendant]": (node)=>{
            if (matchesSearch(node)) return true;
            return node.children.some({
                "DomTreePanel.useCallback[hasMatchingDescendant]": (c)=>hasMatchingDescendant(c)
            }["DomTreePanel.useCallback[hasMatchingDescendant]"]);
        }
    }["DomTreePanel.useCallback[hasMatchingDescendant]"], [
        matchesSearch
    ]);
    const renderNode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DomTreePanel.useCallback[renderNode]": (node)=>{
            if (search && !hasMatchingDescendant(node)) return null;
            const isSelected = selected?.element === node.element;
            const isExpanded = expanded.has(node.element);
            const hasChildren = node.children.length > 0;
            const indent = node.depth * 14;
            const matches = matchesSearch(node);
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        ref: {
                            "DomTreePanel.useCallback[renderNode]": (el)=>{
                                // Auto-scroll na árvore quando elemento é selecionado
                                if (isSelected && el) {
                                    el.scrollIntoView({
                                        block: "nearest",
                                        behavior: "smooth"
                                    });
                                }
                            }
                        }["DomTreePanel.useCallback[renderNode]"],
                        onClick: {
                            "DomTreePanel.useCallback[renderNode]": (e)=>{
                                e.stopPropagation();
                                handleSelect(node.element);
                            }
                        }["DomTreePanel.useCallback[renderNode]"],
                        style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            paddingLeft: indent,
                            paddingRight: 4,
                            paddingTop: 2,
                            paddingBottom: 2,
                            cursor: "pointer",
                            background: isSelected ? "rgba(212,168,67,0.15)" : "transparent",
                            borderLeft: isSelected ? "2px solid #D4A843" : "2px solid transparent",
                            opacity: matches || !search ? 1 : 0.3,
                            fontSize: 10,
                            fontFamily: "ui-monospace, monospace",
                            whiteSpace: "nowrap",
                            overflow: "hidden"
                        },
                        title: `<${node.tag}>${node.id ? ` #${node.id}` : ""}${node.classes ? ` .${node.classes}` : ""}`,
                        children: [
                            hasChildren ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                onClick: {
                                    "DomTreePanel.useCallback[renderNode]": (e)=>{
                                        e.stopPropagation();
                                        toggleExpand(node.element);
                                    }
                                }["DomTreePanel.useCallback[renderNode]"],
                                style: {
                                    display: "inline-flex",
                                    width: 12,
                                    justifyContent: "center",
                                    color: "#8a8a8a",
                                    fontSize: 8,
                                    flexShrink: 0,
                                    transform: isExpanded ? "rotate(90deg)" : "rotate(0)",
                                    transition: "transform 0.1s",
                                    cursor: "pointer"
                                },
                                children: "▶"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                                lineNumber: 183,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    width: 12,
                                    flexShrink: 0
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                                lineNumber: 203,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    color: isSelected ? "#D4A843" : "#8cb4d4",
                                    flexShrink: 0
                                },
                                children: node.tag
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                                lineNumber: 207,
                                columnNumber: 11
                            }, this),
                            node.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    color: "#c792ea",
                                    flexShrink: 0
                                },
                                children: [
                                    "#",
                                    node.id
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                                lineNumber: 213,
                                columnNumber: 13
                            }, this),
                            node.classes && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    color: "#6a6a6a",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis"
                                },
                                children: [
                                    ".",
                                    node.classes
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                                lineNumber: 220,
                                columnNumber: 13
                            }, this),
                            node.text && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    color: "#5a5a5a",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    marginLeft: 2
                                },
                                children: [
                                    '"',
                                    node.text,
                                    '"'
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                                lineNumber: 227,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                        lineNumber: 151,
                        columnNumber: 9
                    }, this),
                    isExpanded && hasChildren && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: node.children.map({
                            "DomTreePanel.useCallback[renderNode]": (child, idx)=>renderNode(child)
                        }["DomTreePanel.useCallback[renderNode]"])
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                        lineNumber: 235,
                        columnNumber: 11
                    }, this)
                ]
            }, `${node.tag}-${node.depth}-${node.id || node.classes || Math.random()}`, true, {
                fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                lineNumber: 150,
                columnNumber: 7
            }, this);
        }
    }["DomTreePanel.useCallback[renderNode]"], [
        selected,
        expanded,
        search,
        handleSelect,
        toggleExpand,
        matchesSearch,
        hasMatchingDescendant
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: containerStyle,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: headerStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            color: "#D4A843",
                            fontWeight: 700,
                            fontSize: 10,
                            letterSpacing: 0.8
                        },
                        children: "ARVORE DOM"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                        lineNumber: 247,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            color: "#5a5a5a",
                            fontSize: 10
                        },
                        children: tree ? countNodes(tree) : 0
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                        lineNumber: 250,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                lineNumber: 246,
                columnNumber: 7
            }, this),
            breadcrumb.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: breadcrumbBarStyle,
                children: breadcrumb.map((el, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2
                        },
                        children: [
                            i > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    color: "#4a4a4a",
                                    fontSize: 8
                                },
                                children: "›"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                                lineNumber: 260,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>handleSelect(el),
                                style: {
                                    background: el === selected?.element ? "rgba(212,168,67,0.2)" : "transparent",
                                    border: "none",
                                    color: el === selected?.element ? "#D4A843" : "#8a8a8a",
                                    fontSize: 9,
                                    cursor: "pointer",
                                    padding: "1px 3px",
                                    borderRadius: 2,
                                    fontFamily: "ui-monospace, monospace"
                                },
                                children: el.tagName.toLowerCase()
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                                lineNumber: 261,
                                columnNumber: 15
                            }, this)
                        ]
                    }, i, true, {
                        fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                        lineNumber: 259,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                lineNumber: 257,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: searchBarStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        value: search,
                        onChange: (e)=>setSearch(e.target.value),
                        placeholder: "Buscar tag, class, id...",
                        style: searchInputStyle
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                        lineNumber: 283,
                        columnNumber: 9
                    }, this),
                    search && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setSearch(""),
                        style: {
                            background: "none",
                            border: "none",
                            color: "#8a8a8a",
                            cursor: "pointer",
                            fontSize: 10,
                            padding: "0 4px"
                        },
                        children: "✕"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                        lineNumber: 291,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                lineNumber: 282,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: scrollRef,
                style: scrollStyle,
                className: "editor-scroll",
                children: tree ? renderNode(tree) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    style: {
                        color: "#5a5a5a",
                        fontSize: 10,
                        padding: 8,
                        textAlign: "center"
                    },
                    children: iframeLoaded ? "Nenhum elemento" : "Carregando..."
                }, void 0, false, {
                    fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                    lineNumber: 303,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
                lineNumber: 301,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/editor/panels/DomTreePanel.tsx",
        lineNumber: 244,
        columnNumber: 5
    }, this);
}
_s(DomTreePanel, "wT0AS3/kai5XN1emFKqkizNsElw=");
_c = DomTreePanel;
function countNodes(node) {
    return 1 + node.children.reduce((sum, c)=>sum + countNodes(c), 0);
}
const containerStyle = {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    flex: 1,
    minHeight: 100,
    maxHeight: "calc(100vh - 420px)",
    background: "#0d0a08",
    border: "1px solid rgba(212,168,67,0.15)",
    borderRadius: 8
};
const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 10px",
    borderBottom: "1px solid rgba(212,168,67,0.12)"
};
const breadcrumbBarStyle = {
    display: "flex",
    alignItems: "center",
    gap: 1,
    padding: "4px 8px",
    background: "rgba(212,168,67,0.04)",
    borderBottom: "1px solid rgba(212,168,67,0.08)",
    overflowX: "auto",
    whiteSpace: "nowrap",
    minHeight: 22
};
const searchBarStyle = {
    display: "flex",
    alignItems: "center",
    padding: "4px 8px",
    borderBottom: "1px solid rgba(212,168,67,0.08)"
};
const searchInputStyle = {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#e5e5e5",
    fontSize: 10,
    fontFamily: "ui-monospace, monospace",
    outline: "none",
    padding: "2px 0"
};
const scrollStyle = {
    flex: 1,
    overflow: "auto",
    padding: "4px 0"
};
var _c;
__turbopack_context__.k.register(_c, "DomTreePanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/panels/ImageUploadPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ImageUploadPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * ImageUploadPanel.tsx
 *
 * Quando o elemento selecionado eh <img>, mostra botao "Trocar imagem".
 * Quando eh div/button, mostra "Background image".
 * Preview instantaneo via FileReader + API POST pra salvar.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function ImageUploadPanel({ selected, pushUndo }) {
    _s();
    const fileRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [preview, setPreview] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [uploading, setUploading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("src");
    const isImg = selected?.tag === "img";
    const hasBg = selected ? Boolean(selected.element.style.backgroundImage || getComputedStyle(selected.element).backgroundImage !== "none") : false;
    const canUpload = selected && (isImg || selected.tag === "div" || selected.tag === "button" || selected.tag === "section" || selected.tag === "span");
    const handleFileChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ImageUploadPanel.useCallback[handleFileChange]": async (e)=>{
            const file = e.target.files?.[0];
            if (!file || !selected) return;
            // Validar tipo
            const validTypes = [
                "image/png",
                "image/jpeg",
                "image/webp",
                "image/svg+xml"
            ];
            if (!validTypes.includes(file.type)) {
                window.dispatchEvent(new CustomEvent("editor:toast", {
                    detail: {
                        type: "error",
                        message: "Formato invalido. Use PNG, JPG, WebP ou SVG."
                    }
                }));
                return;
            }
            // Preview instantaneo via FileReader
            const reader = new FileReader();
            reader.onload = ({
                "ImageUploadPanel.useCallback[handleFileChange]": ()=>{
                    const base64 = reader.result;
                    setPreview(base64);
                    pushUndo();
                    if (mode === "src" && isImg) {
                        selected.element.src = base64;
                    } else {
                        selected.element.style.backgroundImage = `url(${base64})`;
                        selected.element.style.backgroundSize = "cover";
                        selected.element.style.backgroundPosition = "center";
                    }
                    window.dispatchEvent(new CustomEvent("editor:toast", {
                        detail: {
                            type: "success",
                            message: "Preview aplicado. Salve pra persistir."
                        }
                    }));
                }
            })["ImageUploadPanel.useCallback[handleFileChange]"];
            reader.readAsDataURL(file);
            // Reset input pra permitir re-selecao do mesmo arquivo
            if (fileRef.current) fileRef.current.value = "";
        }
    }["ImageUploadPanel.useCallback[handleFileChange]"], [
        selected,
        isImg,
        mode,
        pushUndo
    ]);
    const handleUpload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ImageUploadPanel.useCallback[handleUpload]": async ()=>{
            if (!preview || !selected) return;
            setUploading(true);
            try {
                const resp = await fetch("/api/editor/upload", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        base64: preview,
                        gameId: selected.element.closest("[data-game-id]")?.getAttribute("data-game-id") || "unknown",
                        filename: `upload-${Date.now()}.png`
                    })
                });
                const data = await resp.json();
                if (data.ok && data.url) {
                    if (mode === "src" && isImg) {
                        selected.element.src = data.url;
                    } else {
                        selected.element.style.backgroundImage = `url(${data.url})`;
                    }
                    window.dispatchEvent(new CustomEvent("editor:toast", {
                        detail: {
                            type: "success",
                            message: `Imagem salva: ${data.url}`
                        }
                    }));
                    setPreview(null);
                } else {
                    throw new Error(data.error || "Erro ao salvar");
                }
            } catch (err) {
                window.dispatchEvent(new CustomEvent("editor:toast", {
                    detail: {
                        type: "error",
                        message: `Upload falhou: ${err instanceof Error ? err.message : String(err)}`
                    }
                }));
            }
            setUploading(false);
        }
    }["ImageUploadPanel.useCallback[handleUpload]"], [
        preview,
        selected,
        isImg,
        mode
    ]);
    const handleRemoveBg = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ImageUploadPanel.useCallback[handleRemoveBg]": ()=>{
            if (!selected) return;
            pushUndo();
            selected.element.style.backgroundImage = "";
            selected.element.style.backgroundSize = "";
            selected.element.style.backgroundPosition = "";
            setPreview(null);
            window.dispatchEvent(new CustomEvent("editor:toast", {
                detail: {
                    type: "success",
                    message: "Background removido"
                }
            }));
        }
    }["ImageUploadPanel.useCallback[handleRemoveBg]"], [
        selected,
        pushUndo
    ]);
    if (!canUpload) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: containerStyle,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: headerStyle,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    style: {
                        color: "#D4A843",
                        fontWeight: 700,
                        fontSize: 10,
                        letterSpacing: 0.8
                    },
                    children: "IMAGEM"
                }, void 0, false, {
                    fileName: "[project]/components/editor/panels/ImageUploadPanel.tsx",
                    lineNumber: 122,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/editor/panels/ImageUploadPanel.tsx",
                lineNumber: 121,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: bodyStyle,
                children: [
                    !isImg && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            gap: 4,
                            marginBottom: 6
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setMode("bg"),
                            style: mode === "bg" ? tabActiveStyle : tabStyle,
                            children: "Background"
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/ImageUploadPanel.tsx",
                            lineNumber: 131,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/ImageUploadPanel.tsx",
                        lineNumber: 130,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        ref: fileRef,
                        type: "file",
                        accept: "image/png,image/jpeg,image/webp,image/svg+xml",
                        onChange: handleFileChange,
                        style: {
                            display: "none"
                        }
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/ImageUploadPanel.tsx",
                        lineNumber: 141,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>fileRef.current?.click(),
                        style: uploadBtnStyle,
                        children: isImg ? "Trocar imagem" : "Escolher imagem"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/ImageUploadPanel.tsx",
                        lineNumber: 148,
                        columnNumber: 9
                    }, this),
                    preview && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: 6
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: preview,
                                alt: "Preview",
                                style: {
                                    width: "100%",
                                    borderRadius: 4,
                                    border: "1px solid rgba(212,168,67,0.2)",
                                    maxHeight: 80,
                                    objectFit: "contain"
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/ImageUploadPanel.tsx",
                                lineNumber: 158,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    gap: 4,
                                    marginTop: 4
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: handleUpload,
                                    disabled: uploading,
                                    style: saveBtnStyle,
                                    children: uploading ? "Salvando..." : "Salvar no servidor"
                                }, void 0, false, {
                                    fileName: "[project]/components/editor/panels/ImageUploadPanel.tsx",
                                    lineNumber: 164,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/ImageUploadPanel.tsx",
                                lineNumber: 163,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/ImageUploadPanel.tsx",
                        lineNumber: 157,
                        columnNumber: 11
                    }, this),
                    !isImg && hasBg && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleRemoveBg,
                        style: removeBtnStyle,
                        children: "Remover background"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/ImageUploadPanel.tsx",
                        lineNumber: 173,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            color: "#5a5a5a",
                            fontSize: 9,
                            marginTop: 4
                        },
                        children: "PNG, JPG, WebP, SVG. Preview instantaneo."
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/ImageUploadPanel.tsx",
                        lineNumber: 179,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/ImageUploadPanel.tsx",
                lineNumber: 127,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/editor/panels/ImageUploadPanel.tsx",
        lineNumber: 120,
        columnNumber: 5
    }, this);
}
_s(ImageUploadPanel, "gJcSJxbdu/2LBz9hCjpNPRwclmY=");
_c = ImageUploadPanel;
const containerStyle = {
    marginTop: 2
};
const headerStyle = {
    padding: "6px 8px",
    background: "rgba(212,168,67,0.06)",
    borderRadius: 4
};
const bodyStyle = {
    padding: "6px 8px"
};
const uploadBtnStyle = {
    width: "100%",
    padding: "6px 10px",
    background: "rgba(212,168,67,0.1)",
    border: "1px solid rgba(212,168,67,0.3)",
    borderRadius: 4,
    color: "#D4A843",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit"
};
const saveBtnStyle = {
    flex: 1,
    padding: "4px 8px",
    background: "rgba(0,200,100,0.12)",
    border: "1px solid rgba(0,200,100,0.3)",
    borderRadius: 3,
    color: "#00C864",
    fontSize: 10,
    cursor: "pointer",
    fontFamily: "inherit"
};
const removeBtnStyle = {
    width: "100%",
    padding: "4px 8px",
    marginTop: 4,
    background: "rgba(255,68,68,0.08)",
    border: "1px solid rgba(255,68,68,0.2)",
    borderRadius: 3,
    color: "#FF6666",
    fontSize: 10,
    cursor: "pointer",
    fontFamily: "inherit"
};
const tabStyle = {
    padding: "3px 8px",
    background: "rgba(212,168,67,0.06)",
    border: "1px solid rgba(212,168,67,0.15)",
    borderRadius: 3,
    color: "#8a8a8a",
    fontSize: 9,
    cursor: "pointer",
    fontFamily: "inherit"
};
const tabActiveStyle = {
    ...tabStyle,
    background: "rgba(212,168,67,0.15)",
    borderColor: "rgba(212,168,67,0.4)",
    color: "#D4A843"
};
var _c;
__turbopack_context__.k.register(_c, "ImageUploadPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/panels/HoverEditorPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HoverEditorPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * HoverEditorPanel.tsx
 *
 * Editor de estados CSS (Normal / Hover / Active / Focus).
 * Injeta <style> no iframe com regras :hover, :active, :focus.
 * Toggle entre estados pra editar propriedades de cada um.
 *
 * Tecnica: adiciona classe temporaria (ed-hover-xxx) no elemento
 * e injeta regra `.ed-hover-xxx:hover { ... }` no iframe.
 * Pra forcar preview do hover sem mouse: aplica classe
 * `.ed-force-hover` com mesmos estilos inline.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
const EDITABLE_PROPS = [
    {
        key: "backgroundColor",
        label: "Fundo"
    },
    {
        key: "color",
        label: "Cor texto"
    },
    {
        key: "borderColor",
        label: "Cor borda"
    },
    {
        key: "boxShadow",
        label: "Sombra"
    },
    {
        key: "transform",
        label: "Transform"
    },
    {
        key: "opacity",
        label: "Opacidade"
    },
    {
        key: "filter",
        label: "Filtro"
    }
];
function HoverEditorPanel({ selected, pushUndo }) {
    _s();
    const [activeState, setActiveState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("normal");
    const [stateStyles, setStateStyles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        hover: {},
        active: {},
        focus: {}
    });
    const [previewing, setPreviewing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const styleElRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Reset quando troca de elemento
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HoverEditorPanel.useEffect": ()=>{
            setActiveState("normal");
            setStateStyles({
                hover: {},
                active: {},
                focus: {}
            });
            setPreviewing(false);
        }
    }["HoverEditorPanel.useEffect"], [
        selected?.editorId
    ]);
    /** Garantir que o elemento tem classe editavel */ const ensureClass = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HoverEditorPanel.useCallback[ensureClass]": ()=>{
            if (!selected) return "";
            let cls = selected.element.getAttribute("data-editor-hover-cls");
            if (!cls) {
                cls = `ed-hover-${selected.editorId}`;
                selected.element.setAttribute("data-editor-hover-cls", cls);
                selected.element.classList.add(cls);
            }
            return cls;
        }
    }["HoverEditorPanel.useCallback[ensureClass]"], [
        selected
    ]);
    /** Injetar/atualizar <style> no iframe */ const injectStyles = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HoverEditorPanel.useCallback[injectStyles]": ()=>{
            if (!selected) return;
            const cls = ensureClass();
            if (!cls) return;
            try {
                const doc = selected.element.ownerDocument;
                if (!doc) return;
                // Remover style anterior
                if (styleElRef.current && styleElRef.current.parentNode) {
                    styleElRef.current.parentNode.removeChild(styleElRef.current);
                }
                const styleEl = doc.createElement("style");
                styleEl.setAttribute("data-editor-hover-styles", "true");
                let css = "";
                // Hover
                const hoverProps = Object.entries(stateStyles.hover);
                if (hoverProps.length > 0) {
                    css += `.${cls}:hover { ${hoverProps.map({
                        "HoverEditorPanel.useCallback[injectStyles]": ([k, v])=>`${camelToKebab(k)}: ${v} !important`
                    }["HoverEditorPanel.useCallback[injectStyles]"]).join("; ")}; }\n`;
                }
                // Active
                const activeProps = Object.entries(stateStyles.active);
                if (activeProps.length > 0) {
                    css += `.${cls}:active { ${activeProps.map({
                        "HoverEditorPanel.useCallback[injectStyles]": ([k, v])=>`${camelToKebab(k)}: ${v} !important`
                    }["HoverEditorPanel.useCallback[injectStyles]"]).join("; ")}; }\n`;
                }
                // Focus
                const focusProps = Object.entries(stateStyles.focus);
                if (focusProps.length > 0) {
                    css += `.${cls}:focus { ${focusProps.map({
                        "HoverEditorPanel.useCallback[injectStyles]": ([k, v])=>`${camelToKebab(k)}: ${v} !important`
                    }["HoverEditorPanel.useCallback[injectStyles]"]).join("; ")}; }\n`;
                }
                // Force preview class
                if (previewing && activeState !== "normal") {
                    const previewProps = Object.entries(stateStyles[activeState] || {});
                    if (previewProps.length > 0) {
                        css += `.ed-force-${activeState} { ${previewProps.map({
                            "HoverEditorPanel.useCallback[injectStyles]": ([k, v])=>`${camelToKebab(k)}: ${v} !important`
                        }["HoverEditorPanel.useCallback[injectStyles]"]).join("; ")}; }\n`;
                    }
                }
                styleEl.textContent = css;
                doc.head.appendChild(styleEl);
                styleElRef.current = styleEl;
            } catch  {}
        }
    }["HoverEditorPanel.useCallback[injectStyles]"], [
        selected,
        stateStyles,
        ensureClass,
        previewing,
        activeState
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HoverEditorPanel.useEffect": ()=>{
            injectStyles();
        }
    }["HoverEditorPanel.useEffect"], [
        injectStyles
    ]);
    /** Toggle preview (forcar estado sem mouse) */ const togglePreview = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HoverEditorPanel.useCallback[togglePreview]": ()=>{
            if (!selected || activeState === "normal") return;
            const next = !previewing;
            setPreviewing(next);
            if (next) {
                selected.element.classList.add(`ed-force-${activeState}`);
            } else {
                selected.element.classList.remove(`ed-force-hover`, `ed-force-active`, `ed-force-focus`);
            }
        }
    }["HoverEditorPanel.useCallback[togglePreview]"], [
        selected,
        activeState,
        previewing
    ]);
    // Limpar classes ao desmontar ou trocar estado
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HoverEditorPanel.useEffect": ()=>{
            return ({
                "HoverEditorPanel.useEffect": ()=>{
                    if (selected) {
                        selected.element.classList.remove("ed-force-hover", "ed-force-active", "ed-force-focus");
                    }
                }
            })["HoverEditorPanel.useEffect"];
        }
    }["HoverEditorPanel.useEffect"], [
        selected,
        activeState
    ]);
    const updateProp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HoverEditorPanel.useCallback[updateProp]": (state, prop, value)=>{
            if (state === "normal") return;
            pushUndo();
            setStateStyles({
                "HoverEditorPanel.useCallback[updateProp]": (prev)=>({
                        ...prev,
                        [state]: {
                            ...prev[state],
                            [prop]: value
                        }
                    })
            }["HoverEditorPanel.useCallback[updateProp]"]);
        }
    }["HoverEditorPanel.useCallback[updateProp]"], [
        pushUndo
    ]);
    const removeProp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HoverEditorPanel.useCallback[removeProp]": (state, prop)=>{
            if (state === "normal") return;
            setStateStyles({
                "HoverEditorPanel.useCallback[removeProp]": (prev)=>{
                    const copy = {
                        ...prev[state]
                    };
                    delete copy[prop];
                    return {
                        ...prev,
                        [state]: copy
                    };
                }
            }["HoverEditorPanel.useCallback[removeProp]"]);
        }
    }["HoverEditorPanel.useCallback[removeProp]"], []);
    const removeAllState = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HoverEditorPanel.useCallback[removeAllState]": (state)=>{
            if (state === "normal") return;
            setStateStyles({
                "HoverEditorPanel.useCallback[removeAllState]": (prev)=>({
                        ...prev,
                        [state]: {}
                    })
            }["HoverEditorPanel.useCallback[removeAllState]"]);
            if (selected) {
                selected.element.classList.remove(`ed-force-${state}`);
            }
        }
    }["HoverEditorPanel.useCallback[removeAllState]"], [
        selected
    ]);
    if (!selected) return null;
    const currentStateProps = activeState === "normal" ? {} : stateStyles[activeState] || {};
    const stateCount = (s)=>{
        if (s === "normal") return 0;
        return Object.keys(stateStyles[s] || {}).length;
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: containerStyle,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: headerStyle,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    style: {
                        color: "#D4A843",
                        fontWeight: 700,
                        fontSize: 10,
                        letterSpacing: 0.8
                    },
                    children: "ESTADOS CSS"
                }, void 0, false, {
                    fileName: "[project]/components/editor/panels/HoverEditorPanel.tsx",
                    lineNumber: 187,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/editor/panels/HoverEditorPanel.tsx",
                lineNumber: 186,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: tabsStyle,
                children: [
                    "normal",
                    "hover",
                    "active",
                    "focus"
                ].map((state)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>{
                            if (selected) selected.element.classList.remove("ed-force-hover", "ed-force-active", "ed-force-focus");
                            setPreviewing(false);
                            setActiveState(state);
                        },
                        style: activeState === state ? tabActiveStyle : tabStyle,
                        children: [
                            state.charAt(0).toUpperCase() + state.slice(1),
                            stateCount(state) > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    marginLeft: 3,
                                    color: "#D4A843",
                                    fontSize: 8
                                },
                                children: [
                                    "(",
                                    stateCount(state),
                                    ")"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/editor/panels/HoverEditorPanel.tsx",
                                lineNumber: 206,
                                columnNumber: 15
                            }, this)
                        ]
                    }, state, true, {
                        fileName: "[project]/components/editor/panels/HoverEditorPanel.tsx",
                        lineNumber: 195,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/components/editor/panels/HoverEditorPanel.tsx",
                lineNumber: 193,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: bodyStyle,
                children: activeState === "normal" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    style: {
                        color: "#6a6a6a",
                        fontSize: 10,
                        textAlign: "center",
                        padding: 8
                    },
                    children: "Estado normal — edite via painel de propriedades acima."
                }, void 0, false, {
                    fileName: "[project]/components/editor/panels/HoverEditorPanel.tsx",
                    lineNumber: 217,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: togglePreview,
                            style: {
                                ...previewBtnStyle,
                                background: previewing ? "rgba(0,230,118,0.15)" : "rgba(212,168,67,0.08)",
                                borderColor: previewing ? "rgba(0,230,118,0.4)" : "rgba(212,168,67,0.2)",
                                color: previewing ? "#00E676" : "#D4A843"
                            },
                            children: previewing ? `Previewing :${activeState}` : `Preview :${activeState}`
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/HoverEditorPanel.tsx",
                            lineNumber: 223,
                            columnNumber: 13
                        }, this),
                        EDITABLE_PROPS.map((prop)=>{
                            const val = currentStateProps[prop.key] || "";
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: rowStyle,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        style: labelStyle,
                                        children: prop.label
                                    }, void 0, false, {
                                        fileName: "[project]/components/editor/panels/HoverEditorPanel.tsx",
                                        lineNumber: 240,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: "flex",
                                            gap: 2,
                                            alignItems: "center"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                value: val,
                                                onChange: (e)=>updateProp(activeState, prop.key, e.target.value),
                                                placeholder: "—",
                                                style: inputStyle
                                            }, void 0, false, {
                                                fileName: "[project]/components/editor/panels/HoverEditorPanel.tsx",
                                                lineNumber: 242,
                                                columnNumber: 21
                                            }, this),
                                            val && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>removeProp(activeState, prop.key),
                                                style: removePropBtnStyle,
                                                title: "Remover",
                                                children: "✕"
                                            }, void 0, false, {
                                                fileName: "[project]/components/editor/panels/HoverEditorPanel.tsx",
                                                lineNumber: 250,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/editor/panels/HoverEditorPanel.tsx",
                                        lineNumber: 241,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, prop.key, true, {
                                fileName: "[project]/components/editor/panels/HoverEditorPanel.tsx",
                                lineNumber: 239,
                                columnNumber: 17
                            }, this);
                        }),
                        Object.keys(currentStateProps).length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>removeAllState(activeState),
                            style: clearBtnStyle,
                            children: [
                                "Remover todos os estilos :",
                                activeState
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/editor/panels/HoverEditorPanel.tsx",
                            lineNumber: 265,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true)
            }, void 0, false, {
                fileName: "[project]/components/editor/panels/HoverEditorPanel.tsx",
                lineNumber: 215,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/editor/panels/HoverEditorPanel.tsx",
        lineNumber: 185,
        columnNumber: 5
    }, this);
}
_s(HoverEditorPanel, "2FkbLSMEpsHrm2Ed6E/dvnBuU7o=");
_c = HoverEditorPanel;
function camelToKebab(s) {
    return s.replace(/([A-Z])/g, "-$1").toLowerCase();
}
const containerStyle = {
    marginTop: 2
};
const headerStyle = {
    padding: "6px 8px",
    background: "rgba(212,168,67,0.06)",
    borderRadius: 4
};
const tabsStyle = {
    display: "flex",
    gap: 2,
    padding: "6px 8px 2px"
};
const tabStyle = {
    padding: "3px 8px",
    background: "rgba(212,168,67,0.04)",
    border: "1px solid rgba(212,168,67,0.12)",
    borderRadius: 3,
    color: "#8a8a8a",
    fontSize: 9,
    cursor: "pointer",
    fontFamily: "inherit"
};
const tabActiveStyle = {
    ...tabStyle,
    background: "rgba(212,168,67,0.15)",
    borderColor: "rgba(212,168,67,0.4)",
    color: "#D4A843",
    fontWeight: 600
};
const bodyStyle = {
    padding: "4px 8px 8px"
};
const previewBtnStyle = {
    width: "100%",
    padding: "4px 8px",
    border: "1px solid",
    borderRadius: 3,
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    marginBottom: 6
};
const rowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
    padding: "2px 0"
};
const labelStyle = {
    fontSize: 9,
    color: "#8a8a8a",
    minWidth: 55
};
const inputStyle = {
    width: 110,
    background: "#0a0806",
    color: "#e5e5e5",
    border: "1px solid rgba(212,168,67,0.2)",
    borderRadius: 3,
    padding: "3px 4px",
    fontSize: 10,
    fontFamily: "ui-monospace, monospace"
};
const removePropBtnStyle = {
    background: "none",
    border: "none",
    color: "#FF6666",
    cursor: "pointer",
    fontSize: 9,
    padding: "0 2px"
};
const clearBtnStyle = {
    width: "100%",
    padding: "4px 8px",
    marginTop: 6,
    background: "rgba(255,68,68,0.08)",
    border: "1px solid rgba(255,68,68,0.2)",
    borderRadius: 3,
    color: "#FF6666",
    fontSize: 9,
    cursor: "pointer",
    fontFamily: "inherit"
};
var _c;
__turbopack_context__.k.register(_c, "HoverEditorPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/panels/VideoBackgroundPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>VideoBackgroundPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * VideoBackgroundPanel.tsx
 *
 * Fase 7 — Inserir video de fundo em containers.
 * Suporta WebM (alpha transparency) e MP4.
 * Insere <video autoplay loop muted playsinline> posicionado absolute.
 * Fallback: poster image quando video nao carrega.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function VideoBackgroundPanel({ selected, pushUndo }) {
    _s();
    const fileRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [videoSrc, setVideoSrc] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [uploading, setUploading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const isContainer = selected && [
        "div",
        "section",
        "main",
        "article",
        "aside"
    ].includes(selected.tag);
    const hasVideo = selected ? Boolean(selected.element.querySelector("video[data-editor-video]")) : false;
    const handleFileChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "VideoBackgroundPanel.useCallback[handleFileChange]": (e)=>{
            const file = e.target.files?.[0];
            if (!file || !selected) return;
            const validTypes = [
                "video/webm",
                "video/mp4"
            ];
            if (!validTypes.includes(file.type)) {
                window.dispatchEvent(new CustomEvent("editor:toast", {
                    detail: {
                        type: "error",
                        message: "Use WebM ou MP4."
                    }
                }));
                return;
            }
            pushUndo();
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
            // Garantir position relative no container
            const computed = getComputedStyle(selected.element);
            if (computed.position === "static") {
                selected.element.style.position = "relative";
            }
            // Remover video anterior se existir
            const old = selected.element.querySelector("video[data-editor-video]");
            if (old) old.remove();
            // Criar video element
            const video = selected.element.ownerDocument.createElement("video");
            video.setAttribute("data-editor-video", "true");
            video.src = url;
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
      pointer-events: none;
    `;
            // Inserir como primeiro filho (fica atras do conteudo)
            selected.element.insertBefore(video, selected.element.firstChild);
            window.dispatchEvent(new CustomEvent("editor:toast", {
                detail: {
                    type: "success",
                    message: "Video inserido. Salve pra persistir."
                }
            }));
            if (fileRef.current) fileRef.current.value = "";
        }
    }["VideoBackgroundPanel.useCallback[handleFileChange]"], [
        selected,
        pushUndo
    ]);
    const handleRemoveVideo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "VideoBackgroundPanel.useCallback[handleRemoveVideo]": ()=>{
            if (!selected) return;
            pushUndo();
            const video = selected.element.querySelector("video[data-editor-video]");
            if (video) video.remove();
            setVideoSrc(null);
            window.dispatchEvent(new CustomEvent("editor:toast", {
                detail: {
                    type: "success",
                    message: "Video removido"
                }
            }));
        }
    }["VideoBackgroundPanel.useCallback[handleRemoveVideo]"], [
        selected,
        pushUndo
    ]);
    const handleTogglePlay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "VideoBackgroundPanel.useCallback[handleTogglePlay]": ()=>{
            if (!selected) return;
            const video = selected.element.querySelector("video[data-editor-video]");
            if (!video) return;
            if (video.paused) video.play();
            else video.pause();
        }
    }["VideoBackgroundPanel.useCallback[handleTogglePlay]"], [
        selected
    ]);
    if (!isContainer) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: containerStyle,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: headerStyle,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    style: {
                        color: "#D4A843",
                        fontWeight: 700,
                        fontSize: 10,
                        letterSpacing: 0.8
                    },
                    children: "VIDEO FUNDO"
                }, void 0, false, {
                    fileName: "[project]/components/editor/panels/VideoBackgroundPanel.tsx",
                    lineNumber: 105,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/editor/panels/VideoBackgroundPanel.tsx",
                lineNumber: 104,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: bodyStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        ref: fileRef,
                        type: "file",
                        accept: "video/webm,video/mp4",
                        onChange: handleFileChange,
                        style: {
                            display: "none"
                        }
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/VideoBackgroundPanel.tsx",
                        lineNumber: 111,
                        columnNumber: 9
                    }, this),
                    !hasVideo ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>fileRef.current?.click(),
                        style: uploadBtnStyle,
                        children: "Inserir video de fundo"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/VideoBackgroundPanel.tsx",
                        lineNumber: 120,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            flexDirection: "column",
                            gap: 4
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    gap: 4
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleTogglePlay,
                                        style: actionBtnStyle,
                                        children: "Play/Pause"
                                    }, void 0, false, {
                                        fileName: "[project]/components/editor/panels/VideoBackgroundPanel.tsx",
                                        lineNumber: 126,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>fileRef.current?.click(),
                                        style: actionBtnStyle,
                                        children: "Trocar"
                                    }, void 0, false, {
                                        fileName: "[project]/components/editor/panels/VideoBackgroundPanel.tsx",
                                        lineNumber: 129,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/editor/panels/VideoBackgroundPanel.tsx",
                                lineNumber: 125,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleRemoveVideo,
                                style: removeBtnStyle,
                                children: "Remover video"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/VideoBackgroundPanel.tsx",
                                lineNumber: 133,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/VideoBackgroundPanel.tsx",
                        lineNumber: 124,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            color: "#5a5a5a",
                            fontSize: 9,
                            marginTop: 4
                        },
                        children: "WebM (alpha) ou MP4. Autoplay, loop, muted."
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/VideoBackgroundPanel.tsx",
                        lineNumber: 139,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/VideoBackgroundPanel.tsx",
                lineNumber: 110,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/editor/panels/VideoBackgroundPanel.tsx",
        lineNumber: 103,
        columnNumber: 5
    }, this);
}
_s(VideoBackgroundPanel, "I6S4AZANRjTwj6vrI38au9xfj2w=");
_c = VideoBackgroundPanel;
const containerStyle = {
    marginTop: 2
};
const headerStyle = {
    padding: "6px 8px",
    background: "rgba(212,168,67,0.06)",
    borderRadius: 4
};
const bodyStyle = {
    padding: "6px 8px"
};
const uploadBtnStyle = {
    width: "100%",
    padding: "6px 10px",
    background: "rgba(138,80,200,0.1)",
    border: "1px solid rgba(138,80,200,0.3)",
    borderRadius: 4,
    color: "#B080E0",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit"
};
const actionBtnStyle = {
    flex: 1,
    padding: "4px 8px",
    background: "rgba(212,168,67,0.08)",
    border: "1px solid rgba(212,168,67,0.2)",
    borderRadius: 3,
    color: "#D4A843",
    fontSize: 10,
    cursor: "pointer",
    fontFamily: "inherit"
};
const removeBtnStyle = {
    width: "100%",
    padding: "4px 8px",
    background: "rgba(255,68,68,0.08)",
    border: "1px solid rgba(255,68,68,0.2)",
    borderRadius: 3,
    color: "#FF6666",
    fontSize: 10,
    cursor: "pointer",
    fontFamily: "inherit"
};
var _c;
__turbopack_context__.k.register(_c, "VideoBackgroundPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/panels/CssToolsPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CssToolsPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * CssToolsPanel.tsx
 *
 * Fase 8 — Copiar CSS + Filtros CSS visuais.
 * 8.1: Botao "Copiar CSS" que copia computed style formatado.
 * 8.2: 7 sliders de filtros CSS com preview em tempo real.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
const DEFAULT_FILTERS = {
    brightness: 100,
    contrast: 100,
    saturate: 100,
    hueRotate: 0,
    blur: 0,
    grayscale: 0,
    sepia: 0
};
const FILTER_DEFS = [
    {
        key: "brightness",
        label: "Brilho",
        unit: "%",
        min: 0,
        max: 300,
        step: 5
    },
    {
        key: "contrast",
        label: "Contraste",
        unit: "%",
        min: 0,
        max: 300,
        step: 5
    },
    {
        key: "saturate",
        label: "Saturacao",
        unit: "%",
        min: 0,
        max: 300,
        step: 5
    },
    {
        key: "hueRotate",
        label: "Matiz",
        unit: "deg",
        min: 0,
        max: 360,
        step: 5
    },
    {
        key: "blur",
        label: "Desfoque",
        unit: "px",
        min: 0,
        max: 20,
        step: 0.5
    },
    {
        key: "grayscale",
        label: "P&B",
        unit: "%",
        min: 0,
        max: 100,
        step: 5
    },
    {
        key: "sepia",
        label: "Sepia",
        unit: "%",
        min: 0,
        max: 100,
        step: 5
    }
];
function filtersToCSS(f) {
    const parts = [];
    if (f.brightness !== 100) parts.push(`brightness(${f.brightness}%)`);
    if (f.contrast !== 100) parts.push(`contrast(${f.contrast}%)`);
    if (f.saturate !== 100) parts.push(`saturate(${f.saturate}%)`);
    if (f.hueRotate !== 0) parts.push(`hue-rotate(${f.hueRotate}deg)`);
    if (f.blur !== 0) parts.push(`blur(${f.blur}px)`);
    if (f.grayscale !== 0) parts.push(`grayscale(${f.grayscale}%)`);
    if (f.sepia !== 0) parts.push(`sepia(${f.sepia}%)`);
    return parts.join(" ");
}
function CssToolsPanel({ selected, pushUndo }) {
    _s();
    const [filters, setFilters] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        ...DEFAULT_FILTERS
    });
    const [copied, setCopied] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Reset filtros quando troca de elemento
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CssToolsPanel.useEffect": ()=>{
            setFilters({
                ...DEFAULT_FILTERS
            });
            setCopied(false);
        }
    }["CssToolsPanel.useEffect"], [
        selected?.editorId
    ]);
    // Ler filtros atuais do elemento
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CssToolsPanel.useEffect": ()=>{
            if (!selected) return;
            try {
                const current = selected.element.style.filter || "";
                const f = {
                    ...DEFAULT_FILTERS
                };
                const bMatch = current.match(/brightness\((\d+)%?\)/);
                if (bMatch) f.brightness = parseFloat(bMatch[1]);
                const cMatch = current.match(/contrast\((\d+)%?\)/);
                if (cMatch) f.contrast = parseFloat(cMatch[1]);
                const sMatch = current.match(/saturate\((\d+)%?\)/);
                if (sMatch) f.saturate = parseFloat(sMatch[1]);
                const hMatch = current.match(/hue-rotate\((\d+)deg\)/);
                if (hMatch) f.hueRotate = parseFloat(hMatch[1]);
                const blMatch = current.match(/blur\(([\d.]+)px\)/);
                if (blMatch) f.blur = parseFloat(blMatch[1]);
                const gMatch = current.match(/grayscale\((\d+)%?\)/);
                if (gMatch) f.grayscale = parseFloat(gMatch[1]);
                const spMatch = current.match(/sepia\((\d+)%?\)/);
                if (spMatch) f.sepia = parseFloat(spMatch[1]);
                setFilters(f);
            } catch  {}
        }
    }["CssToolsPanel.useEffect"], [
        selected?.editorId
    ]);
    const applyFilters = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CssToolsPanel.useCallback[applyFilters]": (newFilters)=>{
            if (!selected) return;
            pushUndo();
            const css = filtersToCSS(newFilters);
            selected.element.style.filter = css;
            setFilters(newFilters);
        }
    }["CssToolsPanel.useCallback[applyFilters]"], [
        selected,
        pushUndo
    ]);
    const resetFilters = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CssToolsPanel.useCallback[resetFilters]": ()=>{
            if (!selected) return;
            pushUndo();
            selected.element.style.filter = "";
            setFilters({
                ...DEFAULT_FILTERS
            });
        }
    }["CssToolsPanel.useCallback[resetFilters]"], [
        selected,
        pushUndo
    ]);
    const handleCopyCSS = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CssToolsPanel.useCallback[handleCopyCSS]": async ()=>{
            if (!selected) return;
            try {
                const el = selected.element;
                const win = el.ownerDocument.defaultView;
                if (!win) return;
                const computed = win.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                const props = {};
                props.position = computed.position;
                props.left = `${Math.round(rect.left)}px`;
                props.top = `${Math.round(rect.top)}px`;
                props.width = `${Math.round(rect.width)}px`;
                props.height = `${Math.round(rect.height)}px`;
                const importantProps = [
                    "display",
                    "flexDirection",
                    "alignItems",
                    "justifyContent",
                    "gap",
                    "padding",
                    "margin",
                    "background",
                    "backgroundColor",
                    "color",
                    "fontSize",
                    "fontWeight",
                    "fontFamily",
                    "lineHeight",
                    "letterSpacing",
                    "border",
                    "borderRadius",
                    "boxShadow",
                    "opacity",
                    "transform",
                    "filter",
                    "backdropFilter",
                    "zIndex",
                    "overflow"
                ];
                for (const prop of importantProps){
                    const val = computed.getPropertyValue(prop.replace(/([A-Z])/g, "-$1").toLowerCase());
                    if (val && val !== "none" && val !== "normal" && val !== "0px" && val !== "rgba(0, 0, 0, 0)") {
                        props[prop] = val;
                    }
                }
                const formatted = JSON.stringify(props, null, 2);
                await navigator.clipboard.writeText(formatted);
                setCopied(true);
                setTimeout({
                    "CssToolsPanel.useCallback[handleCopyCSS]": ()=>setCopied(false)
                }["CssToolsPanel.useCallback[handleCopyCSS]"], 2000);
                window.dispatchEvent(new CustomEvent("editor:toast", {
                    detail: {
                        type: "success",
                        message: "CSS copiado pro clipboard"
                    }
                }));
            } catch  {
                window.dispatchEvent(new CustomEvent("editor:toast", {
                    detail: {
                        type: "error",
                        message: "Falha ao copiar"
                    }
                }));
            }
        }
    }["CssToolsPanel.useCallback[handleCopyCSS]"], [
        selected
    ]);
    if (!selected) return null;
    const hasActiveFilters = filtersToCSS(filters) !== "";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: containerStyle,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: headerStyle,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    style: {
                        color: "#D4A843",
                        fontWeight: 700,
                        fontSize: 10,
                        letterSpacing: 0.8
                    },
                    children: "CSS TOOLS"
                }, void 0, false, {
                    fileName: "[project]/components/editor/panels/CssToolsPanel.tsx",
                    lineNumber: 163,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/editor/panels/CssToolsPanel.tsx",
                lineNumber: 162,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: bodyStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleCopyCSS,
                        style: copyBtnStyle,
                        children: copied ? "Copiado!" : "Copiar CSS"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/CssToolsPanel.tsx",
                        lineNumber: 169,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: 8
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: 4
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            color: "#D4A843",
                                            fontSize: 9,
                                            fontWeight: 700,
                                            letterSpacing: 0.5
                                        },
                                        children: "FILTROS"
                                    }, void 0, false, {
                                        fileName: "[project]/components/editor/panels/CssToolsPanel.tsx",
                                        lineNumber: 176,
                                        columnNumber: 13
                                    }, this),
                                    hasActiveFilters && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: resetFilters,
                                        style: resetBtnStyle,
                                        children: "Resetar"
                                    }, void 0, false, {
                                        fileName: "[project]/components/editor/panels/CssToolsPanel.tsx",
                                        lineNumber: 180,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/editor/panels/CssToolsPanel.tsx",
                                lineNumber: 175,
                                columnNumber: 11
                            }, this),
                            FILTER_DEFS.map((def)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: filterRowStyle,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            style: filterLabelStyle,
                                            children: def.label
                                        }, void 0, false, {
                                            fileName: "[project]/components/editor/panels/CssToolsPanel.tsx",
                                            lineNumber: 188,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "range",
                                            min: def.min,
                                            max: def.max,
                                            step: def.step,
                                            value: filters[def.key],
                                            onChange: (e)=>{
                                                const newVal = parseFloat(e.target.value);
                                                applyFilters({
                                                    ...filters,
                                                    [def.key]: newVal
                                                });
                                            },
                                            style: sliderStyle
                                        }, void 0, false, {
                                            fileName: "[project]/components/editor/panels/CssToolsPanel.tsx",
                                            lineNumber: 189,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            style: filterValueStyle,
                                            children: [
                                                filters[def.key],
                                                def.unit
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/editor/panels/CssToolsPanel.tsx",
                                            lineNumber: 201,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, def.key, true, {
                                    fileName: "[project]/components/editor/panels/CssToolsPanel.tsx",
                                    lineNumber: 187,
                                    columnNumber: 13
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/CssToolsPanel.tsx",
                        lineNumber: 174,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/CssToolsPanel.tsx",
                lineNumber: 168,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/editor/panels/CssToolsPanel.tsx",
        lineNumber: 160,
        columnNumber: 5
    }, this);
}
_s(CssToolsPanel, "xRjsRZ5EPWtxAyr74155xwSPcpc=");
_c = CssToolsPanel;
const containerStyle = {
    marginTop: 2
};
const headerStyle = {
    padding: "6px 8px",
    background: "rgba(212,168,67,0.06)",
    borderRadius: 4
};
const bodyStyle = {
    padding: "6px 8px"
};
const copyBtnStyle = {
    width: "100%",
    padding: "6px 10px",
    background: "rgba(100,180,255,0.1)",
    border: "1px solid rgba(100,180,255,0.3)",
    borderRadius: 4,
    color: "#80B4FF",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit"
};
const resetBtnStyle = {
    padding: "2px 6px",
    background: "rgba(255,68,68,0.08)",
    border: "1px solid rgba(255,68,68,0.2)",
    borderRadius: 3,
    color: "#FF6666",
    fontSize: 8,
    cursor: "pointer",
    fontFamily: "inherit"
};
const filterRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 0"
};
const filterLabelStyle = {
    fontSize: 9,
    color: "#8a8a8a",
    minWidth: 52
};
const sliderStyle = {
    flex: 1,
    height: 3,
    accentColor: "#D4A843",
    cursor: "pointer"
};
const filterValueStyle = {
    fontSize: 9,
    color: "#6a6a6a",
    minWidth: 36,
    textAlign: "right",
    fontFamily: "ui-monospace, monospace"
};
var _c;
__turbopack_context__.k.register(_c, "CssToolsPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/panels/SavePanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SavePanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * SavePanel.tsx
 *
 * Fase 10 — Save mudancas no codigo-fonte .tsx.
 * Coleta mudancas feitas (quais elementos, quais props),
 * mostra lista de mudancas pendentes,
 * e salva via API POST cirurgica no .tsx com backup.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function SavePanel({ selected, gameId, hasChanges, undoCount }) {
    _s();
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [lastSave, setLastSave] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [changes, setChanges] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const collectChanges = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SavePanel.useCallback[collectChanges]": ()=>{
            if (!selected) return [];
            // Comparar style atual com originalStyle
            const el = selected.element;
            const current = el.getAttribute("style") || "";
            const original = selected.originalStyle;
            if (current === original) return [];
            // Parsear mudancas
            const parseStyle = {
                "SavePanel.useCallback[collectChanges].parseStyle": (s)=>{
                    const obj = {};
                    s.split(";").forEach({
                        "SavePanel.useCallback[collectChanges].parseStyle": (part)=>{
                            const [key, ...valParts] = part.split(":");
                            if (key && valParts.length > 0) {
                                obj[key.trim()] = valParts.join(":").trim();
                            }
                        }
                    }["SavePanel.useCallback[collectChanges].parseStyle"]);
                    return obj;
                }
            }["SavePanel.useCallback[collectChanges].parseStyle"];
            const origProps = parseStyle(original);
            const currProps = parseStyle(current);
            const entries = [];
            // Props que mudaram
            for (const [key, val] of Object.entries(currProps)){
                if (origProps[key] !== val) {
                    entries.push({
                        selector: buildSelector(el),
                        property: key,
                        oldValue: origProps[key] || "(nenhum)",
                        newValue: val
                    });
                }
            }
            // Props que foram removidas
            for (const [key, val] of Object.entries(origProps)){
                if (!(key in currProps)) {
                    entries.push({
                        selector: buildSelector(el),
                        property: key,
                        oldValue: val,
                        newValue: "(removido)"
                    });
                }
            }
            return entries;
        }
    }["SavePanel.useCallback[collectChanges]"], [
        selected
    ]);
    const handleExportCSS = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SavePanel.useCallback[handleExportCSS]": async ()=>{
            if (!selected) return;
            const entries = collectChanges();
            if (entries.length === 0) {
                window.dispatchEvent(new CustomEvent("editor:toast", {
                    detail: {
                        type: "info",
                        message: "Nenhuma mudanca pra exportar"
                    }
                }));
                return;
            }
            // Formatar como CSS pra copiar
            const selector = buildSelector(selected.element);
            const cssProps = entries.filter({
                "SavePanel.useCallback[handleExportCSS].cssProps": (e)=>e.newValue !== "(removido)"
            }["SavePanel.useCallback[handleExportCSS].cssProps"]).map({
                "SavePanel.useCallback[handleExportCSS].cssProps": (e)=>`  ${e.property}: ${e.newValue};`
            }["SavePanel.useCallback[handleExportCSS].cssProps"]).join("\n");
            const css = `/* Mudancas do editor — ${gameId} */\n${selector} {\n${cssProps}\n}`;
            try {
                await navigator.clipboard.writeText(css);
                window.dispatchEvent(new CustomEvent("editor:toast", {
                    detail: {
                        type: "success",
                        message: "CSS das mudancas copiado pro clipboard"
                    }
                }));
            } catch  {
                window.dispatchEvent(new CustomEvent("editor:toast", {
                    detail: {
                        type: "error",
                        message: "Falha ao copiar"
                    }
                }));
            }
        }
    }["SavePanel.useCallback[handleExportCSS]"], [
        selected,
        gameId,
        collectChanges
    ]);
    const handleSave = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SavePanel.useCallback[handleSave]": async ()=>{
            if (!gameId) return;
            setSaving(true);
            try {
                // Coletar TODAS as mudancas do iframe (elementos com data-editor-idx que mudaram)
                const iframe = document.querySelector("iframe");
                if (!iframe?.contentWindow?.document) throw new Error("Iframe nao acessivel");
                const doc = iframe.contentWindow.document;
                const editedElements = doc.querySelectorAll("[data-editor-idx]");
                const allChanges = [];
                editedElements.forEach({
                    "SavePanel.useCallback[handleSave]": (el)=>{
                        const htmlEl = el;
                        const style = htmlEl.getAttribute("style");
                        if (style) {
                            allChanges.push({
                                selector: buildSelector(htmlEl),
                                styles: parseInlineStyle(style)
                            });
                        }
                    }
                }["SavePanel.useCallback[handleSave]"]);
                if (allChanges.length === 0) {
                    window.dispatchEvent(new CustomEvent("editor:toast", {
                        detail: {
                            type: "info",
                            message: "Nenhuma mudanca pra salvar"
                        }
                    }));
                    setSaving(false);
                    return;
                }
                const resp = await fetch("/api/editor/save-styles", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        gameId,
                        changes: allChanges,
                        timestamp: new Date().toISOString()
                    })
                });
                const data = await resp.json();
                if (data.ok) {
                    setLastSave(new Date().toLocaleTimeString());
                    window.dispatchEvent(new CustomEvent("editor:toast", {
                        detail: {
                            type: "success",
                            message: `Salvo! ${data.filesChanged || 0} arquivo(s) editado(s). Backup em ${data.backupPath || "bkp/"}`
                        }
                    }));
                } else {
                    throw new Error(data.error || "Erro desconhecido");
                }
            } catch (err) {
                window.dispatchEvent(new CustomEvent("editor:toast", {
                    detail: {
                        type: "error",
                        message: `Save falhou: ${err instanceof Error ? err.message : String(err)}`
                    }
                }));
            }
            setSaving(false);
        }
    }["SavePanel.useCallback[handleSave]"], [
        gameId
    ]);
    // ═══ BACKUP COM VERSÕES (Fase 11) ═══
    const [backups, setBackups] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [showBackups, setShowBackups] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Carregar backups do localStorage
    const loadBackups = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SavePanel.useCallback[loadBackups]": ()=>{
            try {
                const raw = localStorage.getItem("editor:backups");
                if (raw) setBackups(JSON.parse(raw));
            } catch  {}
        }
    }["SavePanel.useCallback[loadBackups]"], []);
    // Criar backup snapshot
    const createBackup = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SavePanel.useCallback[createBackup]": ()=>{
            if (!gameId) return;
            try {
                const iframe = document.querySelector("iframe");
                if (!iframe?.contentWindow?.document) return;
                const doc = iframe.contentWindow.document;
                const editedElements = doc.querySelectorAll("[data-editor-idx]");
                const snapshot = {};
                editedElements.forEach({
                    "SavePanel.useCallback[createBackup]": (el)=>{
                        const eid = el.getAttribute("data-editor-idx");
                        const style = el.getAttribute("style");
                        if (eid && style) snapshot[eid] = style;
                    }
                }["SavePanel.useCallback[createBackup]"]);
                const backup = {
                    id: `bkp-${Date.now()}`,
                    timestamp: new Date().toLocaleString("pt-BR"),
                    gameId,
                    count: Object.keys(snapshot).length,
                    snapshot
                };
                const existing = JSON.parse(localStorage.getItem("editor:backups") || "[]");
                existing.unshift(backup);
                // Manter maximo 20 backups
                if (existing.length > 20) existing.length = 20;
                localStorage.setItem("editor:backups", JSON.stringify(existing));
                loadBackups();
                window.dispatchEvent(new CustomEvent("editor:toast", {
                    detail: {
                        type: "success",
                        message: `Backup criado: ${backup.count} elementos salvos`
                    }
                }));
            } catch (err) {
                window.dispatchEvent(new CustomEvent("editor:toast", {
                    detail: {
                        type: "error",
                        message: `Backup falhou: ${err instanceof Error ? err.message : String(err)}`
                    }
                }));
            }
        }
    }["SavePanel.useCallback[createBackup]"], [
        gameId,
        loadBackups
    ]);
    // Restaurar backup
    const restoreBackup = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SavePanel.useCallback[restoreBackup]": (backupId)=>{
            try {
                const all = JSON.parse(localStorage.getItem("editor:backups") || "[]");
                const backup = all.find({
                    "SavePanel.useCallback[restoreBackup].backup": (b)=>b.id === backupId
                }["SavePanel.useCallback[restoreBackup].backup"]);
                if (!backup?.snapshot) return;
                const iframe = document.querySelector("iframe");
                if (!iframe?.contentWindow?.document) return;
                const doc = iframe.contentWindow.document;
                let restored = 0;
                Object.entries(backup.snapshot).forEach({
                    "SavePanel.useCallback[restoreBackup]": ([eid, style])=>{
                        const el = doc.querySelector(`[data-editor-idx="${eid}"]`);
                        if (el) {
                            el.setAttribute("style", style);
                            restored++;
                        }
                    }
                }["SavePanel.useCallback[restoreBackup]"]);
                window.dispatchEvent(new CustomEvent("editor:toast", {
                    detail: {
                        type: "success",
                        message: `Backup restaurado: ${restored} elementos`
                    }
                }));
            } catch  {}
        }
    }["SavePanel.useCallback[restoreBackup]"], []);
    // Deletar backup
    const deleteBackup = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SavePanel.useCallback[deleteBackup]": (backupId)=>{
            try {
                const all = JSON.parse(localStorage.getItem("editor:backups") || "[]");
                const filtered = all.filter({
                    "SavePanel.useCallback[deleteBackup].filtered": (b)=>b.id !== backupId
                }["SavePanel.useCallback[deleteBackup].filtered"]);
                localStorage.setItem("editor:backups", JSON.stringify(filtered));
                loadBackups();
            } catch  {}
        }
    }["SavePanel.useCallback[deleteBackup]"], [
        loadBackups
    ]);
    if (!hasChanges && !lastSave && backups.length === 0) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: containerStyle,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: headerStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            color: "#D4A843",
                            fontWeight: 700,
                            fontSize: 10,
                            letterSpacing: 0.8
                        },
                        children: "SALVAR"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/SavePanel.tsx",
                        lineNumber: 259,
                        columnNumber: 9
                    }, this),
                    lastSave && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            color: "#5a5a5a",
                            fontSize: 9
                        },
                        children: [
                            "Ultimo: ",
                            lastSave
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/SavePanel.tsx",
                        lineNumber: 263,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/SavePanel.tsx",
                lineNumber: 258,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: bodyStyle,
                children: [
                    hasChanges && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginBottom: 6,
                            fontSize: 10,
                            color: "#FF8C00"
                        },
                        children: [
                            undoCount,
                            " mudanca(s) pendente(s)"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/SavePanel.tsx",
                        lineNumber: 271,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            gap: 4
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleExportCSS,
                                disabled: !selected || !hasChanges,
                                style: {
                                    ...actionBtnStyle,
                                    opacity: selected && hasChanges ? 1 : 0.4
                                },
                                children: "Exportar CSS"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/SavePanel.tsx",
                                lineNumber: 277,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleSave,
                                disabled: saving || !hasChanges,
                                style: {
                                    ...saveBtnStyle,
                                    opacity: hasChanges && !saving ? 1 : 0.4
                                },
                                children: saving ? "Salvando..." : "Salvar no .tsx"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/SavePanel.tsx",
                                lineNumber: 287,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/SavePanel.tsx",
                        lineNumber: 276,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            color: "#5a5a5a",
                            fontSize: 8,
                            marginTop: 4
                        },
                        children: "Exportar = copia CSS pro clipboard. Salvar = edita .tsx com backup."
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/SavePanel.tsx",
                        lineNumber: 299,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: 8,
                            borderTop: "1px solid rgba(212,168,67,0.1)",
                            paddingTop: 6
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    gap: 4,
                                    alignItems: "center",
                                    marginBottom: 4
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: createBackup,
                                        disabled: !hasChanges,
                                        style: {
                                            ...actionBtnStyle,
                                            background: "rgba(212,168,67,0.08)",
                                            borderColor: "rgba(212,168,67,0.25)",
                                            color: "#D4A843",
                                            opacity: hasChanges ? 1 : 0.4
                                        },
                                        children: "📦 Criar Backup"
                                    }, void 0, false, {
                                        fileName: "[project]/components/editor/panels/SavePanel.tsx",
                                        lineNumber: 306,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            loadBackups();
                                            setShowBackups((prev)=>!prev);
                                        },
                                        style: {
                                            ...actionBtnStyle,
                                            background: "rgba(100,100,100,0.08)",
                                            borderColor: "rgba(100,100,100,0.2)",
                                            color: "#999"
                                        },
                                        children: showBackups ? "▲ Fechar" : `▼ Backups${backups.length > 0 ? ` (${backups.length})` : ""}`
                                    }, void 0, false, {
                                        fileName: "[project]/components/editor/panels/SavePanel.tsx",
                                        lineNumber: 319,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/editor/panels/SavePanel.tsx",
                                lineNumber: 305,
                                columnNumber: 11
                            }, this),
                            showBackups && backups.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    maxHeight: 120,
                                    overflow: "auto",
                                    fontSize: 9
                                },
                                className: "editor-scroll",
                                children: [
                                    backups.filter((b)=>b.gameId === gameId).map((b)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                padding: "3px 4px",
                                                borderBottom: "1px solid rgba(212,168,67,0.06)"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    style: {
                                                        color: "#aaa"
                                                    },
                                                    children: [
                                                        b.timestamp,
                                                        " (",
                                                        b.count,
                                                        " els)"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/editor/panels/SavePanel.tsx",
                                                    lineNumber: 339,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        display: "flex",
                                                        gap: 2
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>restoreBackup(b.id),
                                                            style: {
                                                                background: "none",
                                                                border: "none",
                                                                color: "#00C864",
                                                                fontSize: 9,
                                                                cursor: "pointer"
                                                            },
                                                            title: "Restaurar este backup",
                                                            children: "↩ Restaurar"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/editor/panels/SavePanel.tsx",
                                                            lineNumber: 341,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>deleteBackup(b.id),
                                                            style: {
                                                                background: "none",
                                                                border: "none",
                                                                color: "#dc5050",
                                                                fontSize: 9,
                                                                cursor: "pointer"
                                                            },
                                                            title: "Apagar backup",
                                                            children: "✕"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/editor/panels/SavePanel.tsx",
                                                            lineNumber: 348,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/editor/panels/SavePanel.tsx",
                                                    lineNumber: 340,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, b.id, true, {
                                            fileName: "[project]/components/editor/panels/SavePanel.tsx",
                                            lineNumber: 335,
                                            columnNumber: 17
                                        }, this)),
                                    backups.filter((b)=>b.gameId === gameId).length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        style: {
                                            color: "#555",
                                            textAlign: "center",
                                            padding: 4
                                        },
                                        children: "Nenhum backup pra este jogo"
                                    }, void 0, false, {
                                        fileName: "[project]/components/editor/panels/SavePanel.tsx",
                                        lineNumber: 359,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/editor/panels/SavePanel.tsx",
                                lineNumber: 333,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/SavePanel.tsx",
                        lineNumber: 304,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/SavePanel.tsx",
                lineNumber: 269,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/editor/panels/SavePanel.tsx",
        lineNumber: 257,
        columnNumber: 5
    }, this);
}
_s(SavePanel, "sUxOJisk6yeBhD7/hG6LMG8scL4=");
_c = SavePanel;
function buildSelector(el) {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const classes = el.className && typeof el.className === "string" ? "." + el.className.split(/\s+/).filter(Boolean).slice(0, 2).join(".") : "";
    const nth = (()=>{
        const parent = el.parentElement;
        if (!parent) return "";
        const siblings = Array.from(parent.children).filter((c)=>c.tagName === el.tagName);
        if (siblings.length <= 1) return "";
        const idx = siblings.indexOf(el) + 1;
        return `:nth-of-type(${idx})`;
    })();
    return `${tag}${id}${classes}${nth}`;
}
function parseInlineStyle(style) {
    const obj = {};
    style.split(";").forEach((part)=>{
        const colonIdx = part.indexOf(":");
        if (colonIdx > 0) {
            const key = part.slice(0, colonIdx).trim();
            const val = part.slice(colonIdx + 1).trim();
            if (key && val) obj[key] = val;
        }
    });
    return obj;
}
const containerStyle = {
    marginTop: 2
};
const headerStyle = {
    padding: "6px 8px",
    background: "rgba(0,200,100,0.06)",
    borderRadius: 4,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
};
const bodyStyle = {
    padding: "6px 8px"
};
const actionBtnStyle = {
    flex: 1,
    padding: "5px 8px",
    background: "rgba(100,180,255,0.1)",
    border: "1px solid rgba(100,180,255,0.3)",
    borderRadius: 4,
    color: "#80B4FF",
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit"
};
const saveBtnStyle = {
    flex: 1,
    padding: "5px 8px",
    background: "rgba(0,200,100,0.12)",
    border: "1px solid rgba(0,200,100,0.3)",
    borderRadius: 4,
    color: "#00C864",
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit"
};
var _c;
__turbopack_context__.k.register(_c, "SavePanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/editor.config.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * editor.config.ts
 *
 * Configuracao TECNICA do Layout Editor. NAO contem jogos.
 *
 * Os jogos sao DESCOBERTOS automaticamente pelo editor escaneando
 * a pasta configurada em EDITOR_CONFIG.gamesDir (default: "components/games").
 * Voce pode mudar esta pasta pelo proprio editor (input no header).
 *
 * Pra portar pra outro projeto:
 *   1. Copia pastas: app/editor, app/api/editor, components/editor
 *   2. Copia: editor.config.ts, scripts/check-editor-portability.sh
 *   3. npm i konva react-konva use-image react-konva-utils zustand zundo zod
 *   4. Ajusta gamesDir no header do editor pra apontar pra pasta de jogos
 *      do novo projeto (ex: "src/games", "app/games", o que for)
 */ __turbopack_context__.s([
    "EDITOR_CONFIG",
    ()=>EDITOR_CONFIG,
    "defaultBackgroundDir",
    ()=>defaultBackgroundDir,
    "prettifyId",
    ()=>prettifyId,
    "resolveLayoutPath",
    ()=>resolveLayoutPath
]);
function resolveLayoutPath(id, gamesDir = EDITOR_CONFIG.gamesDir) {
    const pascal = id.split(/[-_]/).map((w)=>w.charAt(0).toUpperCase() + w.slice(1)).join("");
    const cleanDir = gamesDir.replace(/^\/+|\/+$/g, "");
    return `${cleanDir}/${id}/${pascal}Layout.ts`;
}
function prettifyId(id) {
    return id.split(/[-_]/).map((w)=>w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function defaultBackgroundDir(id) {
    return `/assets/games/${id}/`;
}
const EDITOR_CONFIG = {
    appName: "Layout Editor",
    primaryColor: "#D4A843",
    layoutsDir: "public/layouts",
    backupsDir: "public/layouts/.backup",
    /** Pasta default onde editor procura jogos. Editavel via UI no header. */ gamesDir: "components/games",
    /** Pasta default sugerida no file picker de background */ publicDir: "public",
    autoSaveIntervalMs: 30_000,
    maxAutoSaves: 20,
    gridSize: 5,
    defaultBaseResolution: {
        width: 1920,
        height: 1080
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/utils/sessions.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "captureCanvasThumbnail",
    ()=>captureCanvasThumbnail,
    "createSession",
    ()=>createSession,
    "deleteSession",
    ()=>deleteSession,
    "getAllSessions",
    ()=>getAllSessions,
    "renameSession",
    ()=>renameSession,
    "useAutoSave",
    ()=>useAutoSave
]);
/**
 * sessions.ts
 *
 * EM PALAVRAS SIMPLES: salva o trabalho atual no navegador a cada
 * 30 segundos automaticamente. Voce pode tambem salvar manualmente
 * com Ctrl+Shift+S e dar um nome. Se algo der errado, da pra voltar
 * pra qualquer sessao salva.
 *
 * TECNICAMENTE: localStorage manager pra SavedSession[]. Auto-save
 * tem limite (configurado em EDITOR_CONFIG.maxAutoSaves) — quando
 * passa, descarta os mais antigos. Sessoes manuais nao expiram.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/state/editorStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$editor$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/editor.config.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const STORAGE_KEY = "blackout-editor-sessions";
function getAllSessions() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch  {
        return [];
    }
}
/** Sobrescreve a lista de sessoes (uso interno) */ function writeAllSessions(sessions) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (err) {
        // QuotaExceededError pode acontecer com muitos auto-saves
        console.warn("[editor] localStorage cheio, limpando auto-saves antigos:", err);
        const manuals = sessions.filter((s)=>s.type === "manual");
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(manuals));
        } catch  {
            // se ainda falhar, limpa tudo
            window.localStorage.removeItem(STORAGE_KEY);
        }
    }
}
function createSession(opts) {
    const session = {
        id: crypto.randomUUID(),
        type: opts.type,
        name: opts.name,
        game: opts.game,
        layout: opts.layout,
        savedAt: new Date().toISOString(),
        thumbnail: opts.thumbnail
    };
    const all = getAllSessions();
    all.unshift(session);
    // Limita auto-saves ao maximo configurado
    const autos = all.filter((s)=>s.type === "auto");
    const manuals = all.filter((s)=>s.type === "manual");
    const trimmedAutos = autos.slice(0, __TURBOPACK__imported__module__$5b$project$5d2f$editor$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EDITOR_CONFIG"].maxAutoSaves);
    const final = [
        ...manuals,
        ...trimmedAutos
    ].sort((a, b)=>b.savedAt.localeCompare(a.savedAt));
    writeAllSessions(final);
    return session;
}
function deleteSession(id) {
    const all = getAllSessions().filter((s)=>s.id !== id);
    writeAllSessions(all);
}
function renameSession(id, newName) {
    const all = getAllSessions().map((s)=>s.id === id ? {
            ...s,
            name: newName
        } : s);
    writeAllSessions(all);
}
function useAutoSave() {
    _s();
    const layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "useAutoSave.useEditorStore[layout]": (s)=>s.layout
    }["useAutoSave.useEditorStore[layout]"]);
    const lastSavedRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAutoSave.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const tick = {
                "useAutoSave.useEffect.tick": ()=>{
                    const fingerprint = layout.metadata.updatedAt;
                    if (fingerprint && fingerprint !== lastSavedRef.current && layout.scenes.length > 0) {
                        const hasContent = layout.scenes.some({
                            "useAutoSave.useEffect.tick.hasContent": (s)=>s.elements.length > 0
                        }["useAutoSave.useEffect.tick.hasContent"]);
                        if (hasContent) {
                            createSession({
                                type: "auto",
                                game: layout.game,
                                layout
                            });
                            lastSavedRef.current = fingerprint;
                        }
                    }
                }
            }["useAutoSave.useEffect.tick"];
            const intervalId = window.setInterval(tick, __TURBOPACK__imported__module__$5b$project$5d2f$editor$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EDITOR_CONFIG"].autoSaveIntervalMs);
            return ({
                "useAutoSave.useEffect": ()=>window.clearInterval(intervalId)
            })["useAutoSave.useEffect"];
        }
    }["useAutoSave.useEffect"], [
        layout
    ]);
}
_s(useAutoSave, "4Ra/wYbBCdiBof5uiINltpU8wSo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"]
    ];
});
function captureCanvasThumbnail() {
    if (typeof document === "undefined") return undefined;
    // Konva renderiza em <canvas>. Procura o primeiro canvas dentro do
    // wrapper do EditorStage.
    const canvas = document.querySelector("canvas");
    if (!canvas) return undefined;
    try {
        // 240px wide thumbnail
        const tmp = document.createElement("canvas");
        const scale = 240 / canvas.width;
        tmp.width = 240;
        tmp.height = canvas.height * scale;
        const ctx = tmp.getContext("2d");
        if (!ctx) return undefined;
        ctx.drawImage(canvas, 0, 0, tmp.width, tmp.height);
        return tmp.toDataURL("image/jpeg", 0.6); // JPEG comprime mais que PNG
    } catch  {
        return undefined;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/panels/ConfirmModal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ConfirmModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * ConfirmModal.tsx
 *
 * EM PALAVRAS SIMPLES: caixinha que pergunta "tem certeza?" antes
 * de fazer algo que nao da pra desfazer (ex: deletar cena).
 *
 * TECNICAMENTE: modal controlado via prop `open`. Renderiza em
 * portal (no document.body) pra nao ser cortado por overflow:hidden
 * dos paineis. Fecha com Esc.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react-dom/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function ConfirmModal({ open, title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", danger = false, onConfirm, onCancel }) {
    _s();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ConfirmModal.useEffect": ()=>{
            if (!open) return;
            const onKey = {
                "ConfirmModal.useEffect.onKey": (e)=>{
                    if (e.key === "Escape") onCancel();
                    if (e.key === "Enter") onConfirm();
                }
            }["ConfirmModal.useEffect.onKey"];
            window.addEventListener("keydown", onKey);
            return ({
                "ConfirmModal.useEffect": ()=>window.removeEventListener("keydown", onKey)
            })["ConfirmModal.useEffect"];
        }
    }["ConfirmModal.useEffect"], [
        open,
        onCancel,
        onConfirm
    ]);
    if (!open || typeof document === "undefined") return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createPortal"])(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: overlayStyle,
        onClick: onCancel,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: modalStyle,
            onClick: (e)=>e.stopPropagation(),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    style: titleStyle,
                    children: title
                }, void 0, false, {
                    fileName: "[project]/components/editor/panels/ConfirmModal.tsx",
                    lineNumber: 52,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    style: messageStyle,
                    children: message
                }, void 0, false, {
                    fileName: "[project]/components/editor/panels/ConfirmModal.tsx",
                    lineNumber: 53,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: btnRowStyle,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onCancel,
                            style: btnSecondary,
                            children: cancelLabel
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/ConfirmModal.tsx",
                            lineNumber: 55,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onConfirm,
                            style: danger ? btnDanger : btnPrimary,
                            children: confirmLabel
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/ConfirmModal.tsx",
                            lineNumber: 58,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/editor/panels/ConfirmModal.tsx",
                    lineNumber: 54,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/editor/panels/ConfirmModal.tsx",
            lineNumber: 51,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/editor/panels/ConfirmModal.tsx",
        lineNumber: 50,
        columnNumber: 5
    }, this), document.body);
}
_s(ConfirmModal, "OD7bBpZva5O2jO+Puf00hKivP7c=");
_c = ConfirmModal;
const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    backdropFilter: "blur(4px)"
};
const modalStyle = {
    background: "#0a0806",
    border: "1px solid rgba(212,168,67,0.3)",
    borderRadius: 8,
    padding: 24,
    minWidth: 320,
    maxWidth: 480,
    boxShadow: "0 10px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,168,67,0.1)"
};
const titleStyle = {
    fontSize: 16,
    fontWeight: 700,
    color: "#D4A843",
    margin: "0 0 8px 0"
};
const messageStyle = {
    fontSize: 13,
    color: "#c5c5c5",
    margin: "0 0 20px 0",
    lineHeight: 1.5
};
const btnRowStyle = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end"
};
const btnBase = {
    padding: "8px 14px",
    fontSize: 12,
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "inherit",
    border: "1px solid transparent",
    letterSpacing: 0.3
};
const btnSecondary = {
    ...btnBase,
    background: "transparent",
    color: "#8a8a8a",
    border: "1px solid rgba(138,138,138,0.3)"
};
const btnPrimary = {
    ...btnBase,
    background: "rgba(212,168,67,0.15)",
    color: "#D4A843",
    border: "1px solid rgba(212,168,67,0.5)"
};
const btnDanger = {
    ...btnBase,
    background: "rgba(220,80,80,0.15)",
    color: "#dc5050",
    border: "1px solid rgba(220,80,80,0.5)"
};
var _c;
__turbopack_context__.k.register(_c, "ConfirmModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/panels/HistoryModal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HistoryModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * HistoryModal.tsx
 *
 * EM PALAVRAS SIMPLES: modal que mostra todas as sessoes salvas
 * (automaticas e manuais), cada uma com thumbnail e timestamp.
 * Voce clica numa sessao pra restaurar ela.
 *
 * TECNICAMENTE: lista o conteudo do localStorage filtrado pelo
 * jogo atual. Restaurar = setLayout no store. Inclui confirm
 * pra delete.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react-dom/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/state/editorStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$utils$2f$sessions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/utils/sessions.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$ConfirmModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/panels/ConfirmModal.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
function HistoryModal({ open, onClose }) {
    _s();
    const layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "HistoryModal.useEditorStore[layout]": (s)=>s.layout
    }["HistoryModal.useEditorStore[layout]"]);
    const setLayout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "HistoryModal.useEditorStore[setLayout]": (s)=>s.setLayout
    }["HistoryModal.useEditorStore[setLayout]"]);
    const [sessions, setSessions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [pendingRestore, setPendingRestore] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [pendingDelete, setPendingDelete] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [filter, setFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("all");
    const [renaming, setRenaming] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [draftName, setDraftName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    // Recarrega sessoes quando abre o modal
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HistoryModal.useEffect": ()=>{
            if (open) setSessions((0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$utils$2f$sessions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAllSessions"])());
        }
    }["HistoryModal.useEffect"], [
        open
    ]);
    // Esc fecha modal
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HistoryModal.useEffect": ()=>{
            if (!open) return;
            const onKey = {
                "HistoryModal.useEffect.onKey": (e)=>{
                    if (e.key === "Escape" && !pendingRestore && !pendingDelete) onClose();
                }
            }["HistoryModal.useEffect.onKey"];
            window.addEventListener("keydown", onKey);
            return ({
                "HistoryModal.useEffect": ()=>window.removeEventListener("keydown", onKey)
            })["HistoryModal.useEffect"];
        }
    }["HistoryModal.useEffect"], [
        open,
        pendingRestore,
        pendingDelete,
        onClose
    ]);
    if (!open || typeof document === "undefined") return null;
    // So mostra sessoes do jogo atual
    const filtered = sessions.filter((s)=>s.game === layout.game).filter((s)=>filter === "all" || s.type === filter);
    const handleRestore = ()=>{
        if (!pendingRestore) return;
        setLayout(pendingRestore.layout);
        setPendingRestore(null);
        onClose();
    };
    const handleDelete = ()=>{
        if (!pendingDelete) return;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$utils$2f$sessions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deleteSession"])(pendingDelete.id);
        setSessions((0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$utils$2f$sessions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAllSessions"])());
        setPendingDelete(null);
    };
    const handleRename = (id)=>{
        const trimmed = draftName.trim();
        if (trimmed) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$utils$2f$sessions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["renameSession"])(id, trimmed);
            setSessions((0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$utils$2f$sessions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAllSessions"])());
        }
        setRenaming(null);
        setDraftName("");
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createPortal"])(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: overlayStyle,
                onClick: onClose,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: modalStyle,
                    onClick: (e)=>e.stopPropagation(),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                            style: headerStyle,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            style: titleStyle,
                                            children: "Historico de Sessoes"
                                        }, void 0, false, {
                                            fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                            lineNumber: 88,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            style: subtitleStyle,
                                            children: [
                                                'Sessoes salvas no navegador para o jogo "',
                                                layout.game,
                                                '"'
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                            lineNumber: 89,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                    lineNumber: 87,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: onClose,
                                    style: closeBtn,
                                    title: "Fechar (Esc)",
                                    children: "×"
                                }, void 0, false, {
                                    fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                    lineNumber: 93,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                            lineNumber: 86,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: tabsStyle,
                            children: [
                                "all",
                                "manual",
                                "auto"
                            ].map((mode)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setFilter(mode),
                                    style: filter === mode ? tabActive : tab,
                                    children: [
                                        mode === "all" ? "Todas" : mode === "manual" ? "Manuais" : "Auto-save",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            style: tabBadge,
                                            children: sessions.filter((s)=>s.game === layout.game && (mode === "all" || s.type === mode)).length
                                        }, void 0, false, {
                                            fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                            lineNumber: 106,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, mode, true, {
                                    fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                    lineNumber: 100,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                            lineNumber: 98,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: listStyle,
                            children: filtered.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: emptyStyle,
                                children: "Nenhuma sessao salva ainda."
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                lineNumber: 115,
                                columnNumber: 15
                            }, this) : filtered.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: cardStyle,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: thumbStyle,
                                            children: s.thumbnail ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                src: s.thumbnail,
                                                alt: "",
                                                style: thumbImg
                                            }, void 0, false, {
                                                fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                                lineNumber: 121,
                                                columnNumber: 23
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: thumbPlaceholder,
                                                children: [
                                                    s.layout.scenes[0]?.elements.length ?? 0,
                                                    " ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            fontSize: 9
                                                        },
                                                        children: "elem"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                                        lineNumber: 125,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                                lineNumber: 123,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                            lineNumber: 119,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: infoStyle,
                                            children: [
                                                renaming === s.id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    value: draftName,
                                                    onChange: (e)=>setDraftName(e.target.value),
                                                    onBlur: ()=>handleRename(s.id),
                                                    onKeyDown: (e)=>{
                                                        if (e.key === "Enter") handleRename(s.id);
                                                        if (e.key === "Escape") {
                                                            setRenaming(null);
                                                            setDraftName("");
                                                        }
                                                    },
                                                    autoFocus: true,
                                                    style: renameInput
                                                }, void 0, false, {
                                                    fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                                    lineNumber: 131,
                                                    columnNumber: 23
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: nameStyle,
                                                    children: [
                                                        s.name ?? (s.type === "auto" ? "Auto-save" : "Sem nome"),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            style: typeBadge(s.type),
                                                            children: s.type === "auto" ? "AUTO" : "MANUAL"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                                            lineNumber: 148,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                                    lineNumber: 146,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: metaStyle,
                                                    children: [
                                                        formatRelative(s.savedAt),
                                                        " · ",
                                                        s.layout.scenes.length,
                                                        " cena",
                                                        s.layout.scenes.length === 1 ? "" : "s"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                                    lineNumber: 151,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                            lineNumber: 129,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: actionsStyle,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>setPendingRestore(s),
                                                    style: btnPrimary,
                                                    children: "Restaurar"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                                    lineNumber: 157,
                                                    columnNumber: 21
                                                }, this),
                                                s.type === "manual" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>{
                                                        setRenaming(s.id);
                                                        setDraftName(s.name ?? "");
                                                    },
                                                    style: btnGhost,
                                                    title: "Renomear",
                                                    children: "✎"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                                    lineNumber: 161,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>setPendingDelete(s),
                                                    style: btnDanger,
                                                    title: "Apagar",
                                                    children: "×"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                                    lineNumber: 172,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                            lineNumber: 156,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, s.id, true, {
                                    fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                                    lineNumber: 118,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                            lineNumber: 113,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                            style: footerStyle,
                            children: "Auto-save a cada 30s · Sessoes manuais com Ctrl+Shift+S · Esc fecha"
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                            lineNumber: 185,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                    lineNumber: 85,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                lineNumber: 84,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$ConfirmModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                open: Boolean(pendingRestore),
                title: "Restaurar sessao",
                message: `Vai substituir o trabalho atual por esta sessao salva. Pode desfazer com Ctrl+Z depois.`,
                confirmLabel: "Restaurar",
                onConfirm: handleRestore,
                onCancel: ()=>setPendingRestore(null)
            }, void 0, false, {
                fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                lineNumber: 191,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$ConfirmModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                open: Boolean(pendingDelete),
                title: "Apagar sessao",
                message: `Vai apagar permanentemente esta sessao salva. Esta acao nao pode ser desfeita.`,
                confirmLabel: "Apagar",
                danger: true,
                onConfirm: handleDelete,
                onCancel: ()=>setPendingDelete(null)
            }, void 0, false, {
                fileName: "[project]/components/editor/panels/HistoryModal.tsx",
                lineNumber: 200,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true), document.body);
}
_s(HistoryModal, "FcqWJm3NL3q5HgcofB7u/VWk3uE=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"]
    ];
});
_c = HistoryModal;
function formatRelative(iso) {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = now - then;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s atras`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}min atras`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h atras`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d atras`;
    return new Date(iso).toLocaleDateString();
}
const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9000,
    backdropFilter: "blur(4px)"
};
const modalStyle = {
    background: "#0a0806",
    border: "1px solid rgba(212,168,67,0.3)",
    borderRadius: 8,
    width: 720,
    maxWidth: "90vw",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 10px 60px rgba(0,0,0,0.7)"
};
const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 24px 12px 24px",
    borderBottom: "1px solid rgba(212,168,67,0.1)"
};
const titleStyle = {
    fontSize: 18,
    fontWeight: 700,
    color: "#D4A843",
    margin: 0
};
const subtitleStyle = {
    fontSize: 12,
    color: "#8a8a8a",
    margin: "4px 0 0 0"
};
const closeBtn = {
    background: "transparent",
    border: "none",
    color: "#8a8a8a",
    fontSize: 22,
    cursor: "pointer",
    padding: 4,
    lineHeight: 1
};
const tabsStyle = {
    display: "flex",
    gap: 4,
    padding: "12px 24px 0 24px"
};
const tab = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: 4,
    padding: "6px 12px",
    fontSize: 12,
    cursor: "pointer",
    color: "#8a8a8a",
    fontFamily: "inherit"
};
const tabActive = {
    ...tab,
    background: "rgba(212,168,67,0.12)",
    border: "1px solid rgba(212,168,67,0.4)",
    color: "#D4A843"
};
const tabBadge = {
    fontSize: 10,
    padding: "1px 6px",
    background: "rgba(0,0,0,0.4)",
    borderRadius: 999,
    color: "#5a5a5a"
};
const listStyle = {
    flex: 1,
    overflowY: "auto",
    padding: "12px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 8
};
const emptyStyle = {
    color: "#8a8a8a",
    textAlign: "center",
    padding: 32,
    fontSize: 13
};
const cardStyle = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 8,
    background: "rgba(212,168,67,0.04)",
    border: "1px solid rgba(212,168,67,0.1)",
    borderRadius: 6
};
const thumbStyle = {
    width: 64,
    height: 36,
    background: "#1a1410",
    borderRadius: 3,
    overflow: "hidden",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
};
const thumbImg = {
    width: "100%",
    height: "100%",
    objectFit: "cover"
};
const thumbPlaceholder = {
    fontSize: 11,
    color: "#5a5a5a",
    fontFamily: "ui-monospace, monospace"
};
const infoStyle = {
    flex: 1,
    minWidth: 0
};
const nameStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "#e5e5e5",
    fontWeight: 500
};
const typeBadge = (type)=>({
        fontSize: 9,
        padding: "1px 6px",
        borderRadius: 3,
        letterSpacing: 0.5,
        background: type === "manual" ? "rgba(212,168,67,0.15)" : "rgba(140,140,140,0.15)",
        color: type === "manual" ? "#D4A843" : "#8a8a8a",
        border: `1px solid ${type === "manual" ? "rgba(212,168,67,0.3)" : "rgba(140,140,140,0.3)"}`
    });
const metaStyle = {
    fontSize: 11,
    color: "#5a5a5a",
    marginTop: 2,
    fontFamily: "ui-monospace, monospace"
};
const renameInput = {
    background: "#0a0806",
    border: "1px solid rgba(212,168,67,0.5)",
    borderRadius: 3,
    padding: "3px 6px",
    fontSize: 13,
    color: "#e5e5e5",
    fontFamily: "inherit",
    width: "100%"
};
const actionsStyle = {
    display: "flex",
    gap: 4,
    flexShrink: 0
};
const btnBase = {
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: 4,
    padding: "5px 10px",
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "inherit"
};
const btnPrimary = {
    ...btnBase,
    background: "rgba(212,168,67,0.15)",
    color: "#D4A843",
    border: "1px solid rgba(212,168,67,0.4)"
};
const btnGhost = {
    ...btnBase,
    color: "#8a8a8a",
    width: 28,
    textAlign: "center"
};
const btnDanger = {
    ...btnBase,
    color: "#dc5050",
    width: 28,
    textAlign: "center",
    fontSize: 14
};
const footerStyle = {
    padding: "12px 24px",
    borderTop: "1px solid rgba(212,168,67,0.1)",
    fontSize: 11,
    color: "#5a5a5a",
    textAlign: "center",
    fontFamily: "ui-monospace, monospace"
};
var _c;
__turbopack_context__.k.register(_c, "HistoryModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/utils/history.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useDragHistoryGate",
    ()=>useDragHistoryGate,
    "useHistoryControls",
    ()=>useHistoryControls,
    "useUndoRedoShortcuts",
    ()=>useUndoRedoShortcuts
]);
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
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/state/editorStore.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
;
;
function useHistoryControls() {
    _s();
    const t = __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"].temporal;
    // Subscribe pro stack pra atualizar canUndo/canRedo em tempo real
    const subscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useHistoryControls.useCallback[subscribe]": (cb)=>t.subscribe(cb)
    }["useHistoryControls.useCallback[subscribe]"], [
        t
    ]);
    const getSnapshot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useHistoryControls.useCallback[getSnapshot]": ()=>{
            const s = t.getState();
            return `${s.pastStates.length}|${s.futureStates.length}`;
        }
    }["useHistoryControls.useCallback[getSnapshot]"], [
        t
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSyncExternalStore"])(subscribe, getSnapshot, getSnapshot);
    const state = t.getState();
    return {
        undo: ()=>t.getState().undo(),
        redo: ()=>t.getState().redo(),
        clear: ()=>t.getState().clear(),
        canUndo: state.pastStates.length > 0,
        canRedo: state.futureStates.length > 0,
        pause: ()=>t.getState().pause(),
        resume: ()=>t.getState().resume()
    };
}
_s(useHistoryControls, "rUsu0urmp2LB4luW/6H994MS1H4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSyncExternalStore"]
    ];
});
function useDragHistoryGate() {
    _s1();
    const counter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const t = __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"].temporal;
    const begin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDragHistoryGate.useCallback[begin]": ()=>{
            counter.current += 1;
            if (counter.current === 1) {
                t.getState().pause();
            }
        }
    }["useDragHistoryGate.useCallback[begin]"], [
        t
    ]);
    const end = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDragHistoryGate.useCallback[end]": ()=>{
            counter.current = Math.max(0, counter.current - 1);
            if (counter.current === 0) {
                t.getState().resume();
            }
        }
    }["useDragHistoryGate.useCallback[end]"], [
        t
    ]);
    return {
        begin,
        end
    };
}
_s1(useDragHistoryGate, "Sfh0qVlAsnq7ZNknswuCij61p4w=");
function useUndoRedoShortcuts() {
    _s2();
    const { undo, redo } = useHistoryControls();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useUndoRedoShortcuts.useEffect": ()=>{
            const onKey = {
                "useUndoRedoShortcuts.useEffect.onKey": (e)=>{
                    const tag = e.target?.tagName;
                    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
                    const meta = e.ctrlKey || e.metaKey;
                    if (!meta) return;
                    const key = e.key.toLowerCase();
                    if (key === "z" && !e.shiftKey) {
                        e.preventDefault();
                        undo();
                    } else if (key === "y" || key === "z" && e.shiftKey) {
                        e.preventDefault();
                        redo();
                    }
                }
            }["useUndoRedoShortcuts.useEffect.onKey"];
            window.addEventListener("keydown", onKey);
            return ({
                "useUndoRedoShortcuts.useEffect": ()=>window.removeEventListener("keydown", onKey)
            })["useUndoRedoShortcuts.useEffect"];
        }
    }["useUndoRedoShortcuts.useEffect"], [
        undo,
        redo
    ]);
}
_s2(useUndoRedoShortcuts, "rcb8OqkjiNLqoPbkLF6NmUGLVW0=", false, function() {
    return [
        useHistoryControls
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/utils/shortcuts.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SHORTCUTS_REFERENCE",
    ()=>SHORTCUTS_REFERENCE,
    "useEditorShortcuts",
    ()=>useEditorShortcuts
]);
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
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/state/editorStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$utils$2f$history$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/utils/history.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const SHORTCUTS_REFERENCE = [
    {
        category: "Selecao",
        items: [
            {
                keys: "Click",
                action: "Selecionar elemento"
            },
            {
                keys: "Shift + Click",
                action: "Multi-select toggle"
            },
            {
                keys: "Ctrl/Cmd + A",
                action: "Selecionar tudo da cena"
            },
            {
                keys: "Esc",
                action: "Limpar selecao"
            }
        ]
    },
    {
        category: "Edicao",
        items: [
            {
                keys: "Delete / Backspace",
                action: "Apagar selecionados"
            },
            {
                keys: "Ctrl/Cmd + D",
                action: "Duplicar (cena se nada selecionado, senao elementos)"
            },
            {
                keys: "Ctrl/Cmd + Z",
                action: "Desfazer"
            },
            {
                keys: "Ctrl/Cmd + Y",
                action: "Refazer"
            },
            {
                keys: "Ctrl/Cmd + Shift + Z",
                action: "Refazer (alternativo)"
            }
        ]
    },
    {
        category: "Movimento (nudge)",
        items: [
            {
                keys: "Setas",
                action: "Mover ±0.1%"
            },
            {
                keys: "Shift + Setas",
                action: "Mover ±1%"
            },
            {
                keys: "Ctrl/Cmd + Setas",
                action: "Mover ±0.01% (milimetrico)"
            }
        ]
    },
    {
        category: "Ordem (z-index)",
        items: [
            {
                keys: "Ctrl/Cmd + ]",
                action: "Trazer pra frente (zIndex+1)"
            },
            {
                keys: "Ctrl/Cmd + [",
                action: "Mandar pra tras (zIndex-1)"
            },
            {
                keys: "Ctrl/Cmd + Shift + ]",
                action: "Trazer pra cima de tudo"
            },
            {
                keys: "Ctrl/Cmd + Shift + [",
                action: "Mandar pra baixo de tudo"
            }
        ]
    },
    {
        category: "Visibilidade",
        items: [
            {
                keys: "L",
                action: "Travar / destravar selecionados"
            },
            {
                keys: "H",
                action: "Esconder / mostrar selecionados"
            }
        ]
    },
    {
        category: "Ajuda",
        items: [
            {
                keys: "?",
                action: "Abrir modal de ajuda (vem na E10)"
            }
        ]
    }
];
/**
 * Verifica se o foco do teclado esta num campo de texto (nesse caso
 * NAO interceptamos atalhos pra nao quebrar a digitacao).
 */ function isTypingTarget(target) {
    if (!target) return false;
    const el = target;
    const tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (el.isContentEditable) return true;
    return false;
}
function useEditorShortcuts() {
    _s();
    const selectedIds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "useEditorShortcuts.useEditorStore[selectedIds]": (s)=>s.selectedIds
    }["useEditorShortcuts.useEditorStore[selectedIds]"]);
    const setSelection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "useEditorShortcuts.useEditorStore[setSelection]": (s)=>s.setSelection
    }["useEditorShortcuts.useEditorStore[setSelection]"]);
    const deleteElements = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "useEditorShortcuts.useEditorStore[deleteElements]": (s)=>s.deleteElements
    }["useEditorShortcuts.useEditorStore[deleteElements]"]);
    const duplicateElements = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "useEditorShortcuts.useEditorStore[duplicateElements]": (s)=>s.duplicateElements
    }["useEditorShortcuts.useEditorStore[duplicateElements]"]);
    const duplicateScene = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "useEditorShortcuts.useEditorStore[duplicateScene]": (s)=>s.duplicateScene
    }["useEditorShortcuts.useEditorStore[duplicateScene]"]);
    const layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "useEditorShortcuts.useEditorStore[layout]": (s)=>s.layout
    }["useEditorShortcuts.useEditorStore[layout]"]);
    const currentSceneId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "useEditorShortcuts.useEditorStore[currentSceneId]": (s)=>s.currentSceneId
    }["useEditorShortcuts.useEditorStore[currentSceneId]"]);
    const selectAllInScene = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "useEditorShortcuts.useEditorStore[selectAllInScene]": (s)=>s.selectAllInScene
    }["useEditorShortcuts.useEditorStore[selectAllInScene]"]);
    const nudgeSelected = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "useEditorShortcuts.useEditorStore[nudgeSelected]": (s)=>s.nudgeSelected
    }["useEditorShortcuts.useEditorStore[nudgeSelected]"]);
    const bringForward = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "useEditorShortcuts.useEditorStore[bringForward]": (s)=>s.bringForward
    }["useEditorShortcuts.useEditorStore[bringForward]"]);
    const sendBackward = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "useEditorShortcuts.useEditorStore[sendBackward]": (s)=>s.sendBackward
    }["useEditorShortcuts.useEditorStore[sendBackward]"]);
    const updateElement = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "useEditorShortcuts.useEditorStore[updateElement]": (s)=>s.updateElement
    }["useEditorShortcuts.useEditorStore[updateElement]"]);
    const { undo, redo } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$utils$2f$history$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useHistoryControls"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useEditorShortcuts.useEffect": ()=>{
            const onKey = {
                "useEditorShortcuts.useEffect.onKey": (e)=>{
                    if (isTypingTarget(e.target)) return;
                    const meta = e.ctrlKey || e.metaKey;
                    const key = e.key;
                    // ===== UNDO / REDO =====
                    if (meta && key.toLowerCase() === "z" && !e.shiftKey) {
                        e.preventDefault();
                        undo();
                        return;
                    }
                    if (meta && (key.toLowerCase() === "y" || key.toLowerCase() === "z" && e.shiftKey)) {
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
                            const orig = layout.scenes.find({
                                "useEditorShortcuts.useEffect.onKey.orig": (s)=>s.id === currentSceneId
                            }["useEditorShortcuts.useEffect.onKey.orig"]);
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
                        const scene = layout.scenes.find({
                            "useEditorShortcuts.useEffect.onKey.scene": (s)=>s.id === currentSceneId
                        }["useEditorShortcuts.useEffect.onKey.scene"]);
                        const allLocked = scene?.elements.filter({
                            "useEditorShortcuts.useEffect.onKey": (el)=>selectedIds.includes(el.id)
                        }["useEditorShortcuts.useEffect.onKey"]).every({
                            "useEditorShortcuts.useEffect.onKey": (el)=>el.locked
                        }["useEditorShortcuts.useEffect.onKey"]);
                        selectedIds.forEach({
                            "useEditorShortcuts.useEffect.onKey": (id)=>updateElement(id, {
                                    locked: !allLocked
                                })
                        }["useEditorShortcuts.useEffect.onKey"]);
                        return;
                    }
                    if (key.toLowerCase() === "h" && !meta) {
                        if (selectedIds.length === 0) return;
                        e.preventDefault();
                        const scene = layout.scenes.find({
                            "useEditorShortcuts.useEffect.onKey.scene": (s)=>s.id === currentSceneId
                        }["useEditorShortcuts.useEffect.onKey.scene"]);
                        const allVisible = scene?.elements.filter({
                            "useEditorShortcuts.useEffect.onKey": (el)=>selectedIds.includes(el.id)
                        }["useEditorShortcuts.useEffect.onKey"]).every({
                            "useEditorShortcuts.useEffect.onKey": (el)=>el.visible
                        }["useEditorShortcuts.useEffect.onKey"]);
                        selectedIds.forEach({
                            "useEditorShortcuts.useEffect.onKey": (id)=>updateElement(id, {
                                    visible: !allVisible
                                })
                        }["useEditorShortcuts.useEffect.onKey"]);
                        return;
                    }
                    // ===== HELP (?) =====
                    if (key === "?" && !meta) {
                        e.preventDefault();
                        // Dispara evento custom — modal de help (E10) escuta isso
                        window.dispatchEvent(new CustomEvent("editor:open-help"));
                        return;
                    }
                }
            }["useEditorShortcuts.useEffect.onKey"];
            window.addEventListener("keydown", onKey);
            return ({
                "useEditorShortcuts.useEffect": ()=>window.removeEventListener("keydown", onKey)
            })["useEditorShortcuts.useEffect"];
        }
    }["useEditorShortcuts.useEffect"], [
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
        redo
    ]);
}
_s(useEditorShortcuts, "KrIyoGCfaQEB5+Hb1WRoQPx1kQY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$utils$2f$history$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useHistoryControls"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/panels/HelpModal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HelpModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * HelpModal.tsx
 *
 * EM PALAVRAS SIMPLES: tela de ajuda que abre com a tecla "?". Tem
 * 3 abas: tutorial pra comecar, lista de atalhos, e conceitos
 * (coordenadas %, Caminho C, etc).
 *
 * TECNICAMENTE: portal com modal overlay. Le SHORTCUTS_REFERENCE
 * pra renderizar atalhos automaticamente. Linguagem dupla em todos
 * os textos (simples + tecnico).
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react-dom/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$utils$2f$shortcuts$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/utils/shortcuts.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
function HelpModal({ open, onClose }) {
    _s();
    const [tab, setTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("comecando");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HelpModal.useEffect": ()=>{
            if (!open) return;
            const onKey = {
                "HelpModal.useEffect.onKey": (e)=>{
                    if (e.key === "Escape") onClose();
                }
            }["HelpModal.useEffect.onKey"];
            window.addEventListener("keydown", onKey);
            return ({
                "HelpModal.useEffect": ()=>window.removeEventListener("keydown", onKey)
            })["HelpModal.useEffect"];
        }
    }["HelpModal.useEffect"], [
        open,
        onClose
    ]);
    if (!open || typeof document === "undefined") return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createPortal"])(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: overlayStyle,
        onClick: onClose,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: modalStyle,
            onClick: (e)=>e.stopPropagation(),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                    style: headerStyle,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    style: titleStyle,
                                    children: "Ajuda do Layout Editor"
                                }, void 0, false, {
                                    fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                    lineNumber: 44,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    style: subtitleStyle,
                                    children: "Tudo que voce precisa saber pra usar a ferramenta"
                                }, void 0, false, {
                                    fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                    lineNumber: 45,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/editor/panels/HelpModal.tsx",
                            lineNumber: 43,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            style: closeBtnStyle,
                            title: "Fechar (Esc)",
                            children: "×"
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/HelpModal.tsx",
                            lineNumber: 47,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/editor/panels/HelpModal.tsx",
                    lineNumber: 42,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                    style: tabsStyle,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TabBtn, {
                            active: tab === "comecando",
                            onClick: ()=>setTab("comecando"),
                            children: "Comecando"
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/HelpModal.tsx",
                            lineNumber: 53,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TabBtn, {
                            active: tab === "atalhos",
                            onClick: ()=>setTab("atalhos"),
                            children: "Atalhos"
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/HelpModal.tsx",
                            lineNumber: 56,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TabBtn, {
                            active: tab === "conceitos",
                            onClick: ()=>setTab("conceitos"),
                            children: "Conceitos"
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/HelpModal.tsx",
                            lineNumber: 59,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TabBtn, {
                            active: tab === "integracao",
                            onClick: ()=>setTab("integracao"),
                            children: "Integracao"
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/HelpModal.tsx",
                            lineNumber: 62,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/editor/panels/HelpModal.tsx",
                    lineNumber: 52,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: contentStyle,
                    children: [
                        tab === "comecando" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Comecando, {}, void 0, false, {
                            fileName: "[project]/components/editor/panels/HelpModal.tsx",
                            lineNumber: 68,
                            columnNumber: 35
                        }, this),
                        tab === "atalhos" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Atalhos, {}, void 0, false, {
                            fileName: "[project]/components/editor/panels/HelpModal.tsx",
                            lineNumber: 69,
                            columnNumber: 33
                        }, this),
                        tab === "conceitos" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Conceitos, {}, void 0, false, {
                            fileName: "[project]/components/editor/panels/HelpModal.tsx",
                            lineNumber: 70,
                            columnNumber: 35
                        }, this),
                        tab === "integracao" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Integracao, {}, void 0, false, {
                            fileName: "[project]/components/editor/panels/HelpModal.tsx",
                            lineNumber: 71,
                            columnNumber: 36
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/editor/panels/HelpModal.tsx",
                    lineNumber: 67,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                    style: footerStyle,
                    children: "Pressione Esc pra fechar · Tecla ? abre esta ajuda"
                }, void 0, false, {
                    fileName: "[project]/components/editor/panels/HelpModal.tsx",
                    lineNumber: 74,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/editor/panels/HelpModal.tsx",
            lineNumber: 41,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/editor/panels/HelpModal.tsx",
        lineNumber: 40,
        columnNumber: 5
    }, this), document.body);
}
_s(HelpModal, "ucFOSXWj97brb8ooDwBxqh9Vs7c=");
_c = HelpModal;
function TabBtn({ active, onClick, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        onClick: onClick,
        style: active ? tabActiveStyle : tabStyle,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/editor/panels/HelpModal.tsx",
        lineNumber: 83,
        columnNumber: 5
    }, this);
}
_c1 = TabBtn;
// ===== ABA: COMECANDO =====
function Comecando() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: proseStyle,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Section, {
                title: "O que eh o Layout Editor",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                children: "Em palavras simples:"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 95,
                                columnNumber: 11
                            }, this),
                            " uma ferramenta pra voce posicionar visualmente os elementos dos jogos por cima das molduras AI. Em vez de chutar coordenadas no codigo, voce arrasta com o mouse."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 94,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                children: "Tecnicamente:"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 100,
                                columnNumber: 11
                            }, this),
                            " SPA Next/React com canvas Konva que escreve arquivos `[Jogo]Layout.ts` em `components/games/[jogo]/`. O jogo importa esse arquivo e usa as coordenadas em CSS inline (% do container)."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 99,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                lineNumber: 93,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Section, {
                title: "Tour rapido (5 passos)",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                    style: olStyle,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                    children: "Escolha um jogo"
                                }, void 0, false, {
                                    fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                    lineNumber: 109,
                                    columnNumber: 13
                                }, this),
                                " no dropdown no topo. A moldura aparece no canvas central."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/editor/panels/HelpModal.tsx",
                            lineNumber: 108,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                    children: "Adicione elementos"
                                }, void 0, false, {
                                    fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                    lineNumber: 113,
                                    columnNumber: 13
                                }, this),
                                ' com os botoes "+ Rect/Text/Image/Placeholder" no painel esquerdo.'
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/editor/panels/HelpModal.tsx",
                            lineNumber: 112,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                    children: "Arraste, redimensione e rotacione"
                                }, void 0, false, {
                                    fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                    lineNumber: 117,
                                    columnNumber: 13
                                }, this),
                                " usando as alcas que aparecem quando voce seleciona."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/editor/panels/HelpModal.tsx",
                            lineNumber: 116,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                    children: "Ajuste fino"
                                }, void 0, false, {
                                    fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                    lineNumber: 121,
                                    columnNumber: 13
                                }, this),
                                " no painel direito: setas com 3 niveis de precisao (0.1 / 1 / 0.01 com Shift e Ctrl)."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/editor/panels/HelpModal.tsx",
                            lineNumber: 120,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                    children: "Salvar"
                                }, void 0, false, {
                                    fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                    lineNumber: 125,
                                    columnNumber: 13
                                }, this),
                                " com o botao Salvar (escreve em disco) ou Ctrl+S (sessao no navegador)."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/editor/panels/HelpModal.tsx",
                            lineNumber: 124,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/editor/panels/HelpModal.tsx",
                    lineNumber: 107,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                lineNumber: 106,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Section, {
                title: "Cenas: multiplas telas por jogo",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: 'Cada jogo pode ter varias cenas: tela inicial, vitoria, derrota, modal de regras, jackpot, etc. No painel esquerdo, click em "+ Nova cena" pra criar. Ctrl+D duplica a cena atual (util pra fazer variantes).'
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 132,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: "Cada cena tem sua propria moldura (PNG ou video em loop) e seus proprios elementos. Quando voce salva, o `[Jogo]Layout.ts` exporta todas as cenas como chaves de um objeto."
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 137,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                lineNumber: 131,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/editor/panels/HelpModal.tsx",
        lineNumber: 92,
        columnNumber: 5
    }, this);
}
_c2 = Comecando;
// ===== ABA: ATALHOS =====
function Atalhos() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: proseStyle,
        children: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$utils$2f$shortcuts$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHORTCUTS_REFERENCE"].map((cat)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: shortcutCategoryStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        style: shortcutHeadStyle,
                        children: cat.category
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 153,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                        style: tableStyle,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            children: cat.items.map((it)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            style: kbdCellStyle,
                                            children: it.keys.split(/\s*\+\s*/).map((k, i, arr)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Kbd, {
                                                            children: k
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                                            lineNumber: 161,
                                                            columnNumber: 25
                                                        }, this),
                                                        i < arr.length - 1 && " + "
                                                    ]
                                                }, i, true, {
                                                    fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                                    lineNumber: 160,
                                                    columnNumber: 23
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                            lineNumber: 158,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            style: actionCellStyle,
                                            children: it.action
                                        }, void 0, false, {
                                            fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                            lineNumber: 166,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, it.keys, true, {
                                    fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                    lineNumber: 157,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/HelpModal.tsx",
                            lineNumber: 155,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 154,
                        columnNumber: 11
                    }, this)
                ]
            }, cat.category, true, {
                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                lineNumber: 152,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/components/editor/panels/HelpModal.tsx",
        lineNumber: 150,
        columnNumber: 5
    }, this);
}
_c3 = Atalhos;
// ===== ABA: CONCEITOS =====
function Conceitos() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: proseStyle,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Section, {
                title: "Coordenadas em percentual",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                children: "Em palavras simples:"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 183,
                                columnNumber: 11
                            }, this),
                            ' a posicao do elemento eh medida em "porcentagem do canvas inteiro", nao em pixels fixos. X=50%/Y=50% significa centro.'
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 182,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                children: "Tecnicamente:"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 188,
                                columnNumber: 11
                            }, this),
                            " usamos % do container pai (que tem aspect-ratio fixo 16:9) em vez de px absoluto. Isso garante que o jogo fica identico em 1920x1080, 1366x768, 1024x768, mobile — so muda o tamanho."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 187,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                children: "Por que importa:"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 193,
                                columnNumber: 11
                            }, this),
                            " resolve o bug responsivo (slot machine que fica desalinhado em telas menores). Cada 1% = aproximadamente 19px em 1920p."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 192,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                lineNumber: 181,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Section, {
                title: "Caminho C — como o jogo usa o layout",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                children: "Em palavras simples:"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 200,
                                columnNumber: 11
                            }, this),
                            " o editor escreve um arquivo `.ts` que o jogo importa. Quando voce salva, o jogo atualiza sozinho via hot reload do Next."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 199,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                children: "Tecnicamente:"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 204,
                                columnNumber: 11
                            }, this),
                            " o editor gera `components/games/[jogo]/[Jogo]Layout.ts` com um objeto LAYOUT exportado. O jogo faz `import ",
                            `{`,
                            " LAYOUT ",
                            `}`,
                            ' from "./SlotsClassicLayout"` e usa `style=',
                            `{`,
                            "LAYOUT.default.elements.reel_1.style",
                            `}`,
                            '` em cada elemento. O arquivo eh estatico ("burro") — nao tem logica.'
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 203,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                children: "Regra absoluta:"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 210,
                                columnNumber: 11
                            }, this),
                            " NUNCA edite o `.ts` gerado manualmente. Sempre use o editor. Edicao manual sera sobrescrita no proximo save."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 209,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                lineNumber: 198,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Section, {
                title: "Cenas: variantes do mesmo jogo",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                children: "Em palavras simples:"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 217,
                                columnNumber: 11
                            }, this),
                            " jogo tem varias telas (inicial, girando, vitoria, etc). Cada uma eh uma cena. Voce edita uma por vez e o jogo escolhe qual mostrar baseado na fase do jogo."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 216,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                children: "Tecnicamente:"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 222,
                                columnNumber: 11
                            }, this),
                            " `LAYOUT.default`, `LAYOUT.vitoria`, `LAYOUT.modalRegras` etc. No jogo:",
                            " ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                children: 'const cena = phase === "WIN" ? LAYOUT.vitoria : LAYOUT.default'
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 224,
                                columnNumber: 16
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 221,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                lineNumber: 215,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Section, {
                title: "Background pode ser video",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                children: "Em palavras simples:"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 230,
                                columnNumber: 11
                            }, this),
                            " alem de PNG estatico, voce pode usar um MP4 em loop (firulas, brilho, particulas). Da impressao de cassino real."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 229,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                children: "Tecnicamente:"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 234,
                                columnNumber: 11
                            }, this),
                            " renderiza",
                            " ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                children: `<video autoPlay loop muted playsInline poster={png} />`
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 235,
                                columnNumber: 11
                            }, this),
                            ". PNG fallback eh obrigatorio (usado durante carregamento). Recomendado so na cena inicial pra economizar bateria mobile."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 233,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                lineNumber: 228,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Section, {
                title: "Snap to grid + Smart guides",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                children: "Em palavras simples:"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 243,
                                columnNumber: 11
                            }, this),
                            ' quando voce arrasta perto de outro elemento, ele "gruda" no alinhamento. Linhas douradas mostram. Shift desliga.'
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 242,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                children: "Tecnicamente:"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 247,
                                columnNumber: 11
                            }, this),
                            " dragBoundFunc do Konva calcula bounding box vs siblings, retorna posicao corrigida com tolerance de 0.5%. Detecta 6 ancoras por axis (left/center/right e top/middle/bottom)."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 246,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                lineNumber: 241,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/editor/panels/HelpModal.tsx",
        lineNumber: 180,
        columnNumber: 5
    }, this);
}
_c4 = Conceitos;
// ===== ABA: INTEGRACAO =====
function Integracao() {
    _s1();
    const [content, setContent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Integracao.useEffect": ()=>{
            fetch("/api/editor/docs?file=INTEGRACAO-LAYOUT-EDITOR-COM-JOGOS.md").then({
                "Integracao.useEffect": async (r)=>{
                    if (!r.ok) throw new Error(`Status ${r.status}`);
                    const text = await r.text();
                    setContent(text);
                    setLoading(false);
                }
            }["Integracao.useEffect"]).catch({
                "Integracao.useEffect": (err)=>{
                    setError(err instanceof Error ? err.message : String(err));
                    setLoading(false);
                }
            }["Integracao.useEffect"]);
        }
    }["Integracao.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: proseStyle,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Section, {
                title: "Documento mestre",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                children: "Em palavras simples:"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 280,
                                columnNumber: 11
                            }, this),
                            " documento completo com tudo que voce precisa saber pra integrar jogos com o editor — migracao de existentes, criacao de novos, casos especiais, troubleshooting."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 279,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                children: "Tecnicamente:"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 285,
                                columnNumber: 11
                            }, this),
                            " arquivo",
                            " ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                style: codeStyle,
                                children: "app/editor/docs/INTEGRACAO-LAYOUT-EDITOR-COM-JOGOS.md"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 286,
                                columnNumber: 11
                            }, this),
                            " ",
                            "servido via API route. Suporta ate IA nova em sessao limpa — basta ler este documento pra ter todo o contexto."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 284,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                lineNumber: 278,
                columnNumber: 7
            }, this),
            loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                style: {
                    color: "#8a8a8a",
                    fontSize: 12
                },
                children: "Carregando documento..."
            }, void 0, false, {
                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                lineNumber: 292,
                columnNumber: 19
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Section, {
                title: "Erro ao carregar",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Strong, {
                                children: "Erro:"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 297,
                                columnNumber: 13
                            }, this),
                            " ",
                            error
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 296,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(P, {
                        children: [
                            "Voce pode abrir o arquivo direto em",
                            " ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                style: codeStyle,
                                children: "app/editor/docs/INTEGRACAO-LAYOUT-EDITOR-COM-JOGOS.md"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                                lineNumber: 301,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/panels/HelpModal.tsx",
                        lineNumber: 299,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                lineNumber: 295,
                columnNumber: 9
            }, this),
            content && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                style: mdContentStyle,
                children: content
            }, void 0, false, {
                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                lineNumber: 307,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/editor/panels/HelpModal.tsx",
        lineNumber: 277,
        columnNumber: 5
    }, this);
}
_s1(Integracao, "mTStEmDVDuH31BdI3o5rv5XVFAQ=");
_c5 = Integracao;
// ===== HELPERS DE LAYOUT =====
function Section({ title, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        style: sectionStyle,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                style: sectionHeadStyle,
                children: title
            }, void 0, false, {
                fileName: "[project]/components/editor/panels/HelpModal.tsx",
                lineNumber: 316,
                columnNumber: 7
            }, this),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/components/editor/panels/HelpModal.tsx",
        lineNumber: 315,
        columnNumber: 5
    }, this);
}
_c6 = Section;
function P({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        style: pStyle,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/editor/panels/HelpModal.tsx",
        lineNumber: 323,
        columnNumber: 10
    }, this);
}
_c7 = P;
function Strong({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
        style: {
            color: "#D4A843"
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/components/editor/panels/HelpModal.tsx",
        lineNumber: 327,
        columnNumber: 10
    }, this);
}
_c8 = Strong;
function Kbd({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("kbd", {
        style: kbdInlineStyle,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/editor/panels/HelpModal.tsx",
        lineNumber: 331,
        columnNumber: 10
    }, this);
}
_c9 = Kbd;
const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9500,
    backdropFilter: "blur(6px)"
};
const modalStyle = {
    background: "#0a0806",
    border: "1px solid rgba(212,168,67,0.3)",
    borderRadius: 10,
    width: 800,
    maxWidth: "92vw",
    maxHeight: "88vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 10px 60px rgba(0,0,0,0.7)"
};
const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 24px 12px 24px",
    borderBottom: "1px solid rgba(212,168,67,0.1)"
};
const titleStyle = {
    fontSize: 18,
    fontWeight: 700,
    color: "#D4A843",
    margin: 0
};
const subtitleStyle = {
    fontSize: 12,
    color: "#8a8a8a",
    margin: "4px 0 0 0"
};
const closeBtnStyle = {
    background: "transparent",
    border: "none",
    color: "#8a8a8a",
    fontSize: 22,
    cursor: "pointer",
    padding: 4,
    lineHeight: 1
};
const tabsStyle = {
    display: "flex",
    gap: 4,
    padding: "12px 24px 0 24px",
    borderBottom: "1px solid rgba(212,168,67,0.1)"
};
const tabStyle = {
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    padding: "10px 16px",
    fontSize: 13,
    cursor: "pointer",
    color: "#8a8a8a",
    fontFamily: "inherit",
    marginBottom: -1
};
const tabActiveStyle = {
    ...tabStyle,
    color: "#D4A843",
    borderBottom: "2px solid #D4A843"
};
const contentStyle = {
    flex: 1,
    overflowY: "auto",
    padding: "16px 24px"
};
const proseStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 20
};
const sectionStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 8
};
const sectionHeadStyle = {
    fontSize: 14,
    fontWeight: 700,
    color: "#D4A843",
    margin: 0,
    letterSpacing: 0.3
};
const pStyle = {
    fontSize: 13,
    color: "#c5c5c5",
    margin: 0,
    lineHeight: 1.6
};
const olStyle = {
    fontSize: 13,
    color: "#c5c5c5",
    margin: 0,
    paddingLeft: 20,
    lineHeight: 1.7,
    display: "flex",
    flexDirection: "column",
    gap: 4
};
const shortcutCategoryStyle = {
    marginBottom: 16
};
const shortcutHeadStyle = {
    fontSize: 12,
    fontWeight: 700,
    color: "#D4A843",
    margin: "0 0 8px 0",
    letterSpacing: 1,
    textTransform: "uppercase"
};
const tableStyle = {
    width: "100%",
    borderCollapse: "collapse"
};
const kbdCellStyle = {
    padding: "4px 8px 4px 0",
    whiteSpace: "nowrap",
    width: 1,
    fontSize: 11,
    color: "#8a8a8a",
    verticalAlign: "top"
};
const actionCellStyle = {
    padding: "4px 0",
    fontSize: 12,
    color: "#c5c5c5"
};
const kbdInlineStyle = {
    display: "inline-block",
    padding: "1px 6px",
    background: "rgba(212,168,67,0.08)",
    border: "1px solid rgba(212,168,67,0.3)",
    borderRadius: 3,
    fontSize: 10,
    fontFamily: "ui-monospace, monospace",
    color: "#D4A843"
};
const footerStyle = {
    padding: "12px 24px",
    borderTop: "1px solid rgba(212,168,67,0.1)",
    fontSize: 11,
    color: "#5a5a5a",
    textAlign: "center",
    fontFamily: "ui-monospace, monospace"
};
const codeStyle = {
    padding: "1px 6px",
    background: "rgba(212,168,67,0.08)",
    border: "1px solid rgba(212,168,67,0.2)",
    borderRadius: 3,
    fontSize: 11,
    fontFamily: "ui-monospace, monospace",
    color: "#D4A843"
};
const mdContentStyle = {
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(212,168,67,0.1)",
    borderRadius: 6,
    padding: 16,
    fontSize: 11,
    lineHeight: 1.6,
    color: "#c5c5c5",
    fontFamily: "ui-monospace, monospace",
    whiteSpace: "pre-wrap",
    overflow: "auto",
    maxHeight: 500,
    margin: 0
};
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9;
__turbopack_context__.k.register(_c, "HelpModal");
__turbopack_context__.k.register(_c1, "TabBtn");
__turbopack_context__.k.register(_c2, "Comecando");
__turbopack_context__.k.register(_c3, "Atalhos");
__turbopack_context__.k.register(_c4, "Conceitos");
__turbopack_context__.k.register(_c5, "Integracao");
__turbopack_context__.k.register(_c6, "Section");
__turbopack_context__.k.register(_c7, "P");
__turbopack_context__.k.register(_c8, "Strong");
__turbopack_context__.k.register(_c9, "Kbd");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/panels/ToastContainer.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ToastContainer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * ToastContainer.tsx
 *
 * EM PALAVRAS SIMPLES: caixinhas de aviso que entram suavemente pela
 * direita quando aparecem e somem com fade quando passam o tempo.
 *
 * TECNICAMENTE: escuta eventos custom `editor:toast` e mantem fila
 * com auto-dismiss. Animacao via framer-motion AnimatePresence.
 * 3 tipos: info, success, error.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react-dom/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function ToastContainer() {
    _s();
    const [toasts, setToasts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ToastContainer.useEffect": ()=>{
            const onToast = {
                "ToastContainer.useEffect.onToast": (e)=>{
                    const detail = e.detail;
                    if (!detail) return;
                    const duration = detail.durationMs ?? (detail.type === "error" ? 6000 : 3500);
                    const toast = {
                        id: crypto.randomUUID(),
                        type: detail.type,
                        message: detail.message,
                        expiresAt: Date.now() + duration
                    };
                    setToasts({
                        "ToastContainer.useEffect.onToast": (prev)=>[
                                ...prev,
                                toast
                            ].slice(-5)
                    }["ToastContainer.useEffect.onToast"]);
                }
            }["ToastContainer.useEffect.onToast"];
            window.addEventListener("editor:toast", onToast);
            return ({
                "ToastContainer.useEffect": ()=>window.removeEventListener("editor:toast", onToast)
            })["ToastContainer.useEffect"];
        }
    }["ToastContainer.useEffect"], []);
    // Auto-dismiss tick
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ToastContainer.useEffect": ()=>{
            if (toasts.length === 0) return;
            const interval = window.setInterval({
                "ToastContainer.useEffect.interval": ()=>{
                    const now = Date.now();
                    setToasts({
                        "ToastContainer.useEffect.interval": (prev)=>prev.filter({
                                "ToastContainer.useEffect.interval": (t)=>t.expiresAt > now
                            }["ToastContainer.useEffect.interval"])
                    }["ToastContainer.useEffect.interval"]);
                }
            }["ToastContainer.useEffect.interval"], 200);
            return ({
                "ToastContainer.useEffect": ()=>window.clearInterval(interval)
            })["ToastContainer.useEffect"];
        }
    }["ToastContainer.useEffect"], [
        toasts.length
    ]);
    if (typeof document === "undefined") return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createPortal"])(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: containerStyle,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
            children: toasts.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                    initial: {
                        opacity: 0,
                        x: 80,
                        scale: 0.95
                    },
                    animate: {
                        opacity: 1,
                        x: 0,
                        scale: 1
                    },
                    exit: {
                        opacity: 0,
                        x: 80,
                        scale: 0.95
                    },
                    transition: {
                        duration: 0.2,
                        ease: "easeOut"
                    },
                    style: {
                        ...toastBase,
                        ...toastByType[t.type]
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            style: iconStyle,
                            children: iconByType[t.type]
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/ToastContainer.tsx",
                            lineNumber: 74,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            style: msgStyle,
                            children: t.message
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/ToastContainer.tsx",
                            lineNumber: 75,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setToasts((prev)=>prev.filter((x)=>x.id !== t.id)),
                            style: closeStyle,
                            title: "Fechar",
                            children: "×"
                        }, void 0, false, {
                            fileName: "[project]/components/editor/panels/ToastContainer.tsx",
                            lineNumber: 76,
                            columnNumber: 13
                        }, this)
                    ]
                }, t.id, true, {
                    fileName: "[project]/components/editor/panels/ToastContainer.tsx",
                    lineNumber: 66,
                    columnNumber: 11
                }, this))
        }, void 0, false, {
            fileName: "[project]/components/editor/panels/ToastContainer.tsx",
            lineNumber: 64,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/editor/panels/ToastContainer.tsx",
        lineNumber: 63,
        columnNumber: 5
    }, this), document.body);
}
_s(ToastContainer, "anZApbgxwikBV3sgnrkn1fT1xIY=");
_c = ToastContainer;
const iconByType = {
    info: "ℹ",
    success: "✓",
    error: "⚠"
};
const containerStyle = {
    position: "fixed",
    bottom: 24,
    right: 24,
    zIndex: 10000,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    pointerEvents: "none"
};
const toastBase = {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 6,
    fontSize: 13,
    minWidth: 280,
    maxWidth: 420,
    pointerEvents: "auto",
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    backdropFilter: "blur(8px)"
};
const toastByType = {
    info: {
        background: "rgba(20, 30, 50, 0.92)",
        border: "1px solid rgba(100, 150, 200, 0.4)",
        color: "#a8c5e0"
    },
    success: {
        background: "rgba(20, 35, 22, 0.92)",
        border: "1px solid rgba(100, 200, 100, 0.4)",
        color: "#9ed99e"
    },
    error: {
        background: "rgba(40, 18, 18, 0.92)",
        border: "1px solid rgba(220, 80, 80, 0.5)",
        color: "#f0a8a8"
    }
};
const iconStyle = {
    fontSize: 16,
    lineHeight: 1,
    paddingTop: 1
};
const msgStyle = {
    flex: 1,
    lineHeight: 1.4
};
const closeStyle = {
    background: "transparent",
    border: "none",
    color: "currentColor",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: 1,
    opacity: 0.6,
    padding: 0,
    fontFamily: "inherit"
};
var _c;
__turbopack_context__.k.register(_c, "ToastContainer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/EditorClient.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>EditorClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * EditorRoot.tsx
 *
 * EM PALAVRAS SIMPLES: tela principal. Layout 3 colunas: painel
 * esquerdo (cenas + elementos), canvas central, painel direito
 * (propriedades). Toolbar superior com botoes rapidos.
 *
 * TECNICAMENTE: client component que orquestra Toolbar + PanelLeft
 * + EditorStage + PanelRight. Estado via useEditorStore. Atalhos
 * globais via useEditorShortcuts (16+ atalhos unificados).
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$IframeEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/IframeEditor.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$Toolbar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/Toolbar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$DomPropsPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/panels/DomPropsPanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$FilePanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/panels/FilePanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$DomTreePanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/panels/DomTreePanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$ImageUploadPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/panels/ImageUploadPanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$HoverEditorPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/panels/HoverEditorPanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$VideoBackgroundPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/panels/VideoBackgroundPanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$CssToolsPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/panels/CssToolsPanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$SavePanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/panels/SavePanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$HistoryModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/panels/HistoryModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$HelpModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/panels/HelpModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$ToastContainer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/panels/ToastContainer.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$editor$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/editor.config.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor/state/editorStore.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
function EditorClient() {
    _s();
    const targetId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "EditorClient.useEditorStore[targetId]": (s)=>s.targetId
    }["EditorClient.useEditorStore[targetId]"]);
    const layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "EditorClient.useEditorStore[layout]": (s)=>s.layout
    }["EditorClient.useEditorStore[layout]"]);
    const currentSceneId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "EditorClient.useEditorStore[currentSceneId]": (s)=>s.currentSceneId
    }["EditorClient.useEditorStore[currentSceneId]"]);
    const selectedIds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "EditorClient.useEditorStore[selectedIds]": (s)=>s.selectedIds
    }["EditorClient.useEditorStore[selectedIds]"]);
    const setTarget = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "EditorClient.useEditorStore[setTarget]": (s)=>s.setTarget
    }["EditorClient.useEditorStore[setTarget]"]);
    // Arquivo ativo (componente individual) — "" = tela principal
    const [activeFile, setActiveFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    // Elemento DOM selecionado no iframe
    const [selectedElement, setSelectedElement] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Refs do iframe expostos pelo IframeEditor (pra DomTreePanel)
    const [iframeRefState, setIframeRefState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [iframeLoadedState, setIframeLoadedState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Lista de jogos descoberta via API (escaneamento de gamesDir)
    const [games, setGames] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [gamesLoading, setGamesLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [gamesNotFound, setGamesNotFound] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Pasta de jogos (editavel + persiste em localStorage)
    const [gamesDir, setGamesDir] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$editor$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EDITOR_CONFIG"].gamesDir);
    const [gamesDirInput, setGamesDirInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$editor$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EDITOR_CONFIG"].gamesDir);
    // Carrega gamesDir do localStorage na montagem
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EditorClient.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const saved = window.localStorage.getItem("editor:gamesDir");
            if (saved) {
                setGamesDir(saved);
                setGamesDirInput(saved);
            }
        }
    }["EditorClient.useEffect"], []);
    // Recarrega lista quando gamesDir muda
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EditorClient.useEffect": ()=>{
            setGamesLoading(true);
            setGamesNotFound(false);
            fetch(`/api/editor/games?dir=${encodeURIComponent(gamesDir)}`).then({
                "EditorClient.useEffect": (r)=>r.json()
            }["EditorClient.useEffect"]).then({
                "EditorClient.useEffect": (data)=>{
                    if (data.ok && Array.isArray(data.games)) {
                        const targets = data.games.map({
                            "EditorClient.useEffect.targets": (g)=>({
                                    id: g.id,
                                    name: g.name,
                                    baseResolution: __TURBOPACK__imported__module__$5b$project$5d2f$editor$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EDITOR_CONFIG"].defaultBaseResolution
                                })
                        }["EditorClient.useEffect.targets"]);
                        setGames(targets);
                        setGamesNotFound(Boolean(data.notFound));
                    }
                    setGamesLoading(false);
                }
            }["EditorClient.useEffect"]).catch({
                "EditorClient.useEffect": ()=>setGamesLoading(false)
            }["EditorClient.useEffect"]);
        }
    }["EditorClient.useEffect"], [
        gamesDir
    ]);
    const applyGamesDir = ()=>{
        const clean = gamesDirInput.trim().replace(/^\/+|\/+$/g, "");
        if (!clean) return;
        setGamesDir(clean);
        if ("TURBOPACK compile-time truthy", 1) {
            window.localStorage.setItem("editor:gamesDir", clean);
        }
    };
    // Modal historico
    const [historyOpen, setHistoryOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [helpOpen, setHelpOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [previewOpen, setPreviewOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EditorClient.useEffect": ()=>{
            const onHist = {
                "EditorClient.useEffect.onHist": ()=>setHistoryOpen(true)
            }["EditorClient.useEffect.onHist"];
            const onHelp = {
                "EditorClient.useEffect.onHelp": ()=>setHelpOpen(true)
            }["EditorClient.useEffect.onHelp"];
            const onPrev = {
                "EditorClient.useEffect.onPrev": ()=>setPreviewOpen(true)
            }["EditorClient.useEffect.onPrev"];
            window.addEventListener("editor:open-history", onHist);
            window.addEventListener("editor:open-help", onHelp);
            window.addEventListener("editor:open-preview", onPrev);
            return ({
                "EditorClient.useEffect": ()=>{
                    window.removeEventListener("editor:open-history", onHist);
                    window.removeEventListener("editor:open-help", onHelp);
                    window.removeEventListener("editor:open-preview", onPrev);
                }
            })["EditorClient.useEffect"];
        }
    }["EditorClient.useEffect"], []);
    // Atalho Ctrl+S = prevenir save padrao do browser, emitir toast
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EditorClient.useEffect": ()=>{
            const onKey = {
                "EditorClient.useEffect.onKey": (e)=>{
                    const tag = e.target?.tagName;
                    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
                    const meta = e.ctrlKey || e.metaKey;
                    if (!meta) return;
                    if (e.key.toLowerCase() === "s") {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent("editor:toast", {
                            detail: {
                                type: "info",
                                message: "Save no .tsx: em desenvolvimento (Fase 10)"
                            }
                        }));
                    }
                }
            }["EditorClient.useEffect.onKey"];
            window.addEventListener("keydown", onKey);
            return ({
                "EditorClient.useEffect": ()=>window.removeEventListener("keydown", onKey)
            })["EditorClient.useEffect"];
        }
    }["EditorClient.useEffect"], []);
    // Inicializacao: quando games carregar, escolhe o primeiro
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EditorClient.useEffect": ()=>{
            if (!targetId && games[0]) {
                const t = games[0];
                setTarget(t.id, t.baseResolution, "");
            }
        }
    }["EditorClient.useEffect"], [
        targetId,
        setTarget,
        games
    ]);
    // Listener global de Shift (Konva nao expoe shiftKey no onClick de shape)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EditorClient.useEffect": ()=>{
            const sync = {
                "EditorClient.useEffect.sync": (e)=>{
                    window.__lastShiftKey = e.shiftKey;
                }
            }["EditorClient.useEffect.sync"];
            window.addEventListener("keydown", sync);
            window.addEventListener("keyup", sync);
            return ({
                "EditorClient.useEffect": ()=>{
                    window.removeEventListener("keydown", sync);
                    window.removeEventListener("keyup", sync);
                }
            })["EditorClient.useEffect"];
        }
    }["EditorClient.useEffect"], []);
    // Modal confirmacao de saida sem salvar
    const [showUnsavedModal, setShowUnsavedModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [pendingTargetId, setPendingTargetId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const domChanges = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"])({
        "EditorClient.useEditorStore[domChanges]": (s)=>s.domChanges
    }["EditorClient.useEditorStore[domChanges]"]);
    const hasUnsavedChanges = domChanges.length > 0;
    const handleTargetChange = (id)=>{
        const t = games.find((x)=>x.id === id);
        if (!t) return;
        // Se tem mudancas nao salvas, perguntar antes
        if (hasUnsavedChanges) {
            setPendingTargetId(id);
            setShowUnsavedModal(true);
            return;
        }
        setTarget(t.id, t.baseResolution, "");
        setActiveFile("");
        setSelectedElement(null);
    };
    const confirmLeave = ()=>{
        if (pendingTargetId) {
            const t = games.find((x)=>x.id === pendingTargetId);
            if (t) {
                setTarget(t.id, t.baseResolution, "");
                setActiveFile("");
                setSelectedElement(null);
            }
        }
        setShowUnsavedModal(false);
        setPendingTargetId(null);
    };
    const sceneElementCount = layout.scenes.find((s)=>s.id === currentSceneId)?.elements.length ?? 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        style: mainStyle,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("style", {
                children: `
        .editor-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .editor-scroll::-webkit-scrollbar-track { background: rgba(212,168,67,0.03); border-radius: 3px; }
        .editor-scroll::-webkit-scrollbar-thumb { background: rgba(212,168,67,0.2); border-radius: 3px; }
        .editor-scroll::-webkit-scrollbar-thumb:hover { background: rgba(212,168,67,0.4); }
        .editor-scroll::-webkit-scrollbar-corner { background: transparent; }
      `
            }, void 0, false, {
                fileName: "[project]/components/editor/EditorClient.tsx",
                lineNumber: 199,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                style: headerStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                style: titleStyle,
                                children: __TURBOPACK__imported__module__$5b$project$5d2f$editor$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EDITOR_CONFIG"].appName
                            }, void 0, false, {
                                fileName: "[project]/components/editor/EditorClient.tsx",
                                lineNumber: 208,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: subtitleStyle,
                                children: "Editor visual com iframe — arraste elementos pra reposicionar"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/EditorClient.tsx",
                                lineNumber: 209,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/EditorClient.tsx",
                        lineNumber: 207,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: badgeStyle,
                        children: "DEV MODE"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/EditorClient.tsx",
                        lineNumber: 211,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/EditorClient.tsx",
                lineNumber: 206,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                style: controlsStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: labelStyle,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Alvo"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/EditorClient.tsx",
                                lineNumber: 216,
                                columnNumber: 11
                            }, this),
                            gamesLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    ...selectStyle,
                                    color: "#8a8a8a"
                                },
                                children: "Carregando..."
                            }, void 0, false, {
                                fileName: "[project]/components/editor/EditorClient.tsx",
                                lineNumber: 218,
                                columnNumber: 13
                            }, this) : games.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    ...selectStyle,
                                    color: "#8a8a8a",
                                    fontSize: 11
                                },
                                children: gamesNotFound ? `Pasta "${gamesDir}" nao existe` : `Nenhuma subpasta em "${gamesDir}"`
                            }, void 0, false, {
                                fileName: "[project]/components/editor/EditorClient.tsx",
                                lineNumber: 220,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: targetId,
                                onChange: (e)=>handleTargetChange(e.target.value),
                                style: selectStyle,
                                children: games.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: t.id,
                                        children: t.name
                                    }, t.id, false, {
                                        fileName: "[project]/components/editor/EditorClient.tsx",
                                        lineNumber: 226,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/components/editor/EditorClient.tsx",
                                lineNumber: 224,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/EditorClient.tsx",
                        lineNumber: 215,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: labelStyle,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Pasta de jogos"
                            }, void 0, false, {
                                fileName: "[project]/components/editor/EditorClient.tsx",
                                lineNumber: 235,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    display: "flex",
                                    gap: 4
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        value: gamesDirInput,
                                        onChange: (e)=>setGamesDirInput(e.target.value),
                                        onKeyDown: (e)=>{
                                            if (e.key === "Enter") applyGamesDir();
                                        },
                                        style: dirInputStyle,
                                        placeholder: "components/games",
                                        title: "Pasta onde estao os jogos. Edite e pressione Enter pra escanear."
                                    }, void 0, false, {
                                        fileName: "[project]/components/editor/EditorClient.tsx",
                                        lineNumber: 237,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: applyGamesDir,
                                        style: dirBtnStyle,
                                        title: "Escanear esta pasta",
                                        children: "↻"
                                    }, void 0, false, {
                                        fileName: "[project]/components/editor/EditorClient.tsx",
                                        lineNumber: 248,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/editor/EditorClient.tsx",
                                lineNumber: 236,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/EditorClient.tsx",
                        lineNumber: 234,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: infoStyle,
                        children: [
                            targetId || "nenhum alvo",
                            " · iframe proxy → :3000"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/EditorClient.tsx",
                        lineNumber: 254,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/EditorClient.tsx",
                lineNumber: 214,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$Toolbar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/components/editor/EditorClient.tsx",
                lineNumber: 259,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: gridStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: leftColStyle,
                        className: "editor-scroll",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$FilePanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                activeFile: activeFile,
                                onSelectFile: (f)=>setActiveFile(f)
                            }, void 0, false, {
                                fileName: "[project]/components/editor/EditorClient.tsx",
                                lineNumber: 263,
                                columnNumber: 11
                            }, this),
                            iframeRefState && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$DomTreePanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                iframeRef: iframeRefState,
                                iframeLoaded: iframeLoadedState,
                                selected: selectedElement,
                                onSelect: (el)=>{
                                    // Selecionar elemento via DomTree
                                    window.dispatchEvent(new CustomEvent("editor:select-element", {
                                        detail: {
                                            element: el
                                        }
                                    }));
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/editor/EditorClient.tsx",
                                lineNumber: 265,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/EditorClient.tsx",
                        lineNumber: 262,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: canvasWrapStyle,
                        className: "editor-scroll",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$IframeEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            gameId: targetId || null,
                            activeFile: activeFile,
                            onSelectElement: setSelectedElement,
                            onIframeRef: setIframeRefState,
                            onIframeLoaded: setIframeLoadedState
                        }, void 0, false, {
                            fileName: "[project]/components/editor/EditorClient.tsx",
                            lineNumber: 277,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/editor/EditorClient.tsx",
                        lineNumber: 276,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: rightColStyle,
                        className: "editor-scroll",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$DomPropsPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                selected: selectedElement
                            }, void 0, false, {
                                fileName: "[project]/components/editor/EditorClient.tsx",
                                lineNumber: 286,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$ImageUploadPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                selected: selectedElement,
                                pushUndo: ()=>{
                                    if (selectedElement) {
                                        window.dispatchEvent(new CustomEvent("editor:push-undo", {
                                            detail: {
                                                element: selectedElement.element
                                            }
                                        }));
                                    }
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/editor/EditorClient.tsx",
                                lineNumber: 287,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$HoverEditorPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                selected: selectedElement,
                                pushUndo: ()=>{
                                    if (selectedElement) {
                                        window.dispatchEvent(new CustomEvent("editor:push-undo", {
                                            detail: {
                                                element: selectedElement.element
                                            }
                                        }));
                                    }
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/editor/EditorClient.tsx",
                                lineNumber: 297,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$VideoBackgroundPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                selected: selectedElement,
                                pushUndo: ()=>{
                                    if (selectedElement) {
                                        window.dispatchEvent(new CustomEvent("editor:push-undo", {
                                            detail: {
                                                element: selectedElement.element
                                            }
                                        }));
                                    }
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/editor/EditorClient.tsx",
                                lineNumber: 307,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$CssToolsPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                selected: selectedElement,
                                pushUndo: ()=>{
                                    if (selectedElement) {
                                        window.dispatchEvent(new CustomEvent("editor:push-undo", {
                                            detail: {
                                                element: selectedElement.element
                                            }
                                        }));
                                    }
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/editor/EditorClient.tsx",
                                lineNumber: 317,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$SavePanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                selected: selectedElement,
                                gameId: targetId || null,
                                hasChanges: hasUnsavedChanges,
                                undoCount: domChanges.length
                            }, void 0, false, {
                                fileName: "[project]/components/editor/EditorClient.tsx",
                                lineNumber: 327,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/editor/EditorClient.tsx",
                        lineNumber: 285,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/EditorClient.tsx",
                lineNumber: 261,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                style: footerStyle,
                children: [
                    "Pressione ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("kbd", {
                        style: kbdStyle,
                        children: "?"
                    }, void 0, false, {
                        fileName: "[project]/components/editor/EditorClient.tsx",
                        lineNumber: 337,
                        columnNumber: 19
                    }, this),
                    ' pra ver lista de atalhos e tutorial · Click "Preview" pra ver layout em 5 resolucoes'
                ]
            }, void 0, true, {
                fileName: "[project]/components/editor/EditorClient.tsx",
                lineNumber: 336,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$HistoryModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                open: historyOpen,
                onClose: ()=>setHistoryOpen(false)
            }, void 0, false, {
                fileName: "[project]/components/editor/EditorClient.tsx",
                lineNumber: 340,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$HelpModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                open: helpOpen,
                onClose: ()=>setHelpOpen(false)
            }, void 0, false, {
                fileName: "[project]/components/editor/EditorClient.tsx",
                lineNumber: 341,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$panels$2f$ToastContainer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/components/editor/EditorClient.tsx",
                lineNumber: 342,
                columnNumber: 7
            }, this),
            showUnsavedModal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: modalOverlayStyle,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: modalBoxStyle,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                fontSize: 15,
                                fontWeight: 700,
                                color: "#D4A843",
                                marginBottom: 12
                            },
                            children: "Mudancas nao salvas"
                        }, void 0, false, {
                            fileName: "[project]/components/editor/EditorClient.tsx",
                            lineNumber: 348,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            style: {
                                color: "#ccc",
                                fontSize: 13,
                                lineHeight: 1.5,
                                marginBottom: 20
                            },
                            children: "Voce tem alteracoes que ainda nao foram salvas. Se trocar de alvo agora, as mudancas serao perdidas."
                        }, void 0, false, {
                            fileName: "[project]/components/editor/EditorClient.tsx",
                            lineNumber: 351,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: "flex",
                                gap: 10,
                                justifyContent: "flex-end"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>{
                                        setShowUnsavedModal(false);
                                        setPendingTargetId(null);
                                    },
                                    style: modalBtnSecondaryStyle,
                                    children: "Continuar editando"
                                }, void 0, false, {
                                    fileName: "[project]/components/editor/EditorClient.tsx",
                                    lineNumber: 356,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: confirmLeave,
                                    style: modalBtnDangerStyle,
                                    children: "Descartar e trocar"
                                }, void 0, false, {
                                    fileName: "[project]/components/editor/EditorClient.tsx",
                                    lineNumber: 362,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/editor/EditorClient.tsx",
                            lineNumber: 355,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/editor/EditorClient.tsx",
                    lineNumber: 347,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/editor/EditorClient.tsx",
                lineNumber: 346,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/editor/EditorClient.tsx",
        lineNumber: 197,
        columnNumber: 5
    }, this);
}
_s(EditorClient, "u/K4xHvQimzrpOmh0EidVsuUaXQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2f$state$2f$editorStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEditorStore"]
    ];
});
_c = EditorClient;
const mainStyle = {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    padding: 24,
    gap: 16,
    maxWidth: 1600,
    margin: "0 auto"
};
const headerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
};
const titleStyle = {
    fontSize: 22,
    fontWeight: 700,
    color: "#D4A843",
    margin: 0,
    letterSpacing: 0.3
};
const subtitleStyle = {
    fontSize: 13,
    color: "#8a8a8a",
    marginTop: 4
};
const badgeStyle = {
    fontSize: 11,
    padding: "4px 10px",
    border: "1px solid rgba(212,168,67,0.4)",
    borderRadius: 999,
    color: "#D4A843",
    letterSpacing: 0.5
};
const controlsStyle = {
    display: "flex",
    alignItems: "flex-end",
    gap: 16,
    flexWrap: "wrap"
};
const labelStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: 11,
    color: "#8a8a8a"
};
const selectStyle = {
    background: "#0a0806",
    color: "#e5e5e5",
    border: "1px solid rgba(212,168,67,0.3)",
    borderRadius: 4,
    padding: "6px 10px",
    fontSize: 13,
    minWidth: 200,
    fontFamily: "inherit"
};
const bgBtnStyle = {
    background: "rgba(212,168,67,0.12)",
    color: "#D4A843",
    border: "1px solid rgba(212,168,67,0.4)",
    borderRadius: 4,
    padding: "6px 14px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 500
};
const dirInputStyle = {
    background: "#0a0806",
    color: "#e5e5e5",
    border: "1px solid rgba(212,168,67,0.3)",
    borderRadius: 4,
    padding: "6px 8px",
    fontSize: 12,
    width: 180,
    fontFamily: "ui-monospace, monospace"
};
const dirBtnStyle = {
    background: "rgba(212,168,67,0.12)",
    color: "#D4A843",
    border: "1px solid rgba(212,168,67,0.4)",
    borderRadius: 4,
    padding: "6px 10px",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit"
};
const gridStyle = {
    display: "grid",
    gridTemplateColumns: "240px 1fr 280px",
    gap: 12,
    flex: 1,
    minHeight: 0,
    maxHeight: "calc(100vh - 220px)",
    overflow: "hidden"
};
const canvasWrapStyle = {
    display: "flex",
    alignItems: "flex-start",
    overflow: "auto",
    minHeight: 0
};
const leftColStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    overflow: "auto",
    minHeight: 0,
    maxHeight: "calc(100vh - 220px)"
};
const rightColStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    overflow: "auto",
    maxHeight: "calc(100vh - 220px)"
};
const infoStyle = {
    marginLeft: "auto",
    fontSize: 11,
    color: "#5a5a5a",
    fontFamily: "ui-monospace, monospace"
};
const footerStyle = {
    fontSize: 11,
    color: "#5a5a5a",
    textAlign: "center",
    marginTop: 8
};
const kbdStyle = {
    display: "inline-block",
    padding: "1px 6px",
    margin: "0 2px",
    background: "rgba(212,168,67,0.08)",
    border: "1px solid rgba(212,168,67,0.3)",
    borderRadius: 3,
    fontSize: 10,
    fontFamily: "ui-monospace, monospace",
    color: "#D4A843"
};
const modalOverlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999
};
const modalBoxStyle = {
    background: "linear-gradient(135deg, #1a1410 0%, #0e0c09 100%)",
    border: "1.5px solid rgba(212,168,67,0.4)",
    borderRadius: 12,
    padding: "28px 32px",
    maxWidth: 420,
    width: "90%",
    boxShadow: "0 0 40px rgba(212,168,67,0.1), 0 8px 32px rgba(0,0,0,0.6)"
};
const modalBtnSecondaryStyle = {
    padding: "8px 18px",
    background: "rgba(212,168,67,0.08)",
    border: "1px solid rgba(212,168,67,0.3)",
    borderRadius: 6,
    color: "#D4A843",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit"
};
const modalBtnDangerStyle = {
    padding: "8px 18px",
    background: "rgba(255,68,68,0.15)",
    border: "1px solid rgba(255,68,68,0.4)",
    borderRadius: 6,
    color: "#FF4444",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit"
};
var _c;
__turbopack_context__.k.register(_c, "EditorClient");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor/EditorClient.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/components/editor/EditorClient.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=_a3308068._.js.map