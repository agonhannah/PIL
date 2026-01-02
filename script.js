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

  // ------------------------------
  // state
  // ------------------------------
  let panelHistory = [];

  // ------------------------------
  // helpers
  // ------------------------------
  const setExpanded = (isOpen) => {
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    drawer.setAttribute("aria-hidden", String(!isOpen));
  };

  const getActivePanel = () => {
    return stack.querySelector(".drawer__panel.is-active");
  };

  const getActivePanelName = () => {
    const p = getActivePanel();
    return p ? p.dataset.panel : "main";
  };

  const setPanel = (name) => {
    stack.querySelectorAll(".drawer__panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.panel === name);
    });
  };

  // ------------------------------
  // navigation with history
  // ------------------------------
  const goPanel = (next) => {
    const current = getActivePanelName();
    if (current !== next) panelHistory.push(current);
    setPanel(next);
  };

  const goBack = () => {
    const prev = panelHistory.pop() || "main";
    setPanel(prev);
  };

  // ------------------------------
  // open / close
  // ------------------------------
  const openDrawer = () => {
    panelHistory = [];              // ← 毎回リセット
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

  // ------------------------------
  // events
  // ------------------------------
  menuBtn.addEventListener("click", openDrawer);
  overlay.addEventListener("click", closeDrawer);

  // open next panel
  stack.querySelectorAll("[data-open-panel]").forEach((btn) => {
    btn.addEventListener("click", () => {
      goPanel(btn.dataset.openPanel);
    });
  });

  // back (1階層戻る)
  stack.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", goBack);
  });

  // close drawer
  stack.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", closeDrawer);
  });
})();

// ==============================
// Pointer FX (PC + Mobile)
// - PC: move follow + lockbox hover
// - Mobile: press follow + "tapした瞬間から1秒でフェード"（ステイなし）
// ==============================
(() => {
  const fx      = document.getElementById("pointer-fx");
  const lockbox = document.getElementById("lockbox");
  if (!fx) return;

  const mmFine   = window.matchMedia ? window.matchMedia("(pointer: fine)") : null;
  const mmCoarse = window.matchMedia ? window.matchMedia("(pointer: coarse)") : null;
  const isFinePointer   = !!(mmFine && mmFine.matches);
  const isCoarsePointer = !!(mmCoarse && mmCoarse.matches);

  // common
  const moveFx = (x, y) => {
    fx.style.transform = `translate3d(${x}px, ${y}px, 0)`;
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

    window.addEventListener(
      "mousemove",
      (e) => {
        moveFx(e.clientX, e.clientY);
        fx.style.opacity = "1";
      },
      { passive: true }
    );

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
    document.body.classList.add("is-touch"); // touch-action の制御に使うなら

    let targetX = -9999, targetY = -9999;
    let curX = -9999, curY = -9999;
    let rafId = null;
    let isDown = false;

    const lerp = (a, b, t) => a + (b - a) * t;

    const render = () => {
      const t = 0.18; // ヌル度
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

    // ★「タップした瞬間から1秒で薄く消える」
    const fadeOutNow = () => {
      // CSS側で transition: opacity 1000ms linear; が効く想定
      fx.style.opacity = "0";
      // 1秒後に完全退避して止める
      setTimeout(() => {
        targetX = targetY = curX = curY = -9999;
        fx.style.transform = "translate3d(-9999px, -9999px, 0)";
        stopRAF();
      }, 1000);
    };

    window.addEventListener(
  "pointerdown",
  (e) => {
    isDown = true;

    // ★端から追いかけるのを殺す：初回はその場にワープ
    targetX = e.clientX;
    targetY = e.clientY;
    curX = targetX;
    curY = targetY;
    fx.style.transition = "none"; // 初回のopacity/transform遅延を防ぐ
    moveFx(curX, curY);

    // すぐ表示（次フレームでtransitionを戻す）
    showFx();
    requestAnimationFrame(() => {
      fx.style.transition = ""; // CSSの opacity 1000ms を復帰
    });
  },
  { passive: true }
);

    window.addEventListener(
      "pointermove",
      (e) => {
        if (!isDown) return;
        targetX = e.clientX;
        targetY = e.clientY;
      },
      { passive: true }
    );

    window.addEventListener(
      "pointerup",
      () => {
        isDown = false;
        fadeOutNow();
      },
      { passive: true }
    );

    window.addEventListener(
      "pointercancel",
      () => {
        isDown = false;
        fadeOutNow();
      },
      { passive: true }
    );

    hardHide();
  }
})();

// ==============================
// Drawer Shop filter (All / Digital / Physical)
// ==============================
const shopGrid = document.getElementById("shopGrid");
if (shopGrid) {
  const setShopTab = (tab) => {
    shopGrid.querySelectorAll(".shopCard").forEach((card) => {
      const isDigital  = card.classList.contains("is-digital");
      const isPhysical = card.classList.contains("is-physical");

      const show =
        tab === "all" ||
        (tab === "digital" && isDigital) ||
        (tab === "physical" && isPhysical);

      card.classList.toggle("is-hidden", !show);
    });
  };

  // default: Physical を開いた時に物理だけ見せたいならここを physical に
  setShopTab("all");

  document.querySelectorAll('[data-panel="shop"] [data-shop-tab]').forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      setShopTab(a.dataset.shopTab);
    });
  });
}

// ==============================
// Drawer preview (PC hover only)
// - Archive panel + Physical panel
// ==============================
(() => {
  const isFinePointer =
    window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  if (!isFinePointer) return;

  const bindPreview = (panelName, previewElId) => {
    const preview = document.getElementById(previewElId);
    if (!preview) return;

    document
      .querySelectorAll(
        `.drawer__panel[data-panel="${panelName}"] .drawer__listItem[data-cover]`
      )
      .forEach((item) => {
        const url = item.dataset.cover;

        item.addEventListener("mouseenter", () => {
          preview.style.backgroundImage = `url("${url}")`;
          preview.style.opacity = "1";
        });

        item.addEventListener("mouseleave", () => {
          preview.style.opacity = "0";
        });
      });
  };

  // Archive用（既存の #drawerPreview を使う）
  bindPreview("archive", "drawerPreview");

  // Physical Goods用（新規の #drawerPreviewPhysical を使う）
  bindPreview("shopPhysical", "drawerPreviewPhysical");
})();
