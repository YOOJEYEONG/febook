#!/usr/bin/env node
/* 챕터 본문 조각(main 안쪽 내용)을 받아 완전한 HTML 페이지로 감싼다.
   사용법:  node tools/wrap.js <chapter-id> < body.html
   본문 조각 규칙:
     - 첫 줄에 <!--desc: 페이지 설명--> 을 두면 meta description 으로 쓴다.
     - <script data-quiz> … </script> 블록은 자동으로 스크립트 로드 뒤로 옮긴다. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
global.window = {};
require(path.join(root, "assets/data/toc.js"));
const FLAT = global.window.BOOK_FLAT;
const TOC = global.window.BOOK_TOC;

const id = process.argv[2];
if (!id) { console.error("사용법: node tools/wrap.js <chapter-id> < body.html"); process.exit(1); }
const ch = FLAT.find(c => c.id === id);
if (!ch) { console.error("toc.js 에 없는 챕터 id: " + id); process.exit(1); }
const part = TOC.parts.find(p => p.n === ch.part);

let body = fs.readFileSync(0, "utf8");

let desc = "";
body = body.replace(/^\s*<!--\s*desc:\s*([\s\S]*?)-->\s*\n?/, (_, d) => { desc = d.trim(); return ""; });
if (!desc) desc = `${ch.n}장 ${ch.title} — 프엔북, 비전공자를 위한 프론트엔드 완전 학습서.`;

let quiz = "";
body = body.replace(/<script data-quiz>([\s\S]*?)<\/script>\s*/g, (_, s) => { quiz = s.trim(); return ""; });

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const page = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${ch.n}장. ${esc(ch.title)} — 프엔북</title>
<meta name="description" content="${esc(desc)}">
<meta name="color-scheme" content="light dark">
<meta property="og:title" content="${ch.n}장. ${esc(ch.title)} — 프엔북">
<meta property="og:description" content="${esc(desc)}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📘</text></svg>">
<link rel="stylesheet" href="../assets/css/book.css">
</head>
<body data-base="../" data-chapter="${ch.id}">
<div id="app-header"></div>

<div class="layout">
  <nav class="sidebar" id="sidebar" aria-label="전체 목차"></nav>

  <main class="page">
    <p class="ch-eyebrow">${part.n}부 · ${esc(part.title)}</p>
    <h1>${ch.n}장. ${esc(ch.title)}</h1>

${body.trim()}

    <section class="quiz" id="quiz"></section>
  </main>

  <aside class="pagetoc" id="pagetoc" aria-label="이 챕터의 목차"></aside>
</div>

<script src="../assets/data/toc.js"></script>
<script src="../assets/data/glossary-data.js"></script>
<script src="../assets/js/app.js"></script>
<script src="../assets/js/glossary.js"></script>
<script src="../assets/js/runner.js"></script>
<script src="../assets/js/quiz.js"></script>
${quiz ? "<script>\n" + quiz + "\n</script>" : ""}
</body>
</html>
`;

fs.writeFileSync(path.join(root, "ch", id + ".html"), page);
process.stderr.write(`ch/${id}.html  (${page.length.toLocaleString()} bytes)\n`);
