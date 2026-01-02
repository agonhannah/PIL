// ==============================
// year
// ==============================
var yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ==============================
// Drawer (history-safe / multi-level)
// + Preview injection on panel transition
// + ESC close + focus restore + basic focus trap
// ==============================
(function () {
  var menuBtn = document.getElementById("menuBtn");
  var drawer  = document.getElementById("drawer");
  var overlay = document.getElementById("overlay");
  var stack   = document.getElementById("drawerStack");

  if (!menuBtn || !drawer || !overlay || !stack) return;

  var panelHistory = [];
  var lastCoverByPanel = {}; // panelName -> url
  var lastFocusEl = null;

  function setExpanded(isOpen) {
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    drawer.setAttribute("aria-hidden", String(!isOpen));
  }

  function getActivePanel() {
    return stack.querySelector(".drawer__panel.is-active");
  }

  function getActivePanelName() {
    var p = getActivePanel();
    return p && p.dataset ? p.dataset.panel : "main";
  }

  function getPanelByName(name) {
    return stack.querySelector('.drawer__panel[data-panel="' + name + '"]');
  }

  function getPreviewEl(panelEl) {
    if (!panelEl) return null;
    return panelEl.querySelector(".drawer__preview");
  }

  function setPreview(panelEl, url) {
    var pv = getPreviewEl(panelEl);
    if (!pv) return;

    if (!url) {
      pv.style.opacity = "0";
      pv.style.backgroundImage = "";
      return;
    }
    pv.style.backgroundImage = 'url("' + url + '")';
    pv.style.opacity = "1";
  }

  function clearAllPreviews() {
    var pvs = stack.querySelectorAll(".drawer__panel .drawer__preview");
    for (var i = 0; i < pvs.length; i++) {
      pvs[i].style.opacity = "0";
      pvs[i].style.backgroundImage = "";
    }
  }

  function setPanel(name) {
    var panels = stack.querySelectorAll(".drawer__panel");
    for (var i = 0; i < panels.length; i++) {
      var panel = panels[i];
      var isActive = panel.dataset && panel.dataset.panel === name;
      panel.classList.toggle("is-active", isActive);
    }

    // panel切替後：そのpanelに「最後に覚えているcover」があれば出す
    var panelEl = getPanelByName(name);
    if (panelEl && lastCoverByPanel[name]) {
      setPreview(panelEl, lastCoverByPanel[name]);
    }
  }

  function goPanel(next, coverUrl) {
    var current = getActivePanelName();
    if (current !== next) panelHistory.push(current);

    if (coverUrl) lastCoverByPanel[next] = coverUrl;

    setPanel(next);

    // 念押し：次フレームでもう一回（iOS描画遅延対策）
    if (coverUrl) {
      requestAnimationFrame(function () {
        var nextPanel = getPanelByName(next);
        setPreview(nextPanel, coverUrl);
      });
    }
  }

  function goBack() {
    var prev = panelHistory.pop() || "main";
    setPanel(prev);
  }

  function focusFirstFocusable() {
    // 「閉じる」ボタン優先
    var active = getActivePanel();
    if (!active) return;

    var closeBtn = active.querySelector("[data-close]");
    if (closeBtn) { closeBtn.focus(); return; }

    // 次点
    var focusable = active.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
  }

  function openDrawer() {
    panelHistory = [];
    lastFocusEl = document.activeElement || menuBtn;

    clearAllPreviews();         // ← 残像防止
    setPanel("main");

    drawer.classList.add("is-open");
    overlay.hidden = false;
    document.body.classList.add("is-locked");
    setExpanded(true);

    // フォーカスをdrawerへ
    requestAnimationFrame(function () {
      focusFirstFocusable();
    });

    // pointer-fx を強制的に消す（drawer操作優先）
    var fx = document.getElementById("pointer-fx");
    if (fx) fx.style.opacity = "0";
  }

  function closeDrawer() {
    panelHistory = [];

    drawer.classList.remove("is-open");
    overlay.hidden = true;
    document.body.classList.remove("is-locked");
    setExpanded(false);

    clearAllPreviews();

    // フォーカスを戻す
    requestAnimationFrame(function () {
      if (lastFocusEl && typeof lastFocusEl.focus === "function") {
        lastFocusEl.focus();
      } else {
        menuBtn.focus();
      }
    });
  }

  // open / close
  menuBtn.addEventListener("click", openDrawer);
  overlay.addEventListener("click", closeDrawer);

  // ESC to close
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer.classList.contains("is-open")) {
      e.preventDefault();
      closeDrawer();
    }
  });

  // basic focus trap (Tab が背景に抜けない)
  window.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    if (!drawer.classList.contains("is-open")) return;

    var activePanel = getActivePanel();
    if (!activePanel) return;

    var focusables = activePanel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;

    var first = focusables[0];
    var last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // open next panel（coverも一緒に渡す）
  var openBtns = stack.querySelectorAll("[data-open-panel]");
  for (var i = 0; i < openBtns.length; i++) {
    (function (btn) {
      btn.addEventListener("click", function () {
        var next = btn.dataset ? btn.dataset.openPanel : null;
        if (!next) return;

        var cover = btn.dataset ? btn.dataset.cover : "";
        goPanel(next, cover);
      });
    })(openBtns[i]);
  }

  // back
  var backBtns = stack.querySelectorAll("[data-back]");
  for (var j = 0; j < backBtns.length; j++) {
    backBtns[j].addEventListener("click", goBack);
  }

  // close
  var closeBtns = stack.querySelectorAll("[data-close]");
  for (var k = 0; k < closeBtns.length; k++) {
    closeBtns[k].addEventListener("click", closeDrawer);
  }

  // PC hover / focus preview
  (function bindHoverPreview() {
    var hasMM = typeof window.matchMedia === "function";
    var isFine = hasMM ? window.matchMedia("(pointer: fine)").matches : false;
    if (!isFine) return;

    var items = stack.querySelectorAll("[data-cover]");
    for (var i2 = 0; i2 < items.length; i2++) {
      (function (el) {
        var url = el.dataset ? el.dataset.cover : "";
        if (!url) return;

        var panel = el.closest ? el.closest(".drawer__panel") : null;
        if (!panel) return;

        el.addEventListener("mouseenter", function () { setPreview(panel, url); });
        el.addEventListener("mouseleave", function () { setPreview(panel, ""); });
        el.addEventListener("focusin",   function () { setPreview(panel, url); });
        el.addEventListener("focusout",  function () { setPreview(panel, ""); });
      })(items[i2]);
    }
  })();

  // Mobile tap preview（遅延click対策）
  (function bindMobileTapPreview() {
    var hasMM = typeof window.matchMedia === "function";
    var isCoarse = hasMM ? window.matchMedia("(pointer: coarse)").matches : false;
    if (!isCoarse) return;

    document.body.classList.add("is-touch");

    var items = stack.querySelectorAll("[data-cover]");
    for (var i3 = 0; i3 < items.length; i3++) {
      (function (el) {
        var url = el.dataset ? el.dataset.cover : "";
        if (!url) return;

        var panel = el.closest ? el.closest(".drawer__panel") : null;
        if (!panel) return;

        el.addEventListener("pointerdown", function () {
          setPreview(panel, url);
        }, { passive: true });
      })(items[i3]);
    }
  })();
})();

// ==============================
// Pointer FX (PC + Mobile)
// ==============================
(function () {
  var fx      = document.getElementById("pointer-fx");
  var lockbox = document.getElementById("lockbox");
  if (!fx) return;

  var drawer  = document.getElementById("drawer");
  var overlay = document.getElementById("overlay");

  var mmFine   = (typeof window.matchMedia === "function") ? window.matchMedia("(pointer: fine)") : null;
  var mmCoarse = (typeof window.matchMedia === "function") ? window.matchMedia("(pointer: coarse)") : null;
  var isFinePointer   = !!(mmFine && mmFine.matches);
  var isCoarsePointer = !!(mmCoarse && mmCoarse.matches);

  function moveFx(x, y) {
    fx.style.transform = "translate3d(" + x + "px, " + y + "px, 0)";
  }

  function hardHide() {
    fx.style.opacity = "0";
    fx.style.transform = "translate3d(-9999px, -9999px, 0)";
    if (lockbox) lockbox.style.opacity = "0";
  }

  // ============================
  // PC (fine pointer)
  // ============================
  if (isFinePointer) {
    fx.style.opacity = "0";

    var CLICKABLE_SELECTOR = [
      "a[href]",
      "button",
      '[role="button"]',
      "[data-open-panel]",
      "[data-close]",
      "[data-back]",
      ".drawer__item",
      ".drawer__listItem",
      ".pill",
      ".btn"
    ].join(",");

    function closestClickable(el) {
      if (!el || !el.closest) return null;
      return el.closest(CLICKABLE_SELECTOR);
    }

    function showFxAtEvent(e) {
      moveFx(e.clientX, e.clientY);
      fx.style.opacity = "1";
    }

    // ★ window だけだと drawer/overlay 上で拾えない環境があるので増やす
    document.addEventListener("mousemove", showFxAtEvent, { passive: true });
    if (drawer)  drawer.addEventListener("mousemove", showFxAtEvent, { passive: true });
    if (overlay) overlay.addEventListener("mousemove", showFxAtEvent, { passive: true });

    // ★ 強すぎる window mouseout は切る（これが drawer 周りで誤発火することがある）
    // 代わりに「ドキュメント外に出た」だけで消す
    document.addEventListener("mouseleave", hardHide);

    window.addEventListener("blur", hardHide);

    if (lockbox) {
      function showLockbox() { lockbox.style.opacity = "1"; }
      function hideLockbox() { lockbox.style.opacity = "0"; }

      document.addEventListener("mouseover", function (e) {
        if (closestClickable(e.target)) showLockbox();
      });

      document.addEventListener("mouseout", function (e) {
        var from = closestClickable(e.target);
        var to   = closestClickable(e.relatedTarget);
        if (from && from !== to) hideLockbox();
      });

      document.addEventListener("focusin", function (e) {
        if (closestClickable(e.target)) showLockbox();
      });

      document.addEventListener("focusout", hideLockbox);
    }

    hardHide();
    return;
  }

  // ============================
  // Mobile (coarse pointer)
  // ============================
  if (isCoarsePointer) {
    document.body.classList.add("is-touch");

    var targetX = -9999, targetY = -9999;
    var curX = -9999, curY = -9999;
    var rafId = null;
    var isDown = false;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function render() {
      var t = 0.18;
      curX = lerp(curX, targetX, t);
      curY = lerp(curY, targetY, t);
      moveFx(curX, curY);
      rafId = requestAnimationFrame(render);
    }

    function startRAF() {
      if (rafId) return;
      rafId = requestAnimationFrame(render);
    }

    function stopRAF() {
      if (!rafId) return;
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    function showFx() {
      fx.style.opacity = "1";
      startRAF();
    }

    function fadeOutNow() {
      fx.style.opacity = "0";
      setTimeout(function () {
        targetX = targetY = curX = curY = -9999;
        fx.style.transform = "translate3d(-9999px, -9999px, 0)";
        stopRAF();
      }, 1000);
    }

    // ★ iOSでdrawer内タップが取りこぼされる場合があるので document で拾う
    document.addEventListener("pointerdown", function (e) {
      isDown = true;

      targetX = e.clientX;
      targetY = e.clientY;
      curX = targetX;
      curY = targetY;

      fx.style.transition = "none";
      moveFx(curX, curY);

      showFx();
      requestAnimationFrame(function () {
        fx.style.transition = "";
      });
    }, { passive: true });

    document.addEventListener("pointermove", function (e) {
      if (!isDown) return;
      targetX = e.clientX;
      targetY = e.clientY;
    }, { passive: true });

    document.addEventListener("pointerup", function () {
      isDown = false;
      fadeOutNow();
    }, { passive: true });

    document.addEventListener("pointercancel", function () {
      isDown = false;
      fadeOutNow();
    }, { passive: true });

    hardHide();
  }
})();

  