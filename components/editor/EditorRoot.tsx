"use client";

/**
 * EditorRoot.tsx
 *
 * Wrapper minimo que carrega EditorClient via dynamic({ ssr: false }).
 * Isso impede o Next de tentar fazer SSR dos componentes que tocam
 * Konva, evitando o erro "Can't resolve 'canvas'".
 *
 * Toda a logica do editor esta em EditorClient.tsx.
 */
import dynamic from "next/dynamic";

const EditorClient = dynamic(() => import("./EditorClient"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        color: "#D4A843",
        fontSize: 14,
      }}
    >
      Carregando editor...
    </div>
  ),
});

export default function EditorRoot() {
  return <EditorClient />;
}
