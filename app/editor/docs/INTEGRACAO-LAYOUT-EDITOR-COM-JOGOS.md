# Integracao do Layout Editor com Jogos

**Documento mestre.** Cobre tudo: como o editor funciona, como integrar jogos
novos, como migrar jogos existentes, casos especiais, troubleshooting.

Linguagem dupla: cada conceito vem em **palavras simples** + **tecnicamente**.

---

## Resumo rapido (30 segundos)

**Em palavras simples:** voce abre `/editor`, escolhe um jogo, posiciona elementos
visualmente arrastando com o mouse, clica "Salvar". O editor escreve um arquivo
`.ts` em `components/games/[jogo]/[Jogo]Layout.ts` que o jogo importa e usa pra
posicionar tudo. Hot reload do Next mostra a mudanca em tempo real, sem
restartar nada.

**Tecnicamente:** o editor (em `/editor`, bloqueado em producao) le/escreve o
schema `GameLayout` definido em `components/editor/state/schema.ts`. Salva via
POST `/api/editor/save` que escreve dois arquivos: o JSON em
`public/layouts/[game].json` (backup duravel) e o TypeScript em
`components/games/[jogo]/[Jogo]Layout.ts` (auto-gerado, importado pelo jogo).
Coordenadas em % da `baseResolution` (1920x1080 default).

---

## Workflow para IA nova em sessao limpa

Se voce eh uma IA carregando este projeto pela primeira vez sem contexto, leia
**este arquivo inteiro** antes de fazer qualquer coisa relacionada a layouts.

**3 regras absolutas:**

1. **NUNCA edite manualmente** os arquivos `[Jogo]Layout.ts` em
   `components/games/[jogo]/`. So o editor escreve. Edicoes manuais sao
   sobrescritas no proximo save.
2. **NUNCA importe nada do casino** dentro de `components/editor/`,
   `app/editor/`, `app/api/editor/` ou `editor.config.ts`. O editor eh portavel
   pra outros projetos. O script `scripts/check-editor-portability.sh` valida
   isso. Quebra a portabilidade = quebra o build.
3. **SEMPRE use o editor** pra criar/editar layouts. Se a IA precisa adicionar
   um elemento novo, primeiro instrua o usuario a abrir `/editor`,
   adicionar/posicionar, salvar. Depois a IA pode editar a logica do jogo
   (`SlotsGame.tsx`, etc) que importa o `LAYOUT`.

---

## Conceitos chave

### Coordenadas em percentual

**Em palavras simples:** posicao do elemento eh em % do canvas inteiro. X=50%,
Y=50% significa centro. Tamanho tambem em %. Funciona em qualquer resolucao
porque tudo escala proporcionalmente.

**Tecnicamente:** todos os valores numericos do schema (x, y, width, height,
fontSize) sao em % da `baseResolution`. O container do jogo tem
`position: relative` + `aspectRatio: "16/9"` + `width: 100%`. Cada elemento
filho tem `position: absolute` + valores em `%`. Isso garante responsividade
nativa via CSS percentage-based positioning, sem media queries.

### Caminho C — como o jogo usa o layout

**Em palavras simples:** o editor escreve um arquivo `.ts` que tem todas as
coordenadas. O jogo importa esse arquivo e usa as coordenadas em
`style={{}}`. Quando voce salva no editor, o jogo atualiza sozinho via hot
reload.

**Tecnicamente:** o editor gera `[Jogo]Layout.ts` exportando `LAYOUT` const
com cenas como chaves de primeiro nivel. Cada cena tem `name`, `background`,
e `elements`. Cada elemento tem `style` (objeto CSS valido) e `meta`
(name, type, locked, e dados especificos do tipo: `text`/`binding` pra texts,
`src` pra images, `placeholderId` pra placeholders). O Next Fast Refresh
detecta mudancas em arquivos `.ts` automaticamente e faz hot reload sem
perda de state.

### Cenas: variantes do mesmo jogo

**Em palavras simples:** um jogo tem varias telas (inicial, girando, vitoria,
jackpot, modais). Cada uma eh uma "cena". O editor mostra todas no painel
esquerdo, voce edita uma por vez. O jogo escolhe qual mostrar baseado na
fase atual.

**Tecnicamente:** `LAYOUT` exportado eh objeto onde cada chave eh uma cena.
No jogo, escolhe-se a cena baseada em algum state local:

```tsx
const cenaAtual = phase === "WIN" ? LAYOUT.vitoria
                : phase === "SPINNING" ? LAYOUT.girando
                : LAYOUT.default;
```

Isso resolve o problema de "esqueci que tinha essa tela" — o editor mostra
TODAS na lista, mesmo as que so aparecem em condicoes raras (jackpot,
modal de pagamento, game over). Voce duplica cenas com Ctrl+D pra fazer
variantes.

---

# Secao A — Migrando jogos existentes

Use este passo-a-passo pra **converter jogos que ja existem** (com codigo
hardcoded) pra usar o sistema de layout. O exemplo eh `slots-classic`, mas
o processo eh identico pros outros (`blackjack`, `daily-free`, `bicho`).

## Passo A.1 — Antes de comecar

**Em palavras simples:** abra o jogo no codigo, identifique todas as posicoes
de elementos que estao hardcoded em CSS. Anote o que cada uma representa
(reel 1, manivela, display de credito, etc).

**Tecnicamente:** procure no `[Jogo]Game.tsx` por:
- Atributos `style={{ ... }}` com `top`, `left`, `width`, `height` em px
- Classes Tailwind com `top-`, `left-`, `w-`, `h-` em valores fixos
- Constantes tipo `const REEL_X = 320` espalhadas no codigo

Cada um desses eh um elemento que vai virar entrada no LAYOUT.

## Passo A.2 — Identificar coordenadas hardcoded

Exemplo do `SlotsGame.tsx` atual (antes da migracao):

```tsx
// ❌ ANTES — coordenadas hardcoded em px (bug responsivo)
<img
  src="/assets/games/slots/manivela.png"
  style={{
    position: "absolute",
    top: "330px",
    left: "1240px",
    width: "180px",
    height: "320px",
  }}
/>

<div
  style={{
    position: "absolute",
    top: "445px",
    left: "475px",
    width: "120px",
    height: "180px",
  }}
>
  {/* Reel 1 */}
</div>
```

**Problema:** essas coordenadas funcionam em 1920x1080. Em 1366x768 ou mobile,
fica bagunca. Eh exatamente o bug que o BC reportou ontem.

**Solucao:** converter pra %. 1240px / 1920 = 64.6% de left. 330px / 1080 =
30.5% de top. E assim por diante.

## Passo A.3 — Recriar layout no editor visualmente

1. Abra `/editor`
2. Selecione "Slot Machine Classic" no dropdown
3. A moldura PNG aparece no canvas
4. Click "+ Image" no painel esquerdo, ajuste `src` no painel direito pra
   `/assets/games/slots/manivela.png`
5. Arraste a manivela pra posicao certa visualmente
6. Renomeie pra "Manivela" pelo painel direito (campo Nome)
7. Repita pra cada elemento (3 reels, manivela, display credito, display
   aposta, display ganho, botao spin)
8. Click "Salvar" na toolbar
9. Toast verde confirma "Salvo em components/games/slots/SlotsClassicLayout.ts"

## Passo A.4 — Refatorar Game.tsx pra usar LAYOUT

Depois que `SlotsClassicLayout.ts` esta gerado, edite `SlotsGame.tsx`:

```tsx
// ✅ DEPOIS — importa LAYOUT, usa style do objeto
import { LAYOUT } from "./SlotsClassicLayout";

export default function SlotsGame() {
  const [phase, setPhase] = useState<"BETTING" | "SPINNING" | "WIN">("BETTING");

  // Escolhe a cena baseada na fase do jogo
  const cena = phase === "WIN" ? LAYOUT.vitoria
             : phase === "SPINNING" ? LAYOUT.girando
             : LAYOUT.default;

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "16/9" }}>
      {/* Background */}
      {cena.background.type === "image" ? (
        <img src={cena.background.src} style={bgStyle} alt="" />
      ) : (
        <video
          src={cena.background.src}
          poster={cena.background.poster}
          autoPlay loop muted playsInline
          style={bgStyle}
        />
      )}

      {/* Manivela */}
      <img
        src={cena.elements.manivela.meta.src}
        style={cena.elements.manivela.style}
        alt=""
        onClick={() => setPhase("SPINNING")}
      />

      {/* Reel 1 — logica de animacao continua igual, so o estilo vem do LAYOUT */}
      <div style={cena.elements.reel_1.style}>
        <Reel symbols={reel1Symbols} spinning={phase === "SPINNING"} />
      </div>

      {/* Display credito com binding runtime */}
      <div style={cena.elements.credito.style}>
        {credit.toLocaleString()}
      </div>
    </div>
  );
}

const bgStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
};
```

**O que muda na pratica:**
- Logica do jogo (animacao do reel, calcular vitoria, etc) **NAO muda**.
- Apenas as posicoes/estilos vem do LAYOUT em vez de hardcoded.
- O `<Reel>` continua sendo o mesmo componente — recebe `symbols` e `spinning`
  e cuida da animacao internamente. So o `<div>` que envolve ele tem o estilo
  vindo do LAYOUT.

## Passo A.5 — Validar visualmente em todas as resolucoes

1. Volta no editor
2. Click "Preview" na toolbar
3. Modal abre com 5 resolucoes simultaneas
4. Verifica que todas aparecem identicas (so escala diferente)
5. Se alguma resolucao quebra (algum elemento desalinhado), eh sinal de
   px hardcoded em algum lugar — volta no codigo, encontra e converte pra %

## Passo A.6 — Testar no jogo real

1. Abra o jogo (`/casino/slots/classic` ou similar)
2. Redimensione a janela do browser
3. Layout deve manter aspect-ratio e tudo proporcional
4. Sem aquele bug do slot que voce viu ontem

---

## Diff visual: antes vs depois

**ANTES (slot atual com bug):**

```
SlotsGame.tsx (1 arquivo de 800 linhas com tudo hardcoded)
└── Coordenadas em px espalhadas em todo o JSX
└── Bug responsivo em telas != 1920x1080
```

**DEPOIS (slot integrado):**

```
SlotsGame.tsx (mesmo arquivo, ~600 linhas mais limpo)
└── Importa LAYOUT
└── Usa cena.elements.X.style em vez de style hardcoded
└── Logica de animacao/state intacta

SlotsClassicLayout.ts (NOVO, auto-gerado pelo editor, ~150 linhas)
└── Objeto LAYOUT com 7 cenas
└── Cada elemento tem style + meta

public/layouts/slots-classic.json (backup duravel)
public/layouts/.backup/slots-classic-2026-05-05T17-30-00.json (versoes anteriores)
```

---

# Secao B — Criando jogos novos

Use isso pra **comecar um jogo do zero** ja com o layout integrado. Mais facil
que migrar depois.

## Passo B.1 — Cadastrar o jogo no editor.config.ts

```ts
// editor.config.ts
export const EDITOR_TARGETS: EditorTarget[] = [
  // ...jogos existentes
  {
    id: "minhas-cartas",
    name: "Minhas Cartas",
    baseResolution: { width: 1920, height: 1080 },
    backgroundCandidates: [
      "/assets/games/minhas-cartas/mesa-base.png",
    ],
    layoutPath: "components/games/minhas-cartas/MinhasCartasLayout.ts",
    category: "cassino",
  },
];
```

## Passo B.2 — Gerar a moldura AI

Crie a moldura PNG (1920x1080) usando o gerador de imagem AI que voce usa
pro projeto. Salve em `public/assets/games/minhas-cartas/mesa-base.png`.

**Dica:** se voce quer firulas/brilho/animacao, gere o PNG primeiro e depois
use Runway ML ou Kling AI pra image-to-video — exporta MP4 curto que vira o
background animado da cena inicial.

## Passo B.3 — Definir cenas no editor

1. Abra `/editor`, selecione "Minhas Cartas"
2. A cena "Tela inicial" ja existe por padrao (background = primeiro candidate)
3. Click "+ Nova cena" pra criar "Vitoria"
4. Click "+ Nova cena" pra criar "Modal Regras"
5. Renomeie cada uma pelo double-click no nome

## Passo B.4 — Adicionar elementos minimos

Pra cada cena, adicione os elementos chave:

**Cena "Tela inicial":**
- Cards do jogador (4 placeholders dinamicos)
- Cards do oponente (4 placeholders)
- Display de pontos
- Botao "Comprar carta"
- Botao "Passar vez"

**Cena "Vitoria":**
- Overlay dourado semi-transparente (rect cobrindo tudo)
- Texto grande "VITORIA"
- Botao "Continuar"

**Cena "Modal Regras":**
- Overlay escuro
- Moldura do modal (rect)
- Texto das regras (text com binding `{{regras}}` opcional)
- Botao "Fechar"

## Passo B.5 — Codar Game.tsx desde o inicio com LAYOUT

```tsx
// components/games/minhas-cartas/MinhasCartasGame.tsx
"use client";
import { useState } from "react";
import { LAYOUT } from "./MinhasCartasLayout";

type Phase = "BETTING" | "WIN" | "RULES";

export default function MinhasCartasGame() {
  const [phase, setPhase] = useState<Phase>("BETTING");

  const cena = phase === "WIN" ? LAYOUT.vitoria
             : phase === "RULES" ? LAYOUT.modalRegras
             : LAYOUT.default;

  return (
    <div style={containerStyle}>
      <img src={cena.background.src} style={bgStyle} alt="" />

      {/* Renderiza cada elemento da cena */}
      {Object.entries(cena.elements).map(([key, el]) => (
        <ElementRenderer key={key} element={el} onAction={handleAction} />
      ))}
    </div>
  );
}
```

## Passo B.6 — Adicionar logica/animacao depois

A logica do jogo (regras das cartas, calculo de pontos, IA do oponente) eh
**ortogonal** ao layout. Voce escreve essa logica normalmente e o LAYOUT
so cuida das posicoes.

---

# Secao C — 7 casos especiais

## Caso 1 — Cards dinamicas (Blackjack/Poker)

**Problema:** o numero de cards muda durante o jogo. Voce nao pode posicionar
cada card no editor (porque nao sabe quantas vao aparecer).

**Solucao:** posicione **placeholders** que delimitam a area onde as cards
vao aparecer. O jogo renderiza as cards dinamicamente dentro desse area.

**No editor:**
1. Click "+ Placeholder"
2. ID semantico: `dealer-cards-area`
3. Descricao: "Area onde aparecem as cards do dealer"
4. Posicione e dimensione visualmente

**No jogo:**
```tsx
const dealerArea = cena.elements.dealer_cards_area.style;

return (
  <>
    <div style={dealerArea}>
      {dealerCards.map((card, i) => (
        <Card
          key={card.id}
          card={card}
          style={{
            position: "absolute",
            left: `${i * 6}%`,  // overlap horizontal
            top: 0,
            width: "auto",
            height: "100%",
          }}
        />
      ))}
    </div>
  </>
);
```

## Caso 2 — Reels animados (Slot)

**Problema:** os simbolos giram dentro do reel, mas o reel em si fica fixo.

**Solucao:** o reel eh um placeholder no LAYOUT. O componente `<Reel>` cuida
da animacao internamente.

```tsx
<div style={cena.elements.reel_1.style}>
  <Reel
    symbols={['7', 'cherry', 'bar']}
    spinning={phase === "SPINNING"}
    onStop={(symbol) => handleStop(0, symbol)}
  />
</div>
```

## Caso 3 — Pinos com fisica (Plinko)

**Problema:** os pinos do plinko sao em grid triangular com simulacao fisica
da bola que cai. Posicionar 50+ pinos manualmente eh inviavel.

**Solucao:** placeholder unico que delimita a area do tabuleiro. O componente
de fisica gera os pinos programaticamente.

```tsx
<div style={cena.elements.plinko_board.style}>
  <PlinkoSimulation
    rows={12}
    onBallLand={(slot) => handleWin(slot)}
  />
</div>
```

## Caso 4 — Grids replicaveis (Bicho 28 animais)

**Problema:** o bicho tem 28 cards de animais em grid 4x7. Posicionar uma
por uma eh tedioso.

**Solucao no editor:** posicione **uma** card no canto superior esquerdo
(ex: `card_grid_anchor`). Defina largura e altura corretas.

**No jogo:** loop calcula posicoes a partir da ancora.

```tsx
const anchor = cena.elements.card_grid_anchor.style;
const COLS = 4;
const ROWS = 7;
const GAP = 1; // 1% gap

// Tira a anchor e gera 28 cards posicionadas relativamente
{ANIMALS.map((animal, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const cardWidth = parseFloat(anchor.width as string);  // "8%"
  const cardHeight = parseFloat(anchor.height as string);
  const left = parseFloat(anchor.left as string) + col * (cardWidth + GAP);
  const top = parseFloat(anchor.top as string) + row * (cardHeight + GAP);

  return (
    <AnimalCard
      key={animal.id}
      animal={animal}
      style={{
        position: "absolute",
        left: `${left}%`,
        top: `${top}%`,
        width: `${cardWidth}%`,
        height: `${cardHeight}%`,
        transform: anchor.transform, // herda inclinacao
      }}
    />
  );
})}
```

## Caso 5 — Cards inclinadas (mesa do bicho)

**Problema:** voce quer cards inclinadas em angulos ligeiramente diferentes
pra dar impressao de cartas espalhadas na mesa.

**Solucao no editor:** cada card tem propriedade `rotation` editavel no
painel direito.

1. Adicione card 1 com rotation = -3°
2. Duplica (Ctrl+D)
3. Move pra direita, ajusta rotation pra +2°
4. Continua duplicando ate ter as 28

**Ou mais rapido:** adicione 1 card, salve. No jogo, gera 28 cards
programaticamente com rotacoes aleatorias:

```tsx
const baseStyle = cena.elements.card_template.style;

{cards.map((card, i) => (
  <Card
    key={card.id}
    style={{
      ...baseStyle,
      left: `${15 + (i % 7) * 10}%`,
      top: `${20 + Math.floor(i / 7) * 18}%`,
      transform: `rotate(${(Math.random() - 0.5) * 8}deg)`,
    }}
  />
))}
```

## Caso 6 — Background em video (efeito cassino real)

**Problema:** PNG estatico fica meio sem graca. Voce quer brilho, particulas,
firulas em loop.

**Solucao:** no editor, ao selecionar a cena, troca `backgroundType` de
`"image"` pra `"video"` (no painel direito) e aponta pra um MP4. O editor
sempre exige um `poster` PNG fallback.

**No jogo:**
```tsx
{cena.background.type === "video" ? (
  <video
    src={cena.background.src}
    poster={cena.background.poster}
    autoPlay
    loop
    muted
    playsInline
    style={bgStyle}
  />
) : (
  <img src={cena.background.src} style={bgStyle} alt="" />
)}
```

**Atencao mobile:** video em loop esquenta bateria. Use video so na cena
inicial pra atrair, e PNG estatico em vitoria/jackpot/modais.

## Caso 7 — Bindings runtime ({{credito}}, {{aposta}})

**Problema:** texto de display de credito muda durante o jogo (ganha 100,
fica 1100). Voce nao pode hardcodar o numero no editor.

**Solucao:** crie um elemento texto e no campo "Binding (runtime)" no painel
direito digite `{{credito}}`. O LAYOUT exporta esse binding como string
literal.

**No jogo:**
```tsx
const display = cena.elements.display_credito;

// Substitui o binding pelo valor real
const valor = display.meta.binding?.replace("{{credito}}", String(credit));

return (
  <div style={display.style}>
    {valor}
  </div>
);
```

Ou um helper geral:

```tsx
function resolveBinding(binding: string | undefined, vars: Record<string, unknown>): string {
  if (!binding) return "";
  return binding.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ""));
}

// Uso:
const text = resolveBinding(display.meta.binding, { credito: credit, aposta: bet });
```

---

# Convencoes obrigatorias

## Naming

- **IDs de cena:** `camelCase` (`default`, `vitoria`, `modalRegras`,
  `gameOver`)
- **Names de elemento:** PT humano ("Reel 1", "Display Credito"). O codegen
  converte pra `snake_case` no Layout.ts (`reel_1`, `display_credito`).
- **placeholderId:** kebab-case com contexto (`roulette-wheel`,
  `plinko-board`, `dealer-cards-area`)

## Estrutura de pastas

Cada jogo tem sua propria pasta:

```
components/games/[jogo-id]/
├── [Jogo]Game.tsx          # Componente principal (logica)
├── [Jogo]Layout.ts         # AUTO-GERADO pelo editor (NAO EDITE)
├── components/             # Sub-componentes especificos
│   ├── Reel.tsx
│   ├── Card.tsx
│   └── ...
└── hooks/                  # Logica do jogo isolada
    ├── useGameState.ts
    └── ...
```

## Coordenadas

- **Sempre %.** Nunca px no LAYOUT.
- **baseResolution sempre 1920x1080** (ou outro padrao do projeto).
- **fontSize em `cqh`** (container query height) — escala automatico com o
  canvas. `4cqh` = 4% da altura do container.

## Cenas

- **Sempre tem cena `default`.** Eh a tela inicial do jogo.
- Cenas extra: nomes descritivos (`vitoria`, `derrota`, `jackpot`,
  `modalRegras`, `gameOver`, `bonusRound`).
- Se uma cena eh duplicada de outra (ex: `vitoriaJackpot` baseada em
  `vitoria`), use Ctrl+D no editor.

---

# Troubleshooting

## "react-konva nao instala"

```bash
npm i react-konva@^19.2.3 konva@^9.3.16 use-image@^1.1.1 react-konva-utils@^2.0.0 zustand@^5.0.2 zundo@^2.3.0
```

Se der erro de peer deps, adicione `--legacy-peer-deps`.

## "useImage error: failed to load image"

A imagem nao foi encontrada ou tem CORS bloqueado. Verifica:
1. Path comeca com `/` (relativo a `public/`)
2. Arquivo existe em `public/assets/games/[jogo]/`
3. Se for URL externa, servidor precisa retornar header CORS adequado

## "Video nao toca automaticamente"

Browsers bloqueiam autoplay sem interacao do usuario. Verifica que
o `<video>` tem TODOS estes atributos:

```tsx
<video autoPlay loop muted playsInline poster={pngFallback} />
```

`muted` eh obrigatorio. `playsInline` eh obrigatorio em iOS pra evitar
fullscreen.

## "Ctrl+Z nao funciona em input"

Esperado. O hook `useEditorShortcuts` ignora atalhos quando foco esta em
INPUT/TEXTAREA/SELECT pra nao quebrar a digitacao do usuario. Pra desfazer
mudancas em campo de texto, use o Ctrl+Z nativo do browser.

## "Salvei mas o jogo nao atualizou"

1. Verifica que o path em `editor.config.ts > EDITOR_TARGETS[i].layoutPath`
   bate com o que o jogo importa
2. Olha `public/layouts/[game].json` — se foi escrito, o save funcionou
3. Olha `components/games/[jogo]/[Jogo]Layout.ts` — deve ter sido sobrescrito
4. Se o jogo nao re-renderizou, da `Ctrl+R` na pagina do jogo

## "Layout exportado tem nome de elemento estranho"

O codegen converte `name` PT pra `snake_case` JS. "Reel 1" vira `reel_1`.
"Display Crédito" vira `display_credito`. Se ficou estranho, renomeie no
editor pelo painel direito.

## "Editor abriu vazio em producao"

Por design. O editor eh bloqueado em producao (NODE_ENV=production retorna
404). Soh roda em `npm run dev`. Em producao, o jogo le o `[Jogo]Layout.ts`
ja gerado em desenvolvimento e empacotado no build.

---

# Glossario

| Termo | Em palavras simples | Tecnicamente |
|---|---|---|
| **LAYOUT** | Objeto com todas as posicoes do jogo | `const LAYOUT = { ... } as const` exportado de `[Jogo]Layout.ts`, gerado automatico pelo editor |
| **Cena** | Uma tela/estado do jogo | Chave de primeiro nivel em LAYOUT, contem `name`, `background`, `elements` |
| **baseResolution** | Resolucao de referencia (1920x1080) | Resolucao base usada como referencia pros valores em %, definida em `editor.config.ts` |
| **Anchor** | Ponto de referencia da posicao | Onde o (x,y) do elemento se localiza no proprio elemento (topLeft, center, etc) |
| **Binding** | Texto que muda em runtime | String tipo `{{credito}}` que o jogo substitui em runtime via regex |
| **Caminho C** | Arquitetura de integracao | Editor escreve `[Jogo]Layout.ts` que o jogo importa. Layout eh estatico ("burro"). Hot reload do Next propaga mudancas |
| **Fast Refresh** | Hot reload sem perder estado | Feature do Next que detecta mudancas em `.ts/.tsx` e atualiza so os componentes afetados sem perder state local |
| **Smart guides** | Linhas que aparecem ao alinhar | Konva.Line dourada renderizada no overlay quando `dragBoundFunc` detecta proximidade com outro elemento |
| **Marquee** | Selecao por arrastar retangulo | Click+drag em area vazia do Stage que cria retangulo dourado e seleciona elementos contidos no `mouseup` |
| **Snap** | "Imanizar" elemento em alinhamento | `dragBoundFunc` retorna posicao corrigida quando dentro de tolerance (0.5%) de outro elemento |
| **Sessao** | Save salvo no navegador | Entry em `localStorage` com layout serializado + thumbnail. Auto-save (30s) ou manual (Ctrl+S) |
| **Backup** | Copia automatica antes de sobrescrever | Antes de cada save no disco, copia versao anterior pra `public/layouts/.backup/[game]-[timestamp].json` |
| **Placeholder** | Marcador onde o jogo renderiza algo | Tipo de elemento sem render proprio. Tem `placeholderId` semantico que o jogo reconhece |

---

# Como abrir esta documentacao no editor

O editor tem um modal "?" com as 3 abas (Comecando / Atalhos / Conceitos) que
cobre o essencial. Este documento eh **complementar** — mais detalhado, com
exemplos longos.

Quando precisar, abra direto no codigo: `app/editor/docs/INTEGRACAO-LAYOUT-EDITOR-COM-JOGOS.md`.

---

**Versao do documento:** 1.0 — 2026-05-05
**Editor compativel:** v0.10 (10 entregas, 83% feito)
**Ultima atualizacao:** seguir o checkpoint em `/home/claude/CHECKPOINT.md`

