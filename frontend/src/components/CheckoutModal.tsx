import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Truck, CreditCard, Banknote, Sparkles, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface CheckoutModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOrderSuccess?: (trackingNo: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  onOrderSuccess,
}) => {
  const {
    isCheckoutOpen,
    closeCheckout,
    cartItems,
    subtotal,
    deliveryFee,
    grandTotal,
    discountAmount,
    appliedCoupon,
    clearCart,
    trackOrderNumber,
  } = useCart();

  const { user } = useAuth();

  const isModalVisible = propIsOpen !== undefined ? propIsOpen : isCheckoutOpen;
  const handleClose = () => {
    if (propOnClose) propOnClose();
    else closeCheckout();
  };

  // Saved Delivery Address Memory (Auto-fill on 2nd+ orders or profile)
  const [recipientName, setRecipientName] = useState(() => {
    const stored = localStorage.getItem('lb_saved_delivery_address');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.name) return parsed.name;
      } catch (e) {}
    }
    return user?.fullName || 'John Doe';
  });

  const [recipientPhone, setRecipientPhone] = useState(() => {
    const stored = localStorage.getItem('lb_saved_delivery_address');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.phone) return parsed.phone;
      } catch (e) {}
    }
    return user?.phone || '+880 1234-567890';
  });

  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    const stored = localStorage.getItem('lb_saved_delivery_address');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.address) return parsed.area ? `${parsed.address}, ${parsed.area}` : parsed.address;
      } catch (e) {}
    }
    return 'House 42, Road 5, Block C, Banani, Dhaka 1213';
  });

  const [deliverySlot, setDeliverySlot] = useState('Evening Slot (6 PM - 9 PM)');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BKASH' | 'NAGAD' | 'CARD'>('COD');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Placed order outcome
  const [orderResult, setOrderResult] = useState<{
    orderNumber: string;
    trackingNumber: string;
    grandTotal: number;
    paymentMethod: string;
    paymentInstructions?: string;
    paymentUrl?: string;
  } | null>(null);

  if (!isModalVisible) return null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientPhone.trim() || !deliveryAddress.trim()) {
      setError('Please fill in your recipient name, phone, and complete delivery address.');
      return;
    }

    // Enforce maxPerCustomer flash deal limits
    for (const item of cartItems) {
      if (item.maxPerCustomer && item.quantity > item.maxPerCustomer) {
        setError(`Item '${item.name}' exceeds the maximum allowed limit of ${item.maxPerCustomer} units per customer for this deal. Please adjust your basket quantity.`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        items: cartItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        couponCode: appliedCoupon?.code,
        paymentMethod,
        deliverySlot,
        customerNotes,
        deliveryAddress: {
          name: recipientName.trim(),
          phone: recipientPhone.trim(),
          address: deliveryAddress.trim(),
          district: 'Dhaka',
          division: 'Dhaka',
        },
      };

      const res = await api.placeOrder(payload);

      if (res.success && res.data) {
        // Persist delivery address to memory for auto-fill on all future orders
        localStorage.setItem(
          'lb_saved_delivery_address',
          JSON.stringify({
            name: recipientName.trim(),
            phone: recipientPhone.trim(),
            address: deliveryAddress.trim(),
            area: 'Dhaka',
          })
        );

        // Store order into customer orders memory so it appears instantly in Orders & Status Tracking
        try {
          const storedOrders = JSON.parse(localStorage.getItem('lb_customer_orders') || '[]');
          storedOrders.unshift({
            id: res.data.order.id,
            orderNumber: res.data.order.orderNumber,
            trackingNumber: res.data.order.trackingNumber,
            createdAt: res.data.order.createdAt || new Date().toISOString(),
            grandTotal: res.data.order.grandTotal,
            paymentMethod: res.data.order.paymentMethod,
            paymentStatus: res.data.order.paymentStatus || 'PENDING',
            status: res.data.order.status || 'CONFIRMED',
            deliveryAddress: deliveryAddress.trim(),
            recipientName: recipientName.trim(),
            recipientPhone: recipientPhone.trim(),
            items: cartItems.map((it) => ({
              productName: it.name,
              variantName: (it as any).unit || (it as any).variantName || 'Standard',
              quantity: it.quantity,
              totalPrice: (it.salePrice || it.price) * it.quantity,
              imageUrl: it.imageUrl,
            })),
          });
          localStorage.setItem('lb_customer_orders', JSON.stringify(storedOrders));
        } catch (e) {}

        setOrderResult({
          orderNumber: res.data.order.orderNumber,
          trackingNumber: res.data.order.trackingNumber,
          grandTotal: res.data.order.grandTotal,
          paymentMethod: res.data.order.paymentMethod,
          paymentInstructions: res.data.payment?.instructions,
          paymentUrl: res.data.payment?.paymentUrl,
        });
        await clearCart();
        if (onOrderSuccess) {
          onOrderSuccess(res.data.order.trackingNumber);
        }
      } else {
        setError(res.message || 'Order could not be processed. Please check item stock.');
      }
    } catch (err: any) {
      setError(err.message || 'Order placement failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full my-2 sm:my-8 shadow-2xl border border-slate-100 relative overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                {orderResult ? 'Order Placed Successfully!' : 'Instant Doorstep Checkout'}
              </h2>
              <span className="text-[11px] sm:text-xs text-slate-500">
                {orderResult ? 'Liton Brothers Dhaka Central Hub' : 'Server-Authoritative Price Engine'}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation View */}
        {orderResult ? (
          <div className="p-4 sm:p-8 text-center space-y-4 sm:space-y-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl sm:text-3xl animate-bounce">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Thank You for Your Order!
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Your order has been atomically locked and sent to our Tejgaon fulfillment warehouse for packing.
              </p>
            </div>

            {/* Reference details card */}
            <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-200 max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Order Reference:</span>
                <span className="font-mono font-bold text-slate-900">{orderResult.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Public Tracking Number:</span>
                <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {orderResult.trackingNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Payment Method:</span>
                <span className="font-bold text-slate-800">{orderResult.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Total Amount:</span>
                <span className="font-black text-emerald-700 text-sm">৳{orderResult.grandTotal.toFixed(2)} BDT</span>
              </div>
              {orderResult.paymentInstructions && (
                <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600 bg-amber-50 p-2 rounded border border-amber-100">
                  ℹ️ {orderResult.paymentInstructions}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center max-w-md mx-auto">
              <button
                onClick={() => {
                  closeCheckout();
                  trackOrderNumber(orderResult.trackingNumber);
                }}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Track Live Delivery Timeline
              </button>
              <button
                onClick={closeCheckout}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmitOrder} className="p-4 sm:p-8 space-y-4 sm:space-y-6">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Delivery Address */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                <span>Dhaka Delivery Address</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Contact Phone (01X) *</label>
                  <input
                    type="text"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-600 block mb-1">Street Address / House / Road / Area *</label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. House 42, Road 11, Dhanmondi, Dhaka"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Delivery Slot */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                <span>Preferred Delivery Slot</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {[
                  'Morning Slot (9 AM - 12 PM)',
                  'Afternoon Slot (2 PM - 5 PM)',
                  'Evening Slot (6 PM - 9 PM)',
                ].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setDeliverySlot(slot)}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                      deliverySlot === slot
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-600/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                <span>Select Payment Gateway (Strategy Pattern)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {/* Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    paymentMethod === 'COD'
                      ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20 text-emerald-950 font-bold'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold">Cash on Delivery</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">Pay upon doorstep arrival</span>
                </div>

                {/* bKash */}
                <div
                  onClick={() => setPaymentMethod('BKASH')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    paymentMethod === 'BKASH'
                      ? 'bg-pink-50 border-pink-500 ring-2 ring-pink-500/20 text-pink-950 font-bold'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">🌸</span>
                    <span className="font-bold text-pink-700">bKash MFS</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">Instant payment gateway</span>
                </div>

                {/* Nagad */}
                <div
                  onClick={() => setPaymentMethod('NAGAD')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    paymentMethod === 'NAGAD'
                      ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500/20 text-orange-950 font-bold'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">⚡</span>
                    <span className="font-bold text-orange-700">Nagad MFS</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">Fast mobile wallet</span>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="text-xs">
              <label className="font-semibold text-slate-600 block mb-1">Delivery Notes / Landmark (Optional)</label>
              <input
                type="text"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="e.g. Ring the 3rd floor bell, leave with security guard..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none"
              />
            </div>

            {/* Server-Side Price Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({cartItems.length} items):</span>
                <span className="font-bold text-slate-900">৳{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Coupon Discount ({appliedCoupon?.code}):</span>
                  <span>-৳{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge:</span>
                <span className="font-bold text-slate-900">
                  {deliveryFee === 0 ? <strong className="text-emerald-600">FREE (Dhaka)</strong> : `৳${deliveryFee.toFixed(2)}`}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-black text-slate-900">
                <span>Payable Grand Total:</span>
                <span className="text-lg text-emerald-700">৳{grandTotal.toFixed(2)} BDT</span>
              </div>
            </div>

            {/* Submit Action */}
            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition transform active:scale-98 disabled:opacity-60"
            >
              {isSubmitting ? 'Securing Stock & Placing Order...' : `Confirm & Place Order (৳${grandTotal.toFixed(2)})`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
