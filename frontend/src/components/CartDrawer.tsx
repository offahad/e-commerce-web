import React, { useState } from 'react';
import { X, ShoppingCart, Trash2, ArrowRight, Tag, Check, Sparkles, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    itemCount,
    subtotal,
    deliveryFee,
    freeDeliveryThreshold,
    freeDeliveryRemaining,
    discountAmount,
    grandTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    updateQuantity,
    removeItem,
    clearCart,
    openCheckout,
  } = useCart();

  const { isAuthenticated, isApproved, openAuthModal } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [applying, setApplying] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;

    setApplying(true);
    setCouponStatus(null);
    const res = await applyCoupon(code);
    setApplying(false);

    if (res.success) {
      setCouponStatus({ message: res.message || 'Coupon successfully applied!', isError: false });
      setCouponCode('');
    } else {
      setCouponStatus({ message: res.message || 'Invalid coupon code', isError: true });
    }
  };

  const handleProceed = () => {
    if (!isAuthenticated) {
      closeCart();
      openAuthModal('login');
      return;
    }
    if (!isApproved) {
      alert('Your account is currently PENDING_APPROVAL. An administrator will review your account shortly before you can place orders.');
      return;
    }
    openCheckout();
  };

  const freeDeliveryProgress = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Your Basket</h2>
                <div className="text-xs text-slate-500">{itemCount} items selected</div>
              </div>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Delivery Threshold Bar */}
          <div className="bg-emerald-50/70 p-3.5 border-b border-emerald-100 text-xs">
            {freeDeliveryRemaining > 0 ? (
              <div>
                <div className="flex justify-between font-semibold text-emerald-950 mb-1.5">
                  <span>Add <strong className="text-emerald-700">৳{freeDeliveryRemaining.toFixed(0)}</strong> more for <strong>FREE Delivery</strong></span>
                  <span className="font-bold">{freeDeliveryProgress}%</span>
                </div>
                <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${freeDeliveryProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Congratulations! You unlocked FREE Delivery inside Dhaka!</span>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-3">🛒</div>
                <h3 className="text-base font-bold text-slate-800">Your basket is empty</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Stock up on cooking oil, aromatic rice, and pure spices at wholesale prices.
                </p>
                <button
                  onClick={closeCart}
                  className="mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition"
                >
                  {/* Item Icon / Thumbnail */}
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-2xl border border-slate-100 shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-contain p-1" />
                    ) : (
                      '📦'
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {item.productName || item.name || 'Grocery Item'}
                    </h4>
                    <div className="text-[11px] font-semibold text-emerald-700">
                      {item.variantName}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1">
                      ৳{Number(item.unitPrice || item.price || 0).toFixed(2)}
                    </div>
                  </div>

                  {/* Stepper */}
                  <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shrink-0">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      -
                    </button>
                    <span className="px-2.5 py-1 text-xs font-black text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Coupon Code & Price Breakdown Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-slate-100 bg-white p-4 sm:p-5 space-y-4">
              {/* Promotional Coupon Box */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Promotional Voucher / Coupon:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. RAMADAN20"
                      className="w-full pl-8 pr-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  <button
                    disabled={applying}
                    onClick={() => handleApplyCoupon()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-60"
                  >
                    {applying ? 'Checking...' : 'Apply'}
                  </button>
                </div>

                {/* Quick Coupon Chips */}
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  <button
                    onClick={() => handleApplyCoupon('RAMADAN20')}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition"
                  >
                    RAMADAN20 (20% OFF)
                  </button>
                  <button
                    onClick={() => handleApplyCoupon('LITON100')}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition"
                  >
                    LITON100 (৳100 OFF)
                  </button>
                  <button
                    onClick={() => handleApplyCoupon('FREEDEL')}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition"
                  >
                    FREEDEL (Free Delivery)
                  </button>
                </div>

                {couponStatus && (
                  <div
                    className={`mt-2 text-xs font-semibold flex items-center gap-1 ${
                      couponStatus.isError ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {couponStatus.isError ? <AlertCircle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{couponStatus.message}</span>
                  </div>
                )}

                {appliedCoupon && (
                  <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      {appliedCoupon.code} applied (-৳{appliedCoupon.discountAmount.toFixed(2)})
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-rose-600 hover:underline text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Server Price Authority Totals */}
              <div className="space-y-1.5 pt-2 text-xs border-t border-slate-100">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">৳{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Promotional Discount:</span>
                    <span>-৳{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Dhaka Delivery Fee:</span>
                  <span className="font-semibold text-slate-800">
                    {deliveryFee === 0 ? <strong className="text-emerald-600">FREE</strong> : `৳${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total (BDT):</span>
                  <span className="text-base text-emerald-700">৳{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Action */}
              <button
                onClick={handleProceed}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition transform active:scale-98"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={clearCart}
                className="w-full text-center text-[11px] text-slate-400 hover:text-rose-500 transition"
              >
                Clear all items from basket
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
