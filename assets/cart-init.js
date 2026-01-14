// assets/cart-init.js
import { addToCart, getCart, clearCart, removeFromCart, setQty, checkout } from "./cart.js";

const CART_KEY = "paradiceloner_cart_v1";

function yen(n) {
  return "¥" + Number(n || 0).toLocaleString("ja-JP");
}

// priceId -> unitAmount（表示用の円）
const PRICE_MAP = {
  "price_1SlmMwKIaoBhTWZC50foHo6u": 2750, // CD
  "price_1SpMR2KIaoBhTWZChWLVHw3b": 2750, // SOUNDPACK
};

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

function render() {
  const cart = getCart();

  const countEl = document.getElementById("cart-count-top") || document.getElementById("cart-count");
  const listEl  = document.getElementById("cart-list");
  const totalEl = document.getElementById("cart-total");
  const topCount = document.getElementById("cart-count-top"); // ←ヘッダー表示用（任意）

  if (!countEl || !listEl || !totalEl) return;

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
        <div style="opacity:.7; font-size:12px;">${item.kind} / ${item.priceId}</div>
      </div>
      <input type="number" min="1" max="99" value="${item.qty}" style="width:64px;" />
      <button type="button">Remove</button>
    `;

    const qtyInput = row.querySelector("input");
    const rmBtn = row.querySelector("button");

    qtyInput.addEventListener("change", () => setQty(item.priceId, qtyInput.value));
    rmBtn.addEventListener("click", () => removeFromCart(item.priceId));

    listEl.appendChild(row);
  }

  countEl.textContent = String(count);
  totalEl.textContent = yen(total);
  if (topCount) topCount.textContent = String(count); // ←ヘッダーの数を更新
}

document.addEventListener("DOMContentLoaded", () => {
  migrateCartPrices();

  // ====== BAG モーダル制御（ここが重要：外に出す）======
  // ====== BAG モーダル制御（bagModal採用）======
const overlay = document.getElementById("bagOverlay");
const cartModal = document.getElementById("bagModal");
const bagBtn = document.getElementById("bagLink");
const closeBtn = document.getElementById("bagClose");

  function openCart() {
    if (!overlay || !cartModal) return;
    overlay.hidden = false;
    cartModal.setAttribute("aria-hidden", "false");
    cartModal.classList.add("is-open");
    render();
  }

  function closeCart() {
    if (!overlay || !cartModal) return;
    overlay.hidden = true;
    cartModal.setAttribute("aria-hidden", "true");
    cartModal.classList.remove("is-open");
  }

  bagBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    openCart();
  });
  closeBtn?.addEventListener("click", closeCart);
  overlay?.addEventListener("click", closeCart);

  // ====== Add to bag（イベント委譲）======
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-add");
    if (!btn) return;

    const priceId = btn.dataset.priceId;
    const name = btn.dataset.name || "Item";
    const kind = btn.dataset.kind || "digital";

    if (!priceId) {
      alert("priceId が入ってないです（data-price-id）");
      return;
    }

    const unitAmount = Number(btn.dataset.unitAmount || btn.dataset.price || PRICE_MAP[priceId] || 0);

    addToCart({
      priceId,
      name,
      kind,
      unitAmount,
      qty: 1
    });

    // 追加したらカート開きたいならこれ
    // openCart();
  });

  // UI buttons
  document.getElementById("cart-clear")?.addEventListener("click", () => clearCart());
  document.getElementById("cart-checkout")?.addEventListener("click", () => checkout());

  render();
  window.addEventListener("cart:updated", render);
});