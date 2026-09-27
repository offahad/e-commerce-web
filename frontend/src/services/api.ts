const API_BASE = '/api/v1';

function getSessionId(): string {
  let sid = localStorage.getItem('lb_session_id');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('lb_session_id', sid);
  }
  return sid;
}

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Session-ID': getSessionId(),
    ...customHeaders,
  };

  const token = localStorage.getItem('lb_access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; message?: string }> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: getHeaders(options.headers as Record<string, string>),
  });

  const json = await response.json().catch(() => ({
    success: false,
    message: `Network error (${response.status})`,
  }));

  if (!response.ok && !json.message) {
    json.message = `HTTP Error ${response.status}`;
  }

  return json;
}

export const api = {
  // Public Products & Catalog
  getProducts: (params: Record<string, string | number> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, String(v));
    });
    return request<any[]>(`/products?${query.toString()}`);
  },

  getProductBySlug: (slug: string) => request<any>(`/products/${slug}`),

  getSuggestions: (q: string) => request<any[]>(`/products/suggestions?q=${encodeURIComponent(q)}`),

  getCategories: () => request<any[]>('/categories'),

  getBrands: () => request<any[]>('/brands'),

  getFridayFlashDeal: () => request<any>('/deals/friday-flash'),

  getDealsOfTheDay: () => request<any[]>('/deals/deals-of-the-day'),

  getSettings: () => request<any>('/settings'),

  // Cart & Wishlist
  getCart: () => request<any>('/cart'),

  addToCart: (variantId: string, quantity = 1) =>
    request<any>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ variantId, quantity }),
    }),

  updateCartItem: (itemId: string, quantity: number) =>
    request<any>(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  removeCartItem: (itemId: string) =>
    request<any>(`/cart/items/${itemId}`, {
      method: 'DELETE',
    }),

  clearCart: () =>
    request<any>('/cart', {
      method: 'DELETE',
    }),

  getWishlist: () => request<any[]>('/wishlist'),

  toggleWishlist: (productId: string) =>
    request<any>(`/wishlist/${productId}`, {
      method: 'POST',
    }),

  // Promotions & Checkout Preview
  validateCoupon: (code: string, subtotal: number, deliveryFee = 60) =>
    request<any>('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal, deliveryFee }),
    }),

  previewCheckout: (payload: { items: { variantId: string; quantity: number }[]; couponCode?: string; district?: string }) =>
    request<any>('/checkout/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Orders & Tracking
  placeOrder: (payload: {
    items: { variantId: string; quantity: number }[];
    couponCode?: string;
    paymentMethod: string;
    shippingAddressId?: string;
    deliverySlot?: string;
    customerNotes?: string;
    deliveryAddress?: {
      name: string;
      phone: string;
      address: string;
      district?: string;
      division?: string;
    };
  }) =>
    request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCustomerOrders: () => request<any[]>('/orders'),

  getOrderById: (orderId: string) => request<any>(`/orders/${orderId}`),

  cancelOrder: (orderId: string, reason: string) =>
    request<any>(`/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  trackOrder: (trackingNumber: string) =>
    request<any>(`/orders/track/${encodeURIComponent(trackingNumber)}`),

  // Authentication & Customer
  login: (phone: string, password: string) =>
    request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),

  register: (payload: {
    phone: string;
    fullName: string;
    password: string;
    confirmPassword: string;
    email?: string;
    address?: string;
  }) =>
    request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  checkShoppingEligibility: () => request<any>('/customers/shopping-check'),

  getCustomerAddresses: () => request<any[]>('/customers/addresses'),

  addCustomerAddress: (payload: any) =>
    request<any>('/customers/addresses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  setDefaultAddress: (id: string) =>
    request<any>(`/customers/addresses/${id}/default`, {
      method: 'PATCH',
    }),

  // Admin Endpoints
  getAdminOrders: (params: Record<string, string | number> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, String(v));
    });
    return request<any>(`/admin/orders?${query.toString()}`);
  },

  updateOrderStatus: (orderId: string, status: string, comment?: string) =>
    request<any>(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comment }),
    }),

  updateOrderPayment: (orderId: string, paymentStatus: string, transactionId?: string, comment?: string) =>
    request<any>(`/admin/orders/${orderId}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus, transactionId, comment }),
    }),

  getOrderInvoice: (orderId: string) => request<any>(`/admin/orders/${orderId}/invoice`),

  getAdminCustomers: (status?: string) =>
    request<any[]>(`/admin/customers${status ? `?status=${status}` : ''}`),

  updateCustomerStatus: (userId: string, status: string, reason?: string) =>
    request<any>(`/admin/customers/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }),

  getAdminStockAlerts: () => request<any[]>('/admin/inventory/alerts'),

  adjustInventory: (payload: { variantId: string; transactionType: string; quantity: number; reason: string; referenceId?: string }) =>
    request<any>('/admin/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProductPrice: (productId: string, basePrice: number, salePrice?: number, reason?: string) =>
    request<any>(`/admin/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ basePrice, salePrice, priceChangeReason: reason }),
    }),
};
