/* =========================================================
   script.js
   - Drawer open/close + HOME reload
   - Accordion
   - Shop Modal (open/close)
   - Pointer FX
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

    // drawer を開いてる間だけ body lock
    // ※ modal側でも lock するが、両方開いてる時も lock 維持でOK
    if (open) document.body.classList.add("is-locked");
    else {
      // modal が開いていたら lock を維持
      const modal = $("#shopModal");
      const modalOpen = modal && modal.classList.contains("is-open");
      if (!modalOpen) document.body.classList.remove("is-locked");
    }
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

  // drawer 内の data-close は閉じるだけ（ページ遷移はさせない）
  if (drawer) {
    drawer.addEventListener("click", (e) => {
      const closeEl = e.target.closest && e.target.closest("[data-close]");
      if (!closeEl) return;

      const href = closeEl.getAttribute("href") || "";
      if (href === "#") e.preventDefault();
      closeDrawer();
    });
  }

  // TOP は “スクロールトップ” 的にリロード（今の挙動維持）
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
     Shop Modal (open/close)
     - drawer の All/Digital/Physical から開く
     - overlay / Esc で閉じる
     ※ 重要：modal開閉で drawer を勝手に閉じない（開く時だけ閉じる）
  ---------------------------- */
  const modal = $("#shopModal");
  const modalOverlay = $("#modalOverlay");

  const closeModal = () => {
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    if (modalOverlay) {
      modalOverlay.classList.remove("is-open");
      modalOverlay.hidden = true;
    }

    // view 非表示
    modal.querySelectorAll("[data-modal-view]").forEach(v => (v.hidden = true));

    // drawer が開いてなければ body lock 解除
    const drawerOpen = drawer && drawer.classList.contains("is-open");
    if (!drawerOpen) document.body.classList.remove("is-locked");
  };

  const openModal = (viewName) => {
    if (!modal) return;

    // drawer は閉じる（menu の見た目優先）
    if (drawer && drawer.classList.contains("is-open")) closeDrawer();

    // view 切替
    modal.querySelectorAll("[data-modal-view]").forEach(v => (v.hidden = true));
    const view = modal.querySelector(`[data-modal-view="${viewName}"]`);
    if (view) view.hidden = false;

    // overlay
    if (modalOverlay) {
      modalOverlay.hidden = false;
      modalOverlay.offsetHeight; // reflow
      modalOverlay.classList.add("is-open");
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    // modal中は body lock
    document.body.classList.add("is-locked");
  };

  // drawer のリンク（data-open-modal）で modal を開く
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("[data-open-modal]");
    if (!a) return;
    e.preventDefault();

    const view = a.getAttribute("data-open-modal");
    if (!view) return;
    openModal(view);
  });

  // modal overlay click
  if (modalOverlay) modalOverlay.addEventListener("click", closeModal);

  // Esc：drawer優先、次にmodal
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    if (drawer && drawer.classList.contains("is-open")) closeDrawer();
    else if (modal && modal.classList.contains("is-open")) closeModal();
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
  ---------------------------- */
  const fx = $("#pointer-fx");
  if (fx) {
    let x = -9999, y = -9999;
    let tx = -9999, ty = -9999;

    let idleTimer = null;
    let dimTimer  = null;

    const isInteractive = (el) => {
      if (!el) return false;
      return !!(el.closest && el.closest(
        'a[href]:not([href=""]), button, [role="button"], input, textarea, select, label, summary'
      ));
    };

    const setTransform = (nx, ny) => {
      x = nx; y = ny;
      tx = nx; ty = ny;
      fx.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
    };

    const hardHide = () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (dimTimer) clearTimeout(dimTimer);

      tx = ty = x = y = -9999;
      fx.style.transform = "translate3d(-9999px,-9999px,0)";

      fx.style.transition = "none";
      fx.style.opacity = "0";
      fx.style.visibility = "hidden";
      fx.classList.remove("is-hot");
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

    const inViewport = (cx, cy) => {
      return cx >= 0 && cy >= 0 && cx <= window.innerWidth && cy <= window.innerHeight;
    };

    const onDesktopMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;

      if (!inViewport(tx, ty)) {
        hardHide();
        return;
      }

      hardShow();
      updateHot(tx, ty);
    };

    const onTouchSpawn = (e) => {
      const p = e.touches ? e.touches[0] : e;
      if (!p) return;

      setTransform(p.clientX, p.clientY);
      fx.classList.remove("is-hot");

      if (idleTimer) clearTimeout(idleTimer);
      if (dimTimer) clearTimeout(dimTimer);

      fx.style.visibility = "visible";
      fx.style.transition = "none";
      fx.style.opacity = "1";

      requestAnimationFrame(() => {
        fx.style.transition = "opacity 1000ms linear";
        fx.style.opacity = "0";
      });

      idleTimer = setTimeout(() => {
        fx.style.transition = "";
      }, 1000);
    };

    const tick = () => {
      if (!isTouch) {
        x = tx;
        y = ty;
        fx.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      requestAnimationFrame(tick);
    };

    if (isTouch) {
      window.addEventListener("touchstart", onTouchSpawn, { passive: true, capture: true });
      window.addEventListener("pointerdown", onTouchSpawn, { passive: true, capture: true });
    } else {
      document.addEventListener("pointerleave", hardHide, { passive: true });
      document.addEventListener("mouseleave", hardHide, { passive: true });

      document.addEventListener("pointerout", (e) => {
        if (!e.relatedTarget) hardHide();
      }, { passive: true });

      document.addEventListener("mouseout", (e) => {
        if (!e.relatedTarget) hardHide();
      }, { passive: true });

      window.addEventListener("blur", hardHide, { passive: true });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) hardHide();
      });

      window.addEventListener("focus", hardShow, { passive: true });

      window.addEventListener("pointermove", onDesktopMove, { passive: true });
      window.addEventListener("pointerdown", onDesktopMove, { passive: true });
    }

    requestAnimationFrame(tick);
  }
})();