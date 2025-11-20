// src/api.js

const BASE_URL = "http://localhost:8080";

/* ----------------------------------
   Low-level helpers
---------------------------------- */
async function requestJson(path, { method = "GET", body, token } = {}) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "*/*",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const err = await res.json();
      msg = JSON.stringify(err);
    } catch {}
    throw new Error(msg);
  }

  // Bəzi endpointlər boş cavab qaytara bilər
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("application/json")) return null;

  return res.json();
}

async function requestFormData(path, { file, token } = {}) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const err = await res.json();
      msg = JSON.stringify(err);
    } catch {}
    throw new Error(msg);
  }

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("application/json")) return null;

  return res.json();
}

// UI üçün şəkil URL helper-i
export const productPhotoUrl = (productId, photoId) =>
  `${BASE_URL}/products/${productId}/photos/${photoId}`;

/* ----------------------------------
   AUTH
---------------------------------- */
export const loginRequest = ({ username, password }) =>
  requestJson("/auth/login", { method: "POST", body: { username, password } });

export const registerRequest = (body) =>
  requestJson("/auth/register", { method: "POST", body });

/* ----------------------------------
   PRODUCTS
---------------------------------- */
export const getProducts = () => requestJson("/products");

export const getProductById = (id) => requestJson(`/products/${id}`);

export const createProduct = (productReq, auth) =>
  requestJson("/products", {
    method: "POST",
    body: productReq,
    token: auth?.token,
  });

export const updateProduct = (productId, productReq, auth) =>
  requestJson(`/products/${productId}`, {
    method: "PUT",
    body: productReq,
    token: auth?.token,
  });

export const deleteProduct = (productId, auth) =>
  requestJson(`/products/${productId}`, {
    method: "DELETE",
    token: auth?.token,
  });

export const uploadProductPhoto = (productId, file, auth) =>
  requestFormData(`/products/${productId}/photos`, { file, token: auth?.token });

/* ----------------------------------
   CATEGORIES
---------------------------------- */
export const getCategories = () => requestJson("/categories");

export const createCategory = (name, auth) =>
  requestJson("/categories", {
    method: "POST",
    body: { name },
    token: auth?.token,
  });

/* ----------------------------------
   WISHLIST (customer)
---------------------------------- */
export const getWishlist = (auth) =>
  requestJson("/wishlist", { token: auth?.token });

export const addToWishlist = (productId, auth) =>
  requestJson("/wishlist", {
    method: "POST",
    body: { productId },
    token: auth?.token,
  });

export const removeFromWishlist = (productId, auth) =>
  requestJson(`/wishlist/${productId}`, {
    method: "DELETE",
    token: auth?.token,
  });

/* ----------------------------------
   CART (customer)
---------------------------------- */
export const getCart = (auth) =>
  requestJson("/cart", { token: auth?.token });

export const addToCart = (productId, count, auth) =>
  requestJson("/cart/items", {
    method: "POST",
    body: { productId, count },
    token: auth?.token,
  });

export const deleteCartItem = (itemId, auth) =>
  requestJson(`/cart/items/${itemId}`, {
    method: "DELETE",
    token: auth?.token,
  });

/* ----------------------------------
   ORDERS
---------------------------------- */
// customer: checkout (cart -> orders)
export const createOrders = (auth) =>
  requestJson("/orders", { method: "POST", token: auth?.token });

// customer: list own
export const getOrders = (auth) =>
  requestJson("/orders", { token: auth?.token });

// merchant: list visible
export const getMerchantOrders = (auth) =>
  requestJson("/merchant/orders", { token: auth?.token });

// merchant: update status
export async function updateOrderStatus(orderId, body, auth) {
  const send = (method) =>
    requestJson(`/merchant/orders/${orderId}/status`, {
      method,
      body,
      token: auth?.token,
    });

  try {
    return await send("PATCH");
  } catch (e) {
    const msg = String(e?.message || "");
    const methodBlocked = msg.includes("No static resource") || msg.includes("405") || msg.includes("404");
    const networkFailed = e instanceof TypeError || msg.includes("Failed to fetch") || msg.includes("NetworkError");

    if (methodBlocked || networkFailed) {
      return await send("POST");
    }
    throw e;
  }
}

// customer: cancel own (REJECT_BY_CUSTOMER with reason)
// PATCH əsas, POST fallback (bəzi mühitlərdə/proxylərdə PATCH ilişə bilər)
export async function cancelOrder(orderId, reason, auth) {
  const send = (method) =>
    requestJson(`/orders/${orderId}/cancel`, {
      method,
      body: { reason },
      token: auth?.token,
    });

  try {
    return await send("PATCH");
  } catch (e) {
    const msg = String(e?.message || "");
    const methodBlocked = msg.includes("No static resource") || msg.includes("405") || msg.includes("404");
    const networkFailed = e instanceof TypeError || msg.includes("Failed to fetch") || msg.includes("NetworkError");

    if (methodBlocked || networkFailed) {
      return await send("POST");
    }
    throw e;
  }
}

// -- Paged products (server-side). Fallback: düz array gələrsə content=resp olacaq
export async function getProductsPaged({
  page = 0,
  size = 9,
  search = "",
  categoryId = "",
  sort = "createdAt,DESC", // backend varsa: field,DIR
} = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("size", size);
  if (search) params.set("search", search);
  if (categoryId) params.set("categoryId", categoryId);
  if (sort) params.set("sort", sort);

  // mövcud requestJson-dan istifadə edirik
  const resp = await requestJson(`/products?${params.toString()}`, { method: "GET" });

  // Spring Page və ya düz array ola bilər
  if (Array.isArray(resp)) {
    return {
      content: resp,
      number: page,
      size,
      totalElements: resp.length,
      totalPages: resp.length < size ? page + 1 : page + 2, // təxmini
      last: resp.length < size,
    };
  }
  return resp; // {content, totalElements, totalPages, number, size, last...}
}
