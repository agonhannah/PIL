// ==============================
// year
// ==============================
document.getElementById("year").textContent = new Date().getFullYear();

// ==============================
// touch detection
// ==============================
const isTouch =
  window.matchMedia &&
  window.matchMedia("(pointer: coarse)").matches;

if (isTouch) document.body.classList.add("is-touch");

// ==============================
// Pointer FX (stable iOS touch + rAF smooth)
// ==============================
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

if (fx && lockbox) {
  let targetX = -9999, targetY = -9999;
  let curX = -9999, curY = -9999;
  let rafId = null;
  let hideTimer = null;

  const lerp = (a, b, t) => a + (b - a) * t;

  const startRAF = () => {
    if (rafId) return;
    const tick = () => {
      const t = isTouch ? 0.18 : 0.35;
      curX = lerp(curX, targetX, t);
      curY = lerp(curY, targetY, t);
      fx.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
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

  const hardHide = () => {
    targetX = targetY = -9999;
    curX = curY = -9999;
    fx.style.transform = "translate3d(-9999px,-9999px,0)";
    stopRAF();
  };

  const hideFx = () => {
    lockbox.style.opacity = "0";

    if (isTouch) {
      fx.style.opacity = "0"; // CSS transition(1s)
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hardHide, 1000);
    } else {
      fx.style.opacity = "0";
      hardHide();
    }
  };

  const showLockbox = () => { lockbox.style.opacity = "1"; };
  const hideLockbox = () => { lockbox.style.opacity = "0"; };

  // ------------------------------
  // PC: mouse
  // ------------------------------
  window.addEventListener("mousemove", (e) => {
    if (isTouch) return;
    showFx();
    targetX = e.clientX;
    targetY = e.clientY;
  }, { passive: true });

  window.addEventListener("mouseout", (e) => {
    if (isTouch) return;
    if (!e.relatedTarget && !e.toElement) hideFx();
  });

  // hover lockbox (PC)
  document.addEventListener("mouseover", (e) => {
    if (isTouch) return;
    if (closestClickable(e.target)) showLockbox();
  });
  document.addEventListener("mouseout", (e) => {
    if (isTouch) return;
    const from = closestClickable(e.target);
    const to   = closestClickable(e.relatedTarget);
    if (from && from !== to) hideLockbox();
  });

  // ------------------------------
  // Mobile: touch (MOST reliable on iOS)
  // ------------------------------
  const getTouch = (e) => (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);

  const updateLockboxByPoint = (x, y) => {
    const el = document.elementFromPoint(x, y);
    if (closestClickable(el)) showLockbox();
    else hideLockbox();
  };

  window.addEventListener("touchstart", (e) => {
    if (!isTouch) return;
    const t = getTouch(e);
    if (!t) return;
    showFx();
    targetX = t.clientX;
    targetY = t.clientY;
    updateLockboxByPoint(targetX, targetY);
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (!isTouch) return;
    const t = getTouch(e);
    if (!t) return;
    showFx();
    targetX = t.clientX;
    targetY = t.clientY;
    updateLockboxByPoint(targetX, targetY);
  }, { passive: true });

  window.addEventListener("touchend", () => {
    if (!isTouch) return;
    hideFx();
  }, { passive: true });

  window.addEventListener("touchcancel", () => {
    if (!isTouch) return;
    hideFx();
  }, { passive: true });

  window.addEventListener("blur", hideFx);

  // init
  hideFx();
}

// ==============================
// Drawer preview: mobile "press = show"
// ==============================
const preview = document.getElementById("drawerPreview");
if (preview && isTouch) {
  document
    .querySelectorAll('[data-panel="archive"] .drawer__listItem[data-cover]')
    .forEach((item) => {
      const url = item.dataset.cover;

      // 指を置いたら表示
      item.addEventListener("touchstart", () => {
        preview.style.backgroundImage = `url("${url}")`;
        preview.style.opacity = "1";
      }, { passive: true });

      // 離したら消す
      item.addEventListener("touchend", () => {
        preview.style.opacity = "0";
      }, { passive: true });

      item.addEventListener("touchcancel", () => {
        preview.style.opacity = "0";
      }, { passive: true });
    });
}
