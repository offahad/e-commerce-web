import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const AppDownloadBanner: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="relative my-10 overflow-hidden rounded-3xl bg-[#4a2040] text-white shadow-xl">
      <div className="px-6 py-10 sm:px-12 sm:py-12 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left Copy & Store Badges */}
        <div className="max-w-xl text-left space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white">
            {t('appTitle')}
          </h2>
          <p className="text-sm sm:text-base text-pink-100/80 max-w-md">
            {t('appSub')}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {/* Google Play Button */}
            <a
              href="#google-play"
              onClick={(e) => e.preventDefault()}
              className="flex items-center gap-2 bg-black hover:bg-neutral-900 border border-neutral-700 text-white px-4 py-2.5 rounded-xl transition shadow-md"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M3.609 1.814L13.793 12 3.61 22.186A2.296 2.296 0 0 1 3 20.612V3.388c0-.623.23-1.19.609-1.574zm11.603 11.603l2.482 2.482-11.89 6.815 9.408-9.297zm0-2.834L5.804 1.286l11.89 6.814-2.482 2.483zm1.414 1.417l3.87 2.217a1.5 1.5 0 0 1 0 2.616l-3.87 2.217-2.616-2.616 2.616-2.434z" />
              </svg>
              <div className="text-left leading-tight">
                <div className="text-[9px] uppercase tracking-wider text-neutral-400">GET IT ON</div>
                <div className="text-xs font-bold text-white">Google Play</div>
              </div>
            </a>

            {/* App Store Button */}
            <a
              href="#app-store"
              onClick={(e) => e.preventDefault()}
              className="flex items-center gap-2 bg-black hover:bg-neutral-900 border border-neutral-700 text-white px-4 py-2.5 rounded-xl transition shadow-md"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.82 1.11-1.96.99-3.1-.96.04-2.12.64-2.81 1.45-.6.7-.1.14 1.83-.99 2.97 1.07.08 2.15-.55 2.81-1.32z" />
              </svg>
              <div className="text-left leading-tight">
                <div className="text-[9px] uppercase tracking-wider text-neutral-400">DOWNLOAD ON THE</div>
                <div className="text-xs font-bold text-white">App Store</div>
              </div>
            </a>
          </div>
        </div>

        {/* Right Summer Sale Card Mockup (Matching Screenshot 4) */}
        <div className="relative shrink-0 w-64 sm:w-72 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-tr from-pink-400 via-rose-300 to-amber-200 p-1">
          <div className="rounded-xl overflow-hidden bg-white/95 text-slate-800 p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-600">Liton Brother App Exclusive</div>
            <div className="text-lg font-black text-slate-900 mt-1">Summer Sale</div>
            <div className="text-[11px] text-slate-500 mb-3">Save up to ৳89 extra on app checkout</div>

            <div className="relative rounded-lg overflow-hidden h-36 bg-slate-100 mb-3">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80"
                alt="App promotion"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                HOT
              </div>
            </div>

            <div className="flex justify-center items-center gap-1.5">
              <span className="w-4 h-1.5 rounded-full bg-rose-600"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
