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

export const CartPage: React.FC<CartPageProps> = ({
  onProceedToCheckout,
  onContinueShopping,
  onOpenAccountAddresses,
}) => {
  const { t } = useLanguage();
  const { cartItems: items, subtotal, updateQuantity, removeItem, clearCart, deliveryFee, grandTotal } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Saved Delivery Address State with Memory (Auto-fill)
  const [savedAddress, setSavedAddress] = useState<{
    name: string;
    phone: string;
    address: string;
    area: string;
  }>(() => {
    // Check localStorage first for persisted remembered address
    const stored = localStorage.getItem('lb_saved_delivery_address');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return {
      name: user?.fullName || 'John Doe',
      phone: user?.phone || '+880 1234-567890',
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
          const res = await api.getAddresses();
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const def = res.data.find((a: any) => a.isDefault) || res.data[0];
            const addrObj = {
              name: def.recipientName || user?.fullName || 'Valued Customer',
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
      {/* Header (Matching Screenshot 7) */}
      <h1 className="text-3xl font-black text-slate-900 mb-6">
        {t('shoppingCart')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Cart Items List (Matching Screenshot 7) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          {/* Header Row: 2 Items & Clear All */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <span className="text-sm font-bold text-slate-500">
              {items.length} {t('items')}
            </span>
            <button
              onClick={() => clearCart()}
              className="text-xs font-bold text-rose-500 hover:text-rose-700 transition"
            >
              {t('clearAll')}
            </button>
          </div>

          {/* Cart Item Rows */}
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Square thumbnail */}
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={item.thumbnailUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Title & Unit */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {item.name}
                    </h3>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">
                      {item.variantName || '1 pack'}
                    </div>

                    {/* Stepper [-] Qty [+] (Matching Screenshot 7: pill stepper) */}
                    <div className="flex items-center gap-2 mt-2 bg-slate-100 rounded-full px-2 py-0.5 w-fit">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="text-slate-600 hover:text-slate-900 p-0.5 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-black text-slate-800 min-w-[16px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="text-slate-600 hover:text-slate-900 p-0.5 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Price & Delete Trash Icon */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-black text-slate-900 text-base">
                      ৳{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-slate-400 hover:text-rose-500 transition p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Order Summary & Delivery Address Card (Matching Screenshot 7) */}
        <div className="space-y-6">
          {/* Order Summary Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-slate-900">{t('orderSummary')}</h2>

            {/* 15 Mins Delivery Banner (Matching Screenshot 7: Soft green pill) */}
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-100 px-4 py-2.5 rounded-2xl text-xs font-bold">
              <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{t('estDelivery')}</span>
            </div>

            <div className="space-y-2 pt-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>{t('subtotal')}</span>
                <span className="font-bold text-slate-900">৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('delivery')}</span>
                <span className="font-bold text-emerald-700">
                  {subtotal >= 1000 ? t('free') : `৳${deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-100 text-base font-black text-slate-900">
                <span>{t('total')}</span>
                <span className="text-xl text-emerald-900">৳{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address Card with Memory & Auto-fill (Matching Screenshot 7) */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
                <MapPin className="w-4 h-4 text-emerald-800" />
                <span>{t('deliveryAddress')}</span>
              </div>
              <button
                onClick={() => setIsEditingAddress(!isEditingAddress)}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                <span>{t('edit')}</span>
              </button>
            </div>

            {isEditingAddress ? (
              <form onSubmit={handleSaveAddress} className="space-y-3 pt-2">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Recipient Name"
                  required
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-none"
                />
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="Phone (e.g. +880 1800-000000)"
                  required
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-none"
                />
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Street Address / House / Road"
                  required
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-none"
                />
                <input
                  type="text"
                  value={editForm.area}
                  onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                  placeholder="Area, City (e.g. Banani, Dhaka)"
                  required
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 transition"
                >
                  Save Address & Remember
                </button>
              </form>
            ) : (
              <div className="text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-900">{savedAddress.name}</div>
                <div className="font-mono text-slate-500">{savedAddress.phone}</div>
                <div>{savedAddress.address}</div>
                <div className="text-slate-400">{savedAddress.area}</div>
              </div>
            )}
          </div>

          {/* Action Buttons (Matching Screenshot 7) */}
          <div className="space-y-3">
            <button
              onClick={onProceedToCheckout}
              className="w-full py-4 rounded-full bg-[#14532d] hover:bg-emerald-950 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition shadow-lg hover:shadow-xl"
            >
              <span>{t('proceedToCheckout')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onContinueShopping}
              className="w-full py-3 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center transition"
            >
              <span>{t('continueShopping')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
