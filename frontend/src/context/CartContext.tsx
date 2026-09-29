import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export interface FavouriteItem {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  regularPrice?: number;
  imageUrl?: string;
  unit?: string;
  variantId?: string;
  slug?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  freeDeliveryRemaining: number;
  grandTotal: number;
  discountAmount: number;
  appliedCoupon: { code: string; discountAmount: number; message?: string } | null;
  isLoading: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (variantId: string, quantity?: number, itemMetadata?: any) => Promise<{ success: boolean; message?: string }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>;
  removeCoupon: () => void;
  favouriteItems: FavouriteItem[];
  isFavouritesOpen: boolean;
  openFavourites: () => void;
  closeFavourites: () => void;
  toggleFavourite: (itemOrId: any) => void;
  isFavourite: (id: string) => boolean;
  wishlistIds: Set<string>;
  toggleWishlist: (productId: string, itemMeta?: any) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
  activeOrderTracking: string | null;
  trackOrderNumber: (trackingNumber: string) => void;
  closeTrackingModal: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeOrderTracking, setActiveOrderTracking] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; message?: string } | null>(null);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [isFavouritesOpen, setIsFavouritesOpen] = useState(false);
  const [favouriteItems, setFavouriteItems] = useState<FavouriteItem[]>(() => {
    try {
      const saved = localStorage.getItem('lb_favourite_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to read favourites', e);
    }
    return [
      {
        id: 'frt-1',
        name: 'Italian Avocado',
        price: 350,
        regularPrice: 380,
        unit: '1 pc',
        imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-frt-1',
        slug: 'italian-avocado',
      },
      {
        id: 'veg-1',
        name: 'Fresh Beetroot',
        price: 80,
        regularPrice: 95,
        unit: '500g',
        imageUrl: 'https://images.unsplash.com/photo-1588615419957-4627dff1645e?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-veg-1',
        slug: 'fresh-beetroot',
      },
    ];
  });

  const freeDeliveryThreshold = 1000;
  const standardDeliveryFee = 60;

  const loadCart = async () => {
    try {
      const res = await api.getCart();
      if (res.success && res.data) {
        setCartItems(res.data.items || []);
      }
    } catch (err) {
      console.error('Error loading cart', err);
    }
  };

  const loadWishlist = async () => {
    if (!user) return;
    try {
      const res = await api.getWishlist();
      if (res.success && Array.isArray(res.data)) {
        const ids = new Set(res.data.map((item: any) => item.product_id || item.productId));
        setWishlistIds(ids);
      }
    } catch {
      // Ignore if guest
    }
  };

  useEffect(() => {
    loadCart();
    loadWishlist();
  }, [user]);

  const addToCart = async (variantId: string, quantity = 1, itemMetadata?: any) => {
    setIsLoading(true);

    // Optimistically update local cart immediately with 0ms UI lag
    setCartItems((prev) => {
      const existing = prev.find(
        (i) =>
          (variantId && i.variantId === variantId) ||
          (itemMetadata?.name && i.name && i.name.toLowerCase().trim() === itemMetadata.name.toLowerCase().trim()) ||
          (itemMetadata?.id && i.productId === itemMetadata.id)
      );
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      const newItem: CartItem = {
        id: 'cart-item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        variantId,
        productId: itemMetadata?.productId || itemMetadata?.id || variantId,
        name: itemMetadata?.name || 'Fresh Grocery Item',
        variantName: itemMetadata?.unit || itemMetadata?.unitSubtitle || itemMetadata?.variantName || '1 pack',
        quantity,
        unitPrice: itemMetadata?.price || itemMetadata?.salePrice || 100,
        salePrice: itemMetadata?.price || itemMetadata?.salePrice || 100,
        basePrice: itemMetadata?.regularPrice || itemMetadata?.basePrice || 120,
        thumbnailUrl: itemMetadata?.imageUrl || itemMetadata?.thumbnailUrl || '',
        stockQuantity: 100,
      };
      return [...prev, newItem];
    });

    try {
      const res = await api.addToCart(variantId, quantity);
      if (res.success) {
        await loadCart();
      }
      return { success: true };
    } catch (err: any) {
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeItem(itemId);
        return;
      }
      setCartItems((prev) =>
        prev.map((i) => (i.id === itemId || i.variantId === itemId ? { ...i, quantity } : i))
      );
      await api.updateCartItem(itemId, quantity).catch(() => {});
      await loadCart().catch(() => {});
    } catch (err) {
      console.error('Failed to update quantity', err);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setCartItems((prev) => prev.filter((i) => i.id !== itemId && i.variantId !== itemId));
      await api.removeCartItem(itemId).catch(() => {});
      await loadCart().catch(() => {});
    } catch (err) {
      console.error('Failed to remove cart item', err);
    }
  };

  const clearCart = async () => {
    try {
      await api.clearCart();
      setCartItems([]);
      setAppliedCoupon(null);
    } catch (err) {
      console.error('Failed to clear cart', err);
    }
  };

  const applyCoupon = async (code: string) => {
    try {
      const res = await api.validateCoupon(code, subtotal, deliveryFee);
      if (res.success && res.data) {
        setAppliedCoupon({
          code: res.data.code,
          discountAmount: res.data.discountAmount,
          message: res.message,
        });
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Invalid coupon' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to apply coupon' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const openFavourites = () => setIsFavouritesOpen(true);
  const closeFavourites = () => setIsFavouritesOpen(false);

  const toggleFavourite = (itemOrId: any) => {
    const id = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id;
    if (!id) return;

    setFavouriteItems((prev) => {
      const matchIndex = prev.findIndex(
        (f) =>
          f.id === id ||
          (itemOrId.name && f.name.toLowerCase().trim() === itemOrId.name.toLowerCase().trim())
      );
      let updated: FavouriteItem[];
      if (matchIndex >= 0) {
        updated = prev.filter((_, idx) => idx !== matchIndex);
      } else {
        const newItem: FavouriteItem = {
          id: id,
          name: itemOrId.name || 'Grocery Item',
          price: Number(itemOrId.price || itemOrId.salePrice || itemOrId.basePrice || 100),
          regularPrice: itemOrId.regularPrice ? Number(itemOrId.regularPrice) : undefined,
          imageUrl:
            itemOrId.imageUrl ||
            itemOrId.thumbnailUrl ||
            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
          unit: itemOrId.unit || itemOrId.unitSubtitle || '1 Pack',
          variantId: itemOrId.variantId || (itemOrId.variants && itemOrId.variants[0]?.id) || 'v-' + id,
          slug: itemOrId.slug || 'product-' + id,
        };
        updated = [newItem, ...prev];
      }
      try {
        localStorage.setItem('lb_favourite_items', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (user) {
      api.toggleWishlist(id).catch(() => {});
    }
  };

  const isFavourite = (id: string) => {
    return favouriteItems.some((f) => f.id === id);
  };

  const toggleWishlist = async (productId: string, itemMeta?: any) => {
    toggleFavourite(itemMeta || { id: productId });
  };

  const isWishlisted = (productId: string) => {
    return isFavourite(productId) || wishlistIds.has(productId);
  };

  // Computed totals
  const subtotal = cartItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const deliveryFee = subtotal >= freeDeliveryThreshold || appliedCoupon?.code === 'FREEDEL'
    ? 0
    : standardDeliveryFee;

  const freeDeliveryRemaining = Math.max(0, freeDeliveryThreshold - subtotal);
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const openCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };
  const closeCheckout = () => setIsCheckoutOpen(false);

  const trackOrderNumber = (trackingNumber: string) => {
    setActiveOrderTracking(trackingNumber);
  };
  const closeTrackingModal = () => {
    setActiveOrderTracking(null);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        itemCount,
        subtotal,
        deliveryFee,
        freeDeliveryThreshold,
        freeDeliveryRemaining,
        grandTotal,
        discountAmount,
        appliedCoupon,
        isLoading,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        favouriteItems,
        isFavouritesOpen,
        openFavourites,
        closeFavourites,
        toggleFavourite,
        isFavourite,
        wishlistIds,
        toggleWishlist,
        isWishlisted,
        isCheckoutOpen,
        openCheckout,
        closeCheckout,
        activeOrderTracking,
        trackOrderNumber,
        closeTrackingModal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
