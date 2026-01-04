/* =========================================================
   script.js
   - Drawer open/close
   - Smooth accordion
   - Year
   - Pointer FX (touch: spawn only / no follow)
========================================================= */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const isTouch =
    ("ontouchstart" in window) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    matchMedia("(pointer: coarse)").matches;

  // Year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Drawer
  const menuBtn = $("#menuBtn");
  const overlay = $("#overlay");
  const drawer = $("#drawer");

  const setOpen = (open) => {
    menuBtn?.setAttribute("aria-expanded", open ? "true" : "false");
    drawer?.setAttribute("aria-hidden", open ? "false" : "true");
    drawer?.classList.toggle("is-open", open);
    if (overlay) overlay.hidden = !open;
    document.body.classList.toggle("is-locked", open);
  };

  const openDrawer = () => setOpen(true);
  const closeDrawer = () => setOpen(false);

  menuBtn?.addEventListener("click", () => {
    const on = menuBtn.getAttribute("aria-expanded") === "true";
    on ? closeDrawer() : openDrawer();
  });
  overlay?.addEventListener("click", closeDrawer);

  // Close buttons / TOP links
  drawer?.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-close]")) {
      e.preventDefault();
      closeDrawer();
    }
  });

  // TOP smooth scroll (both topbar + drawer TOP)
  $$(".toplink,[data-toplink]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      closeDrawer();
    });
  });

  // ESC close
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  // Smooth accordion
  const accBtns = $$("[data-acc]");
  accBtns.forEach((btn) => {
    const panel = btn.parentElement?.querySelector("[data-acc-panel]");
    if (!panel) return;

    // 初期は閉じる（念のため）
    panel.style.maxHeight = "0px";
    panel.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    btn.querySelector(".acc__mark") && (btn.querySelector(".acc__mark").textContent = "+");

    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";

      // close
      if (open) {
        btn.setAttribute("aria-expanded", "false");
        const mark = btn.querySelector(".acc__mark");
        if (mark) mark.textContent = "+";

        panel.style.maxHeight = panel.scrollHeight + "px"; // いったん固定
        requestAnimationFrame(() => {
          panel.style.maxHeight = "0px";
          panel.classList.remove("is-open");
        });
        return;
      }

      // open
      btn.setAttribute("aria-expanded", "true");
      const mark = btn.querySelector(".acc__mark");
      if (mark) mark.textContent = "−";

      panel.classList.add("is-open");
      panel.style.maxHeight = panel.scrollHeight + "px";
    });
  });

  // Pointer FX
  const fx = $("#pointer-fx");
  if (!fx) return;

  let idle = null;
  let x = -9999, y = -9999, tx = -9999, ty = -9999;

  const show = () => { fx.style.opacity = "1"; };
  const hideLater = () => {
    if (idle) clearTimeout(idle);
    idle = setTimeout(() => { fx.style.opacity = "0"; }, isTouch ? 900 : 1200);
  };
  const setPos = (nx, ny) => {
    x = nx; y = ny;
    tx = nx; ty = ny;
    fx.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
  };

  // Touch: spawn only（追従しない）
  const spawn = (e) => {
    const p = e.touches?.[0] || e;
    if (!p) return;
    show();
    setPos(p.clientX, p.clientY);
    hideLater();
  };

  // Desktop: follow（軽く）
  const move = (e) => {
    tx = e.clientX;
    ty = e.clientY;
    show();
    hideLater();
  };

  if (isTouch) {
    window.addEventListener("touchstart", spawn, { passive: true });
    window.addEventListener("pointerdown", spawn, { passive: true });
    // move系は登録しない（←追従の根を断つ）
  } else {
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });

    const tick = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      fx.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
})();