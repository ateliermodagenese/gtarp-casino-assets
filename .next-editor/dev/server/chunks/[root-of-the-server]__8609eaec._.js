module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/fs/promises [external] (fs/promises, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs/promises", () => require("fs/promises"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/editor.config.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/app/api/editor/games/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
/**
 * app/api/editor/games/route.ts
 *
 * GET ?dir=components/games
 * Escaneia a pasta passada (ou EDITOR_CONFIG.gamesDir por default)
 * e retorna lista de subpastas.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs/promises [external] (fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$editor$2e$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/editor.config.ts [app-route] (ecmascript)");
;
;
;
;
async function GET(request) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const { searchParams } = new URL(request.url);
    let dir = searchParams.get("dir") || __TURBOPACK__imported__module__$5b$project$5d2f$editor$2e$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EDITOR_CONFIG"].gamesDir;
    // Sanitiza
    dir = dir.replace(/\.\./g, "").replace(/\/+/g, "/").replace(/^\/+|\/+$/g, "");
    if (!dir) dir = __TURBOPACK__imported__module__$5b$project$5d2f$editor$2e$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EDITOR_CONFIG"].gamesDir;
    const projectRoot = process.cwd();
    const fullDir = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(projectRoot, dir);
    if (!fullDir.startsWith(projectRoot)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Forbidden"
        }, {
            status: 403
        });
    }
    try {
        const entries = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["readdir"])(fullDir);
        const games = [];
        for (const entry of entries){
            if (entry.startsWith(".") || entry.startsWith("_") || entry === "node_modules") continue;
            const full = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(fullDir, entry);
            try {
                const s = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["stat"])(full);
                if (s.isDirectory()) {
                    games.push({
                        id: entry,
                        name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$editor$2e$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prettifyId"])(entry)
                    });
                }
            } catch  {
            // ignora
            }
        }
        games.sort((a, b)=>a.id.localeCompare(b.id));
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true,
            dir,
            games
        });
    } catch (err) {
        const e = err;
        if (e.code === "ENOENT") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: true,
                dir,
                games: [],
                notFound: true
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to scan games dir",
            message: e.message
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__8609eaec._.js.map