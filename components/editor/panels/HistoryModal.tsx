"use client";

/**
 * HistoryModal.tsx
 *
 * EM PALAVRAS SIMPLES: modal que mostra todas as sessoes salvas
 * (automaticas e manuais), cada uma com thumbnail e timestamp.
 * Voce clica numa sessao pra restaurar ela.
 *
 * TECNICAMENTE: lista o conteudo do localStorage filtrado pelo
 * jogo atual. Restaurar = setLayout no store. Inclui confirm
 * pra delete.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useEditorStore } from "../state/editorStore";
import { getAllSessions, deleteSession, renameSession } from "../utils/sessions";
import ConfirmModal from "./ConfirmModal";
import type { SavedSession } from "../state/schema";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HistoryModal({ open, onClose }: Props) {
  const layout = useEditorStore((s) => s.layout);
  const setLayout = useEditorStore((s) => s.setLayout);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [pendingRestore, setPendingRestore] = useState<SavedSession | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SavedSession | null>(null);
  const [filter, setFilter] = useState<"all" | "auto" | "manual">("all");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  // Recarrega sessoes quando abre o modal
  useEffect(() => {
    if (open) setSessions(getAllSessions());
  }, [open]);

  // Esc fecha modal
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pendingRestore && !pendingDelete) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pendingRestore, pendingDelete, onClose]);

  if (!open || typeof document === "undefined") return null;

  // So mostra sessoes do jogo atual
  const filtered = sessions
    .filter((s) => s.game === layout.game)
    .filter((s) => filter === "all" || s.type === filter);

  const handleRestore = () => {
    if (!pendingRestore) return;
    setLayout(pendingRestore.layout);
    setPendingRestore(null);
    onClose();
  };

  const handleDelete = () => {
    if (!pendingDelete) return;
    deleteSession(pendingDelete.id);
    setSessions(getAllSessions());
    setPendingDelete(null);
  };

  const handleRename = (id: string) => {
    const trimmed = draftName.trim();
    if (trimmed) {
      renameSession(id, trimmed);
      setSessions(getAllSessions());
    }
    setRenaming(null);
    setDraftName("");
  };

  return createPortal(
    <>
      <div style={overlayStyle} onClick={onClose}>
        <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
          <header style={headerStyle}>
            <div>
              <h2 style={titleStyle}>Historico de Sessoes</h2>
              <p style={subtitleStyle}>
                Sessoes salvas no navegador para o jogo "{layout.game}"
              </p>
            </div>
            <button onClick={onClose} style={closeBtn} title="Fechar (Esc)">
              ×
            </button>
          </header>

          <div style={tabsStyle}>
            {(["all", "manual", "auto"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                style={filter === mode ? tabActive : tab}
              >
                {mode === "all" ? "Todas" : mode === "manual" ? "Manuais" : "Auto-save"}
                <span style={tabBadge}>
                  {sessions.filter((s) => s.game === layout.game && (mode === "all" || s.type === mode)).length}
                </span>
              </button>
            ))}
          </div>

          <div style={listStyle}>
            {filtered.length === 0 ? (
              <p style={emptyStyle}>Nenhuma sessao salva ainda.</p>
            ) : (
              filtered.map((s) => (
                <div key={s.id} style={cardStyle}>
                  <div style={thumbStyle}>
                    {s.thumbnail ? (
                      <img src={s.thumbnail} alt="" style={thumbImg} />
                    ) : (
                      <div style={thumbPlaceholder}>
                        {s.layout.scenes[0]?.elements.length ?? 0}{" "}
                        <span style={{ fontSize: 9 }}>elem</span>
                      </div>
                    )}
                  </div>
                  <div style={infoStyle}>
                    {renaming === s.id ? (
                      <input
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onBlur={() => handleRename(s.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(s.id);
                          if (e.key === "Escape") {
                            setRenaming(null);
                            setDraftName("");
                          }
                        }}
                        autoFocus
                        style={renameInput}
                      />
                    ) : (
                      <div style={nameStyle}>
                        {s.name ?? (s.type === "auto" ? "Auto-save" : "Sem nome")}
                        <span style={typeBadge(s.type)}>{s.type === "auto" ? "AUTO" : "MANUAL"}</span>
                      </div>
                    )}
                    <div style={metaStyle}>
                      {formatRelative(s.savedAt)} · {s.layout.scenes.length} cena
                      {s.layout.scenes.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div style={actionsStyle}>
                    <button onClick={() => setPendingRestore(s)} style={btnPrimary}>
                      Restaurar
                    </button>
                    {s.type === "manual" && (
                      <button
                        onClick={() => {
                          setRenaming(s.id);
                          setDraftName(s.name ?? "");
                        }}
                        style={btnGhost}
                        title="Renomear"
                      >
                        ✎
                      </button>
                    )}
                    <button
                      onClick={() => setPendingDelete(s)}
                      style={btnDanger}
                      title="Apagar"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <footer style={footerStyle}>
            Auto-save a cada 30s · Sessoes manuais com Ctrl+Shift+S · Esc fecha
          </footer>
        </div>
      </div>

      <ConfirmModal
        open={Boolean(pendingRestore)}
        title="Restaurar sessao"
        message={`Vai substituir o trabalho atual por esta sessao salva. Pode desfazer com Ctrl+Z depois.`}
        confirmLabel="Restaurar"
        onConfirm={handleRestore}
        onCancel={() => setPendingRestore(null)}
      />

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Apagar sessao"
        message={`Vai apagar permanentemente esta sessao salva. Esta acao nao pode ser desfeita.`}
        confirmLabel="Apagar"
        danger
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>,
    document.body,
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = now - then;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s atras`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}min atras`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h atras`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d atras`;
  return new Date(iso).toLocaleDateString();
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9000,
  backdropFilter: "blur(4px)",
};

const modalStyle: React.CSSProperties = {
  background: "#0a0806",
  border: "1px solid rgba(212,168,67,0.3)",
  borderRadius: 8,
  width: 720,
  maxWidth: "90vw",
  maxHeight: "85vh",
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

const titleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: "#D4A843",
  margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#8a8a8a",
  margin: "4px 0 0 0",
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

const tabsStyle: React.CSSProperties = {
  display: "flex",
  gap: 4,
  padding: "12px 24px 0 24px",
};

const tab: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "transparent",
  border: "1px solid transparent",
  borderRadius: 4,
  padding: "6px 12px",
  fontSize: 12,
  cursor: "pointer",
  color: "#8a8a8a",
  fontFamily: "inherit",
};

const tabActive: React.CSSProperties = {
  ...tab,
  background: "rgba(212,168,67,0.12)",
  border: "1px solid rgba(212,168,67,0.4)",
  color: "#D4A843",
};

const tabBadge: React.CSSProperties = {
  fontSize: 10,
  padding: "1px 6px",
  background: "rgba(0,0,0,0.4)",
  borderRadius: 999,
  color: "#5a5a5a",
};

const listStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "12px 24px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const emptyStyle: React.CSSProperties = {
  color: "#8a8a8a",
  textAlign: "center",
  padding: 32,
  fontSize: 13,
};

const cardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 8,
  background: "rgba(212,168,67,0.04)",
  border: "1px solid rgba(212,168,67,0.1)",
  borderRadius: 6,
};

const thumbStyle: React.CSSProperties = {
  width: 64,
  height: 36,
  background: "#1a1410",
  borderRadius: 3,
  overflow: "hidden",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const thumbImg: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const thumbPlaceholder: React.CSSProperties = {
  fontSize: 11,
  color: "#5a5a5a",
  fontFamily: "ui-monospace, monospace",
};

const infoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const nameStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  color: "#e5e5e5",
  fontWeight: 500,
};

const typeBadge = (type: "auto" | "manual"): React.CSSProperties => ({
  fontSize: 9,
  padding: "1px 6px",
  borderRadius: 3,
  letterSpacing: 0.5,
  background: type === "manual" ? "rgba(212,168,67,0.15)" : "rgba(140,140,140,0.15)",
  color: type === "manual" ? "#D4A843" : "#8a8a8a",
  border: `1px solid ${type === "manual" ? "rgba(212,168,67,0.3)" : "rgba(140,140,140,0.3)"}`,
});

const metaStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#5a5a5a",
  marginTop: 2,
  fontFamily: "ui-monospace, monospace",
};

const renameInput: React.CSSProperties = {
  background: "#0a0806",
  border: "1px solid rgba(212,168,67,0.5)",
  borderRadius: 3,
  padding: "3px 6px",
  fontSize: 13,
  color: "#e5e5e5",
  fontFamily: "inherit",
  width: "100%",
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 4,
  flexShrink: 0,
};

const btnBase: React.CSSProperties = {
  background: "transparent",
  border: "1px solid transparent",
  borderRadius: 4,
  padding: "5px 10px",
  fontSize: 11,
  cursor: "pointer",
  fontFamily: "inherit",
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: "rgba(212,168,67,0.15)",
  color: "#D4A843",
  border: "1px solid rgba(212,168,67,0.4)",
};

const btnGhost: React.CSSProperties = {
  ...btnBase,
  color: "#8a8a8a",
  width: 28,
  textAlign: "center",
};

const btnDanger: React.CSSProperties = {
  ...btnBase,
  color: "#dc5050",
  width: 28,
  textAlign: "center",
  fontSize: 14,
};

const footerStyle: React.CSSProperties = {
  padding: "12px 24px",
  borderTop: "1px solid rgba(212,168,67,0.1)",
  fontSize: 11,
  color: "#5a5a5a",
  textAlign: "center",
  fontFamily: "ui-monospace, monospace",
};
