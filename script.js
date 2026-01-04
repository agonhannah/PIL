(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  // Year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Drawer ----------
  const drawer = $("#drawer");
  const overlay = $("#overlay");
  const menuBtn = $("#menuBtn");

  const openDrawer = () => {
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    overlay.hidden = false;
    menuBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("is-locked");
  };

  const closeDrawer = () => {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
    menuBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-locked");
  };

  menuBtn?.addEventListener("click", openDrawer);
  overlay?.addEventListener("click", closeDrawer);

  $$("[data-close]").forEach(el => el.addEventListener("click", closeDrawer));

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer();
  });

  // ---------- Accordion helpers ----------
  function setAccState(btn, panel, open) {
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    panel.hidden = !open;
    const mark = $(".acc__mark", btn);
    if (mark) mark.textContent = open ? "−" : "+";
  }

  // 主アコーディオン（ARCHIVE/SHOP/ORDER）
  function togglePrimary(key) {
    const btn = $(`.acc__btn[data-acc="${key}"]`);
    const panel = $(`.acc__panel[data-acc-panel="${key}"]`);
    if (!btn || !panel) return;

    const willOpen = btn.getAttribute("aria-expanded") !== "true";

    // 他のprimaryを閉じる
    $$(".acc__btn[data-acc]").forEach(otherBtn => {
      if (otherBtn.classList.contains("acc__subbtn")) return; // subは無視
      const otherKey = otherBtn.getAttribute("data-acc");
      if (!otherKey) return;
      const otherPanel = $(`.acc__panel[data-acc-panel="${otherKey}"]`);
      if (!otherPanel) return;
      if (otherBtn === btn) return;
      setAccState(otherBtn, otherPanel, false);
    });

    setAccState(btn, panel, willOpen);

    // SHOPを閉じたら、goodsも閉じる（中身残るの防止）
    if (key === "shop" && !willOpen) {
      const subBtn = $(`.acc__subbtn[data-acc="goods"]`);
      const subPanel = $(`.acc__subpanel[data-acc-panel="goods"]`);
      if (subBtn && subPanel) setAccState(subBtn, subPanel, false);
    }
  }

  // サブアコーディオン（goods）
  function toggleSub(key) {
    const btn = $(`.acc__subbtn[data-acc="${key}"]`);
    const panel = $(`.acc__subpanel[data-acc-panel="${key}"]`);
    if (!btn || !panel) return;

    const willOpen = btn.getAttribute("aria-expanded") !== "true";
    setAccState(btn, panel, willOpen);
  }

  // bind primary
  $$(".acc__btn[data-acc]").forEach(btn => {
    if (btn.classList.contains("acc__subbtn")) return;
    btn.addEventListener("click", () => togglePrimary(btn.getAttribute("data-acc")));
  });

  // bind sub
  $$(".acc__subbtn[data-acc]").forEach(btn => {
    btn.addEventListener("click", () => toggleSub(btn.getAttribute("data-acc")));
  });

  // ---------- Pointer FX ----------
  const fx = $("#pointer-fx");
  const blob = $("#pointer-blob");
  if (!fx || !blob) return;

  let visible = false;
  let targetX = -9999, targetY = -9999;
  let curX = -9999, curY = -9999;
  let raf = 0;

  // 追従のヌルさ（軽さ優先で少し上げる）
  const ease = 0.28;

  const show = () => {
    if (visible) return;
    visible = true;
    fx.style.opacity = "1";
  };

  const hide = () => {
    if (!visible) return;
    visible = false;
    fx.style.opacity = "0";
  };

  const tick = () => {
    curX += (targetX - curX) * ease;
    curY += (targetY - curY) * ease;
    fx.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
    raf = requestAnimationFrame(tick);
  };

  const start = () => {
    if (raf) return;
    raf = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  };

  // pointer (desktop)
  window.addEventListener("pointermove", (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    show();
    start();
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    hide();                      // 即消す
    setTimeout(() => { if (!visible) stop(); }, 80); // 止めるのも早く
  });

  // touch (mobile)
  window.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    if (!t) return;
    targetX = t.clientX;
    targetY = t.clientY;
    show();
    start();
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    if (!t) return;
    targetX = t.clientX;
    targetY = t.clientY;
    show();
  }, { passive: true });

  window.addEventListener("touchend", () => {
    hide();                      // 即消す
    setTimeout(() => { if (!visible) stop(); }, 70);
  }, { passive: true });

})();