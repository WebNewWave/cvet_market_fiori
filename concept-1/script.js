/* Концепт «Нежность» — деликатные анимации появления и липкий хедер. */
(function () {
  "use strict";

  // Липкий хедер
  var header = document.getElementById("header");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Появление при скролле
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  // Карточки каталога рендерятся динамически — ловим их появление
  var grid = document.getElementById("catalogGrid");
  if (grid) {
    var mo = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.classList && n.classList.contains("card")) io.observe(n);
        });
      });
    });
    mo.observe(grid, { childList: true });
  }
})();
