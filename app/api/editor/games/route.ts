/**
 * app/api/editor/games/route.ts
 *
 * GET ?dir=components/games
 * Escaneia a pasta passada (ou EDITOR_CONFIG.gamesDir por default)
 * e retorna lista de subpastas.
 */
import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";
import { EDITOR_CONFIG, prettifyId } from "@/editor.config";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Editor disabled in production" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  let dir = searchParams.get("dir") || EDITOR_CONFIG.gamesDir;

  // Sanitiza
  dir = dir.replace(/\.\./g, "").replace(/\/+/g, "/").replace(/^\/+|\/+$/g, "");
  if (!dir) dir = EDITOR_CONFIG.gamesDir;

  const projectRoot = process.cwd();
  const fullDir = path.join(projectRoot, dir);

  if (!fullDir.startsWith(projectRoot)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const entries = await readdir(fullDir);
    const games: { id: string; name: string }[] = [];

    for (const entry of entries) {
      if (entry.startsWith(".") || entry.startsWith("_") || entry === "node_modules") continue;
      const full = path.join(fullDir, entry);
      try {
        const s = await stat(full);
        if (s.isDirectory()) {
          games.push({ id: entry, name: prettifyId(entry) });
        }
      } catch {
        // ignora
      }
    }

    games.sort((a, b) => a.id.localeCompare(b.id));
    return NextResponse.json({ ok: true, dir, games });
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") {
      return NextResponse.json({ ok: true, dir, games: [], notFound: true });
    }
    return NextResponse.json(
      { error: "Failed to scan games dir", message: e.message },
      { status: 500 },
    );
  }
}
