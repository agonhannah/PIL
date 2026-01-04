/* =========================================================
   script.js
   - Drawer open/close
   - Accordion (ARCHIVE / SHOP / ORDER)
   - Sub accordion (All / Digital / Physical)
   - Year
   - Pointer FX
     * Desktop: follow (lerp)
     * Mobile: spawn only (NO follow)
========================================================= */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const isTouch =
    ("ontouchstart" in window) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

  // Year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // =========================
  // Drawer open/close
  // =========================
  const menuBtn = $("#menuBtn");
  const overlay = $("#overlay");
  const drawer  = $("#drawer");

  const setOpen = (open) => {
    if (menuBtn) menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (drawer) {
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
      drawer.classList.toggle("is-open", open);
    }
    if (overlay) overlay.hidden = !open;
    document.body.classList.toggle("is-locked", open);
  };

  const closeDrawer = () => setOpen(false);
  const openDrawer  = () => setOpen(true);

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const expanded = menuBtn.getAttribute("aria-expanded") === "true";
      expanded ? closeDrawer() : openDrawer();
    });
  }
  if (overlay) overlay.addEventListener("click", closeDrawer);

  // drawer内部：data-close で閉じる
  if (drawer) {
    drawer.addEventListener("click", (e) => {
      const t = e.target;

      const closeEl = t.closest && t.closest("[data-close]");
      if (closeEl) {
        // linkの場合も閉じる。#top へは通常遷移でOK
        closeDrawer();
        return;
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) {
      closeDrawer();
    }
  });

  // =========================
  // Accordion (primary)
  // =========================
  const accBtns = $$("[data-acc]");
  accBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-acc");
      const panel = document.querySelector(`[data-acc-panel="${name}"]`);
      if (!panel) return;

      const isOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
      panel.hidden = isOpen;

      // SHOPを閉じたらサブも閉じる（事故防止）
      if (name === "shop" && isOpen) {
        $$("[data-subacc]").forEach((sbtn) => sbtn.setAttribute("aria-expanded", "false"));
        $$("[data-subacc-panel]").forEach((sp) => (sp.hidden = true));
      }
    });
  });

  // =========================
  // Sub accordion (shop)
  // =========================
  const subBtns = $$("[data-subacc]");
  subBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-subacc");
      const panel = document.querySelector(`[data-subacc-panel="${name}"]`);
      if (!panel) return;

      const isOpen = btn.getAttribute("aria-expanded") === "true";

      // 1個だけ開く（HYKEっぽい）
      subBtns.forEach((b) => b.setAttribute("aria-expanded", "false"));
      $$("[data-subacc-panel]").forEach((p) => (p.hidden = true));

      if (!isOpen) {
        btn.setAttribute("aria-expanded", "true");
        panel.hidden = false;
      }
    });
  });

  // =========================
  // Pointer FX
  // =========================
  const fx = $("#pointer-fx");
  if (fx) {
    const lockbox = $("#lockbox");
    if (isTouch && lockbox) lockbox.style.display = "none";

    let x = -9999, y = -9999;
    let tx = -9999, ty = -9999;
    let idleTimer = null;

    const moveTo = (nx, ny) => {
      x = nx; y = ny;
      tx = nx; ty = ny;
      fx.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
    };

    const show = () => { fx.style.opacity = "1"; };

    const scheduleFade = () => {
      // 「パッと消えすぎない」けど、遅延は短め
      const ms = isTouch ? 900 : 1100;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { fx.style.opacity = "0"; }, ms);
    };

    // Desktop follow
    const onDesktopMove = (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      show();
      scheduleFade();
    };

    // Touch spawn only (NO follow)
    const onTouchSpawn = (e) => {
      const p = e.touches ? e.touches[0] : e;
      if (!p) return;
      show();
      moveTo(p.clientX, p.clientY); // ここで固定
      scheduleFade();
    };

    const tick = () => {
      if (!isTouch) {
        // lerpで追従
        x += (tx - x) * 0.18;
        y += (ty - y) * 0.18;
        fx.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      requestAnimationFrame(tick);
    };

    if (isTouch) {
      // “追従”の原因になるmove系は一切登録しない
      window.addEventListener("touchstart", onTouchSpawn, { passive: true });
      window.addEventListener("pointerdown", onTouchSpawn, { passive: true });
    } else {
      window.addEventListener("pointermove", onDesktopMove, { passive: true });
      window.addEventListener("pointerdown", onDesktopMove, { passive: true });
    }

    requestAnimationFrame(tick);
  }
})();