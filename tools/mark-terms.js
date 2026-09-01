#!/usr/bin/env node
/* 챕터 본문에서 용어 사전에 있는 단어의 '첫 등장'에 밑줄 표시를 붙인다.
   안전 규칙:
   - 태그 바깥의 '텍스트 노드'만 건드린다 (속성값·태그 이름은 절대 건드리지 않음)
   - <pre> <code> <textarea> <script> <style> <a> <h1~h6> 안은 제외
   - 이미 표시된 곳(.term) 안은 제외
   - 챕터당 용어 하나에 한 번만
   - 그 용어의 설명 챕터 자신에서는 표시하지 않는다
   사용법: node tools/mark-terms.js */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
global.window = {};
require(path.join(root, "assets/data/glossary-data.js"));
require(path.join(root, "assets/data/toc.js"));
const GLOSSARY = global.window.BOOK_GLOSSARY;
const FLAT = global.window.BOOK_FLAT;

/* 표시 후보: 한글 이름이 2자 이상이고, 너무 흔한 단어가 아닌 것 */
const TOO_COMMON = new Set(["웹", "서버", "태그", "속성", "요소", "캐시", "포트", "상속", "합성", "렌더링", "모듈", "함수", "라이브러리"]);
const candidates = [];
for (const [key, entry] of Object.entries(GLOSSARY)) {
  const names = [];
  if (entry.ko && entry.ko.length >= 2 && !TOO_COMMON.has(entry.ko)) names.push(entry.ko);
  /* 영문 이름은 대문자로 시작하는 고유명사만 (오탐 방지) */
  if (entry.en && /^[A-Z][A-Za-z0-9.\-]{2,}$/.test(entry.en) && entry.en !== entry.ko) names.push(entry.en);
  for (const name of names) candidates.push({ key, name, ch: entry.ch });
}
/* 긴 이름부터 먼저 매칭 (부분 일치 방지) */
candidates.sort((a, b) => b.name.length - a.name.length);

const BLOCKED_OPEN = /<(pre|code|textarea|script|style|a|h[1-6])\b/i;
const BLOCKED_CLOSE = /<\/(pre|code|textarea|script|style|a|h[1-6])>/i;

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

let totalMarked = 0;
let filesChanged = 0;

for (const chapter of FLAT) {
  const file = path.join(root, "ch", chapter.id + ".html");
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, "utf8");

  const mainStart = html.indexOf('<main class="page">');
  const mainEnd = html.indexOf("</main>");
  if (mainStart < 0 || mainEnd < 0) continue;

  const before = html.slice(0, mainStart);
  const after = html.slice(mainEnd);
  let main = html.slice(mainStart, mainEnd);

  /* 챕터 머리말(부 이름)에는 표시하지 않는다 — 빵부스러기에 밑줄이 생기면 어색합니다 */
  const eyebrowRe = /<p class="ch-eyebrow">[\s\S]*?<\/p>/;
  const eyebrow = (main.match(eyebrowRe) || [null])[0];
  if (eyebrow) main = main.replace(eyebrowRe, "@@EYEBROW@@");

  /* 태그와 텍스트로 쪼갠다 */
  const parts = main.split(/(<[^>]+>)/);
  let depth = 0;              /* 제외 영역 깊이 */
  const usedKeys = new Set();
  let marked = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith("<")) {
      if (BLOCKED_CLOSE.test(part)) depth = Math.max(0, depth - 1);
      else if (BLOCKED_OPEN.test(part) && !part.endsWith("/>")) depth++;
      continue;
    }
    if (depth > 0 || !part.trim()) continue;

    /* 원본 텍스트에서 '위치만' 모은 뒤 한 번에 조립한다.
       순차 치환을 하면 방금 넣은 <span class="term" …> 마크업의 속성 글자를
       다음 용어가 다시 매칭해 태그가 깨진다. (예: class 라는 용어) */
    const text = part;
    const hits = [];
    for (const cand of candidates) {
      if (usedKeys.has(cand.key)) continue;
      if (cand.ch === chapter.id) continue;          /* 자기 챕터에서는 표시 안 함 */
      const idx = text.search(new RegExp(escapeRe(cand.name)));
      if (idx < 0) continue;
      const end = idx + cand.name.length;
      /* 이미 잡힌 구간과 겹치면 건너뛴다 (긴 이름이 먼저 잡는다) */
      if (hits.some(h => idx < h.end && end > h.start)) continue;
      hits.push({ start: idx, end, cand });
      usedKeys.add(cand.key);
    }
    if (hits.length) {
      hits.sort((a, b) => a.start - b.start);
      let out = "", pos = 0;
      for (const h of hits) {
        out += text.slice(pos, h.start) +
          '<span class="term" data-term="' + h.cand.key + '">' + h.cand.name + "</span>";
        pos = h.end;
        marked++;
      }
      parts[i] = out + text.slice(pos);
    } else {
      parts[i] = text;
    }
  }

  if (marked > 0) {
    main = parts.join("");
    if (eyebrow) main = main.replace("@@EYEBROW@@", eyebrow);
    fs.writeFileSync(file, before + main + after);
    totalMarked += marked;
    filesChanged++;
  }
}

console.log(`용어 표시: ${totalMarked}곳, ${filesChanged}개 챕터`);
