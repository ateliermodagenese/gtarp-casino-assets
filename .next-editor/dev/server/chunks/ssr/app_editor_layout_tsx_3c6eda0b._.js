module.exports = [
"[project]/app/editor/layout.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * app/editor/layout.tsx
 *
 * Layout proprio do editor. Nao herda nada do casino.
 *
 * EM PALAVRAS SIMPLES: a estrutura visual base do editor (titulo da
 * aba, fonte, fundo escuro). Sem header do casino, sem efeitos.
 *
 * TECNICAMENTE: nested layout do Next App Router que sobrescreve
 * elementos do layout pai pra renderizar so o editor.
 */ __turbopack_context__.s([
    "default",
    ()=>EditorLayout,
    "metadata",
    ()=>metadata
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
;
;
const metadata = {
    title: "Layout Editor — Blackout Casino",
    description: "Ferramenta interna de posicionamento visual de elementos."
};
function EditorLayout({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            minHeight: "100vh",
            background: "#0a0806",
            color: "#e5e5e5",
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/app/editor/layout.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=app_editor_layout_tsx_3c6eda0b._.js.map