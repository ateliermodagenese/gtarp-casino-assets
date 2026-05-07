"use client";

/**
 * VideoBackgroundPanel.tsx
 *
 * Fase 7 — Inserir video de fundo em containers.
 * Suporta WebM (alpha transparency) e MP4.
 * Insere <video autoplay loop muted playsinline> posicionado absolute.
 * Fallback: poster image quando video nao carrega.
 */
import { useCallback, useRef, useState } from "react";
import type { DomElementInfo } from "../IframeEditor";

interface VideoBackgroundPanelProps {
  selected: DomElementInfo | null;
  pushUndo: () => void;
}

export default function VideoBackgroundPanel({ selected, pushUndo }: VideoBackgroundPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const isContainer = selected && ["div", "section", "main", "article", "aside"].includes(selected.tag);

  const hasVideo = selected ? Boolean(selected.element.querySelector("video[data-editor-video]")) : false;

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;

    const validTypes = ["video/webm", "video/mp4"];
    if (!validTypes.includes(file.type)) {
      window.dispatchEvent(new CustomEvent("editor:toast", {
        detail: { type: "error", message: "Use WebM ou MP4." },
      }));
      return;
    }

    pushUndo();
    const url = URL.createObjectURL(file);
    setVideoSrc(url);

    // Garantir position relative no container
    const computed = getComputedStyle(selected.element);
    if (computed.position === "static") {
      selected.element.style.position = "relative";
    }

    // Remover video anterior se existir
    const old = selected.element.querySelector("video[data-editor-video]");
    if (old) old.remove();

    // Criar video element
    const video = selected.element.ownerDocument.createElement("video");
    video.setAttribute("data-editor-video", "true");
    video.src = url;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
      pointer-events: none;
    `;

    // Inserir como primeiro filho (fica atras do conteudo)
    selected.element.insertBefore(video, selected.element.firstChild);

    window.dispatchEvent(new CustomEvent("editor:toast", {
      detail: { type: "success", message: "Video inserido. Salve pra persistir." },
    }));

    if (fileRef.current) fileRef.current.value = "";
  }, [selected, pushUndo]);

  const handleRemoveVideo = useCallback(() => {
    if (!selected) return;
    pushUndo();
    const video = selected.element.querySelector("video[data-editor-video]");
    if (video) video.remove();
    setVideoSrc(null);
    window.dispatchEvent(new CustomEvent("editor:toast", {
      detail: { type: "success", message: "Video removido" },
    }));
  }, [selected, pushUndo]);

  const handleTogglePlay = useCallback(() => {
    if (!selected) return;
    const video = selected.element.querySelector("video[data-editor-video]") as HTMLVideoElement | null;
    if (!video) return;
    if (video.paused) video.play(); else video.pause();
  }, [selected]);

  if (!isContainer) return null;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={{ color: "#D4A843", fontWeight: 700, fontSize: 10, letterSpacing: 0.8 }}>
          VIDEO FUNDO
        </span>
      </div>

      <div style={bodyStyle}>
        <input
          ref={fileRef}
          type="file"
          accept="video/webm,video/mp4"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {!hasVideo ? (
          <button onClick={() => fileRef.current?.click()} style={uploadBtnStyle}>
            Inserir video de fundo
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={handleTogglePlay} style={actionBtnStyle}>
                Play/Pause
              </button>
              <button onClick={() => fileRef.current?.click()} style={actionBtnStyle}>
                Trocar
              </button>
            </div>
            <button onClick={handleRemoveVideo} style={removeBtnStyle}>
              Remover video
            </button>
          </div>
        )}

        <p style={{ color: "#5a5a5a", fontSize: 9, marginTop: 4 }}>
          WebM (alpha) ou MP4. Autoplay, loop, muted.
        </p>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = { marginTop: 2 };
const headerStyle: React.CSSProperties = {
  padding: "6px 8px",
  background: "rgba(212,168,67,0.06)",
  borderRadius: 4,
};
const bodyStyle: React.CSSProperties = { padding: "6px 8px" };
const uploadBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  background: "rgba(138,80,200,0.1)",
  border: "1px solid rgba(138,80,200,0.3)",
  borderRadius: 4,
  color: "#B080E0",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};
const actionBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "4px 8px",
  background: "rgba(212,168,67,0.08)",
  border: "1px solid rgba(212,168,67,0.2)",
  borderRadius: 3,
  color: "#D4A843",
  fontSize: 10,
  cursor: "pointer",
  fontFamily: "inherit",
};
const removeBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "4px 8px",
  background: "rgba(255,68,68,0.08)",
  border: "1px solid rgba(255,68,68,0.2)",
  borderRadius: 3,
  color: "#FF6666",
  fontSize: 10,
  cursor: "pointer",
  fontFamily: "inherit",
};
