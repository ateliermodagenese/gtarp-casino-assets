"use client";

/**
 * SavePanel.tsx
 *
 * Fase 10 — Save mudancas no codigo-fonte .tsx.
 * Coleta mudancas feitas (quais elementos, quais props),
 * mostra lista de mudancas pendentes,
 * e salva via API POST cirurgica no .tsx com backup.
 */
import { useCallback, useState } from "react";
import type { DomElementInfo } from "../IframeEditor";

interface SavePanelProps {
  selected: DomElementInfo | null;
  gameId: string | null;
  hasChanges: boolean;
  undoCount: number;
}

interface ChangeEntry {
  selector: string;
  property: string;
  oldValue: string;
  newValue: string;
}

export default function SavePanel({ selected, gameId, hasChanges, undoCount }: SavePanelProps) {
  const [saving, setSaving] = useState(false);
  const [lastSave, setLastSave] = useState<string | null>(null);
  const [changes, setChanges] = useState<ChangeEntry[]>([]);

  const collectChanges = useCallback((): ChangeEntry[] => {
    if (!selected) return [];
    // Comparar style atual com originalStyle
    const el = selected.element;
    const current = el.getAttribute("style") || "";
    const original = selected.originalStyle;
    if (current === original) return [];

    // Parsear mudancas
    const parseStyle = (s: string): Record<string, string> => {
      const obj: Record<string, string> = {};
      s.split(";").forEach((part) => {
        const [key, ...valParts] = part.split(":");
        if (key && valParts.length > 0) {
          obj[key.trim()] = valParts.join(":").trim();
        }
      });
      return obj;
    };

    const origProps = parseStyle(original);
    const currProps = parseStyle(current);
    const entries: ChangeEntry[] = [];

    // Props que mudaram
    for (const [key, val] of Object.entries(currProps)) {
      if (origProps[key] !== val) {
        entries.push({
          selector: buildSelector(el),
          property: key,
          oldValue: origProps[key] || "(nenhum)",
          newValue: val,
        });
      }
    }

    // Props que foram removidas
    for (const [key, val] of Object.entries(origProps)) {
      if (!(key in currProps)) {
        entries.push({
          selector: buildSelector(el),
          property: key,
          oldValue: val,
          newValue: "(removido)",
        });
      }
    }

    return entries;
  }, [selected]);

  const handleExportCSS = useCallback(async () => {
    if (!selected) return;
    const entries = collectChanges();
    if (entries.length === 0) {
      window.dispatchEvent(new CustomEvent("editor:toast", {
        detail: { type: "info", message: "Nenhuma mudanca pra exportar" },
      }));
      return;
    }

    // Formatar como CSS pra copiar
    const selector = buildSelector(selected.element);
    const cssProps = entries
      .filter((e) => e.newValue !== "(removido)")
      .map((e) => `  ${e.property}: ${e.newValue};`)
      .join("\n");

    const css = `/* Mudancas do editor — ${gameId} */\n${selector} {\n${cssProps}\n}`;

    try {
      await navigator.clipboard.writeText(css);
      window.dispatchEvent(new CustomEvent("editor:toast", {
        detail: { type: "success", message: "CSS das mudancas copiado pro clipboard" },
      }));
    } catch {
      window.dispatchEvent(new CustomEvent("editor:toast", {
        detail: { type: "error", message: "Falha ao copiar" },
      }));
    }
  }, [selected, gameId, collectChanges]);

  const handleSave = useCallback(async () => {
    if (!gameId) return;
    setSaving(true);

    try {
      // Coletar TODAS as mudancas do iframe (elementos com data-editor-idx que mudaram)
      const iframe = document.querySelector("iframe") as HTMLIFrameElement;
      if (!iframe?.contentWindow?.document) throw new Error("Iframe nao acessivel");

      const doc = iframe.contentWindow.document;
      const editedElements = doc.querySelectorAll("[data-editor-idx]");
      const allChanges: { selector: string; styles: Record<string, string> }[] = [];

      editedElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const style = htmlEl.getAttribute("style");
        if (style) {
          allChanges.push({
            selector: buildSelector(htmlEl),
            styles: parseInlineStyle(style),
          });
        }
      });

      if (allChanges.length === 0) {
        window.dispatchEvent(new CustomEvent("editor:toast", {
          detail: { type: "info", message: "Nenhuma mudanca pra salvar" },
        }));
        setSaving(false);
        return;
      }

      const resp = await fetch("/api/editor/save-styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          changes: allChanges,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await resp.json();
      if (data.ok) {
        setLastSave(new Date().toLocaleTimeString());
        window.dispatchEvent(new CustomEvent("editor:toast", {
          detail: { type: "success", message: `Salvo! ${data.filesChanged || 0} arquivo(s) editado(s). Backup em ${data.backupPath || "bkp/"}` },
        }));
      } else {
        throw new Error(data.error || "Erro desconhecido");
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent("editor:toast", {
        detail: { type: "error", message: `Save falhou: ${err instanceof Error ? err.message : String(err)}` },
      }));
    }

    setSaving(false);
  }, [gameId]);

  // ═══ BACKUP COM VERSÕES (Fase 11) ═══
  const [backups, setBackups] = useState<{ id: string; timestamp: string; gameId: string; count: number }[]>([]);
  const [showBackups, setShowBackups] = useState(false);

  // Carregar backups do localStorage
  const loadBackups = useCallback(() => {
    try {
      const raw = localStorage.getItem("editor:backups");
      if (raw) setBackups(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // Criar backup snapshot
  const createBackup = useCallback(() => {
    if (!gameId) return;
    try {
      const iframe = document.querySelector("iframe") as HTMLIFrameElement;
      if (!iframe?.contentWindow?.document) return;
      const doc = iframe.contentWindow.document;
      const editedElements = doc.querySelectorAll("[data-editor-idx]");
      const snapshot: Record<string, string> = {};
      editedElements.forEach((el) => {
        const eid = el.getAttribute("data-editor-idx");
        const style = (el as HTMLElement).getAttribute("style");
        if (eid && style) snapshot[eid] = style;
      });
      const backup = {
        id: `bkp-${Date.now()}`,
        timestamp: new Date().toLocaleString("pt-BR"),
        gameId,
        count: Object.keys(snapshot).length,
        snapshot,
      };
      const existing = JSON.parse(localStorage.getItem("editor:backups") || "[]");
      existing.unshift(backup);
      // Manter maximo 20 backups
      if (existing.length > 20) existing.length = 20;
      localStorage.setItem("editor:backups", JSON.stringify(existing));
      loadBackups();
      window.dispatchEvent(new CustomEvent("editor:toast", {
        detail: { type: "success", message: `Backup criado: ${backup.count} elementos salvos` },
      }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent("editor:toast", {
        detail: { type: "error", message: `Backup falhou: ${err instanceof Error ? err.message : String(err)}` },
      }));
    }
  }, [gameId, loadBackups]);

  // Restaurar backup
  const restoreBackup = useCallback((backupId: string) => {
    try {
      const all = JSON.parse(localStorage.getItem("editor:backups") || "[]");
      const backup = all.find((b: any) => b.id === backupId);
      if (!backup?.snapshot) return;
      const iframe = document.querySelector("iframe") as HTMLIFrameElement;
      if (!iframe?.contentWindow?.document) return;
      const doc = iframe.contentWindow.document;
      let restored = 0;
      Object.entries(backup.snapshot).forEach(([eid, style]) => {
        const el = doc.querySelector(`[data-editor-idx="${eid}"]`) as HTMLElement;
        if (el) { el.setAttribute("style", style as string); restored++; }
      });
      window.dispatchEvent(new CustomEvent("editor:toast", {
        detail: { type: "success", message: `Backup restaurado: ${restored} elementos` },
      }));
    } catch { /* ignore */ }
  }, []);

  // Deletar backup
  const deleteBackup = useCallback((backupId: string) => {
    try {
      const all = JSON.parse(localStorage.getItem("editor:backups") || "[]");
      const filtered = all.filter((b: any) => b.id !== backupId);
      localStorage.setItem("editor:backups", JSON.stringify(filtered));
      loadBackups();
    } catch { /* ignore */ }
  }, [loadBackups]);

  if (!hasChanges && !lastSave && backups.length === 0) return null;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={{ color: "#D4A843", fontWeight: 700, fontSize: 10, letterSpacing: 0.8 }}>
          SALVAR
        </span>
        {lastSave && (
          <span style={{ color: "#5a5a5a", fontSize: 9 }}>
            Ultimo: {lastSave}
          </span>
        )}
      </div>

      <div style={bodyStyle}>
        {hasChanges && (
          <div style={{ marginBottom: 6, fontSize: 10, color: "#FF8C00" }}>
            {undoCount} mudanca(s) pendente(s)
          </div>
        )}

        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={handleExportCSS}
            disabled={!selected || !hasChanges}
            style={{
              ...actionBtnStyle,
              opacity: selected && hasChanges ? 1 : 0.4,
            }}
          >
            Exportar CSS
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            style={{
              ...saveBtnStyle,
              opacity: hasChanges && !saving ? 1 : 0.4,
            }}
          >
            {saving ? "Salvando..." : "Salvar no .tsx"}
          </button>
        </div>

        <p style={{ color: "#5a5a5a", fontSize: 8, marginTop: 4 }}>
          Exportar = copia CSS pro clipboard. Salvar = edita .tsx com backup.
        </p>

        {/* ═══ BACKUP ═══ */}
        <div style={{ marginTop: 8, borderTop: "1px solid rgba(212,168,67,0.1)", paddingTop: 6 }}>
          <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 4 }}>
            <button
              onClick={createBackup}
              disabled={!hasChanges}
              style={{
                ...actionBtnStyle,
                background: "rgba(212,168,67,0.08)",
                borderColor: "rgba(212,168,67,0.25)",
                color: "#D4A843",
                opacity: hasChanges ? 1 : 0.4,
              }}
            >
              📦 Criar Backup
            </button>
            <button
              onClick={() => { loadBackups(); setShowBackups(prev => !prev); }}
              style={{
                ...actionBtnStyle,
                background: "rgba(100,100,100,0.08)",
                borderColor: "rgba(100,100,100,0.2)",
                color: "#999",
              }}
            >
              {showBackups ? "▲ Fechar" : `▼ Backups${backups.length > 0 ? ` (${backups.length})` : ""}`}
            </button>
          </div>

          {showBackups && backups.length > 0 && (
            <div style={{ maxHeight: 120, overflow: "auto", fontSize: 9 }} className="editor-scroll">
              {backups.filter(b => b.gameId === gameId).map((b) => (
                <div key={b.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "3px 4px", borderBottom: "1px solid rgba(212,168,67,0.06)",
                }}>
                  <span style={{ color: "#aaa" }}>{b.timestamp} ({b.count} els)</span>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button
                      onClick={() => restoreBackup(b.id)}
                      style={{ background: "none", border: "none", color: "#00C864", fontSize: 9, cursor: "pointer" }}
                      title="Restaurar este backup"
                    >
                      ↩ Restaurar
                    </button>
                    <button
                      onClick={() => deleteBackup(b.id)}
                      style={{ background: "none", border: "none", color: "#dc5050", fontSize: 9, cursor: "pointer" }}
                      title="Apagar backup"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              {backups.filter(b => b.gameId === gameId).length === 0 && (
                <p style={{ color: "#555", textAlign: "center", padding: 4 }}>
                  Nenhum backup pra este jogo
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildSelector(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : "";
  const classes = el.className && typeof el.className === "string"
    ? "." + el.className.split(/\s+/).filter(Boolean).slice(0, 2).join(".")
    : "";
  const nth = (() => {
    const parent = el.parentElement;
    if (!parent) return "";
    const siblings = Array.from(parent.children).filter((c) => c.tagName === el.tagName);
    if (siblings.length <= 1) return "";
    const idx = siblings.indexOf(el) + 1;
    return `:nth-of-type(${idx})`;
  })();
  return `${tag}${id}${classes}${nth}`;
}

function parseInlineStyle(style: string): Record<string, string> {
  const obj: Record<string, string> = {};
  style.split(";").forEach((part) => {
    const colonIdx = part.indexOf(":");
    if (colonIdx > 0) {
      const key = part.slice(0, colonIdx).trim();
      const val = part.slice(colonIdx + 1).trim();
      if (key && val) obj[key] = val;
    }
  });
  return obj;
}

const containerStyle: React.CSSProperties = { marginTop: 2 };
const headerStyle: React.CSSProperties = {
  padding: "6px 8px",
  background: "rgba(0,200,100,0.06)",
  borderRadius: 4,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const bodyStyle: React.CSSProperties = { padding: "6px 8px" };
const actionBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "5px 8px",
  background: "rgba(100,180,255,0.1)",
  border: "1px solid rgba(100,180,255,0.3)",
  borderRadius: 4,
  color: "#80B4FF",
  fontSize: 10,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};
const saveBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "5px 8px",
  background: "rgba(0,200,100,0.12)",
  border: "1px solid rgba(0,200,100,0.3)",
  borderRadius: 4,
  color: "#00C864",
  fontSize: 10,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};
