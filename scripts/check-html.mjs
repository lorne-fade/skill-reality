#!/usr/bin/env node
/**
 * check-html.mjs — guards index.html against two silent, page-killing mistakes
 * that the Design Component runtime in support.js makes possible.
 *
 * Run:  node scripts/check-html.mjs
 * Exits non-zero and prints file:line on any violation.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS
 *
 * support.js re-fetches the page's own source after boot and re-slices the
 * template out of it with a plain regex:
 *
 *     const openMatch = /<x-dc(?:\s[^>]*)?>/.exec(src);   // FIRST match wins
 *     const close     = src.lastIndexOf("</x-dc>");        // LAST match wins
 *
 * Neither has any idea what an HTML comment is. So a comment anywhere in the
 * document that happens to contain the literal text `<x-dc>` becomes the start
 * of "the template". Everything after it — the rest of the comment, the title,
 * the meta tags, the JSON-LD — is swallowed, re-parsed as markup, and rendered
 * in place of the real page.
 *
 * This is not theoretical. It happened while editing the document head: a
 * comment explaining the architecture mentioned the tag by name, and the result
 * was a page with two <title> elements and a body containing 29 characters.
 * There was no console error. Nothing failed loudly. It was only caught by
 * inspecting the rendered DOM.
 *
 * Separately, encodeCase() in support.js rewrites a set of runtime tag names
 * over the raw HTML string, also with no comment awareness:
 *
 *     html = html.replace(/<helmet(\s|>)/gi, "<sc-helmet$1");
 *     for (const [real, alias] of Object.entries(RAW_WRAP)) { ... }
 *
 * Measured on this page, those rewrites are NOT independently fatal — a comment
 * naming <helmet> or <table> renders fine on its own. But they operate on the
 * mis-sliced region above and shape the wreckage when the first rule is broken,
 * and there is no reason to write them in a comment anyway. Rule B catches them
 * as the latent hazard they are.
 * ---------------------------------------------------------------------------
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', '.vercel', 'scripts']);

/** Tag names encodeCase() rewrites, read out of support.js so this stays in
 *  sync if the generated runtime is rebuilt with a different set. */
function runtimeRewrittenTags(supportSrc) {
  const tags = new Set();

  // RAW_WRAP = { select: "sc-raw-select", table: "sc-raw-table", ... }
  const rawWrap = supportSrc.match(/RAW_WRAP\s*=\s*\{([\s\S]*?)\}/);
  if (rawWrap) {
    for (const m of rawWrap[1].matchAll(/^\s*([A-Za-z][\w-]*)\s*:/gm)) tags.add(m[1]);
  }

  // html.replace(/<helmet(\s|>)/gi, ...)  — and any sibling of the same shape
  for (const m of supportSrc.matchAll(/replace\(\s*\/<([a-z][\w-]*)\\?\(/gi)) tags.add(m[1]);

  // IMPORT_SELF_CLOSE_RE = new RegExp("<(x-import|dc-import)(" + ATTRS + ")/>")
  const imports = supportSrc.match(/"<\(([a-z|-]+)\)\("/i);
  if (imports) for (const t of imports[1].split('|')) tags.add(t);

  if (tags.size === 0) {
    console.error('check-html: could not read any rewritten tag names out of support.js.');
    console.error('            The generated runtime may have changed shape — update this script.');
    process.exit(2);
  }
  return [...tags].sort();
}

/** Every HTML comment in `src`, as {start, end, text}. */
function htmlComments(src) {
  const out = [];
  let i = 0;
  for (;;) {
    const open = src.indexOf('<!--', i);
    if (open === -1) break;
    let close = src.indexOf('-->', open + 4);
    if (close === -1) close = src.length; // unterminated; treat rest as comment
    out.push({ start: open, end: close + 3, text: src.slice(open, close + 3) });
    i = close + 3;
  }
  return out;
}

const lineOf = (src, idx) => src.slice(0, idx).split('\n').length;

function htmlFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) htmlFiles(p, acc);
    else if (name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const support = readFileSync(join(ROOT, 'support.js'), 'utf8');
const REWRITTEN = runtimeRewrittenTags(support);
const problems = [];

for (const file of htmlFiles(ROOT)) {
  const src = readFileSync(file, 'utf8');
  // Only Design Component documents are affected by any of this.
  if (!src.includes('<x-dc')) continue;
  const rel = relative(ROOT, file).split(sep).join('/');
  const comments = htmlComments(src);
  const inComment = (idx) => comments.some((c) => idx >= c.start && idx < c.end);

  // ---- Rule A: the x-dc markers must be unambiguous (the page-killer) ----
  const opens = [...src.matchAll(/<x-dc(?=[\s>])/gi)];
  const closes = [...src.matchAll(/<\/x-dc\s*>/gi)];

  for (const m of opens.filter((m) => inComment(m.index))) {
    problems.push({
      rel, line: lineOf(src, m.index), rule: 'A', fatal: true,
      msg: '`<x-dc` appears inside an HTML comment.',
      why: 'parseDcText() slices the template from the FIRST `<x-dc` in the raw source. '
         + 'A comment mentioning it becomes the start of the template and the real page is discarded.',
    });
  }
  for (const m of closes.filter((m) => inComment(m.index))) {
    problems.push({
      rel, line: lineOf(src, m.index), rule: 'A', fatal: true,
      msg: '`</x-dc>` appears inside an HTML comment.',
      why: 'parseDcText() ends the template at the LAST `</x-dc>` in the raw source, so this truncates it.',
    });
  }
  const realOpens = opens.filter((m) => !inComment(m.index)).length;
  const realCloses = closes.filter((m) => !inComment(m.index)).length;
  if (realOpens !== 1 || realCloses !== 1) {
    problems.push({
      rel, line: lineOf(src, (opens[0] ?? { index: 0 }).index), rule: 'A', fatal: true,
      msg: `expected exactly one <x-dc> and one </x-dc>; found ${realOpens} and ${realCloses}.`,
      why: 'The runtime assumes a single template element per document.',
    });
  }

  // ---- Rule B: runtime tag names in comments (latent hazard) ----
  const tagRe = new RegExp(`</?(${REWRITTEN.join('|')})(?=[\\s>/])`, 'gi');
  for (const c of comments) {
    for (const m of c.text.matchAll(tagRe)) {
      problems.push({
        rel, line: lineOf(src, c.start + m.index), rule: 'B', fatal: true,
        msg: `\`${m[0]}\` appears inside an HTML comment.`,
        why: 'encodeCase() rewrites this tag name across the raw HTML with no comment awareness. '
           + 'Harmless alone, but it corrupts the output once the template is mis-sliced.',
      });
    }
  }
}

if (problems.length === 0) {
  console.log(`check-html: OK — no runtime tag names written in comments.`);
  console.log(`            guarded names: x-dc (fatal), ${REWRITTEN.join(', ')}`);
  process.exit(0);
}

console.error(`\ncheck-html: ${problems.length} problem(s) found.\n`);
for (const p of problems) {
  console.error(`  ${p.rel}:${p.line}  [rule ${p.rule}]  ${p.msg}`);
  console.error(`      ${p.why}\n`);
}
console.error('  Fix: describe the tag in prose instead of angle brackets');
console.error('       e.g. "the helmet block", "the template element", "the title tag".\n');
process.exit(1);
