// assets/cart-init.js
import { addToCart, removeFromCart, setQty, clearCart, getCart, checkout } from "./cart.js";

const yen = (n) => "¥" + Number(n || 0).toLocaleString("ja-JP");

function renderCart() {
  const cart = getCart();

  const countEl = document.getElementById("cart-count");
  const listEl  = document.getElementById("cart-list");
  const totalEl = document.getElementById("cart-total");

  if (!countEl || !listEl || !totalEl) return;

  const count = cart.reduce((s, x) => s + (x.qty || 0), 0);
  const total = cart.reduce((s, x) => s + (x.unitAmount || 0) * (x.qty || 0), 0);

  countEl.textContent = String(count);
  totalEl.textContent = yen(total);

  listEl.innerHTML = "";

  if (!cart.length) {
    listEl.innerHTML = `<div style="opacity:.7; font-size:12px;">カートは空です</div>`;
    return;
  }

  for (const item of cart) {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "1fr auto auto";
    row.style.gap = "10px";
    row.style.alignItems = "center";
    row.style.marginTop = "10px";

    row.innerHTML = `
      <div>
        <div style="font-size:13px;">${escapeHtml(item.name || "")}</div>
        <div style="opacity:.7; font-size:12px;">${yen(item.unitAmount)} × </div>
      </div>

      <input
        type="number"
        min="1"
        max="99"
        value="${item.qty || 1}"
        style="width:70px;"
        data-qty
      />

      <button data-remove style="padding:6px 10px;">Remove</button>
    `;

    row.querySelector("[data-qty]").addEventListener("change", (e) => {
      setQty(item.priceId, Number(e.target.value));
    });

    row.querySelector("[data-remove]").addEventListener("click", () => {
      removeFromCart(item.priceId);
    });

    listEl.appendChild(row);
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// クリックでカート追加
function bindAddButtons() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-add");
    if (!btn) return;

    const priceId = btn.dataset.priceId;
    if (!priceId) {
      alert("この商品に priceId（StripeのPrice ID）が設定されていません");
      return;
    }

    const name = btn.dataset.name || "Item";
    const kind = btn.dataset.kind || "digital";
    const unitAmount = Number(btn.dataset.price || 0);

    addToCart({
      priceId,
      name,
      kind,
      unitAmount,
      qty: 1,
    });
  });
}

// UIボタン
function bindCartUi() {
  const clearBtn = document.getElementById("cart-clear");
  const checkoutBtn = document.getElementById("cart-checkout");

  if (clearBtn) clearBtn.addEventListener("click", () => clearCart());
  if (checkoutBtn) checkoutBtn.addEventListener("click", () => checkout());
}

// 初期化
bindAddButtons();
bindCartUi();
renderCart();
window.addEventListener("cart:updated", renderCart);