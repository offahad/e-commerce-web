import React, { useState, useEffect, useCallback } from 'react';
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
  const [isHovered, setIsHovered] = useState(false);

  const activeSlides = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;
  const totalSlides = activeSlides.length;

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  // Auto scroll after delay (5 seconds), pausing on hover or when single slide
  useEffect(() => {
    if (totalSlides <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(timer);
  }, [currentIndex, totalSlides, isHovered]);

  const currentSlide = activeSlides[currentIndex] || activeSlides[0];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative mb-8 overflow-hidden rounded-3xl bg-[#14532d] text-white shadow-xl group"
    >
      {/* Background Graphic Curves */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

      {/* Actionable Left Arrow Navigation Button */}
      {totalSlides > 1 && (
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous Hero Slide"
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-xl z-30 cursor-pointer active:scale-90 hover:scale-110 border border-white/20"
        >
          <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Actionable Right Arrow Navigation Button */}
      {totalSlides > 1 && (
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next Hero Slide"
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-xl z-30 cursor-pointer active:scale-90 hover:scale-110 border border-white/20"
        >
          <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
        </button>
      )}

      <div className="relative px-4 py-8 sm:px-14 sm:py-14 md:py-16 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 z-10">
        {/* Left Content */}
        <div className="max-w-xl text-left space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-emerald-800/80 border border-emerald-600/50 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold text-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>{currentSlide.badgeText || (language === 'bn' ? 'এক্সপ্রেস ডেলিভারি' : '15-Min Express')}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-sm transition-opacity duration-300">
            {language === 'bn' && currentIndex === 0 ? t('heroTitle') : currentSlide.headline}
          </h1>

          <p className="text-xs sm:text-base text-emerald-100/90 leading-relaxed max-w-lg transition-opacity duration-300">
            {language === 'bn' && currentIndex === 0 ? t('heroSub') : currentSlide.subtext}
          </p>

          <div className="pt-1 sm:pt-2">
            <button
              type="button"
              onClick={() => onShopNow(currentSlide.targetCategory)}
              className="inline-flex items-center gap-2 bg-white text-[#14532d] hover:bg-emerald-50 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-base shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <span>{language === 'bn' ? t('shopNow') : currentSlide.buttonText}</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#14532d]" />
            </button>
          </div>
        </div>

        {/* Right Floating Produce Bag Card */}
        <div className="relative shrink-0 w-full md:w-auto flex justify-center">
          <div className="relative w-full max-w-[260px] sm:w-80 sm:h-80 md:w-96 md:h-80 aspect-square sm:aspect-auto rounded-2xl bg-white p-2.5 sm:p-3 shadow-2xl flex items-center justify-center overflow-hidden">
            <img
              key={currentSlide.id || currentIndex}
              src={currentSlide.imageUrl}
              alt={currentSlide.headline}
              className="w-full h-full object-cover rounded-xl transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-emerald-950/80 backdrop-blur-md rounded-xl p-2.5 text-white flex items-center justify-between pointer-events-none">
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

      {/* Soft Curved Wave along the bottom */}
      <div className="w-full overflow-hidden leading-none z-10 relative pointer-events-none">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-full h-8 text-slate-50 fill-current"
        >
          <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,40 L1200,120 L0,120 Z" />
        </svg>
      </div>

      {/* Dots Indicator */}
      {totalSlides > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {activeSlides.map((_, idx) => (
            <button
              type="button"
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentIndex ? 'w-6 bg-emerald-400' : 'w-2 bg-white/40 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
