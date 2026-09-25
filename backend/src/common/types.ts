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
