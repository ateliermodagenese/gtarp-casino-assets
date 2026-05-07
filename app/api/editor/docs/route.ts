/**
 * app/api/editor/docs/route.ts
 *
 * GET ?file=NOME.md — serve documentos da pasta app/editor/docs/.
 */
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Editor disabled in production" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");

  if (!file || !/^[A-Z0-9_-]+\.md$/i.test(file)) {
    return NextResponse.json(
      { error: "Invalid file parameter (expected: NAME.md)" },
      { status: 400 },
    );
  }

  const docsDir = path.join(process.cwd(), "app", "editor", "docs");
  const fullPath = path.join(docsDir, file);

  if (!fullPath.startsWith(docsDir)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const content = await readFile(fullPath, "utf-8");
    return new NextResponse(content, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to read document", message: e.message },
      { status: 500 },
    );
  }
}
