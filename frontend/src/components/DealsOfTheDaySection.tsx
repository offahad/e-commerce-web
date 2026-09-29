import React, { useState, useEffect } from 'react';
import { Clock, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

interface DealsOfTheDaySectionProps {
  onOpenProduct: (product: any) => void;
}

interface DealItem {
  id: string;
  name: string;
  unitSubtitle: string;
  imageUrl: string;
  discountPercentage: number;
  salePrice: number;
  regularPrice: number;
  soldCount: number;
  totalStock: number;
  isSoldOut?: boolean;
  slug: string;
  variantId?: string;
  rawProduct?: any;
}

const DEFAULT_DEAL_ITEMS: DealItem[] = [
  {
    id: 'deal-1',
    name: 'Fresh Milk',
    unitSubtitle: '1 Ltr',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
    discountPercentage: 18,
    salePrice: 90,
    regularPrice: 110,
    soldCount: 45,
    totalStock: 60,
    isSoldOut: false,
    slug: 'aarong-dairy-pure-liquid-milk',
  },
  {
    id: 'deal-2',
    name: 'Organic Tomatoes',
    unitSubtitle: '500 gm',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    discountPercentage: 27,
    salePrice: 48,
    regularPrice: 65,
    soldCount: 50,
    totalStock: 50,
    isSoldOut: true, // Matching Screenshot 2: Sold Out
    slug: 'fresh-organic-tomatoes',
  },
  {
    id: 'deal-3',
    name: 'Fresh Oranges',
    unitSubtitle: '1 kg',
    imageUrl: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=600&q=80',
    discountPercentage: 20,
    salePrice: 220,
    regularPrice: 275,
    soldCount: 32,
    totalStock: 80,
    isSoldOut: false,
    slug: 'fresh-sweet-oranges',
  },
  {
    id: 'deal-4',
    name: 'Teer Pure Soybean Oil',
    unitSubtitle: '1 Ltr',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
    discountPercentage: 15,
    salePrice: 175,
    regularPrice: 205,
    soldCount: 68,
    totalStock: 100,
    isSoldOut: false,
    slug: 'teer-pure-soybean-oil',
  },
];

export const DealsOfTheDaySection: React.FC<DealsOfTheDaySectionProps> = ({ onOpenProduct }) => {
  const { t } = useLanguage();
  const { cartItems, addToCart, updateQuantity, removeItem } = useCart();
  const [items, setItems] = useState<DealItem[]>(DEFAULT_DEAL_ITEMS);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 58, seconds: 3 });

  // Ticking countdown timer matching Screenshot 2
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync with API deals if available
  useEffect(() => {
    const loadApiDeals = async () => {
      try {
        const res = await api.getDealsOfTheDay();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: DealItem[] = res.data.map((p: any, idx: number) => ({
            id: p.productId || p.id,
            name: p.productName || p.name,
            unitSubtitle: p.variantName || p.variants?.[0]?.displayName || p.unit || '1 Pack',
            imageUrl: p.imageUrl || p.thumbnailUrl || p.images?.[0] || DEFAULT_DEAL_ITEMS[idx % DEFAULT_DEAL_ITEMS.length].imageUrl,
            discountPercentage: Math.round(p.discountPercentage || 15),
            salePrice: p.salePrice || p.basePrice || 100,
            regularPrice: p.originalPrice || p.basePrice || 120,
            soldCount: idx === 1 ? 50 : 25 + idx * 8,
            totalStock: idx === 1 ? 50 : 60 + idx * 10,
            isSoldOut: idx === 1 || p.stockQuantity === 0,
            slug: p.productSlug || p.slug,
            variantId: p.variantId || p.variants?.[0]?.id,
            rawProduct: p,
          }));
          setItems(mapped);
        }
      } catch (err) {
        console.error('Failed to sync api deals', err);
      }
    };
    loadApiDeals();
  }, []);

  // Helper to get active cart quantity & cart item ID for a deal item
  const getCartInfo = (dealItem: DealItem) => {
    const ci = cartItems.find((c) => {
      if (dealItem.variantId && c.variantId === dealItem.variantId) return true;
      if (dealItem.id && c.productId === dealItem.id) return true;
      if (dealItem.name && c.name && c.name.toLowerCase().trim() === dealItem.name.toLowerCase().trim()) return true;
      return false;
    });
    return ci ? { qty: ci.quantity, cartItemId: ci.id } : { qty: 0, cartItemId: null };
  };

  const handleAdd = async (item: DealItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.isSoldOut) return;
    if (item.variantId) {
      await addToCart(item.variantId, 1);
    } else if (item.rawProduct?.variants?.[0]?.id) {
      await addToCart(item.rawProduct.variants[0].id, 1);
    } else {
      onOpenProduct(item.rawProduct || item);
    }
  };

  const handleIncrement = async (item: DealItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const { qty, cartItemId } = getCartInfo(item);
    if (cartItemId) {
      await updateQuantity(cartItemId, qty + 1);
    } else {
      await handleAdd(item, e);
    }
  };

  const handleDecrement = async (item: DealItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const { qty, cartItemId } = getCartInfo(item);
    if (cartItemId) {
      if (qty > 1) {
        await updateQuantity(cartItemId, qty - 1);
      } else {
        await removeItem(cartItemId);
      }
    }
  };

  return (
    <section className="my-10">
      {/* Header & Circular Countdown Timer (Matching Screenshot 2) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14532d] tracking-tight">
            {t('dealsTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('dealsSubtitle')}
          </p>
        </div>

        {/* Top-Right Red Pill Timer with circular red badges */}
        <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full shadow-sm">
          <Clock className="w-4 h-4 text-rose-600" />
          <div className="flex items-center gap-1 font-mono text-xs font-bold text-rose-700">
            <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-[11px] font-black">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-rose-500">:</span>
            <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-[11px] font-black">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-rose-500">:</span>
            <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-[11px] font-black">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Cards Grid Matching Screenshot 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {items.map((item) => {
          const progressPercent = Math.min(100, Math.round((item.soldCount / item.totalStock) * 100));
          const { qty: cartQty } = getCartInfo(item);

          return (
            <div
              key={item.id}
              onClick={() => onOpenProduct(item.rawProduct || item)}
              className="group cursor-pointer bg-white rounded-3xl p-4 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Top Discount Tag (Matching Screenshot 2: -18%, -27%, -20%) */}
              <div className="flex items-center justify-between mb-2">
                <span className="bg-rose-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
                  -{item.discountPercentage}%
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Daily Deal</span>
              </div>

              {/* Product Image with Sold Out Overlay */}
              <div className="relative w-full h-44 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden mb-3">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Sold Out Dark Overlay & Centered Pill (Matching Screenshot 2) */}
                {item.isSoldOut && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="bg-rose-600 text-white font-extrabold text-xs px-4 py-1.5 rounded-full shadow-lg tracking-wide uppercase">
                      {t('soldOut')}
                    </span>
                  </div>
                )}
              </div>

              {/* Title & Unit Subtitle */}
              <div className="text-center mb-3">
                <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-emerald-700 transition">
                  {item.name}
                </h3>
                <div className="text-xs text-slate-400 font-medium mt-0.5">
                  {item.unitSubtitle}
                </div>
              </div>

              {/* Price Row (Matching Screenshot 2: Bold dark price with strike-through below) */}
              <div className="text-center mb-3">
                <div className="text-xl font-black text-slate-900">
                  ৳{item.salePrice}
                </div>
                <div className="text-xs text-slate-400 line-through font-medium">
                  ৳{item.regularPrice}
                </div>
              </div>

              {/* Stock Progress Bar (Matching Screenshot 2: Green visual bar with Sold: X/Y) */}
              <div className="space-y-1 mb-4">
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-700 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="text-[11px] font-semibold text-slate-500 text-center">
                  {t('sold')}: {item.soldCount}/{item.totalStock}
                </div>
              </div>

              {/* Bottom Action: Sold Out vs Interactive Stepper vs Circular (+) */}
              <div className="flex justify-center pt-1 min-h-[44px] items-center">
                {item.isSoldOut ? (
                  <button
                    disabled
                    className="w-full py-2 bg-rose-50 text-rose-500 font-bold text-xs rounded-2xl cursor-not-allowed border border-rose-100"
                  >
                    {t('stockOut')}
                  </button>
                ) : cartQty > 0 ? (
                  /* Interactive Stepper: [-] [qty] [+] */
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-between bg-emerald-800 text-white rounded-full px-2.5 py-1.5 shadow-md min-w-[105px] transition-all animate-fade-in"
                  >
                    <button
                      type="button"
                      onClick={(e) => handleDecrement(item, e)}
                      className="w-6 h-6 rounded-full bg-emerald-900 hover:bg-emerald-950 text-white flex items-center justify-center transition font-bold active:scale-90"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-black text-sm px-2 text-center min-w-[20px]">
                      {cartQty}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleIncrement(item, e)}
                      className="w-6 h-6 rounded-full bg-emerald-900 hover:bg-emerald-950 text-white flex items-center justify-center transition font-bold active:scale-90"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  /* Single Plus Button (+) */
                  <button
                    type="button"
                    onClick={(e) => handleAdd(item, e)}
                    aria-label="Add to cart"
                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-emerald-700 text-slate-700 hover:text-white flex items-center justify-center transition-all shadow-sm hover:shadow-md active:scale-90"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
