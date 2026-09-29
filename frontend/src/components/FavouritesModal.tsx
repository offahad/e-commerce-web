import React from 'react';
import { X, Heart, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

export const FavouritesModal: React.FC = () => {
  const {
    favouriteItems,
    isFavouritesOpen,
    closeFavourites,
    toggleFavourite,
    cartItems,
    addToCart,
    updateQuantity,
    removeItem,
  } = useCart();

  const { t } = useLanguage();

  if (!isFavouritesOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-8 shadow-2xl border border-slate-100 relative overflow-hidden text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">My Favourite Items</h2>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                  {favouriteItems.length} {favouriteItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-xs text-slate-500">Your personalized wishlist for quick reordering</p>
            </div>
          </div>
          <button
            onClick={closeFavourites}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {favouriteItems.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto text-2xl">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-800">Your Favourites list is empty</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Tap the heart icon (♡) on any fresh vegetable, cooking oil, or grocery staple to save your favorites here.
              </p>
              <button
                onClick={closeFavourites}
                className="mt-3 px-6 py-2.5 bg-[#14532d] hover:bg-emerald-950 text-white font-bold text-xs rounded-full shadow transition"
              >
                Explore Grocery Catalog
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {favouriteItems.map((item) => {
                const ci = cartItems.find(
                  (c) =>
                    (item.variantId && c.variantId === item.variantId) ||
                    c.productId === item.id ||
                    (c.name && item.name && c.name.toLowerCase().trim() === item.name.toLowerCase().trim())
                );
                const cartQty = ci ? ci.quantity : 0;

                return (
                  <div key={item.id} className="py-3.5 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src={
                            item.imageUrl ||
                            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80'
                          }
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-emerald-800 transition">
                          {item.name}
                        </h4>
                        <div className="text-xs text-slate-400 font-medium">{item.unit || '1 Pack'}</div>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="font-black text-slate-900 text-sm">৳{item.price}</span>
                          {item.regularPrice && item.regularPrice > item.price && (
                            <span className="text-[11px] text-slate-400 line-through">
                              ৳{item.regularPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Stepper / Add to Cart & Remove */}
                    <div className="flex items-center gap-2 shrink-0">
                      {cartQty > 0 && ci ? (
                        <div className="flex items-center justify-between bg-emerald-800 text-white rounded-full px-2 py-1 shadow-sm min-w-[95px] text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              if (cartQty > 1) updateQuantity(ci.id, cartQty - 1);
                              else removeItem(ci.id);
                            }}
                            className="w-5 h-5 rounded-full bg-emerald-900 hover:bg-emerald-950 flex items-center justify-center transition active:scale-90"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-xs px-2 text-center">{cartQty}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(ci.id, cartQty + 1)}
                            className="w-5 h-5 rounded-full bg-emerald-900 hover:bg-emerald-950 flex items-center justify-center transition active:scale-90"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(item.variantId || 'v-' + item.id, 1, item)}
                          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-800 text-emerald-800 hover:text-white border border-emerald-200 hover:border-emerald-800 rounded-full font-bold text-xs flex items-center gap-1 transition shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}

                      {/* Remove from Favourites Button */}
                      <button
                        type="button"
                        onClick={() => toggleFavourite(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition"
                        title="Remove from Favourites"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {favouriteItems.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Items saved in your account & device
            </span>
            <button
              onClick={closeFavourites}
              className="px-5 py-2 bg-[#14532d] hover:bg-emerald-950 text-white font-bold text-xs rounded-full shadow transition"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
