# Blackout Layout Editor — Estado Final

**Versao:** 1.0 (entrega completa, 12/12 fases)
**Data de conclusao:** 2026-05-05
**Total de codigo:** ~8.300 linhas em ~30 arquivos

---

## O que foi entregue

Editor visual de layouts pra jogos do Blackout Casino. Roda em `/editor`,
bloqueado em producao, escreve direto em disco via API. Tudo em
percentual da resolucao base — resolve responsividade nativa.

**Resolve o problema do BC:** o slot machine que ficava desalinhado em
telas != 1920x1080 agora se mantem proporcional em qualquer resolucao,
via uso obrigatorio de `%` em vez de `px`.

---

## 12 fases entregues

| # | Fase | Conteudo |
|---|------|----------|
| **E1** | Setup + tipos | Estrutura de pastas + schema TypeScript + bloqueio producao + Hello World canvas Konva |
| **E2** | Stage + moldura | Canvas 16:9 responsivo + carrega molduras PNG ou video em loop |
| **E3** | Elementos + Transformer | Drag/resize/rotate livre com 8 alcas + snap a 45° |
| **E4** | State management | zustand store + zundo (Ctrl+Z/Y) + pause durante drag |
| **E5** | Painel esquerdo | Lista de cenas (criar/duplicar/renomear/deletar) + lista de elementos (lock/visible/delete) |
| **E6** | Painel direito | Edicao de propriedades com 3 niveis de precisao (0.1 / Shift 1 / Ctrl 0.01%) |
| **E7** | Toolbar + atalhos | Toolbar com 8 grupos + 16+ atalhos teclado |
| **E8** | Save/Load | API routes + sessoes localStorage (auto-save 30s + manual) + Modal Historico com thumbnails |
| **E9** | Snap + multi-select + perf | Smart guides + marquee selection + 60fps com 50+ elementos |
| **E10** | UX/A11y | Toasts + Modal "?" 4 abas + Preview multi-resolucao (5 simultaneos) |
| **E11** | Documento mestre + Slot migrado | INTEGRACAO.md (733L) + slot exemplo refatorado |
| **E12** | Polish + ZIP unificado | Animacoes framer-motion + auditoria final + pacote completo |

---

## Stack tecnica

- **Next.js 16.1.6** + **React 19.2.4** + **Tailwind v4**
- **react-konva 19.2.x** + **konva 9.x** (canvas + drag/resize/rotate)
- **use-image** + **react-konva-utils** (peers do react-konva)
- **zustand 5** + **zundo 2** (state + undo/redo com pause/resume)
- **framer-motion 11** (animacoes de modais e toasts)
- **zod 3** (validacao no API save)

---

## Arquitetura: Caminho C

**Em palavras simples:** o editor escreve um arquivo `.ts` em
`components/games/[jogo]/[Jogo]Layout.ts`. O jogo importa esse arquivo e
usa as posicoes. Quando voce salva, o jogo atualiza sozinho via hot reload
do Next.

**Tecnicamente:** o editor (em `/editor`, bloqueado em producao) le/escreve
o schema `GameLayout` definido em `components/editor/state/schema.ts`. POST
`/api/editor/save` valida com Zod e escreve dois arquivos: o JSON em
`public/layouts/[game].json` (backup duravel) e o TypeScript em
`components/games/[jogo]/[Jogo]Layout.ts` (importado pelo jogo). Antes de
sobrescrever, faz backup com timestamp em `.backup/`.

```
EDITOR (dev only)              DISCO                          JOGO
                                                              
/editor  ──salva──>  POST /api/editor/save                    
                       │                                      
                       ├─escreve──> public/layouts/[game].json
                       │              (backup duravel)        
                       │                                      
                       ├─escreve──> components/games/[jogo]/  
                       │              [Jogo]Layout.ts ────────> import LAYOUT
                       │                                          │
                       └─copia───> public/layouts/.backup/        ▼
                                     (versoes anteriores)      <div style={LAYOUT.scene.elements.X.style}>
```

Hot reload do Next detecta mudanca em `[Jogo]Layout.ts` e re-renderiza o
jogo automaticamente, sem perder state.

---

## Estrutura de arquivos

```
projeto/
├── app/
│   ├── editor/
│   │   ├── page.tsx                    Pagina raiz (bloqueada em producao)
│   │   ├── layout.tsx                  Layout proprio sem deps do casino
│   │   ├── README.md                   Instrucoes de portabilidade
│   │   └── docs/
│   │       └── INTEGRACAO-LAYOUT-EDITOR-COM-JOGOS.md   Documento mestre (733L)
│   │
│   └── api/editor/
│       ├── save/route.ts               POST salva no disco
│       ├── load/route.ts               GET carrega JSON
│       └── docs/route.ts               GET serve .md (whitelist)
│
├── components/
│   ├── editor/                         100% portavel — zero deps do casino
│   │   ├── EditorRoot.tsx              Composicao 3 colunas + listeners
│   │   ├── EditorStage.tsx             Stage Konva 4 layers (bg + elementos + marquee + transformer)
│   │   ├── EditorElement.tsx           Wrapper polimorfico (image/rect/text/placeholder) com memo
│   │   ├── EditorTransformer.tsx       8 alcas + snap a 45°
│   │   ├── BackgroundLayer.tsx         PNG ou video em loop
│   │   ├── MarqueeOverlay.tsx          Retangulo de selecao + smart guides
│   │   ├── Toolbar.tsx                 8 grupos: undo/save/select/edit/lock/zindex/align/help
│   │   ├── state/
│   │   │   ├── schema.ts               Tipos TypeScript do GameLayout
│   │   │   └── editorStore.ts          zustand + zundo (state + undo/redo)
│   │   ├── utils/
│   │   │   ├── coordinates.ts          px ↔ % helpers
│   │   │   ├── history.ts              Hooks Ctrl+Z/Y + drag gate
│   │   │   ├── shortcuts.ts            16+ atalhos unificados
│   │   │   ├── snap.ts                 Smart guides + snap math
│   │   │   ├── marquee.ts              Marquee selection logic
│   │   │   ├── codegen.ts              Gera [Jogo]Layout.ts a partir do JSON
│   │   │   └── sessions.ts             localStorage manager + auto-save
│   │   └── panels/
│   │       ├── PanelLeft.tsx           Cenas + Elementos
│   │       ├── PanelRight.tsx          Propriedades (3 niveis precisao)
│   │       ├── ScenesList.tsx          Lista cenas
│   │       ├── SceneRow.tsx            Linha de cena com hover actions
│   │       ├── ElementsList.tsx        Lista elementos
│   │       ├── ElementRow.tsx          Linha de elemento (lock/visible/delete)
│   │       ├── PropertyGroup.tsx       Section colapsavel
│   │       ├── PrecisionInput.tsx      Input numerico com 3 niveis
│   │       ├── ConfirmModal.tsx        Modal de confirmacao
│   │       ├── ModalShell.tsx          Wrapper com fade-in framer-motion
│   │       ├── HistoryModal.tsx        Modal de sessoes salvas
│   │       ├── HelpModal.tsx           Modal "?" 4 abas (Comecando/Atalhos/Conceitos/Integracao)
│   │       ├── PreviewModal.tsx        5 thumbnails simultaneos
│   │       └── ToastContainer.tsx      Fila de toasts com slide-in
│   │
│   └── games/
│       └── slots-migrated/             Exemplo real (E11)
│           ├── SlotsClassicLayout.ts   Output simulado do codegen
│           └── SlotsGame-migrated.tsx  Refator do slot usando LAYOUT
│
├── editor.config.ts                    UNICO ponto de configuracao + 6 jogos cadastrados
├── scripts/
│   └── check-editor-portability.sh     Validador automatico de portabilidade
└── public/
    └── layouts/
        ├── slots-classic.json          Exemplo de JSON salvo
        └── .backup/                    Versoes anteriores com timestamp
```

---

## Comandos importantes

```bash
# Desenvolvimento
npm run dev
# Acesse http://localhost:3000/editor

# Validar portabilidade (deve dar OK)
bash scripts/check-editor-portability.sh

# Producao (editor automaticamente desabilitado)
npm run build && npm run start
```

---

## Atalhos do editor (16+)

| Categoria | Tecla | Acao |
|---|---|---|
| Selecao | Click | Selecionar |
|  | Shift+Click | Multi-select toggle |
|  | Ctrl+A | Selecionar tudo |
|  | Esc | Limpar selecao |
| Edicao | Delete/Backspace | Apagar |
|  | Ctrl+D | Duplicar |
|  | Ctrl+Z | Desfazer |
|  | Ctrl+Y | Refazer |
| Movimento | Setas | ±0.1% |
|  | Shift+Setas | ±1% |
|  | Ctrl+Setas | ±0.01% (milimetrico) |
| Z-Index | Ctrl+] | Pra frente |
|  | Ctrl+[ | Pra tras |
|  | Ctrl+Shift+] | Topo absoluto |
|  | Ctrl+Shift+[ | Base absoluta |
| Visibilidade | L | Toggle lock |
|  | H | Toggle visible |
| Save | Ctrl+S | Sessao no navegador |
|  | Ctrl+Shift+S | Sessao com nome |
| Ajuda | ? | Abre modal Help |

---

## Decisoes registradas (nao mudar sem revisar)

1. **react-konva 19, nao react-moveable** (compat React 19)
2. **Coordenadas em %**, nunca px
3. **baseResolution 1920x1080** padrao
4. **Schema versionado** (`version: 1`) pra migracao futura
5. **Editor SO em dev** (NODE_ENV check, 2 camadas)
6. **JSON em /public/layouts** como backup duravel
7. **Backup automatico** antes de cada save
8. **zustand + zundo** pra state e undo/redo
9. **3 layers Konva** (bg listening:false / elementos / ui)
10. **Single-page editor**, sem multi-tab
11. **Bindings via {{}}** pra dados runtime
12. **Editor 100% portavel** (script grep valida)
13. **Caminho C oficial** — editor regrava `[Jogo]Layout.ts`, jogo importa
14. **Default style inline** (1697L vs 353L Tailwind no projeto, 5:1)
15. **Painel direito 3 niveis precisao** (0.1 / Shift 1 / Ctrl 0.01)
16. **Rotacao livre nativa** (Konva.Transformer)
17. **Verificador responsivo integrado** (preview 5 resolucoes)
18. **Documento auto-suficiente** pra IA nova em sessao limpa
19. **Linguagem dupla obrigatoria** (simples + tecnica) em TODOS os documentos
20. **Modal "?" le os .md internos** via API
21. **NUNCA editar [Jogo]Layout.ts manualmente** (regra absoluta)
22. **Cenas/Frames por jogo** (multiplas telas em 1 layout)
23. **Background pode ser video** em loop (autoPlay/loop/muted/playsInline + poster fallback)
24. **Cenas duplicaveis** com Ctrl+D
25. **NUNCA setState em onDragMove** (Karaki pattern, 60fps)
26. **fontSize em cqh** (container query height) — escala automatico

---

## Workflow tipico

### Migrar jogo existente

1. `npm run dev` → abre `/editor`
2. Selecione jogo no dropdown
3. Adicione elementos (botoes "+ Rect/Text/Image/Placeholder")
4. Posicione/redimensione/rotacione visualmente
5. Ajuste fino com painel direito (precisao milimetrica)
6. Crie cenas extras (vitoria, modal, etc)
7. Click "Salvar" → escreve `[Jogo]Layout.ts` em disco
8. Refatore `[Jogo]Game.tsx` pra importar e usar `LAYOUT`
9. Validar com botao "Preview" (5 resolucoes simultaneas)

### Criar jogo novo

1. Cadastre o jogo em `editor.config.ts > EDITOR_TARGETS`
2. Coloque a moldura PNG em `public/assets/games/[jogo]/`
3. Abre editor → seleciona o novo jogo
4. Cria cenas e elementos visualmente
5. Salva
6. Cria `[Jogo]Game.tsx` ja usando `LAYOUT`

Ver `INTEGRACAO-LAYOUT-EDITOR-COM-JOGOS.md` na raiz do ZIP pra detalhes.

---

## Como portar pra outro projeto

Editor eh **standalone**. Zero deps do casino. Pra portar:

```bash
# 1. Copia as pastas/arquivos
cp -r components/editor app/editor app/api/editor editor.config.ts <novo-projeto>/
cp scripts/check-editor-portability.sh <novo-projeto>/scripts/

# 2. Instala deps no novo projeto
cd <novo-projeto>
npm i react-konva@^19.2.3 konva@^9.3.16 use-image@^1.1.1 \
      react-konva-utils@^2.0.0 zustand@^5.0.2 zundo@^2.3.0 \
      framer-motion@^11.0.0 zod@^3.0.0

# 3. Edita editor.config.ts pra refletir os jogos do novo projeto

# 4. Valida portabilidade
bash scripts/check-editor-portability.sh
# Deve dar: "OK: editor portavel — zero deps do casino encontradas"
```

---

## Problemas conhecidos / nao implementados

- **Distribute spacing** (espacamento igual entre 3+ elementos): nao
  implementado. Pode ser adicionado depois com 1 action no store +
  botao na toolbar.
- **Drag-reorder de elementos no painel esquerdo**: removido em E5,
  pode voltar com `@dnd-kit` em iteracao futura.
- **Tour guiado primeira vez**: substituido pelo modal "?" com aba
  "Comecando" que cobre os 5 passos. Tour seria nice-to-have.
- **Snap considera bbox simples**: rotacao ignorada no calculo de
  smart guides. Em pratica funciona bem porque a maioria dos
  elementos nao roda.

---

## Tamanho do codigo

```
~8.300 linhas total
├── ~2.100 linhas: editor core (state, utils, components)
├── ~2.000 linhas: paineis e modais
├── ~1.000 linhas: API routes + codegen + sessoes
├── ~700 linhas:   documento mestre (.md)
├── ~500 linhas:   exemplos (slots-migrated)
└── ~2.000 linhas: configs, helpers, README, INSTRUCOES
```

---

## Creditos / referencias

Pesquisa X0 com 79 referencias, 10 rounds, em
`/mnt/user-data/outputs/PESQUISA-X0-BLACKOUT-LAYOUT-EDITOR-2026-05-05.md`.

Roteiro detalhado em
`/mnt/user-data/outputs/ROTEIRO-LAYOUT-EDITOR-2026-05-05.md`.

Patterns de Konva inspirados no estudo de caso da Karaki (referencia 22 da pesquisa).

---

**FIM. Projeto entregue 100%.**
