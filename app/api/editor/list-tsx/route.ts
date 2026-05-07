/**
 * app/api/editor/list-tsx/route.ts
 *
 * GET ?game=blackjack&dir=components/games
 * Lista arquivos .tsx e .ts de um jogo pra o painel esquerdo do editor.
 * Retorna nome do arquivo, path relativo, e tamanho.
 */
import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";

const TSX_EXT = /\.(tsx|ts)$/i;
const IGNORE = /^(index\.ts|.*\.d\.ts|.*\.test\..*)$/i;

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Editor disabled in production" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const game = searchParams.get("game") || "";
  const gamesDir = searchParams.get("dir") || "components/games";

  if (!game) {
    return NextResponse.json({ error: "Missing game param" }, { status: 400 });
  }

  const cleanDir = gamesDir.replace(/\.\./g, "").replace(/[\\/]+$/, "");
  const fullDir = path.join(process.cwd(), cleanDir, game);

  try {
    const entries = await readdir(fullDir);
    const files: { name: string; path: string; size: number; isTsx: boolean }[] = [];

    for (const entry of entries) {
      if (entry.startsWith(".")) continue;
      if (!TSX_EXT.test(entry)) continue;
      if (IGNORE.test(entry)) continue;

      const full = path.join(fullDir, entry);
      try {
        const s = await stat(full);
        if (!s.isFile()) continue;
        files.push({
          name: entry,
          path: `${cleanDir}/${game}/${entry}`,
          size: s.size,
          isTsx: entry.endsWith(".tsx"),
        });
      } catch {
        // ignora
      }
    }

    // TSX primeiro, depois por nome
    files.sort((a, b) => {
      if (a.isTsx !== b.isTsx) return a.isTsx ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ ok: true, game, files });
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") {
      return NextResponse.json({ ok: true, game, files: [], notFound: true });
    }
    return NextResponse.json(
      { error: "Failed to read dir", message: e.message },
      { status: 500 },
    );
  }
}
