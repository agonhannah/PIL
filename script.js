/* =========================================================
   script.js
   - Drawer open/close + HOME reload
   - Accordion
   - Pointer FX
     mobile: tap spawn + 1s fadeout
     desktop: follow (NO lag) + outside hide + hot判定
========================================================= */

(() => {
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const isTouch =
    ("ontouchstart" in window) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

  document.body.classList.toggle("is-touch", !!isTouch);

  /* ----------------------------
     Drawer
  ---------------------------- */
  const menuBtn = $("#menuBtn");
  const overlay = $("#overlay"); // 無ければ null
  const drawer  = $("#drawer");

  const setOpen = (open) => {
    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.classList.toggle("is-open", open);
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

  const openDrawer  = () => setOpen(true);
  const closeDrawer = () => setOpen(false);

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const expanded = menuBtn.getAttribute("aria-expanded") === "true";
      expanded ? closeDrawer() : openDrawer();
    });
  }
  if (overlay) overlay.addEventListener("click", closeDrawer);

  if (drawer) {
    drawer.addEventListener("click", (e) => {
      const closeEl = e.target.closest && e.target.closest("[data-close]");
      if (!closeEl) return;

      const href = closeEl.getAttribute("href") || "";
      if (href === "#") e.preventDefault();
      closeDrawer();
    });
  }

  const goHome = (e) => {
    e.preventDefault();
    const url = location.pathname + location.search;
    location.replace(url);
  };
  $$("[data-home]").forEach((el) => el.addEventListener("click", goHome));

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (drawer && drawer.classList.contains("is-open")) closeDrawer();
    }
  });

  /* ----------------------------
     Accordion
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
    panel.hidden = !expanded;
    if (mark) mark.textContent = expanded ? "−" : "+";

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      isOpen ? closePanel(btn, panel) : openPanel(btn, panel);
    });
  });

  /* ----------------------------
     Pointer FX
     mobile: tap spawn + 1s fadeout
     desktop: follow (NO lag) + outside hide + hot判定
  ---------------------------- */
  const fx = $("#pointer-fx");
  if (fx) {
    let idleTimer = null;

    const isInteractive = (el) => {
      if (!el) return false;
      return !!(el.closest && el.closest(
        'a[href]:not([href=""]), button, [role="button"], input, textarea, select, label, summary'
      ));
    };

    const setPos = (clientX, clientY) => {
      fx.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`;
    };

    const hardHide = () => {
      if (idleTimer) clearTimeout(idleTimer);

      // 完全に残らないように「見えなくする + 画面外へ退避」
      fx.style.transition = "none";
      fx.style.opacity = "0";
      fx.style.visibility = "hidden";
      fx.classList.remove("is-hot");
      fx.style.transform = "translate3d(-9999px,-9999px,0)";
    };

    const hardShow = () => {
      fx.style.visibility = "visible";
      fx.style.transition = "none";
      fx.style.opacity = "1";
    };

    const updateHot = (clientX, clientY) => {
      const el = document.elementFromPoint(clientX, clientY);
      fx.classList.toggle("is-hot", !isTouch && isInteractive(el));
    };

    // desktop: move（ラグ0。ここで即座に追従）
    const onDesktopMove = (e) => {
      hardShow();
      setPos(e.clientX, e.clientY);
      updateHot(e.clientX, e.clientY);
    };

    // mobile: tap spawn + 1s fadeout（フェードイン無し）
    const onTouchSpawn = (e) => {
      const p = e.touches ? e.touches[0] : e;
      if (!p) return;

      if (idleTimer) clearTimeout(idleTimer);

      fx.classList.remove("is-hot");
      fx.style.visibility = "visible";
      fx.style.transition = "none";
      fx.style.opacity = "1";
      setPos(p.clientX, p.clientY);

      requestAnimationFrame(() => {
        fx.style.transition = "opacity 1000ms linear";
        fx.style.opacity = "0";
      });

      idleTimer = setTimeout(() => {
        // 次のタップで確実に即出しさせる
        fx.style.transition = "";
      }, 1000);
    };

    if (isTouch) {
      window.addEventListener("touchstart", onTouchSpawn, { passive: true, capture: true });
      window.addEventListener("pointerdown", onTouchSpawn, { passive: true, capture: true });
    } else {
      // ★「ブラウザ外へ出た」取りこぼし潰し（確実版）
      // 1) ウィンドウ外へ出た典型
      window.addEventListener("blur", hardHide, { passive: true });

      // 2) タブ切替/最小化など
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) hardHide();
      });

      // 3) 画面外へ出た時の取りこぼし（OS/ブラウザ差を吸収）
      document.addEventListener("mouseleave", hardHide, { passive: true });
      document.documentElement.addEventListener("mouseleave", hardHide, { passive: true });
      document.addEventListener("pointerleave", hardHide, { passive: true });

      // 4) relatedTarget が null ＝ window 外へ
      window.addEventListener("mouseout", (e) => {
        const to = e.relatedTarget || e.toElement;
        if (!to) hardHide();
      }, { passive: true });

      // 戻ったら表示（位置は次の move で確定）
      window.addEventListener("focus", hardShow, { passive: true });
      window.addEventListener("mouseenter", hardShow, { passive: true });

      window.addEventListener("pointermove", onDesktopMove, { passive: true });
      window.addEventListener("pointerdown", onDesktopMove, { passive: true });
    }
  }
})();