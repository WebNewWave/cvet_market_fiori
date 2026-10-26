/* Админка сайта «FlowerPower».
   Редактирует window.CVET_CONTENT (assets/content.js) и window.CVET (assets/data.js),
   сохраняет через GitHub API (PUT contents). Токен хранится только в localStorage. */
(function () {
  "use strict";

  var REPO = "WebNewWave/cvet_market_fiori";
  var API = "https://api.github.com/repos/" + REPO + "/contents/";

  var content = window.CVET_CONTENT || {};
  var icons = window.CVET_ICONS || {};
  var data = window.CVET || {};

  var LABELS = {
    hero: "Hero (верх страницы)", eyebrow: "Надзаголовок", title: "Заголовок",
    lead: "Подзаголовок (лид)", note: "Примечание", stamp: "Печать/штемпель",
    hand: "Рукописный заголовок", sticky: "Стикер", sub: "Подзаголовок секции",
    usps: "Карточки «Почему мы»", catalog: "Секция каталога",
    story: "Блок «О нас»", features: "Преимущества / доставка",
    footer: "Подвал", contacts: "Контакты", cards: "Карточки концептов",
    actions: "Кнопки", chips: "Чипы", quote: "Цитата", cols: "Колонки",
    brand: "Бренд", desc: "Описание", bottom: "Копирайт (низ)",
    contactTitle: "Заголовок контактов", address: "Адрес",
    telegram: "Telegram-бот (без @)", channel: "Канал (без @)", phone: "Телефон", vk: "Ссылка на ВК", instagram: "Ссылка на Instagram", whatsapp: "Ссылка на WhatsApp",
    items: "Пункты списка", icon: "Иконка", num: "Номер", cls: "Класс кнопки",
    href: "Ссылка", link: "Тип ссылки", img: "URL картинки", alt: "Alt (описание)",
    text: "Текст", name: "Название", cat: "Категория", price: "Цена (₽)",
    pp: "Цена за 1 цветок (₽)", pack: "Упаковка (₽)", def: "Число цветов по умолчанию",
    desc: "Описание букета", photo: "Путь к фото", id: "ID",
    note: "Примечание", kind: "Тип раскладки"
  };

  function label(k) { return LABELS[k] || k; }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function escAttr(s) { return String(s == null ? "" : s); }

  /* ---------- универсальный редактор ---------- */
  function editValue(parent, obj, key, isHtml) {
    var val = obj[key];
    var wrap = el("div", "fld");
    wrap.appendChild(el("label", null, label(key)));

    if (key === "icon" && icons && Object.keys(icons).length) {
      var sel = el("select", "inp");
      Object.keys(icons).forEach(function (k) {
        var o = el("option", null, k); o.value = k;
        if (k === val) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener("change", function () { obj[key] = sel.value; });
      wrap.appendChild(sel);
    } else if (key === "link") {
      var s2 = el("select", "inp");
      [["", "— обычная —"], ["telegram", "Telegram (бот)"], ["instagram", "Instagram (ссылка)"], ["whatsapp", "WhatsApp (ссылка)"]].forEach(function (p) {
        var o = el("option", null, p[1]); o.value = p[0];
        if (p[0] === val) o.selected = true;
        s2.appendChild(o);
      });
      s2.addEventListener("change", function () { obj[key] = s2.value; });
      wrap.appendChild(s2);
    } else if (typeof val === "string") {
      var big = val.length > 50 || /[<>]/.test(val);
      var inp = big ? el("textarea", "inp") : el("input", "inp");
      inp.value = val;
      inp.addEventListener("input", function () { obj[key] = inp.value; });
      wrap.appendChild(inp);
    } else if (Array.isArray(val)) {
      // массив редактируется отдельным блоком ниже
      parent.appendChild(wrap);
      editArray(parent, val, key);
      return;
    } else if (val && typeof val === "object") {
      parent.appendChild(wrap);
      var fs = el("fieldset", "grp");
      fs.appendChild(el("legend", null, label(key)));
      editObject(fs, val);
      parent.appendChild(fs);
      return;
    }
    parent.appendChild(wrap);
  }

  function editArray(parent, arr, key) {
    var box = el("div", "arr");
    parent.appendChild(box);
    arr.forEach(function (item, i) {
      var card = el("div", "card");
      if (typeof item === "string") {
        var inp = el("input", "inp"); inp.value = item;
        inp.addEventListener("input", function () { arr[i] = inp.value; });
        card.appendChild(inp);
      } else if (item && typeof item === "object") {
        Object.keys(item).forEach(function (k) { editValue(card, item, k); });
      }
      var del = el("button", "del", "🗑 Удалить");
      del.addEventListener("click", function () {
        arr.splice(i, 1); rebuildArray(box, arr, key);
      });
      card.appendChild(del);
      box.appendChild(card);
    });
    var add = el("button", "add", "＋ Добавить");
    add.addEventListener("click", function () {
      arr.push(defaultItem(arr[0]));
      rebuildArray(box, arr, key);
    });
    box.appendChild(add);
  }

  function rebuildArray(box, arr, key) {
    while (box.firstChild) box.removeChild(box.firstChild);
    editArray(box, arr, key);
  }

  function defaultItem(sample) {
    if (!sample) return "";
    if (Array.isArray(sample)) return [];
    if (sample && typeof sample === "object") {
      var o = {};
      Object.keys(sample).forEach(function (k) { o[k] = typeof sample[k] === "string" ? "" : defaultItem(sample[k]); });
      return o;
    }
    return "";
  }

  function editObject(container, obj) {
    Object.keys(obj).forEach(function (k) { editValue(container, obj, k); });
  }

  /* ---------- построение всех редакторов ---------- */
  function buildEditors() {
    buildPage("shop");
    buildProducts();
  }
  function buildPage(pageKey) {
    var root = document.getElementById("ed-" + pageKey);
    if (!root) return;
    root.innerHTML = "";
    var fs = el("fieldset", "grp");
    fs.appendChild(el("legend", null, "Страница: " + label(pageKey)));
    editObject(fs, content[pageKey]);
    root.appendChild(fs);
  }
  function buildProducts() {
    var root = document.getElementById("ed-products");
    if (!root || !data.PRODUCTS) return;
    root.innerHTML = "";
    var fs = el("fieldset", "grp");
    fs.appendChild(el("legend", null, "Товары каталога"));
    var cats = data.CATEGORIES || [];
    data.PRODUCTS.forEach(function (p, i) {
      var card = el("div", "card prod");
      [["name", "inp"], ["price", "inp num"], ["pp", "inp num"], ["pack", "inp num"], ["def", "inp num"], ["desc", "inp"], ["cat", "inp"], ["photo", "inp"]].forEach(function (pair) {
        var k = pair[0];
        var w = el("div", "fld");
        w.appendChild(el("label", null, label(k)));
        if (k === "cat") {
          var sel = el("select", "inp");
          cats.forEach(function (c) { var o = el("option", null, c); o.value = c; if (c === p.cat) o.selected = true; sel.appendChild(o); });
          sel.addEventListener("change", function () { p.cat = sel.value; });
          w.appendChild(sel);
        } else {
          var inp = el("input", "inp"); inp.value = p[k];
          if (pair[1].indexOf("num") >= 0) inp.type = "number";
          inp.addEventListener("input", function () { p[k] = inp.value; });
          w.appendChild(inp);
        }
        card.appendChild(w);
      });
      var del = el("button", "del", "🗑 Удалить товар");
      del.addEventListener("click", function () { data.PRODUCTS.splice(i, 1); buildProducts(); });
      card.appendChild(del);
      fs.appendChild(card);
    });
    var add = el("button", "add", "＋ Добавить товар");
    add.addEventListener("click", function () {
      data.PRODUCTS.push({ id: "p" + Date.now(), name: "Новый товар", cat: cats[0] || "", price: 0, def: 1, pp: 0, pack: 0, img: "", photo: "", desc: "" });
      buildProducts();
    });
    fs.appendChild(add);
    root.appendChild(fs);
  }

  /* ---------- GitHub save ---------- */
  function getToken() {
    return (document.getElementById("token").value || "").trim();
  }
  function status(msg, ok) {
    var s = document.getElementById("status");
    s.textContent = msg;
    s.className = ok ? "ok" : "err";
  }
  function buildContentText() {
    return "/* Редактируемый контент сайта «FlowerPower». Генерируется админкой. */\n\n" +
      "window.CVET_CONTENT = " + JSON.stringify(content, null, 2) + ";\n\n" +
      "window.CVET_ICONS = " + JSON.stringify(icons, null, 2) + ";\n";
  }
  function buildDataText() {
    return "/* Каталог «FlowerPower» — Казань.\n" +
      "   Данные собраны из публикации заказчика и пересчитаны по формуле:\n" +
      "   Цена = упаковка (pack) + цена за стебель (pp) × число стеблей.\n" +
      "   Файл консолидирован для редактирования через админку (admin.html). */\n\n" +
      "window.CVET = " + JSON.stringify(data, null, 2) + ";\n";
  }
  function b64(s) {
    return btoa(unescape(encodeURIComponent(s)));
  }
  async function commitFile(path, text, message) {
    var token = getToken();
    var headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = "token " + token;
    var cur = await fetch(API + path, { headers: { Authorization: "token " + token } });
    if (!cur.ok) throw new Error("Не удалось получить " + path + " (" + cur.status + ")");
    var meta = await cur.json();
    var body = { message: message, content: b64(text), sha: meta.sha };
    var res = await fetch(API + path, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      var t = await res.text();
      throw new Error("Ошибка сохранения " + path + " (" + res.status + "): " + t);
    }
    return res.json();
  }
  async function save() {
    var token = getToken();
    if (!token) { status("Сначала введите GitHub-токен с правами на запись в репозиторий.", false); return; }
    status("Сохраняю…", false);
    try {
      await commitFile("assets/content.js", buildContentText(), "Админка: обновление контента");
      await commitFile("assets/data.js", buildDataText(), "Админка: обновление каталога");
      status("✓ Сохранено в репозиторий. GitHub Pages обновится через 1–2 минуты.", true);
    } catch (e) {
      status("Ошибка: " + e.message, false);
    }
  }

  /* ---------- tabs ---------- */
  function initTabs() {
    var tabs = document.querySelectorAll(".tabs button");
    tabs.forEach(function (b) {
      b.addEventListener("click", function () {
        var t = b.getAttribute("data-tab");
        document.querySelectorAll(".tabs button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        document.querySelectorAll(".tab").forEach(function (s) {
          s.style.display = s.getAttribute("data-tab") === t ? "" : "none";
        });
      });
    });
    // активна первая вкладка
    var first = document.querySelector(".tabs button");
    if (first) first.click();
  }

  function init() {
    var tok = document.getElementById("token");
    tok.value = localStorage.getItem("cvet_admin_token") || "";
    tok.addEventListener("input", function () { localStorage.setItem("cvet_admin_token", tok.value.trim()); });
    document.getElementById("save").addEventListener("click", save);
    buildEditors();
    initTabs();
    status("Готово. Отредактируйте поля и нажмите «Сохранить в репозиторий».", true);
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
