/* ============================================================
   프엔북 공통 스크립트
   - 헤더 / 사이드바 목차 / 페이지 내 목차 / 이전·다음 / 모바일 바 생성
   - 테마, 글자 크기, 읽음 진도 저장 (localStorage, 실패해도 본문은 정상)
   - 코드 문법 강조, 헤딩 앵커
   - 헤더 검색 자동완성
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 저장소: 어떤 환경에서도 예외로 페이지를 죽이지 않는다 ---------- */
  var store = {
    ok: (function () {
      try { var k = "__fb__"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return true; }
      catch (e) { return false; }
    })(),
    get: function (key, fallback) {
      if (!this.ok) return fallback;
      try { var v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set: function (key, value) {
      if (!this.ok) return false;
      try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
    }
  };

  var K_PROGRESS = "fenbook:progress";
  var K_THEME    = "fenbook:theme";
  var K_FONT     = "fenbook:font";

  var body    = document.body;
  var BASE    = body.getAttribute("data-base") || "";   /* "" 또는 "../" */
  var CHAPTER = body.getAttribute("data-chapter") || null;
  var PAGE    = body.getAttribute("data-page") || "";

  var TOC  = window.BOOK_TOC  || { parts: [] };
  var FLAT = window.BOOK_FLAT || [];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  /* ---------- 진도 ---------- */
  var progress = store.get(K_PROGRESS, {});
  function isRead(id) { return !!(progress[id] && progress[id].read); }
  function setRead(id, on) {
    if (!progress[id]) progress[id] = {};
    progress[id].read = !!on;
    progress[id].ts = Date.now();
    store.set(K_PROGRESS, progress);
    document.dispatchEvent(new CustomEvent("fb:progress", { detail: { id: id } }));
  }
  function saveQuiz(id, score, total) {
    if (!progress[id]) progress[id] = {};
    progress[id].quiz = { score: score, total: total, ts: Date.now() };
    store.set(K_PROGRESS, progress);
    document.dispatchEvent(new CustomEvent("fb:progress", { detail: { id: id } }));
  }
  function readCount() { return FLAT.filter(function (c) { return isRead(c.id); }).length; }

  /* ---------- 테마 ---------- */
  function applyTheme(mode) {
    /* mode: "light" | "dark" | "auto" */
    var root = document.documentElement;
    if (mode === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", mode);
    store.set(K_THEME, mode);
  }
  function currentTheme() { return store.get(K_THEME, "auto"); }
  function effectiveDark() {
    var m = currentTheme();
    if (m === "dark") return true;
    if (m === "light") return false;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function cycleTheme() {
    var next = effectiveDark() ? "light" : "dark";
    applyTheme(next);
    updateThemeIcon();
  }
  function updateThemeIcon() {
    var b = document.getElementById("theme-btn");
    if (!b) return;
    var dark = effectiveDark();
    b.innerHTML = dark ? ICON.sun : ICON.moon;
    b.setAttribute("aria-label", dark ? "밝은 테마로 전환" : "어두운 테마로 전환");
    b.setAttribute("title", b.getAttribute("aria-label"));
  }

  /* ---------- 글자 크기 ---------- */
  var FONTS = [15.5, 17, 19, 21];
  function applyFont(i) {
    var idx = Math.min(Math.max(i, 0), FONTS.length - 1);
    document.documentElement.style.setProperty("--reading", FONTS[idx] + "px");
    store.set(K_FONT, idx);
    return idx;
  }

  /* ---------- 아이콘 ---------- */
  var ICON = {
    menu:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    close:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    sun:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    text:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V5h16v2M9 5v14M15 9v10M12 19h6"/></svg>',
    book:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 012-2h13v18H6a2 2 0 01-2-2z"/><path d="M9 3v18"/></svg>'
  };

  /* ---------- 헤더 ---------- */
  function buildHeader() {
    var mount = document.getElementById("app-header");
    if (!mount) return;
    var h = el(
      '<header class="hdr">' +
        '<button class="icon-btn" id="menu-btn" aria-label="목차 열기" aria-expanded="false">' + ICON.menu + '</button>' +
        '<a class="hdr-brand" href="' + BASE + 'index.html">프<span>엔</span>북</a>' +
        '<div class="hdr-search">' + ICON.search +
          '<input type="search" id="q" placeholder="검색 (단축키 /)" autocomplete="off" ' +
          'aria-label="본문 검색" role="combobox" aria-expanded="false" aria-controls="search-pop">' +
          '<div class="search-pop" id="search-pop" role="listbox"></div>' +
        '</div>' +
        '<div class="hdr-spacer"></div>' +
        '<a class="icon-btn" href="' + BASE + 'glossary.html" aria-label="용어 사전" title="용어 사전">' + ICON.book + '</a>' +
        '<button class="icon-btn" id="font-btn" aria-label="글자 크기 변경" title="글자 크기 변경">' + ICON.text + '</button>' +
        '<button class="icon-btn" id="theme-btn" aria-label="테마 전환"></button>' +
      '</header>'
    );
    mount.replaceWith(h);

    document.getElementById("theme-btn").addEventListener("click", cycleTheme);
    updateThemeIcon();

    var fontIdx = store.get(K_FONT, 1);
    fontIdx = applyFont(fontIdx);
    document.getElementById("font-btn").addEventListener("click", function () {
      fontIdx = applyFont((fontIdx + 1) % FONTS.length);
    });

    var mb = document.getElementById("menu-btn");
    mb.addEventListener("click", function () {
      var open = body.classList.toggle("nav-open");
      mb.setAttribute("aria-expanded", String(open));
    });

    initSearch();
  }

  /* ---------- 사이드바 ---------- */
  function buildSidebar() {
    var sb = document.getElementById("sidebar");
    if (!sb) return;
    var html = '<button class="icon-btn sb-close" id="sb-close" aria-label="목차 닫기">' + ICON.close + '</button>';
    TOC.parts.forEach(function (p) {
      var open = !CHAPTER || p.chapters.some(function (c) { return c.id === CHAPTER; });
      html += '<details class="sb-part"' + (open ? " open" : "") + '>' +
        '<summary><span class="sb-part-n">' + p.n + '부</span> ' + esc(p.title) + '</summary>' +
        '<ul class="sb-list">' +
        p.chapters.map(function (c) {
          var cur = c.id === CHAPTER ? ' aria-current="page"' : "";
          return '<li><a href="' + BASE + 'ch/' + c.id + '.html"' + cur + ' data-ch="' + c.id + '">' +
            '<span class="sb-num">' + c.n + '</span>' +
            '<span class="sb-t">' + esc(c.title) + '</span>' +
            '<span class="sb-done" data-done="' + c.id + '">' + (isRead(c.id) ? "✓" : "") + '</span>' +
            '</a></li>';
        }).join("") +
        '</ul></details>';
    });
    sb.innerHTML = html;

    var close = document.getElementById("sb-close");
    if (close) close.addEventListener("click", function () {
      body.classList.remove("nav-open");
      var mb = document.getElementById("menu-btn");
      if (mb) mb.setAttribute("aria-expanded", "false");
    });

    var cur = sb.querySelector('[aria-current="page"]');
    if (cur) {
      /* 현재 챕터가 사이드바 화면 밖이면 보이도록 스크롤 (페이지 전체는 움직이지 않게) */
      var top = cur.offsetTop - sb.clientHeight / 2;
      if (top > 0) sb.scrollTop = top;
    }
  }

  function buildScrim() {
    if (document.querySelector(".scrim")) return;
    var s = el('<div class="scrim"></div>');
    s.addEventListener("click", function () {
      body.classList.remove("nav-open");
      var mb = document.getElementById("menu-btn");
      if (mb) mb.setAttribute("aria-expanded", "false");
    });
    body.appendChild(s);
  }

  /* ---------- 헤딩 id + 앵커 + 페이지 내 목차 ---------- */
  function slugify(text) {
    return text.trim().toLowerCase()
      .replace(/[^\w\uac00-\ud7a3\s-]/g, "")
      .replace(/\s+/g, "-").slice(0, 60) || "s";
  }
  function buildPageToc() {
    var main = document.querySelector("main.page");
    var box = document.getElementById("pagetoc");
    if (!main) return;
    var heads = Array.prototype.slice.call(main.querySelectorAll("h2, h3"))
      .filter(function (h) { return !h.closest(".ch-goals, .quiz, .box"); });
    var used = {};
    heads.forEach(function (h) {
      if (!h.id) {
        var s = slugify(h.textContent);
        while (used[s] || document.getElementById(s)) s += "-x";
        h.id = s;
      }
      used[h.id] = true;
      var a = document.createElement("a");
      a.className = "anchor"; a.href = "#" + h.id;
      a.setAttribute("aria-label", "이 절의 링크"); a.textContent = "#";
      h.appendChild(a);
    });
    if (!box || heads.length < 2) { if (box) box.style.display = "none"; return; }

    box.innerHTML = '<h2>' + (CHAPTER ? "이 챕터의 내용" : "이 페이지의 내용") + '</h2><ul>' + heads.map(function (h) {
      var t = h.textContent.replace(/#$/, "");
      return '<li><a href="#' + h.id + '" class="' + (h.tagName === "H3" ? "lvl3" : "") + '">' + esc(t) + '</a></li>';
    }).join("") + '</ul>';

    var links = {};
    Array.prototype.forEach.call(box.querySelectorAll("a"), function (a) {
      links[a.getAttribute("href").slice(1)] = a;
    });
    if (!("IntersectionObserver" in window)) return;
    var visible = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) visible.add(e.target.id); else visible.delete(e.target.id);
      });
      var first = heads.find(function (h) { return visible.has(h.id); });
      Object.keys(links).forEach(function (id) { links[id].classList.toggle("is-active", !!first && id === first.id); });
    }, { rootMargin: "-70px 0px -70% 0px", threshold: 0 });
    heads.forEach(function (h) { io.observe(h); });
  }

  /* ---------- 이전 / 다음 + 읽음 표시 ---------- */
  function buildChapterNav() {
    if (!CHAPTER) return;
    var i = FLAT.findIndex(function (c) { return c.id === CHAPTER; });
    if (i < 0) return;
    var prev = FLAT[i - 1], next = FLAT[i + 1];
    var main = document.querySelector("main.page");
    if (!main) return;

    var mark = el(
      '<div class="readmark">' +
        '<button class="btn' + (isRead(CHAPTER) ? " ghost" : "") + '" id="read-btn"></button>' +
        '<span class="hint">' + (store.ok ? "진도는 이 브라우저에만 저장됩니다." : "이 브라우저에서는 진도 저장이 꺼져 있습니다.") + '</span>' +
      '</div>'
    );
    main.appendChild(mark);

    var nav = el('<nav class="chnav" aria-label="챕터 이동">' +
      (prev
        ? '<a href="' + prev.id + '.html" class="prev"><span class="dir">← 이전 · ' + prev.n + '장</span><span class="ttl">' + esc(prev.title) + '</span></a>'
        : '<a class="prev placeholder" aria-hidden="true" tabindex="-1"></a>') +
      (next
        ? '<a href="' + next.id + '.html" class="next"><span class="dir">다음 · ' + next.n + '장 →</span><span class="ttl">' + esc(next.title) + '</span></a>'
        : '<a href="' + BASE + 'index.html" class="next"><span class="dir">완주 →</span><span class="ttl">목차로 돌아가기</span></a>') +
      '</nav>');
    main.appendChild(nav);

    var bar = el('<div class="mobilebar">' +
      (prev ? '<a href="' + prev.id + '.html">← 이전</a>' : '<a aria-disabled="true">← 이전</a>') +
      '<button class="mb-read" id="read-btn-m"></button>' +
      (next ? '<a href="' + next.id + '.html">다음 →</a>' : '<a href="' + BASE + 'index.html">목차 →</a>') +
      '</div>');
    body.appendChild(bar);

    function paint() {
      var done = isRead(CHAPTER);
      var b1 = document.getElementById("read-btn"), b2 = document.getElementById("read-btn-m");
      if (b1) { b1.textContent = done ? "✓ 읽음 — 취소" : "이 챕터 다 읽었습니다"; b1.classList.toggle("ghost", done); }
      if (b2) { b2.textContent = done ? "✓ 읽음" : "읽음 표시"; b2.classList.toggle("is-done", done); }
      var dot = document.querySelector('[data-done="' + CHAPTER + '"]');
      if (dot) dot.textContent = done ? "✓" : "";
    }
    function toggle() { setRead(CHAPTER, !isRead(CHAPTER)); paint(); }
    ["read-btn", "read-btn-m"].forEach(function (id) {
      var b = document.getElementById(id); if (b) b.addEventListener("click", toggle);
    });
    document.addEventListener("fb:progress", paint);
    paint();
  }

  /* ---------- 문법 강조 ---------- */
  function hl(code, lang) {
    if (lang === "html" || lang === "xml" || lang === "svg") return hlMarkup(code);
    if (lang === "css" || lang === "scss") return hlCss(code);
    if (lang === "bash" || lang === "sh" || lang === "shell") return hlShell(code);
    if (lang === "json") return hlJson(code);
    if (lang === "text" || lang === "plain" || lang === "") return esc(code);
    return hlJs(code);
  }

  var JS_KEYWORDS = "const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|super|this|typeof|instanceof|in|of|try|catch|finally|throw|async|await|yield|import|export|from|as|default|delete|void|null|undefined|true|false|static|get|set|interface|type|enum|implements|public|private|protected|readonly|abstract|declare|namespace|satisfies|keyof|infer|is|any|unknown|never|string|number|boolean|symbol|bigint|object";

  function hlJs(code) {
    var re = new RegExp(
      "(\\/\\*[\\s\\S]*?\\*\\/|\\/\\/[^\\n]*)" +                 // 1 주석
      "|(`(?:\\\\.|[^`\\\\])*`|\"(?:\\\\.|[^\"\\\\\\n])*\"|'(?:\\\\.|[^'\\\\\\n])*')" + // 2 문자열
      "|\\b(0[xXbBoO][0-9a-fA-F_]+|\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b" +      // 3 숫자
      "|\\b(" + JS_KEYWORDS + ")\\b" +                            // 4 키워드
      "|([A-Za-z_$][\\w$]*)(?=\\s*\\()",                          // 5 함수 호출
      "g");
    return replaceTokens(code, re, ["tok-com", "tok-str", "tok-num", "tok-key", "tok-fn"]);
  }

  function hlCss(code) {
    var re = new RegExp(
      "(\\/\\*[\\s\\S]*?\\*\\/)" +                                     // 1 주석
      "|(\"(?:\\\\.|[^\"\\\\])*\"|'(?:\\\\.|[^'\\\\])*')" +            // 2 문자열
      "|(@[\\w-]+)" +                                                  // 3 @규칙
      "|(--[\\w-]+|\\b[a-z-]+(?=\\s*:))" +                             // 4 속성/변수
      "|(#[0-9a-fA-F]{3,8}\\b|\\b\\d+(?:\\.\\d+)?(?:px|rem|em|%|vh|vw|dvh|dvw|s|ms|fr|ch|deg|pt|vmin|vmax)?\\b)", // 5 값
      "g");
    return replaceTokens(code, re, ["tok-com", "tok-str", "tok-key", "tok-att", "tok-num"]);
  }

  function hlShell(code) {
    var re = /(#[^\n]*)|("(?:\\.|[^"\\])*"|'[^']*')|^\s*([\w.\/-]+)|(\s--?[\w-]+)/gm;
    return replaceTokens(code, re, ["tok-com", "tok-str", "tok-fn", "tok-att"]);
  }

  function hlJson(code) {
    var re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g;
    var out = "", last = 0, m;
    while ((m = re.exec(code)) !== null) {
      out += esc(code.slice(last, m.index));
      if (m[1]) out += '<span class="' + (m[2] ? "tok-att" : "tok-str") + '">' + esc(m[1]) + "</span>" + (m[2] ? esc(m[2]) : "");
      else if (m[3]) out += '<span class="tok-key">' + esc(m[3]) + "</span>";
      else out += '<span class="tok-num">' + esc(m[4]) + "</span>";
      last = m.index + m[0].length;
    }
    return out + esc(code.slice(last));
  }

  function hlMarkup(code) {
    var re = /(<!--[\s\S]*?-->)|(<\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>])*?)(\/?>)/g;
    var out = "", last = 0, m;
    while ((m = re.exec(code)) !== null) {
      out += esc(code.slice(last, m.index));
      if (m[1]) {
        out += '<span class="tok-com">' + esc(m[1]) + "</span>";
      } else {
        out += '<span class="tok-tag">' + esc(m[2]) + esc(m[3]) + "</span>";
        out += hlAttrs(m[4]);
        out += '<span class="tok-tag">' + esc(m[5]) + "</span>";
      }
      last = m.index + m[0].length;
    }
    return out + esc(code.slice(last));
  }
  function hlAttrs(s) {
    var re = /([\w:.-]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+)?/g;
    var out = "", last = 0, m;
    while ((m = re.exec(s)) !== null) {
      out += esc(s.slice(last, m.index));
      out += '<span class="tok-att">' + esc(m[1]) + "</span>" + esc(m[2]);
      if (m[3]) out += '<span class="tok-str">' + esc(m[3]) + "</span>";
      last = m.index + m[0].length;
    }
    return out + esc(s.slice(last));
  }

  function replaceTokens(code, re, classes) {
    var out = "", last = 0, m;
    while ((m = re.exec(code)) !== null) {
      if (m[0] === "") { re.lastIndex++; continue; }
      out += esc(code.slice(last, m.index));
      var done = false;
      for (var g = 1; g <= classes.length; g++) {
        if (m[g] !== undefined) {
          var pre = m[0].slice(0, m[0].indexOf(m[g]));
          out += esc(pre) + '<span class="' + classes[g - 1] + '">' + esc(m[g]) + "</span>";
          done = true; break;
        }
      }
      if (!done) out += esc(m[0]);
      last = m.index + m[0].length;
    }
    return out + esc(code.slice(last));
  }

  function highlightAll(root) {
    var nodes = (root || document).querySelectorAll("pre > code[data-lang]");
    Array.prototype.forEach.call(nodes, function (c) {
      if (c.getAttribute("data-hl") === "1") return;
      c.innerHTML = hl(c.textContent, c.getAttribute("data-lang"));
      c.setAttribute("data-hl", "1");
    });
  }

  /* ---------- 검색 ---------- */
  /* 색인은 400KB가 넘으므로 모든 페이지에서 미리 받지 않는다.
     사용자가 검색을 시작할 때 한 번만 내려받는다. (47·76장의 코드 분할과 같은 생각) */
  var indexPromise = null;
  function ensureIndex() {
    if (window.BOOK_INDEX) return Promise.resolve(window.BOOK_INDEX);
    if (indexPromise) return indexPromise;
    indexPromise = new Promise(function (resolve) {
      var s = document.createElement("script");
      s.src = BASE + "assets/data/search-index.js";
      s.onload = function () { resolve(window.BOOK_INDEX); };
      s.onerror = function () { resolve(null); };   /* 실패해도 제목 검색으로 동작 */
      document.head.appendChild(s);
    });
    return indexPromise;
  }

  function searchDocs(query) {
    var q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    var idx = window.BOOK_INDEX || null;
    var terms = q.split(/\s+/).filter(Boolean);
    var out = [];

    if (idx) {
      idx.forEach(function (doc) {
        var titleL = doc.t.toLowerCase(), bodyL = doc.b.toLowerCase(), headL = (doc.h || []).join(" ").toLowerCase();
        var score = 0, hitAll = true;
        terms.forEach(function (t) {
          var s = 0;
          if (titleL.indexOf(t) >= 0) s += 60;
          if (headL.indexOf(t) >= 0) s += 25;
          var c = bodyL.split(t).length - 1;
          if (c > 0) s += Math.min(c, 12) * 3;
          if (s === 0) hitAll = false;
          score += s;
        });
        if (!hitAll || score === 0) return;
        var pos = bodyL.indexOf(terms[0]);
        var snip = pos >= 0 ? doc.b.slice(Math.max(0, pos - 45), pos + 95) : doc.b.slice(0, 120);
        out.push({ n: doc.n, id: doc.id, title: doc.t, part: doc.p, score: score, snippet: (pos > 45 ? "…" : "") + snip + "…" });
      });
    } else {
      FLAT.forEach(function (c) {
        var t = c.title.toLowerCase();
        if (terms.every(function (x) { return t.indexOf(x) >= 0; }))
          out.push({ n: c.n, id: c.id, title: c.title, part: c.partTitle, score: 50, snippet: "" });
      });
    }
    out.sort(function (a, b) { return b.score - a.score || a.n - b.n; });
    return out;
  }

  function markTerms(text, query) {
    var terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
      .map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); });
    if (!terms.length) return esc(text);
    var re = new RegExp("(" + terms.join("|") + ")", "gi");
    return esc(text).replace(re, "<mark>$1</mark>");
  }

  function initSearch() {
    var input = document.getElementById("q");
    var pop = document.getElementById("search-pop");
    if (!input || !pop) return;
    var active = -1, items = [];

    function render(list, q) {
      items = list.slice(0, 8);
      active = -1;
      if (!q.trim()) { pop.innerHTML = ""; input.setAttribute("aria-expanded", "false"); return; }
      if (!items.length) {
        pop.innerHTML = '<div class="sp-empty">' + esc(q) + ' 에 대한 결과가 없습니다.</div>';
      } else {
        pop.innerHTML = items.map(function (r) {
          return '<a href="' + BASE + 'ch/' + r.id + '.html" role="option">' +
            '<div class="sp-title">' + markTerms(r.title, q) + '</div>' +
            '<div class="sp-meta">' + r.n + '장 · ' + esc(r.part || "") + '</div>' +
            (r.snippet ? '<div class="sp-snip">' + markTerms(r.snippet, q) + '</div>' : "") +
            '</a>';
        }).join("");
      }
      input.setAttribute("aria-expanded", "true");
    }

    function update() {
      var q = input.value;
      render(searchDocs(q), q);                       /* 우선 제목 기준으로 즉시 표시 */
      if (q.trim() && !window.BOOK_INDEX) {
        ensureIndex().then(function () {
          if (input.value === q) render(searchDocs(q), q);   /* 색인 도착 후 다시 */
        });
      }
    }
    input.addEventListener("input", update);
    input.addEventListener("focus", function () { ensureIndex(); if (input.value.trim()) update(); });
    input.addEventListener("keydown", function (e) {
      var links = pop.querySelectorAll("a");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!links.length) return;
        e.preventDefault();
        active = (active + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
        Array.prototype.forEach.call(links, function (a, i) { a.classList.toggle("is-active", i === active); });
        links[active].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (active >= 0 && links[active]) location.href = links[active].href;
        else if (input.value.trim()) location.href = BASE + "search.html?q=" + encodeURIComponent(input.value.trim());
      } else if (e.key === "Escape") {
        pop.innerHTML = ""; input.setAttribute("aria-expanded", "false"); input.blur();
      }
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".hdr-search")) { pop.innerHTML = ""; input.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (e) {
      var tag = (e.target.tagName || "").toLowerCase();
      if (e.key === "/" && tag !== "input" && tag !== "textarea" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault(); input.focus(); input.select();
      }
    });
  }

  /* ---------- 키보드 좌우 이동 ---------- */
  function initKeys() {
    document.addEventListener("keydown", function (e) {
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.metaKey || e.ctrlKey || e.altKey) return;
      var sel = e.key === "ArrowLeft" ? ".chnav .prev" : e.key === "ArrowRight" ? ".chnav .next" : null;
      if (!sel) return;
      var a = document.querySelector(sel);
      if (a && a.getAttribute("href")) location.href = a.href;
    });
  }

  /* ---------- 공개 API ---------- */
  window.FB = {
    store: store, esc: esc, el: el, BASE: BASE, CHAPTER: CHAPTER, PAGE: PAGE,
    TOC: TOC, FLAT: FLAT,
    isRead: isRead, setRead: setRead, saveQuiz: saveQuiz, readCount: readCount,
    progress: function () { return progress; },
    highlight: hl, highlightAll: highlightAll,
    search: searchDocs, ensureIndex: ensureIndex, markTerms: markTerms, slugify: slugify
  };

  /* ---------- 부팅 ---------- */
  function boot() {
    var saved = store.get(K_THEME, "auto");
    if (saved !== "auto") document.documentElement.setAttribute("data-theme", saved);
    buildHeader();
    buildSidebar();
    buildScrim();
    highlightAll(document);
    buildPageToc();
    buildChapterNav();
    initKeys();
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function () { if (currentTheme() === "auto") updateThemeIcon(); };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
    }
    document.dispatchEvent(new CustomEvent("fb:ready"));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
