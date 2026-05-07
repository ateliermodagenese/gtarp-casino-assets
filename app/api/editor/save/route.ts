/**
 * app/api/editor/save/route.ts
 *
 * POST salva layout no disco. Bloqueia em producao.
 * Aceita gamesDir no body pra escolher onde escrever o [Jogo]Layout.ts.
 */
import { NextResponse } from "next/server";
import { writeFile, mkdir, copyFile, access } from "fs/promises";
import path from "path";
import { z } from "zod";
import { generateLayoutCode } from "@/components/editor/utils/codegen";
import { EDITOR_CONFIG, resolveLayoutPath } from "@/editor.config";
import type { GameLayout } from "@/components/editor/state/schema";

const layoutSchema = z.object({
  version: z.literal(1),
  game: z.string().min(1),
  baseResolution: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  scenes: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string(),
        background: z.union([
          z.object({ type: z.literal("image"), src: z.string() }),
          z.object({
            type: z.literal("video"),
            src: z.string(),
            poster: z.string().optional(),
          }),
        ]),
        elements: z.array(z.record(z.string(), z.unknown())),
        notes: z.string().optional(),
      }),
    )
    .min(1),
  defaultSceneId: z.string(),
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    notes: z.string().optional(),
  }),
});

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Editor disabled in production" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const wrapper = body as { layout?: unknown; gamesDir?: string };
  const layoutRaw = wrapper.layout ?? body;
  const gamesDir = (wrapper.gamesDir || EDITOR_CONFIG.gamesDir)
    .replace(/\.\./g, "")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "");

  const parsed = layoutSchema.safeParse(layoutRaw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid layout schema", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const layout = parsed.data as unknown as GameLayout;

  if (!/^[a-z0-9-]+$/i.test(layout.game)) {
    return NextResponse.json(
      { error: `Invalid game id format: ${layout.game}` },
      { status: 400 },
    );
  }

  try {
    const layoutsDir = path.join(process.cwd(), EDITOR_CONFIG.layoutsDir);
    const backupsDir = path.join(process.cwd(), EDITOR_CONFIG.backupsDir);
    await mkdir(layoutsDir, { recursive: true });
    await mkdir(backupsDir, { recursive: true });

    const jsonPath = path.join(layoutsDir, `${layout.game}.json`);
    const tsPath = path.join(process.cwd(), resolveLayoutPath(layout.game, gamesDir));

    try {
      await access(jsonPath);
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = path.join(backupsDir, `${layout.game}-${stamp}.json`);
      await copyFile(jsonPath, backupPath);
    } catch {}

    await writeFile(jsonPath, JSON.stringify(layout, null, 2), "utf-8");

    const tsDir = path.dirname(tsPath);
    await mkdir(tsDir, { recursive: true });

    try {
      await access(tsPath);
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = path.join(backupsDir, `${path.basename(tsPath, ".ts")}-${stamp}.ts`);
      await copyFile(tsPath, backupPath);
    } catch {}

    const code = generateLayoutCode(layout);
    await writeFile(tsPath, code, "utf-8");

    return NextResponse.json({
      ok: true,
      jsonPath: path.relative(process.cwd(), jsonPath),
      tsPath: path.relative(process.cwd(), tsPath),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to write files",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
