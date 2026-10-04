import React, { useState, useEffect, useRef } from 'react';
import { Flame, Clock, ShoppingCart, Check, Zap, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { FlashDealCampaign } from '../types';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

interface FridayFlashSectionProps {
  onOpenProductModal: (slug: string) => void;
  onOpenProduct?: (product: any) => void;
}

const DEFAULT_FRIDAY_ITEMS = [
  {
    id: 'flash-oil-1',
    productId: 'p-teer-soybean',
    variantId: 'v-oil-teer-5l',
    dealPrice: 790,
    regularPrice: 850,
    originalPrice: 850,
    savings: 60,
    allocatedStock: 50,
    soldStock: 12,
    remainingStock: 38,
    maxPerCustomer: 2,
    productName: 'Teer Pure Soybean Oil',
    productSlug: 'teer-pure-soybean-oil',
    variantName: '5 Liter',
    discountPercentage: 7,
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'flash-rice-1',
    productId: 'p-miniket-rice',
    variantId: 'v-rice-miniket-5kg',
    dealPrice: 330,
    regularPrice: 390,
    originalPrice: 390,
    savings: 60,
    allocatedStock: 40,
    soldStock: 8,
    remainingStock: 32,
    maxPerCustomer: 2,
    productName: 'Miniket Premium Rice',
    productSlug: 'miniket-premium-rice-5kg',
    variantName: '5 KG',
    discountPercentage: 15,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
  },
];

export const FridayFlashSection: React.FC<FridayFlashSectionProps> = ({ onOpenProductModal, onOpenProduct }) => {
  const { cartItems, addToCart, updateQuantity, removeItem } = useCart();
  const [deal, setDeal] = useState<FlashDealCampaign | null>(null);
  const [remainingSecs, setRemainingSecs] = useState<number>(86400 * 6 + 3600 * 22 + 60 * 13 + 33);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const loadDeal = async () => {
    try {
      let campaignMeta: any = null;
      let remoteItems: any[] = [];

      try {
        const res = await api.getFridayFlashDeal();
        if (res.success && res.data) {
          if (res.data.campaign) {
            campaignMeta = res.data.campaign;
            remoteItems = res.data.items || [];
          } else {
            campaignMeta = res.data;
            remoteItems = res.data.items || [];
          }
        }
      } catch (e) {
        // Fallback gracefully
      }

      // Read admin-added custom items from localStorage
      let customItems: any[] = [];
      const saved = localStorage.getItem('lb_custom_flash_items');
      if (saved) {
        try {
          customItems = JSON.parse(saved);
        } catch (e) {}
      }

      // Merge items: remote/default base items + admin-added custom items
      const baseList = remoteItems.length > 0 ? remoteItems : DEFAULT_FRIDAY_ITEMS;
      const itemMap = new Map<string, any>();

      for (const item of baseList) {
        const key = item.variantId || item.id || item.productId;
        itemMap.set(key, {
          ...item,
          id: item.id || item.dealItemId || key,
          variantId: item.variantId || key,
          savings: item.savings ?? Math.max(0, (item.regularPrice || item.originalPrice || 0) - item.dealPrice),
          discountPercentage: item.discountPercentage ?? Math.round((((item.regularPrice || item.originalPrice || 1) - item.dealPrice) / (item.regularPrice || item.originalPrice || 1)) * 100),
          allocatedStock: Number(item.allocatedStock || 50),
          soldStock: Number(item.soldStock || 0),
          remainingStock: Number(item.remainingStock ?? (item.allocatedStock - (item.soldStock || 0))),
          maxPerCustomer: Number(item.maxPerCustomer || 2),
        });
      }

      for (const item of customItems) {
        const key = item.variantId || item.id || item.productId;
        itemMap.set(key, {
          ...item,
          id: item.id || key,
          variantId: item.variantId || key,
          savings: item.savings ?? Math.max(0, (item.regularPrice || 0) - item.dealPrice),
          discountPercentage: item.discountPercentage ?? Math.round((((item.regularPrice || 1) - item.dealPrice) / (item.regularPrice || 1)) * 100),
          allocatedStock: Number(item.allocatedStock || 50),
          soldStock: Number(item.soldStock || 0),
          remainingStock: Number(item.remainingStock ?? item.allocatedStock),
          maxPerCustomer: Number(item.maxPerCustomer || 2),
        });
      }

      const finalItems = Array.from(itemMap.values());
      const secs =
        campaignMeta?.secondsRemaining ||
        campaignMeta?.remainingSeconds ||
        86400 * 6 + 3600 * 22 + 60 * 13 + 33;

      setDeal({
        id: campaignMeta?.id || 'mega-friday-campaign',
        title: campaignMeta?.title || 'Mega Friday Flash Bazaar',
        slug: campaignMeta?.slug || 'mega-friday-flash-bazaar',
        description:
          campaignMeta?.description ||
          'Strictly limited quantities at subsidized wholesale prices. Allocated directly from Dhaka central warehouse.',
        status: 'ACTIVE',
        startTime: campaignMeta?.startTime || new Date().toISOString(),
        endTime: campaignMeta?.endTime || new Date(Date.now() + secs * 1000).toISOString(),
        serverTime: new Date().toISOString(),
        remainingSeconds: secs,
        items: finalItems,
      });
      setRemainingSecs(secs);
    } catch (err) {
      console.error('Failed to load flash deals', err);
    }
  };

  useEffect(() => {
    loadDeal();
    const handleUpdate = () => loadDeal();
    window.addEventListener('lb_flash_deals_updated', handleUpdate);
    return () => window.removeEventListener('lb_flash_deals_updated', handleUpdate);
  }, []);

  // Tick timer
  useEffect(() => {
    if (remainingSecs <= 0) return;
    const interval = setInterval(() => {
      setRemainingSecs((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingSecs]);

  // Horizontal scroll helper
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 340;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const formatTimer = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return {
      days: String(d).padStart(2, '0'),
      hours: String(h).padStart(2, '0'),
      mins: String(m).padStart(2, '0'),
      secs: String(s).padStart(2, '0'),
    };
  };

  const timer = formatTimer(remainingSecs);

  if (!deal || !deal.items || deal.items.length === 0 || deal.status !== 'ACTIVE') {
    return (
      <section id="friday-flash" className="my-6 scroll-mt-28 text-left">
        <div className="rounded-3xl bg-amber-50/90 border border-amber-200/80 p-5 sm:p-6 text-center shadow-xs">
          <p className="text-amber-900 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Friday deals are closed for today. It will appear on Friday.</span>
          </p>
        </div>
      </section>
    );
  }

  const handleAddToCart = async (item: any) => {
    const maxLimit = item.maxPerCustomer || 2;
    const existing = cartItems.find((ci) => {
      if (item.variantId && ci.variantId === item.variantId) return true;
      if (ci.productId === item.productId || ci.id === item.productId) return true;
      const cName = (ci.name || '').toLowerCase().trim();
      const iName = (item.productName || '').toLowerCase().trim();
      return iName.length > 0 && cName === iName;
    });

    if (existing && existing.quantity >= maxLimit) {
      alert(`Limit of ${maxLimit} units per customer for this Friday flash deal.`);
      return;
    }

    setAddingId(item.variantId);
    const result = await addToCart(item.variantId, 1, {
      id: item.productId || item.id,
      productId: item.productId || item.id,
      name: item.productName,
      productName: item.productName,
      variantName: item.variantName,
      price: item.dealPrice,
      salePrice: item.dealPrice,
      basePrice: item.regularPrice || item.originalPrice,
      imageUrl: item.imageUrl,
      maxPerCustomer: maxLimit,
      isFlashDeal: true,
    });
    setAddingId(null);
    if (result.success) {
      setJustAddedId(item.variantId);
      setTimeout(() => setJustAddedId(null), 2000);
    } else {
      alert(result.message || `Limit of ${maxLimit} units per customer.`);
    }
  };

  // Automatically clamp any cart quantities that exceed the flash deal per-customer limit
  useEffect(() => {
    if (!deal || !deal.items || deal.items.length === 0) return;
    for (const item of deal.items) {
      const maxLimit = item.maxPerCustomer || 2;
      const cartItem = cartItems.find((ci) => {
        if (item.variantId && ci.variantId === item.variantId) return true;
        if (ci.productId === item.productId || ci.id === item.productId) return true;
        const cName = (ci.name || '').toLowerCase().trim();
        const iName = (item.productName || '').toLowerCase().trim();
        return iName.length > 0 && cName === iName;
      });
      if (cartItem && cartItem.quantity > maxLimit) {
        updateQuantity(cartItem.id, maxLimit);
      }
    }
  }, [deal, cartItems]);

  return (
    <section id="friday-flash" className="my-6 sm:my-8 scroll-mt-28 text-left">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-700 text-white p-4 sm:p-8 shadow-xl shadow-red-500/10">
        {/* Background decorative circles */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-6 border-b border-white/20 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] sm:text-xs font-extrabold uppercase tracking-wider mb-2">
              <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
              <span>Mega Friday Flash Bazaar</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight">
              {deal.title}
            </h2>
            <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl">
              {deal.description}
            </p>
          </div>

          {/* Right Header Area: Countdown Clock + Carousel Navigation Controls */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            {/* Countdown Clock */}
            <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-2xl p-2 sm:p-3.5 flex items-center gap-1.5 sm:gap-3 shrink-0 shadow-sm">
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Ends In:</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 font-mono">
                <div className="bg-white/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-center min-w-[30px] sm:min-w-[36px]">
                  <span className="text-sm sm:text-lg font-black">{timer.days}</span>
                  <span className="block text-[8px] sm:text-[9px] uppercase tracking-wider text-white/60">Days</span>
                </div>
                <span className="text-amber-300 font-bold">:</span>
                <div className="bg-white/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-center min-w-[30px] sm:min-w-[36px]">
                  <span className="text-sm sm:text-lg font-black">{timer.hours}</span>
                  <span className="block text-[8px] sm:text-[9px] uppercase tracking-wider text-white/60">Hrs</span>
                </div>
                <span className="text-amber-300 font-bold">:</span>
                <div className="bg-white/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-center min-w-[30px] sm:min-w-[36px]">
                  <span className="text-sm sm:text-lg font-black">{timer.mins}</span>
                  <span className="block text-[8px] sm:text-[9px] uppercase tracking-wider text-white/60">Min</span>
                </div>
                <span className="text-amber-300 font-bold">:</span>
                <div className="bg-amber-400 text-slate-900 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-center min-w-[30px] sm:min-w-[36px] shadow">
                  <span className="text-sm sm:text-lg font-black">{timer.secs}</span>
                  <span className="block text-[8px] sm:text-[9px] uppercase tracking-wider font-bold">Sec</span>
                </div>
              </div>
            </div>

            {/* Left and Right Scroll Navigation Arrows */}
            <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md p-1 sm:p-1.5 rounded-2xl border border-white/20 shadow-xs">
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/10 hover:bg-white/30 text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
                title="Scroll left"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/10 hover:bg-white/30 text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
                title="Scroll right"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Flash Deal Items - Smooth Horizontal Scrollable Row */}
        <div
          ref={carouselRef}
          className="relative z-10 flex gap-3.5 sm:gap-5 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth no-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {deal.items.map((item) => {
            const percentageSold = Math.min(
              100,
              Math.round(((item.soldStock || 0) / Math.max(1, item.allocatedStock || 1)) * 100)
            );
            const isSoldOut = (item.remainingStock || 0) <= 0;

            return (
              <div
                key={item.id}
                className="bg-white text-slate-900 rounded-2xl p-3.5 sm:p-4 shadow-lg hover:shadow-2xl transition duration-300 flex flex-col justify-between group w-[250px] sm:w-[320px] shrink-0"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-rose-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Zap className="w-3 h-3 fill-white" /> -৳{Number(item.savings || 60).toFixed(0)} OFF
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      Limit {item.maxPerCustomer || 2}/customer
                    </span>
                  </div>

                  {/* Image / Graphic */}
                  <div
                    onClick={() => {
                      if (onOpenProduct) {
                        onOpenProduct(item);
                      } else if (onOpenProductModal) {
                        onOpenProductModal(item.productSlug);
                      }
                    }}
                    className="cursor-pointer bg-slate-50 rounded-xl p-4 flex items-center justify-center text-5xl mb-4 group-hover:scale-105 transition h-32 overflow-hidden"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="h-28 w-auto object-contain rounded-lg"
                      />
                    ) : item.productName.toLowerCase().includes('oil') ? (
                      '🛢️'
                    ) : item.productName.toLowerCase().includes('rice') ? (
                      '🍚'
                    ) : item.productName.toLowerCase().includes('egg') ? (
                      '🥚'
                    ) : item.productName.toLowerCase().includes('ghee') ? (
                      '🧈'
                    ) : (
                      '⚡'
                    )}
                  </div>

                  {/* Title & Variant */}
                  <h3
                    onClick={() => {
                      if (onOpenProduct) {
                        onOpenProduct(item);
                      } else if (onOpenProductModal) {
                        onOpenProductModal(item.productSlug);
                      }
                    }}
                    className="font-bold text-slate-900 text-sm hover:text-emerald-700 cursor-pointer line-clamp-1"
                  >
                    {item.productName}
                  </h3>
                  <div className="text-xs font-semibold text-emerald-700 mt-0.5">
                    {item.variantName}
                  </div>

                  {/* Pricing */}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-rose-600">
                      ৳{item.dealPrice}
                    </span>
                    <span className="text-sm text-slate-400 line-through">
                      ৳{item.regularPrice || item.originalPrice}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                      <span>
                        Available: <strong className="text-slate-800">{item.remainingStock}</strong> units
                      </span>
                      <span className="text-rose-600 font-bold">{percentageSold}% Sold</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-rose-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentageSold}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Add to Cart Button or Interactive Stepper */}
                {(() => {
                  const cartItem = cartItems.find((ci) => {
                    if (item.variantId && ci.variantId === item.variantId) return true;
                    if (ci.productId === item.productId || ci.id === item.productId) return true;
                    const cName = (ci.name || '').toLowerCase().trim();
                    const iName = (item.productName || '').toLowerCase().trim();
                    return iName.length > 0 && cName === iName;
                  });
                  const inCartQty = cartItem ? cartItem.quantity : 0;
                  const maxLimit = item.maxPerCustomer || 2;
                  const isMaxReached = inCartQty >= maxLimit;

                  if (isSoldOut) {
                    return (
                      <button
                        disabled
                        className="mt-4 w-full py-2.5 rounded-xl font-bold text-xs bg-slate-200 text-slate-400 cursor-not-allowed"
                      >
                        Sold Out
                      </button>
                    );
                  }

                  if (inCartQty > 0 && cartItem) {
                    return (
                      <div className="mt-4 flex flex-col gap-1">
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="w-full py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-between px-3 shadow-md"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (inCartQty > 1) {
                                updateQuantity(cartItem.id, inCartQty - 1);
                              } else {
                                removeItem(cartItem.id);
                              }
                            }}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition active:scale-90 cursor-pointer"
                            title="Decrease"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-black text-sm px-2 text-center min-w-[20px]">{inCartQty}</span>
                          <button
                            type="button"
                            disabled={isMaxReached}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isMaxReached) {
                                updateQuantity(cartItem.id, inCartQty + 1);
                              }
                            }}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition active:scale-90 ${
                              isMaxReached
                                ? 'bg-slate-800/40 text-slate-500 cursor-not-allowed opacity-40'
                                : 'bg-slate-800 hover:bg-slate-700 text-white cursor-pointer'
                            }`}
                            title={isMaxReached ? `Limit of ${maxLimit} reached per customer` : "Increase"}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {isMaxReached && (
                          <div className="text-[10px] text-amber-600 font-bold text-center">
                            Maximum limit of {maxLimit} reached
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <button
                      disabled={addingId === item.variantId || isMaxReached}
                      onClick={() => handleAddToCart(item)}
                      className={`mt-4 w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                        justAddedId === item.variantId
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg'
                      }`}
                    >
                      {addingId === item.variantId ? (
                        'Securing Deal...'
                      ) : justAddedId === item.variantId ? (
                        <>
                          <Check className="w-4 h-4" /> Added to Basket
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" /> Claim Friday Deal
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
