/* Применяет редактируемый контент (assets/content.js) к странице.
   Наполняет [data-cvet] текстом, [data-cvet-link] — контактами,
   и рендерит динамические блоки (карточки «Почему мы», фичи, story,
   hero-действия, карточки концептов на хабе). */
(function () {
  "use strict";
  var C = window.CVET_CONTENT;
  if (!C) return;

  function pageKey() {
    var p = location.pathname;
    if (p.indexOf("/concept-1/") >= 0) return "concept1";
    if (p.indexOf("/concept-2/") >= 0) return "concept2";
    if (p.indexOf("/concept-3/") >= 0) return "concept3";
    return "hub";
  }

  function get(obj, path) {
    var parts = String(path).split(".");
    var o = obj;
    for (var i = 0; i < parts.length; i++) {
      if (o == null) return "";
      o = o[parts[i]];
    }
    return o == null ? "" : o;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
    });
  }

  function formatPhone(ph) {
    var m = String(ph || "").replace(/\D/g, "");
    if (m.length === 11 && m.charAt(0) === "7") {
      return "+7 " + m.slice(1, 4) + " " + m.slice(4, 7) + "-" + m.slice(7, 9) + "-" + m.slice(9);
    }
    return ph || "";
  }

  function applyText(data) {
    var nodes = document.querySelectorAll("[data-cvet]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var v = get(data, el.getAttribute("data-cvet"));
      if (typeof v === "string") el.innerHTML = v;
    }
  }

  function applyContacts(data) {
    var c = data.contacts || {};
    var tg = c.telegram || "", ch = c.channel || "", ph = c.phone || "",
        vk = c.vk || "", ig = c.instagram || "", wa = c.whatsapp || "";
    var ICON = { vk: "f-vk", instagram: "f-ig", telegram: "f-tg", channel: "f-tg", whatsapp: "f-wa", phone: "f-ph" };
    var links = document.querySelectorAll("[data-cvet-link]");
    for (var i = 0; i < links.length; i++) {
      var el = links[i];
      var type = el.getAttribute("data-cvet-link");
      var keep = el.getAttribute("data-cvet-keep-text");
      var href = "#", label = type;
      if (type === "telegram") { href = "https://t.me/" + tg; label = "Telegram"; }
      else if (type === "channel") { href = "https://t.me/" + ch; label = "Канал"; }
      else if (type === "vk") { href = vk; label = "VK"; }
      else if (type === "instagram") { href = ig; label = "Instagram"; }
      else if (type === "whatsapp") { href = wa || ("https://wa.me/" + ph.replace(/\D/g, "")); label = "WhatsApp"; }
      else if (type === "phone") { href = "tel:" + ph; label = formatPhone(ph); }
      el.setAttribute("href", href);
      if (keep) continue; // keep-text (напр. «Заказ») — только меняем ссылку, текст оставляем
      var ic = ICON[type] || "";
      el.innerHTML = '<svg class="ci" viewBox="0 0 24 24" aria-hidden="true"><use href="#' + ic + '"/></svg><span class="ci__t">' + label + '</span>';
    }
    // зеркалируем в BRAND, чтобы checkout в store.js брал актуальные контакты
    if (window.CVET && window.CVET.BRAND) {
      window.CVET.BRAND.bot = tg;
      window.CVET.BRAND.channel = ch;
      window.CVET.BRAND.phone = ph;
      window.CVET.BRAND.vk = vk;
      window.CVET.BRAND.instagram = ig;
      window.CVET.BRAND.whatsapp = wa;
    }
  }

  function renderUsps(data) {
    var box = document.querySelector("[data-cvet-usps]");
    if (!box || !data.usps) return;
    var icons = window.CVET_ICONS || {};
    var html = "", items = data.usps.items || [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var d = icons[it.icon] || "";
      html +=
        '<div class="usp"><span class="usp__ico"><svg viewBox="0 0 512 512" aria-hidden="true" style="stroke:none">' +
        '<path fill="currentColor" d="' + d + '"/></svg></span>' +
        "<h3>" + esc(it.title) + "</h3><p>" + esc(it.text) + "</p></div>";
    }
    box.innerHTML = html;
  }

  function renderFeatures(data) {
    var box = document.querySelector("[data-cvet-features]");
    if (!box || !data.features) return;
    var html = "", items = data.features || [];
    for (var i = 0; i < items.length; i++) {
      var f = items[i];
      if (f.num) {
        html += '<div class="feature reveal"><span class="feature__num">' + esc(f.num) +
          "</span><h3>" + esc(f.title) + "</h3><p>" + esc(f.text) + "</p></div>";
      } else {
        html += '<div class="feature reveal"><span class="feature__ico">' + esc(f.icon || "") +
          "</span><h3>" + esc(f.title) + "</h3><p>" + esc(f.text) + "</p></div>";
      }
    }
    box.innerHTML = html;
  }

  function renderStory(data) {
    var box = document.querySelector("[data-cvet-story]");
    if (!box || !data.story) return;
    var s = data.story, html = "", i;
    if (s.kind === "quote") {
      var cols = s.cols || [];
      for (i = 0; i < cols.length; i++) {
        html += '<div class="story__col reveal"><h3>' + esc(cols[i].title) +
          "</h3><p>" + esc(cols[i].text) + "</p></div>";
      }
    } else {
      var cards = s.cards || [];
      for (i = 0; i < cards.length; i++) {
        var cd = cards[i];
        html += '<div class="story__card reveal">' +
          (cd.icon ? '<span class="story__ico">' + esc(cd.icon) + "</span>" : "") +
          "<h3>" + esc(cd.title) + "</h3><p>" + esc(cd.text) + "</p></div>";
      }
    }
    box.innerHTML = html;
  }

  function renderActions(data) {
    var box = document.querySelector("[data-cvet-actions]");
    if (!box || !data.hero || !data.hero.actions) return;
    var acts = data.hero.actions || [], html = "", i;
    var c = data.contacts || {};
    for (i = 0; i < acts.length; i++) {
      var a = acts[i];
      var href = a.link === "telegram"
        ? ("https://t.me/" + (c.telegram || ""))
        : (a.link === "vk" ? (c.vk || "#")
          : (a.link === "instagram" ? (c.instagram || "#") : (a.href || "#")));
      html += '<a class="btn ' + (a.cls || "btn--solid") + '" href="' + esc(href) + '">' + esc(a.label) + "</a>";
    }
    box.innerHTML = html;
  }

  function renderChips(data) {
    var box = document.querySelector("[data-cvet-chips]");
    if (!box || !data.hero || !data.hero.chips) return;
    var chips = data.hero.chips || [], html = "", i;
    for (i = 0; i < chips.length; i++) {
      html += '<span class="chip">' + esc(chips[i]) + "</span>";
    }
    box.innerHTML = html;
  }

  function renderHubCards(data) {
    var box = document.querySelector("[data-cvet-cards]");
    if (!box || !data.cards) return;
    var cards = data.cards || [], html = "", i;
    for (i = 0; i < cards.length; i++) {
      var c = cards[i];
      html +=
        '<a class="ccard ccard--' + (i + 1) + '" href="' + esc(c.href || "#") + '">' +
        '<div class="ccard__media"><img src="' + esc(c.img) + '" alt="' + esc(c.alt || "") + '" loading="lazy"></div>' +
        '<div class="ccard__body"><span class="ccard__num">' + esc(c.num) + "</span>" +
        '<h3 class="ccard__title">' + esc(c.title) + "</h3>" +
        '<p class="ccard__desc">' + esc(c.desc) + "</p>" +
        '<span class="ccard__go">Открыть концепт →</span></div></a>';
    }
    box.innerHTML = html;
  }

  function renderHubNote(data) {
    var box = document.querySelector("[data-cvet-note-items]");
    if (!box || !data.note || !data.note.items) return;
    var items = data.note.items || [], html = "", i;
    for (i = 0; i < items.length; i++) {
      html += "<li>" + items[i] + "</li>"; // элементы могут содержать <b> и т.п.
    }
    box.innerHTML = html;
  }

  function init() {
    var data = C[pageKey()];
    if (!data) return;
    applyText(data);
    applyContacts(data);
    renderUsps(data);
    renderFeatures(data);
    renderStory(data);
    renderActions(data);
    renderChips(data);
    renderHubCards(data);
    renderHubNote(data);
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
