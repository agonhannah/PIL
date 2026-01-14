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

  const listEl  = document.getElementById("cart-list");
  const totalEl = document.getElementById("cart-total");

  // カウント表示（複数箇所あってOK）
  const countEls = [
    document.getElementById("cart-count-top"),    // 今のtopbar
    document.getElementById("cart-count"),        // 予備
    document.getElementById("cart-count-drawer"), // 将来使うなら
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

  totalEl.textContent = yen(total);
  countEls.forEach((el) => (el.textContent = String(count)));
}

/**
 * Bag modal controller
 * - 重要：URLのhashは変えない（商品 :target を維持するため）
 * - history.pushState を使って「Close = back」を実現
 */
function setupBagModal() {
  const overlay  = document.getElementById("bagOverlay");
  const modal    = document.getElementById("bagModal");
  const closeBtn = document.getElementById("bagClose");
  const bagLinkTop = document.getElementById("bagLink");

  // Bagを開く直前のhashを保持（フォールバック用）
  let prevHash = location.hash || "";

  function openBag(e) {
    if (e) e.preventDefault();
    if (!overlay || !modal) return;

    // 直前のhash（商品ページなど）を保存
    prevHash = location.hash || "";

    // 履歴に「#bag」を積む（戻り先hashもstateに入れる）
    history.pushState({ bag: true, fromHash: prevHash }, "", "#bag");

    // 表示
    overlay.hidden = false;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("is-open");
    render();
  }

  function closeBag() {
    // 「Bagを開いた時の戻り先」を最優先で使う
    const st = history.state;
    const from = (st && st.bag) ? (st.fromHash || "") : prevHash;

    // ★ここが肝：backに頼らず、URLを「元のhash」に戻してBagを閉じる
    //（replaceStateなので履歴は増えない）
    history.replaceState(null, "", from || "#");

    // 表示同期（#bag じゃなくなるので閉じる）
    syncBagByUrl();
  }

  function syncBagByUrl() {
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

  // クリックで開く
  bagLinkTop?.addEventListener("click", openBag);

  // close / overlay
  closeBtn?.addEventListener("click", closeBag);
  overlay?.addEventListener("click", closeBag);

  // ブラウザBackで #bag が外れたら閉じる / #bag に来たら開く
  window.addEventListener("popstate", syncBagByUrl);
  window.addEventListener("hashchange", syncBagByUrl);

  // 初期同期（直リンクで #bag のときもOK）
  syncBagByUrl();

  // Esc
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && location.hash === "#bag") closeBag();
  });
}

function setupAddToCart(openBag) {
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

    const unitAmount = Number(
      btn.dataset.unitAmount || btn.dataset.price || PRICE_MAP[priceId] || 0
    );

    addToCart({
      priceId,
      name,
      kind,
      unitAmount,
      qty: 1,
    });

    // 追加した瞬間にBagを開きたい場合はON
    // openBag?.();
  });
}

function setupCartUIButtons() {
  document.getElementById("cart-clear")?.addEventListener("click", () => clearCart());
  document.getElementById("cart-checkout")?.addEventListener("click", () => checkout());
}

document.addEventListener("DOMContentLoaded", () => {
  migrateCartPrices();

  const { openBag } = setupBagModal();
  setupAddToCart(openBag);
  setupCartUIButtons();

  render();
  window.addEventListener("cart:updated", render);
});