// assets/cart-init.js
import {
  addToCart,
  getCart,
  clearCart,
  removeFromCart,
  setQty,
  checkout
} from "./cart.js";

const CART_KEY = "paradiceloner_cart_v1";

/* =========================
   utils
========================= */
function yen(n) {
  return "¥" + Number(n || 0).toLocaleString("ja-JP");
}

// priceId -> 表示用 unitAmount（円）
const PRICE_MAP = {
  "price_1SlmMwKIaoBhTWZC50foHo6u": 2750, // CD
  "price_1SpMR2KIaoBhTWZChWLVHw3b": 2750  // SOUNDPACK
};

/* =========================
   migrate (¥0 対策)
========================= */
function migrateCartPrices() {
  const cart = getCart();
  if (!cart.length) return;

  let changed = false;

  for (const item of cart) {
    if (!item.unitAmount || item.unitAmount === 0) {
      const v = PRICE_MAP[item.priceId];
      if (v) {
        item.unitAmount = v;
        changed = true;
      }
    }
  }

  if (changed) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("cart:updated"));
  }
}

/* =========================
   render cart
========================= */
function render() {
  const cart = getCart();

  const listEl  = document.getElementById("cart-list");
  const totalEl = document.getElementById("cart-total");

  const countEls = [
    document.getElementById("cart-count"),
    document.getElementById("cart-count-top"),
    document.getElementById("cart-count-drawer"),
  ].filter(Boolean);

  if (!listEl || !totalEl) return;

  let total = 0;
  let count = 0;

  listEl.innerHTML = "";

  for (const item of cart) {
    total += (item.unitAmount || 0) * item.qty;
    count += item.qty;

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "10px";
    row.style.alignItems = "center";
    row.style.margin = "8px 0";

    row.innerHTML = `
      <div style="flex:1;">
        <div style="font-weight:600;">${item.name}</div>
        <div style="opacity:.7;font-size:12px;">
          ${item.kind} / ${item.priceId}
        </div>
      </div>
      <input type="number" min="1" max="99" value="${item.qty}" style="width:64px;" />
      <button type="button">Remove</button>
    `;

    const qtyInput = row.querySelector("input");
    const rmBtn = row.querySelector("button");

    qtyInput.addEventListener("change", () =>
      setQty(item.priceId, qtyInput.value)
    );
    rmBtn.addEventListener("click", () =>
      removeFromCart(item.priceId)
    );

    listEl.appendChild(row);
  }

  totalEl.textContent = yen(total);
  countEls.forEach(el => (el.textContent = String(count)));
}

/* =========================
   BAG modal (history対応)
========================= */
function setupBagModal() {
  const overlay  = document.getElementById("bagOverlay");
  const modal    = document.getElementById("bagModal");
  const closeBtn = document.getElementById("bagClose");
  const bagLink  = document.getElementById("bagLink");

  let prevHash = "";

  function openBag(e) {
    if (e) e.preventDefault();
    if (!overlay || !modal) return;

    prevHash = location.hash || "";

    if (location.hash !== "#bag") {
      history.pushState({ bag: true }, "", "#bag");
    }

    overlay.hidden = false;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("is-open");

    render();
  }

  function closeBag() {
    if (location.hash === "#bag") {
      history.back();
      return;
    }
    if (prevHash) location.hash = prevHash;
  }

  function syncByHash() {
    const isBag = location.hash === "#bag";
    if (!overlay || !modal) return;

    if (isBag) {
      overlay.hidden = false;
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      modal.classList.add("is-open");
      render();
    } else {
      overlay.hidden = true;
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      modal.classList.remove("is-open");
    }
  }

  bagLink?.addEventListener("click", openBag);
  closeBtn?.addEventListener("click", closeBag);
  overlay?.addEventListener("click", closeBag);

  window.addEventListener("popstate", syncByHash);
  window.addEventListener("hashchange", syncByHash);

  syncByHash();

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && location.hash === "#bag") {
      closeBag();
    }
  });
}

/* =========================
   ADD TO BAG
========================= */
function setupAddToCart() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-add");
    if (!btn) return;

    const priceId = btn.dataset.priceId;
    if (!priceId) return;

    const name = btn.dataset.name || "Item";
    const kind = btn.dataset.kind || "digital";

    const unitAmount = Number(
      btn.dataset.unitAmount ||
      PRICE_MAP[priceId] ||
      0
    );

    addToCart({
      priceId,
      name,
      kind,
      unitAmount,
      qty: 1
    });
  });
}

/* =========================
   UI buttons
========================= */
function setupCartUIButtons() {
  document
    .getElementById("cart-clear")
    ?.addEventListener("click", clearCart);

  document
    .getElementById("cart-checkout")
    ?.addEventListener("click", checkout);
}

/* =========================
   init
========================= */
document.addEventListener("DOMContentLoaded", () => {
  migrateCartPrices();

  setupBagModal();
  setupAddToCart();
  setupCartUIButtons();

  render();
  window.addEventListener("cart:updated", render);
});