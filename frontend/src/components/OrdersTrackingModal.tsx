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
  ArrowLeft,
  Calendar,
  ShoppingBag,
  ExternalLink,
  RotateCcw,
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

// Safe date/time formatting helper that never throws RangeError
const safeFormatTime = (ts: any): string => {
  if (!ts) return '';
  if (typeof ts === 'string' && (ts.includes('AM') || ts.includes('PM'))) return ts;
  try {
    let d = new Date(ts);
    if (isNaN(d.getTime())) {
      const isoStr = String(ts).replace(' ', 'T');
      d = new Date(isoStr);
    }
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return String(ts);
  } catch {
    return String(ts || '');
  }
};

// Safe date formatting helper for order headers
const safeFormatDate = (dateVal: any): string => {
  if (!dateVal) return new Date().toLocaleDateString();
  try {
    let d = new Date(dateVal);
    if (isNaN(d.getTime())) {
      const isoStr = String(dateVal).replace(' ', 'T');
      d = new Date(isoStr);
    }
    if (!isNaN(d.getTime())) {
      return d.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return String(dateVal);
  } catch {
    return String(dateVal || '');
  }
};

// Safe address formatting helper
const safeFormatAddress = (addr: any): string => {
  if (!addr) return 'Dhaka Central Express Zone';
  if (typeof addr === 'string') {
    try {
      const parsed = JSON.parse(addr);
      if (typeof parsed === 'object' && parsed !== null) {
        return safeFormatAddress(parsed);
      }
    } catch {
      return addr;
    }
    return addr;
  }
  const line = addr.addressLine || addr.address || '';
  const area = addr.area || '';
  const district = addr.district || addr.city || 'Dhaka';
  const parts = [line, area, district].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Dhaka Central Express Zone';
};

// Canonical demo tracking payload for instant zero-latency preview
const DEMO_TRACKING_PAYLOAD: OrderTrackingInfo = {
  orderNumber: 'ORD-2026-DEMO01',
  trackingNumber: 'TRK-DEMO-2026-001',
  status: 'OUT_FOR_DELIVERY',
  statusLabel: 'Out for Doorstep Delivery',
  paymentMethod: 'bKash Online',
  paymentStatus: 'PAID',
  grandTotal: 585,
  deliverySlot: 'Express 15-Minute Doorstep Delivery',
  deliveryAddress: {
    name: 'Approved Demo Customer',
    phone: '01800000000',
    address: 'House 42, Road 11, Block C, Dhanmondi',
    district: 'Dhaka',
    division: 'Dhaka',
  },
  timeline: [
    {
      status: 'PENDING',
      title: 'Order Placed',
      description: 'Order placed by customer via web portal',
      completed: true,
      timestamp: '2:15 PM',
    },
    {
      status: 'CONFIRMED',
      title: 'Order Confirmed',
      description: 'Payment verified and order confirmed by sales team',
      completed: true,
      timestamp: '2:18 PM',
    },
    {
      status: 'PROCESSING',
      title: 'Quality Check & Packaging',
      description: 'Inspected and packed in insulated thermal bag at Tejgaon warehouse',
      completed: true,
      timestamp: '2:22 PM',
    },
    {
      status: 'OUT_FOR_DELIVERY',
      title: 'Out for 15-Minute Doorstep Delivery',
      description: 'Courier rider Rafiqul Islam is en route on bike (Current: 0.8 km away)',
      completed: true,
      timestamp: '2:27 PM',
    },
    {
      status: 'DELIVERED',
      title: 'Delivered to Doorstep',
      description: 'Estimated delivery in ~3 minutes',
      completed: false,
      timestamp: null,
    },
  ],
};

export const OrdersTrackingModal: React.FC<OrdersTrackingModalProps> = ({
  isOpen,
  onClose,
  initialTrackingNumber,
  onOpenStore,
}) => {
  const { user } = useAuth();
  const { activeOrderTracking, closeTrackingModal } = useCart();

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
        // Not authenticated or network error; fallback to local stored orders
      }

      // Read local storage orders (saved from checkouts in this session)
      let localOrders: any[] = [];
      const saved = localStorage.getItem('lb_customer_orders');
      if (saved) {
        try {
          localOrders = JSON.parse(saved);
        } catch (e) {}
      }

      // Merge avoiding duplicates
      const combined = [...localOrders];
      for (const ro of remoteOrders) {
        if (!combined.some((o) => o.id === ro.id || o.orderNumber === ro.orderNumber)) {
          combined.push(ro);
        }
      }

      // Sort by creation date descending
      combined.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
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
    const cleanNum = num.trim();
    if (!cleanNum) return;

    setLoadingTracking(true);
    setTrackingError(null);
    setActiveTrackingNum(cleanNum);

    // Instant local handling for demo numbers
    if (cleanNum.toUpperCase().includes('DEMO') || cleanNum === 'TRK-DEMO-2026-001') {
      setTrackingData(DEMO_TRACKING_PAYLOAD);
      setLoadingTracking(false);
      return;
    }

    try {
      const res = await api.trackOrder(cleanNum);
      if (res.success && res.data) {
        // Ensure timeline exists and is well-formed
        const safeTimeline = Array.isArray(res.data.timeline) && res.data.timeline.length > 0
          ? res.data.timeline
          : [
              {
                status: 'PENDING',
                title: 'Order Placed',
                description: 'Order registered in system',
                completed: true,
                timestamp: res.data.createdAt || new Date().toISOString(),
              },
              {
                status: 'CONFIRMED',
                title: 'Order Confirmed',
                description: 'Verified by central fulfillment operations',
                completed: res.data.status !== 'PENDING',
                timestamp: res.data.createdAt || null,
              },
              {
                status: 'PROCESSING',
                title: 'Packing & Quality Check',
                description: 'Packed at warehouse with freshness seal',
                completed: ['PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(res.data.status),
                timestamp: null,
              },
              {
                status: 'OUT_FOR_DELIVERY',
                title: 'Out for 15-Minute Doorstep Delivery',
                description: 'Courier rider dispatched to delivery address',
                completed: res.data.status === 'DELIVERED',
                timestamp: null,
              },
              {
                status: 'DELIVERED',
                title: 'Delivered',
                description: 'Package handed over successfully',
                completed: res.data.status === 'DELIVERED',
                timestamp: null,
              },
            ];

        setTrackingData({
          ...res.data,
          timeline: safeTimeline,
        });
      } else {
        // Fallback: check if the number matches any order in local list
        const matched = orders.find(
          (o) =>
            o.trackingNumber === cleanNum ||
            o.orderNumber === cleanNum ||
            o.id === cleanNum
        );

        if (matched) {
          setTrackingData({
            orderNumber: matched.orderNumber || matched.id,
            trackingNumber: matched.trackingNumber || cleanNum,
            status: matched.status || 'CONFIRMED',
            statusLabel: matched.status || 'Confirmed',
            deliveryAddress: matched.deliveryAddress || 'Dhaka, Bangladesh',
            grandTotal: matched.grandTotal || 0,
            paymentMethod: matched.paymentMethod || 'COD',
            paymentStatus: matched.paymentStatus || 'PENDING',
            timeline: [
              {
                status: 'PENDING',
                title: 'Order Placed',
                description: 'Order received and authenticated',
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
                description: 'Items sorted and packed in insulated thermal bag',
                completed: matched.status !== 'CONFIRMED',
                timestamp: null,
              },
              {
                status: 'OUT_FOR_DELIVERY',
                title: 'Express 15-Minute Delivery',
                description: 'Rider dispatched to delivery address',
                completed: matched.status === 'DELIVERED',
                timestamp: null,
              },
              {
                status: 'DELIVERED',
                title: 'Delivered',
                description: 'Order handed over successfully',
                completed: matched.status === 'DELIVERED',
                timestamp: null,
              },
            ],
          });
        } else {
          setTrackingError(res.message || `No active shipment found for '${cleanNum}'`);
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
    setTrackingError(null);
    setActiveTrackingNum('TRK-DEMO-2026-001');
    setTrackingData(DEMO_TRACKING_PAYLOAD);
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

  const isTimelineViewActive = Boolean(activeTrackingNum && trackingData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full my-2 sm:my-6 shadow-2xl border border-slate-100 relative overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-900 via-[#14532d] to-emerald-950 text-white">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-yellow-300 flex items-center justify-center shadow-inner shrink-0">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-black tracking-tight">
                  My Orders & Live Status Tracking
                </h2>
                <span className="bg-yellow-400 text-slate-950 text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full">
                  15-Min Live
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-100/80">
                Track every order given and monitor real-time delivery progression.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar for Instant Tracking by Number */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                placeholder="ENTER TRACKING CODE (E.G. TRK-DEMO-2026-001) OR ORDER #"
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

          {/* Inline Error Notice */}
          {trackingError && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{trackingError}</span>
              </div>
              <button
                type="button"
                onClick={handleTrackDemo}
                className="text-[11px] font-bold text-emerald-800 hover:underline shrink-0"
              >
                Try Demo Tracker
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* VIEW A: SPECIFIC ORDER REAL-TIME TRACKING TIMELINE */}
          {isTimelineViewActive && trackingData ? (
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
                  Ref: {trackingData.orderNumber || trackingData.trackingNumber}
                </span>
              </div>

              {/* Status Header Overview Card */}
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white rounded-2xl p-4 sm:p-5 border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-700 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping" />
                    <span>STATUS: {trackingData.statusLabel || trackingData.status || 'OUT FOR DELIVERY'}</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900">
                    Express 15-Minute Doorstep Fulfillment
                  </h3>
                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{safeFormatAddress(trackingData.deliveryAddress)}</span>
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
                <div className="flex items-center justify-between mb-5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-800" />
                    <span>Live Delivery Progress Milestones</span>
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    ETA: 15-Min Express
                  </span>
                </div>

                <div className="space-y-4">
                  {(trackingData.timeline || []).map((step, idx, arr) => {
                    const isCurrent = trackingData.status === step.status;
                    const isCompleted = Boolean(step.completed);

                    return (
                      <div key={step.status || idx} className="flex gap-4 relative">
                        {/* Connecting Line */}
                        {idx < arr.length - 1 && (
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
                                {safeFormatTime(step.timestamp)}
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

              {/* Status History Log (if provided) */}
              {Array.isArray(trackingData.statusHistory) && trackingData.statusHistory.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
                  <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-slate-500 mb-2">
                    Operations Log
                  </h4>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {trackingData.statusHistory.map((h, i) => (
                      <div key={i} className="flex justify-between text-slate-600">
                        <span>
                          [{safeFormatTime(h.createdAt)}] <strong>{h.status}</strong>: {h.comment || 'Status updated'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                    Preview Demo Tracker
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
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold rounded-xl transition shadow-xs hover:border-emerald-700"
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
                              <span>{safeFormatDate(ord.createdAt)}</span>
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
                          {Array.isArray(ord.items) && ord.items.length > 0 ? (
                            ord.items.map((item: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.productName || item.name || 'Product'}
                                      className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                                      📦
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-900 truncate">
                                      {item.productName || item.name || 'Grocery Item'}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      {item.variantName || 'Standard'} • Qty: {item.quantity || 1}
                                    </div>
                                  </div>
                                </div>
                                <div className="font-bold text-slate-900 shrink-0 ml-2">
                                  ৳{Number(item.totalPrice || (item.price || 0) * (item.quantity || 1) || 0).toFixed(0)}
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
                          <div className="text-slate-600 flex items-center gap-1.5 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-sm">
                              {safeFormatAddress(ord.deliveryAddress || ord.shipping_address_snapshot)}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
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
