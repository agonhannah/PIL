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
    // 既存カートに unitAmount が無い/0 のものだけ補完
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

  const countEl = document.getElementById("cart-count");
  const listEl  = document.getElementById("cart-list");
  const totalEl = document.getElementById("cart-total");

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

    qtyInput.addEventListener("change", () => {
      setQty(item.priceId, qtyInput.value);
    });

    rmBtn.addEventListener("click", () => {
      removeFromCart(item.priceId);
    });

    listEl.appendChild(row);
  }

  countEl.textContent = String(count);
  totalEl.textContent = yen(total);
}

document.addEventListener("DOMContentLoaded", () => {
  // 既存localStorageカートの unitAmount を補完（Total ¥0 対策）
  migrateCartPrices();

  // Add to bag（イベント委譲でOK）
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

    // 表示用。今回のTotal表示に必要
    const unitAmount = Number(btn.dataset.unitAmount || btn.dataset.price || PRICE_MAP[priceId] || 0);

    addToCart({
      priceId,
      name,
      kind,
      unitAmount,
      qty: 1
    });
  });

  // UI buttons
  document.getElementById("cart-clear")?.addEventListener("click", () => clearCart());
  document.getElementById("cart-checkout")?.addEventListener("click", () => checkout());

  // 初回描画 + 更新監視
  render();
  window.addEventListener("cart:updated", render);
});