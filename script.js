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
// Pointer FX (mouse + touch)
// ==============================
const fx      = document.getElementById("pointer-fx");
const lockbox = document.getElementById("lockbox");

// lockbox を出す対象
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
  // 位置更新
  const moveFx = (x, y) => {
    fx.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  // 消す（PCは座標退避、スマホはフェード→退避）
  let hideTimer = null;

  const hideFx = () => {
    if (isTouch) {
      fx.style.opacity = "0";                 // ← 1秒フェード（CSS側でtransition）
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        fx.style.transform = "translate3d(-9999px, -9999px, 0)";
      }, 1000);
    } else {
      fx.style.transform = "translate3d(-9999px, -9999px, 0)";
    }
    lockbox.style.opacity = "0";
  };

  const showFx = () => {
    fx.style.opacity = "1";
    clearTimeout(hideTimer);
  };

  // ------------------------------
  // PC: mousemove
  // ------------------------------
  window.addEventListener("mousemove", (e) => {
    if (isTouch) return;
    showFx();
    moveFx(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener("mouseout", (e) => {
    if (isTouch) return;
    if (!e.relatedTarget && !e.toElement) hideFx();
  });

  window.addEventListener("blur", hideFx);

  // ------------------------------
  // Mobile/Tablet: Pointer Events (stable)
  // ------------------------------
  window.addEventListener("pointerdown", (e) => {
    if (!isTouch) return;
    showFx();
    moveFx(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener("pointermove", (e) => {
    if (!isTouch) return;
    showFx();
    moveFx(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener("pointerup", (e) => {
    if (!isTouch) return;
    hideFx(); // 指を離したら1秒でじんわり消える（hideFx内のfade）
  }, { passive: true });

  window.addEventListener("pointercancel", (e) => {
    if (!isTouch) return;
    hideFx();
  }, { passive: true });
  

  // ------------------------------
  // lockbox show/hide
  // PC: hover/focus
  // Touch: touchstart で出す
  // ------------------------------
  const showLockbox = () => { lockbox.style.opacity = "1"; };
  const hideLockbox = () => { lockbox.style.opacity = "0"; };

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

  document.addEventListener("focusin", (e) => {
    if (isTouch) return;
    if (closestClickable(e.target)) showLockbox();
  });
  document.addEventListener("focusout", () => {
    if (isTouch) return;
    hideLockbox();
  });

  // ✅スマホ：指を置いた瞬間に lockbox 表示
  document.addEventListener("touchstart", (e) => {
    if (!isTouch) return;
    if (closestClickable(e.target)) showLockbox();
    else hideLockbox();
  }, { passive: true });

  // 初期状態
  hideFx();
}