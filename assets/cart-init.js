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
    document.getElementById("cart-count-top"),
    document.getElementById("cart-count"),
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
 * - URL(hash)は変えない（商品 :target を維持）
 * - history.pushState で Close/back を成立させる（URLは同じまま）
 * - Drawer/Shopが開いていたかは「イベント」で通知（script.js側で復元）
 */
function setupBagModal() {
  const overlay    = document.getElementById("bagOverlay");
  const modal      = document.getElementById("bagModal");
  const closeBtn   = document.getElementById("bagClose");
  const bagLinkTop = document.getElementById("bagLink");

  if (!overlay || !modal) {
    // DOMが無いなら何もしない
    return { openBag: () => {}, closeBag: () => {}, isOpen: () => false };
  }

  let isOpenFlag = false;

  // “どこからBagを開いたか” を保存（script.jsで使うなら）
  let lastContext = null;

  function show() {
    overlay.hidden = false;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("is-open");
    isOpenFlag = true;
    render();
  }

  function hide() {
    overlay.hidden = true;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    modal.classList.remove("is-open");
    isOpenFlag = false;

    // Bag閉じたあと「元のUIに戻してね」を通知
    window.dispatchEvent(
      new CustomEvent("bag:closed", { detail: { context: lastContext } })
    );
  }

  function detectContext() {
    // hashは変えないので、最低限だけ取る
    // 例：商品ページなら "#session-collection" が入ってる
    const hash = location.hash || "";

    // shop modal / drawer は script.js 管轄なので、
    // ここでは「たぶん開いてる」を推測せず、通知だけ出す
    return {
      hash,
      // 追加で何か識別したいなら、ここに入れていく
      ts: Date.now(),
    };
  }

  function openBag(e) {
    if (e) e.preventDefault();

    // すでに開いてたら何もしない
    if (isOpenFlag) {
      show();
      return;
    }

    // 開く直前の状態（復帰用ヒント）
    lastContext = detectContext();

    // ★URLは変えずに履歴だけ1個積む（重要）
    history.pushState({ bag: true }, "", location.href);

    // 開く
    show();

    // Bagを開いた通知（必要ならscript.jsが受け取れる）
    window.dispatchEvent(
      new CustomEvent("bag:opened", { detail: { context: lastContext } })
    );
  }

  function closeBag() {
    // “back” が成功する環境ならそれで閉じる
    // popstate で hide() が走るのでここでは何もしない
    if (isOpenFlag) {
      history.back();
    } else {
      hide();
    }
  }

  // Back/Forward で bag state が外れたら閉じる
  window.addEventListener("popstate", () => {
    // Bagを開いてるときに「戻った」なら閉じる
    if (isOpenFlag) hide();
  });

  bagLinkTop?.addEventListener("click", openBag);
  closeBtn?.addEventListener("click", closeBag);
  overlay?.addEventListener("click", closeBag);

  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && isOpenFlag) closeBag();
  });

  return { openBag, closeBag, isOpen: () => isOpenFlag };
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

    addToCart({ priceId, name, kind, unitAmount, qty: 1 });

    // 追加直後にBagを開きたいならON
    // openBag?.();
  });
}

function setupCartUIButtons() {
  document.getElementById("cart-clear")?.addEventListener("click", () => clearCart());
  document.getElementById("cart-checkout")?.addEventListener("click", () => checkout());
}

document.addEventListener("DOMContentLoaded", () => {
  migrateCartPrices();

  const bag = setupBagModal();          // ← 必ず return される
  setupAddToCart(bag.openBag);          // ← ここで死なない
  setupCartUIButtons();

  render();
  window.addEventListener("cart:updated", render);
});