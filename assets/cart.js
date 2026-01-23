// assets/cart.js
const CART_KEY = "paradiceloner_cart_v1";

function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
  catch { return []; }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart:updated"));
}

export function addToCart(item) {
  const cart = loadCart();
  const idx = cart.findIndex(x => x.priceId === item.priceId);

  if (idx >= 0) {
    cart[idx].qty += (item.qty || 1);
    // 念のため最新メタも同期
    cart[idx].name = item.name ?? cart[idx].name;
    cart[idx].kind = item.kind ?? cart[idx].kind;
    cart[idx].unitAmount = item.unitAmount ?? cart[idx].unitAmount;
    cart[idx].img = item.img ?? cart[idx].img;
    cart[idx].slug = item.slug ?? cart[idx].slug;
  } else {
    cart.push(item);
  }
  saveCart(cart);
}

export function removeFromCart(priceId) {
  saveCart(loadCart().filter(x => x.priceId !== priceId));
}

export function setQty(priceId, qty) {
  const cart = loadCart();
  const idx = cart.findIndex(x => x.priceId === priceId);
  if (idx < 0) return;
  cart[idx].qty = Math.max(1, Math.min(99, qty|0));
  saveCart(cart);
}

export function clearCart() {
  saveCart([]);
}

export function getCart() {
  return loadCart();
}

// Workerに投げてCheckout Session作成→URLへ遷移
// assets/cart.js（checkoutだけ差し替え）
export async function checkout() {
  const cart = loadCart();
  if (!cart.length) {
    alert("カートが空です");
    return;
  }

  const needsShipping = cart.some(x => x.kind === "physical");

  try {
    const res = await fetch(
      "https://paradiceloner-checkout.xqsmie888888.workers.dev/create-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(x => ({ priceId: x.priceId, quantity: x.qty })),
          needsShipping,
        }),
      }
    );

    const text = await res.text(); // 先に生で取る（JSONじゃないエラーも拾う）
    if (!res.ok) {
      alert("Checkout作成に失敗: " + text);
      return;
    }

    let data;
    try { data = JSON.parse(text); }
    catch {
      alert("Checkout応答がJSONじゃない: " + text);
      return;
    }

    if (!data.url) {
      alert("Checkout URLが返ってきませんでした: " + text);
      return;
    }

    window.location.href = data.url;

  } catch (err) {
    // CORS / ネットワーク / DNS / Safariブロック はここに来る
    alert("決済へ進めません: " + (err?.message || err));
    console.error("[checkout] fetch failed:", err);
  }
}