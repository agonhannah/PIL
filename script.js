/* =========================================================
   script.js
   - Drawer open/close
   - Accordion (data-acc / data-acc-panel)
   - Year
   - Pointer FX
     - Touch: spawn only（追従なし）
     - Desktop: follow
     - Fade: すぐ薄まり始めて、同じ時間感で消え切る
========================================================= */

(() => {
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Touch判定（iOSで(pointer:coarse)が外れるケース対策）
  const isTouch =
    ("ontouchstart" in window) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

  document.body.classList.toggle("is-touch", !!isTouch);

  // Year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ----------------------------
     Drawer open/close
  ---------------------------- */
  const menuBtn = $("#menuBtn");
  const overlay = $("#overlay");
  const drawer  = $("#drawer");

  const setAriaOpen = (open) => {
  if (menuBtn) {
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.classList.toggle("is-open", open); // ←これ追加（×変形用）
  }

  if (drawer) {
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    drawer.classList.toggle("is-open", open);
  }

  if (overlay) {
    overlay.classList.toggle("is-open", open);
    overlay.hidden = !open;
  }

  document.body.classList.toggle("is-locked", open);
};

  const openDrawer  = () => setAriaOpen(true);
  const closeDrawer = () => setAriaOpen(false);

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const expanded = menuBtn.getAttribute("aria-expanded") === "true";
      expanded ? closeDrawer() : openDrawer();
    });
  }
  if (overlay) overlay.addEventListener("click", closeDrawer);

  // data-close（TOP/×）で閉じる（drawer内）
  if (drawer) {
    drawer.addEventListener("click", (e) => {
      const t = e.target;

      const closeBtn = t.closest && t.closest("[data-close]");
      if (closeBtn) {
        // a(data-close) はジャンプしつつ閉じるでOK
        // ただし "#" だったらpreventDefaultする
        const isAnchor = closeBtn.tagName === "A";
        if (!isAnchor || closeBtn.getAttribute("href") === "#") e.preventDefault();
        closeDrawer();
        return;
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
     button.acc__btn[data-acc="archive"]
     div.acc__panel[data-acc-panel="archive" hidden]
  ---------------------------- */
  const accButtons = $$("[data-acc]");

  const openPanel = (btn, panel) => {
    btn.setAttribute("aria-expanded", "true");
    const mark = btn.querySelector(".acc__mark");
    if (mark) mark.textContent = "−";

    panel.hidden = false;
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
      panel.style.maxHeight = "none";
      panel.style.overflow = "visible";
      panel.removeEventListener("transitionend", onEnd);
    };
    panel.addEventListener("transitionend", onEnd);
  };

  const closePanel = (btn, panel) => {
    btn.setAttribute("aria-expanded", "false");
    const mark = btn.querySelector(".acc__mark");
    if (mark) mark.textContent = "+";

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
    const name  = btn.getAttribute("data-acc");
    const panel = document.querySelector(`[data-acc-panel="${name}"]`);
    if (!panel) return;

    const expanded = btn.getAttribute("aria-expanded") === "true";
    const mark = btn.querySelector(".acc__mark");

    if (expanded) {
      panel.hidden = false;
      if (mark) mark.textContent = "−";
    } else {
      panel.hidden = true;
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
  ---------------------------- */
  const fx = $("#pointer-fx");
  if (fx) {
    let x = -9999, y = -9999;
    let tx = -9999, ty = -9999;

    let idleTimer = null;
    let dimTimer  = null;

    // モバイルは lockbox を消す（緑blobのみ）
    if (isTouch) {
      const lockbox = $("#lockbox");
      if (lockbox) lockbox.style.display = "none";
    }

    // ★これが無いと落ちる（今回の主原因）
    const setTransform = (nx, ny) => {
      x = nx; y = ny;
      tx = nx; ty = ny;
      fx.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
    };

    const showFull = () => { fx.style.opacity = "1"; };

    // 押した瞬間から薄まり始める（ただし「消えた」に見えない値）
    const scheduleIdleFade = () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (dimTimer) clearTimeout(dimTimer);

      // まずは確実に “見える” 1.0 を出す
      showFull();

      // すぐ薄まり開始（即だと環境によって見えないので 40ms）
      dimTimer = setTimeout(() => {
        fx.style.opacity = isTouch ? "0.72" : "0.65";
      }, 40);

      // 同じ時間感で消え切る
      const total = isTouch ? 1100 : 1400;
      idleTimer = setTimeout(() => {
        fx.style.opacity = "0";
      }, total);
    };

    // Desktop follow
    const onDesktopMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      scheduleIdleFade();
    };

    // Touch spawn only（追従なし）
    const onTouchSpawn = (e) => {
      const p = e.touches ? e.touches[0] : e;
      if (!p) return;
      setTransform(p.clientX, p.clientY); // 固定
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
      // クリック可能要素上でも発現させたいので capture:true
      window.addEventListener("touchstart", onTouchSpawn, { passive: true, capture: true });
      window.addEventListener("pointerdown", onTouchSpawn, { passive: true, capture: true });
    } else {
      window.addEventListener("pointermove", onDesktopMove, { passive: true });
      window.addEventListener("pointerdown", onDesktopMove, { passive: true });
    }

    requestAnimationFrame(tick);
  }
})();