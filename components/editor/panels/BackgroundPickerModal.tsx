"use client";

/**
 * BackgroundPickerModal.tsx
 *
 * EM PALAVRAS SIMPLES: caixa que abre quando voce clica "Escolher
 * background". Ela mostra os arquivos da pasta sugerida (ex:
 * /assets/games/roulette/), com preview. Voce navega pelas pastas,
 * clica numa imagem ou video e ela vira o fundo da cena.
 *
 * TECNICAMENTE: chama /api/editor/list-files?dir=X. Renderiza grid
 * de thumbnails. Suporta navegar pra cima (..) e pra subpastas.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface FileItem {
  name: string;
  type: "file" | "dir";
  path: string;
  ext?: string;
}

interface Props {
  open: boolean;
  /** Pasta inicial a abrir (ex: "/assets/games/roulette/") */
  initialDir: string;
  onClose: () => void;
  onPick: (path: string, isVideo: boolean) => void;
}

const VIDEO_EXTS = new Set(["mp4", "webm", "mov"]);

export default function BackgroundPickerModal({ open, initialDir, onClose, onPick }: Props) {
  const [dir, setDir] = useState(initialDir);
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDir(initialDir);
  }, [open, initialDir]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    fetch(`/api/editor/list-files?dir=${encodeURIComponent(dir)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setItems([]);
        } else {
          setItems(data.items ?? []);
          setNotFound(Boolean(data.notFound));
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }, [open, dir]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const goUp = () => {
    const parts = dir.split("/").filter(Boolean);
    parts.pop();
    setDir("/" + parts.join("/"));
  };

  const handlePick = (item: FileItem) => {
    if (item.type === "dir") {
      setDir(item.path);
    } else {
      const isVideo = item.ext ? VIDEO_EXTS.has(item.ext) : false;
      onPick(item.path, isVideo);
      onClose();
    }
  };

  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <header style={headerStyle}>
          <div>
            <h2 style={titleStyle}>Escolher background</h2>
            <p style={pathStyle}>{dir}</p>
          </div>
          <button onClick={onClose} style={closeBtn}>×</button>
        </header>

        <div style={navBarStyle}>
          <button onClick={goUp} disabled={dir === "/" || dir === ""} style={navBtnStyle} title="Subir nivel">
            ← .. (pasta acima)
          </button>
          <input
            type="text"
            value={dir}
            onChange={(e) => setDir(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // forca refresh
                setDir(dir);
              }
            }}
            style={dirInputStyle}
            placeholder="/assets/..."
          />
        </div>

        <div style={gridStyle}>
          {loading && <p style={msgStyle}>Carregando...</p>}
          {error && <p style={{ ...msgStyle, color: "#dc5050" }}>Erro: {error}</p>}
          {notFound && !loading && (
            <p style={msgStyle}>
              Pasta nao existe ainda. Coloque arquivos em <code>{dir}</code> dentro de <code>public/</code>,
              ou navegue pra outra pasta.
            </p>
          )}
          {!loading && !error && items.length === 0 && !notFound && (
            <p style={msgStyle}>Pasta vazia (sem imagens ou videos).</p>
          )}
          {items.map((item) => (
            <button key={item.path} onClick={() => handlePick(item)} style={cardStyle} title={item.path}>
              {item.type === "dir" ? (
                <div style={dirThumbStyle}>📁</div>
              ) : item.ext && VIDEO_EXTS.has(item.ext) ? (
                <div style={videoThumbStyle}>
                  <span style={{ fontSize: 28 }}>▶</span>
                  <span style={{ fontSize: 9, marginTop: 4, opacity: 0.7 }}>
                    .{item.ext.toUpperCase()}
                  </span>
                </div>
              ) : (
                <img src={item.path} alt={item.name} style={imgThumbStyle} />
              )}
              <span style={cardLabelStyle}>{item.name}</span>
            </button>
          ))}
        </div>

        <footer style={footerStyle}>
          Click numa pasta pra entrar · Click numa imagem/video pra escolher · Esc fecha
        </footer>
      </div>
    </div>,
    document.body,
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.75)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9300,
  backdropFilter: "blur(6px)",
};

const modalStyle: React.CSSProperties = {
  background: "#0a0806",
  border: "1px solid rgba(212,168,67,0.3)",
  borderRadius: 10,
  width: "min(900px, 92vw)",
  maxHeight: "88vh",
  display: "flex",
  flexDirection: "column",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "20px 24px 12px 24px",
  borderBottom: "1px solid rgba(212,168,67,0.1)",
};

const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: "#D4A843", margin: 0 };
const pathStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#8a8a8a",
  margin: "4px 0 0 0",
  fontFamily: "ui-monospace, monospace",
};

const closeBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#8a8a8a",
  fontSize: 22,
  cursor: "pointer",
  padding: 4,
  lineHeight: 1,
};

const navBarStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  padding: "10px 24px",
  borderBottom: "1px solid rgba(212,168,67,0.05)",
};

const navBtnStyle: React.CSSProperties = {
  background: "rgba(212,168,67,0.08)",
  border: "1px solid rgba(212,168,67,0.2)",
  borderRadius: 4,
  padding: "5px 10px",
  fontSize: 11,
  color: "#D4A843",
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

const dirInputStyle: React.CSSProperties = {
  flex: 1,
  background: "#0a0806",
  border: "1px solid rgba(212,168,67,0.2)",
  borderRadius: 4,
  padding: "5px 10px",
  fontSize: 12,
  color: "#e5e5e5",
  fontFamily: "ui-monospace, monospace",
};

const gridStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: 16,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: 10,
  alignContent: "start",
};

const msgStyle: React.CSSProperties = {
  gridColumn: "1 / -1",
  textAlign: "center",
  color: "#8a8a8a",
  fontSize: 13,
  padding: 24,
};

const cardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  background: "rgba(212,168,67,0.04)",
  border: "1px solid rgba(212,168,67,0.1)",
  borderRadius: 6,
  padding: 6,
  cursor: "pointer",
  fontFamily: "inherit",
};

const dirThumbStyle: React.CSSProperties = {
  height: 80,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 36,
  background: "rgba(212,168,67,0.05)",
  borderRadius: 4,
};

const videoThumbStyle: React.CSSProperties = {
  height: 80,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  background: "rgba(50,50,80,0.4)",
  borderRadius: 4,
  color: "#a8c5e0",
};

const imgThumbStyle: React.CSSProperties = {
  height: 80,
  width: "100%",
  objectFit: "cover",
  borderRadius: 4,
  background: "#1a1410",
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#c5c5c5",
  marginTop: 6,
  textAlign: "center",
  wordBreak: "break-word",
  fontFamily: "ui-monospace, monospace",
  lineHeight: 1.3,
};

const footerStyle: React.CSSProperties = {
  padding: "10px 24px",
  borderTop: "1px solid rgba(212,168,67,0.1)",
  fontSize: 11,
  color: "#5a5a5a",
  textAlign: "center",
};
