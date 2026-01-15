// assets/cart-init.js
if (window.__cartInitLoaded) {
  console.warn("[cart-init] already loaded, skip");
} else {
  window.__cartInitLoaded = true;

  import { addToCart, getCart, clearCart, removeFromCart, setQty, checkout } from "./cart.js";

  const CART_KEY = "paradiceloner_cart_v1";

  function yen(n) {
    return "¥" + Number(n || 0).toLocaleString("ja-JP");
  }

  const PRICE_MAP = {
    "price_1SlmMwKIaoBhTWZC50foHo6u": 2750,
    "price_1SpMR2KIaoBhTWZChWLVHw3b": 2750,
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
    const listEl = document.getElementById("cart-list");
    const subtotalEl = document.getElementById("cart-subtotal");

    // ★ここは querySelector より「id固定」にすると事故が減る
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
    if (summaryEl) summaryEl.hidden = isEmpty; // 小計+BUY+Close を消す
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
      const qty = Number(item.qty || 0);
      const unit = Number(item.unitAmount || 0);

      subtotal += unit * qty;
      count += qty;

      const row = document.createElement("div");
      row.className = "cart-row";
      row.innerHTML = `
        <div class="cart-left">
          <div class="cart-thumb">
            ${item.img ? `<img src="${item.img}" alt="" loading="lazy" decoding="async">` : ``}
          </div>
          <div class="cart-meta">
            <div class="cart-name">${item.name || ""}</div>
            <div class="cart-sub">${item.kind || ""}</div>
          </div>
        </div>

        <div class="cart-right">
          <div class="cart-price">${yen(unit)}</div>

          <div class="cart-qtybox">
            <div class="cart-qtylabel">数量</div>
            <input class="cart-qty" type="number" min="1" max="99" value="${Math.max(1, qty)}" inputmode="numeric" />
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
      if (e) e.preventDefault();
      prevHash = location.hash || "";

      overlay.hidden = false;
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      modal.classList.add("is-open");
      openFlag = true;

      render();
    }

    function closeBag() {
      overlay.hidden = true;
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      modal.classList.remove("is-open");
      openFlag = false;

      if (prevHash !== (location.hash || "")) {
        location.hash = prevHash || "";
      }
    }

    bagLinkTop?.addEventListener("click", openBag);
    closeBtn?.addEventListener("click", closeBag);
    overlay?.addEventListener("click", closeBag);

    window.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && openFlag) closeBag();
    });

    window.__bag = { open: openBag, close: closeBag, isOpen: () => openFlag };
    return { openBag, closeBag, isOpen: () => openFlag };
  }

  function setupAddToCart(openBag) {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-add");
      if (!btn) return;

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

      addToCart({ priceId, name, kind, img, unitAmount, qty: 1 });
      openBag?.();
    });
  }

  function setupCartUIButtons() {
    document.getElementById("cart-checkout")?.addEventListener("click", () => checkout());
  }

  document.addEventListener("DOMContentLoaded", () => {
    try {
      migrateCartPrices();

      const bag = setupBagModal();
      setupAddToCart(bag.openBag);
      setupCartUIButtons();

      render();
      window.addEventListener("cart:updated", render);
    } catch (err) {
      console.error("[cart-init] fatal:", err);
      alert("cart-init.js が途中で死んでます。Console を見てください。");
    }
  });
}