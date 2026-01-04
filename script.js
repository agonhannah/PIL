/* =========================================================
   script.js
   - Drawer open/close + panel navigation
   - Year
   - Pointer FX (touch: spawn only, NO follow)
========================================================= */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // iOSで(pointer:coarse)が外れる事があるので、touch判定を強化
  const isTouch =
    ("ontouchstart" in window) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    window.matchMedia("(pointer: coarse)").matches;

  document.body.classList.toggle("is-touch", isTouch);

  // Year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Drawer
  const menuBtn = $("#menuBtn");
  const overlay = $("#overlay");
  const drawer = $("#drawer");
  const drawerStack = $("#drawerStack");
  const panels = drawerStack ? $$(".drawer__panel", drawerStack) : [];

  const panelByName = (name) => panels.find((p) => p.dataset.panel === name);
  let panelStack = ["main"];

  const setAriaOpen = (open) => {
    if (menuBtn) menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (drawer) {
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
      drawer.classList.toggle("is-open", open);
    }
    if (overlay) overlay.hidden = !open;
    document.body.classList.toggle("is-locked", open);
  };

  const showPanel = (name, push = true) => {
    const next = panelByName(name);
    if (!next) return;

    panels.forEach((p) => p.classList.remove("is-active"));
    next.classList.add("is-active");

    if (push) {
      const last = panelStack[panelStack.length - 1];
      if (last !== name) panelStack.push(name);
    }
  };

  const goBack = () => {
    if (panelStack.length <= 1) {
      showPanel("main", false);
      panelStack = ["main"];
      return;
    }
    panelStack.pop();
    showPanel(panelStack[panelStack.length - 1] || "main", false);
  };

  const openDrawer = () => {
    setAriaOpen(true);
    showPanel(panelStack[panelStack.length - 1] || "main", false);
  };

  const closeDrawer = () => {
    setAriaOpen(false);
    showPanel("main", false);
    panelStack = ["main"];
  };

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const expanded = menuBtn.getAttribute("aria-expanded") === "true";
      expanded ? closeDrawer() : openDrawer();
    });
  }
  if (overlay) overlay.addEventListener("click", closeDrawer);

  if (drawerStack) {
    drawerStack.addEventListener("click", (e) => {
      const t = e.target;

      const closeBtn = t.closest("[data-close]");
      if (closeBtn) {
        e.preventDefault();
        closeDrawer();
        return;
      }

      const backBtn = t.closest("[data-back]");
      if (backBtn) {
        e.preventDefault();
        goBack();
        return;
      }

      const openBtn = t.closest("[data-open-panel]");
      if (openBtn) {
        e.preventDefault();
        showPanel(openBtn.getAttribute("data-open-panel"), true);
        return;
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (drawer && drawer.classList.contains("is-open")) closeDrawer();
    }
  });

  // TOP link (if exists)
  const topLink = $("#topLink") || $(".topbar__top");
  if (topLink) {
    topLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      closeDrawer();
    });
  }

  // Pointer FX
  const fx = $("#pointer-fx");
  if (fx) {
    let x = -9999, y = -9999;
    let tx = -9999, ty = -9999;
    let idleTimer = null;

    // Mobile: Point HERE ラベル不要（緑blobのみ）
    if (isTouch) {
      const lockbox = $("#lockbox");
      if (lockbox) lockbox.style.display = "none";
    }

    const setTransform = (nx, ny) => {
      x = nx; y = ny;
      tx = nx; ty = ny;
      fx.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const show = () => { fx.style.opacity = "1"; };

    const scheduleIdleFade = () => {
      // “パッと消えすぎない”範囲で少し早め
      const ms = isTouch ? 1200 : 1400;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { fx.style.opacity = "0"; }, ms);
    };

    // Desktop: follow
    const onDesktopMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      show();
      scheduleIdleFade();
    };

    // Touch: spawn only (NO follow)
    // touchstart/ pointerdown で位置確定、以後 move を一切拾わない
    const onTouchSpawn = (e) => {
      const p = e.touches ? e.touches[0] : e;
      if (!p) return;
      show();
      setTransform(p.clientX, p.clientY); // ←ここで固定
      scheduleIdleFade();
    };

    const tick = () => {
      if (!isTouch) {
        // follow (lerp)
        x += (tx - x) * 0.18;
        y += (ty - y) * 0.18;
        fx.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      requestAnimationFrame(tick);
    };

    if (isTouch) {
      // move系は絶対登録しない
      window.addEventListener("touchstart", onTouchSpawn, { passive: true });
      window.addEventListener("pointerdown", onTouchSpawn, { passive: true });
    } else {
      window.addEventListener("pointermove", onDesktopMove, { passive: true });
      window.addEventListener("pointerdown", onDesktopMove, { passive: true });
    }

    requestAnimationFrame(tick);
  }
})();