#!/usr/bin/env node
/* 내부 링크와 앵커가 실제로 존재하는지 확인한다. */
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");

const pages = [];
for (const f of ["index.html", "glossary.html", "search.html"]) pages.push({ file: f, dir: "" });
for (const f of fs.readdirSync(path.join(root, "ch"))) pages.push({ file: "ch/" + f, dir: "ch" });

/* 예제 코드와 스크립트는 검사 대상이 아니다 (문서 안의 예시 주소가 잡히므로) */
function stripNonMarkup(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<pre[\s\S]*?<\/pre>/gi, "")
    .replace(/<textarea[\s\S]*?<\/textarea>/gi, "")
    .replace(/<code[\s\S]*?<\/code>/gi, "");
}

/* 각 파일의 id 목록 수집 */
const idsByFile = new Map();
for (const p of pages) {
  const raw = fs.readFileSync(path.join(root, p.file), "utf8");
  const html = stripNonMarkup(raw);
  const ids = new Set();
  const re = /\sid="([^"]+)"/g; let m;
  while ((m = re.exec(raw)) !== null) ids.add(m[1]);
  idsByFile.set(p.file, { html, ids });
}

let broken = 0, checked = 0;
for (const p of pages) {
  const { html } = idsByFile.get(p.file);
  const re = /href="([^"]+)"/g; let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    if (/^(https?:|mailto:|tel:|data:|#$)/.test(href)) continue;
    checked++;

    let target = href, hash = "";
    const hi = href.indexOf("#");
    if (hi >= 0) { target = href.slice(0, hi); hash = href.slice(hi + 1); }

    let resolved;
    if (target === "") resolved = p.file;
    else {
      const base = p.dir ? path.join(root, p.dir) : root;
      resolved = path.relative(root, path.resolve(base, target));
    }

    if (!fs.existsSync(path.join(root, resolved))) {
      console.error(`[파일 없음] ${p.file} → ${href}`); broken++; continue;
    }
    if (hash) {
      const entry = idsByFile.get(resolved.replace(/\\/g, "/"));
      if (entry && !entry.ids.has(hash)) {
        console.error(`[앵커 없음] ${p.file} → ${href}`); broken++;
      }
    }
  }
}
console.log(`내부 링크 ${checked}개 검사 · 문제 ${broken}건`);
process.exit(broken ? 1 : 0);
