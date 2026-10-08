/* Общий движок магазина «Фиори»: каталог, корзина (localStorage),
   изменение числа цветов в букете и количества, формирование заказа и
   отправка в ВК предзаполненным сообщением (без БД и без личных данных). */
(function () {
  "use strict";
  var C = window.CVET;
  var KEY = "cvet_cart_v1";

  /* Фоллбэк: если локальный WebP недоступен, показываем оригинал с сайта заказчика */
  function fallbackImg(p) {
    return p.img || "";
  }

  function rub(n) { return (n || 0).toLocaleString("ru-RU") + " ₽"; }
  function byId(id) { for (var i = 0; i < C.PRODUCTS.length; i++) if (C.PRODUCTS[i].id === id) return C.PRODUCTS[i]; return null; }
  function lineKey(id, stems) { return id + "#" + stems; }

  /* ---------- состояние корзины ---------- */
  var cart = load();
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }

  function addToCart(id, stems, qty) {
    stems = Math.max(1, parseInt(stems, 10) || byId(id).def);
    qty = Math.max(1, parseInt(qty, 10) || 1);
    var k = lineKey(id, stems);
    if (cart[k]) cart[k].qty += qty; else cart[k] = { id: id, stems: stems, qty: qty };
    save(); renderCart(); updateBadge(); toast("Добавлено в корзину 🌷");
  }
  function setStems(k, stems) {
    var it = cart[k]; if (!it) return;
    stems = Math.max(1, parseInt(stems, 10) || it.stems);
    var nk = lineKey(it.id, stems);
    if (nk === k) { it.stems = stems; }
    else { delete cart[k]; cart[nk] = { id: it.id, stems: stems, qty: it.qty }; }
    save(); renderCart(); updateBadge();
  }
  function setQty(k, qty) {
    var it = cart[k]; if (!it) return;
    qty = parseInt(qty, 10);
    if (qty <= 0) { delete cart[k]; } else { it.qty = qty; }
    save(); renderCart(); updateBadge();
  }
  function removeItem(k) { delete cart[k]; save(); renderCart(); updateBadge(); }
  function clearCart() { cart = {}; save(); renderCart(); updateBadge(); }

  function items() {
    var out = [];
    for (var k in cart) {
      if (!cart.hasOwnProperty(k)) continue;
      var p = byId(cart[k].id); if (!p) continue;
      var line = p.pp * cart[k].stems * cart[k].qty;
      out.push({ key: k, p: p, stems: cart[k].stems, qty: cart[k].qty, line: line });
    }
    return out;
  }
  function total() { var t = 0, a = items(); for (var i = 0; i < a.length; i++) t += a[i].line; return t; }
  function count() { var n = 0, a = items(); for (var i = 0; i < a.length; i++) n += a[i].qty; return n; }

  /* ---------- текст заказа + отправка в ВК ---------- */
  function orderText() {
    var a = items();
    if (!a.length) return "";
    var sel = [];
    var lines = [];
    lines.push("Здравствуйте! Хочу оформить заказ 🌸");
    lines.push("");
    lines.push("Цветы и количество:");
    if (a.length === 1) {
      var only = a[0];
      sel.push(only.p.id + "-" + only.stems + "-" + only.qty);
      lines.push("«**" + only.p.name + "**» = **" + rub(only.line) + "**");
    } else {
      for (var i = 0; i < a.length; i++) {
        var it = a[i];
        sel.push(it.p.id + "-" + it.stems + "-" + it.qty);
        lines.push((i + 1) + ". «**" + it.p.name + "**» — " + it.stems + " цветов × " + it.qty + " шт. = **" + rub(it.line) + "**");
      }
    }
    lines.push("");
    lines.push("Итого: **" + rub(total()) + "**");
    lines.push("");
    lines.push("Адрес доставки:");
    lines.push("Когда доставить:");
    lines.push("Номер получателя:");
    lines.push("Имя получателя:");
    lines.push("Личные пожелания:");
    lines.push("");
    lines.push("Буду благодарен(а) за подтверждение и удобное время доставки!");
    lines.push("");
    lines.push("Чек-лист заказа: " + C.BRAND.base + "order.html?i=" + encodeURIComponent(sel.join(",")));
    return lines.join("\n");
  }
  function checkout() {
    var txt = orderText();
    if (!txt) { toast("Корзина пуста"); return; }
    var vk = (C.BRAND && C.BRAND.vk) || "https://vk.ru/fiori.kirishi";
    copyText(txt);
    var w = window.open(vk, "_blank");
    if (!w) { toast("Открыть ВК не удалось — текст заказа скопирован 📋"); }
    else { toast("Открываю ВК Фиори — вставьте текст заказа в сообщение ✨"); }
  }
  function copyText(t) {
    if (navigator.clipboard) navigator.clipboard.writeText(t).catch(function () {});
  }

  /* ---------- рендер каталога ---------- */
  var currentFilter = "Все";
  function renderCatalog(grid) {
    if (!grid) return;
    var list = C.PRODUCTS.slice();
    if (currentFilter !== "Все") list = list.filter(function (p) { return p.cat === currentFilter; });
    var html = "";
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var img = C.BRAND.base + p.photo, fb = fallbackImg(p);
      html += '' +
        '<article class="card" data-id="' + p.id + '">' +
          '<div class="card__media">' +
            '<img class="card__img" src="' + img + '" alt="' + esc(p.name) + '" loading="lazy" ' +
              'onerror="this.onerror=null;this.src=\'' + fb + '\'">' +
            '<span class="card__cat">' + esc(p.cat) + '</span>' +
          '</div>' +
          '<div class="card__body">' +
            '<h3 class="card__name">' + esc(p.name) + '</h3>' +
            '<div class="card__price"><b class="js-card-price">' + rub(p.price) + '</b>' +
              ' <span class="card__unit">за ' + p.def + ' цветов</span></div>' +
            '<div class="card__controls">' +
              '<div class="field">' +
                '<span class="field__label">Цветов в букете</span>' +
                '<div class="stepper" data-stepper>' +
                  '<button type="button" data-act="stems-minus" aria-label="Меньше цветов">−</button>' +
                  '<input class="stepper__val js-stems" value="' + p.def + '" readonly aria-label="Число цветов">' +
                  '<button type="button" data-act="stems-plus" aria-label="Больше цветов">+</button>' +
                '</div>' +
              '</div>' +
              '<div class="field">' +
                '<span class="field__label">Количество</span>' +
                '<div class="qty" data-qty>' +
                  '<button type="button" data-act="qty-minus" aria-label="Меньше">−</button>' +
                  '<span class="qty__val js-qty">1</span>' +
                  '<button type="button" data-act="qty-plus" aria-label="Больше">+</button>' +
                '</div>' +
              '</div>' +
              '<button type="button" class="card__add" data-act="add">В корзину</button>' +
            '</div>' +
          '</div>' +
        '</article>';
    }
    grid.innerHTML = html;
  }

  function renderFilters(el) {
    if (!el) return;
    var cats = ["Все"].concat(C.CATEGORIES);
    var html = "";
    for (var i = 0; i < cats.length; i++) {
      var active = cats[i] === currentFilter ? " is-active" : "";
      html += '<button type="button" class="filter' + active + '" data-filter="' + esc(cats[i]) + '">' + esc(cats[i]) + '</button>';
    }
    el.innerHTML = html;
  }

  /* ---------- рендер корзины ---------- */
  function renderCart() {
    var wrap = document.getElementById("cartItems");
    var empty = document.getElementById("cartEmpty");
    var totalEl = document.getElementById("cartTotal");
    if (!wrap) return;
    var a = items();
    if (!a.length) { wrap.innerHTML = ""; if (empty) empty.style.display = "block"; }
    else { if (empty) empty.style.display = "none"; }
    var html = "";
    for (var i = 0; i < a.length; i++) {
      var it = a[i], p = it.p, fb = fallbackImg(p);
      html += '' +
        '<div class="cart-item" data-key="' + it.key + '">' +
          '<img class="cart-item__img" src="' + C.BRAND.base + p.photo + '" alt="" loading="lazy" onerror="this.onerror=null;this.src=\'' + fb + '\'">' +
          '<div class="cart-item__main">' +
            '<h4 class="cart-item__name">' + esc(p.name) + '</h4>' +
            '<div class="cart-item__price js-item-price">' + rub(it.line) + '</div>' +
            '<div class="cart-item__ctrls">' +
              '<div class="stepper stepper--sm" data-stepper>' +
                '<button type="button" data-act="stems-minus" aria-label="Меньше цветов">−</button>' +
                '<input class="stepper__val js-stems" value="' + it.stems + '" readonly>' +
                '<button type="button" data-act="stems-plus" aria-label="Больше цветов">+</button>' +
              '</div>' +
              '<div class="qty qty--sm" data-qty>' +
                '<button type="button" data-act="qty-minus" aria-label="Меньше">−</button>' +
                '<span class="js-qty">' + it.qty + '</span>' +
                '<button type="button" data-act="qty-plus" aria-label="Больше">+</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<button type="button" class="cart-item__del" data-act="remove" aria-label="Удалить">×</button>' +
        '</div>';
    }
    wrap.innerHTML = html;
    if (totalEl) totalEl.textContent = rub(total());
  }

  function updateBadge() {
    var b = document.getElementById("cartBadge");
    if (b) { var n = count(); b.textContent = n; b.style.display = n ? "flex" : "none"; }
  }

  function openCart() { var c = document.getElementById("cart"); if (c) { c.classList.add("is-open"); c.setAttribute("aria-hidden", "false"); } }
  function closeCart() { var c = document.getElementById("cart"); if (c) { c.classList.remove("is-open"); c.setAttribute("aria-hidden", "true"); } }

  /* ---------- тост ---------- */
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("is-show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("is-show"); }, 2200);
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- делегирование событий ---------- */
  function onAct(e) {
    // фильтры каталога (кнопки не имеют data-act — обрабатываем до раннего return)
    var filt = e.target.closest ? e.target.closest("[data-filter]") : null;
    if (filt) {
      currentFilter = filt.getAttribute("data-filter");
      renderFilters(document.getElementById("filters"));
      renderCatalog(document.getElementById("catalogGrid"));
      return;
    }

    var t = e.target.closest ? e.target.closest("[data-act]") : null;
    if (!t) return;
    var act = t.getAttribute("data-act");

    if (act === "open-cart") { openCart(); return; }
    if (act === "close-cart") { closeCart(); return; }
    if (act === "checkout") { checkout(); return; }
    if (act === "clear-cart") { clearCart(); return; }

    // карточка каталога
    var card = e.target.closest ? e.target.closest(".card") : null;
    if (card) {
      var id = card.getAttribute("data-id");
      var p = byId(id);
      var stemsEl = card.querySelector(".js-stems");
      var qtyEl = card.querySelector(".js-qty");
      var priceEl = card.querySelector(".js-card-price");
      if (act === "stems-plus") { var s1 = (parseInt(stemsEl.value, 10) || p.def) + 1; stemsEl.value = s1; if (priceEl) priceEl.textContent = rub(p.pp * s1); }
      else if (act === "stems-minus") { var s2 = Math.max(1, (parseInt(stemsEl.value, 10) || p.def) - 1); stemsEl.value = s2; if (priceEl) priceEl.textContent = rub(p.pp * s2); }
      else if (act === "qty-plus") { qtyEl.textContent = (parseInt(qtyEl.textContent, 10) || 1) + 1; }
      else if (act === "qty-minus") { qtyEl.textContent = Math.max(1, (parseInt(qtyEl.textContent, 10) || 1) - 1); }
      else if (act === "add") { addToCart(id, stemsEl.value, qtyEl.textContent); }
      return;
    }

    // позиция в корзине
    var ci = e.target.closest ? e.target.closest(".cart-item") : null;
    if (ci) {
      var key = ci.getAttribute("data-key");
      var it = cart[key]; if (!it) return;
      if (act === "stems-plus") setStems(key, it.stems + 1);
      else if (act === "stems-minus") setStems(key, it.stems - 1);
      else if (act === "qty-plus") setQty(key, it.qty + 1);
      else if (act === "qty-minus") setQty(key, it.qty - 1);
      else if (act === "remove") removeItem(key);
      return;
    }
  }

  function init() {
    renderFilters(document.getElementById("filters"));
    renderCatalog(document.getElementById("catalogGrid"));
    renderCart();
    updateBadge();
    document.addEventListener("click", onAct);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCart(); });
  }

  window.CvetStore = { init: init, openCart: openCart, rub: rub };
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
