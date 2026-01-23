// assets/cart-init.js
import { addToCart, getCart, removeFromCart, setQty, checkout } from "./cart.js";

const CART_KEY = "paradiceloner_cart_v1";

function yen(n) {
  return "¥" + Number(n || 0).toLocaleString("ja-JP");
}

// priceId -> unitAmount（表示用の円 / 旧カート救済用）
const PRICE_MAP = {
  "price_1SsGhoKIaoBhTWZCtnxZMP9m": 2750, // CD (new)
  "price_1SsGhkKIaoBhTWZC4ID0xUnI": 2750, // SOUNDPACK (new)

  // 任意：旧IDも救済するなら
  "price_1SlmMwKIaoBhTWZC50foHo6u": 2750, // CD (old)
  "price_1SpMR2KIaoBhTWZChWLVHw3b": 2750, // SOUNDPACK (old)
};

// priceId -> product hash（旧カート救済用。基本は slug を優先）
const PRODUCT_HASH_MAP = {
  "price_1SsGhoKIaoBhTWZCtnxZMP9m": "#session-collection",
  "price_1SsGhkKIaoBhTWZC4ID0xUnI": "#pil-soundpack-vol1",

  "price_1SlmMwKIaoBhTWZC50foHo6u": "#session-collection",
  "price_1SpMR2KIaoBhTWZChWLVHw3b": "#pil-soundpack-vol1",
};

// priceId -> slug（旧カート救済用）
const SLUG_MAP = {
  "price_1SsGhoKIaoBhTWZCtnxZMP9m": "session-collection",
  "price_1SsGhkKIaoBhTWZC4ID0xUnI": "pil-soundpack-vol1",

  "price_1SlmMwKIaoBhTWZC50foHo6u": "session-collection",
  "price_1SpMR2KIaoBhTWZChWLVHw3b": "pil-soundpack-vol1",
};

function scrollTopHard() {
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    requestAnimationFrame(() => window.scrollTo(0, 0));
  });
  setTimeout(() => window.scrollTo(0, 0), 50);
}

/**
 * 旧カート救済：
 * - unitAmount が無い / 0 の場合に PRICE_MAP で補完
 * - slug が無い / 空の場合に SLUG_MAP で補完
 */
function migrateCart() {
  const cart = getCart();
  if (!cart.length) return;

  let changed = false;

  for (const item of cart) {
    const curUnit = Number(item.unitAmount || 0);
    if (!curUnit) {
      const v = PRICE_MAP[item.priceId];
      if (v) {
        item.unitAmount = v;
        changed = true;
      }
    }

    const curSlug = String(item.slug || "").trim();
    if (!curSlug) {
      const s = SLUG_MAP[item.priceId];
      if (s) {
        item.slug = s;
        changed = true;
      }
    }
  }

  if (changed) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("cart:updated"));
  }
}

function render() {
  const cart = getCart();

  const listEl = document.getElementById("cart-list");
  const subtotalEl = document.getElementById("cart-subtotal");

  const emptyEl = document.getElementById("cart-empty");
  const summaryEl = document.getElementById("cart-summary");
  const noteEl = document.getElementById("cart-note");

  const countEls = [
    document.getElementById("cart-count-top"),
    document.getElementById("cart-count"),
    document.getElementById("cart-count-drawer"),
  ].filter(Boolean);

  if (!listEl || !subtotalEl) return;

  const isEmpty = !cart || cart.length === 0;

  if (emptyEl) emptyEl.hidden = !isEmpty;
  if (summaryEl) summaryEl.hidden = isEmpty;
  if (noteEl) noteEl.hidden = isEmpty;
  listEl.hidden = isEmpty;

  if (isEmpty) {
    subtotalEl.textContent = yen(0);
    listEl.innerHTML = "";
    countEls.forEach((el) => {
      el.textContent = "";
      el.hidden = true;
    });
    return;
  }

  let subtotal = 0;
  let count = 0;
  listEl.innerHTML = "";

  for (const item of cart) {
    const qty = Math.max(1, Number(item.qty || 0));
    const unit = Number(item.unitAmount || 0);

    subtotal += unit * qty;
    count += qty;

    const row = document.createElement("div");
    row.className = "cart-row";

    const slug = String(item.slug || "").trim();
    const productHash = slug ? `#${slug}` : (PRODUCT_HASH_MAP[item.priceId] || "#");

    row.innerHTML = `
      <a class="cart-left cart-jump" href="${productHash}" data-cart-jump="${productHash}">
        <div class="cart-thumb">
          ${item.img ? `<img src="${item.img}" alt="" loading="lazy" decoding="async">` : ``}
        </div>
        <div class="cart-meta">
          <div class="cart-name">${item.name || ""}</div>
          <div class="cart-sub">${item.kind || ""}</div>
        </div>
      </a>

      <div class="cart-right">
        <div class="cart-price">${yen(unit)}</div>

        <div class="cart-qtybox">
          <div class="cart-qtylabel">数量</div>
          <input class="cart-qty" type="number" min="1" max="99" value="${qty}" inputmode="numeric" />
          <button class="cart-remove" type="button">削除</button>
        </div>
      </div>
    `;

    const qtyInput = row.querySelector(".cart-qty");
    const rmBtn = row.querySelector(".cart-remove");

    qtyInput?.addEventListener("change", () => setQty(item.priceId, qtyInput.value));
    rmBtn?.addEventListener("click", () => removeFromCart(item.priceId));

    listEl.appendChild(row);
  }

  subtotalEl.textContent = yen(subtotal);

  countEls.forEach((el) => {
    if (count > 0) {
      el.textContent = String(count);
      el.hidden = false;
    } else {
      el.textContent = "";
      el.hidden = true;
    }
  });
}

// ===== Bag modal（hash変えない）=====
function setupBagModal() {
  const overlay = document.getElementById("bagOverlay");
  const modal = document.getElementById("bagModal");
  const closeBtn = document.getElementById("bagClose");
  const bagLinkTop = document.getElementById("bagLink");

  if (!overlay || !modal) {
    const noop = () => {};
    return { openBag: noop, closeBag: noop, isOpen: () => false };
  }

  let prevHash = "";
  let openFlag = false;

  function openBag(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation?.();
    }
    prevHash = location.hash || "";

    overlay.hidden = false;
    modal.hidden = false;

    // ★ overlay も is-open にする（視覚/クリックの整合）
    overlay.classList.add("is-open");

    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("is-open");
    openFlag = true;
    document.body.classList.add("is-locked");
    render();
  }

  function closeBag() {
    overlay.hidden = true;
    modal.hidden = true;

    overlay.classList.remove("is-open");

    modal.setAttribute("aria-hidden", "true");
    modal.classList.remove("is-open");
    openFlag = false;
    document.body.classList.remove("is-locked");

    if (prevHash !== (location.hash || "")) {
      location.hash = prevHash || "";
    }
    scrollTopHard();
  }

  bagLinkTop?.addEventListener("click", openBag, { capture: true });
  closeBtn?.addEventListener("click", closeBag, { capture: true });
  overlay?.addEventListener("click", closeBag, { capture: true });

  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && openFlag) closeBag();
  });

  window.__bag = { open: openBag, close: closeBag, isOpen: () => openFlag };

  return { openBag, closeBag, isOpen: () => openFlag };
}

// ===== Add to cart =====
function setupAddToCart(openBag) {
  document.addEventListener(
    "click",
    (e) => {
      const btn = e.target.closest?.(".btn-add");
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const priceId = btn.dataset.priceId;
      const name = btn.dataset.name || "Item";
      const kind = btn.dataset.kind || "digital";
      const img = btn.dataset.img || "";

      if (!priceId) {
        alert("priceId が入ってないです（data-price-id）");
        return;
      }

      const unitAmount = Number(
        btn.dataset.unitAmount || btn.dataset.price || PRICE_MAP[priceId] || 0
      );

      const slug = String(btn.dataset.productSlug || "").trim();

      addToCart({ priceId, name, kind, img, unitAmount, qty: 1, slug });
      openBag?.();
    },
    { capture: true }
  );
}

// ===== Cart jump (thumb/title) =====
function setupCartJump(bag) {
  const list = document.getElementById("cart-list");
  if (!list) return;

  list.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest?.("[data-cart-jump]");
      if (!a) return;

      if (e.target.closest(".cart-qtybox")) return;

      e.preventDefault();
      e.stopPropagation();

      const hash = a.getAttribute("data-cart-jump");
      if (!hash || hash === "#") return;

      sessionStorage.setItem("pc_allow_product_hash", "1");

      bag.closeBag();
      setTimeout(() => {
        location.hash = hash;
        scrollTopHard();
      }, 0);
    },
    { capture: true }
  );
}

// ===== BUY（最強版）：document capture で強制発火 =====
function setupCheckoutHard() {
  let busy = false;

  const tryCheckout = async (btn) => {
    if (busy) return;
    busy = true;

    if (btn) {
      btn.setAttribute("aria-busy", "true");
      btn.style.pointerEvents = "none";
    }

    try {
      await checkout();
    } catch (err) {
      console.error("[cart-init] checkout failed:", err);
      alert("決済へ進めませんでした。Console を確認してください。");
    } finally {
      busy = false;
      if (btn) {
        btn.setAttribute("aria-busy", "false");
        btn.style.pointerEvents = "";
      }
    }
  };

  const handler = (e) => {
    const btn = e.target.closest?.("#cart-checkout");
    if (!btn) return;

    // ★ここで必ず奪う（他JS/レイヤーに負けない）
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation?.();

    // もし summary が hidden(空カート)なら無視
    const summary = document.getElementById("cart-summary");
    if (summary && summary.hidden) return;

    // 実行
    tryCheckout(btn);
  };

  // click だけじゃなく全部拾う
  document.addEventListener("pointerdown", handler, { capture: true });
  document.addEventListener("touchend", handler, { capture: true });
  document.addEventListener("click", handler, { capture: true });
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    migrateCart();

    const bag = setupBagModal();
    setupAddToCart(bag.openBag);
    setupCartJump(bag);

    // ===== Stripe cancel から戻ったら Bag を開く =====
    (() => {
      try {
        const u = new URL(location.href);
        if (u.searchParams.get("bag") === "1") {
          u.searchParams.delete("bag");
          history.replaceState(null, "", u.pathname + u.search + u.hash);

          // Bag open
          window.__bag?.open?.();
          // 必要なら描画も強制
          // render();
        }
      } catch (e) {
        console.warn("[cart-init] openBagIfRequested failed:", e);
      }
    })();

    // ★BUY強制
    setupCheckoutHard();

    render();
    window.addEventListener("cart:updated", render);
  } catch (err) {
    console.error("[cart-init] fatal:", err);
    alert("cart-init.js が途中で死んでます。Console を見てください。");
  }
});