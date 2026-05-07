# Layout Editor — README

**EM PALAVRAS SIMPLES**: ferramenta interna do projeto pra posicionar
visualmente os elementos dos jogos sobre as molduras AI. Voce arrasta,
redimensiona, rotaciona — o editor escreve um arquivo `Layout.ts` que
o jogo importa. Hot reload do Next mostra a mudanca em tempo real.

**TECNICAMENTE**: SPA Next.js client-side baseada em react-konva 19,
com persistencia em localStorage + filesystem (API route fs.writeFile).
Roda em `/editor` SOMENTE em modo `next dev`. Bloqueada em producao.

---

## Como abrir

```bash
npm run dev
# abrir http://localhost:3000/editor
```

Em producao (`next build && next start` ou Vercel) a rota retorna 404.

## Stack

- **Next 16.1.6** + **React 19.2.4** (mesma do projeto principal)
- **react-konva 19.2.x** + **konva 9.x** (canvas + drag/resize/rotate)
- **use-image** (peer do react-konva pra carregar imagens)
- **react-konva-utils** (Html, Portal — DOM dentro do canvas)
- **zustand** + **zundo** (state + undo/redo com pause/resume)
- **shadcn/ui** + **Tailwind v4** + **framer-motion** (UI base, ja no projeto)

## Portabilidade pra outro projeto

O editor eh **standalone**. Zero deps do casino. Pra portar:

1. Copia as pastas:
   ```bash
   cp -r app/editor components/editor app/api/editor <novo-projeto>/
   cp editor.config.ts <novo-projeto>/
   cp scripts/check-editor-portability.sh <novo-projeto>/scripts/
   ```
2. Instala deps no novo projeto:
   ```bash
   npm i react-konva konva use-image react-konva-utils zustand zundo
   ```
3. Edita `editor.config.ts` no novo projeto:
   - Substitui `EDITOR_TARGETS` pelos alvos do novo projeto
   - Ajusta `EDITOR_CONFIG.appName` e `primaryColor`
4. Roda o validador pra confirmar:
   ```bash
   bash scripts/check-editor-portability.sh
   ```
5. Pronto. Editor funciona em qualquer projeto Next 16+.

## Estrutura

```
app/editor/
  page.tsx              entrada (server component, bloqueia producao)
  layout.tsx            layout proprio (sem deps do casino)
  docs/
    INTEGRACAO-LAYOUT-EDITOR-COM-JOGOS.md   (entrega da F12)

app/api/editor/
  save/route.ts         POST: escreve Layout.ts + JSON backup
  load/route.ts         GET: le JSON do disco

components/editor/
  EditorRoot.tsx        composicao das colunas + canvas
  EditorStage.tsx       (F2) Stage Konva + 3 layers + ResizeObserver
  EditorElement.tsx     (F3) wrapper polimorfico de cada elemento
  EditorTransformer.tsx (F3) Transformer com bounds + snap
  panels/               (F5, F6, F7)
  state/
    schema.ts           tipos TypeScript do GameLayout/GameScene/etc
    editorStore.ts      (F4) zustand store + zundo
  utils/
    coordinates.ts      pxToPercent, percentToPx, snapToGrid
    history.ts          pause/resume zundo helpers
    keyboard.ts         atalhos (Ctrl+Z, setas, Shift, Ctrl)

editor.config.ts        UNICO ponto de configuracao
scripts/
  check-editor-portability.sh   valida zero deps do casino

public/layouts/         JSONs salvos (backup duravel)
public/layouts/.backup/ backups timestampados
```

## Regras importantes

1. **NUNCA edite manualmente** os arquivos `[Jogo]Layout.ts` em
   `components/games/[jogo]/`. So o editor mexe. Se voce editar, na
   proxima vez que salvar no editor, suas mudancas manuais somem.

2. **Editor NAO importa nada do casino**. Se voce adicionar um import
   tipo `@/components/casino/...`, o validador de portabilidade falha
   e o editor para de ser portavel.

3. **Bloqueio em producao** eh em 2 camadas: a pagina retorna 404 e a
   API route retorna 403. Ambas checam `process.env.NODE_ENV`.

4. **Hot reload do Next** detecta mudancas em `Layout.ts` automaticamente.
   Se o jogo estiver aberto numa aba, ele atualiza sozinho.

## Versao atual

**Fase 0 / 13** — Setup inicial. Hello world canvas com 1 retangulo
dourado arrastavel. Proximas fases adicionam Stage real, elementos,
painel esquerdo/direito, toolbar, atalhos, save/load, snap, multi-select,
performance, UX/A11y, documento de integracao + slot migrado, polish.
