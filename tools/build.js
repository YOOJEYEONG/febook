#!/usr/bin/env node
/* 전체 빌드: 챕터 생성 → 용어 표시 → 검색 색인 생성
   src/*.html 을 고친 뒤 이것만 실행하면 됩니다.
   사용법: node tools/build.js */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const run = (script) =>
  execFileSync("node", [path.join(root, "tools", script)], { stdio: "inherit" });

/* 1. 모든 챕터 페이지를 src 에서 다시 생성 (이전 결과를 덮어써 멱등성 확보) */
const sources = fs.readdirSync(path.join(root, "src")).filter((f) => f.endsWith(".html"));
let built = 0;
for (const file of sources) {
  const id = file.replace(/\.html$/, "");
  const body = fs.readFileSync(path.join(root, "src", file));
  execFileSync("node", [path.join(root, "tools", "wrap.js"), id], { input: body, stdio: ["pipe", "ignore", "pipe"] });
  built++;
}
console.log(`챕터 생성: ${built}개`);

/* 2. 용어 자동 표시 */
run("mark-terms.js");

/* 3. 검색 색인 */
run("build-index.js");

console.log("빌드 완료.");
