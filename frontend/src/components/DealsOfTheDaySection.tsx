import React, { useState, useEffect, useRef } from 'react';
import { Clock, Plus, Minus, Heart, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

interface DealsOfTheDaySectionProps {
  onOpenProduct: (product: any) => void;
  onSeeMore?: () => void;
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
    id: 'deal-rice-25',
    name: 'Miniket Premium Rice',
    unitSubtitle: '25 KG (Bag)',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    discountPercentage: 8,
    salePrice: 1700,
    regularPrice: 1850,
    soldCount: 0,
    totalStock: 50,
    isSoldOut: false,
    slug: 'miniket-premium-rice-25kg',
  },
  {
    id: 'deal-rice-10',
    name: 'Miniket Premium Rice',
    unitSubtitle: '10 KG',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    discountPercentage: 8,
    salePrice: 700,
    regularPrice: 760,
    soldCount: 0,
    totalStock: 100,
    isSoldOut: false,
    slug: 'miniket-premium-rice-10kg',
  },
  {
    id: 'deal-onion-5',
    name: 'Fresh Red Onion (Deshi Piyaj)',
    unitSubtitle: '5 KG',
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
    discountPercentage: 11,
    salePrice: 380,
    regularPrice: 425,
    soldCount: 0,
    totalStock: 150,
    isSoldOut: false,
    slug: 'fresh-red-onion-deshi-piyaj-5kg',
  },
  {
    id: 'deal-oil-teer-5',
    name: 'Teer Pure Soybean Oil',
    unitSubtitle: '5 Liter',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
    discountPercentage: 4,
    salePrice: 820,
    regularPrice: 850,
    soldCount: 0,
    totalStock: 30,
    isSoldOut: false,
    slug: 'teer-pure-soybean-oil-5l',
  },
  {
    id: 'deal-oil-rup-5',
    name: 'Rupchanda Fortified Soybean Oil',
    unitSubtitle: '5 Liter',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
    discountPercentage: 3,
    salePrice: 840,
    regularPrice: 870,
    soldCount: 0,
    totalStock: 40,
    isSoldOut: false,
    slug: 'rupchanda-fortified-soybean-oil-5l',
  },
  {
    id: 'deal-rice-5',
    name: 'Miniket Premium Rice',
    unitSubtitle: '5 KG',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    discountPercentage: 8,
    salePrice: 360,
    regularPrice: 390,
    soldCount: 0,
    totalStock: 200,
    isSoldOut: false,
    slug: 'miniket-premium-rice-5kg',
  },
  {
    id: 'deal-eggs-30',
    name: 'Fresh Farm Eggs (Brown)',
    unitSubtitle: '30 Pieces (Tray)',
    imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80',
    discountPercentage: 6,
    salePrice: 370,
    regularPrice: 395,
    soldCount: 0,
    totalStock: 70,
    isSoldOut: false,
    slug: 'fresh-farm-eggs-brown-30pcs',
  },
  {
    id: 'deal-turmeric-500',
    name: 'Radhuni Pure Turmeric Powder',
    unitSubtitle: '500 Gram',
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
    discountPercentage: 9,
    salePrice: 200,
    regularPrice: 220,
    soldCount: 0,
    totalStock: 80,
    isSoldOut: false,
    slug: 'radhuni-pure-turmeric-powder-500g',
  },
];

export const DealsOfTheDaySection: React.FC<DealsOfTheDaySectionProps> = ({
  onOpenProduct,
  onSeeMore,
}) => {
  const { t } = useLanguage();
  const { cartItems, addToCart, updateQuantity, removeItem, toggleWishlist, isWishlisted } = useCart();
  const [items, setItems] = useState<DealItem[]>(DEFAULT_DEAL_ITEMS);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 58, seconds: 3 });
  const carouselRef = useRef<HTMLDivElement>(null);

  // Ticking countdown timer matching Screenshot
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
          const mapped: DealItem[] = res.data.map((p: any, idx: number) => {
            const salePrice = Number(p.salePrice || p.basePrice || 100);
            const regularPrice = Number(p.originalPrice || p.basePrice || Math.round(salePrice * 1.15));
            const discountPercentage = Math.round(
              p.discountPercentage ||
              (regularPrice > salePrice ? ((regularPrice - salePrice) / regularPrice) * 100 : 8)
            );
            const totalStock = Number(p.totalStock || p.stockQuantity || 100);
            const soldCount = Number(p.soldCount || 0);

            return {
              id: p.productId || p.id || `deal-api-${idx}`,
              name: p.productName || p.name || 'Daily Deal Item',
              unitSubtitle: p.variantName || p.variants?.[0]?.displayName || p.unit || '1 Pack',
              imageUrl:
                p.imageUrl ||
                p.thumbnailUrl ||
                p.images?.[0] ||
                DEFAULT_DEAL_ITEMS[idx % DEFAULT_DEAL_ITEMS.length].imageUrl,
              discountPercentage,
              salePrice,
              regularPrice,
              soldCount,
              totalStock,
              isSoldOut: Boolean(p.isSoldOut || (p.stockQuantity !== undefined && p.stockQuantity <= 0)),
              slug: p.productSlug || p.slug || `deal-${idx}`,
              variantId: p.variantId || p.variants?.[0]?.id,
              rawProduct: p,
            };
          });
          setItems(mapped);
        }
      } catch (err) {
        console.error('Failed to sync api deals', err);
      }
    };
    loadApiDeals();
  }, []);

  // Helper to scroll carousel horizontally
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 320;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Helper to get active cart quantity & cart item ID for a deal item
  const getCartInfo = (dealItem: DealItem) => {
    const ci = cartItems.find((c) => {
      if (dealItem.variantId && c.variantId === dealItem.variantId) return true;
      if (dealItem.id && (c.productId === dealItem.id || c.id === dealItem.id)) return true;
      const cName = (c.productName || c.name || '').toLowerCase().trim();
      const dName = (dealItem.name || '').toLowerCase().trim();
      return dName.length > 0 && cName === dName;
    });
    return ci ? { qty: ci.quantity, cartItemId: ci.id } : { qty: 0, cartItemId: null };
  };

  const handleAdd = async (item: DealItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.isSoldOut) return;
    await addToCart(item.variantId || 'deal-v-' + item.id, 1, {
      id: item.id,
      productId: item.id,
      name: item.name,
      productName: item.name,
      variantName: item.unitSubtitle,
      unit: item.unitSubtitle,
      price: item.salePrice,
      salePrice: item.salePrice,
      basePrice: item.regularPrice,
      imageUrl: item.imageUrl,
    });
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
    <section className="my-10 text-left">
      {/* Header & Circular Countdown Timer & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14532d] tracking-tight">
            {t('dealsTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('dealsSubtitle')}
          </p>
        </div>

        {/* Right Controls: Timer, See More button, Left/Right Scroll Arrows */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          {/* Top-Right Red Pill Timer with circular red badges */}
          <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full shadow-xs">
            <Clock className="w-4 h-4 text-rose-600 shrink-0" />
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

          {/* See More Button */}
          {onSeeMore && (
            <button
              type="button"
              onClick={onSeeMore}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-full transition-all shadow-xs group cursor-pointer"
            >
              <span>{t('seeMore')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Horizontal Scroll Navigation Arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollCarousel('left')}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 flex items-center justify-center text-slate-700 transition shadow-xs active:scale-90 cursor-pointer"
              title="Scroll left"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel('right')}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 flex items-center justify-center text-slate-700 transition shadow-xs active:scale-90 cursor-pointer"
              title="Scroll right"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontally Scrollable Cards Container */}
      <div
        ref={carouselRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth no-scrollbar"
        style={{
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {items.map((item) => {
          const progressPercent = Math.min(100, Math.round((item.soldCount / Math.max(1, item.totalStock)) * 100));
          const { qty: cartQty } = getCartInfo(item);

          return (
            <div
              key={item.id}
              onClick={() => onOpenProduct(item.rawProduct || item)}
              className="group cursor-pointer bg-white rounded-3xl p-4 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden w-[260px] sm:w-[280px] shrink-0"
            >
              {/* Top Discount Tag (Matching Screenshot: -8%, -11%, DAILY DEAL) */}
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

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(item.id, {
                      id: item.id,
                      name: item.name,
                      price: item.salePrice,
                      regularPrice: item.regularPrice,
                      imageUrl: item.imageUrl,
                      unit: item.unitSubtitle,
                      variantId: item.variantId,
                      slug: item.slug,
                    });
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm text-slate-500 hover:text-rose-500 transition z-10"
                  title="Add to Favourites"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isWishlisted(item.id) ? 'fill-rose-500 text-rose-500' : ''
                    }`}
                  />
                </button>

                {/* Sold Out Dark Overlay & Centered Pill */}
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

              {/* Price Row (Matching Screenshot: Bold dark price with strike-through below) */}
              <div className="text-center mb-3">
                <div className="text-xl font-black text-slate-900">
                  ৳{item.salePrice}
                </div>
                <div className="text-xs text-slate-400 line-through font-medium">
                  ৳{item.regularPrice}
                </div>
              </div>

              {/* Stock Progress Bar (Matching Screenshot: Green visual bar with Sold: X/Y) */}
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

        {/* See More Deals Card at the end of the horizontal carousel */}
        {onSeeMore && (
          <div
            onClick={onSeeMore}
            className="w-[200px] sm:w-[220px] shrink-0 rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-500 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group self-stretch my-0.5"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-800 text-white flex items-center justify-center mb-3 group-hover:scale-110 shadow-md transition-transform">
              <ArrowRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-base mb-1">
              {t('seeMore')}
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              Browse all daily deals & offers
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
