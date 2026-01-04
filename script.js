/* =========================================================
   script.js
   - Drawer open/close + panel navigation
   - Year
   - Pointer FX (mobile: spawn only on tap, NO follow)
========================================================= */

(() => {
  // ---------------------------------------------
  // Helpers
  // ---------------------------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const isCoarse = window.matchMedia("(pointer: coarse)").matches;
  document.body.classList.toggle("is-touch", isCoarse);

  // ---------------------------------------------
  // Year
  // ---------------------------------------------
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ---------------------------------------------
  // Drawer (overlay + panel stack)
  // ---------------------------------------------
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
    const prev = panelStack[panelStack.length - 1] || "main";
    showPanel(prev, false);
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
        const name = openBtn.getAttribute("data-open-panel");
        showPanel(name, true);
        return;
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (drawer && drawer.classList.contains("is-open")) closeDrawer();
    }
  });

  // ---------------------------------------------
  // Drawer preview (optional)
  // ---------------------------------------------
  const attachPreviewHandlers = () => {
    if (!drawerStack) return;

    const updatePreview = (panelEl, url) => {
      const pv = $(".drawer__preview", panelEl);
      if (!pv) return;
      if (!url) {
        pv.style.opacity = "0";
        pv.style.backgroundImage = "";
        return;
      }
      pv.style.backgroundImage = `url("${url}")`;
      pv.style.opacity = "1";
    };

    drawerStack.addEventListener("mouseover", (e) => {
      const a = e.target.closest("[data-cover]");
      if (!a) return;
      const panelEl = e.target.closest(".drawer__panel");
      if (!panelEl) return;
      updatePreview(panelEl, a.getAttribute("data-cover"));
    });

    drawerStack.addEventListener("focusin", (e) => {
      const a = e.target.closest("[data-cover]");
      if (!a) return;
      const panelEl = e.target.closest(".drawer__panel");
      if (!panelEl) return;
      updatePreview(panelEl, a.getAttribute("data-cover"));
    });
  };
  attachPreviewHandlers();

  // ---------------------------------------------
  // TOP link (optional)
  // ---------------------------------------------
  const topLink = $("#topLink") || $(".topbar__top");
  if (topLink) {
    topLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      closeDrawer();
    });
  }

  // ---------------------------------------------
  // Pointer FX
  // - Desktop: follow (lerp)
  // - Mobile: spawn ONLY on tap (touchstart/pointerdown), NO follow after
  // ---------------------------------------------
  const fx = $("#pointer-fx");
  if (fx) {
    let x = -9999,
      y = -9999,
      tx = -9999,
      ty = -9999;

    let shown = false;
    let idleTimer = null;

    // モバイルではラベル不要
    if (isCoarse) {
      const lockbox = $("#lockbox");
      if (lockbox) lockbox.style.display = "none";
    }

    const setPos = (nx, ny) => {
      x = tx = nx;
      y = ty = ny;
      fx.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const show = () => {
      shown = true;
      fx.style.opacity = "1";
    };

    const scheduleIdleFade = () => {
      const ms = isCoarse ? 1800 : 1400;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        fx.style.opacity = "0";
        shown = false;
      }, ms);
    };

    // Desktop move (follow target)
    const onDesktopMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      show();
      scheduleIdleFade();
    };

    // Mobile tap ONLY (spawn then stop tracking)
    const onMobileTap = (e) => {
      const p = e.touches ? e.touches[0] : e;
      if (!p) return;
      show();
      setPos(p.clientX, p.clientY); // ←ここで固定
      scheduleIdleFade();
    };

    const tick = () => {
      if (!isCoarse) {
        // desktop follow
        x += (tx - x) * 0.18;
        y += (ty - y) * 0.18;
        fx.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      requestAnimationFrame(tick);
    };

    if (isCoarse) {
      // IMPORTANT:
      // mobileでは touchmove/pointermove を一切拾わない → 追従しない
      window.addEventListener("touchstart", onMobileTap, { passive: true });
      window.addEventListener("pointerdown", onMobileTap, { passive: true });
    } else {
      window.addEventListener("pointermove", onDesktopMove, { passive: true });
      window.addEventListener("pointerdown", onDesktopMove, { passive: true });
    }

    requestAnimationFrame(tick);
  }
})();