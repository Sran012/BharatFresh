// ponytail: self-check — assumes server running on localhost:4000
// Run: npm run dev (in one terminal), then npx tsx src/scripts/test.ts

const BASE = process.env.API_URL ?? "http://localhost:4000/api";

let sellerToken = "";
let buyerToken = "";
let buyerId = "";
let sellerId = "";
let productId = "";
let inventoryItemId = "";
let cartItemId = "";
let marketRequestId = "";
let requestItemId = "";
let assignmentId = "";

const post = async (path: string, body: Record<string, unknown>, token?: string) => {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers: h, body: JSON.stringify(body) });
  const data = await res.json();
  return { status: res.status, ...data };
};

const get = async (path: string, token?: string) => {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: "GET", headers: h });
  const data = await res.json();
  return { status: res.status, ...data };
};

const put = async (path: string, body: Record<string, unknown>, token?: string) => {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: "PUT", headers: h, body: JSON.stringify(body) });
  const data = await res.json();
  return { status: res.status, ...data };
};

const del = async (path: string, token?: string) => {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: "DELETE", headers: h });
  const data = await res.json();
  return { status: res.status, ...data };
};

const assert = (condition: boolean, msg: string) => {
  if (!condition) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`  OK: ${msg}`);
};

const run = async () => {
  console.log("=== BharatFresh API self-check ===\n");

  // --- Auth: seller ---
  console.log("1. Seller send OTP");
  const sOtp = await post("/auth/send-otp", { phone: "+919999999999" });
  assert(sOtp.success, "seller OTP sent");

  console.log("2. Seller verify OTP");
  const sVerify = await post("/auth/verify-otp", { phone: "+919999999999", code: "111111" });
  assert(sVerify.success, "seller OTP verified");
  sellerToken = sVerify.data.token;
  sellerId = sVerify.data.user.id;

  console.log("3. Seller register");
  const sReg = await post("/auth/register", { name: "Test Seller", role: "seller", shopName: "Fresh Shop", serviceLat: 28.6139, serviceLng: 77.2090, serviceRadiusKm: 10 }, sellerToken);
  assert(sReg.success, "seller registered");

  // --- Auth: buyer ---
  console.log("4. Buyer send OTP");
  const bOtp = await post("/auth/send-otp", { phone: "+918888888888" });
  assert(bOtp.success, "buyer OTP sent");

  console.log("5. Buyer verify OTP");
  const bVerify = await post("/auth/verify-otp", { phone: "+918888888888", code: "111111" });
  assert(bVerify.success, "buyer OTP verified");
  buyerToken = bVerify.data.token;
  buyerId = bVerify.data.user.id;

  console.log("6. Buyer register");
  const bReg = await post("/auth/register", { name: "Test Buyer", role: "buyer" }, buyerToken);
  assert(bReg.success, "buyer registered");

  // --- Products ---
  console.log("7. List products");
  const allProducts = await get("/products");
  assert(allProducts.success, `products listed (${allProducts.data.length} found)`);
  productId = allProducts.data[0].id;

  console.log("7b. Search products");
  const products = await get("/products/search");
  assert(products.success, "products search works");

  // --- Seller inventory ---
  console.log("8. Seller add inventory");
  const inv = await post("/seller/inventory", { productId, price: 30, stockQty: 100, unit: "kg" }, sellerToken);
  assert(inv.success, "inventory added");
  inventoryItemId = inv.data.id;

  console.log("9. Product detail");
  const detail = await get(`/products/${productId}`);
  assert(detail.success, "product detail fetched");

  // --- Buyer flow ---
  console.log("10. Buyer add to cart");
  const cart = await post("/cart/items", { productId, quantity: 5, unit: "kg", buyerLat: 28.62, buyerLng: 77.21 }, buyerToken);
  assert(cart.success, "cart item added");
  cartItemId = cart.data.id;

  console.log("11. Buyer list cart");
  const cartList = await get("/cart", buyerToken);
  assert(cartList.success && cartList.data.length === 1, "cart has 1 item");

  // --- Checkout ---
  console.log("12. Buyer checkout");
  const checkout = await post("/orders/checkout", {}, buyerToken);
  assert(checkout.success, `checkout created (${checkout.data.itemCount} items)`);
  marketRequestId = checkout.data.marketRequestId;

  console.log("13. Cart empty after checkout");
  const cartAfter = await get("/cart", buyerToken);
  assert(cartAfter.success && cartAfter.data.length === 0, "cart is empty");

  // --- Seller requests ---
  console.log("14. Seller view requests");
  const requests = await get("/seller/requests", sellerToken);
  assert(requests.success, `seller sees ${requests.data.length} requests`);
  if (requests.data.length > 0) {
    requestItemId = requests.data[0].requestItemId;
  }

  console.log("15. Seller accept request");
  const accept = await post(`/seller/requests/${requestItemId}/accept`, {}, sellerToken);
  assert(accept.success, "request accepted");
  assignmentId = accept.data.id;

  // --- Orders ---
  console.log("16. Buyer orders");
  const buyerOrders = await get("/orders/buyer", buyerToken);
  assert(buyerOrders.success, `buyer has ${buyerOrders.data.length} orders`);

  console.log("17. Seller orders");
  const sellerOrders = await get("/orders/seller", sellerToken);
  assert(sellerOrders.success, `seller has ${sellerOrders.data.length} orders`);

  console.log("18. Order detail");
  const orderDetail = await get(`/orders/${assignmentId}`, sellerToken);
  assert(orderDetail.success, "order detail fetched");

  console.log("19. Update order status");
  const statusUpdate = await put(`/orders/${assignmentId}/status`, { status: "preparing" }, sellerToken);
  assert(statusUpdate.success, "status updated to preparing");

  console.log("20. Notifications");
  const notifs = await get("/notifications", buyerToken);
  assert(notifs.success, `buyer has ${notifs.data.length} notifications`);

  console.log("\n=== All checks passed ===");
};

run().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
