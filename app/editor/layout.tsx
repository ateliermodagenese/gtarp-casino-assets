/**
 * app/editor/layout.tsx
 *
 * Layout proprio do editor. Nao herda nada do casino.
 *
 * EM PALAVRAS SIMPLES: a estrutura visual base do editor (titulo da
 * aba, fonte, fundo escuro). Sem header do casino, sem efeitos.
 *
 * TECNICAMENTE: nested layout do Next App Router que sobrescreve
 * elementos do layout pai pra renderizar so o editor.
 */
import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Layout Editor — Blackout Casino",
  description: "Ferramenta interna de posicionamento visual de elementos.",
};

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0806",
        color: "#e5e5e5",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {children}
    </div>
  );
}
