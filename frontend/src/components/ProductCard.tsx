import React, { useState } from 'react';
import { ShoppingCart, Heart, Check, Plus, AlertCircle } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onOpenModal: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenModal }) => {
  const { addToCart, isWishlisted, toggleWishlist } = useCart();

  // Selected variant state (defaults to primary variant)
  const variants = product.variants && product.variants.length > 0 ? product.variants : [];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.find((v) => v.stockQuantity > 0) || variants[0] || null
  );

  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const currentSalePrice = selectedVariant ? selectedVariant.salePrice : product.salePrice;
  const currentBasePrice = selectedVariant ? selectedVariant.basePrice : product.basePrice;
  const currentStock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;
  const isOutOfStock = currentStock <= 0;

  const discountPercentage = currentBasePrice > currentSalePrice
    ? Math.round(((currentBasePrice - currentSalePrice) / currentBasePrice) * 100)
    : 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedVariant || isOutOfStock) return;

    setIsAdding(true);
    const result = await addToCart(selectedVariant.id, 1);
    setIsAdding(false);

    if (result.success) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    } else {
      alert(result.message || 'Could not add to cart');
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const wishlisted = isWishlisted(product.id);

  // Helper placeholder icon
  const getPlaceholderIcon = () => {
    const name = product.name.toLowerCase();
    if (name.includes('oil')) return '🛢️';
    if (name.includes('rice')) return '🍚';
    if (name.includes('turmeric') || name.includes('spices') || name.includes('chilli')) return '🌶️';
    if (name.includes('egg')) return '🥚';
    if (name.includes('atta') || name.includes('flour')) return '🌾';
    return '📦';
  };

  return (
    <div
      onClick={onOpenModal}
      className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer relative"
    >
      <div>
        {/* Top Badges & Wishlist */}
        <div className="flex items-center justify-between mb-2">
          {discountPercentage > 0 ? (
            <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
              -{discountPercentage}% OFF
            </span>
          ) : product.isBestSeller ? (
            <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
              ★ BEST SELLER
            </span>
          ) : (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              {product.brand?.name || 'Liton Brothers'}
            </span>
          )}

          <button
            onClick={handleWishlist}
            className={`p-1.5 rounded-full transition ${
              wishlisted
                ? 'text-rose-500 bg-rose-50'
                : 'text-slate-300 hover:text-rose-500 hover:bg-slate-100'
            }`}
            title="Add to wishlist"
          >
            <Heart className={`w-4 h-4 ${wishlisted ? 'fill-rose-500' : ''}`} />
          </button>
        </div>

        {/* Product Image / Icon */}
        <div className="h-36 bg-slate-50/80 rounded-xl flex items-center justify-center text-5xl mb-3 overflow-hidden group-hover:scale-105 transition duration-300">
          {product.images && product.images.length > 0 && product.images[0].imageUrl ? (
            <img
              src={product.images[0].imageUrl}
              alt={product.name}
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <span>{getPlaceholderIcon()}</span>
          )}
        </div>

        {/* Category & Brand info */}
        <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
          {product.brand?.name || 'Fresh'} • {product.category?.name || 'Grocery'}
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-900 text-sm mt-0.5 group-hover:text-emerald-700 transition line-clamp-1">
          {product.name}
        </h3>

        {/* Multi-Quantity Variant Selector Pills (Section 15) */}
        {variants.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
            {variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                  }`}
                >
                  {v.displayName}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Pricing & Add Action */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-slate-900">৳{currentSalePrice}</span>
              {currentBasePrice > currentSalePrice && (
                <span className="text-xs text-slate-400 line-through">৳{currentBasePrice}</span>
              )}
            </div>
            <div className="text-[10px] text-slate-400">
              {selectedVariant ? `Per ${selectedVariant.displayName}` : `Per ${product.unit}`}
            </div>
          </div>

          {/* Stock Indicator */}
          <div className="text-right">
            {isOutOfStock ? (
              <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Stock Out
              </span>
            ) : currentStock <= 5 ? (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                Only {currentStock} left!
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-600">
                In Stock
              </span>
            )}
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          disabled={isOutOfStock || isAdding}
          onClick={handleAdd}
          className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : justAdded
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600'
          }`}
        >
          {isOutOfStock ? (
            'Out of Stock'
          ) : isAdding ? (
            'Adding...'
          ) : justAdded ? (
            <>
              <Check className="w-3.5 h-3.5" /> Added to Basket
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" /> Add to Basket
            </>
          )}
        </button>
      </div>
    </div>
  );
};
