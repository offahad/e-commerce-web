import React from 'react';
import { Smartphone, Zap, Gift, ShieldCheck, ArrowRight, Star, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface PromoPosterBannerProps {
  onShopDeals?: () => void;
}

export const PromoPosterBanner: React.FC<PromoPosterBannerProps> = ({ onShopDeals }) => {
  const { t } = useLanguage();

  return (
    <section className="my-10 space-y-6">
      {/* 1. Large Feature Promo Poster Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#14532d] via-[#1b4332] to-[#081c15] text-white shadow-2xl p-6 sm:p-10 border border-emerald-900/40">
        {/* Glow ambient background elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -ml-20 -mb-20 w-64 h-64 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left Text & Value Props */}
          <div className="max-w-xl text-left space-y-4">
            <div className="inline-flex items-center gap-2 bg-emerald-800/90 border border-emerald-600/60 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide text-emerald-200">
              <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 animate-pulse" />
              <span>Liton Brothers Express Promo Bazaar</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white">
              Dhaka's #1 Express Grocery <br />
              <span className="text-yellow-300">Delivered to Doorstep in 15 Minutes</span>
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-lg">
              Direct farm-sourced fresh vegetables, certified unadulterated edible oils, premium aromatic rice, and daily pantry staples at wholesale prices.
            </p>

            {/* Benefit Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-bold">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                <Clock className="w-4 h-4 text-yellow-300 shrink-0" />
                <span>15-Min Delivery</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>100% Pure & Fresh</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 col-span-2 sm:col-span-1">
                <Gift className="w-4 h-4 text-rose-300 shrink-0" />
                <span>Save up to ৳89</span>
              </div>
            </div>

            {/* Voucher Code Box */}
            <div className="pt-2 flex items-center flex-wrap gap-3">
              <div className="bg-white/15 border border-dashed border-yellow-300/60 rounded-xl px-4 py-2 flex items-center gap-2 text-xs">
                <span className="text-emerald-200 font-semibold">Special Coupon:</span>
                <span className="font-mono font-black text-yellow-300 text-sm tracking-wider">RAMADAN20</span>
                <span className="text-[11px] text-white/80">(20% OFF min ৳500)</span>
              </div>
            </div>
          </div>

          {/* Right Promotional Poster Mockup Card (Matching Summer Sale Poster) */}
          <div className="relative shrink-0 w-full sm:w-80 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-tr from-rose-500 via-pink-400 to-amber-300 p-1.5 transition-transform hover:scale-[1.02] duration-300">
            <div className="rounded-[22px] overflow-hidden bg-white text-slate-900 p-5 text-center">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  App & Web Exclusive
                </span>
                <div className="flex items-center gap-0.5 text-amber-500 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>4.9 / 5</span>
                </div>
              </div>

              <div className="text-xl font-black text-slate-900">Summer Grocery Sale</div>
              <div className="text-xs text-slate-500 mb-3">Fresh Kitchen Staples & Cooking Oils</div>

              <div className="relative rounded-2xl overflow-hidden h-40 bg-slate-100 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"
                  alt="Summer grocery sale poster"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 right-2.5 bg-rose-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                  HOT DEALS
                </div>
                <div className="absolute bottom-2 left-2 right-2 bg-slate-950/70 backdrop-blur-sm text-white text-[11px] font-semibold py-1 px-2 rounded-lg text-center">
                  Instant 15-Minute Dhaka Delivery
                </div>
              </div>

              {/* App download stores */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                <div className="bg-slate-900 text-white rounded-xl py-2 px-2 flex items-center justify-center gap-1.5 shadow-sm">
                  <Smartphone className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Google Play</span>
                </div>
                <div className="bg-slate-900 text-white rounded-xl py-2 px-2 flex items-center justify-center gap-1.5 shadow-sm">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
                  <span>App Store</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
