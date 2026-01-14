// assets/cart-init.js
import { addToCart, getCart, clearCart, removeFromCart, setQty, checkout } from "./cart.js";

function yen(n) {
  return "¥" + Number(n || 0).toLocaleString("ja-JP");
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
  // Add buttons
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

    // unitAmountは表示用。StripeにはpriceId+quantityを送るので、無くてもOK。
    // ただ、合計表示が欲しいなら unitAmount を入れる。
    const unitAmount = Number(btn.dataset.unitAmount || btn.dataset.price || 0);

    addToCart({
      priceId,
      name,
      kind,
      unitAmount, // 表示用（¥）
      qty: 1
    });
  });

  // UI buttons
  const clearBtn = document.getElementById("cart-clear");
  const checkoutBtn = document.getElementById("cart-checkout");

  clearBtn?.addEventListener("click", () => clearCart());
  checkoutBtn?.addEventListener("click", () => checkout());

  // 初回描画 + 更新監視
  render();
  window.addEventListener("cart:updated", render);
});