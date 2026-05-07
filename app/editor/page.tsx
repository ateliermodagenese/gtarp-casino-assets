/**
 * app/editor/page.tsx
 *
 * Pagina raiz do Layout Editor. Bloqueada em producao.
 * Editor descobre jogos sozinho via /api/editor/games — sem hardcode.
 */
import { notFound } from "next/navigation";
import EditorRoot from "@/components/editor/EditorRoot";

export default function EditorPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <EditorRoot />;
}
