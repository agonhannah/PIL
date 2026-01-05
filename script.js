/* =========================================================
   script.js
   - Drawer open/close + HOME reload
   - Accordion
   - Pointer FX
     mobile: tap spawn + 1s fadeout
     desktop: follow (NO lag) + outside hide + hot判定
   - Shop Modal
     open from drawer links / close by menuBtn or overlay or Esc
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
      menuBtn.classList.toggle("is-open", open); // これが×表示
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
     Shop Modal
     ※Topbarは維持 / menuBtnは「閉じる」優先にする
  ---------------------------- */
  const shopModal    = $("#shopModal");
  const modalOverlay = $("#modalOverlay");

  const isModalOpen = () => !!(shopModal && shopModal.classList.contains("is-open"));

  const closeModal = () => {
    if (!shopModal) return;

    shopModal.classList.remove("is-open");
    shopModal.setAttribute("aria-hidden", "true");

    // viewを全部隠す（安全）
    shopModal.querySelectorAll("[data-modal-view]").forEach(v => (v.hidden = true));

    if (modalOverlay) {
      modalOverlay.classList.remove("is-open");
      modalOverlay.hidden = true;
    }

    // menuBtnはハンバーガー表示に戻す（×にしない）
    if (menuBtn) {
      menuBtn.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Open menu");
    }

    // drawerが開いてない時だけロック解除
    if (!drawer || !drawer.classList.contains("is-open")) {
      document.body.classList.remove("is-locked");
    }
  };

  const openModal = (viewName) => {
    if (!shopModal) return;

    // drawerを確実に閉じる（×を消してハンバーガーに戻す）
    if (drawer && drawer.classList.contains("is-open")) closeDrawer();

    // view切替：対象だけ表示
    shopModal.querySelectorAll("[data-modal-view]").forEach(v => (v.hidden = true));
    const view = shopModal.querySelector(`[data-modal-view="${viewName}"]`);
    if (view) view.hidden = false;

    if (modalOverlay) {
      modalOverlay.hidden = false;
      // reflow
      modalOverlay.offsetHeight;
      modalOverlay.classList.add("is-open");
    }

    shopModal.classList.add("is-open");
    shopModal.setAttribute("aria-hidden", "false");

    // モーダル表示中はスクロール止める
    document.body.classList.add("is-locked");

    // menuBtnは「ハンバーガー表示のまま」＆役割だけ Close にする
    if (menuBtn) {
      menuBtn.classList.remove("is-open"); // ←×にしない
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Close shop");
    }
  };

  // Drawer内リンク：data-open-modal="all" などで起動
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("[data-open-modal]");
    if (!a) return;
    e.preventDefault();
    const view = a.getAttribute("data-open-modal");
    if (!view) return;
    openModal(view);
  });

  if (modalOverlay) modalOverlay.addEventListener("click", closeModal);

  /* ----------------------------
     menuBtn click
     優先順位：
       1) modal open → close modal（ハンバーガーのまま閉じる）
       2) 通常 → drawer toggle（×表示）
  ---------------------------- */
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      if (isModalOpen()) {
        closeModal();
        return;
      }
      const expanded = menuBtn.getAttribute("aria-expanded") === "true";
      expanded ? closeDrawer() : openDrawer();
    });
  }

  if (overlay) overlay.addEventListener("click", closeDrawer);

  // drawer内の data-close は閉じる（リンクは生かす / # は止める）
  if (drawer) {
    drawer.addEventListener("click", (e) => {
      const closeEl = e.target.closest && e.target.closest("[data-close]");
      if (!closeEl) return;

      const href = closeEl.getAttribute("href") || "";
      if (href === "#") e.preventDefault();
      closeDrawer();
    });
  }

  // TOPは「再更新」
  const goHome = (e) => {
    e.preventDefault();
    const url = location.pathname + location.search;
    location.replace(url);
  };
  $$("[data-home]").forEach((el) => el.addEventListener("click", goHome));

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      // drawer優先、次にmodal
      if (drawer && drawer.classList.contains("is-open")) closeDrawer();
      else if (isModalOpen()) closeModal();
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