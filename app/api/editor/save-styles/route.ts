/**
 * Fase 10 — Save cirurgico no .tsx
 *
 * Recebe mudancas do editor (estilo original como fingerprint + props alteradas)
 * e edita CIRURGICAMENTE o style={{...}} correspondente no .tsx.
 *
 * Abordagem: "fingerprint matching"
 *  - O editor envia as props CSS originais do elemento (antes de qualquer edicao)
 *  - A API busca em todos os .tsx do jogo o bloco style={{...}} que contem
 *    TODAS essas props com os mesmos valores
 *  - Ao encontrar, edita cirurgicamente SÓ as props que mudaram
 */
import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir, readdir, stat, copyFile } from "fs/promises";
import { join, relative } from "path";

/* ── Types ──────────────────────────────────────────────────────────────── */
interface ChangePayload {
  originalProps: Record<string, string>;
  changedProps: Record<string, string>;
  tag: string;
  text?: string;
  editorId?: string;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function kebabToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function escapeRx(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find all `style={{ … }}` regions in source.
 * Uses brace-counting so nested objects / ternaries are handled.
 */
function findStyleBlocks(src: string) {
  const out: { start: number; end: number; content: string; props: Record<string, string> }[] = [];
  const rx = /style\s*=\s*\{\{/g;
  let m: RegExpExecArray | null;

  while ((m = rx.exec(src)) !== null) {
    const outerStart = m.index;
    const innerStart = m.index + m[0].length;
    let depth = 2;
    let i = innerStart;
    while (i < src.length && depth > 0) {
      const ch = src[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      if (depth > 0) i++;
    }
    if (depth !== 0) continue;

    const innerEnd = i - 1;
    const outerEnd = i + 1;
    const content = src.slice(innerStart, innerEnd + 1);
    out.push({ start: outerStart, end: outerEnd, content, props: parseJsxStyle(content) });
  }
  return out;
}

/**
 * Parse the CONTENT between {{ and }} into camelCase key → raw-value string.
 * Handles strings, template literals, numbers, and nested expressions.
 */
function parseJsxStyle(block: string): Record<string, string> {
  const props: Record<string, string> = {};
  let i = 0;
  const len = block.length;

  while (i < len) {
    while (i < len && /[\s,]/.test(block[i])) i++;
    if (i >= len) break;

    // skip // comments
    if (block[i] === "/" && block[i + 1] === "/") { while (i < len && block[i] !== "\n") i++; continue; }
    // skip /* comments */
    if (block[i] === "/" && block[i + 1] === "*") { i += 2; while (i < len - 1 && !(block[i] === "*" && block[i + 1] === "/")) i++; i += 2; continue; }

    // key
    const ks = i;
    while (i < len && block[i] !== ":") i++;
    if (i >= len) break;
    const key = block.slice(ks, i).trim().replace(/['"]/g, "");
    i++; // skip ':'
    while (i < len && /\s/.test(block[i])) i++;
    if (i >= len) break;

    // value
    let val = "";
    const q = block[i];
    if (q === '"' || q === "'") {
      i++;
      const vs = i;
      while (i < len && block[i] !== q) { if (block[i] === "\\") i++; i++; }
      val = block.slice(vs, i);
      i++;
    } else if (q === "`") {
      i++;
      const vs = i;
      let td = 0;
      while (i < len) {
        if (block[i] === "$" && block[i + 1] === "{") { td++; i += 2; continue; }
        if (block[i] === "}" && td > 0) { td--; i++; continue; }
        if (block[i] === "`" && td === 0) break;
        i++;
      }
      val = block.slice(vs, i);
      i++;
    } else {
      const vs = i;
      let d = 0;
      while (i < len) {
        const c = block[i];
        if (c === "(" || c === "{" || c === "[") d++;
        else if (c === ")" || c === "}" || c === "]") { if (d === 0) break; d--; }
        else if ((c === "," || c === "\n") && d === 0) break;
        i++;
      }
      val = block.slice(vs, i).trim();
    }
    if (key) props[key] = val;
  }
  return props;
}

/**
 * Does `blockProps` contain enough of the `fingerprint` to count as a match?
 * Requires ≥ 70 % of fingerprint entries present with equal normalised values.
 */
function matchesFingerprint(
  blockProps: Record<string, string>,
  fingerprint: Record<string, string>,
): boolean {
  const entries = Object.entries(fingerprint);
  if (entries.length === 0) return false;

  let hits = 0;
  for (const [kebab, fpVal] of entries) {
    const camel = kebabToCamel(kebab);
    const bv = blockProps[camel];
    if (bv === undefined) continue;
    const a = bv.trim().replace(/;$/, "").toLowerCase().replace(/["']/g, "");
    const b = fpVal.trim().replace(/;$/, "").toLowerCase().replace(/["']/g, "");
    if (a === b) { hits++; continue; }
    // "0" vs "0px"
    if ((a === "0" && b === "0px") || (a === "0px" && b === "0")) { hits++; continue; }
  }
  return hits >= Math.max(1, Math.ceil(entries.length * 0.7));
}

/** Format a raw CSS value as a JSX value literal */
function jsxVal(v: string): string {
  if (/^-?\d+(\.\d+)?$/.test(v)) return v;
  return `"${v.replace(/"/g, '\\"')}"`;
}

/** Detect leading whitespace used inside a block */
function indent(block: string): string {
  for (const l of block.split("\n")) {
    const m = l.match(/^(\s{2,})/);
    if (m) return m[1];
  }
  return "    ";
}

/**
 * Patch a style block: update existing props and append new ones.
 * Returns the NEW inner content (between {{ and }}).
 */
function patchBlock(
  content: string,
  changedProps: Record<string, string>,
): string {
  let out = content;
  for (const [kebab, newVal] of Object.entries(changedProps)) {
    const camel = kebabToCamel(kebab);
    const jv = jsxVal(newVal);

    // Try to replace existing prop
    const rx = new RegExp(
      `(${escapeRx(camel)})\\s*:\\s*(?:"(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|` + "`(?:[^`])*`" + `|[^,}\\n]+)`,
    );
    if (rx.test(out)) {
      out = out.replace(rx, `${camel}: ${jv}`);
    } else {
      // Append
      const trimmed = out.trimEnd();
      const comma = trimmed.length > 0 && !trimmed.endsWith(",") ? "," : "";
      out = trimmed + comma + `\n${indent(content)}${camel}: ${jv},`;
    }
  }
  return out;
}

/** Recursively find .tsx files, skipping bkp/ */
async function findTsx(dir: string): Promise<string[]> {
  const res: string[] = [];
  try {
    for (const e of await readdir(dir)) {
      if (e === "bkp" || e === "node_modules" || e.startsWith(".")) continue;
      const f = join(dir, e);
      const s2 = await stat(f);
      if (s2.isDirectory()) res.push(...(await findTsx(f)));
      else if (e.endsWith(".tsx")) res.push(f);
    }
  } catch { /* */ }
  return res;
}

/* ── POST handler ────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const { gameId, changes, timestamp } = await req.json();
    if (!gameId || !Array.isArray(changes) || changes.length === 0) {
      return NextResponse.json({ ok: false, error: "gameId e changes[] obrigatorios" }, { status: 400 });
    }

    const root = process.cwd();
    const gameDir = join(root, "components", "games", gameId);
    if (!gameDir.startsWith(root)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // Backup
    const bkpDir = join(gameDir, "bkp", `editor-${Date.now()}`);
    await mkdir(bkpDir, { recursive: true });
    await writeFile(join(bkpDir, "changes.json"), JSON.stringify({ gameId, changes, timestamp }, null, 2));

    // Load .tsx sources
    const tsxFiles = await findTsx(gameDir);
    if (tsxFiles.length === 0) {
      return NextResponse.json({ ok: false, error: `Nenhum .tsx em ${gameId}/` }, { status: 404 });
    }
    const sources = new Map<string, string>();
    for (const f of tsxFiles) sources.set(f, await readFile(f, "utf-8"));

    const log: Array<{ file: string; editorId?: string; tag: string; props: string[]; ok: boolean }> = [];
    let edits = 0;
    const touched = new Set<string>();

    for (const ch of changes as ChangePayload[]) {
      const { originalProps, changedProps, tag, editorId } = ch;
      if (!changedProps || Object.keys(changedProps).length === 0) {
        log.push({ file: "-", tag, editorId, props: [], ok: false });
        continue;
      }

      // Clean fingerprint: drop empty / trivial values
      const fp: Record<string, string> = {};
      for (const [k, v] of Object.entries(originalProps || {})) {
        if (!v || v === "none" || v === "auto" || v === "normal" || k.startsWith("data-editor")) continue;
        fp[k] = v;
      }
      if (Object.keys(fp).length < 2) {
        log.push({ file: "(fp<2)", tag, editorId, props: Object.keys(changedProps), ok: false });
        continue;
      }

      let found = false;
      for (const [fpath, src] of sources) {
        const blocks = findStyleBlocks(src);
        for (const blk of blocks) {
          if (!matchesFingerprint(blk.props, fp)) continue;

          // Backup file once
          if (!touched.has(fpath)) {
            const bkpName = relative(root, fpath).replace(/[\\/]/g, "__");
            try { await copyFile(fpath, join(bkpDir, bkpName)); } catch { /* */ }
          }

          // Patch
          const patched = patchBlock(blk.content, changedProps);
          const ind = indent(blk.content);
          const shortInd = ind.length >= 2 ? ind.slice(2) : "";
          const newAttr = `style={{\n${patched}\n${shortInd}}}`;
          const updated = src.slice(0, blk.start) + newAttr + src.slice(blk.end);

          sources.set(fpath, updated);
          touched.add(fpath);
          edits++;
          log.push({ file: relative(root, fpath), tag, editorId, props: Object.keys(changedProps), ok: true });
          found = true;
          break;
        }
        if (found) break;
      }

      if (!found) {
        log.push({ file: "(nao encontrado)", tag, editorId, props: Object.keys(changedProps), ok: false });
      }
    }

    // Write modified files
    for (const fp of touched) {
      await writeFile(fp, sources.get(fp)!, "utf-8");
    }

    // Save log
    await writeFile(join(bkpDir, "edit-log.json"), JSON.stringify({ log, edits, files: [...touched].map(f => relative(root, f)) }, null, 2));

    return NextResponse.json({
      ok: true,
      filesChanged: touched.size,
      totalEdits: edits,
      unmatched: log.filter(e => !e.ok).length,
      backupPath: relative(root, bkpDir),
      log,
    });
  } catch (err) {
    console.error("[save-styles]", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
