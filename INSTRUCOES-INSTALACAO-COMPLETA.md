# Instalacao Completa — Blackout Layout Editor

Este ZIP contem **TUDO** das 12 entregas (E1 a E12) consolidado num pacote
unico. Voce instala 1 vez so e tem o editor inteiro funcionando.

---

## Setup em 5 minutos

### 1. Extrai o ZIP

```bash
cd ~/Downloads
unzip BLACKOUT-LAYOUT-EDITOR-COMPLETO.zip
cd BLACKOUT-LAYOUT-EDITOR-COMPLETO
```

### 2. Copia tudo pro seu projeto

Da raiz do BC casino:

```bash
# A partir da raiz do projeto bc_casino (onde tem o package.json)
cp -r /caminho/pra/BLACKOUT-LAYOUT-EDITOR-COMPLETO/app/editor ./app/
cp -r /caminho/pra/BLACKOUT-LAYOUT-EDITOR-COMPLETO/app/api/editor ./app/api/
cp -r /caminho/pra/BLACKOUT-LAYOUT-EDITOR-COMPLETO/components/editor ./components/
cp -r /caminho/pra/BLACKOUT-LAYOUT-EDITOR-COMPLETO/components/games/slots-migrated ./components/games/
cp /caminho/pra/BLACKOUT-LAYOUT-EDITOR-COMPLETO/editor.config.ts .
cp -r /caminho/pra/BLACKOUT-LAYOUT-EDITOR-COMPLETO/scripts/check-editor-portability.sh ./scripts/
mkdir -p public/layouts/.backup
cp /caminho/pra/BLACKOUT-LAYOUT-EDITOR-COMPLETO/public/layouts/slots-classic.json ./public/layouts/
chmod +x scripts/check-editor-portability.sh
```

Ou se preferir copiar a estrutura inteira:

```bash
# Sobrescreve / cria todos os caminhos de uma vez
cp -r BLACKOUT-LAYOUT-EDITOR-COMPLETO/. /caminho/pra/bc_casino/
chmod +x /caminho/pra/bc_casino/scripts/check-editor-portability.sh
```

### 3. Instala as 7 dependencias novas

```bash
cd /caminho/pra/bc_casino
npm i konva@^9.3.16 react-konva@^19.2.3 use-image@^1.1.1 \
      react-konva-utils@^2.0.0 zustand@^5.0.2 zundo@^2.3.0 zod@^3.0.0
```

`framer-motion` ja esta no projeto (^11.18.0). `zod` provavelmente tambem.

### 4. Valida portabilidade

```bash
bash scripts/check-editor-portability.sh
```

Deve aparecer:
```
OK: editor portavel — zero deps do casino encontradas
```

Se aparecer ERRO, voce esta com algum import errado — me avisa que corrigimos.

### 5. Sobe o dev e abre

```bash
npm run dev
```

Abre no browser:

- `http://localhost:3000/editor` — o editor

---

## Primeiro uso

1. Vai aparecer um header dourado "Blackout Layout Editor" + badge DEV MODE
2. Layout 3 colunas: cenas+elementos | canvas | propriedades
3. Toolbar superior com 8 grupos de botoes
4. Dropdown "Jogo" com 6 jogos pre-cadastrados (Slot Classic, Bicho, Roleta,
   Blackjack, Poker, Plinko)
5. Pressiona `?` no teclado pra abrir o modal de Ajuda com 4 abas

---

## Roteiro de teste rapido (10 min)

### Teste 1 — Adicionar elementos

1. Click "+ Rect" no painel esquerdo → retangulo dourado aparece no canvas
2. Click no retangulo → 8 alcas + alca de rotacao aparecem
3. Arrasta pra mover, alcas pra redimensionar, alca de cima pra rotacionar
4. Painel direito mostra X, Y, W, H atualizando em tempo real

### Teste 2 — Precisao milimetrica

1. Foca no campo X do painel direito
2. Pressiona ↑ no teclado → sobe 0.1%
3. Shift+↑ → sobe 1%
4. Ctrl+↑ → sobe 0.01% (precisao milimetrica)

### Teste 3 — Cenas

1. Click "+" no painel esquerdo (secao CENAS) → cena 2 criada
2. Double-click no nome → renomeia inline
3. Ctrl+D → duplica a cena ativa
4. Click numa cena → canvas mostra os elementos dela

### Teste 4 — Snap + Smart guides

1. Adiciona 2 retangulos
2. Arrasta um perto do outro → linha dourada aparece quando alinha
3. Pressiona Shift enquanto arrasta → snap desliga (movimento livre)

### Teste 5 — Marquee

1. Click numa area vazia do canvas e arrasta → retangulo dourado aparece
2. Solta com 2+ elementos dentro → todos selecionados

### Teste 6 — Save real (Caminho C)

1. Click "Salvar" na toolbar
2. Toast verde aparece "Salvo em components/games/..."
3. Confirma no terminal:
   ```bash
   ls components/games/slots-classic/    # deve ter SlotsClassicLayout.ts
   ls public/layouts/                     # deve ter slots-classic.json
   ls public/layouts/.backup/             # backup com timestamp
   ```
4. Abre o `SlotsClassicLayout.ts` gerado — deve ter `LAYOUT` exportado

### Teste 7 — Preview multi-resolucao

1. Click "Preview" na toolbar
2. Modal abre com 5 thumbnails simultaneos: 1920 / 1366 / 1024 / 800 / 414
3. Mesmo layout em 5 escalas — deve aparecer **identico** (so escala difere)

### Teste 8 — Modal de ajuda

1. Pressiona `?` ou click no botao Ajuda na toolbar
2. Modal abre com 4 abas: Comecando / Atalhos / Conceitos / Integracao
3. Aba "Atalhos" tem tabela com todos os 16+ atalhos
4. Aba "Integracao" carrega o documento mestre inline

### Teste 9 — Historico de sessoes

1. Edita varias coisas
2. Espera 30s — auto-save acontece silencioso
3. Ctrl+S → toast "Sessao salva no navegador"
4. Click "Historico" na toolbar → modal lista sessoes com thumbnails
5. Click "Restaurar" numa sessao → confirma → layout volta

### Teste 10 — Bug responsivo do BC resolvido

1. Adiciona alguns elementos no slot
2. Click Salvar
3. Abre o slot real do casino noutro tab
4. Redimensiona o browser de 1920px ate 414px (mobile)
5. **Layout intacto em todas as resolucoes** (era esse o bug que vc reportou)

---

## O que mudou no projeto

```
NOVOS arquivos:
├── app/editor/                    14 arquivos (~1500L)
├── app/api/editor/                3 routes (~250L)
├── components/editor/             16 arquivos (~3500L)
├── components/games/slots-migrated/  2 arquivos (~520L exemplo)
├── public/layouts/                pasta nova
├── editor.config.ts               UNICO ponto de config
├── scripts/check-editor-portability.sh
├── ESTADO-FINAL.md                resumo final
└── INTEGRACAO-LAYOUT-EDITOR-COM-JOGOS.md   doc mestre

ARQUIVOS DO PROJETO ATUAL: NAO MEXIDOS
├── components/games/slots/        intacto (vc migra depois)
├── components/games/blackjack/    intacto
├── components/games/...           intacto
└── package.json                   apenas adiciona 7 deps
```

---

## Como migrar seu primeiro jogo (slot)

Resumido — leia `INTEGRACAO-LAYOUT-EDITOR-COM-JOGOS.md` (na raiz deste ZIP)
pra detalhes completos.

### Passos

1. **Inventario:** abre `components/games/slots/SlotsGame.tsx` e identifica
   cada coordenada hardcoded (top: 330px, left: 1240px, etc).

2. **Recria visualmente:**
   - Abre `/editor`
   - Seleciona "Slot Machine Classic"
   - Adiciona elementos correspondentes (Manivela, Reel 1, Reel 2, Reel 3,
     Display Credito, Display Aposta, Display Ganho, Botao Spin)
   - Posiciona/dimensiona arrastando ate ficar identico ao slot atual
   - Cria cenas extras: "Girando" (manivela em posicao baixa, reels em
     placeholders animados) + "Vitoria" (overlay dourado + banner)

3. **Salva:** Click "Salvar" — escreve `SlotsClassicLayout.ts`

4. **Refator:** edita `SlotsGame.tsx` pra importar e usar o LAYOUT.
   Use `slots-migrated/SlotsGame-migrated.tsx` como referencia.

5. **Valida:** Click "Preview" no editor pra ver em 5 resolucoes. Tudo
   deve ficar identico.

6. **Testa no jogo real:** abre o slot no casino, redimensiona o browser.
   Sem bug responsivo.

---

## Ordem de migracao recomendada

Voce nao precisa migrar todos os 22 jogos de uma vez. Sugestao:

### Fase 1 — Resolver o bug responsivo (1 jogo)
- **slots-classic** — o jogo que vc reportou com bug. Migra primeiro.

### Fase 2 — Outros jogos ja funcionais (3 jogos)
- blackjack
- daily-free
- bicho

### Fase 3 — Jogos novos (17 restantes)
Pra cada jogo novo, comeca **direto pelo editor** (mais facil que migrar
depois). Ver "Secao B" do `INTEGRACAO-LAYOUT-EDITOR-COM-JOGOS.md`.

---

## Producao / deploy

**Importante:** o editor eh **automaticamente desabilitado** em producao.

- Em `npm run dev`: editor funciona em `/editor`, APIs respondem
- Em `npm run build && npm run start` (ou Vercel): rota `/editor` retorna
  404, APIs retornam 403

Bloqueio em 2 camadas:
1. `app/editor/page.tsx` chama `notFound()` se `NODE_ENV=production`
2. Cada API route checa `NODE_ENV` antes de qualquer operacao

Seu casino em producao fica seguro. O editor so existe no ambiente de dev.

---

## Solucao de problemas comuns

### "react-konva nao instala"

```bash
npm i react-konva@^19.2.3 konva@^9.3.16 --legacy-peer-deps
```

### "Editor abre vazio em producao"

Por design. Editor so funciona em `npm run dev`.

### "Salvei mas o jogo nao atualizou"

1. Verifica que o path em `editor.config.ts > EDITOR_TARGETS[i].layoutPath`
   bate com o que o jogo importa.
2. Olha o terminal do `npm run dev` — Fast Refresh deve ter detectado a
   mudanca.
3. Se nao, `Ctrl+R` na pagina do jogo.

### "Validador de portabilidade falha"

Voce adicionou um import de `@/components/casino`, `@/contexts/CasinoContext`,
`@/hooks/use-casino` ou `@/lib/games` em algum arquivo do editor. Remove
e usa state local em vez. O editor eh standalone.

Mais problemas: ver secao Troubleshooting do `INTEGRACAO-LAYOUT-EDITOR-COM-JOGOS.md`.

---

## Estrutura final do projeto

Apos instalar:

```
bc_casino/
├── app/
│   ├── editor/                       NOVO
│   ├── api/editor/                   NOVO (3 routes)
│   └── ... (rotas existentes)
├── components/
│   ├── editor/                       NOVO (16 arquivos)
│   ├── games/
│   │   ├── slots/                    EXISTENTE (vc migra depois)
│   │   ├── slots-migrated/           NOVO (exemplo de referencia)
│   │   ├── blackjack/                EXISTENTE
│   │   └── ...
│   └── ...
├── public/
│   └── layouts/                      NOVO (backups + .backup/)
├── scripts/
│   └── check-editor-portability.sh   NOVO
├── editor.config.ts                  NOVO
├── ESTADO-FINAL.md                   NOVO (este resumo)
├── INTEGRACAO-LAYOUT-EDITOR-COM-JOGOS.md  NOVO (doc mestre)
└── package.json                      atualizado (+7 deps)
```

---

## Estatisticas

- **12 fases entregues** (E1 a E12)
- **~8.300 linhas** de codigo total
- **~30 arquivos** novos no projeto
- **22 jogos** suportaveis (6 ja cadastrados no editor.config.ts)
- **16+ atalhos** de teclado
- **5 modais** completos (Help, History, Preview, Confirm, ModalShell)
- **3 niveis** de precisao (0.1 / 1 / 0.01%)
- **5 resolucoes** simultaneas no Preview
- **0 dependencias do casino** (editor 100% portavel)

---

## Proximos passos

1. **Testa o editor** seguindo os 10 testes acima
2. **Migra o slot** primeiro (resolve o bug responsivo)
3. **Migra os outros 3 funcionais** (blackjack, daily-free, bicho)
4. **Cria os 17 novos** ja com layout integrado desde o inicio

---

## Documentos importantes neste ZIP

- **`INSTRUCOES-INSTALACAO-COMPLETA.md`** (este arquivo) — setup
- **`ESTADO-FINAL.md`** — resumo arquitetural completo
- **`INTEGRACAO-LAYOUT-EDITOR-COM-JOGOS.md`** — guia mestre pra integrar
  jogos (cobre todos os casos especiais, troubleshooting, glossario)
- **`app/editor/README.md`** — instrucoes de portabilidade pra outro projeto

---

**Editor entregue 100%. Boa migracao!**
