// ==============================
// year
// ==============================
var yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ==============================
// Drawer (history-safe / multi-level)
// + Preview injection on panel transition
// ==============================
(function () {
  var menuBtn = document.getElementById("menuBtn");
  var drawer  = document.getElementById("drawer");
  var overlay = document.getElementById("overlay");
  var stack   = document.getElementById("drawerStack");

  if (!menuBtn || !drawer || !overlay || !stack) return;

  var panelHistory = [];
  var lastCoverByPanel = {}; // panelName -> url（購入drawer到達時に使う）

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

    // ★ panelが切り替わった直後：そのpanelに「最後に覚えているcover」があれば出す
    var panelEl = getPanelByName(name);
    if (panelEl && lastCoverByPanel[name]) {
      setPreview(panelEl, lastCoverByPanel[name]);
    }
  }

  function goPanel(next, coverUrl) {
    var current = getActivePanelName();
    if (current !== next) panelHistory.push(current);

    // coverを「遷移先panel用」に保存してから移動
    if (coverUrl) lastCoverByPanel[next] = coverUrl;

    setPanel(next);

    // 念押し：次フレームでもう一回（iOSの描画遅延対策）
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

  function openDrawer() {
    panelHistory = [];
    drawer.classList.add("is-open");
    overlay.hidden = false;
    document.body.classList.add("is-locked");
    setPanel("main");
    setExpanded(true);
  }

  function closeDrawer() {
    panelHistory = [];
    drawer.classList.remove("is-open");
    overlay.hidden = true;
    document.body.classList.remove("is-locked");
    setExpanded(false);
    clearAllPreviews();
  }

  menuBtn.addEventListener("click", openDrawer);
  overlay.addEventListener("click", closeDrawer);

  // open next panel（★coverも一緒に渡す）
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

  // ★PC hover / focus で preview更新（Archive, shopPhysical など）
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

        el.addEventListener("mouseenter", function () {
          setPreview(panel, url);
        });
        el.addEventListener("mouseleave", function () {
          setPreview(panel, "");
        });
        el.addEventListener("focusin", function () {
          setPreview(panel, url);
        });
        el.addEventListener("focusout", function () {
          setPreview(panel, "");
        });
      })(items[i2]);
    }
  })();

  // ★Mobile: “タップした瞬間” preview更新（遅延click対策）
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

  // PC
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

    window.addEventListener("mousemove", function (e) {
      moveFx(e.clientX, e.clientY);
      fx.style.opacity = "1";
    }, { passive: true });

    window.addEventListener("mouseout", function (e) {
      if (!e.relatedTarget && !e.toElement) hardHide();
    });

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

  // Mobile
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

    window.addEventListener("pointerdown", function (e) {
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

    window.addEventListener("pointermove", function (e) {
      if (!isDown) return;
      targetX = e.clientX;
      targetY = e.clientY;
    }, { passive: true });

    window.addEventListener("pointerup", function () {
      isDown = false;
      fadeOutNow();
    }, { passive: true });

    window.addEventListener("pointercancel", function () {
      isDown = false;
      fadeOutNow();
    }, { passive: true });

    hardHide();
  }
})();