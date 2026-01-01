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
// Pointer FX (Pointer Events + rAF smoothing)
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
  let curX    = -9999, curY    = -9999;

  let rafId = null;
  let hideTimer = null;
  let isDown = false;

  const lerp = (a, b, t) => a + (b - a) * t;

  const render = () => {
    // 追従の“ヌルヌル度”
    const t = isTouch ? 0.18 : 0.35;

    curX = lerp(curX, targetX, t);
    curY = lerp(curY, targetY, t);

    fx.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
    rafId = requestAnimationFrame(render);
  };

  const ensureRAF = () => {
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
    ensureRAF();
  };

  const hideFx = () => {
    lockbox.style.opacity = "0";
    isDown = false;

    if (isTouch) {
      // 1秒フェード → 退避（CSS transition）
      fx.style.opacity = "0";
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        targetX = -9999;
        targetY = -9999;
        curX = -9999;
        curY = -9999;
        fx.style.transform = "translate3d(-9999px, -9999px, 0)";
        stopRAF();
      }, 1000);
    } else {
      // PCは即退避
      targetX = -9999;
      targetY = -9999;
      curX = -9999;
      curY = -9999;
      fx.style.opacity = "0";
      fx.style.transform = "translate3d(-9999px, -9999px, 0)";
      stopRAF();
    }
  };

  const showLockbox = () => { lockbox.style.opacity = "1"; };
  const hideLockbox = () => { lockbox.style.opacity = "0"; };

  const updateLockboxByPoint = (x, y) => {
    const el = document.elementFromPoint(x, y);
    if (closestClickable(el)) showLockbox();
    else hideLockbox();
  };

  // ------------------------------
  // Pointer Events (mouse + touch)
  // ------------------------------
  window.addEventListener("pointerdown", (e) => {
    // 指を置いた瞬間に追従開始
    isDown = true;
    showFx();
    targetX = e.clientX;
    targetY = e.clientY;

    if (isTouch) updateLockboxByPoint(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener("pointermove", (e) => {
    // PCは常時、スマホは押下中だけ追従（誤作動防止）
    if (isTouch && !isDown) return;

    showFx();
    targetX = e.clientX;
    targetY = e.clientY;

    if (isTouch) updateLockboxByPoint(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener("pointerup", () => {
    if (!isTouch) return;
    hideFx(); // 指を離したら1秒フェード
  }, { passive: true });

  window.addEventListener("pointercancel", () => {
    if (!isTouch) return;
    hideFx();
  }, { passive: true });

  // ------------------------------
  // PCだけ：hover/focusでlockbox
  // ------------------------------
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

  // ------------------------------
  // PCだけ：画面外に出たら消す
  // ------------------------------
  window.addEventListener("mouseout", (e) => {
    if (isTouch) return;
    if (!e.relatedTarget && !e.toElement) hideFx();
  });

  window.addEventListener("blur", hideFx);

  // 初期状態
  hideFx();
}

// ===== Archive "touch hold" preview =====
const preview = document.getElementById("drawerPreview");
if (preview && isTouch) {
  document
    .querySelectorAll('[data-panel="archive"] .drawer__listItem[data-cover]')
    .forEach((item) => {
      const url = item.dataset.cover;

      item.addEventListener("pointerdown", () => {
        preview.style.backgroundImage = `url("${url}")`;
        preview.style.opacity = "1";
      });

      item.addEventListener("pointerup", () => {
        preview.style.opacity = "0";
      });

      item.addEventListener("pointercancel", () => {
        preview.style.opacity = "0";
      });
    });
}
