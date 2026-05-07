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
 */

// ===== Posicao e geometria =====

/**
 * Vec2: ponto 2D em coordenadas % do canvas.
 * Simples: {x: 50, y: 50} = centro.
 */
export type Vec2 = { x: number; y: number };

/**
 * AnchorPoint: qual ponto do elemento corresponde a posicao (x, y).
 * Simples: pode ancorar pelo canto, centro, lado, etc.
 * Tecnico: define o origin do CSS transform.
 */
export type AnchorPoint =
  | "topLeft" | "topCenter" | "topRight"
  | "middleLeft" | "center" | "middleRight"
  | "bottomLeft" | "bottomCenter" | "bottomRight";

// ===== Elementos =====

/**
 * Tipos de elemento que o editor sabe renderizar.
 * - image: PNG/sprite
 * - rect: shape colorido
 * - text: label/binding ({{credito}})
 * - placeholder: marcador onde o jogo renderiza logica complexa
 */
export type ElementType = "image" | "rect" | "text" | "placeholder";

export interface BaseElement {
  /** UUID v4 unico do elemento */
  id: string;
  /** Tipo do elemento (discriminator union) */
  type: ElementType;
  /** Nome amigavel pro painel (ex: "Reel 1", "Display Credito") */
  name: string;
  /** Posicao X em % da baseResolution.width (0-100) */
  x: number;
  /** Posicao Y em % da baseResolution.height (0-100) */
  y: number;
  /** Largura em % */
  width: number;
  /** Altura em % */
  height: number;
  /** Rotacao em graus (0-360, suporta valores negativos) */
  rotation: number;
  /** Ordem de empilhamento (z-index visual) */
  zIndex: number;
  /** Ponto de ancora pra posicionamento */
  anchor: AnchorPoint;
  /** Se locked, nao pode ser arrastado/redimensionado no editor */
  locked: boolean;
  /** Se visible:false, nao renderiza no jogo (mas mantem no JSON) */
  visible: boolean;
  /** Opacidade 0-1 */
  opacity: number;
}

export interface ImageElement extends BaseElement {
  type: "image";
  /** Path relativo do PNG/JPG */
  src: string;
  /** Como o conteudo se ajusta na caixa */
  fit?: "contain" | "cover" | "fill" | "none";
}

export interface RectElement extends BaseElement {
  type: "rect";
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

export interface TextElement extends BaseElement {
  type: "text";
  /** Texto literal OU placeholder de binding */
  text: string;
  /** Binding em runtime, ex: "{{credito}}", "{{aposta}}", "{{ganho}}" */
  binding?: string;
  fontFamily: string;
  /** Tamanho em % da altura do canvas */
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
  fontWeight?: 400 | 500 | 600 | 700 | 900;
}

export interface PlaceholderElement extends BaseElement {
  type: "placeholder";
  /** ID semantico que o jogo reconhece (ex: "roulette-wheel", "card-area") */
  placeholderId: string;
  /** Comentario pro dev (aparece como overlay no editor) */
  description?: string;
}

export type GameElement =
  | ImageElement
  | RectElement
  | TextElement
  | PlaceholderElement;

// ===== Cenas =====

/**
 * Background da cena. Pode ser PNG estatico OU video em loop.
 *
 * EM PALAVRAS SIMPLES: o "cenario" da tela. PNG = quadro fixo.
 * Video = quadro com brilho/firulas em loop (tipo cassino real).
 *
 * TECNICAMENTE: video usa <video autoPlay loop muted playsInline>
 * com poster fallback PNG. Recomendado usar video so em cenas
 * principais (inicial) pra economizar bateria mobile.
 */
export type SceneBackground =
  | { type: "image"; src: string }
  | { type: "video"; src: string; poster?: string };

/**
 * Cena: uma tela/estado/momento de um jogo.
 *
 * EM PALAVRAS SIMPLES: cada jogo tem varias telas (inicial, girando,
 * vitoria, jackpot, modal regras, etc). Cada uma eh uma cena.
 *
 * TECNICAMENTE: agrupa elementos sob um nome semantico que mapeia
 * pra estados/phases/modals do jogo.
 */
export interface GameScene {
  /** ID unico da cena (camelCase, vai virar chave no LAYOUT exportado) */
  id: string;
  /** Nome amigavel ("Tela inicial", "Vitoria", "Modal Regras") */
  name: string;
  /** Background da cena */
  background: SceneBackground;
  /** Lista de elementos da cena */
  elements: GameElement[];
  /** Comentario do dev sobre quando esta cena aparece */
  notes?: string;
}

// ===== Layout do jogo (raiz do JSON) =====

export interface GameLayout {
  /** Versao do schema, pra migracao futura */
  version: 1;
  /** ID do jogo (deve bater com EDITOR_TARGETS[].id) */
  game: string;
  /** Resolucao base que serve de referencia pros % */
  baseResolution: { width: number; height: number };
  /** Lista de cenas. Sempre tem pelo menos 1 ("default") */
  scenes: GameScene[];
  /** Cena ativa quando o editor abre */
  defaultSceneId: string;
  metadata: {
    createdAt: string;
    updatedAt: string;
    notes?: string;
  };
}

// ===== Sessoes salvas =====

/**
 * Sessao salva (auto-save ou manual).
 * Permite voltar a um checkpoint anterior.
 */
export interface SavedSession {
  id: string;
  type: "auto" | "manual";
  /** Nome dado pelo usuario (so manuais) */
  name?: string;
  game: string;
  layout: GameLayout;
  /** Timestamp ISO */
  savedAt: string;
  /** Thumbnail base64 do canvas (preview do modal de historico) */
  thumbnail?: string;
}

// ===== Helpers de criacao =====

/** Cria um GameLayout vazio com 1 cena "default" */
export function createEmptyLayout(
  game: string,
  baseResolution: { width: number; height: number },
  defaultBackground: string
): GameLayout {
  const now = new Date().toISOString();
  return {
    version: 1,
    game,
    baseResolution,
    scenes: [
      {
        id: "default",
        name: "Tela inicial",
        background: { type: "image", src: defaultBackground },
        elements: [],
      },
    ],
    defaultSceneId: "default",
    metadata: { createdAt: now, updatedAt: now },
  };
}

/** Cria um elemento BaseElement com defaults seguros */
export function createBaseElement(overrides: Partial<BaseElement> = {}): BaseElement {
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
    ...overrides,
  };
}
