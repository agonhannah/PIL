/* =========================================================
   script.js
   - Drawer open/close + HOME reload
   - Accordion
   - Pointer FX (blob + lockbox hot only on desktop)
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

  // drawer内の data-close は閉じる。リンクは生かす（# は止める）
  if (drawer) {
    drawer.addEventListener("click", (e) => {
      const closeEl = e.target.closest && e.target.closest("[data-close]");
      if (!closeEl) return;

      const href = closeEl.getAttribute("href") || "";
      if (href === "#") e.preventDefault();
      closeDrawer();
    });
  }

  // TOPは「再更新」：data-home が付いたリンクを全部これにする
  const goHome = (e) => {
    e.preventDefault();
    // GitHub Pagesでも安全に “hash無し”で戻す
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

    // 初期
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
     Pointer FX (blob always, lockbox only on desktop "hot")
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

    const scheduleIdleFade = () => {
  // touchは「タップ起点」だけで制御するので、ここではdesktop用に残す
  if (isTouch) return;

  if (idleTimer) clearTimeout(idleTimer);
  if (dimTimer) clearTimeout(dimTimer);

  fx.style.opacity = "1";

  dimTimer = setTimeout(() => {
    fx.style.opacity = "0.65";
  }, 40);

  idleTimer = setTimeout(() => {
    fx.style.opacity = "0";
  }, 1400);
};

      const total = isTouch ? 1100 : 1400;
      idleTimer = setTimeout(() => {
        fx.style.opacity = "0";
      }, total);
    };

    const updateHot = (clientX, clientY) => {
      // fx は pointer-events:none なので elementFromPoint が正しく取れる
      const el = document.elementFromPoint(clientX, clientY);
      fx.classList.toggle("is-hot", !isTouch && isInteractive(el));
    };

    const onDesktopMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      updateHot(e.clientX, e.clientY);
      scheduleIdleFade();
    };

    const onTouchSpawn = (e) => {
  const p = e.touches ? e.touches[0] : e;
  if (!p) return;

  setTransform(p.clientX, p.clientY);

  // touchは lockbox 出さない（blobのみ）
  fx.classList.remove("is-hot");

  // 既存タイマーを止める
  if (idleTimer) clearTimeout(idleTimer);
  if (dimTimer) clearTimeout(dimTimer);

  // ★タップした瞬間に発現（transition無しで 1）
  fx.style.transition = "none";
  fx.style.opacity = "1";

  // ★次フレームで 1秒フェード開始（linear）
  requestAnimationFrame(() => {
    fx.style.transition = "opacity 1000ms linear";
    fx.style.opacity = "0";
  });

  // 1秒後に後始末（次のタップで瞬間発現を確実にする）
  idleTimer = setTimeout(() => {
    fx.style.transition = ""; // CSS側に戻すなら ""、固定したいなら "none" でもOK
  }, 1000);
};

    const tick = () => {
      if (!isTouch) {
        x += (tx - x) * 0.18;
        y += (ty - y) * 0.18;
        fx.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      requestAnimationFrame(tick);
    };

    if (isTouch) {
      window.addEventListener("touchstart", onTouchSpawn, { passive: true, capture: true });
      window.addEventListener("pointerdown", onTouchSpawn, { passive: true, capture: true });
    } else {
      window.addEventListener("pointermove", onDesktopMove, { passive: true });
      window.addEventListener("pointerdown", onDesktopMove, { passive: true });
    }

    requestAnimationFrame(tick);
  }
})();