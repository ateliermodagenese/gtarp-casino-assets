/**
 * next.config.mjs
 *
 * Condicional: EDITOR_MODE=1 desliga output:'export', habilita API routes,
 * separa pasta build (.next-editor) e adiciona rewrites pra proxy do casino.
 *
 * Casino (dev):     npm run dev          → porta 3000, output: 'export', pasta .next
 * Editor (dev):     npm run dev:editor   → porta 3001, sem export, pasta .next-editor,
 *                   rewrites /game/* e /_next/* → localhost:3000
 *
 * O proxy via rewrites resolve o problema de cross-origin:
 * iframe carrega localhost:3001/game/slots (mesma origin do editor),
 * Next.js faz proxy server-side pra localhost:3000/game/slots.
 * Resultado: iframe.contentWindow.document acessível sem SecurityError.
 */

const isEditor = process.env.EDITOR_MODE === "1";
const CASINO_PORT = process.env.CASINO_PORT || "3000";
const CASINO_ORIGIN = `http://localhost:${CASINO_PORT}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pasta de build separada por processo — impede conflito de lock/SST
  distDir: isEditor ? ".next-editor" : ".next",

  // Casino usa export estatico pro FiveM. Editor precisa de API routes dinamicas.
  ...(isEditor ? {} : { output: "export" }),

  // Permite que o editor (porta 3001) acesse assets de dev do casino (porta 3000)
  allowedDevOrigins: [
    `http://localhost:${CASINO_PORT}`,
    "http://localhost:3001",
  ],

  images: {
    unoptimized: true,
  },

  // Turbopack: alias pro canvas/konva (evita SSR crash)
  turbopack: {
    resolveAlias: {
      canvas: "./empty-module.js",
    },
  },

  // Rewrites: quando EDITOR_MODE=1, proxy rotas do jogo pro casino
  ...(isEditor
    ? {
        async rewrites() {
          return [
            // Proxy da rota /game/[id] — tela do jogo real
            {
              source: "/game/:path*",
              destination: `${CASINO_ORIGIN}/game/:path*`,
            },
            // Proxy dos assets estaticos do casino (_next/static, CSS, JS)
            {
              source: "/_next/static/:path*",
              destination: `${CASINO_ORIGIN}/_next/static/:path*`,
            },
            // Proxy da pasta public/assets (imagens dos jogos)
            {
              source: "/assets/:path*",
              destination: `${CASINO_ORIGIN}/assets/:path*`,
            },
            // Proxy do globals.css e outros recursos do app
            {
              source: "/__nextjs_original-stack-frames",
              destination: `${CASINO_ORIGIN}/__nextjs_original-stack-frames`,
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
