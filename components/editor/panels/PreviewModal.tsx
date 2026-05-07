"use client";

/**
 * PreviewModal.tsx
 *
 * EM PALAVRAS SIMPLES: modal que mostra como seu layout aparece em
 * 5 resolucoes diferentes ao mesmo tempo (1920, 1366, 1024, 800,
 * mobile 414). Resolve o problema de "ficou bom em 1920 mas quebrou
 * em 1366".
 *
 * TECNICAMENTE: renderiza o mesmo layout em 5 containers com larguras
 * diferentes. Cada um mantem aspect-ratio 16:9. Como tudo eh em %,
 * o resultado eh visualmente consistente — se algo desalinhar, eh
 * sinal de bug (ex: alguem usou px hardcoded em algum lugar).
 */
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useEditorStore } from "../state/editorStore";
import type { GameElement } from "../state/schema";

interface Props {
  open: boolean;
  onClose: () => void;
}

const RESOLUTIONS = [
  { label: "Desktop FullHD", width: 1920 },
  { label: "Laptop", width: 1366 },
  { label: "Tablet", width: 1024 },
  { label: "Tablet pequeno", width: 800 },
  { label: "Mobile", width: 414 },
];

export default function PreviewModal({ open, onClose }: Props) {
  const layout = useEditorStore((s) => s.layout);
  const currentSceneId = useEditorStore((s) => s.currentSceneId);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const scene = layout.scenes.find((s) => s.id === currentSceneId);
  if (!scene) return null;

  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <header style={headerStyle}>
          <div>
            <h2 style={titleStyle}>Preview Multi-Resolucao</h2>
            <p style={subtitleStyle}>
              Cena "{scene.name}" em 5 tamanhos · Se algo quebra, eh sinal de px hardcoded
            </p>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>×</button>
        </header>

        <div style={gridStyle}>
          {RESOLUTIONS.map((res) => (
            <div key={res.width} style={previewCellStyle}>
              <div style={cellLabelStyle}>
                <strong style={{ color: "#D4A843" }}>{res.label}</strong>
                <span style={{ marginLeft: 8, fontFamily: "ui-monospace, monospace" }}>
                  {res.width}×{Math.round((res.width * 9) / 16)}
                </span>
              </div>
              <div
                style={{
                  ...previewBoxStyle,
                  width: Math.min(res.width / 3, 600),
                }}
              >
                <ScenePreview scene={scene} />
              </div>
            </div>
          ))}
        </div>

        <footer style={footerStyle}>
          Layouts em % escalam automaticamente. Esc fecha.
        </footer>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Renderiza uma cena com elementos em CSS puro (sem Konva — eh assim
 * que o jogo final renderiza). Container com aspect-ratio fixo. Tudo
 * em % do container.
 */
function ScenePreview({ scene }: { scene: { background: { type: string; src: string }; elements: GameElement[] } }) {
  const sortedElements = scene.elements.slice().sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div style={sceneContainerStyle}>
      {/* Background */}
      {scene.background.type === "image" ? (
        <img src={scene.background.src} style={bgImgStyle} alt="" />
      ) : (
        <video
          src={scene.background.src}
          autoPlay
          loop
          muted
          playsInline
          style={bgImgStyle}
        />
      )}

      {/* Elements */}
      {sortedElements.map((el) => (
        <ElementPreview key={el.id} element={el} />
      ))}
    </div>
  );
}

function ElementPreview({ element }: { element: GameElement }) {
  if (!element.visible) return null;

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.width}%`,
    height: `${element.height}%`,
    opacity: element.opacity,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    transformOrigin: element.rotation ? "top left" : undefined,
    zIndex: element.zIndex,
  };

  if (element.type === "rect") {
    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: element.fill,
          border: element.stroke ? `${element.strokeWidth ?? 1}px solid ${element.stroke}` : undefined,
          borderRadius: element.cornerRadius ? `${element.cornerRadius}px` : undefined,
        }}
      />
    );
  }
  if (element.type === "text") {
    return (
      <div
        style={{
          ...baseStyle,
          color: element.color,
          fontFamily: element.fontFamily,
          fontSize: `${element.fontSize}cqh`,
          fontWeight: element.fontWeight,
          textAlign: element.align,
          display: "flex",
          alignItems: "center",
          justifyContent:
            element.align === "left" ? "flex-start" : element.align === "right" ? "flex-end" : "center",
        }}
      >
        {element.text}
      </div>
    );
  }
  if (element.type === "image") {
    return (
      <img
        src={element.src}
        style={{ ...baseStyle, objectFit: element.fit ?? "fill" } as React.CSSProperties}
        alt=""
      />
    );
  }
  if (element.type === "placeholder") {
    return (
      <div
        style={{
          ...baseStyle,
          background: "rgba(212,168,67,0.08)",
          border: "1.5px dashed rgba(212,168,67,0.6)",
          color: "#D4A843",
          fontSize: 9,
          fontFamily: "ui-monospace, monospace",
          padding: 4,
          overflow: "hidden",
        }}
      >
        {element.placeholderId}
      </div>
    );
  }
  return null;
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9400,
  backdropFilter: "blur(8px)",
};

const modalStyle: React.CSSProperties = {
  background: "#0a0806",
  border: "1px solid rgba(212,168,67,0.3)",
  borderRadius: 10,
  width: "min(1280px, 95vw)",
  maxHeight: "92vh",
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

const gridStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 16,
  padding: 24,
};

const previewCellStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  alignItems: "flex-start",
};

const cellLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#8a8a8a",
  letterSpacing: 0.3,
};

const previewBoxStyle: React.CSSProperties = {
  aspectRatio: "16/9",
  background: "#1a1410",
  border: "1px solid rgba(212,168,67,0.2)",
  borderRadius: 6,
  overflow: "hidden",
  position: "relative",
};

const sceneContainerStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  containerType: "size",
};

const bgImgStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const footerStyle: React.CSSProperties = {
  padding: "12px 24px",
  borderTop: "1px solid rgba(212,168,67,0.1)",
  fontSize: 11,
  color: "#5a5a5a",
  textAlign: "center",
  fontFamily: "ui-monospace, monospace",
};
