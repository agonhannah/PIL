/* =========================================================
   script.js
   - Drawer open/close + panel navigation
   - Year
   - Pointer FX (mobile: NO follow, instant spawn)
========================================================= */

(() => {
  // ---------------------------------------------
  // Helpers
  // ---------------------------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const isCoarse = window.matchMedia("(pointer: coarse)").matches;

  // add a flag class for CSS if needed
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

  // panel stack navigation
  const panels = drawerStack ? $$(".drawer__panel", drawerStack) : [];
  const panelByName = (name) => panels.find((p) => p.dataset.panel === name);

  let panelStack = ["main"]; // history

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

    // hide all
    panels.forEach((p) => p.classList.remove("is-active"));
    // show target
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
    // reset to main for next open (好みなら外してOK)
    showPanel("main", false);
    panelStack = ["main"];
  };

  // Menu button
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const expanded = menuBtn.getAttribute("aria-expanded") === "true";
      expanded ? closeDrawer() : openDrawer();
    });
  }

  // Overlay click closes
  if (overlay) overlay.addEventListener("click", closeDrawer);

  // Close buttons + Back buttons + Panel open buttons
  if (drawerStack) {
    drawerStack.addEventListener("click", (e) => {
      const t = e.target;

      // close
      const closeBtn = t.closest("[data-close]");
      if (closeBtn) {
        e.preventDefault();
        closeDrawer();
        return;
      }

      // back
      const backBtn = t.closest("[data-back]");
      if (backBtn) {
        e.preventDefault();
        goBack();
        return;
      }

      // open panel
      const openBtn = t.closest("[data-open-panel]");
      if (openBtn) {
        e.preventDefault();
        const name = openBtn.getAttribute("data-open-panel");
        showPanel(name, true);
        return;
      }
    });
  }

  // ESC closes drawer
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (drawer && drawer.classList.contains("is-open")) closeDrawer();
    }
  });

  // Prevent background scroll on iOS when drawer open (extra safety)
  // (CSS body.is-locked { overflow:hidden; } is primary)
  let lastTouchY = 0;
  if (drawer) {
    drawer.addEventListener(
      "touchstart",
      (e) => {
        lastTouchY = e.touches[0].clientY;
      },
      { passive: true }
    );
    drawer.addEventListener(
      "touchmove",
      (e) => {
        // allow scroll inside drawer; block only if drawer has no scroll room
        // (kept minimal)
      },
      { passive: true }
    );
  }

  // ---------------------------------------------
  // Optional: Drawer preview background from data-cover
  // (works with your existing markup; safe if absent)
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

    // hover/focus for fine pointer
    drawerStack.addEventListener("mouseover", (e) => {
      const a = e.target.closest("[data-cover]");
      if (!a) return;
      const panelEl = e.target.closest(".drawer__panel");
      if (!panelEl) return;
      updatePreview(panelEl, a.getAttribute("data-cover"));
    });

    drawerStack.addEventListener("mouseout", (e) => {
      const panelEl = e.target.closest(".drawer__panel");
      if (!panelEl) return;
      // do nothing (kept)
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
  // TOP link (if you have it in DOM)
  // - If you have <a id="topLink">TOP</a> etc, it will work.
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
  // - Desktop: lerp follow (smooth)
  // - Mobile: instant spawn at touch point (NO follow)
  // ---------------------------------------------
  const fx = $("#pointer-fx");
  if (fx) {
    let x = -9999,
      y = -9999,
      tx = -9999,
      ty = -9999;

    let shown = false;
    let idleTimer = null;

    // モバイルは「Point HERE」不要 → body classだけ付ける（CSSで消す想定）
    // すでにCSSで消してない場合は、lockbox要素を非表示にする
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
      if (!shown) {
        shown = true;
        fx.style.opacity = "1";
      } else {
        fx.style.opacity = "1";
      }
    };

    const scheduleIdleFade = () => {
      // “パッと消える” のは避けたいので、薄くなるだけ・長め
      // （必要ならこの時間を伸ばしてOK）
      const ms = isCoarse ? 1800 : 1400;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        fx.style.opacity = "0";
        shown = false;
      }, ms);
    };

    const onMove = (e) => {
      const p = e.touches ? e.touches[0] : e;
      if (!p) return;

      tx = p.clientX;
      ty = p.clientY;

      show();

      // モバイル：即座にその場で発現（追従しない）
      if (isCoarse) {
        setPos(tx, ty);
      }

      scheduleIdleFade();
    };

    const tick = () => {
      if (!isCoarse) {
        // Desktop follow (smooth)
        x += (tx - x) * 0.18;
        y += (ty - y) * 0.18;
        fx.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      requestAnimationFrame(tick);
    };

    // events
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });

    // “触れた瞬間に出す”
    window.addEventListener("touchstart", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });

    requestAnimationFrame(tick);
  }
})();