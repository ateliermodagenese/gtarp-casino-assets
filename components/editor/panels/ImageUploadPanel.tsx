"use client";

/**
 * ImageUploadPanel.tsx
 *
 * Quando o elemento selecionado eh <img>, mostra botao "Trocar imagem".
 * Quando eh div/button, mostra "Background image".
 * Preview instantaneo via FileReader + API POST pra salvar.
 */
import { useCallback, useRef, useState } from "react";
import type { DomElementInfo } from "../IframeEditor";

interface ImageUploadPanelProps {
  selected: DomElementInfo | null;
  pushUndo: () => void;
}

export default function ImageUploadPanel({ selected, pushUndo }: ImageUploadPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"src" | "bg">("src");

  const isImg = selected?.tag === "img";
  const hasBg = selected ? Boolean(
    selected.element.style.backgroundImage ||
    getComputedStyle(selected.element).backgroundImage !== "none"
  ) : false;

  const canUpload = selected && (isImg || selected.tag === "div" || selected.tag === "button" || selected.tag === "section" || selected.tag === "span");

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;

    // Validar tipo
    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      window.dispatchEvent(new CustomEvent("editor:toast", {
        detail: { type: "error", message: "Formato invalido. Use PNG, JPG, WebP ou SVG." },
      }));
      return;
    }

    // Preview instantaneo via FileReader
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      pushUndo();

      if (mode === "src" && isImg) {
        (selected.element as HTMLImageElement).src = base64;
      } else {
        selected.element.style.backgroundImage = `url(${base64})`;
        selected.element.style.backgroundSize = "cover";
        selected.element.style.backgroundPosition = "center";
      }

      window.dispatchEvent(new CustomEvent("editor:toast", {
        detail: { type: "success", message: "Preview aplicado. Salve pra persistir." },
      }));
    };
    reader.readAsDataURL(file);

    // Reset input pra permitir re-selecao do mesmo arquivo
    if (fileRef.current) fileRef.current.value = "";
  }, [selected, isImg, mode, pushUndo]);

  const handleUpload = useCallback(async () => {
    if (!preview || !selected) return;
    setUploading(true);
    try {
      const resp = await fetch("/api/editor/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64: preview,
          gameId: selected.element.closest("[data-game-id]")?.getAttribute("data-game-id") || "unknown",
          filename: `upload-${Date.now()}.png`,
        }),
      });
      const data = await resp.json();
      if (data.ok && data.url) {
        if (mode === "src" && isImg) {
          (selected.element as HTMLImageElement).src = data.url;
        } else {
          selected.element.style.backgroundImage = `url(${data.url})`;
        }
        window.dispatchEvent(new CustomEvent("editor:toast", {
          detail: { type: "success", message: `Imagem salva: ${data.url}` },
        }));
        setPreview(null);
      } else {
        throw new Error(data.error || "Erro ao salvar");
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent("editor:toast", {
        detail: { type: "error", message: `Upload falhou: ${err instanceof Error ? err.message : String(err)}` },
      }));
    }
    setUploading(false);
  }, [preview, selected, isImg, mode]);

  const handleRemoveBg = useCallback(() => {
    if (!selected) return;
    pushUndo();
    selected.element.style.backgroundImage = "";
    selected.element.style.backgroundSize = "";
    selected.element.style.backgroundPosition = "";
    setPreview(null);
    window.dispatchEvent(new CustomEvent("editor:toast", {
      detail: { type: "success", message: "Background removido" },
    }));
  }, [selected, pushUndo]);

  if (!canUpload) return null;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={{ color: "#D4A843", fontWeight: 700, fontSize: 10, letterSpacing: 0.8 }}>
          IMAGEM
        </span>
      </div>

      <div style={bodyStyle}>
        {/* Modo: src ou background */}
        {!isImg && (
          <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
            <button
              onClick={() => setMode("bg")}
              style={mode === "bg" ? tabActiveStyle : tabStyle}
            >
              Background
            </button>
          </div>
        )}

        {/* Botao de upload */}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          style={uploadBtnStyle}
        >
          {isImg ? "Trocar imagem" : "Escolher imagem"}
        </button>

        {/* Preview */}
        {preview && (
          <div style={{ marginTop: 6 }}>
            <img
              src={preview}
              alt="Preview"
              style={{ width: "100%", borderRadius: 4, border: "1px solid rgba(212,168,67,0.2)", maxHeight: 80, objectFit: "contain" }}
            />
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              <button onClick={handleUpload} disabled={uploading} style={saveBtnStyle}>
                {uploading ? "Salvando..." : "Salvar no servidor"}
              </button>
            </div>
          </div>
        )}

        {/* Remover background */}
        {!isImg && hasBg && (
          <button onClick={handleRemoveBg} style={removeBtnStyle}>
            Remover background
          </button>
        )}

        {/* Dica */}
        <p style={{ color: "#5a5a5a", fontSize: 9, marginTop: 4 }}>
          PNG, JPG, WebP, SVG. Preview instantaneo.
        </p>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  marginTop: 2,
};

const headerStyle: React.CSSProperties = {
  padding: "6px 8px",
  background: "rgba(212,168,67,0.06)",
  borderRadius: 4,
};

const bodyStyle: React.CSSProperties = {
  padding: "6px 8px",
};

const uploadBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  background: "rgba(212,168,67,0.1)",
  border: "1px solid rgba(212,168,67,0.3)",
  borderRadius: 4,
  color: "#D4A843",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

const saveBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "4px 8px",
  background: "rgba(0,200,100,0.12)",
  border: "1px solid rgba(0,200,100,0.3)",
  borderRadius: 3,
  color: "#00C864",
  fontSize: 10,
  cursor: "pointer",
  fontFamily: "inherit",
};

const removeBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "4px 8px",
  marginTop: 4,
  background: "rgba(255,68,68,0.08)",
  border: "1px solid rgba(255,68,68,0.2)",
  borderRadius: 3,
  color: "#FF6666",
  fontSize: 10,
  cursor: "pointer",
  fontFamily: "inherit",
};

const tabStyle: React.CSSProperties = {
  padding: "3px 8px",
  background: "rgba(212,168,67,0.06)",
  border: "1px solid rgba(212,168,67,0.15)",
  borderRadius: 3,
  color: "#8a8a8a",
  fontSize: 9,
  cursor: "pointer",
  fontFamily: "inherit",
};

const tabActiveStyle: React.CSSProperties = {
  ...tabStyle,
  background: "rgba(212,168,67,0.15)",
  borderColor: "rgba(212,168,67,0.4)",
  color: "#D4A843",
};
