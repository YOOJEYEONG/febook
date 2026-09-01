/* ============================================================
   용어 사전
   본문 표기:  <span class="term" data-term="dom">DOM</span>
   정의는 assets/data/glossary-data.js 의 window.BOOK_GLOSSARY 에 있다.
   ============================================================ */
(function () {
  "use strict";
  var G = window.BOOK_GLOSSARY || {};
  var pop = null, current = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function close() {
    if (pop) { pop.remove(); pop = null; }
    if (current) { current.removeAttribute("aria-expanded"); current = null; }
  }

  function open(node) {
    var key = node.getAttribute("data-term");
    var entry = G[key];
    if (!entry) return;
    close();
    var BASE = document.body.getAttribute("data-base") || "";
    pop = document.createElement("div");
    pop.className = "gloss-pop";
    pop.setAttribute("role", "tooltip");
    var showEn = entry.en && entry.en !== entry.ko;
    pop.innerHTML =
      "<b>" + esc(entry.ko || key) +
      (showEn ? ' <span class="gp-en">' + esc(entry.en) + "</span>" : "") + "</b>" +
      "<div>" + entry.def + "</div>" +
      (entry.ch ? '<div style="margin-top:6px"><a href="' + BASE + "ch/" + entry.ch + '.html">자세히 보기 →</a></div>' : "");
    document.body.appendChild(pop);

    var r = node.getBoundingClientRect();
    var top = window.scrollY + r.bottom + 8;
    var left = window.scrollX + r.left;
    var maxLeft = window.scrollX + document.documentElement.clientWidth - pop.offsetWidth - 12;
    if (left > maxLeft) left = Math.max(window.scrollX + 12, maxLeft);
    /* 화면 아래로 넘치면 위쪽에 띄운다 */
    if (r.bottom + pop.offsetHeight + 16 > window.innerHeight && r.top > pop.offsetHeight + 16) {
      top = window.scrollY + r.top - pop.offsetHeight - 8;
    }
    pop.style.top = top + "px";
    pop.style.left = left + "px";
    node.setAttribute("aria-expanded", "true");
    current = node;
  }

  function init() {
    var terms = document.querySelectorAll(".term[data-term]");
    Array.prototype.forEach.call(terms, function (t) {
      if (!G[t.getAttribute("data-term")]) {
        /* 정의가 없는 용어는 밑줄만 없앤다 (깨진 것처럼 보이지 않게) */
        t.classList.remove("term");
        return;
      }
      t.setAttribute("tabindex", "0");
      t.setAttribute("role", "button");
      t.setAttribute("aria-label", t.textContent + " 뜻 보기");
      t.addEventListener("click", function (e) { e.stopPropagation(); (current === t ? close : open)(t); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (current === t ? close : open)(t); }
      });
      var hoverTimer;
      t.addEventListener("mouseenter", function () { hoverTimer = setTimeout(function () { open(t); }, 260); });
      t.addEventListener("mouseleave", function () { clearTimeout(hoverTimer); });
    });
    document.addEventListener("click", function (e) {
      if (pop && !pop.contains(e.target) && !e.target.closest(".term")) close();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    window.addEventListener("resize", close);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
