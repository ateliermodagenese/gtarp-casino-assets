/**
 * app/api/editor/list-files/route.ts
 *
 * GET ?dir=/assets/games/roulette/
 * Lista PNGs, JPGs, MP4s etc de uma pasta dentro de public/.
 */
import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";
import { EDITOR_CONFIG } from "@/editor.config";

const ALLOWED_EXT = /\.(png|jpg|jpeg|webp|gif|mp4|webm|mov)$/i;

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Editor disabled in production" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  let dir = searchParams.get("dir") || "/";

  dir = dir.replace(/\.\./g, "").replace(/\/+/g, "/");
  if (!dir.startsWith("/")) dir = "/" + dir;

  const publicDir = path.join(process.cwd(), EDITOR_CONFIG.publicDir);
  const fullDir = path.join(publicDir, dir);

  if (!fullDir.startsWith(publicDir)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const entries = await readdir(fullDir);
    const items: { name: string; type: "file" | "dir"; path: string; ext?: string }[] = [];

    for (const entry of entries) {
      if (entry.startsWith(".")) continue;
      const full = path.join(fullDir, entry);
      try {
        const s = await stat(full);
        const relPath = path.posix.join(dir, entry);
        if (s.isDirectory()) {
          items.push({ name: entry, type: "dir", path: relPath });
        } else if (ALLOWED_EXT.test(entry)) {
          const ext = entry.toLowerCase().split(".").pop();
          items.push({ name: entry, type: "file", path: relPath, ext });
        }
      } catch {
        // ignora
      }
    }

    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ ok: true, dir, items });
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") {
      return NextResponse.json({ ok: true, dir, items: [], notFound: true });
    }
    return NextResponse.json(
      { error: "Failed to read dir", message: e.message },
      { status: 500 },
    );
  }
}
