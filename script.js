// ==============================
// year
// ==============================
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ==============================
// Drawer (history-safe / multi-level)
// ==============================
(() => {
  const menuBtn = document.getElementById("menuBtn");
  const drawer  = document.getElementById("drawer");
  const overlay = document.getElementById("overlay");
  const stack   = document.getElementById("drawerStack");

  if (!menuBtn || !drawer || !overlay || !stack) return;

  let panelHistory = [];

  const setExpanded = (isOpen) => {
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    drawer.setAttribute("aria-hidden", String(!isOpen));
  };

  const getActivePanel = () => stack.querySelector(".drawer__panel.is-active");

  const getActivePanelName = () => {
    const p = getActivePanel();
    return p ? p.dataset.panel : "main";
  };

  const setPanel = (name) => {
    stack.querySelectorAll(".drawer__panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.panel === name);
    });
  };

  const goPanel = (next) => {
    const current = getActivePanelName();
    if (current !== next) panelHistory.push(current);
    setPanel(next);
  };

  const goBack = () => {
    const prev = panelHistory.pop() || "main";
    setPanel(prev);
  };

  const openDrawer = () => {
    panelHistory = [];
    drawer.classList.add("is-open");
    overlay.hidden = false;
    document.body.classList.add("is-locked");
    setPanel("main");
    setExpanded(true);
  };

  const closeDrawer = () => {
    panelHistory = [];
    drawer.classList.remove("is-open");
    overlay.hidden = true;
    document.body.classList.remove("is-locked");
    setExpanded(false);
  };

  menuBtn.addEventListener("click", openDrawer);
  overlay.addEventListener("click", closeDrawer);

  stack.querySelectorAll("[data-open-panel]").forEach((btn) => {
    btn.addEventListener("click", () => goPanel(btn.dataset.openPanel));
  });

  stack.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", goBack);
  });

  stack.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", closeDrawer);
  });
})();

// ==============================
// Pointer FX (PC + Mobile)
// ==============================
(() => {
  const fx      = document.getElementById("pointer-fx");
  const lockbox = document.getElementById("lockbox");
  if (!fx) return;

  const mmFine   = typeof window.matchMedia === "function" ? window.matchMedia("(pointer: fine)") : null;
  const mmCoarse = typeof window.matchMedia === "function" ? window.matchMedia("(pointer: coarse)") : null;
  const isFinePointer   = !!(mmFine && mmFine.matches);
  const isCoarsePointer = !!(mmCoarse && mmCoarse.matches);

  const moveFx = (x, y) => {
    fx.style.transform = "translate3d(" + x + "px, " + y + "px, 0)";
  };

  const hardHide = () => {
    fx.style.opacity = "0";
    fx.style.transform = "translate3d(-9999px, -9999px, 0)";
    if (lockbox) lockbox.style.opacity = "0";
  };

  // -------- PC --------
  if (isFinePointer) {
    fx.style.opacity = "0";

    const CLICKABLE_SELECTOR = [
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

    const closestClickable = (el) =>
      el && el.closest ? el.closest(CLICKABLE_SELECTOR) : null;

    window.addEventListener("mousemove", (e) => {
      moveFx(e.clientX, e.clientY);
      fx.style.opacity = "1";
    }, { passive: true });

    window.addEventListener("mouseout", (e) => {
      if (!e.relatedTarget && !e.toElement) hardHide();
    });

    window.addEventListener("blur", hardHide);

    if (lockbox) {
      const showLockbox = () => (lockbox.style.opacity = "1");
      const hideLockbox = () => (lockbox.style.opacity = "0");

      document.addEventListener("mouseover", (e) => {
        if (closestClickable(e.target)) showLockbox();
      });

      document.addEventListener("mouseout", (e) => {
        const from = closestClickable(e.target);
        const to   = closestClickable(e.relatedTarget);
        if (from && from !== to) hideLockbox();
      });

      document.addEventListener("focusin", (e) => {
        if (closestClickable(e.target)) showLockbox();
      });

      document.addEventListener("focusout", hideLockbox);
    }

    hardHide();
    return;
  }

  // -------- Mobile --------
  if (isCoarsePointer) {
    document.body.classList.add("is-touch");

    let targetX = -9999, targetY = -9999;
    let curX = -9999, curY = -9999;
    let rafId = null;
    let isDown = false;

    const lerp = (a, b, t) => a + (b - a) * t;

    const render = () => {
      const t = 0.18;
      curX = lerp(curX, targetX, t);
      curY = lerp(curY, targetY, t);
      moveFx(curX, curY);
      rafId = requestAnimationFrame(render);
    };

    const startRAF = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(render);
    };

    const stopRAF = () => {
      if (!rafId) return;
      cancelAnimationFrame(rafId);
      rafId = null;
    };

    const showFx = () => {
      fx.style.opacity = "1";
      startRAF();
    };

    const fadeOutNow = () => {
      fx.style.opacity = "0";
      setTimeout(() => {
        targetX = targetY = curX = curY = -9999;
        fx.style.transform = "translate3d(-9999px, -9999px, 0)";
        stopRAF();
      }, 1000);
    };

    window.addEventListener("pointerdown", (e) => {
      isDown = true;

      targetX = e.clientX;
      targetY = e.clientY;
      curX = targetX;
      curY = targetY;

      fx.style.transition = "none";
      moveFx(curX, curY);

      showFx();
      requestAnimationFrame(() => {
        fx.style.transition = "";
      });
    }, { passive: true });

    window.addEventListener("pointermove", (e) => {
      if (!isDown) return;
      targetX = e.clientX;
      targetY = e.clientY;
    }, { passive: true });

    window.addEventListener("pointerup", () => {
      isDown = false;
      fadeOutNow();
    }, { passive: true });

    window.addEventListener("pointercancel", () => {
      isDown = false;
      fadeOutNow();
    }, { passive: true });

    hardHide();
  }
})();

// ==============================
// Drawer Preview (single / safe)
// - data-cover を持つ要素で preview を表示
// - PC: hover/focus
// - Mobile: pointerdown（タップした瞬間）
// - data-open-panel の場合：遷移先panelにも即表示
// - さらに「購入drawer(prodSessionCollection)」は入った瞬間に常時表示
// ==============================
(() => {
  try {
    const stack = document.getElementById("drawerStack");
    if (!stack) return;

    const hasMM = typeof window.matchMedia === "function";
    const isFine   = hasMM ? window.matchMedia("(pointer: fine)").matches : false;
    const isCoarse = hasMM ? window.matchMedia("(pointer: coarse)").matches : false;

    // 遷移先panelに渡したcoverを覚えておく（購入drawerで使う）
    const coverForPanel = Object.create(null);

    const getPanelByName = (name) =>
      stack.querySelector('.drawer__panel[data-panel="' + name + '"]');

    const getPreviewEl = (panelEl) => {
      if (!panelEl) return null;
      return panelEl.querySelector(".drawer__preview");
    };

    const setPreview = (panelEl, url) => {
      const pv = getPreviewEl(panelEl);
      if (!pv) return;

      if (!url) {
        pv.style.opacity = "0";
        pv.style.backgroundImage = "";
        return;
      }
      pv.style.backgroundImage = 'url("' + url + '")';
      pv.style.opacity = "1";
    };

    const clearAllPreviews = () => {
      stack.querySelectorAll(".drawer__panel .drawer__preview").forEach((pv) => {
        pv.style.opacity = "0";
        pv.style.backgroundImage = "";
      });
    };

    // 1) パネル内のdata-cover要素：PC hover / Mobile pointerdown
    const items = stack.querySelectorAll("[data-cover]");
    if (!items.length) return;

    items.forEach((el) => {
      const url = el.dataset ? el.dataset.cover : null;
      if (!url) return;

      const panel = el.closest ? el.closest(".drawer__panel") : null;
      if (!panel) return;

      if (isFine) {
        el.addEventListener("mouseenter", () => setPreview(panel, url));
        el.addEventListener("mouseleave", () => setPreview(panel, ""));
        el.addEventListener("focusin",  () => setPreview(panel, url));
        el.addEventListener("focusout", () => setPreview(panel, ""));
      }

      if (isCoarse) {
        el.addEventListener("pointerdown", () => setPreview(panel, url), { passive: true });
      }
    });

    // 2) data-open-panelで遷移する時：遷移先panelにも即表示 + coverを記憶
    const raf = typeof window.requestAnimationFrame === "function"
      ? window.requestAnimationFrame
      : (fn) => setTimeout(fn, 0);

    stack.querySelectorAll("[data-open-panel][data-cover]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const url  = btn.dataset ? btn.dataset.cover : null;
        const next = btn.dataset ? btn.dataset.openPanel : null;
        if (!url || !next) return;

        coverForPanel[next] = url;

        raf(() => {
          const nextPanel = getPanelByName(next);
          setPreview(nextPanel, url);

          // ✅ 購入drawerは「入った瞬間から常時表示」にしたいので強制ON
          if (next === "prodSessionCollection") {
            setPreview(nextPanel, url);
          }
        });
      });
    });

    // 3) 「Backで戻って再度入る」など、activeになった瞬間にも購入drawerは表示
    if (typeof MutationObserver === "function") {
      const obs = new MutationObserver(() => {
        const active = stack.querySelector(".drawer__panel.is-active");
        if (!active) return;

        const name = active.dataset ? active.dataset.panel : "";
        if (name === "prodSessionCollection") {
          const url = coverForPanel[name];
          if (url) setPreview(active, url);
        }
      });

      obs.observe(stack, { subtree: true, attributes: true, attributeFilter: ["class"] });
    }

    // 4) close/back したら消す（安全）
    document.addEventListener("click", (e) => {
      const t = e && e.target ? e.target : null;
      const closeBtn = t && t.closest ? t.closest("[data-close]") : null;
      const backBtn  = t && t.closest ? t.closest("[data-back]")  : null;
      if (closeBtn || backBtn) clearAllPreviews();
    });

  } catch (err) {
    // ここで落ちても drawer/pointer を殺さない
    if (typeof console !== "undefined" && console.warn) {
      console.warn("Drawer preview init failed:", err);
    }
  }
})();