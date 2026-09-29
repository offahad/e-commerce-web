import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Clock,
  Star,
  Plus,
  Minus,
  ShoppingCart,
  Heart,
  Share2,
  ShieldCheck,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

interface ProductDetailViewProps {
  product: any;
  onBack: () => void;
  onBuyNow: (variantId: string, quantity: number) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onBack,
  onBuyNow,
}) => {
  const { t } = useLanguage();
  const { addToCart, toggleWishlist, isWishlisted } = useCart();

  // Unit mode: KG vs Gram (or Liter vs ML)
  const isLiquid = product?.unit?.toLowerCase().includes('liter') || product?.unit?.toLowerCase().includes('l');
  const primaryUnit = isLiquid ? 'LITER' : 'KG';
  const secondaryUnit = isLiquid ? 'ML' : 'Gram';

  const [selectedUnitMode, setSelectedUnitMode] = useState<string>(primaryUnit);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  // Gallery images (matching Screenshot 6: 4 thumbnails below)
  const defaultImages = [
    product?.thumbnailUrl || 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1579613832125-5d34a13ffe0a?auto=format&fit=crop&w=800&q=80',
  ];

  const images = (product?.images && product.images.length > 0) ? product.images : defaultImages;

  // Selected Variant
  const variants = product?.variants || [];
  const selectedVariant = variants[0] || {
    id: product?.variantId || 'v-' + product?.id,
    price: product?.salePrice || product?.basePrice || 140,
    salePrice: product?.salePrice || product?.basePrice || 140,
  };

  // Unit pricing calculations
  const baseUnitPrice = selectedVariant.salePrice || selectedVariant.price || product?.salePrice || 140;
  const unitMultiplier = selectedUnitMode === secondaryUnit ? 0.001 : 1; // 1 gram = 0.001 kg
  const effectiveQty = selectedUnitMode === secondaryUnit ? quantity * 250 : quantity; // Stepper in grams jumps by 250g
  const calculatedTotal = selectedUnitMode === secondaryUnit
    ? Math.round((baseUnitPrice / 1000) * effectiveQty)
    : Math.round(baseUnitPrice * quantity);

  const displayQuantityText = selectedUnitMode === secondaryUnit
    ? `${effectiveQty} ${secondaryUnit}`
    : `${quantity} ${primaryUnit}`;

  const handleAddToCart = () => {
    addToCart(selectedVariant.id, quantity, {
      id: product.id,
      productId: product.id,
      name: product.name,
      productName: product.name,
      variantName: displayQuantityText,
      unit: selectedWeight,
      price: baseUnitPrice,
      salePrice: baseUnitPrice,
      basePrice: selectedVariant?.compareAtPrice,
      imageUrl: images[0],
      thumbnailUrl: images[0],
    });
  };

  const handleBuyNow = () => {
    onBuyNow(selectedVariant.id, quantity);
  };

  const handleWishlistToggle = () => {
    toggleWishlist(product.id, {
      id: product.id,
      name: product.name,
      price: baseUnitPrice,
      regularPrice: selectedVariant?.compareAtPrice,
      imageUrl: images[0],
      unit: selectedWeight,
      variantId: selectedVariant?.id,
      slug: product.slug,
    });
  };

  return (
    <div className="max-w-5xl mx-auto my-6 px-4">
      {/* Top Navigation Back Link (Matching Screenshot 6) */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-emerald-800 transition mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-6 sm:p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Left Column: Image Gallery with 4 Thumbnails (Matching Screenshot 6) */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full rounded-3xl bg-slate-50 overflow-hidden border border-slate-100 shadow-inner flex items-center justify-center">
              <img
                src={images[selectedImageIndex] || images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleWishlistToggle}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md text-slate-500 hover:text-rose-500 transition"
                title="Add to Favourites"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isWishlisted(product.id) ? 'fill-rose-500 text-rose-500' : ''
                  }`}
                />
              </button>
            </div>

            {/* Row of 4 Thumbnails */}
            <div className="grid grid-cols-4 gap-3">
              {images.slice(0, 4).map((imgUrl: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-emerald-700 ring-2 ring-emerald-100'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Product Info & Customize Quantity Box (Matching Screenshot 6) */}
          <div className="text-left space-y-5">
            {/* Top Deal Timer Badge */}
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Liton Brother grocery
              </div>
              <div className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>270 : 13 : 10 : 24</span>
              </div>
            </div>

            {/* Product Title & Reviews */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-700">4.5 Rating</span>
                <span className="text-xs text-slate-400 font-medium">(189 reviews)</span>
              </div>
            </div>

            {/* Large Bold Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">৳{baseUnitPrice}</span>
              {product.basePrice && product.basePrice > baseUnitPrice && (
                <span className="text-base text-slate-400 line-through font-medium">
                  ৳{product.basePrice}
                </span>
              )}
            </div>

            {/* "Customize Quantity" Switcher Box (Matching Screenshot 6) */}
            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                {t('customizeQuantity')}
              </div>

              {/* Segmented Unit Buttons: [ KG ] / [ Gram ] */}
              <div className="grid grid-cols-2 gap-2 bg-slate-200/60 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUnitMode(primaryUnit);
                    setQuantity(1);
                  }}
                  className={`py-2 rounded-xl text-xs font-extrabold transition ${
                    selectedUnitMode === primaryUnit
                      ? 'bg-[#14532d] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {primaryUnit}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUnitMode(secondaryUnit);
                    setQuantity(1);
                  }}
                  className={`py-2 rounded-xl text-xs font-extrabold transition ${
                    selectedUnitMode === secondaryUnit
                      ? 'bg-[#14532d] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {secondaryUnit}
                </button>
              </div>

              {/* Stepper Control: [-] [ 1 KG ] [+] */}
              <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 p-2">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-black text-base text-slate-900 tracking-wide">
                  {displayQuantityText}
                </span>
                <button
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sub-bar: Total Price (Matching Screenshot 6) */}
              <div className="flex items-center justify-between pt-1 text-sm font-extrabold text-slate-800">
                <span className="text-slate-500 font-bold">{t('totalPrice')}:</span>
                <span className="text-xl font-black text-emerald-800">৳{calculatedTotal}</span>
              </div>
            </div>

            {/* Action Buttons: Add to Cart and Buy Now Side-by-Side (Matching Screenshot 6) */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                className="w-full py-3.5 rounded-full border-2 border-emerald-800 text-emerald-800 hover:bg-emerald-50 font-extrabold text-sm flex items-center justify-center gap-2 transition shadow-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{t('addToCart')}</span>
              </button>
              <button
                onClick={handleBuyNow}
                className="w-full py-3.5 rounded-full bg-[#14532d] hover:bg-[#0f3d20] text-white font-extrabold text-sm flex items-center justify-center gap-2 transition shadow-lg hover:shadow-xl"
              >
                <span>{t('buyNow')}</span>
              </button>
            </div>

            {/* Add to Wishlist link */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleWishlistToggle}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 transition inline-flex items-center gap-1.5"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isWishlisted(product.id) ? 'fill-rose-500 text-rose-500' : ''
                  }`}
                />
                <span>{isWishlisted(product.id) ? t('inWishlist') : t('addWishlist')}</span>
              </button>
            </div>

            {/* Categories & Description */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div>
                <span className="font-bold text-slate-800">Categories: </span>
                <span className="text-emerald-700 font-medium">
                  {product.category?.name || 'Groceries, Fresh, Pantry'}
                </span>
              </div>
              <p className="leading-relaxed text-slate-500">
                {product.description ||
                  'Crisp, hygienically packaged, sustainably sourced food essentials. Inspected daily for maximum nutritional freshness and safety.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
