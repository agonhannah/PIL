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

// ==============================
// Drawer Preview (Archive / Physical) - Desktop hover + Mobile tap
// ==============================
(() => {
  const stack = document.getElementById("drawerStack");
  if (!stack) return;

  // panel名 → preview要素ID
  const PREVIEW_MAP = {
    archive: "drawerPreview",
    shopPhysical: "drawerPreviewPhysical",
  };

  const setPreview = (panelName, url) => {
    const id = PREVIEW_MAP[panelName];
    if (!id) return;

    const previewEl = document.getElementById(id);
    if (!previewEl) return;

    if (!url) {
      previewEl.style.opacity = "0";
      previewEl.style.backgroundImage = "";
      return;
    }

    previewEl.style.backgroundImage = `url("${url}")`;
    previewEl.style.opacity = "1";
  };

  // 対象パネル内だけで反応させる
  const bindPanel = (panelName) => {
    const panel = stack.querySelector(`.drawer__panel[data-panel="${panelName}"]`);
    if (!panel) return;

    const items = panel.querySelectorAll("[data-cover]");
    if (!items.length) return;

    // PC: hover/focusで出す
    items.forEach((el) => {
      el.addEventListener("mouseenter", () => setPreview(panelName, el.dataset.cover));
      el.addEventListener("focusin", () => setPreview(panelName, el.dataset.cover));
      el.addEventListener("mouseleave", () => setPreview(panelName, ""));
      el.addEventListener("focusout", () => setPreview(panelName, ""));
    });

    // Mobile: タップした瞬間に出す（pointerdown / touchstart）
    items.forEach((el) => {
      el.addEventListener(
        "pointerdown",
        () => setPreview(panelName, el.dataset.cover),
        { passive: true }
      );
      el.addEventListener(
        "touchstart",
        () => setPreview(panelName, el.dataset.cover),
        { passive: true }
      );
    });
  };

  // 必要なパネルだけバインド
  Object.keys(PREVIEW_MAP).forEach(bindPanel);

  // パネルを閉じた時に消す（安全策）
  document.addEventListener("click", (e) => {
    const closeBtn = e.target.closest("[data-close]");
    const backBtn  = e.target.closest("[data-back]");
    if (closeBtn || backBtn) {
      Object.keys(PREVIEW_MAP).forEach((p) => setPreview(p, ""));
    }
  });
})();


// ==============================
// Drawer Preview (works on PC hover + mobile tap)
// - data-cover を持つ要素に反応
// - その要素がいる panel 内の .drawer__preview に画像を出す
// - data-open-panel のときは「遷移先 panel」の preview にも出す
// ==============================
(() => {
  const stack = document.getElementById("drawerStack");
  if (!stack) return;

  const mmFine   = window.matchMedia?.("(pointer: fine)");
  const mmCoarse = window.matchMedia?.("(pointer: coarse)");

  const setPreview = (panelEl, url) => {
    if (!panelEl) return;
    const pv = panelEl.querySelector(".drawer__preview");
    if (!pv) return;

    if (!url) {
      pv.style.opacity = "0";
      pv.style.backgroundImage = "";
      return;
    }
    pv.style.backgroundImage = `url("${url}")`;
    pv.style.opacity = "1";
  };

  // 1) パネル内の listItem hover/tap で出す
  stack.querySelectorAll("[data-cover]").forEach((el) => {
    const url = el.dataset.cover;
    if (!url) return;

    const panel = el.closest(".drawer__panel");
    if (!panel) return;

    if (mmFine?.matches) {
      el.addEventListener("mouseenter", () => setPreview(panel, url));
      el.addEventListener("mouseleave", () => setPreview(panel, null));
      el.addEventListener("focus", () => setPreview(panel, url));
      el.addEventListener("blur",  () => setPreview(panel, null));
    } else if (mmCoarse?.matches) {
      // モバイルは hover がないので「タップした瞬間に出す」
      el.addEventListener("click", () => setPreview(panel, url), { passive: true });
    }
  });

  // 2) data-open-panel で次の drawer に行くとき、「遷移先 panel」側にも出す
  stack.querySelectorAll("[data-open-panel][data-cover]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url  = btn.dataset.cover;
      const next = btn.dataset.openPanel;
      if (!url || !next) return;

      requestAnimationFrame(() => {
        const nextPanel = stack.querySelector(`.drawer__panel[data-panel="${next}"]`);
        setPreview(nextPanel, url);
      });
    });
  });
})();
