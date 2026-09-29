import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  Clock,
  MapPin,
  Edit2,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Tag,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  Check,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface CartPageProps {
  onProceedToCheckout: () => void;
  onContinueShopping: () => void;
  onOpenAccountAddresses: () => void;
}

// Smart image fallback matcher for grocery items
const getGroceryImage = (item: any): string => {
  if (item.imageUrl && !item.imageUrl.includes('placeholder')) return item.imageUrl;
  if (item.thumbnailUrl && !item.thumbnailUrl.includes('placeholder')) return item.thumbnailUrl;

  const text = `${item.productName || item.name || ''} ${item.variantName || ''}`.toLowerCase();
  if (text.includes('rice') || text.includes('chal') || text.includes('miniket') || text.includes('chinigura') || text.includes('bag')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300&q=80';
  }
  if (text.includes('egg') || text.includes('dim') || text.includes('tray') || text.includes('pieces')) {
    return 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=300&q=80';
  }
  if (text.includes('oil') || text.includes('tel') || text.includes('soybean') || text.includes('mustard')) {
    return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=300&q=80';
  }
  if (text.includes('potato') || text.includes('alu')) {
    return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=300&q=80';
  }
  if (text.includes('onion') || text.includes('pyaj')) {
    return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=300&q=80';
  }
  if (text.includes('milk') || text.includes('dudh')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80';
  }
  if (text.includes('avocado')) {
    return 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=300&q=80';
  }
  if (text.includes('beetroot')) {
    return 'https://images.unsplash.com/photo-1588615419957-4627dff1645e?auto=format&fit=crop&w=300&q=80';
  }
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80';
};

export const CartPage: React.FC<CartPageProps> = ({
  onProceedToCheckout,
  onContinueShopping,
  onOpenAccountAddresses,
}) => {
  const { t } = useLanguage();
  const {
    cartItems: items,
    subtotal,
    updateQuantity,
    removeItem,
    clearCart,
    deliveryFee,
    freeDeliveryThreshold,
    freeDeliveryRemaining,
    grandTotal,
    discountAmount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const { user, isAuthenticated } = useAuth();

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Delivery Instructions / Rider Note state
  const [deliveryNote, setDeliveryNote] = useState('Leave with building guard / reception');

  // Saved Delivery Address State with Memory (Auto-fill)
  const [savedAddress, setSavedAddress] = useState<{
    name: string;
    phone: string;
    address: string;
    area: string;
  }>(() => {
    const stored = localStorage.getItem('lb_saved_delivery_address');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return {
      name: user?.fullName || 'Approved Demo Customer',
      phone: user?.phone || '01800000000',
      address: 'House 42, Road 5, Block C',
      area: 'Banani, Dhaka 1213',
    };
  });

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editForm, setEditForm] = useState(savedAddress);

  // Sync with user profile addresses if authenticated
  useEffect(() => {
    const fetchUserAddress = async () => {
      if (isAuthenticated) {
        try {
          const res = await api.getCustomerAddresses();
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const def = res.data.find((a: any) => a.isDefault) || res.data[0];
            const addrObj = {
              name: def.recipientName || user?.fullName || 'Approved Customer',
              phone: def.phone || user?.phone || '01800000000',
              address: def.addressLine || 'House 42, Road 5, Block C',
              area: `${def.area || 'Banani'}, ${def.city || 'Dhaka'}`,
            };
            setSavedAddress(addrObj);
            setEditForm(addrObj);
            localStorage.setItem('lb_saved_delivery_address', JSON.stringify(addrObj));
          }
        } catch (err) {
          console.error('Failed to load user address', err);
        }
      }
    };
    fetchUserAddress();
  }, [isAuthenticated, user]);

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedAddress(editForm);
    localStorage.setItem('lb_saved_delivery_address', JSON.stringify(editForm));
    setIsEditingAddress(false);
  };

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) return;
    setIsApplyingCoupon(true);
    setCouponError(null);
    setCouponSuccess(null);
    const res = await applyCoupon(code);
    setIsApplyingCoupon(false);
    if (res.success) {
      setCouponSuccess(res.message || `Coupon ${code} applied successfully!`);
      setCouponInput('');
    } else {
      setCouponError(res.message || 'Invalid coupon code');
    }
  };

  const freeDeliveryProgress = Math.min(100, Math.round(((freeDeliveryThreshold - freeDeliveryRemaining) / freeDeliveryThreshold) * 100));

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto my-12 px-4 text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center text-3xl mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">{t('shoppingCart')} is Empty</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
          Explore our fresh vegetable rails, daily deals, and organic essentials to fill your basket.
        </p>
        <button
          onClick={onContinueShopping}
          className="mt-6 px-8 py-3 bg-[#14532d] text-white font-bold rounded-full text-sm hover:bg-emerald-900 transition shadow-lg"
        >
          {t('continueShopping')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-8 px-4 text-left">
      {/* Top Header Row with Title and Express Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {t('shoppingCart')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review items, apply voucher discounts, and confirm delivery details.
          </p>
        </div>

        {/* 15-Min Express Delivery Pill */}
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-4 py-2 rounded-full text-xs font-bold w-fit shadow-xs">
          <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{t('estDelivery')}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2 Cols): Cart Items List & Delivery Extras */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Items Box */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm">
            {/* Header Row: Items Count & Clear All */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-800">
                  Selected Groceries
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => clearCart()}
                className="text-xs font-bold text-rose-500 hover:text-rose-700 transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('clearAll')}</span>
              </button>
            </div>

            {/* Cart Item Rows */}
            <div className="divide-y divide-slate-100">
              {items.map((item) => {
                // Defensive parsing to guarantee no NaN and accurate titles
                const pName = item.productName || item.name || 'Fresh Grocery Essential';
                const vName = item.variantName || 'Standard Pack';
                const unitPrice = Number(item.unitPrice ?? item.price ?? item.salePrice ?? 0);
                const quantity = Number(item.quantity ?? 1);
                const lineTotal = Number(item.totalPrice ?? item.lineTotal ?? (unitPrice * quantity));
                const imageSrc = getGroceryImage(item);

                return (
                  <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Square thumbnail with high quality fallback */}
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                        <img
                          src={imageSrc}
                          alt={pName}
                          className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Title, Variant & Unit Price */}
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate">
                          {pName}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {/* Variant / Pack badge */}
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {vName}
                          </span>

                          {/* Unit price */}
                          <span className="text-xs font-semibold text-slate-400">
                            ৳{unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each
                          </span>
                        </div>

                        {/* Stock & Delivery availability */}
                        <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>In Stock • Ready for 15-min delivery</span>
                        </div>
                      </div>
                    </div>

                    {/* Stepper [-] Qty [+] & Line Total Price */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pl-19 sm:pl-0">
                      {/* Interactive Stepper Pill */}
                      <div className="flex items-center bg-slate-100 rounded-full px-2 py-1 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            if (quantity > 1) updateQuantity(item.id, quantity - 1);
                            else removeItem(item.id);
                          }}
                          className="w-6 h-6 rounded-full bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-200 flex items-center justify-center transition shadow-xs font-bold"
                          title={quantity === 1 ? 'Remove from cart' : 'Decrease quantity'}
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span className="text-xs font-black text-slate-900 min-w-[28px] text-center px-1">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, quantity + 1)}
                          className="w-6 h-6 rounded-full bg-[#14532d] text-white hover:bg-emerald-900 flex items-center justify-center transition shadow-xs font-bold"
                          title="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Total in Taka (Never NaN!) */}
                      <div className="text-right min-w-[90px]">
                        <div className="font-black text-slate-900 text-base sm:text-lg">
                          ৳{lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>

                      {/* Remove Trash Button */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Instructions / Rider Note Card (Modern E-Commerce Standard) */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-emerald-800" />
              <h3 className="font-bold text-slate-900 text-sm">Delivery Instructions for Rider</h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                'Leave with building guard / reception',
                'Call before arriving',
                'Do not ring doorbell',
                'Leave outside the door',
              ].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDeliveryNote(opt)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition font-semibold ${
                    deliveryNote === opt
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              placeholder="Add custom apartment entry instructions or landmarks..."
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-none bg-slate-50/50"
            />
          </div>
        </div>

        {/* Right Column (1 Col): Order Summary, Promos & Delivery Address */}
        <div className="space-y-6">
          {/* Order Summary Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-slate-900">{t('orderSummary')}</h2>

            {/* Free Delivery Threshold Bar */}
            <div className="bg-emerald-50/80 rounded-2xl p-3 border border-emerald-100 text-xs">
              {freeDeliveryRemaining > 0 ? (
                <div>
                  <div className="flex justify-between font-bold text-emerald-950 mb-1.5">
                    <span>Add ৳{freeDeliveryRemaining.toFixed(0)} more for FREE Delivery</span>
                    <span>{freeDeliveryProgress}%</span>
                  </div>
                  <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${freeDeliveryProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Congratulations! You qualify for FREE Delivery!</span>
                </div>
              )}
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2.5 pt-1 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>{t('subtotal')}</span>
                <span className="font-bold text-slate-900">
                  ৳{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between">
                <span>{t('delivery')}</span>
                <span className="font-bold text-emerald-700">
                  {deliveryFee === 0 ? 'Free' : `৳${deliveryFee.toFixed(2)}`}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Coupon ({appliedCoupon?.code})</span>
                  </span>
                  <span>-৳{discountAmount.toFixed(2)}</span>
                </div>
              )}

              {/* Total Row */}
              <div className="flex justify-between items-baseline pt-3 border-t border-slate-100">
                <span className="text-base font-black text-slate-900">{t('total')}</span>
                <span className="text-2xl font-black text-[#14532d]">
                  ৳{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Promo Code Input Box */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Have a Promo Code?</span>
                </span>
                {appliedCoupon && (
                  <button
                    onClick={removeCoupon}
                    className="text-[11px] text-rose-600 hover:underline font-bold"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="e.g. RAMADAN20"
                  className="flex-1 uppercase font-mono text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={isApplyingCoupon || !couponInput.trim()}
                  onClick={() => handleApplyCoupon()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold transition"
                >
                  {isApplyingCoupon ? '...' : 'Apply'}
                </button>
              </div>

              {couponSuccess && (
                <div className="mt-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  ✓ {couponSuccess}
                </div>
              )}
              {couponError && (
                <div className="mt-2 text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                  ✕ {couponError}
                </div>
              )}

              {/* Quick Coupon Chips */}
              <div className="flex gap-1.5 mt-2.5">
                <button
                  type="button"
                  onClick={() => handleApplyCoupon('RAMADAN20')}
                  className="text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md hover:bg-amber-100 transition"
                >
                  RAMADAN20 (20% OFF)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyCoupon('FREEDEL')}
                  className="text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition"
                >
                  FREEDEL (Free Delivery)
                </button>
              </div>
            </div>

            {/* Primary Action Buttons placed right in the summary! */}
            <div className="pt-3 space-y-2.5">
              <button
                type="button"
                onClick={onProceedToCheckout}
                className="w-full py-4 rounded-full bg-[#14532d] hover:bg-[#0f3d20] text-white font-extrabold text-sm flex items-center justify-center gap-2 transition shadow-lg hover:shadow-xl active:scale-[0.99]"
              >
                <span>{t('proceedToCheckout')}</span>
                <span>•</span>
                <span>৳{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                type="button"
                onClick={onContinueShopping}
                className="w-full py-2.5 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center transition"
              >
                <span>{t('continueShopping')}</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>BSTI Certified Fresh</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>bKash, Nagad & COD</span>
              </div>
            </div>
          </div>

          {/* Delivery Address Card with Memory & Auto-fill */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
                <MapPin className="w-4 h-4 text-emerald-800" />
                <span>{t('deliveryAddress')}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingAddress(!isEditingAddress)}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingAddress ? 'Cancel' : t('edit')}</span>
              </button>
            </div>

            {isEditingAddress ? (
              <form onSubmit={handleSaveAddress} className="space-y-3 pt-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Recipient Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Recipient Name"
                    required
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Contact Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="Phone (e.g. 01800000000)"
                    required
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Street Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="House, Road, Block"
                    required
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Area & District</label>
                  <input
                    type="text"
                    value={editForm.area}
                    onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                    placeholder="Banani, Dhaka 1213"
                    required
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-none mt-1"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 transition"
                >
                  Save Address & Remember
                </button>
              </form>
            ) : (
              <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="font-bold text-slate-900 text-sm">{savedAddress.name}</div>
                <div className="font-mono text-slate-500 font-semibold">{savedAddress.phone}</div>
                <div className="text-slate-700">{savedAddress.address}</div>
                <div className="text-slate-400">{savedAddress.area}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
