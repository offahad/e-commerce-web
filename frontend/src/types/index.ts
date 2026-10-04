export interface ProductVariant {
  id: string;
  sku: string;
  displayName: string;
  unit: string;
  packSize?: string;
  weight?: string;
  quantityValue: number;
  basePrice: number;
  salePrice: number;
  price?: number;
  compareAtPrice?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  barcode?: string | null;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  url?: string;
  thumbnailUrl: string;
  isThumbnail: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  basePrice: number;
  salePrice: number;
  discountPrice?: number;
  costPrice?: number;
  discountPercentage?: number;
  discountAmount?: number;
  stockQuantity: number;
  unit: string;
  primaryImage?: string;
  thumbnailUrl?: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  brand?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  } | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  categorySlug?: string;
  itemType?: string;
  itemSlug?: string;
  isDealOfTheDay?: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
  tags: string[];
  maxPerCustomer?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  children?: Category[];
}

export interface FlashDealItem {
  id: string;
  productId: string;
  variantId: string;
  dealPrice: number;
  allocatedStock: number;
  soldStock: number;
  remainingStock: number;
  maxPerCustomer: number;
  productName: string;
  productSlug: string;
  variantName: string;
  regularPrice: number;
  salePrice: number;
  savings: number;
  discountPercentage: number;
  imageUrl?: string;
}

export interface FlashDealCampaign {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerImage?: string;
  startTime: string;
  endTime: string;
  serverTime: string;
  remainingSeconds: number;
  status: string;
  items: FlashDealItem[];
}

export interface CartItem {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  name?: string;
  productSlug?: string;
  variantName: string;
  sku?: string;
  unitPrice: number;
  price?: number;
  salePrice?: number;
  basePrice?: number;
  originalPrice?: number;
  quantity: number;
  lineTotal?: number;
  totalPrice?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  stockQuantity?: number;
  availableStock?: number;
  isOutOfStock?: boolean;
  maxPerCustomer?: number;
  isFlashDeal?: boolean;
}

export interface OrderTimelineStep {
  status: string;
  title: string;
  description: string;
  completed: boolean;
  timestamp?: string | null;
}

export interface OrderStatusHistoryItem {
  status: string;
  comment?: string;
  createdAt: string;
}

export interface OrderTrackingInfo {
  orderNumber: string;
  trackingNumber: string;
  status: string;
  statusLabel: string;
  paymentMethod?: string;
  paymentStatus?: string;
  grandTotal?: number;
  currency?: string;
  estimatedDeliveryDate?: string | null;
  deliverySlot?: string | null;
  deliveryAddress?: {
    name: string;
    phone: string;
    address: string;
    district: string;
    division: string;
  } | null;
  timeline: OrderTimelineStep[];
  statusHistory?: OrderStatusHistoryItem[];
}

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER';
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'BLOCKED' | 'SUSPENDED';
}

export interface CustomerAddress {
  id: string;
  userId: string;
  label: string;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  district: string;
  division: string;
  isDefault: boolean;
}

export interface BusinessSettings {
  shopName: string;
  supportPhone: string;
  supportEmail: string;
  currency: string;
  currencySymbol: string;
  standardDeliveryFee: number;
  freeDeliveryThreshold: number;
  defaultTaxPercentage: number;
}
