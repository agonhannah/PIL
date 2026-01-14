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
  if (idx >= 0) cart[idx].qty += item.qty;
  else cart.push(item);
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
export async function checkout() {
  const cart = loadCart();
  if (!cart.length) {
    alert("カートが空です");
    return;
  }

  // 住所が必要か（physicalが1つでもあればtrue）
  const needsShipping = cart.some(x => x.kind === "physical");

  const res = await fetch("https://YOUR-WORKER-URL.example.workers.dev/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: cart.map(x => ({ priceId: x.priceId, quantity: x.qty })),
      needsShipping
    })
  });

  if (!res.ok) {
    const txt = await res.text();
    alert("Checkout作成に失敗: " + txt);
    return;
  }

  const data = await res.json();
  if (!data.url) {
    alert("Checkout URLが返ってきませんでした");
    return;
  }

  // Stripeへ飛ぶ
  window.location.href = data.url;
}