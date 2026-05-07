/**
 * app/api/editor/load/route.ts
 *
 * GET ?game=slots — carrega o JSON salvo do jogo.
 */
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { EDITOR_CONFIG } from "@/editor.config";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Editor disabled in production" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const game = searchParams.get("game");

  if (!game || !/^[a-z0-9-]+$/i.test(game)) {
    return NextResponse.json(
      { error: "Invalid or missing game parameter" },
      { status: 400 },
    );
  }

  const jsonPath = path.join(process.cwd(), EDITOR_CONFIG.layoutsDir, `${game}.json`);

  try {
    const content = await readFile(jsonPath, "utf-8");
    const layout = JSON.parse(content);
    return NextResponse.json({ ok: true, layout });
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") {
      return NextResponse.json(
        { ok: false, error: "Layout not found, will create empty" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Failed to read layout", message: e.message },
      { status: 500 },
    );
  }
}
