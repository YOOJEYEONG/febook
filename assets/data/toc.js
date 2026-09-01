/* 프엔북 목차 데이터 — 모든 페이지가 이 파일 하나를 공유한다.
   JSON 대신 .js 전역 변수로 두는 이유: file:// 로 열었을 때 fetch()는
   CORS 정책에 막히지만 <script src>는 정상 동작하기 때문. */
window.BOOK_TOC = {
  title: "프엔북",
  subtitle: "비전공자를 위한 프론트엔드 완전 학습서",
  parts: [
    {
      n: 0, title: "시작하기 전에",
      desc: "이 책의 사용법과 프론트엔드라는 직업의 실체",
      chapters: [
        { n: 1, id: "01-frontend-intro", title: "프론트엔드 개발자는 무슨 일을 하나" }
      ]
    },
    {
      n: 1, title: "웹이 동작하는 원리",
      desc: "코드를 쓰기 전에 알아야 할 웹의 뼈대",
      chapters: [
        { n: 2, id: "02-internet-and-web", title: "인터넷과 웹, 클라이언트와 서버" },
        { n: 3, id: "03-url-dns-hosting", title: "URL, 도메인, DNS, 호스팅, CDN" },
        { n: 4, id: "04-http", title: "HTTP와 HTTPS: 웹의 대화 규칙" },
        { n: 5, id: "05-browser-rendering", title: "브라우저는 화면을 어떻게 그리나" }
      ]
    },
    {
      n: 2, title: "HTML — 웹 페이지의 뼈대",
      desc: "구조와 의미를 담당하는 언어",
      chapters: [
        { n: 6, id: "06-html-basics", title: "HTML 기초 문법" },
        { n: 7, id: "07-html-semantics", title: "시맨틱 태그와 문서 구조" },
        { n: 8, id: "08-html-text-media", title: "텍스트, 링크, 이미지, 미디어" },
        { n: 9, id: "09-html-forms", title: "폼과 사용자 입력" },
        { n: 10, id: "10-html-meta-seo", title: "테이블, 메타데이터, SEO" },
        { n: 11, id: "11-a11y-basics", title: "웹 접근성 기초" }
      ]
    },
    {
      n: 3, title: "CSS — 보이는 모든 것",
      desc: "배치, 색, 반응형, 애니메이션",
      chapters: [
        { n: 12, id: "12-css-basics", title: "CSS 기초: 선택자, 명시도, 캐스케이드" },
        { n: 13, id: "13-box-model", title: "박스 모델과 display" },
        { n: 14, id: "14-units-colors", title: "단위와 색상" },
        { n: 15, id: "15-flexbox", title: "Flexbox 완전 정복" },
        { n: 16, id: "16-grid", title: "Grid 완전 정복" },
        { n: 17, id: "17-position-stacking", title: "position, z-index, 쌓임 맥락" },
        { n: 18, id: "18-responsive", title: "반응형 디자인과 컨테이너 쿼리" },
        { n: 19, id: "19-typography", title: "타이포그래피와 웹폰트" },
        { n: 20, id: "20-transition-animation", title: "전환과 애니메이션" },
        { n: 21, id: "21-css-architecture", title: "CSS 설계: 변수, 다크 모드, BEM, 레이어" },
        { n: 22, id: "22-css-ecosystem", title: "Sass, CSS Modules, Tailwind, CSS-in-JS" }
      ]
    },
    {
      n: 4, title: "JavaScript 기초",
      desc: "웹을 움직이게 하는 언어의 문법 전체",
      chapters: [
        { n: 23, id: "23-js-intro", title: "자바스크립트란 무엇인가" },
        { n: 24, id: "24-variables-scope", title: "변수, 스코프, 호이스팅, TDZ" },
        { n: 25, id: "25-types", title: "데이터 타입, 원시값과 참조값" },
        { n: 26, id: "26-operators-control", title: "연산자와 제어문" },
        { n: 27, id: "27-functions", title: "함수" },
        { n: 28, id: "28-objects", title: "객체" },
        { n: 29, id: "29-arrays", title: "배열과 고차 함수" },
        { n: 30, id: "30-this", title: "this와 실행 컨텍스트" },
        { n: 31, id: "31-closure", title: "클로저" },
        { n: 32, id: "32-prototype-class", title: "프로토타입과 class" },
        { n: 33, id: "33-errors", title: "에러 처리" },
        { n: 34, id: "34-modules", title: "모듈 시스템" }
      ]
    },
    {
      n: 5, title: "JavaScript 심화와 브라우저 API",
      desc: "비동기, DOM, 저장소 — 실무의 대부분",
      chapters: [
        { n: 35, id: "35-event-loop", title: "이벤트 루프" },
        { n: 36, id: "36-async", title: "Promise와 async/await" },
        { n: 37, id: "37-fetch-cors", title: "fetch, JSON, CORS" },
        { n: 38, id: "38-dom", title: "DOM 조작과 이벤트" },
        { n: 39, id: "39-storage", title: "브라우저 저장소" },
        { n: 40, id: "40-web-apis", title: "알아두면 강력한 Web API" },
        { n: 41, id: "41-iterator-collections", title: "이터레이터, 제너레이터, Map과 Set" },
        { n: 42, id: "42-regex", title: "정규표현식" },
        { n: 43, id: "43-date-intl", title: "날짜, 숫자, 국제화" }
      ]
    },
    {
      n: 6, title: "개발 환경과 도구",
      desc: "실무 개발자의 작업대를 갖춘다",
      chapters: [
        { n: 44, id: "44-terminal", title: "터미널과 명령줄" },
        { n: 45, id: "45-git", title: "Git과 GitHub" },
        { n: 46, id: "46-node-npm", title: "Node.js와 패키지 매니저" },
        { n: 47, id: "47-bundler", title: "번들러와 빌드 도구" },
        { n: 48, id: "48-lint-format", title: "ESLint와 Prettier" },
        { n: 49, id: "49-devtools", title: "브라우저 개발자 도구" }
      ]
    },
    {
      n: 7, title: "TypeScript",
      desc: "실무 프론트엔드의 사실상 표준",
      chapters: [
        { n: 50, id: "50-ts-intro", title: "TypeScript를 쓰는 이유" },
        { n: 51, id: "51-ts-basic-types", title: "기본 타입" },
        { n: 52, id: "52-ts-interface-type", title: "interface와 type" },
        { n: 53, id: "53-ts-generics", title: "제네릭" },
        { n: 54, id: "54-ts-narrowing", title: "타입 좁히기와 타입 가드" },
        { n: 55, id: "55-ts-utility-types", title: "유틸리티 타입과 타입 연산" },
        { n: 56, id: "56-ts-react", title: "React와 TypeScript" }
      ]
    },
    {
      n: 8, title: "React",
      desc: "컴포넌트로 UI를 만드는 방법 전체",
      chapters: [
        { n: 57, id: "57-react-intro", title: "React가 푸는 문제와 가상 DOM의 진실" },
        { n: 58, id: "58-jsx-components", title: "JSX, 컴포넌트, props" },
        { n: 59, id: "59-state", title: "state와 렌더링" },
        { n: 60, id: "60-events-lists", title: "이벤트, 조건부 렌더링, 리스트와 key" },
        { n: 61, id: "61-effects", title: "useEffect와 부수 효과" },
        { n: 62, id: "62-react-forms", title: "React의 폼" },
        { n: 63, id: "63-component-design", title: "컴포넌트 설계와 합성" },
        { n: 64, id: "64-ref-memo", title: "useRef, memo, useMemo, useCallback" },
        { n: 65, id: "65-context-state", title: "Context와 전역 상태 관리" },
        { n: 66, id: "66-custom-hooks", title: "커스텀 훅" },
        { n: 67, id: "67-data-fetching", title: "데이터 페칭과 서버 상태" },
        { n: 68, id: "68-routing", title: "라우팅" },
        { n: 69, id: "69-react-modern", title: "Suspense, 트랜지션, 서버 컴포넌트" }
      ]
    },
    {
      n: 9, title: "Next.js와 렌더링 전략",
      desc: "실무에서 가장 많이 쓰는 React 프레임워크",
      chapters: [
        { n: 70, id: "70-rendering-strategies", title: "CSR, SSR, SSG, ISR" },
        { n: 71, id: "71-nextjs-app-router", title: "Next.js App Router" },
        { n: 72, id: "72-nextjs-data", title: "데이터 페칭, 캐싱, Server Actions" },
        { n: 73, id: "73-nextjs-optimization", title: "메타데이터, 이미지, 폰트 최적화" },
        { n: 74, id: "74-deploy", title: "배포와 환경 변수" }
      ]
    },
    {
      n: 10, title: "품질, 성능, 보안",
      desc: "주니어와 시니어를 가르는 영역",
      chapters: [
        { n: 75, id: "75-testing", title: "테스트" },
        { n: 76, id: "76-performance", title: "성능 최적화와 Core Web Vitals" },
        { n: 77, id: "77-a11y-advanced", title: "접근성 심화" },
        { n: 78, id: "78-security", title: "프론트엔드 보안" },
        { n: 79, id: "79-monitoring", title: "에러 추적과 모니터링" }
      ]
    },
    {
      n: 11, title: "실전과 커리어",
      desc: "배운 것을 실제 결과물과 커리어로",
      chapters: [
        { n: 80, id: "80-project-structure", title: "프로젝트 구조와 아키텍처" },
        { n: 81, id: "81-mini-projects", title: "미니 프로젝트 3개" },
        { n: 82, id: "82-collaboration", title: "협업과 코드 리뷰" },
        { n: 83, id: "83-interview", title: "면접 대비 핵심 질문" },
        { n: 84, id: "84-keep-learning", title: "계속 학습하기" }
      ]
    }
  ]
};

/* 파생 데이터: 챕터 번호 순 평면 배열 (이전/다음 이동에 사용) */
window.BOOK_FLAT = window.BOOK_TOC.parts.flatMap(function (p) {
  return p.chapters.map(function (c) {
    return { n: c.n, id: c.id, title: c.title, part: p.n, partTitle: p.title };
  });
});
