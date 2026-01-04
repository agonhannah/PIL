/* =========================================================
   Drawer: open/close + accordion（HYKEの“間にニョッ”）
   Pointer FX: rAFで軽量追従 + すぐ消える
========================================================= */

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

  function openDrawer() {
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    overlay.hidden = false;
    menuBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("is-locked");
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
    menuBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-locked");
  }

  menuBtn?.addEventListener("click", openDrawer);
  overlay?.addEventListener("click", closeDrawer);

  // close buttons + “TOP” inside drawer
  $$("[data-close]").forEach(el => {
    el.addEventListener("click", () => closeDrawer());
  });

  // ESC close (desktop)
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer();
  });

  // ---------- Accordion ----------
  function toggleAcc(key) {
    const btn = $(`[data-acc="${key}"]`);
    const panel = $(`[data-acc-panel="${key}"]`);
    if (!btn || !panel) return;

    const willOpen = btn.getAttribute("aria-expanded") !== "true";

    // 同階層の他を閉じる（必要なら）
    // ※SHOP内のgoodsは別扱いにしたいので、ここは「同じ親のacc__panel内」だけ閉じる
    const parent = btn.closest(".drawer__acc") || btn.parentElement;
    if (parent) {
      $$('[data-acc]', parent).forEach(otherBtn => {
        const otherKey = otherBtn.getAttribute("data-acc");
        const otherPanel = $(`[data-acc-panel="${otherKey}"]`);
        if (!otherKey || !otherPanel) return;
        if (otherBtn === btn) return;

        // goodsはSHOPの内側なので、drawer__acc直下の3つだけ閉じる
        if (btn.classList.contains("acc__subbtn")) return;
        if (otherBtn.classList.contains("acc__subbtn")) return;

        otherBtn.setAttribute("aria-expanded", "false");
        otherPanel.hidden = true;
        const mk = $(".acc__mark", otherBtn);
        if (mk) mk.textContent = "+";
      });
    }

    btn.setAttribute("aria-expanded", String(willOpen));
    panel.hidden = !willOpen;
    const mark = $(".acc__mark", btn);
    if (mark) mark.textContent = willOpen ? "−" : "+";
  }

  $$("[data-acc]").forEach(btn => {
    btn.addEventListener("click", () => toggleAcc(btn.getAttribute("data-acc")));
  });

  // ---------- Pointer FX (light) ----------
  const fx = $("#pointer-fx");
  const blob = $("#pointer-blob");
  if (!fx || !blob) return;

  let visible = false;
  let targetX = -9999, targetY = -9999;
  let curX = -9999, curY = -9999;
  let raf = 0;

  // 追従の“ヌルさ”係数（0.18〜0.28くらいが軽くて気持ち良い）
  const ease = 0.22;

  function show() {
    if (visible) return;
    visible = true;
    fx.style.opacity = "1";
  }

  function hide() {
    if (!visible) return;
    visible = false;
    fx.style.opacity = "0";
  }

  function tick() {
    // イージング
    curX += (targetX - curX) * ease;
    curY += (targetY - curY) * ease;

    fx.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;

    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (raf) return;
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  // desktop pointer
  window.addEventListener("pointermove", (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    show();
    start();
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    hide();
    // 少し待って止める（チラつき防止）
    setTimeout(() => { if (!visible) stop(); }, 180);
  });

  // touch（iOSで“ラグい”時はここを軽く）
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
    hide(); // ← “スッと消える”の体感を優先
    setTimeout(() => { if (!visible) stop(); }, 160);
  }, { passive: true });

})();