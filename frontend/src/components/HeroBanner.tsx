import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface BannerSlide {
  id: string;
  headline: string;
  subtext: string;
  buttonText: string;
  imageUrl: string;
  badgeText?: string;
  targetCategory?: string;
}

interface HeroBannerProps {
  slides?: BannerSlide[];
  onShopNow: (categorySlug?: string) => void;
}

const DEFAULT_SLIDES: BannerSlide[] = [
  {
    id: 'slide-1',
    headline: 'We bring the store to your door',
    subtext: 'Get organic produce and sustainably sourced groceries delivery at up to 4% off grocery.',
    buttonText: 'Shop now',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    badgeText: 'Dhaka Express 15-Min',
    targetCategory: 'vegetables',
  },
  {
    id: 'slide-2',
    headline: 'Mega Friday Flash Deals — Up to 35% OFF',
    subtext: 'Premium Teer & Rupchanda edible oils, aromatic Chinigura rice & pure spices at wholesale rates.',
    buttonText: 'View Flash Deals',
    imageUrl: 'https://images.unsplash.com/photo-1579113800032-c38bd7635818?auto=format&fit=crop&w=800&q=80',
    badgeText: 'Friday Bazaar',
    targetCategory: 'cooking-oil',
  },
  {
    id: 'slide-3',
    headline: 'Fresh Farm Cuts, Organic Dairy & Eggs',
    subtext: 'BSTI certified hygienic milk, farm fresh eggs and premium butchery delivered chilled to your doorstep.',
    buttonText: 'Order Dairy & Meat',
    imageUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=800&q=80',
    badgeText: 'Chilled Delivery',
    targetCategory: 'dairy-eggs',
  },
];

export const HeroBanner: React.FC<HeroBannerProps> = ({ slides = DEFAULT_SLIDES, onShopNow }) => {
  const { t, language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto change after delay (5 seconds)
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl bg-[#14532d] text-white shadow-xl">
      {/* Background Graphic Curves */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

      <div className="relative px-6 py-10 sm:px-12 sm:py-14 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8 z-10">
        {/* Left Content */}
        <div className="max-w-xl text-left space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-800/80 border border-emerald-600/50 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>{currentSlide.badgeText || (language === 'bn' ? 'এক্সপ্রেস ডেলিভারি' : '15-Min Express')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
            {language === 'bn' && currentIndex === 0 ? t('heroTitle') : currentSlide.headline}
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-lg">
            {language === 'bn' && currentIndex === 0 ? t('heroSub') : currentSlide.subtext}
          </p>

          <div className="pt-2">
            <button
              onClick={() => onShopNow(currentSlide.targetCategory)}
              className="inline-flex items-center gap-2 bg-white text-[#14532d] hover:bg-emerald-50 px-6 py-3 rounded-full font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              <span>{language === 'bn' ? t('shopNow') : currentSlide.buttonText}</span>
              <ArrowRight className="w-4 h-4 text-[#14532d]" />
            </button>
          </div>
        </div>

        {/* Right Floating Produce Bag Card (Matching Screenshot 1) */}
        <div className="relative shrink-0 w-full md:w-auto flex justify-center">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-80 rounded-2xl bg-white p-3 shadow-2xl flex items-center justify-center overflow-hidden">
            <img
              src={currentSlide.imageUrl}
              alt={currentSlide.headline}
              className="w-full h-full object-cover rounded-xl transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-emerald-950/80 backdrop-blur-md rounded-xl p-2.5 text-white flex items-center justify-between">
              <div className="text-left">
                <div className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold">100% Organic & Fresh</div>
                <div className="text-xs font-bold truncate">Dhaka Central Hub</div>
              </div>
              <span className="bg-yellow-400 text-emerald-950 font-black text-xs px-2 py-0.5 rounded-full">
                4% OFF
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Soft Curved Wave along the bottom (Matching Screenshot 1) */}
      <div className="w-full overflow-hidden leading-none z-10 relative">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-full h-8 text-slate-50 fill-current"
        >
          <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,40 L1200,120 L0,120 Z" />
        </svg>
      </div>

      {/* Slider Controls */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
            aria-label="Previous Slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
            aria-label="Next Slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'w-6 bg-emerald-400' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
