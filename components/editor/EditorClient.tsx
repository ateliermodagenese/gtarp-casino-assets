"use client";

/**
 * EditorRoot.tsx
 *
 * EM PALAVRAS SIMPLES: tela principal. Layout 3 colunas: painel
 * esquerdo (cenas + elementos), canvas central, painel direito
 * (propriedades). Toolbar superior com botoes rapidos.
 *
 * TECNICAMENTE: client component que orquestra Toolbar + PanelLeft
 * + EditorStage + PanelRight. Estado via useEditorStore. Atalhos
 * globais via useEditorShortcuts (16+ atalhos unificados).
 */
import { useEffect, useState } from "react";
import IframeEditor from "./IframeEditor";
import type { DomElementInfo } from "./IframeEditor";
import Toolbar from "./Toolbar";
import DomPropsPanel from "./panels/DomPropsPanel";
import FilePanel from "./panels/FilePanel";
import DomTreePanel from "./panels/DomTreePanel";
import ImageUploadPanel from "./panels/ImageUploadPanel";
import HoverEditorPanel from "./panels/HoverEditorPanel";
import VideoBackgroundPanel from "./panels/VideoBackgroundPanel";
import CssToolsPanel from "./panels/CssToolsPanel";
import SavePanel from "./panels/SavePanel";
import HistoryModal from "./panels/HistoryModal";
import HelpModal from "./panels/HelpModal";
import ToastContainer from "./panels/ToastContainer";
import {
  EDITOR_CONFIG,
  type EditorTarget,
} from "@/editor.config";
import { useEditorStore } from "./state/editorStore";

export default function EditorClient() {
  const targetId = useEditorStore((s) => s.targetId);
  const layout = useEditorStore((s) => s.layout);
  const currentSceneId = useEditorStore((s) => s.currentSceneId);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const setTarget = useEditorStore((s) => s.setTarget);

  // Arquivo ativo (componente individual) — "" = tela principal
  const [activeFile, setActiveFile] = useState("");
  // Elemento DOM selecionado no iframe
  const [selectedElement, setSelectedElement] = useState<DomElementInfo | null>(null);

  // Refs do iframe expostos pelo IframeEditor (pra DomTreePanel)
  const [iframeRefState, setIframeRefState] = useState<React.RefObject<HTMLIFrameElement | null> | null>(null);
  const [iframeLoadedState, setIframeLoadedState] = useState(false);

  // Lista de jogos descoberta via API (escaneamento de gamesDir)
  const [games, setGames] = useState<EditorTarget[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [gamesNotFound, setGamesNotFound] = useState(false);

  // Pasta de jogos (editavel + persiste em localStorage)
  const [gamesDir, setGamesDir] = useState<string>(EDITOR_CONFIG.gamesDir);
  const [gamesDirInput, setGamesDirInput] = useState<string>(EDITOR_CONFIG.gamesDir);

  // Carrega gamesDir do localStorage na montagem
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("editor:gamesDir");
    if (saved) {
      setGamesDir(saved);
      setGamesDirInput(saved);
    }
  }, []);

  // Recarrega lista quando gamesDir muda
  useEffect(() => {
    setGamesLoading(true);
    setGamesNotFound(false);
    fetch(`/api/editor/games?dir=${encodeURIComponent(gamesDir)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.games)) {
          const targets: EditorTarget[] = data.games.map((g: { id: string; name: string }) => ({
            id: g.id,
            name: g.name,
            baseResolution: EDITOR_CONFIG.defaultBaseResolution,
          }));
          setGames(targets);
          setGamesNotFound(Boolean(data.notFound));
        }
        setGamesLoading(false);
      })
      .catch(() => setGamesLoading(false));
  }, [gamesDir]);

  const applyGamesDir = () => {
    const clean = gamesDirInput.trim().replace(/^\/+|\/+$/g, "");
    if (!clean) return;
    setGamesDir(clean);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("editor:gamesDir", clean);
    }
  };

  // Modal historico
  const [historyOpen, setHistoryOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  useEffect(() => {
    const onHist = () => setHistoryOpen(true);
    const onHelp = () => setHelpOpen(true);
    const onPrev = () => setPreviewOpen(true);
    window.addEventListener("editor:open-history", onHist);
    window.addEventListener("editor:open-help", onHelp);
    window.addEventListener("editor:open-preview", onPrev);
    return () => {
      window.removeEventListener("editor:open-history", onHist);
      window.removeEventListener("editor:open-help", onHelp);
      window.removeEventListener("editor:open-preview", onPrev);
    };
  }, []);

  // Atalho Ctrl+S = prevenir save padrao do browser, emitir toast
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;

      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        window.dispatchEvent(
          new CustomEvent("editor:toast", {
            detail: { type: "info", message: "Save no .tsx: em desenvolvimento (Fase 10)" },
          }),
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Inicializacao: quando games carregar, escolhe o primeiro
  useEffect(() => {
    if (!targetId && games[0]) {
      const t = games[0];
      setTarget(t.id, t.baseResolution, "");
    }
  }, [targetId, setTarget, games]);

  // Listener global de Shift (Konva nao expoe shiftKey no onClick de shape)
  useEffect(() => {
    const sync = (e: KeyboardEvent) => {
      (window as Window & { __lastShiftKey?: boolean }).__lastShiftKey = e.shiftKey;
    };
    window.addEventListener("keydown", sync);
    window.addEventListener("keyup", sync);
    return () => {
      window.removeEventListener("keydown", sync);
      window.removeEventListener("keyup", sync);
    };
  }, []);

  // Modal confirmacao de saida sem salvar
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingTargetId, setPendingTargetId] = useState<string | null>(null);

  const domChanges = useEditorStore((s) => s.domChanges);
  const hasUnsavedChanges = domChanges.length > 0;

  const handleTargetChange = (id: string) => {
    const t = games.find((x) => x.id === id);
    if (!t) return;
    // Se tem mudancas nao salvas, perguntar antes
    if (hasUnsavedChanges) {
      setPendingTargetId(id);
      setShowUnsavedModal(true);
      return;
    }
    setTarget(t.id, t.baseResolution, "");
    setActiveFile("");
    setSelectedElement(null);
  };

  const confirmLeave = () => {
    if (pendingTargetId) {
      const t = games.find((x) => x.id === pendingTargetId);
      if (t) {
        setTarget(t.id, t.baseResolution, "");
        setActiveFile("");
        setSelectedElement(null);
      }
    }
    setShowUnsavedModal(false);
    setPendingTargetId(null);
  };

  const sceneElementCount = layout.scenes.find((s) => s.id === currentSceneId)?.elements.length ?? 0;

  return (
    <main style={mainStyle}>
      {/* Scrollbar estilizado pro editor — vertical + horizontal (Pesquisa X0: scrollbar dourada) */}
      <style>{`
        .editor-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .editor-scroll::-webkit-scrollbar-track { background: rgba(212,168,67,0.03); border-radius: 3px; }
        .editor-scroll::-webkit-scrollbar-thumb { background: rgba(212,168,67,0.2); border-radius: 3px; }
        .editor-scroll::-webkit-scrollbar-thumb:hover { background: rgba(212,168,67,0.4); }
        .editor-scroll::-webkit-scrollbar-corner { background: transparent; }
      `}</style>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{EDITOR_CONFIG.appName}</h1>
          <p style={subtitleStyle}>Editor visual com iframe — arraste elementos pra reposicionar</p>
        </div>
        <span style={badgeStyle}>DEV MODE</span>
      </header>

      <section style={controlsStyle}>
        <label style={labelStyle}>
          <span>Alvo</span>
          {gamesLoading ? (
            <span style={{ ...selectStyle, color: "#8a8a8a" }}>Carregando...</span>
          ) : games.length === 0 ? (
            <span style={{ ...selectStyle, color: "#8a8a8a", fontSize: 11 }}>
              {gamesNotFound ? `Pasta "${gamesDir}" nao existe` : `Nenhuma subpasta em "${gamesDir}"`}
            </span>
          ) : (
            <select value={targetId} onChange={(e) => handleTargetChange(e.target.value)} style={selectStyle}>
              {games.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </label>

        <label style={labelStyle}>
          <span>Pasta de jogos</span>
          <span style={{ display: "flex", gap: 4 }}>
            <input
              type="text"
              value={gamesDirInput}
              onChange={(e) => setGamesDirInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyGamesDir();
              }}
              style={dirInputStyle}
              placeholder="components/games"
              title="Pasta onde estao os jogos. Edite e pressione Enter pra escanear."
            />
            <button onClick={applyGamesDir} style={dirBtnStyle} title="Escanear esta pasta">
              ↻
            </button>
          </span>
        </label>

        <span style={infoStyle}>
          {targetId || "nenhum alvo"} · iframe proxy → :3000
        </span>
      </section>

      <Toolbar />

      <div style={gridStyle}>
        <div style={leftColStyle} className="editor-scroll">
          <FilePanel activeFile={activeFile} onSelectFile={(f) => setActiveFile(f)} />
          {iframeRefState && (
            <DomTreePanel
              iframeRef={iframeRefState}
              iframeLoaded={iframeLoadedState}
              selected={selectedElement}
              onSelect={(el) => {
                // Selecionar elemento via DomTree
                window.dispatchEvent(new CustomEvent("editor:select-element", { detail: { element: el } }));
              }}
            />
          )}
        </div>
        <div style={canvasWrapStyle} className="editor-scroll">
          <IframeEditor
            gameId={targetId || null}
            activeFile={activeFile}
            onSelectElement={setSelectedElement}
            onIframeRef={setIframeRefState}
            onIframeLoaded={setIframeLoadedState}
          />
        </div>
        <div style={rightColStyle} className="editor-scroll">
          <DomPropsPanel selected={selectedElement} />
          <ImageUploadPanel
            selected={selectedElement}
            pushUndo={() => {
              if (selectedElement) {
                window.dispatchEvent(new CustomEvent("editor:push-undo", {
                  detail: { element: selectedElement.element },
                }));
              }
            }}
          />
          <HoverEditorPanel
            selected={selectedElement}
            pushUndo={() => {
              if (selectedElement) {
                window.dispatchEvent(new CustomEvent("editor:push-undo", {
                  detail: { element: selectedElement.element },
                }));
              }
            }}
          />
          <VideoBackgroundPanel
            selected={selectedElement}
            pushUndo={() => {
              if (selectedElement) {
                window.dispatchEvent(new CustomEvent("editor:push-undo", {
                  detail: { element: selectedElement.element },
                }));
              }
            }}
          />
          <CssToolsPanel
            selected={selectedElement}
            pushUndo={() => {
              if (selectedElement) {
                window.dispatchEvent(new CustomEvent("editor:push-undo", {
                  detail: { element: selectedElement.element },
                }));
              }
            }}
          />
          <SavePanel
            selected={selectedElement}
            gameId={targetId || null}
            hasChanges={hasUnsavedChanges}
            undoCount={domChanges.length}
          />
        </div>
      </div>

      <footer style={footerStyle}>
        Pressione <kbd style={kbdStyle}>?</kbd> pra ver lista de atalhos e tutorial · Click "Preview" pra ver layout em 5 resolucoes
      </footer>

      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ToastContainer />

      {/* Modal: sair sem salvar */}
      {showUnsavedModal && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#D4A843", marginBottom: 12 }}>
              Mudancas nao salvas
            </div>
            <p style={{ color: "#ccc", fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
              Voce tem alteracoes que ainda nao foram salvas.
              Se trocar de alvo agora, as mudancas serao perdidas.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setShowUnsavedModal(false); setPendingTargetId(null); }}
                style={modalBtnSecondaryStyle}
              >
                Continuar editando
              </button>
              <button
                onClick={confirmLeave}
                style={modalBtnDangerStyle}
              >
                Descartar e trocar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const mainStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  padding: 24,
  gap: 16,
  maxWidth: 1600,
  margin: "0 auto",
};
const headerStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between" };
const titleStyle: React.CSSProperties = { fontSize: 22, fontWeight: 700, color: "#D4A843", margin: 0, letterSpacing: 0.3 };
const subtitleStyle: React.CSSProperties = { fontSize: 13, color: "#8a8a8a", marginTop: 4 };
const badgeStyle: React.CSSProperties = {
  fontSize: 11,
  padding: "4px 10px",
  border: "1px solid rgba(212,168,67,0.4)",
  borderRadius: 999,
  color: "#D4A843",
  letterSpacing: 0.5,
};
const controlsStyle: React.CSSProperties = { display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" };
const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#8a8a8a" };
const selectStyle: React.CSSProperties = {
  background: "#0a0806",
  color: "#e5e5e5",
  border: "1px solid rgba(212,168,67,0.3)",
  borderRadius: 4,
  padding: "6px 10px",
  fontSize: 13,
  minWidth: 200,
  fontFamily: "inherit",
};
const bgBtnStyle: React.CSSProperties = {
  background: "rgba(212,168,67,0.12)",
  color: "#D4A843",
  border: "1px solid rgba(212,168,67,0.4)",
  borderRadius: 4,
  padding: "6px 14px",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "inherit",
  fontWeight: 500,
};
const dirInputStyle: React.CSSProperties = {
  background: "#0a0806",
  color: "#e5e5e5",
  border: "1px solid rgba(212,168,67,0.3)",
  borderRadius: 4,
  padding: "6px 8px",
  fontSize: 12,
  width: 180,
  fontFamily: "ui-monospace, monospace",
};
const dirBtnStyle: React.CSSProperties = {
  background: "rgba(212,168,67,0.12)",
  color: "#D4A843",
  border: "1px solid rgba(212,168,67,0.4)",
  borderRadius: 4,
  padding: "6px 10px",
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
};
const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "240px 1fr 280px",
  gap: 12,
  flex: 1,
  minHeight: 0,
  maxHeight: "calc(100vh - 220px)",
  overflow: "hidden",
};
const canvasWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  overflow: "auto",
  minHeight: 0,
};
const leftColStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  overflow: "auto",
  minHeight: 0,
  maxHeight: "calc(100vh - 220px)",
};
const rightColStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  overflow: "auto",
  maxHeight: "calc(100vh - 220px)",
};
const infoStyle: React.CSSProperties = {
  marginLeft: "auto",
  fontSize: 11,
  color: "#5a5a5a",
  fontFamily: "ui-monospace, monospace",
};
const footerStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#5a5a5a",
  textAlign: "center",
  marginTop: 8,
};
const kbdStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "1px 6px",
  margin: "0 2px",
  background: "rgba(212,168,67,0.08)",
  border: "1px solid rgba(212,168,67,0.3)",
  borderRadius: 3,
  fontSize: 10,
  fontFamily: "ui-monospace, monospace",
  color: "#D4A843",
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};
const modalBoxStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #1a1410 0%, #0e0c09 100%)",
  border: "1.5px solid rgba(212,168,67,0.4)",
  borderRadius: 12,
  padding: "28px 32px",
  maxWidth: 420,
  width: "90%",
  boxShadow: "0 0 40px rgba(212,168,67,0.1), 0 8px 32px rgba(0,0,0,0.6)",
};
const modalBtnSecondaryStyle: React.CSSProperties = {
  padding: "8px 18px",
  background: "rgba(212,168,67,0.08)",
  border: "1px solid rgba(212,168,67,0.3)",
  borderRadius: 6,
  color: "#D4A843",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};
const modalBtnDangerStyle: React.CSSProperties = {
  padding: "8px 18px",
  background: "rgba(255,68,68,0.15)",
  border: "1px solid rgba(255,68,68,0.4)",
  borderRadius: 6,
  color: "#FF4444",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};
