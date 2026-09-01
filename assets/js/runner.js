/* ============================================================
   인앱 코드 실행기
   마크업 규약:
     <div class="runner" data-lang="js" data-title="직접 실행해 보기">
     <textarea class="rn-src">…코드…</textarea>
     </div>
   - data-lang: js | ts | html | css   (html/css는 미리보기, js/ts는 콘솔)
   - data-mode: preview | console      (자동 판정을 덮어쓸 때만)
   - data-autorun="off": 화면에 들어와도 자동 실행하지 않음
   보안: iframe sandbox 는 allow-scripts 만 준다. allow-same-origin 을 주지 않으므로
   예제 코드는 부모 문서(DOM, localStorage, 쿠키)에 접근할 수 없다.
   ============================================================ */
(function () {
  "use strict";

  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var seq = 0;
  var frames = {};   /* runId -> console 출력 엘리먼트 */

  /* ---------- iframe 안에서 실행될 콘솔 브리지 ---------- */
  function bridge(runId) {
    return '<script>(function(){' +
      'var ID=' + JSON.stringify(runId) + ';' +
      'function send(level,parts){try{parent.postMessage({__fbrun:ID,level:level,text:parts},"*")}catch(e){}}' +
      'function ser(v,d,seen){try{return ser0(v,d,seen)}catch(e){return "[접근할 수 없는 값]"}}' +
      'function ser0(v,d,seen){' +
        'd=d||0; seen=seen||[];' +
        'if(v===null)return "null";' +
        'if(v===undefined)return "undefined";' +
        'var t=typeof v;' +
        'if(t==="string")return d===0?v:JSON.stringify(v);' +
        'if(t==="number"||t==="boolean"||t==="bigint")return String(v);' +
        'if(t==="symbol")return v.toString();' +
        'if(t==="function")return "ƒ "+(v.name||"anonymous")+"()";' +
        'if(seen.indexOf(v)>=0)return "[순환 참조]";' +
        'if(d>3)return Array.isArray(v)?"[…]":"{…}";' +
        'seen=seen.concat([v]);' +
        'if(Array.isArray(v))return "["+v.map(function(x){return ser(x,d+1,seen)}).join(", ")+"]";' +
        'if(v instanceof Error)return v.name+": "+v.message;' +
        'if(v instanceof Date)return v.toISOString();' +
        'if(v instanceof Map)return "Map("+v.size+") {"+Array.from(v).map(function(p){return ser(p[0],d+1,seen)+" => "+ser(p[1],d+1,seen)}).join(", ")+"}";' +
        'if(v instanceof Set)return "Set("+v.size+") {"+Array.from(v).map(function(x){return ser(x,d+1,seen)}).join(", ")+"}";' +
        'try{if(v&&v.nodeType===1)return "<"+v.tagName.toLowerCase()+">"}catch(e){return "[다른 출처의 객체]"}' +
        'if(v&&typeof v.then==="function")return "Promise";' +
        'var keys;try{keys=Object.keys(v)}catch(e){return String(v)}' +
        'var ctor=(v.constructor&&v.constructor.name&&v.constructor.name!=="Object")?v.constructor.name+" ":"";' +
        'return ctor+"{ "+keys.slice(0,30).map(function(k){return k+": "+ser(v[k],d+1,seen)}).join(", ")+(keys.length>30?", …":"")+" }";' +
      '}' +
      'function wrap(level){var o=console[level]?console[level].bind(console):function(){};' +
        'console[level]=function(){var a=[].slice.call(arguments).map(function(x){return ser(x,0)});send(level,a.join(" "));o.apply(console,arguments)}}' +
      '["log","info","warn","error","debug"].forEach(wrap);' +
      'console.table=function(x){send("log",ser(x,1))};' +
      'window.addEventListener("error",function(e){send("error",(e.error&&e.error.stack?String(e.error.name+": "+e.error.message):e.message))});' +
      'window.addEventListener("unhandledrejection",function(e){send("error","처리되지 않은 Promise 거부: "+ser(e.reason,0))});' +
      '})();<\/script>';
  }

  function srcdocFor(runId, lang, code) {
    var base = '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
    var reset = '<style>html{color-scheme:light}body{margin:0;padding:12px;font:15px/1.7 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Segoe UI","Noto Sans KR",sans-serif;color:#1c1b19;background:#fff;word-break:keep-all}*{box-sizing:border-box}</style>';
    if (lang === "html" || lang === "css") {
      /* 사용자 코드가 전체 문서를 담고 있으면 그대로, 조각이면 감싼다 */
      var isDoc = /<html[\s>]/i.test(code) || /<!doctype/i.test(code);
      if (isDoc) return code.replace(/<head[^>]*>/i, function (m) { return m + bridge(runId); });
      return base + reset + bridge(runId) + code;
    }
    return base + reset + bridge(runId) +
      '<script>window.addEventListener("DOMContentLoaded",function(){"use strict";try{\n' +
      /* 사용자 코드를 문자열이 아니라 그대로 삽입한다. </script> 만 깨뜨리면 되므로 치환. */
      code.replace(/<\/script>/gi, "<\\/script>") +
      '\n}catch(e){console.error(e && e.name ? e.name+": "+e.message : String(e))}});<\/script>';
  }

  /* ---------- 부모: 메시지 수신 ---------- */
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || typeof d !== "object" || !d.__fbrun) return;
    var out = frames[d.__fbrun];
    if (!out) return;
    out.hidden = false;
    var ph = out.querySelector(".placeholder");
    if (ph) ph.remove();
    var line = document.createElement("span");
    line.className = "ln " + (d.level === "error" ? "err" : d.level === "warn" ? "warn" : d.level === "info" ? "info" : "");
    line.textContent = d.text;
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
  });

  /* ---------- 실행기 하나 초기화 ---------- */
  function setup(host, index) {
    var src = host.querySelector("textarea, .rn-src, script[type='text/plain']");
    if (!src) return;
    var original = (src.value !== undefined ? src.value : src.textContent).replace(/^\n/, "").replace(/\s+$/, "");
    var lang = (host.getAttribute("data-lang") || "js").toLowerCase();
    var mode = host.getAttribute("data-mode") ||
      ((lang === "html" || lang === "css") ? "preview" : "console");
    var title = host.getAttribute("data-title") || "직접 실행해 보기";
    var note  = host.getAttribute("data-note") || "";
    var chapter = document.body.getAttribute("data-chapter") || "page";
    var storeKey = "fenbook:code:" + chapter + ":" + index;
    var FB = window.FB;

    /* 저장된 편집본을 복원한다. 단 예제 원본이 바뀌었으면(챕터 개정) 버린다.
       그래야 오래된 코드가 새 내용을 가리는 일이 없다. */
    var saved = FB && FB.store ? FB.store.get(storeKey, null) : null;
    var startCode = (saved && typeof saved === "object" && saved.origin === original && typeof saved.code === "string")
      ? saved.code
      : original;

    host.innerHTML =
      '<div class="rn-bar">' +
        '<span class="rn-lang">' + esc(lang) + '</span>' +
        '<span class="rn-title">' + esc(title) + '</span>' +
        '<span class="sp"></span>' +
        '<button class="rn-btn rn-reset" type="button">되돌리기</button>' +
        '<button class="rn-btn primary rn-run" type="button">▶ 실행</button>' +
      '</div>' +
      '<div class="rn-body">' +
        '<textarea class="rn-editor" spellcheck="false" aria-label="예제 코드 편집기"></textarea>' +
        '<div class="rn-out">' +
          '<div class="rn-out-label">' + (mode === "preview" ? "실행 결과" : "콘솔 출력") + '</div>' +
          (mode === "preview"
            ? '<iframe class="rn-frame" title="실행 결과" sandbox="allow-scripts"></iframe>'
            : '') +
          '<div class="rn-console"' + (mode === "preview" ? ' hidden' : "") + '><span class="placeholder">실행 버튼을 누르면 결과가 여기에 표시됩니다.</span></div>' +
        '</div>' +
      '</div>' +
      (note ? '<div class="rn-note">' + esc(note) + '</div>' : "");

    var ta      = host.querySelector(".rn-editor");
    var frame   = host.querySelector(".rn-frame");
    var consoleEl = host.querySelector(".rn-console");
    var runBtn  = host.querySelector(".rn-run");
    var resetBtn= host.querySelector(".rn-reset");

    ta.value = startCode;
    autosize(ta);

    function autosize(t) {
      var lines = t.value.split("\n").length;
      t.style.height = Math.min(Math.max(lines * 1.65 * 13 + 26, 140), 520) + "px";
    }

    function run() {
      var runId = "r" + (++seq);
      consoleEl.innerHTML = '<span class="placeholder">(출력 없음)</span>';
      /* 미리보기 모드에서는 console.log 나 에러가 실제로 발생했을 때만 패널을 연다 */
      consoleEl.hidden = (mode === "preview");
      frames[runId] = consoleEl;
      var doc = srcdocFor(runId, lang, ta.value);
      if (mode === "preview") {
        frame.srcdoc = doc;
      } else {
        /* 콘솔 모드에도 iframe이 필요하다. 화면에는 보이지 않게 둔다. */
        var f = host.querySelector(".rn-hidden-frame");
        if (f) f.remove();
        f = document.createElement("iframe");
        f.className = "rn-hidden-frame";
        f.setAttribute("sandbox", "allow-scripts");
        f.setAttribute("title", "코드 실행 영역");
        f.setAttribute("aria-hidden", "true");
        f.style.cssText = "position:absolute;width:0;height:0;border:0;visibility:hidden";
        f.srcdoc = doc;
        host.appendChild(f);
      }
      /* 사용자가 실제로 고친 경우에만 저장한다 */
      if (FB && FB.store) {
        if (ta.value === original) {
          try { localStorage.removeItem(storeKey); } catch (e) {}
        } else {
          FB.store.set(storeKey, { origin: original, code: ta.value });
        }
      }
    }

    runBtn.addEventListener("click", run);
    resetBtn.addEventListener("click", function () {
      ta.value = original;
      autosize(ta);
      if (FB && FB.store && FB.store.ok) { try { localStorage.removeItem(storeKey); } catch (e) {} }
      run();
    });
    ta.addEventListener("input", function () { autosize(ta); });
    ta.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); return; }
      if (e.key === "Escape") { ta.blur(); return; }
      if (e.key === "Tab") {
        /* Tab 은 들여쓰기. 키보드만 쓰는 사용자는 Escape 후 Tab 으로 빠져나갈 수 있다. */
        e.preventDefault();
        var s = ta.selectionStart, en = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + "  " + ta.value.slice(en);
        ta.selectionStart = ta.selectionEnd = s + 2;
      }
    });

    /* 화면에 들어오면 한 번 자동 실행 */
    if (host.getAttribute("data-autorun") !== "off" && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { io.disconnect(); run(); }
        });
      }, { rootMargin: "120px" });
      io.observe(host);
    }
  }

  function init() {
    var hosts = document.querySelectorAll(".runner");
    Array.prototype.forEach.call(hosts, function (h, i) {
      try { setup(h, i); } catch (e) { /* 하나가 실패해도 나머지는 살린다 */ }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
