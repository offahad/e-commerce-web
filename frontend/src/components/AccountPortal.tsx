import React, { useState, useEffect } from 'react';
import { X, Package, MapPin, User, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

interface AccountPortalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: string;
}

export const AccountPortal: React.FC<AccountPortalProps> = ({ isOpen, onClose, defaultTab = 'orders' }) => {
  const { user, isApproved, addresses, loadAddresses } = useAuth();
  const { trackOrderNumber } = useCart();

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // New Address form
  const [newLabel, setNewLabel] = useState('Home');
  const [newName, setNewName] = useState(user?.fullName || '');
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [newAddressLine, setNewAddressLine] = useState('');
  const [addingAddress, setAddingAddress] = useState(false);

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.getCustomerOrders();
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
      loadAddresses();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCancelOrder = async (orderId: string) => {
    const reason = prompt('Please state reason for order cancellation:');
    if (!reason) return;

    setCancellingId(orderId);
    try {
      const res = await api.cancelOrder(orderId, reason);
      if (res.success) {
        alert('Order cancelled successfully. Variant stock has been restored.');
        await fetchOrders();
      } else {
        alert(res.message || 'Could not cancel order');
      }
    } catch (err: any) {
      alert(err.message || 'Error cancelling order');
    } finally {
      setCancellingId(null);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressLine.trim()) return;

    setAddingAddress(true);
    try {
      const res = await api.addCustomerAddress({
        label: newLabel,
        recipientName: newName,
        recipientPhone: newPhone,
        addressLine: newAddressLine,
        district: 'Dhaka',
        division: 'Dhaka',
        isDefault: addresses.length === 0,
      });
      if (res.success) {
        await loadAddresses();
        setNewAddressLine('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingAddress(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full my-8 shadow-2xl border border-slate-100 relative overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">{user?.fullName}</h2>
              <div className="text-xs text-slate-500 font-mono">{user?.phone}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account Approval Status Banner */}
        <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {isApproved ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Account Verified & Approved for Ordering
              </span>
            ) : (
              <span className="text-amber-800 font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" /> Account Status: PENDING_APPROVAL by Admin
              </span>
            )}
          </div>
          <span className="text-slate-400 text-[11px]">Liton Brothers ID: {user?.id.substring(0, 8)}...</span>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'orders'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" /> My Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'addresses'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" /> Saved Addresses ({addresses.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'profile'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" /> Customer Profile
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {loadingOrders ? (
                <div className="text-center py-10 text-xs text-slate-400">Loading order history...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">No orders placed yet.</p>
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3"
                  >
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{ord.orderNumber}</span>
                        <span className="text-slate-400 text-[11px] ml-2">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black px-2.5 py-0.5 rounded-full text-[10px] ${
                            ord.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {ord.status}
                        </span>
                        <span className="font-semibold text-slate-600">
                          {ord.paymentMethod} ({ord.paymentStatus})
                        </span>
                      </div>
                    </div>

                    {/* Order line items */}
                    <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1.5">
                      {ord.items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-slate-700">
                          <span>
                            {item.productName} ({item.variantName}) x {item.quantity}
                          </span>
                          <span className="font-bold">৳{item.totalPrice}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                      <div className="text-slate-500">
                        Total Amount: <strong className="text-emerald-700 font-black text-sm">৳{ord.grandTotal.toFixed(2)} BDT</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onClose();
                            trackOrderNumber(ord.trackingNumber);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                        >
                          Live Tracker
                        </button>

                        {['PENDING', 'CONFIRMED'].includes(ord.status) && (
                          <button
                            disabled={cancellingId === ord.id}
                            onClick={() => handleCancelOrder(ord.id)}
                            className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold rounded-lg transition"
                          >
                            {cancellingId === ord.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="space-y-6">
              {/* Address List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Your Shipping Addresses</h3>
                {addresses.length === 0 ? (
                  <p className="text-xs text-slate-400">No saved addresses.</p>
                ) : (
                  addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{addr.label}</span>
                          {addr.isDefault && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-black">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <div className="text-slate-600 mt-0.5">{addr.addressLine}, {addr.district}</div>
                        <div className="text-slate-400 text-[11px]">{addr.recipientName} • {addr.recipientPhone}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Address Form */}
              <form onSubmit={handleAddAddress} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Add New Address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Address Label (e.g. Home / Office)"
                    className="px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Recipient Name"
                    className="px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Contact Phone"
                    className="px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                  />
                  <input
                    type="text"
                    required
                    value={newAddressLine}
                    onChange={(e) => setNewAddressLine(e.target.value)}
                    placeholder="House, Road, Area, Dhaka"
                    className="px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>
                <button
                  disabled={addingAddress}
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition"
                >
                  {addingAddress ? 'Saving...' : 'Save Address'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs space-y-3 max-w-md">
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Customer Name</span>
                <span className="text-sm font-bold text-slate-900">{user?.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Mobile Phone</span>
                <span className="text-sm font-mono font-bold text-slate-900">{user?.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Account Role</span>
                <span className="font-bold text-slate-800">{user?.role}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Approval Status</span>
                <span className="font-black text-emerald-700">{user?.status}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
