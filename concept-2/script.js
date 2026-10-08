/* Концепт «Ателье» — липкий хедер. */
(function () {
  "use strict";
  var header = document.getElementById("header");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 30); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();