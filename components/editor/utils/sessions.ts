"use client";

/**
 * sessions.ts
 *
 * EM PALAVRAS SIMPLES: salva o trabalho atual no navegador a cada
 * 30 segundos automaticamente. Voce pode tambem salvar manualmente
 * com Ctrl+Shift+S e dar um nome. Se algo der errado, da pra voltar
 * pra qualquer sessao salva.
 *
 * TECNICAMENTE: localStorage manager pra SavedSession[]. Auto-save
 * tem limite (configurado em EDITOR_CONFIG.maxAutoSaves) — quando
 * passa, descarta os mais antigos. Sessoes manuais nao expiram.
 */
import { useEffect, useRef } from "react";
import { useEditorStore } from "../state/editorStore";
import { EDITOR_CONFIG } from "@/editor.config";
import type { SavedSession } from "../state/schema";

const STORAGE_KEY = "blackout-editor-sessions";

/** Le todas as sessoes do localStorage */
export function getAllSessions(): SavedSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedSession[];
  } catch {
    return [];
  }
}

/** Sobrescreve a lista de sessoes (uso interno) */
function writeAllSessions(sessions: SavedSession[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    // QuotaExceededError pode acontecer com muitos auto-saves
    console.warn("[editor] localStorage cheio, limpando auto-saves antigos:", err);
    const manuals = sessions.filter((s) => s.type === "manual");
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(manuals));
    } catch {
      // se ainda falhar, limpa tudo
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
}

/** Cria uma sessao nova e adiciona */
export function createSession(opts: {
  type: "auto" | "manual";
  name?: string;
  game: string;
  layout: SavedSession["layout"];
  thumbnail?: string;
}): SavedSession {
  const session: SavedSession = {
    id: crypto.randomUUID(),
    type: opts.type,
    name: opts.name,
    game: opts.game,
    layout: opts.layout,
    savedAt: new Date().toISOString(),
    thumbnail: opts.thumbnail,
  };

  const all = getAllSessions();
  all.unshift(session);

  // Limita auto-saves ao maximo configurado
  const autos = all.filter((s) => s.type === "auto");
  const manuals = all.filter((s) => s.type === "manual");
  const trimmedAutos = autos.slice(0, EDITOR_CONFIG.maxAutoSaves);
  const final = [...manuals, ...trimmedAutos].sort((a, b) =>
    b.savedAt.localeCompare(a.savedAt),
  );

  writeAllSessions(final);
  return session;
}

/** Remove uma sessao */
export function deleteSession(id: string) {
  const all = getAllSessions().filter((s) => s.id !== id);
  writeAllSessions(all);
}

/** Renomeia uma sessao manual */
export function renameSession(id: string, newName: string) {
  const all = getAllSessions().map((s) =>
    s.id === id ? { ...s, name: newName } : s,
  );
  writeAllSessions(all);
}

/**
 * Hook que liga o auto-save: a cada N ms (default 30000), cria uma
 * sessao "auto" se houver mudancas. Tambem expoe trigger manual.
 */
export function useAutoSave() {
  const layout = useEditorStore((s) => s.layout);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const tick = () => {
      const fingerprint = layout.metadata.updatedAt;
      if (fingerprint && fingerprint !== lastSavedRef.current && layout.scenes.length > 0) {
        const hasContent = layout.scenes.some((s) => s.elements.length > 0);
        if (hasContent) {
          createSession({
            type: "auto",
            game: layout.game,
            layout,
          });
          lastSavedRef.current = fingerprint;
        }
      }
    };

    const intervalId = window.setInterval(tick, EDITOR_CONFIG.autoSaveIntervalMs);
    return () => window.clearInterval(intervalId);
  }, [layout]);
}

/** Captura screenshot do canvas atual em base64 (max ~50KB) */
export function captureCanvasThumbnail(): string | undefined {
  if (typeof document === "undefined") return undefined;
  // Konva renderiza em <canvas>. Procura o primeiro canvas dentro do
  // wrapper do EditorStage.
  const canvas = document.querySelector("canvas");
  if (!canvas) return undefined;
  try {
    // 240px wide thumbnail
    const tmp = document.createElement("canvas");
    const scale = 240 / canvas.width;
    tmp.width = 240;
    tmp.height = canvas.height * scale;
    const ctx = tmp.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(canvas, 0, 0, tmp.width, tmp.height);
    return tmp.toDataURL("image/jpeg", 0.6); // JPEG comprime mais que PNG
  } catch {
    return undefined;
  }
}
