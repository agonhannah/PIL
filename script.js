/* =========================================================
   script.js
   - Drawer open/close + HOME reload (hashless reload)
   - Accordion
   - Shop Modal (open/close)
   - Shop Card -> Product hash navigation (close modal)
   - Hash guard (prevent product showing on direct load)
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
     Elements
  ---------------------------- */
  const menuBtn = $("#menuBtn");
  const overlay = $("#overlay"); // 無ければ null
  const drawer  = $("#drawer");

  const modal = $("#shopModal");
  const modalOverlay = $("#modalOverlay");

  /* ----------------------------
     Hash Guard
     - 直アクセス/更新で #product が残ってると TOPで商品が出る
     - Shopから遷移した時だけ hash を許可する
  ---------------------------- */
  const HASH_FLAG = "pc_allow_product_hash";

  const getProductIds = () =>
    $$(".product[id]").map((el) => el.id).filter(Boolean);

  const isProductHash = (hash) => {
    if (!hash || hash.length < 2) return false;
    const id = hash.slice(1);
    return getProductIds().includes(id);
  };

  const clearHashToHome = () => {
    const url = location.pathname + location.search; // hash無し
    history.replaceState(null, "", url);
    window.scrollTo(0, 0);
  };

  if (isProductHash(location.hash) && !sessionStorage.getItem(HASH_FLAG)) {
    clearHashToHome();
  }

  /* ----------------------------
     Drawer
  ---------------------------- */
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

    const modalOpen = modal && modal.classList.contains("is-open");
    if (open || modalOpen) document.body.classList.add("is-locked");
    else document.body.classList.remove("is-locked");
  };

  const openDrawer  = () => setOpen(true);
  const closeDrawer = () => setOpen(false);

  if (menuBtn) {
    menuBtn.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        const expanded = menuBtn.getAttribute("aria-expanded") === "true";
        expanded ? closeDrawer() : openDrawer();
      },
      { capture: true }
    );
  }

  if (overlay) {
    overlay.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeDrawer();
    });
  }

  if (drawer) {
    drawer.addEventListener("click", (e) => {
      const closeEl = e.target.closest && e.target.closest("[data-close]");
      if (!closeEl) return;

      const href = closeEl.getAttribute("href") || "";
      if (href === "#") e.preventDefault();

      closeDrawer();
    });
  }

  /* ----------------------------
     Shop Modal (open/close)
  ---------------------------- */
  const closeModal = () => {
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    if (modalOverlay) {
      modalOverlay.classList.remove("is-open");
      modalOverlay.hidden = true;
    }

    modal.querySelectorAll("[data-modal-view]").forEach((v) => (v.hidden = true));

    const drawerOpen = drawer && drawer.classList.contains("is-open");
    if (!drawerOpen) document.body.classList.remove("is-locked");
  };

  const openModal = (viewName) => {
    if (!modal) return;

    if (drawer && drawer.classList.contains("is-open")) closeDrawer();

    modal.querySelectorAll("[data-modal-view]").forEach((v) => (v.hidden = true));
    const view = modal.querySelector(`[data-modal-view="${viewName}"]`);
    if (view) view.hidden = false;

    if (modalOverlay) {
      modalOverlay.hidden = false;
      modalOverlay.offsetHeight; // reflow
      modalOverlay.classList.add("is-open");
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
  };

  // drawer のリンク（data-open-modal）で modal を開く
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("[data-open-modal]");
    if (!a) return;

    e.preventDefault();
    e.stopPropagation();

    const view = a.getAttribute("data-open-modal");
    if (!view) return;
    openModal(view);
  });

  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    });
  }

  // Esc：drawer優先、次にmodal
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    if (drawer && drawer.classList.contains("is-open")) closeDrawer();
    else if (modal && modal.classList.contains("is-open")) closeModal();
  });

  /* ----------------------------
     TOP：どこにいても「hash無しでリロード」して無地TOPへ戻す（確実版）
  ---------------------------- */
  const goHome = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 1) 商品 hash 許可フラグを消す
    sessionStorage.removeItem(HASH_FLAG);

    // 2) Drawer / Modal を確実に閉じる（見た目を先に戻す）
    if (drawer && drawer.classList.contains("is-open")) closeDrawer();
    if (modal && modal.classList.contains("is-open")) closeModal();

    // 3) hash無しURLへ“リロード”で戻す（iOS含め最強）
    const url = window.location.pathname + window.location.search;
    window.location.replace(url);
  };

  // ★必ず capture で付ける（他クリック処理に食われない）
  $$("[data-home]").forEach((el) => {
    el.addEventListener("click", goHome, { capture: true });
  });

  /* ----------------------------
     Shop Card -> Product hash navigation
  ---------------------------- */
  const jumpToHash = (hash) => {
    if (!hash || hash === "#") return;

    if (modal && modal.classList.contains("is-open")) closeModal();
    if (drawer && drawer.classList.contains("is-open")) closeDrawer();

    const cur = location.hash;
    if (cur === hash) {
      const url = location.pathname + location.search + hash;
      setTimeout(() => location.replace(url), 0);
      return;
    }
    setTimeout(() => {
      location.hash = hash;
    }, 0);
  };

  // modal内の商品カードクリック：hash許可フラグを立ててから遷移
  if (modal) {
    modal.addEventListener("click", (e) => {
      const link = e.target.closest && e.target.closest("a.shop-card__link");
      if (!link) return;

      const href = link.getAttribute("href") || "";
      if (!href.startsWith("#")) return;

      e.preventDefault();
      e.stopPropagation();

      sessionStorage.setItem(HASH_FLAG, "1");
      jumpToHash(href);
    });
  }

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
      panel.style.transition =
        "max-height 420ms cubic-bezier(.22, 1, .36, 1), opacity 320ms ease";
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
    panel.style.transition =
      "max-height 420ms cubic-bezier(.22, 1, .36, 1), opacity 320ms ease";

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
    const mark = btn.querySelector(".acc__mark");
    panel.hidden = !expanded;
    if (mark) mark.textContent = expanded ? "−" : "+";

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = btn.getAttribute("aria-expanded") === "true";
      isOpen ? closePanel(btn, panel) : openPanel(btn, panel);
    });
  });

  /* ----------------------------
     Pointer FX
  ---------------------------- */
  const fx = $("#pointer-fx");
  if (fx) {
    let x = -9999,
      y = -9999;
    let tx = -9999,
      ty = -9999;

    let idleTimer = null;
    let dimTimer = null;

    const isInteractive = (el) => {
      if (!el) return false;
      return !!(
        el.closest &&
        el.closest(
          'a[href]:not([href=""]), button, [role="button"], input, textarea, select, label, summary'
        )
      );
    };

    const setTransform = (nx, ny) => {
      x = nx;
      y = ny;
      tx = nx;
      ty = ny;
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

      document.addEventListener(
        "pointerout",
        (e) => {
          if (!e.relatedTarget) hardHide();
        },
        { passive: true }
      );

      document.addEventListener(
        "mouseout",
        (e) => {
          if (!e.relatedTarget) hardHide();
        },
        { passive: true }
      );

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