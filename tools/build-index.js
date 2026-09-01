#!/usr/bin/env node
/* ch/*.html 을 읽어 검색 색인(assets/data/search-index.js)을 만든다.
   사용법: node tools/build-index.js */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
global.window = {};
require(path.join(root, "assets/data/toc.js"));
const FLAT = global.window.BOOK_FLAT;

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<textarea[\s\S]*?<\/textarea>/gi, " ")   /* 실행기 코드는 제외 */
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const index = [];
let missing = 0;

for (const chapter of FLAT) {
  const file = path.join(root, "ch", chapter.id + ".html");
  if (!fs.existsSync(file)) { missing++; console.error("없음:", chapter.id); continue; }

  const html = fs.readFileSync(file, "utf8");

  /* 본문(main) 영역만 */
  const mainMatch = html.match(/<main class="page">([\s\S]*?)<\/main>/);
  const main = mainMatch ? mainMatch[1] : html;

  /* 소제목 수집 */
  const headings = [];
  const headingRe = /<h([23])[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
  let m;
  while ((m = headingRe.exec(main)) !== null) {
    const text = stripTags(m[3]).replace(/#$/, "").trim();
    if (text) headings.push({ id: m[2], t: text });
  }

  /* 설명(meta description) */
  const descMatch = html.match(/<meta name="description" content="([^"]*)"/);

  const body = stripTags(main);

  index.push({
    n: chapter.n,
    id: chapter.id,
    t: chapter.title,
    p: chapter.partTitle,
    d: descMatch ? descMatch[1] : "",
    h: headings.map(h => h.t),
    a: headings,                       /* 앵커 이동용 */
    b: body.slice(0, 6000)             /* 본문 (용량 제한) */
  });
}

const out =
  "/* 자동 생성 파일 — tools/build-index.js 로 다시 만듭니다. 직접 수정하지 마세요. */\n" +
  "window.BOOK_INDEX = " + JSON.stringify(index) + ";\n";

fs.writeFileSync(path.join(root, "assets/data/search-index.js"), out);
console.log(`색인 생성: ${index.length}개 챕터, ${(out.length / 1024).toFixed(0)}KB` +
  (missing ? ` (누락 ${missing})` : ""));
