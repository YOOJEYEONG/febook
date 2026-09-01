#!/usr/bin/env node
/* 참고 자료의 외부 링크가 살아 있는지 확인한다. */
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");

const links = new Map();   /* url -> [사용된 파일들] */
for (const dir of ["", "ch"]) {
  const base = dir ? path.join(root, dir) : root;
  for (const f of fs.readdirSync(base)) {
    if (!f.endsWith(".html")) continue;
    const rel = dir ? `${dir}/${f}` : f;
    const html = fs.readFileSync(path.join(base, f), "utf8")
      .replace(/<pre[\s\S]*?<\/pre>/gi, "")
      .replace(/<textarea[\s\S]*?<\/textarea>/gi, "");
    const re = /href="(https?:\/\/[^"]+)"/g; let m;
    while ((m = re.exec(html)) !== null) {
      const url = m[1];
      if (!links.has(url)) links.set(url, []);
      links.get(url).push(rel);
    }
  }
}

const urls = [...links.keys()];
console.error(`외부 링크 ${urls.length}개 (중복 제거) 확인 중…`);

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

async function check(url) {
  for (const method of ["HEAD", "GET"]) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(url, {
        method, redirect: "follow", signal: controller.signal,
        headers: { "User-Agent": UA, "Accept-Language": "ko,en" }
      });
      clearTimeout(timer);
      if (res.status < 400) return { url, status: res.status, final: res.url };
      if (method === "GET") return { url, status: res.status, final: res.url };
    } catch (e) {
      if (method === "GET") return { url, status: 0, error: e.name };
    }
  }
}

(async () => {
  const results = [];
  const CONCURRENCY = 8;
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    results.push(...await Promise.all(batch.map(check)));
    process.stderr.write(".");
  }
  process.stderr.write("\n");

  const bad = results.filter(r => r.status === 0 || r.status >= 400);
  const redirected = results.filter(r => r.final && r.final !== r.url && !bad.includes(r));

  console.log(`\n=== 실패 ${bad.length}건 ===`);
  for (const r of bad) {
    console.log(`${r.status || r.error}  ${r.url}`);
    console.log(`      ← ${[...new Set(links.get(r.url))].join(", ")}`);
  }
  console.log(`\n=== 리다이렉트 ${redirected.length}건 (참고용) ===`);
  for (const r of redirected.slice(0, 40)) {
    console.log(`  ${r.url}\n   → ${r.final}`);
  }
})();
