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
