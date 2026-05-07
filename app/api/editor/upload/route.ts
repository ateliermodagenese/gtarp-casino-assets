import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(req: NextRequest) {
  try {
    const { base64, gameId, filename } = await req.json();

    if (!base64 || !filename) {
      return NextResponse.json({ ok: false, error: "base64 e filename obrigatorios" }, { status: 400 });
    }

    // Extrair dados do base64
    const match = base64.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ ok: false, error: "Formato base64 invalido" }, { status: 400 });
    }

    const buffer = Buffer.from(match[2], "base64");
    const safeGameId = (gameId || "unknown").replace(/[^a-zA-Z0-9-_]/g, "");
    const safeFilename = filename.replace(/[^a-zA-Z0-9-_.]/g, "");

    // Pasta destino: public/assets/games/[gameId]/uploads/
    const uploadDir = join(process.cwd(), "public", "assets", "games", safeGameId, "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, safeFilename);
    await writeFile(filePath, buffer);

    // URL relativa pro browser
    const url = `/assets/games/${safeGameId}/uploads/${safeFilename}`;

    return NextResponse.json({ ok: true, url, path: filePath });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
