import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Check, Heart, ShieldCheck, Truck, RotateCcw, AlertTriangle } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

interface ProductDetailModalProps {
  slug: string | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ slug, onClose }) => {
  const { addToCart, openCheckout, isWishlisted, toggleWishlist } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await api.getProductBySlug(slug);
        if (res.success && res.data) {
          setProduct(res.data);
          const vars = res.data.variants || [];
          setSelectedVariant(vars.find((v: any) => v.stockQuantity > 0) || vars[0] || null);
          setQuantity(1);
        }
      } catch (err) {
        console.error('Error fetching product details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  if (!slug) return null;

  const currentSalePrice = selectedVariant ? selectedVariant.salePrice : (product?.salePrice || 0);
  const currentBasePrice = selectedVariant ? selectedVariant.basePrice : (product?.basePrice || 0);
  const currentStock = selectedVariant ? selectedVariant.stockQuantity : (product?.stockQuantity || 0);
  const isOutOfStock = currentStock <= 0;

  const savings = currentBasePrice > currentSalePrice ? (currentBasePrice - currentSalePrice) * quantity : 0;

  const handleAddToCart = async () => {
    if (!selectedVariant || isOutOfStock) return;
    setAdding(true);
    const res = await addToCart(selectedVariant.id, quantity, {
      id: product.id,
      productId: product.id,
      name: product.name,
      productName: product.name,
      variantName: selectedVariant.displayName,
      unit: selectedVariant.displayName,
      price: currentSalePrice || currentBasePrice,
      salePrice: currentSalePrice,
      basePrice: currentBasePrice,
      imageUrl: product.images?.[0]?.imageUrl || product.primaryImage,
      thumbnailUrl: product.images?.[0]?.imageUrl || product.primaryImage,
      maxPerCustomer: product.maxPerCustomer,
    });
    setAdding(false);
    if (res.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } else {
      alert(res.message || 'Could not add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!selectedVariant || isOutOfStock) return;
    const res = await addToCart(selectedVariant.id, quantity, {
      id: product.id,
      productId: product.id,
      name: product.name,
      productName: product.name,
      variantName: selectedVariant.displayName,
      unit: selectedVariant.displayName,
      price: currentSalePrice || currentBasePrice,
      salePrice: currentSalePrice,
      basePrice: currentBasePrice,
      imageUrl: product.images?.[0]?.imageUrl || product.primaryImage,
      thumbnailUrl: product.images?.[0]?.imageUrl || product.primaryImage,
      maxPerCustomer: product.maxPerCustomer,
    });
    if (res.success) {
      onClose();
      openCheckout();
    } else {
      alert(res.message || 'Could not proceed to checkout');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading product information...</div>
        ) : !product ? (
          <div className="p-12 text-center text-slate-500">Product not found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 p-4 sm:p-8 gap-4 sm:gap-8">
            {/* Left: Product Visuals */}
            <div>
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-8 flex items-center justify-center text-6xl sm:text-8xl h-48 sm:h-64 border border-slate-100">
                {product.images && product.images.length > 0 && product.images[0].imageUrl ? (
                  <img
                    src={product.images[0].imageUrl}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span>
                    {product.name.toLowerCase().includes('oil')
                      ? '🛢️'
                      : product.name.toLowerCase().includes('rice')
                      ? '🍚'
                      : product.name.toLowerCase().includes('egg')
                      ? '🥚'
                      : '📦'}
                  </span>
                )}
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <span className="text-[10px] font-bold text-slate-700 block">100% Genuine</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <Truck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <span className="text-[10px] font-bold text-slate-700 block">Dhaka Express</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <RotateCcw className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <span className="text-[10px] font-bold text-slate-700 block">Doorstep Check</span>
                </div>
              </div>
            </div>

            {/* Right: Product Details & Variant Chooser */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {product.brand?.name || 'Fresh'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">SKU: {selectedVariant?.sku || product.sku}</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {product.name}
                </h1>

                {/* Price */}
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-3xl font-black text-emerald-700">
                    ৳{currentSalePrice}
                  </span>
                  {currentBasePrice > currentSalePrice && (
                    <span className="text-base text-slate-400 line-through">
                      ৳{currentBasePrice}
                    </span>
                  )}
                  {savings > 0 && (
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      Save ৳{savings.toFixed(0)}
                    </span>
                  )}
                </div>

                {/* Multi-Quantity Variant Pills (Section 15) */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mt-5">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block mb-2">
                      Select Available Size / Quantity:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {product.variants.map((v) => {
                        const isSelected = selectedVariant?.id === v.id;
                        const isVarOutOfStock = v.stockQuantity <= 0;
                        return (
                          <button
                            key={v.id}
                            disabled={isVarOutOfStock}
                            onClick={() => setSelectedVariant(v)}
                            className={`p-2.5 rounded-xl text-left border transition flex items-center justify-between ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20 text-emerald-950 font-bold'
                                : isVarOutOfStock
                                ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                                : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-800 font-semibold'
                            }`}
                          >
                            <div>
                              <div className="text-xs">{v.displayName}</div>
                              <div className="text-[11px] text-slate-500 font-mono">৳{v.salePrice}</div>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Stock Indicator */}
                <div className="mt-4 text-xs font-semibold flex items-center gap-1.5">
                  {isOutOfStock ? (
                    <span className="text-rose-600 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> Currently Out of Stock at Dhaka Warehouse
                    </span>
                  ) : currentStock <= 5 ? (
                    <span className="text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> Hurry! Only {currentStock} units remaining in stock
                    </span>
                  ) : (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Ready to dispatch ({currentStock} available in warehouse)
                    </span>
                  )}
                </div>

                {/* Quantity Stepper */}
                {!isOutOfStock && (
                  <div className="mt-5 flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-700 uppercase">Quantity:</span>
                    <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 font-bold transition"
                      >
                        -
                      </button>
                      <span className="px-4 py-1.5 text-xs font-extrabold text-slate-900 bg-white">
                        {quantity}
                      </span>
                      <button
                        disabled={Boolean(product.maxPerCustomer && quantity >= product.maxPerCustomer)}
                        onClick={() =>
                          setQuantity((q) => {
                            const max = product.maxPerCustomer ? Math.min(currentStock, product.maxPerCustomer) : currentStock;
                            return Math.min(max, q + 1);
                          })
                        }
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition"
                        title={product.maxPerCustomer && quantity >= product.maxPerCustomer ? `Limit of ${product.maxPerCustomer} reached` : 'Increase'}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                <button
                  disabled={isOutOfStock || adding}
                  onClick={handleAddToCart}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                    isOutOfStock
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : added
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                  }`}
                >
                  {isOutOfStock ? (
                    'Out of Stock'
                  ) : adding ? (
                    'Adding...'
                  ) : added ? (
                    <>
                      <Check className="w-4 h-4" /> Added to Basket
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" /> Add to Basket
                    </>
                  )}
                </button>

                <button
                  disabled={isOutOfStock}
                  onClick={handleBuyNow}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white shadow-md transition disabled:bg-slate-200 disabled:text-slate-400"
                >
                  Buy Now with 1-Click
                </button>

                <button
                  type="button"
                  onClick={() =>
                    toggleWishlist(product.id, {
                      id: product.id,
                      name: product.name,
                      price: selectedVariant?.salePrice || selectedVariant?.price || product.basePrice,
                      regularPrice: selectedVariant?.compareAtPrice,
                      imageUrl: product.images?.[0]?.url || product.primaryImage,
                      unit: selectedVariant?.displayName || '1 Pack',
                      variantId: selectedVariant?.id,
                      slug: product.slug,
                    })
                  }
                  className={`p-3 rounded-xl border transition flex items-center justify-center ${
                    isWishlisted(product.id)
                      ? 'text-rose-500 bg-rose-50 border-rose-200'
                      : 'text-slate-400 hover:text-rose-500 hover:bg-slate-50 border-slate-200'
                  }`}
                  title="Save to favourites"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted(product.id) ? 'fill-rose-500' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
