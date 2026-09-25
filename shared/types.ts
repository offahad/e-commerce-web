export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
}

export enum UserStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum PermissionCode {
  USER_VIEW = 'USER_VIEW',
  USER_APPROVE = 'USER_APPROVE',
  USER_BLOCK = 'USER_BLOCK',
  USER_DELETE = 'USER_DELETE',
  PRODUCT_CREATE = 'PRODUCT_CREATE',
  PRODUCT_UPDATE = 'PRODUCT_UPDATE',
  PRODUCT_DELETE = 'PRODUCT_DELETE',
  PRODUCT_VIEW = 'PRODUCT_VIEW',
  ORDER_VIEW = 'ORDER_VIEW',
  ORDER_UPDATE = 'ORDER_UPDATE',
  ORDER_CANCEL = 'ORDER_CANCEL',
  INVENTORY_MANAGE = 'INVENTORY_MANAGE',
  DISCOUNT_MANAGE = 'DISCOUNT_MANAGE',
  REPORT_VIEW = 'REPORT_VIEW',
  SETTINGS_MANAGE = 'SETTINGS_MANAGE',
}

export enum AddressType {
  HOME = 'HOME',
  OFFICE = 'OFFICE',
  OTHER = 'OTHER',
}

export enum CouponDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
}

export enum FlashDealStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DISABLED = 'DISABLED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  COD = 'COD',
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  ROCKET = 'ROCKET',
  CARD = 'CARD',
}

export interface OrderItemDto {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  imageUrl?: string | null;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  trackingNumber: string;
  userId: string;
  customerName?: string;
  customerPhone?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discountAmount: number;
  couponCode?: string | null;
  deliveryFee: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;
  shippingAddressSnapshot: any;
  customerNotes?: string | null;
  adminNotes?: string | null;
  deliverySlot?: string | null;
  deliveryDate?: string | null;
  cancelledReason?: string | null;
  items?: OrderItemDto[];
  statusHistory?: any[];
  payments?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderTrackingDto {
  orderNumber: string;
  trackingNumber: string;
  status: OrderStatus;
  statusLabel: string;
  paymentMethod?: string;
  paymentStatus?: string;
  grandTotal?: number;
  currency?: string;
  estimatedDeliveryDate?: string | null;
  deliverySlot?: string | null;
  deliveryAddress?: any;
  statusHistory?: any[];
  timeline: {
    status: OrderStatus;
    title: string;
    description: string;
    completed: boolean;
    timestamp?: string | null;
  }[];
}

export interface CartItemDto {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  totalPrice: number;
  savings: number;
  availableStock: number;
  isOutOfStock: boolean;
  imageUrl?: string | null;
}

export interface CartSummaryDto {
  items: CartItemDto[];
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
  totalSavings: number;
  hasOutOfStockItems: boolean;
}

export interface CheckoutPreviewDto {
  items: CartItemDto[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string | null;
  deliveryFee: number;
  taxAmount: number;
  grandTotal: number;
  estimatedDeliveryDate?: string;
  currency: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
