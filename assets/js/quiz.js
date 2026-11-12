/* ============================================================
   챕터별 퀴즈
   챕터 HTML 사용법:
     <section class="quiz" id="quiz"></section>
     <script>
     FB_QUIZ([
       { q: "질문 (HTML 사용 가능)",
         o: ["보기1", "보기2", "보기3", "보기4"],
         a: 1,                       // 정답 보기의 인덱스 (0부터)
         e: "왜 그런지에 대한 해설" }
     ]);
     <\/script>
   ============================================================ */
(function () {
  "use strict";
  var DATA = null;

  window.FB_QUIZ = function (items) { DATA = items; };

  /* 보기 순서를 섞는다(Fisher-Yates). 원본 인덱스는 data-oi 에 남기므로 채점은 그대로다.
     원본 데이터에서 정답이 특정 위치에 몰려 있어도 화면에서는 드러나지 않는다. */
  function shuffled(n) {
    var idx = [];
    for (var i = 0; i < n; i++) idx.push(i);
    for (var j = n - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var t = idx[j]; idx[j] = idx[k]; idx[k] = t;
    }
    return idx;
  }

  function render() {
    var host = document.getElementById("quiz");
    if (!host || !DATA || !DATA.length) return;
    var FB = window.FB;
    var chapter = document.body.getAttribute("data-chapter") || "page";

    host.classList.add("quiz");
    host.innerHTML =
      '<h2>이해도 점검</h2>' +
      '<p class="quiz-sub">답을 고른 뒤 채점하세요. 맞아도 해설을 읽으면 남는 게 다릅니다.</p>' +
      DATA.map(function (item, qi) {
        var qid = "q-" + qi + "-text";
        return '<div class="q" data-qi="' + qi + '">' +
          '<p class="q-text" id="' + qid + '"><span class="qn">Q' + (qi + 1) + '.</span>' + item.q + '</p>' +
          '<ul class="q-opts" role="radiogroup" aria-labelledby="' + qid + '">' + shuffled(item.o.length).map(function (oi) {
            var opt = item.o[oi];
            return '<li><label class="q-opt" data-oi="' + oi + '">' +
              '<input type="radio" name="q' + chapter + '-' + qi + '" value="' + oi + '">' +
              '<span class="mark" aria-hidden="true"></span>' +
              '<span class="q-opt-text">' + opt + '</span>' +
              '<span class="sr-only q-verdict"></span>' +
            '</label></li>';
          }).join("") + '</ul>' +
          '<div class="q-exp" hidden><b>해설</b> · ' + item.e + '</div>' +
        '</div>';
      }).join("") +
      '<div class="quiz-actions">' +
        '<button class="btn" id="quiz-submit" type="button">채점하기</button>' +
        '<button class="btn ghost" id="quiz-reset" type="button">다시 풀기</button>' +
        '<span class="quiz-score" id="quiz-score" role="status"></span>' +
      '</div>';

    host.addEventListener("change", function (e) {
      if (e.target.type !== "radio") return;
      var q = e.target.closest(".q");
      Array.prototype.forEach.call(q.querySelectorAll(".q-opt"), function (l) {
        l.classList.toggle("picked", l.contains(e.target));
      });
    });

    function grade() {
      var score = 0, unanswered = 0;
      Array.prototype.forEach.call(host.querySelectorAll(".q"), function (q, qi) {
        var item = DATA[qi];
        var picked = q.querySelector("input:checked");
        if (!picked) unanswered++;
        var pickedIdx = picked ? Number(picked.value) : -1;
        if (pickedIdx === item.a) score++;
        Array.prototype.forEach.call(q.querySelectorAll(".q-opt"), function (l) {
          var oi = Number(l.getAttribute("data-oi"));
          l.classList.remove("picked", "correct", "wrong");
          var mark = l.querySelector(".mark");
          var verdict = l.querySelector(".q-verdict");
          mark.textContent = ""; verdict.textContent = "";
          if (oi === item.a) { l.classList.add("correct"); mark.textContent = "✓"; verdict.textContent = oi === pickedIdx ? " (정답, 내가 고른 답)" : " (정답)"; }
          else if (oi === pickedIdx) { l.classList.add("wrong"); mark.textContent = "✗"; verdict.textContent = " (오답, 내가 고른 답)"; }
        });
        q.querySelector(".q-exp").hidden = false;
      });

      var out = document.getElementById("quiz-score");
      var total = DATA.length;
      out.textContent = total + "문제 중 " + score + "문제 정답" + (unanswered ? " (미응답 " + unanswered + ")" : "");
      out.className = "quiz-score " + (score === total ? "pass" : "fail");
      if (FB && FB.saveQuiz) FB.saveQuiz(chapter, score, total);
      /* 만점이면 읽음 표시를 제안한다 (자동으로 바꾸지는 않는다) */
      var old = document.getElementById("quiz-markread");
      if (old) old.remove();
      if (score === total && FB && FB.isRead && FB.setRead && FB.CHAPTER && !FB.isRead(FB.CHAPTER)) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "btn ghost"; b.id = "quiz-markread";
        b.textContent = "만점! 이 챕터를 읽음으로 표시";
        b.addEventListener("click", function () { FB.setRead(FB.CHAPTER, true); b.remove(); });
        out.insertAdjacentElement("afterend", b);
      }
    }

    function reset() {
      Array.prototype.forEach.call(host.querySelectorAll("input[type=radio]"), function (i) { i.checked = false; });
      Array.prototype.forEach.call(host.querySelectorAll(".q-opt"), function (l) {
        l.classList.remove("picked", "correct", "wrong");
        l.querySelector(".mark").textContent = "";
        l.querySelector(".q-verdict").textContent = "";
      });
      var mr = document.getElementById("quiz-markread");
      if (mr) mr.remove();
      Array.prototype.forEach.call(host.querySelectorAll(".q-exp"), function (d) { d.hidden = true; });
      var out = document.getElementById("quiz-score");
      out.textContent = ""; out.className = "quiz-score";
    }

    document.getElementById("quiz-submit").addEventListener("click", grade);
    document.getElementById("quiz-reset").addEventListener("click", reset);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})();
