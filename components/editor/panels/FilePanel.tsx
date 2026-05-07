"use client";

/**
 * FilePanel.tsx
 *
 * Lista os arquivos .tsx do alvo selecionado. Ao clicar num
 * arquivo, emite evento pro IframeEditor trocar o ?file= no iframe,
 * renderizando aquele componente isolado.
 *
 * O primeiro item "Tela principal" carrega o jogo completo (sem ?file).
 */
import { useEffect, useState } from "react";
import { useEditorStore } from "../state/editorStore";

interface TsxFile {
  name: string;
  path: string;
  size: number;
  isTsx: boolean;
}

interface Props {
  /** Arquivo ativo (nome sem extensao, ou "" pra tela principal) */
  activeFile: string;
  /** Callback quando usuario clica num arquivo */
  onSelectFile: (fileName: string) => void;
}

export default function FilePanel({ activeFile, onSelectFile }: Props) {
  const targetId = useEditorStore((s) => s.targetId);
  const [files, setFiles] = useState<TsxFile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!targetId) {
      setFiles([]);
      return;
    }

    setLoading(true);
    fetch(`/api/editor/list-tsx?game=${encodeURIComponent(targetId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.files)) {
          setFiles(data.files);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [targetId]);

  if (!targetId) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>ARQUIVOS</div>
        <p style={emptyStyle}>Selecione um alvo</p>
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        ARQUIVOS
        <span style={countStyle}>{files.length}</span>
      </div>

      {loading && <p style={emptyStyle}>Carregando...</p>}

      <div style={listStyle}>
        {/* Tela principal (sem ?file) */}
        <button
          onClick={() => onSelectFile("")}
          style={{
            ...itemStyle,
            background: activeFile === "" ? "rgba(212,168,67,0.15)" : "transparent",
            borderLeft: activeFile === "" ? "2px solid #D4A843" : "2px solid transparent",
          }}
        >
          <span style={iconStyle}>&#9654;</span>
          <span style={nameStyle}>Tela principal</span>
          <span style={tagStyle}>GAME</span>
        </button>

        {/* Arquivos do jogo — classificados por tipo */}
        {files.map((f) => {
          const baseName = f.name.replace(/\.(tsx|ts)$/, "");
          const isTsx = f.isTsx;

          // Classificacao baseada na analise dos 7 jogos:
          // Tipo A: componente principal (*Game.tsx) → carrega tela completa
          // Tipo B: sub-tela .tsx (Betting, Result, Overlay, etc) → carrega isolado via ?file=
          // Tipo C: codigo puro .ts (Constants, Engine, Types, hooks) → nao renderizavel
          const isMainGame = isTsx && /Game$/i.test(baseName);
          const isCodeOnly = !isTsx; // .ts = constants, engine, types, hooks
          const isSubComponent = isTsx && !isMainGame;

          // Destacar se esta ativo
          const isActive = isMainGame
            ? activeFile === ""
            : activeFile === baseName;

          const handleClick = () => {
            if (isCodeOnly) return; // .ts nao renderiza
            if (isMainGame) {
              onSelectFile(""); // tela completa, sem ?file=
            } else {
              onSelectFile(baseName); // sub-tela via ?file=
            }
          };

          // Icone e label por tipo
          let icon = "TS";
          let label = "";
          if (isMainGame) { icon = "▶"; label = "GAME"; }
          else if (isSubComponent) { icon = "⚛"; label = ""; }
          else { icon = "TS"; label = "codigo"; }

          return (
            <button
              key={f.name}
              onClick={handleClick}
              style={{
                ...itemStyle,
                background: isActive ? "rgba(212,168,67,0.15)" : "transparent",
                borderLeft: isActive ? "2px solid #D4A843" : "2px solid transparent",
                opacity: isCodeOnly ? 0.35 : 1,
                cursor: isCodeOnly ? "default" : "pointer",
              }}
              title={
                isCodeOnly
                  ? `${baseName} — arquivo de codigo (nao visual)`
                  : isMainGame
                  ? `${baseName} — tela completa do jogo`
                  : `${baseName} — sub-componente (carrega isolado)`
              }
            >
              <span style={iconStyle}>{icon}</span>
              <span style={nameStyle}>{baseName}</span>
              {label === "GAME" ? (
                <span style={tagStyle}>GAME</span>
              ) : label === "codigo" ? (
                <span style={{ ...sizeStyle, color: "#3a3a3a" }}>
                  {formatSize(f.size)}
                </span>
              ) : (
                <span style={sizeStyle}>{formatSize(f.size)}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: 8,
  background: "#0d0a08",
  border: "1px solid rgba(212,168,67,0.15)",
  borderRadius: 8,
  maxHeight: 300,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#D4A843",
  letterSpacing: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "4px 4px 8px",
  borderBottom: "1px solid rgba(212,168,67,0.1)",
};

const countStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#8a8a8a",
  fontWeight: 400,
};

const listStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 1,
  overflow: "auto",
  flex: 1,
};

const itemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 6px",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontFamily: "ui-monospace, monospace",
  fontSize: 11,
  color: "#e5e5e5",
  textAlign: "left",
  width: "100%",
  transition: "background 0.15s",
};

const iconStyle: React.CSSProperties = {
  fontSize: 10,
  width: 16,
  textAlign: "center",
  flexShrink: 0,
};

const nameStyle: React.CSSProperties = {
  flex: 1,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const sizeStyle: React.CSSProperties = {
  fontSize: 9,
  color: "#5a5a5a",
  flexShrink: 0,
};

const tagStyle: React.CSSProperties = {
  fontSize: 8,
  color: "#D4A843",
  border: "1px solid rgba(212,168,67,0.3)",
  borderRadius: 3,
  padding: "1px 4px",
  flexShrink: 0,
  letterSpacing: 0.5,
};

const emptyStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#5a5a5a",
  padding: "12px 4px",
  textAlign: "center",
};
