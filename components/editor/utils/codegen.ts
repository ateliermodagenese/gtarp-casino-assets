/**
 * codegen.ts
 *
 * EM PALAVRAS SIMPLES: pega o layout em JSON e gera um arquivo
 * .ts pra ser salvo em components/games/[jogo]/. O jogo importa
 * esse arquivo e usa as posicoes/tamanhos.
 *
 * TECNICAMENTE: serializa GameLayout em codigo TypeScript que
 * exporta um objeto LAYOUT com cenas como chaves e elementos como
 * objetos de estilo CSS inline (style={{}}). Caminho C oficial.
 *
 * IMPORTANTE: nunca edite o output manualmente — sera sobrescrito
 * no proximo save.
 */
import type { GameLayout, GameElement, GameScene } from "../state/schema";

/**
 * Gera o conteudo do arquivo [Jogo]Layout.ts pronto pra salvar em disco.
 */
export function generateLayoutCode(layout: GameLayout): string {
  const className = pascalCase(layout.game);
  const timestamp = new Date().toISOString();

  const scenesCode = layout.scenes.map((scene) => sceneToCode(scene)).join(",\n");

  return `/**
 * ${className}Layout.ts
 *
 * AUTO-GERADO pelo Layout Editor em ${timestamp}
 * NAO EDITE MANUALMENTE — sera sobrescrito no proximo save do editor.
 *
 * Para alterar: abra http://localhost:3000/editor, selecione
 * "${layout.game}" no dropdown, ajuste visualmente e salve.
 *
 * Coordenadas em % da resolucao base ${layout.baseResolution.width}x${layout.baseResolution.height}.
 */

export const LAYOUT = {
${scenesCode}
} as const;

export type LayoutScene = keyof typeof LAYOUT;
export type LayoutElementName<S extends LayoutScene> = keyof (typeof LAYOUT)[S]["elements"];

/** Background da cena: pode ser image (PNG) ou video (MP4 em loop) */
export type SceneBackground = (typeof LAYOUT)[LayoutScene]["background"];
`;
}

function sceneToCode(scene: GameScene): string {
  const bg = backgroundToCode(scene.background);
  const elements = scene.elements
    .slice()
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((el) => elementToCode(el))
    .join(",\n");

  return `  ${jsKey(scene.id)}: {
    name: ${JSON.stringify(scene.name)},
    background: ${bg},
    elements: {
${elements}
    },
  }`;
}

function backgroundToCode(bg: GameScene["background"]): string {
  if (bg.type === "image") {
    return `{ type: "image", src: ${JSON.stringify(bg.src)} }`;
  }
  return `{ type: "video", src: ${JSON.stringify(bg.src)}${
    bg.poster ? `, poster: ${JSON.stringify(bg.poster)}` : ""
  } }`;
}

function elementToCode(el: GameElement): string {
  const key = jsKey(safeIdentifier(el.name) || el.id.slice(0, 8));
  const style = elementStyleToCode(el);
  const meta = elementMetaToCode(el);
  return `      ${key}: { style: ${style}, meta: ${meta} }`;
}

/**
 * Gera o objeto style={{}} pra inline CSS — formato que o jogo usa.
 * Coordenadas em % funcionam com `position: "absolute"` em
 * container relativo com aspect-ratio fixo.
 */
function elementStyleToCode(el: GameElement): string {
  const parts: string[] = [];
  parts.push(`position: "absolute"`);
  parts.push(`left: "${el.x}%"`);
  parts.push(`top: "${el.y}%"`);
  parts.push(`width: "${el.width}%"`);
  parts.push(`height: "${el.height}%"`);

  if (el.rotation !== 0) {
    parts.push(`transform: "rotate(${el.rotation}deg)"`);
    parts.push(`transformOrigin: "top left"`);
  }
  if (el.opacity !== 1) parts.push(`opacity: ${el.opacity}`);
  if (el.zIndex !== 0) parts.push(`zIndex: ${el.zIndex}`);
  if (!el.visible) parts.push(`display: "none"`);

  // Ajustes por tipo
  if (el.type === "rect") {
    parts.push(`backgroundColor: ${JSON.stringify(el.fill)}`);
    if (el.stroke) {
      parts.push(`border: "${el.strokeWidth ?? 1}px solid ${el.stroke}"`);
    }
    if (el.cornerRadius) {
      parts.push(`borderRadius: "${el.cornerRadius}px"`);
    }
  } else if (el.type === "text") {
    parts.push(`color: ${JSON.stringify(el.color)}`);
    parts.push(`fontFamily: ${JSON.stringify(el.fontFamily)}`);
    parts.push(`fontSize: "${el.fontSize}cqh"`); // container query height — escala com canvas
    parts.push(`textAlign: ${JSON.stringify(el.align)}`);
    if (el.fontWeight) parts.push(`fontWeight: ${el.fontWeight}`);
    parts.push(`display: "flex"`);
    parts.push(`alignItems: "center"`);
    parts.push(`justifyContent: ${JSON.stringify(
      el.align === "left" ? "flex-start" : el.align === "right" ? "flex-end" : "center",
    )}`);
  } else if (el.type === "image") {
    if (el.fit) parts.push(`objectFit: ${JSON.stringify(el.fit)}`);
  }

  return `{ ${parts.join(", ")} }`;
}

/**
 * Metadata complementar do elemento — info que o jogo precisa
 * (text content, src, binding, placeholderId, etc) mas que nao
 * vai no style.
 */
function elementMetaToCode(el: GameElement): string {
  const obj: Record<string, unknown> = { type: el.type, name: el.name, locked: el.locked };

  if (el.type === "text") {
    obj.text = el.text;
    if (el.binding) obj.binding = el.binding;
  } else if (el.type === "image") {
    obj.src = el.src;
  } else if (el.type === "placeholder") {
    obj.placeholderId = el.placeholderId;
    if (el.description) obj.description = el.description;
  }

  return JSON.stringify(obj);
}

// ===== HELPERS =====

/** Converte "slots-classic" em "SlotsClassic" */
function pascalCase(s: string): string {
  return s
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

/** Garante que a chave do objeto JS seja valida (ou usa string com aspas) */
function jsKey(s: string): string {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(s)) return s;
  return JSON.stringify(s);
}

/** Sanitiza nome do elemento pra virar uma chave JS valida */
function safeIdentifier(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^[0-9]/, "_$&");
}
