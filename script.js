/* =========================================================
   script.js
   - Drawer open/close
   - Accordion (data-acc / data-acc-panel)
   - Year
   - Pointer FX (touch: spawn only, NO follow)
========================================================= */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Touch判定（iOSでmediaが外れることがあるので強め）
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
  const closeDrawer = () => setAriaOpen(false);

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const expanded = menuBtn.getAttribute("aria-expanded") === "true";
      expanded ? closeDrawer() : openDrawer();
    });
  }
  if (overlay) overlay.addEventListener("click", closeDrawer);

  // data-close（TOP/×）で閉じる
  if (drawer) {
    drawer.addEventListener("click", (e) => {
      const closeBtn = e.target.closest("[data-close]");
      if (closeBtn) {
        e.preventDefault();
        closeDrawer();
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (drawer && drawer.classList.contains("is-open")) closeDrawer();
    }
  });

  /* ----------------------------
     Accordion
     HTML:
       button.acc__btn[data-acc="shop"]
       div.acc__panel[data-acc-panel="shop" hidden]
  ---------------------------- */
  const accButtons = $$("[data-acc]");

  const openPanel = (btn, panel) => {
    btn.setAttribute("aria-expanded", "true");
    const mark = btn.querySelector(".acc__mark");
    if (mark) mark.textContent = "−";

    panel.hidden = false;

    // “ぬるっと”開く：max-height + opacity
    panel.style.overflow = "hidden";
    panel.style.maxHeight = "0px";
    panel.style.opacity = "0";

    requestAnimationFrame(() => {
      const h = panel.scrollHeight;
      panel.style.transition = "max-height 280ms ease, opacity 220ms ease";
      panel.style.maxHeight = h + "px";
      panel.style.opacity = "1";
    });

    const onEnd = (ev) => {
      if (ev.propertyName !== "max-height") return;
      panel.style.transition = "";
      panel.style.maxHeight = "none";   // 可変に戻す
      panel.style.overflow = "visible";
      panel.removeEventListener("transitionend", onEnd);
    };
    panel.addEventListener("transitionend", onEnd);
  };

  const closePanel = (btn, panel) => {
    btn.setAttribute("aria-expanded", "false");
    const mark = btn.querySelector(".acc__mark");
    if (mark) mark.textContent = "+";

    // 現在高さを固定してから閉じる
    panel.style.overflow = "hidden";
    panel.style.maxHeight = panel.scrollHeight + "px";
    panel.style.opacity = "1";
    panel.style.transition = "max-height 240ms ease, opacity 180ms ease";

    requestAnimationFrame(() => {
      panel.style.maxHeight = "0px";
      panel.style.opacity = "0";
    });

    const onEnd = (ev) => {
      if (ev.propertyName !== "max-height") return;
      panel.hidden = true;
      panel.style.transition = "";
      panel.style.maxHeight = "";
      panel.style.opacity = "";
      panel.style.overflow = "";
      panel.removeEventListener("transitionend", onEnd);
    };
    panel.addEventListener("transitionend", onEnd);
  };

  accButtons.forEach((btn) => {
    const name = btn.getAttribute("data-acc");
    const panel = document.querySelector(`[data-acc-panel="${name}"]`);
    if (!panel) return;

    const expanded = btn.getAttribute("aria-expanded") === "true";
    if (expanded) {
      panel.hidden = false;
      const mark = btn.querySelector(".acc__mark");
      if (mark) mark.textContent = "−";
    } else {
      panel.hidden = true;
      const mark = btn.querySelector(".acc__mark");
      if (mark) mark.textContent = "+";
    }

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      if (isOpen) closePanel(btn, panel);
      else openPanel(btn, panel);
    });
  });

  /* ----------------------------
     Pointer FX
     - Touch: spawn only（追従なし）
     - Desktop: follow
  ---------------------------- */
  const fx = $("#pointer-fx");
  if (fx) {
    let x = -9999, y = -9999;
    let tx = -9999, ty = -9999;

    let idleTimer = null;
    let fadeRAF = null;

    // touchstart + pointerdown の二重発火対策
    let lastSpawnAt = 0;

    // モバイルは lockbox を消す（Point HERE相当）
    if (isTouch) {
      const lockbox = $("#lockbox");
      if (lockbox) lockbox.style.display = "none";
    }

    // ★欠けてた関数：座標を確定して即移動
    const setTransform = (nx, ny) => {
      x = nx; y = ny;
      tx = nx; ty = ny;
      fx.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const show = () => {
      // 連打時に fade の予約が残ってると挙動がブレるので消す
      if (idleTimer) clearTimeout(idleTimer);
      if (fadeRAF) cancelAnimationFrame(fadeRAF);

      fx.style.opacity = "1";
    };

    // 「押した瞬間から薄くなり始める」→ すぐ 0.4 に落としてから 0 に
    const scheduleIdleFade = () => {
      const total = isTouch ? 1400 : 1600;

      // 次フレームで薄まり開始（“押した瞬間”感）
      fadeRAF = requestAnimationFrame(() => {
        fx.style.opacity = "0.4";
      });

      idleTimer = setTimeout(() => {
        fx.style.opacity = "0";
      }, total);
    };

    // Desktop follow
    const onDesktopMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      show();
      scheduleIdleFade();
    };

    // Touch spawn only（押した場所で固定）
    const onTouchSpawn = (e) => {
      const now = Date.now();
      if (now - lastSpawnAt < 120) return; // 二重発火ガード
      lastSpawnAt = now;

      const p = e.touches ? e.touches[0] : e;
      if (!p) return;

      show();
      setTransform(p.clientX, p.clientY);
      scheduleIdleFade();
    };

    const tick = () => {
      if (!isTouch) {
        // desktopのみ追従（lerp）
        x += (tx - x) * 0.18;
        y += (ty - y) * 0.18;
        fx.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      requestAnimationFrame(tick);
    };

    if (isTouch) {
      // captureで確実に拾う（リンク/ボタン上でも発現させる）
      window.addEventListener("touchstart", onTouchSpawn, { passive: true, capture: true });
      window.addEventListener("pointerdown", onTouchSpawn, { passive: true, capture: true });
    } else {
      window.addEventListener("pointermove", onDesktopMove, { passive: true });
      window.addEventListener("pointerdown", onDesktopMove, { passive: true });
    }

    requestAnimationFrame(tick);
  }
})();