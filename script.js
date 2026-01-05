/* =========================================================
   script.js
   - Drawer open/close + HOME reload
   - Accordion
   - Shop Modal (Shop → All/Digital/Physical opens modal)
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
      menuBtn.classList.toggle("is-open", open); // ← Drawerのときだけ×にする
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

  /* ----------------------------
     Shop Modal (single implementation)
  ---------------------------- */
  const modal = $("#shopModal");
  const modalOverlay = $("#modalOverlay");

  const isModalOpen = () => !!(modal && modal.classList.contains("is-open"));

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    if (modalOverlay) {
      modalOverlay.classList.remove("is-open");
      modalOverlay.hidden = true;
    }

    // view全隠し
    modal.querySelectorAll("[data-modal-view]").forEach(v => (v.hidden = true));

    document.body.classList.remove("is-modal");

    // drawerが開いてなければスクロールロック解除
    if (!drawer || !drawer.classList.contains("is-open")) {
      document.body.classList.remove("is-locked");
    }
  };

  const openModal = (viewName) => {
    if (!modal) return;

    // drawerを閉じる（×も戻る）
    if (drawer && drawer.classList.contains("is-open")) closeDrawer();

    // 表示ビュー切り替え
    modal.querySelectorAll("[data-modal-view]").forEach(v => (v.hidden = true));
    const view = modal.querySelector(`[data-modal-view="${viewName}"]`);
    if (view) view.hidden = false;

    if (modalOverlay) {
      modalOverlay.hidden = false;
      // reflow
      modalOverlay.offsetHeight;
      modalOverlay.classList.add("is-open");
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal");

    // モーダル表示中もスクロール止める
    document.body.classList.add("is-locked");
  };

  // Drawer内リンク：data-open-modal で起動
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("[data-open-modal]");
    if (!a) return;
    e.preventDefault();

    const view = a.getAttribute("data-open-modal");
    if (!view) return;

    openModal(view);
  });

  // overlay clickで閉じる
  if (modalOverlay) modalOverlay.addEventListener("click", closeModal);

  /* ----------------------------
     menuBtn click behavior
     - modal open中：drawerではなく modal を閉じる（見た目はハンバーガーのまま）
     - それ以外：drawer toggle
  ---------------------------- */
  if (menuBtn) {
    menuBtn.addEventListener("click", (e) => {
      if (isModalOpen()) {
        // モーダルを閉じる。ハンバーガー表示のまま。
        e.preventDefault();
        closeModal();
        return;
      }

      const expanded = menuBtn.getAttribute("aria-expanded") === "true";
      expanded ? closeDrawer() : openDrawer();
    });
  }

  // Drawer内の data-close
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

  // TOP (HOME reload)
  const goHome = (e) => {
    e.preventDefault();
    const url = location.pathname + location.search;
    location.replace(url);
  };
  $$("[data-home]").forEach((el) => el.addEventListener("click", goHome));

  // Esc: drawer優先 → modal
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (drawer && drawer.classList.contains("is-open")) closeDrawer();
    else if (isModalOpen()) closeModal();
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

    const inViewport = (cx, cy) => cx >= 0 && cy >= 0 && cx <= window.innerWidth && cy <= window.innerHeight;

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