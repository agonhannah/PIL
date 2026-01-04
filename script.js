/* =========================================================
   script.js (fixed)
   - Drawer open/close (overlay / ESC)
   - Accordion (ARCHIVE / SHOP / ORDER)
   - Sub-accordion inside SHOP (All / Digital / Physical)
   - Year
   - Pointer FX:
       desktop = follow
       mobile  = spawn only (NO follow), no transform transition
========================================================= */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Touch detect (iOSの判定ブレ対策込み)
  const isTouch =
    ("ontouchstart" in window) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    window.matchMedia("(pointer: coarse)").matches;

  document.body.classList.toggle("is-touch", isTouch);

  // Year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ----------------------------
     Drawer open/close
  ---------------------------- */
  const menuBtn = $("#menuBtn");
  const overlay = $("#overlay");
  const drawer = $("#drawer");
  const drawerInner = drawer ? $(".drawer__inner", drawer) : null;

  const setAriaOpen = (open) => {
    if (menuBtn) menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (drawer) {
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
      drawer.classList.toggle("is-open", open);
    }
    if (overlay) overlay.hidden = !open;
    document.body.classList.toggle("is-locked", open);
  };

  const openDrawer = () => setAriaOpen(true);
  const closeDrawer = () => {
    setAriaOpen(false);
    // 閉じるときはメインacc/subaccも畳んで初期化
    collapseAllAccordions();
  };

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const expanded = menuBtn.getAttribute("aria-expanded") === "true";
      expanded ? closeDrawer() : openDrawer();
    });
  }
  if (overlay) overlay.addEventListener("click", closeDrawer);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (drawer && drawer.classList.contains("is-open")) closeDrawer();
    }
  });

  /* ----------------------------
     Accordion helpers
  ---------------------------- */
  const setAccState = (btn, panel, open) => {
    if (!btn || !panel) return;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    panel.hidden = !open;

    // + / − をspanに直接反映（CSSに依存しない）
    const mark = $(".acc__mark", btn) || $(".subacc__mark", btn);
    if (mark) mark.textContent = open ? "−" : "+";
  };

  const collapseMainAcc = (exceptKey = null) => {
    if (!drawerInner) return;
    const mainBtns = $$("[data-acc]", drawerInner);
    mainBtns.forEach((b) => {
      const key = b.getAttribute("data-acc");
      if (exceptKey && key === exceptKey) return;
      const p = $(`[data-acc-panel="${CSS.escape(key)}"]`, drawerInner);
      setAccState(b, p, false);
    });
  };

  const collapseSubAcc = (rootPanel, exceptKey = null) => {
    if (!rootPanel) return;
    const subBtns = $$("[data-subacc]", rootPanel);
    subBtns.forEach((b) => {
      const key = b.getAttribute("data-subacc");
      if (exceptKey && key === exceptKey) return;
      const p = $(`[data-subacc-panel="${CSS.escape(key)}"]`, rootPanel);
      setAccState(b, p, false);
    });
  };

  const collapseAllAccordions = () => {
    if (!drawerInner) return;
    // main
    collapseMainAcc(null);
    // sub
    const shopPanel = $(`[data-acc-panel="shop"]`, drawerInner);
    if (shopPanel) collapseSubAcc(shopPanel, null);
  };

  /* ----------------------------
     Drawer click delegation
  ---------------------------- */
  const smoothScrollToHash = (hash) => {
    const id = hash.replace("#", "");
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;

    // iOSの表示ズレ対策で少しだけ遅延
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  if (drawerInner) {
    drawerInner.addEventListener("click", (e) => {
      const t = e.target;

      // close
      const closeEl = t.closest("[data-close]");
      if (closeEl) {
        // #アンカーはスムーススクロールしたいのでpreventDefaultする
        if (closeEl.tagName === "A") {
          const href = closeEl.getAttribute("href") || "";
          if (href.startsWith("#")) {
            e.preventDefault();
            closeDrawer();
            smoothScrollToHash(href);
            return;
          }
          // 外部/通常リンクは邪魔しない：閉じるだけ（遷移はそのまま）
          closeDrawer();
          return;
        }
        e.preventDefault();
        closeDrawer();
        return;
      }

      // main accordion toggle
      const accBtn = t.closest("[data-acc]");
      if (accBtn) {
        e.preventDefault();
        const key = accBtn.getAttribute("data-acc");
        const panel = $(`[data-acc-panel="${CSS.escape(key)}"]`, drawerInner);
        if (!panel) return;

        const isOpen = accBtn.getAttribute("aria-expanded") === "true";

        // HYKEっぽく「1つだけ開く」挙動
        collapseMainAcc(isOpen ? null : key);

        setAccState(accBtn, panel, !isOpen);

        // SHOP閉じたらsubも畳む
        if (key === "shop" && isOpen) {
          collapseSubAcc(panel, null);
        }
        return;
      }

      // sub accordion toggle (inside SHOP panel)
      const subBtn = t.closest("[data-subacc]");
      if (subBtn) {
        e.preventDefault();
        const key = subBtn.getAttribute("data-subacc");

        // SHOPパネル内だけで探す
        const shopPanel = $(`[data-acc-panel="shop"]`, drawerInner);
        if (!shopPanel) return;

        const panel = $(`[data-subacc-panel="${CSS.escape(key)}"]`, shopPanel);
        if (!panel) return;

        const isOpen = subBtn.getAttribute("aria-expanded") === "true";

        // subも1つだけ開く
        collapseSubAcc(shopPanel, isOpen ? null : key);
        setAccState(subBtn, panel, !isOpen);
        return;
      }
    });
  }

  /* ----------------------------
     Pointer FX
  ---------------------------- */
  const fx = $("#pointer-fx");
  if (fx) {
    // iOSで「追従っぽく見える」原因になりやすいので
    // touch時は transform の transition を完全に切る
    if (isTouch) {
      fx.style.transitionProperty = "opacity";
      fx.style.transitionDuration = "220ms";
      fx.style.transitionTimingFunction = "ease-out";
    }

    // モバイル：Point HERE不要（lockbox消す）
    if (isTouch) {
      const lockbox = $("#lockbox");
      if (lockbox) lockbox.style.display = "none";
    }

    let x = -9999, y = -9999;
    let tx = -9999, ty = -9999;

    let idleTimer = null;
    const show = () => { fx.style.opacity = "1"; };

    const scheduleIdleFade = () => {
      // “パッと消えすぎない”が前提で、少し早めに
      const ms = isTouch ? 900 : 1400;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { fx.style.opacity = "0"; }, ms);
    };

    const setTransformInstant = (nx, ny) => {
      x = nx; y = ny;
      tx = nx; ty = ny;
      // transform遷移を起こさない（追従に見えない）
      fx.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    // desktop: follow
    const onDesktopMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      show();
      scheduleIdleFade();
    };

    // touch: spawn only (NO follow)
    const onTouchSpawn = (e) => {
      const touch = e.touches && e.touches[0] ? e.touches[0] : null;
      if (!touch) return;
      show();
      setTransformInstant(touch.clientX, touch.clientY); // 固定出現
      scheduleIdleFade();
    };

    // desktop lerp animation only
    const tick = () => {
      // touchはtick不要（動かさない）
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      fx.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      requestAnimationFrame(tick);
    };

    if (isTouch) {
      // pointer系はiOSで余計に動くことがあるので触らない
      window.addEventListener("touchstart", onTouchSpawn, { passive: true });
      // 追従防止のためtouchmoveは登録しない
    } else {
      window.addEventListener("pointermove", onDesktopMove, { passive: true });
      window.addEventListener("pointerdown", onDesktopMove, { passive: true });
      requestAnimationFrame(tick);
    }
  }
})();