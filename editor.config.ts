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
 */

export interface EditorTarget {
  /** ID do jogo (= nome da pasta dentro de gamesDir) */
  id: string;
  /** Nome amigavel (default: id capitalizado) */
  name: string;
  /** Resolucao base */
  baseResolution: { width: number; height: number };
}

/**
 * Helper: deduz layoutPath do id + gamesDir.
 * Ex: id="roulette", gamesDir="components/games"
 *  -> "components/games/roulette/RouletteLayout.ts"
 */
export function resolveLayoutPath(id: string, gamesDir: string = EDITOR_CONFIG.gamesDir): string {
  const pascal = id
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  const cleanDir = gamesDir.replace(/^\/+|\/+$/g, "");
  return `${cleanDir}/${id}/${pascal}Layout.ts`;
}

/** Helper: capitaliza id pra nome amigavel ("daily-free" -> "Daily Free") */
export function prettifyId(id: string): string {
  return id
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Helper: caminho default sugerido pra background do jogo */
export function defaultBackgroundDir(id: string): string {
  return `/assets/games/${id}/`;
}

export const EDITOR_CONFIG = {
  appName: "Layout Editor",
  primaryColor: "#D4A843",
  layoutsDir: "public/layouts",
  backupsDir: "public/layouts/.backup",
  /** Pasta default onde editor procura jogos. Editavel via UI no header. */
  gamesDir: "components/games",
  /** Pasta default sugerida no file picker de background */
  publicDir: "public",
  autoSaveIntervalMs: 30_000,
  maxAutoSaves: 20,
  gridSize: 5,
  defaultBaseResolution: { width: 1920, height: 1080 },
} as const;
