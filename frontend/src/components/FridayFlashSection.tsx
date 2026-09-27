import React, { useState, useEffect } from 'react';
import { Flame, Clock, ShoppingCart, Check, Zap } from 'lucide-react';
import { FlashDealCampaign } from '../types';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

interface FridayFlashSectionProps {
  onOpenProductModal: (slug: string) => void;
}

export const FridayFlashSection: React.FC<FridayFlashSectionProps> = ({ onOpenProductModal }) => {
  const { addToCart } = useCart();
  const [deal, setDeal] = useState<FlashDealCampaign | null>(null);
  const [remainingSecs, setRemainingSecs] = useState<number>(0);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const res = await api.getFridayFlashDeal();
        if (res.success && res.data) {
          setDeal(res.data);
          setRemainingSecs(res.data.remainingSeconds || 86400 * 3);
        }
      } catch (err) {
        console.error('Failed to load flash deals', err);
      }
    };
    fetchDeal();
  }, []);

  // Tick timer
  useEffect(() => {
    if (remainingSecs <= 0) return;
    const interval = setInterval(() => {
      setRemainingSecs((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingSecs]);

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

  if (!deal || !deal.items || deal.items.length === 0) {
    return null;
  }

  const handleAddToCart = async (item: any) => {
    setAddingId(item.variantId);
    const result = await addToCart(item.variantId, 1);
    setAddingId(null);
    if (result.success) {
      setJustAddedId(item.variantId);
      setTimeout(() => setJustAddedId(null), 2000);
    } else {
      alert(result.message || 'Could not add to cart');
    }
  };

  return (
    <section id="friday-flash" className="my-8 scroll-mt-28">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-700 text-white p-6 sm:p-8 shadow-xl shadow-red-500/10">
        {/* Background decorative circles */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/20 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2">
              <Flame className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
              <span>Mega Friday Flash Bazaar</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {deal.title}
            </h2>
            <p className="text-white/80 text-sm mt-1 max-w-xl">
              Strictly limited quantities at subsidized wholesale prices. Allocated directly from Dhaka central warehouse.
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <Clock className="w-4 h-4" /> Ends In:
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <div className="bg-white/10 px-2 py-1 rounded-lg text-center min-w-[36px]">
                <span className="text-lg font-black">{timer.days}</span>
                <span className="block text-[9px] uppercase tracking-wider text-white/60">Days</span>
              </div>
              <span className="text-amber-300 font-bold">:</span>
              <div className="bg-white/10 px-2 py-1 rounded-lg text-center min-w-[36px]">
                <span className="text-lg font-black">{timer.hours}</span>
                <span className="block text-[9px] uppercase tracking-wider text-white/60">Hrs</span>
              </div>
              <span className="text-amber-300 font-bold">:</span>
              <div className="bg-white/10 px-2 py-1 rounded-lg text-center min-w-[36px]">
                <span className="text-lg font-black">{timer.mins}</span>
                <span className="block text-[9px] uppercase tracking-wider text-white/60">Min</span>
              </div>
              <span className="text-amber-300 font-bold">:</span>
              <div className="bg-amber-400 text-slate-900 px-2 py-1 rounded-lg text-center min-w-[36px] shadow">
                <span className="text-lg font-black">{timer.secs}</span>
                <span className="block text-[9px] uppercase tracking-wider font-bold">Sec</span>
              </div>
            </div>
          </div>
        </div>

        {/* Flash Deal Items Grid */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {deal.items.map((item) => {
            const percentageSold = Math.min(100, Math.round((item.soldStock / item.allocatedStock) * 100));
            const isSoldOut = item.remainingStock <= 0;

            return (
              <div
                key={item.id}
                className="bg-white text-slate-900 rounded-2xl p-4 shadow-lg hover:shadow-2xl transition duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-rose-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Zap className="w-3 h-3 fill-white" /> -৳{item.savings.toFixed(0)} OFF
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      Limit {item.maxPerCustomer}/customer
                    </span>
                  </div>

                  {/* Image / Graphic */}
                  <div
                    onClick={() => onOpenProductModal(item.productSlug)}
                    className="cursor-pointer bg-slate-50 rounded-xl p-4 flex items-center justify-center text-5xl mb-4 group-hover:scale-105 transition"
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="h-28 object-contain" />
                    ) : item.productName.toLowerCase().includes('oil') ? (
                      '🛢️'
                    ) : (
                      '🍚'
                    )}
                  </div>

                  {/* Title & Variant */}
                  <h3
                    onClick={() => onOpenProductModal(item.productSlug)}
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
                      ৳{item.regularPrice}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                      <span>Available: <strong className="text-slate-800">{item.remainingStock}</strong> units</span>
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

                {/* Add to Cart Button */}
                <button
                  disabled={isSoldOut || addingId === item.variantId}
                  onClick={() => handleAddToCart(item)}
                  className={`mt-4 w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    isSoldOut
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : justAddedId === item.variantId
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {isSoldOut ? (
                    'Sold Out'
                  ) : addingId === item.variantId ? (
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
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
