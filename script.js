// ==============================
// year
// ==============================
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ==============================
// Drawer
// ==============================
const menuBtn = document.getElementById("menuBtn");
const drawer  = document.getElementById("drawer");
const overlay = document.getElementById("overlay");
const stack   = document.getElementById("drawerStack");

const setExpanded = (isOpen) => {
  if (menuBtn) menuBtn.setAttribute("aria-expanded", String(isOpen));
  if (drawer)  drawer.setAttribute("aria-hidden", String(!isOpen));
};

const setPanel = (name) => {
  if (!stack) return;
  stack.querySelectorAll(".drawer__panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === name);
  });
};

const openDrawer = () => {
  if (!drawer || !overlay) return;
  drawer.classList.add("is-open");
  overlay.hidden = false;
  document.body.classList.add("is-locked");
  setPanel("main");
  setExpanded(true);
};

const closeDrawer = () => {
  if (!drawer || !overlay) return;
  drawer.classList.remove("is-open");
  overlay.hidden = true;
  document.body.classList.remove("is-locked");
  setExpanded(false);
};

if (menuBtn) menuBtn.addEventListener("click", openDrawer);
if (overlay) overlay.addEventListener("click", closeDrawer);

if (stack) {
  stack.querySelectorAll("[data-open-panel]").forEach((btn) => {
    btn.addEventListener("click", () => setPanel(btn.dataset.openPanel));
  });

  stack.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => setPanel("main"));
  });

  stack.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", closeDrawer);
  });
}

// ==============================
// Pointer type detection
// ==============================
const isFinePointer =
  window.matchMedia && window.matchMedia("(pointer: fine)").matches;

const isCoarsePointer =
  window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

// ==============================
// Pointer FX (PC only)
// ==============================
if (isFinePointer) {
  const fx      = document.getElementById("pointer-fx");
  const lockbox = document.getElementById("lockbox");

  const CLICKABLE_SELECTOR = [
    "a[href]",
    "button",
    '[role="button"]',
    "[data-open-panel]",
    "[data-close]",
    "[data-back]",
    ".drawer__item",
    ".drawer__listItem",
    ".pill",
    ".btn"
  ].join(",");

  const closestClickable = (el) =>
    el && el.closest ? el.closest(CLICKABLE_SELECTOR) : null;

  if (fx) {
    const moveFx = (x, y) => {
      fx.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      fx.style.opacity = "1";
    };

    const hideFx = () => {
      fx.style.opacity = "0";
      fx.style.transform = "translate3d(-9999px, -9999px, 0)";
      if (lockbox) lockbox.style.opacity = "0";
    };

    window.addEventListener("mousemove", (e) => {
      moveFx(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener("mouseout", (e) => {
      if (!e.relatedTarget && !e.toElement) hideFx();
    });

    window.addEventListener("blur", hideFx);

    // lockbox hover
    if (lockbox) {
      const showLockbox = () => { lockbox.style.opacity = "1"; };
      const hideLockbox = () => { lockbox.style.opacity = "0"; };

      document.addEventListener("mouseover", (e) => {
        if (closestClickable(e.target)) showLockbox();
      });

      document.addEventListener("mouseout", (e) => {
        const from = closestClickable(e.target);
        const to   = closestClickable(e.relatedTarget);
        if (from && from !== to) hideLockbox();
      });

      document.addEventListener("focusin", (e) => {
        if (closestClickable(e.target)) showLockbox();
      });

      document.addEventListener("focusout", hideLockbox);
    }

    hideFx();
  }
}

// ==============================
// Archive preview (PC hover only)
// ==============================
const preview = document.getElementById("drawerPreview");
if (preview && isFinePointer) {
  document
    .querySelectorAll('[data-panel="archive"] .drawer__listItem[data-cover]')
    .forEach((item) => {
      const url = item.dataset.cover;

      item.addEventListener("mouseenter", () => {
        preview.style.backgroundImage = `url("${url}")`;
        preview.style.opacity = "1";
      });

      item.addEventListener("mouseleave", () => {
        preview.style.opacity = "0";
      });
    });
}

// ==============================
// Pointer FX (Mobile: press-follow + fade)
// ==============================
if (isCoarsePointer) {
  const fx = document.getElementById("pointer-fx");

  if (fx) {
    let targetX = -9999, targetY = -9999;
    let curX = -9999, curY = -9999;
    let rafId = null;
    let hideTimer = null;
    let isDown = false;

    const lerp = (a, b, t) => a + (b - a) * t;

    const render = () => {
      const t = 0.18; // ヌルッ度：0.12〜0.22
      curX = lerp(curX, targetX, t);
      curY = lerp(curY, targetY, t);
      fx.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
      rafId = requestAnimationFrame(render);
    };

    const startRAF = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(render);
    };

    const stopRAF = () => {
      if (!rafId) return;
      cancelAnimationFrame(rafId);
      rafId = null;
    };

    const showFx = () => {
      clearTimeout(hideTimer);
      fx.style.opacity = "1";
      startRAF();
    };

    const hideFx = () => {
      fx.style.opacity = "0"; // 1秒フェード（CSS側）
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        targetX = targetY = curX = curY = -9999;
        fx.style.transform = "translate3d(-9999px, -9999px, 0)";
        stopRAF();
      }, 1000);
    };

    window.addEventListener("pointerdown", (e) => {
      isDown = true;
      showFx();
      targetX = e.clientX;
      targetY = e.clientY;
    }, { passive: true });

    window.addEventListener("pointermove", (e) => {
      if (!isDown) return; // 押してる間だけ追従
      targetX = e.clientX;
      targetY = e.clientY;
    }, { passive: true });

    window.addEventListener("pointerup", () => {
      isDown = false;
      hideFx();
    }, { passive: true });

    window.addEventListener("pointercancel", () => {
      isDown = false;
      hideFx();
    }, { passive: true });
  }
}
