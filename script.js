/* FlowerPower — деликатные анимации появления и липкий хедер. */
(function () {
  "use strict";

  // Липкий хедер
  var header = document.getElementById("header");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Без поддержки IntersectionObserver — показываем всё сразу
  if (!("IntersectionObserver" in window)) {
    var all = document.querySelectorAll(".reveal");
    for (var z = 0; z < all.length; z++) all[z].classList.add("in");
    return;
  }

  // Появление при скролле
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });

  function observeReveal(el) {
    if (!el || el.classList.contains("in")) return;
    io.observe(el);
  }
  // собирает .reveal внутри узла (включая сам узел)
  function collectReveal(root) {
    if (!root) return;
    if (root.classList && root.classList.contains("reveal")) observeReveal(root);
    if (root.querySelectorAll) {
      var els = root.querySelectorAll(".reveal");
      for (var i = 0; i < els.length; i++) observeReveal(els[i]);
    }
  }

  function scan() { collectReveal(document); }

  // 1) статичные reveal, уже присутствующие в DOM на момент загрузки скрипта
  scan();

  // 2) динамически отрисованные блоки (story__col, feature и др.)
  //    появляются при построении DOM (apply-content.js на DOMContentLoaded),
  //    поэтому повторно сканируем после готовности DOM и после полной загрузки
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan);
  } else {
    scan();
  }
  window.addEventListener("load", scan);

  // 3) запасной ловитель поздних вставок узлов с .reveal
  if ("MutationObserver" in window) {
    var bo = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType === 1) collectReveal(n);
        });
      });
    });
    bo.observe(document.body, { childList: true, subtree: true });
  }
})();
