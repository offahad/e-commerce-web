import React, { useState, useEffect } from 'react';
import { X, Package, Check, Clock, Truck, Home, Search, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { OrderTrackingInfo } from '../types';

export const OrderTrackingModal: React.FC = () => {
  const { activeOrderTracking, closeTrackingModal } = useCart();
  const [trackingNumber, setTrackingNumber] = useState(activeOrderTracking || 'TRK-DEMO-2026-001');
  const [data, setData] = useState<OrderTrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = async (num: string) => {
    if (!num.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.trackOrder(num.trim());
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Tracking number not found');
        setData(null);
      }
    } catch (err: any) {
      setError(err.message || 'Could not fetch tracking data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeOrderTracking) {
      setTrackingNumber(activeOrderTracking);
      fetchTracking(activeOrderTracking);
    }
  }, [activeOrderTracking]);

  if (!activeOrderTracking) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(trackingNumber);
  };

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
      <div className="bg-white rounded-3xl max-w-2xl w-full my-8 shadow-2xl border border-slate-100 relative overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Live Order Tracking</h2>
              <span className="text-xs text-slate-500">Public Real-Time Timeline Subsystem (Section 55)</span>
            </div>
          </div>
          <button
            onClick={closeTrackingModal}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Tracking Search Input */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                placeholder="Enter tracking number (e.g. TRK-DEMO-2026-001)"
                className="w-full pl-9 pr-3 py-2.5 text-xs font-mono font-bold uppercase bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <button
              disabled={loading}
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-60"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              {/* Order Meta Header */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Order Ref</span>
                  <span className="font-bold text-slate-900">{data.orderNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Payment</span>
                  <span className="font-bold text-slate-800">
                    {data.paymentMethod || 'COD'} ({data.paymentStatus || 'PENDING'})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Grand Total</span>
                  <span className="font-black text-emerald-700">
                    {data.grandTotal ? `৳${data.grandTotal.toFixed(2)}` : '৳585.00'} BDT
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Delivery Slot</span>
                  <span className="font-semibold text-slate-700 truncate block">
                    {data.deliverySlot || 'Standard Delivery'}
                  </span>
                </div>
              </div>

              {/* 6-Stage Progression Timeline */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-4">
                  Fulfillment Progression:
                </h3>
                <div className="space-y-4">
                  {data.timeline.map((step, idx) => {
                    const isCurrent = data.status === step.status;
                    const isCompleted = step.completed;

                    return (
                      <div key={step.status} className="flex gap-4 relative">
                        {/* Connecting vertical line */}
                        {idx < data.timeline.length - 1 && (
                          <div
                            className={`absolute left-4 top-8 -bottom-4 w-0.5 ${
                              isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                          />
                        )}

                        {/* Step Icon Indicator */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                            isCompleted && !isCurrent
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : isCurrent
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100 pulse-active'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {isCompleted ? <Check className="w-4 h-4" /> : getStepIcon(step.status)}
                        </div>

                        {/* Step Info */}
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold ${
                                isCurrent
                                  ? 'text-blue-700'
                                  : isCompleted
                                  ? 'text-emerald-900'
                                  : 'text-slate-500'
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

              {/* Status History Log */}
              {data.statusHistory && data.statusHistory.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
                  <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-slate-500 mb-2">
                    Verified Operations Log
                  </h4>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {data.statusHistory.map((h, i) => (
                      <div key={i} className="flex justify-between text-slate-600">
                        <span>
                          [{new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] <strong>{h.status}</strong>: {h.comment || 'Status updated'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
