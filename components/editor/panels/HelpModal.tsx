"use client";

/**
 * HelpModal.tsx
 *
 * EM PALAVRAS SIMPLES: tela de ajuda que abre com a tecla "?". Tem
 * 3 abas: tutorial pra comecar, lista de atalhos, e conceitos
 * (coordenadas %, Caminho C, etc).
 *
 * TECNICAMENTE: portal com modal overlay. Le SHORTCUTS_REFERENCE
 * pra renderizar atalhos automaticamente. Linguagem dupla em todos
 * os textos (simples + tecnico).
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SHORTCUTS_REFERENCE } from "../utils/shortcuts";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tab = "comecando" | "atalhos" | "conceitos" | "integracao";

export default function HelpModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("comecando");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <header style={headerStyle}>
          <div>
            <h2 style={titleStyle}>Ajuda do Layout Editor</h2>
            <p style={subtitleStyle}>Tudo que voce precisa saber pra usar a ferramenta</p>
          </div>
          <button onClick={onClose} style={closeBtnStyle} title="Fechar (Esc)">
            ×
          </button>
        </header>

        <nav style={tabsStyle}>
          <TabBtn active={tab === "comecando"} onClick={() => setTab("comecando")}>
            Comecando
          </TabBtn>
          <TabBtn active={tab === "atalhos"} onClick={() => setTab("atalhos")}>
            Atalhos
          </TabBtn>
          <TabBtn active={tab === "conceitos"} onClick={() => setTab("conceitos")}>
            Conceitos
          </TabBtn>
          <TabBtn active={tab === "integracao"} onClick={() => setTab("integracao")}>
            Integracao
          </TabBtn>
        </nav>

        <div style={contentStyle}>
          {tab === "comecando" && <Comecando />}
          {tab === "atalhos" && <Atalhos />}
          {tab === "conceitos" && <Conceitos />}
          {tab === "integracao" && <Integracao />}
        </div>

        <footer style={footerStyle}>Pressione Esc pra fechar · Tecla ? abre esta ajuda</footer>
      </div>
    </div>,
    document.body,
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={active ? tabActiveStyle : tabStyle}>
      {children}
    </button>
  );
}

// ===== ABA: COMECANDO =====
function Comecando() {
  return (
    <div style={proseStyle}>
      <Section title="O que eh o Layout Editor">
        <P>
          <Strong>Em palavras simples:</Strong> uma ferramenta pra voce posicionar
          visualmente os elementos dos jogos por cima das molduras AI. Em vez de chutar
          coordenadas no codigo, voce arrasta com o mouse.
        </P>
        <P>
          <Strong>Tecnicamente:</Strong> SPA Next/React com canvas Konva que escreve
          arquivos `[Jogo]Layout.ts` em `components/games/[jogo]/`. O jogo importa esse
          arquivo e usa as coordenadas em CSS inline (% do container).
        </P>
      </Section>

      <Section title="Tour rapido (5 passos)">
        <ol style={olStyle}>
          <li>
            <Strong>Escolha um jogo</Strong> no dropdown no topo. A moldura aparece no
            canvas central.
          </li>
          <li>
            <Strong>Adicione elementos</Strong> com os botoes "+ Rect/Text/Image/Placeholder"
            no painel esquerdo.
          </li>
          <li>
            <Strong>Arraste, redimensione e rotacione</Strong> usando as alcas que aparecem
            quando voce seleciona.
          </li>
          <li>
            <Strong>Ajuste fino</Strong> no painel direito: setas com 3 niveis de precisao
            (0.1 / 1 / 0.01 com Shift e Ctrl).
          </li>
          <li>
            <Strong>Salvar</Strong> com o botao Salvar (escreve em disco) ou Ctrl+S
            (sessao no navegador).
          </li>
        </ol>
      </Section>

      <Section title="Cenas: multiplas telas por jogo">
        <P>
          Cada jogo pode ter varias cenas: tela inicial, vitoria, derrota, modal de regras,
          jackpot, etc. No painel esquerdo, click em "+ Nova cena" pra criar. Ctrl+D
          duplica a cena atual (util pra fazer variantes).
        </P>
        <P>
          Cada cena tem sua propria moldura (PNG ou video em loop) e seus proprios
          elementos. Quando voce salva, o `[Jogo]Layout.ts` exporta todas as cenas como
          chaves de um objeto.
        </P>
      </Section>
    </div>
  );
}

// ===== ABA: ATALHOS =====
function Atalhos() {
  return (
    <div style={proseStyle}>
      {SHORTCUTS_REFERENCE.map((cat) => (
        <div key={cat.category} style={shortcutCategoryStyle}>
          <h3 style={shortcutHeadStyle}>{cat.category}</h3>
          <table style={tableStyle}>
            <tbody>
              {cat.items.map((it) => (
                <tr key={it.keys}>
                  <td style={kbdCellStyle}>
                    {it.keys.split(/\s*\+\s*/).map((k, i, arr) => (
                      <span key={i}>
                        <Kbd>{k}</Kbd>
                        {i < arr.length - 1 && " + "}
                      </span>
                    ))}
                  </td>
                  <td style={actionCellStyle}>{it.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ===== ABA: CONCEITOS =====
function Conceitos() {
  return (
    <div style={proseStyle}>
      <Section title="Coordenadas em percentual">
        <P>
          <Strong>Em palavras simples:</Strong> a posicao do elemento eh medida em
          "porcentagem do canvas inteiro", nao em pixels fixos. X=50%/Y=50% significa
          centro.
        </P>
        <P>
          <Strong>Tecnicamente:</Strong> usamos % do container pai (que tem aspect-ratio
          fixo 16:9) em vez de px absoluto. Isso garante que o jogo fica identico em
          1920x1080, 1366x768, 1024x768, mobile — so muda o tamanho.
        </P>
        <P>
          <Strong>Por que importa:</Strong> resolve o bug responsivo (slot machine que
          fica desalinhado em telas menores). Cada 1% = aproximadamente 19px em 1920p.
        </P>
      </Section>

      <Section title="Caminho C — como o jogo usa o layout">
        <P>
          <Strong>Em palavras simples:</Strong> o editor escreve um arquivo `.ts` que o
          jogo importa. Quando voce salva, o jogo atualiza sozinho via hot reload do Next.
        </P>
        <P>
          <Strong>Tecnicamente:</Strong> o editor gera `components/games/[jogo]/[Jogo]Layout.ts`
          com um objeto LAYOUT exportado. O jogo faz `import {`{`} LAYOUT {`}`} from
          "./SlotsClassicLayout"` e usa `style={`{`}LAYOUT.default.elements.reel_1.style{`}`}`
          em cada elemento. O arquivo eh estatico ("burro") — nao tem logica.
        </P>
        <P>
          <Strong>Regra absoluta:</Strong> NUNCA edite o `.ts` gerado manualmente. Sempre
          use o editor. Edicao manual sera sobrescrita no proximo save.
        </P>
      </Section>

      <Section title="Cenas: variantes do mesmo jogo">
        <P>
          <Strong>Em palavras simples:</Strong> jogo tem varias telas (inicial, girando,
          vitoria, etc). Cada uma eh uma cena. Voce edita uma por vez e o jogo escolhe
          qual mostrar baseado na fase do jogo.
        </P>
        <P>
          <Strong>Tecnicamente:</Strong> `LAYOUT.default`, `LAYOUT.vitoria`,
          `LAYOUT.modalRegras` etc. No jogo:
          {" "}<code>const cena = phase === "WIN" ? LAYOUT.vitoria : LAYOUT.default</code>
        </P>
      </Section>

      <Section title="Background pode ser video">
        <P>
          <Strong>Em palavras simples:</Strong> alem de PNG estatico, voce pode usar um
          MP4 em loop (firulas, brilho, particulas). Da impressao de cassino real.
        </P>
        <P>
          <Strong>Tecnicamente:</Strong> renderiza{" "}
          <code>{`<video autoPlay loop muted playsInline poster={png} />`}</code>. PNG
          fallback eh obrigatorio (usado durante carregamento). Recomendado so na cena
          inicial pra economizar bateria mobile.
        </P>
      </Section>

      <Section title="Snap to grid + Smart guides">
        <P>
          <Strong>Em palavras simples:</Strong> quando voce arrasta perto de outro
          elemento, ele "gruda" no alinhamento. Linhas douradas mostram. Shift desliga.
        </P>
        <P>
          <Strong>Tecnicamente:</Strong> dragBoundFunc do Konva calcula bounding box vs
          siblings, retorna posicao corrigida com tolerance de 0.5%. Detecta 6 ancoras
          por axis (left/center/right e top/middle/bottom).
        </P>
      </Section>
    </div>
  );
}

// ===== ABA: INTEGRACAO =====
function Integracao() {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/editor/docs?file=INTEGRACAO-LAYOUT-EDITOR-COM-JOGOS.md")
      .then(async (r) => {
        if (!r.ok) throw new Error(`Status ${r.status}`);
        const text = await r.text();
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }, []);

  return (
    <div style={proseStyle}>
      <Section title="Documento mestre">
        <P>
          <Strong>Em palavras simples:</Strong> documento completo com tudo que voce
          precisa saber pra integrar jogos com o editor — migracao de existentes,
          criacao de novos, casos especiais, troubleshooting.
        </P>
        <P>
          <Strong>Tecnicamente:</Strong> arquivo{" "}
          <code style={codeStyle}>app/editor/docs/INTEGRACAO-LAYOUT-EDITOR-COM-JOGOS.md</code>
          {" "}servido via API route. Suporta ate IA nova em sessao limpa — basta
          ler este documento pra ter todo o contexto.
        </P>
      </Section>

      {loading && <p style={{ color: "#8a8a8a", fontSize: 12 }}>Carregando documento...</p>}

      {error && (
        <Section title="Erro ao carregar">
          <P>
            <Strong>Erro:</Strong> {error}
          </P>
          <P>
            Voce pode abrir o arquivo direto em{" "}
            <code style={codeStyle}>app/editor/docs/INTEGRACAO-LAYOUT-EDITOR-COM-JOGOS.md</code>
          </P>
        </Section>
      )}

      {content && (
        <pre style={mdContentStyle}>{content}</pre>
      )}
    </div>
  );
}
// ===== HELPERS DE LAYOUT =====
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={sectionStyle}>
      <h3 style={sectionHeadStyle}>{title}</h3>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={pStyle}>{children}</p>;
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: "#D4A843" }}>{children}</strong>;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd style={kbdInlineStyle}>{children}</kbd>;
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.75)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9500,
  backdropFilter: "blur(6px)",
};

const modalStyle: React.CSSProperties = {
  background: "#0a0806",
  border: "1px solid rgba(212,168,67,0.3)",
  borderRadius: 10,
  width: 800,
  maxWidth: "92vw",
  maxHeight: "88vh",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 10px 60px rgba(0,0,0,0.7)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "20px 24px 12px 24px",
  borderBottom: "1px solid rgba(212,168,67,0.1)",
};

const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: "#D4A843", margin: 0 };
const subtitleStyle: React.CSSProperties = { fontSize: 12, color: "#8a8a8a", margin: "4px 0 0 0" };

const closeBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#8a8a8a",
  fontSize: 22,
  cursor: "pointer",
  padding: 4,
  lineHeight: 1,
};

const tabsStyle: React.CSSProperties = {
  display: "flex",
  gap: 4,
  padding: "12px 24px 0 24px",
  borderBottom: "1px solid rgba(212,168,67,0.1)",
};

const tabStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  borderBottom: "2px solid transparent",
  padding: "10px 16px",
  fontSize: 13,
  cursor: "pointer",
  color: "#8a8a8a",
  fontFamily: "inherit",
  marginBottom: -1,
};

const tabActiveStyle: React.CSSProperties = {
  ...tabStyle,
  color: "#D4A843",
  borderBottom: "2px solid #D4A843",
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "16px 24px",
};

const proseStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const sectionHeadStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#D4A843",
  margin: 0,
  letterSpacing: 0.3,
};

const pStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#c5c5c5",
  margin: 0,
  lineHeight: 1.6,
};

const olStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#c5c5c5",
  margin: 0,
  paddingLeft: 20,
  lineHeight: 1.7,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const shortcutCategoryStyle: React.CSSProperties = {
  marginBottom: 16,
};

const shortcutHeadStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#D4A843",
  margin: "0 0 8px 0",
  letterSpacing: 1,
  textTransform: "uppercase",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const kbdCellStyle: React.CSSProperties = {
  padding: "4px 8px 4px 0",
  whiteSpace: "nowrap",
  width: 1,
  fontSize: 11,
  color: "#8a8a8a",
  verticalAlign: "top",
};

const actionCellStyle: React.CSSProperties = {
  padding: "4px 0",
  fontSize: 12,
  color: "#c5c5c5",
};

const kbdInlineStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "1px 6px",
  background: "rgba(212,168,67,0.08)",
  border: "1px solid rgba(212,168,67,0.3)",
  borderRadius: 3,
  fontSize: 10,
  fontFamily: "ui-monospace, monospace",
  color: "#D4A843",
};

const footerStyle: React.CSSProperties = {
  padding: "12px 24px",
  borderTop: "1px solid rgba(212,168,67,0.1)",
  fontSize: 11,
  color: "#5a5a5a",
  textAlign: "center",
  fontFamily: "ui-monospace, monospace",
};

const codeStyle: React.CSSProperties = {
  padding: "1px 6px",
  background: "rgba(212,168,67,0.08)",
  border: "1px solid rgba(212,168,67,0.2)",
  borderRadius: 3,
  fontSize: 11,
  fontFamily: "ui-monospace, monospace",
  color: "#D4A843",
};

const mdContentStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(212,168,67,0.1)",
  borderRadius: 6,
  padding: 16,
  fontSize: 11,
  lineHeight: 1.6,
  color: "#c5c5c5",
  fontFamily: "ui-monospace, monospace",
  whiteSpace: "pre-wrap",
  overflow: "auto",
  maxHeight: 500,
  margin: 0,
};
