import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Package,
  Check,
  Clock,
  Truck,
  Home,
  Search,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Calendar,
  CreditCard,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { OrderTrackingInfo } from '../types';

interface OrdersTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrackingNumber?: string;
  onOpenStore?: () => void;
}

export const OrdersTrackingModal: React.FC<OrdersTrackingModalProps> = ({
  isOpen,
  onClose,
  initialTrackingNumber,
  onOpenStore,
}) => {
  const { user } = useAuth();
  const { activeOrderTracking, trackOrderNumber, closeTrackingModal } = useCart();

  // Search & active tracking
  const [searchInput, setSearchInput] = useState('');
  const [activeTrackingNum, setActiveTrackingNum] = useState<string | null>(
    initialTrackingNumber || activeOrderTracking || null
  );
  const [trackingData, setTrackingData] = useState<OrderTrackingInfo | null>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Orders list
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Load orders when modal opens
  const fetchAllOrders = async () => {
    setLoadingOrders(true);
    try {
      let remoteOrders: any[] = [];
      try {
        const res = await api.getCustomerOrders();
        if (res.success && Array.isArray(res.data)) {
          remoteOrders = res.data;
        }
      } catch (err) {
        // Not authenticated or network error; gracefully fallback to local stored orders
      }

      // Read local storage orders (saved from checkouts in this session)
      let localOrders: any[] = [];
      const saved = localStorage.getItem('lb_customer_orders');
      if (saved) {
        try {
          localOrders = JSON.parse(saved);
        } catch (e) {}
      }

      // Merge avoiding duplicates by id or orderNumber
      const combined = [...localOrders];
      for (const ro of remoteOrders) {
        if (!combined.some((o) => o.id === ro.id || o.orderNumber === ro.orderNumber)) {
          combined.push(ro);
        }
      }

      // Sort by creation date descending
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(combined);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAllOrders();
      if (activeOrderTracking || initialTrackingNumber) {
        const target = activeOrderTracking || initialTrackingNumber;
        if (target) {
          fetchTrackingDetails(target);
        }
      }
    }
  }, [isOpen, activeOrderTracking, initialTrackingNumber]);

  const fetchTrackingDetails = async (num: string) => {
    if (!num.trim()) return;
    setLoadingTracking(true);
    setTrackingError(null);
    setActiveTrackingNum(num.trim());

    try {
      const res = await api.trackOrder(num.trim());
      if (res.success && res.data) {
        setTrackingData(res.data);
      } else {
        // Fallback demo timeline for user convenience if number matches order list or demo
        const matched = orders.find(
          (o) =>
            o.trackingNumber === num.trim() ||
            o.orderNumber === num.trim() ||
            o.id === num.trim()
        );

        if (matched) {
          setTrackingData({
            orderNumber: matched.orderNumber || matched.id,
            trackingNumber: matched.trackingNumber || num.trim(),
            status: matched.status || 'CONFIRMED',
            statusLabel: matched.status || 'Confirmed',
            deliveryAddress: typeof matched.deliveryAddress === 'string'
              ? matched.deliveryAddress
              : matched.deliveryAddress?.address || 'Dhaka Central Delivery Zone',
            grandTotal: matched.grandTotal,
            paymentMethod: matched.paymentMethod || 'COD',
            paymentStatus: matched.paymentStatus || 'PENDING',
            timeline: [
              {
                status: 'PENDING',
                title: 'Order Received',
                description: 'Order placed and authenticated',
                completed: true,
                timestamp: matched.createdAt,
              },
              {
                status: 'CONFIRMED',
                title: 'Order Confirmed',
                description: 'Verified by Liton Brothers Central Hub',
                completed: true,
                timestamp: matched.createdAt,
              },
              {
                status: 'PROCESSING',
                title: 'Quality Check & Packing',
                description: 'Items sorted and packed in insulated thermal bags',
                completed: matched.status !== 'CONFIRMED',
              },
              {
                status: 'OUT_FOR_DELIVERY',
                title: 'Express 15-Min Delivery',
                description: 'Rider dispatched to delivery address',
                completed: matched.status === 'DELIVERED',
              },
              {
                status: 'DELIVERED',
                title: 'Delivered',
                description: 'Order handed over successfully',
                completed: matched.status === 'DELIVERED',
              },
            ],
          });
        } else {
          setTrackingError(res.message || 'Tracking reference not found');
          setTrackingData(null);
        }
      }
    } catch (err: any) {
      setTrackingError(err.message || 'Could not fetch tracking timeline');
      setTrackingData(null);
    } finally {
      setLoadingTracking(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchTrackingDetails(searchInput.trim());
    }
  };

  const handleTrackDemo = () => {
    fetchTrackingDetails('TRK-DEMO-2026-001');
  };

  const handleBackToOrdersList = () => {
    setActiveTrackingNum(null);
    setTrackingData(null);
    setTrackingError(null);
    closeTrackingModal();
  };

  if (!isOpen) return null;

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'CONFIRMED':
        return <Check className="w-4 h-4" />;
      case 'PROCESSING':
        return <Package className="w-4 h-4" />;
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return <Truck className="w-4 h-4" />;
      case 'DELIVERED':
        return <Home className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full my-6 shadow-2xl border border-slate-100 relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-900 via-[#14532d] to-emerald-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-yellow-300 flex items-center justify-center shadow-inner">
              <MapPin className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  My Orders & Live Status Tracking
                </h2>
                <span className="bg-yellow-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  15-Min Live
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">
                Track every order given and monitor real-time delivery progression.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar for Instant Tracking by Number */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                placeholder="Enter Tracking Code (e.g. TRK-DEMO-2026-001) or Order #"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold uppercase bg-white border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              disabled={loadingTracking || !searchInput.trim()}
              className="px-4 py-2 bg-[#14532d] hover:bg-emerald-950 text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50"
            >
              {loadingTracking ? 'Tracking...' : 'Track Status'}
            </button>
          </form>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* VIEW A: SPECIFIC ORDER REAL-TIME TRACKING TIMELINE */}
          {activeTrackingNum && trackingData ? (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <button
                  type="button"
                  onClick={handleBackToOrdersList}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>View All Placed Orders</span>
                </button>
                <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Ref: {trackingData.orderNumber}
                </span>
              </div>

              {/* Status Header Overview Card */}
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white rounded-2xl p-4 sm:p-5 border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-700 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping" />
                    <span>STATUS: {trackingData.status}</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900">
                    Express 15-Minute Doorstep Fulfillment
                  </h3>
                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>
                      {typeof trackingData.deliveryAddress === 'string'
                        ? trackingData.deliveryAddress
                        : trackingData.deliveryAddress
                        ? `${trackingData.deliveryAddress.address}, ${trackingData.deliveryAddress.district}`
                        : 'Dhaka Central Delivery Zone'}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="text-[11px] text-slate-400 font-bold uppercase">Total Payable</div>
                  <div className="text-xl font-black text-[#14532d]">
                    ৳{Number(trackingData.grandTotal || 0).toFixed(0)} BDT
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    Payment: {trackingData.paymentMethod || 'COD'} ({trackingData.paymentStatus || 'Verified'})
                  </div>
                </div>
              </div>

              {/* 5-Stage Visual Fulfillment Timeline */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-5 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-800" />
                  <span>Live Delivery Progress Milestones</span>
                </h4>

                <div className="space-y-4">
                  {trackingData.timeline.map((step, idx) => {
                    const isCurrent = trackingData.status === step.status;
                    const isCompleted = step.completed;

                    return (
                      <div key={step.status} className="flex gap-4 relative">
                        {/* Connecting Line */}
                        {idx < trackingData.timeline.length - 1 && (
                          <div
                            className={`absolute left-4 top-8 -bottom-4 w-0.5 ${
                              isCompleted ? 'bg-emerald-600' : 'bg-slate-200'
                            }`}
                          />
                        )}

                        {/* Step Circle */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                            isCompleted && !isCurrent
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : isCurrent
                              ? 'bg-[#14532d] text-white ring-4 ring-emerald-100 animate-pulse'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {isCompleted ? <Check className="w-4 h-4" /> : getStepIcon(step.status)}
                        </div>

                        {/* Step Text */}
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold ${
                                isCurrent
                                  ? 'text-emerald-950 font-black'
                                  : isCompleted
                                  ? 'text-emerald-800'
                                  : 'text-slate-400'
                              }`}
                            >
                              {step.title}
                            </span>
                            {step.timestamp && (
                              <span className="text-[10px] font-mono text-slate-400">
                                {new Date(step.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* VIEW B: LIST OF EVERY ORDER GIVEN */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Orders Given ({orders.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Click any order to track its real-time 15-minute rider delivery status.
                  </p>
                </div>
                {orders.length > 0 && (
                  <button
                    type="button"
                    onClick={handleTrackDemo}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline"
                  >
                    View Demo Tracker
                  </button>
                )}
              </div>

              {loadingOrders ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  Loading your orders...
                </div>
              ) : orders.length === 0 ? (
                /* Empty state when no orders placed yet */
                <div className="text-center py-12 px-4 rounded-3xl bg-slate-50 border border-slate-200 text-slate-600">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">No orders given yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                    Once you place an order, every order you have given will appear right here with full live delivery status tracking!
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleTrackDemo}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold rounded-xl transition shadow-xs"
                    >
                      Preview Demo Tracker
                    </button>
                    {onOpenStore && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenStore();
                        }}
                        className="px-4 py-2 bg-[#14532d] hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition shadow-xs"
                      >
                        Start Shopping
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Cards for every order given */
                <div className="space-y-4">
                  {orders.map((ord) => {
                    const isExpanded = expandedOrderId === ord.id;
                    const trackingNo = ord.trackingNumber || ord.orderNumber || ord.id;

                    return (
                      <div
                        key={ord.id || ord.orderNumber}
                        className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition space-y-3"
                      >
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-slate-900 text-xs">
                                {ord.orderNumber || ord.id}
                              </span>
                              <span
                                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                                  ord.status === 'DELIVERED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : ord.status === 'CANCELLED'
                                    ? 'bg-rose-100 text-rose-800'
                                    : ord.status === 'OUT_FOR_DELIVERY'
                                    ? 'bg-blue-100 text-blue-800 animate-pulse'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {ord.status || 'CONFIRMED'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(ord.createdAt).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => fetchTrackingDetails(trackingNo)}
                              className="px-3.5 py-1.5 bg-[#14532d] hover:bg-emerald-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs"
                            >
                              <MapPin className="w-3.5 h-3.5 text-yellow-300" />
                              <span>Track Live Status</span>
                            </button>
                          </div>
                        </div>

                        {/* Order Line Items */}
                        <div className="space-y-2">
                          {ord.items && ord.items.length > 0 ? (
                            ord.items.map((item: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.productName}
                                      className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                                      📦
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-900 truncate">
                                      {item.productName}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      {item.variantName || 'Standard'} • Qty: {item.quantity}
                                    </div>
                                  </div>
                                </div>
                                <div className="font-bold text-slate-900 shrink-0 ml-2">
                                  ৳{Number(item.totalPrice || item.price * item.quantity || 0).toFixed(0)}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-slate-500 italic">
                              Standard Grocery Basket
                            </div>
                          )}
                        </div>

                        {/* Delivery Address & Order Total */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                          <div className="text-slate-600 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-sm">
                              {typeof ord.deliveryAddress === 'string'
                                ? ord.deliveryAddress
                                : ord.deliveryAddress?.address
                                ? `${ord.deliveryAddress.address}, ${ord.deliveryAddress.district}`
                                : ord.shipping_address_snapshot
                                ? JSON.parse(ord.shipping_address_snapshot).addressLine
                                : 'Dhaka Central Express Zone'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-slate-500 text-[11px]">
                              Payment: <strong>{ord.paymentMethod || 'COD'}</strong>
                            </span>
                            <span className="font-black text-sm text-[#14532d]">
                              ৳{Number(ord.grandTotal || 0).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
