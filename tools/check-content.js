#!/usr/bin/env node
/* 퀴즈 데이터와 챕터 상호 참조를 검증한다. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.resolve(__dirname, "..");
global.window = {};
require(path.join(root, "assets/data/toc.js"));
const FLAT = global.window.BOOK_FLAT;
const byNum = new Map(FLAT.map(c => [c.n, c]));

let quizTotal = 0, quizProblems = 0, refProblems = 0;
const refs = [];

for (const chapter of FLAT) {
  const file = path.join(root, "src", chapter.id + ".html");
  if (!fs.existsSync(file)) { console.log("원본 없음:", chapter.id); continue; }
  const src = fs.readFileSync(file, "utf8");

  /* ---- 퀴즈 검증 ---- */
  const qm = src.match(/<script data-quiz>([\s\S]*?)<\/script>/);
  if (!qm) { console.log(`[퀴즈 없음] ${chapter.n}장 ${chapter.id}`); quizProblems++; }
  else {
    let items = null;
    const sandbox = { FB_QUIZ: (x) => { items = x; } };
    try { vm.createContext(sandbox); vm.runInContext(qm[1], sandbox, { timeout: 3000 }); }
    catch (e) { console.log(`[퀴즈 문법오류] ${chapter.n}장: ${e.message}`); quizProblems++; }

    if (items) {
      items.forEach((q, i) => {
        quizTotal++;
        const at = `${chapter.n}장 Q${i + 1}`;
        if (!q.q || !q.q.trim()) { console.log(`[질문 비어있음] ${at}`); quizProblems++; }
        if (!Array.isArray(q.o) || q.o.length < 2) { console.log(`[보기 부족] ${at}`); quizProblems++; return; }
        if (typeof q.a !== "number" || q.a < 0 || q.a >= q.o.length) {
          console.log(`[정답 범위 오류] ${at}: a=${q.a}, 보기 ${q.o.length}개`); quizProblems++;
        }
        if (!q.e || q.e.trim().length < 20) { console.log(`[해설 부실] ${at}`); quizProblems++; }
        const plain = q.o.map(o => String(o).replace(/<[^>]+>/g, "").trim());
        if (new Set(plain).size !== plain.length) { console.log(`[보기 중복] ${at}`); quizProblems++; }
        if (plain.some(o => !o)) { console.log(`[빈 보기] ${at}`); quizProblems++; }
      });
    }
  }

  /* ---- 챕터 상호 참조 ---- */
  const body = src.replace(/<script[\s\S]*?<\/script>/g, "");
  const re = /(\d{1,2})\s*장/g; let m;
  const seen = new Set();
  while ((m = re.exec(body)) !== null) {
    const n = Number(m[1]);
    if (seen.has(n)) continue;
    seen.add(n);
    if (!byNum.has(n)) { console.log(`[없는 챕터 참조] ${chapter.n}장 → ${n}장`); refProblems++; continue; }
    refs.push({ from: chapter.n, to: n, toTitle: byNum.get(n).title });
  }
}

console.log(`\n퀴즈 ${quizTotal}문항 · 문제 ${quizProblems}건`);
console.log(`상호 참조 ${refs.length}건 · 없는 챕터 참조 ${refProblems}건`);
fs.writeFileSync("/tmp/refs.json", JSON.stringify(refs, null, 0));
