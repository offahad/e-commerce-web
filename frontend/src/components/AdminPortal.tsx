import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Users,
  Boxes,
  TrendingUp,
  AlertTriangle,
  Printer,
  FileText,
  Plus,
  Trash2,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'inventory' | 'prices' | 'banners'>('orders');

  // Hero Banners CMS State
  const [banners, setBanners] = useState<any[]>(() => {
    const saved = localStorage.getItem('lb_cms_hero_banners');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'slide-1',
        headline: 'We bring the store to your door',
        subtext: 'Get organic produce and sustainably sourced groceries delivery at up to 4% off grocery.',
        buttonText: 'Shop now',
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
        badgeText: 'Dhaka Express 15-Min',
        targetCategory: 'vegetables',
      },
      {
        id: 'slide-2',
        headline: 'Mega Friday Flash Deals — Up to 35% OFF',
        subtext: 'Premium Teer & Rupchanda edible oils, aromatic Chinigura rice & pure spices at wholesale rates.',
        buttonText: 'View Flash Deals',
        imageUrl: 'https://images.unsplash.com/photo-1579113800032-c38bd7635818?auto=format&fit=crop&w=800&q=80',
        badgeText: 'Friday Bazaar',
        targetCategory: 'cooking-oil',
      },
    ];
  });

  const [newHeadline, setNewHeadline] = useState('');
  const [newSubtext, setNewSubtext] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newButtonText, setNewButtonText] = useState('Shop now');

  const handleAddBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHeadline.trim() || !newImageUrl.trim()) return;
    const newSlide = {
      id: 'slide-' + Date.now(),
      headline: newHeadline.trim(),
      subtext: newSubtext.trim() || 'Fresh daily groceries delivered to your door.',
      buttonText: newButtonText.trim() || 'Shop now',
      imageUrl: newImageUrl.trim(),
      badgeText: 'Promotions Campaign',
    };
    const updated = [newSlide, ...banners];
    setBanners(updated);
    localStorage.setItem('lb_cms_hero_banners', JSON.stringify(updated));
    window.dispatchEvent(new Event('lb_banners_updated'));
    setNewHeadline('');
    setNewSubtext('');
    setNewImageUrl('');
  };

  const handleDeleteBanner = (id: string) => {
    const updated = banners.filter((b) => b.id !== id);
    setBanners(updated);
    localStorage.setItem('lb_cms_hero_banners', JSON.stringify(updated));
    window.dispatchEvent(new Event('lb_banners_updated'));
  };

  // KPI Metrics
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Invoice modal
  const [activeInvoice, setActiveInvoice] = useState<any | null>(null);

  // Price update modal
  const [priceModal, setPriceModal] = useState<{
    productId: string;
    productName: string;
    currentBase: number;
    currentSale: number;
  } | null>(null);
  const [newBasePrice, setNewBasePrice] = useState<number>(0);
  const [newSalePrice, setNewSalePrice] = useState<number>(0);
  const [priceReason, setPriceReason] = useState<string>('Market price update');

  // Manual stock adjustment
  const [stockModal, setStockModal] = useState<{ variantId: string; sku: string } | null>(null);
  const [stockQty, setStockQty] = useState<number>(10);
  const [stockType, setStockType] = useState<string>('STOCK_IN');
  const [stockReason, setStockReason] = useState<string>('Procurement from supplier');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordRes, custRes, alertRes] = await Promise.all([
        api.getAdminOrders({ limit: 50 }),
        api.getAdminCustomers(),
        api.getAdminStockAlerts(),
      ]);

      if (ordRes.success && ordRes.data) {
        setOrders(ordRes.data.orders || ordRes.data || []);
      }
      if (custRes.success && Array.isArray(custRes.data)) {
        setCustomers(custRes.data);
      }
      if (alertRes.success && Array.isArray(alertRes.data)) {
        setAlerts(alertRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // KPI calculations
  const totalRevenue = orders.reduce((acc, o) => acc + Number(o.grandTotal || o.grand_total || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const pendingCustomers = customers.filter((c) => c.status === 'PENDING_APPROVAL').length;

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    const comment = prompt(`Add operational note for status change to ${newStatus}:`, 'Status updated via Admin Portal');
    if (comment === null) return;

    try {
      const res = await api.updateOrderStatus(orderId, newStatus, comment);
      if (res.success) {
        await loadData();
      } else {
        alert(res.message || 'Update failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating order');
    }
  };

  const handleUpdatePayment = async (orderId: string, newPaymentStatus: string) => {
    const txn = prompt('Enter payment transaction ID / Reference (optional):', 'TXN-BANK-001');
    try {
      const res = await api.updateOrderPayment(orderId, newPaymentStatus, txn || undefined);
      if (res.success) {
        await loadData();
      } else {
        alert(res.message || 'Payment update failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating payment');
    }
  };

  const handleApproveCustomer = async (userId: string) => {
    const reason = prompt('Approval comment / note:', 'Customer phone and address verified');
    if (reason === null) return;

    try {
      const res = await api.updateCustomerStatus(userId, 'APPROVED', reason);
      if (res.success) {
        alert('Customer approved successfully! Account can now shop and checkout.');
        await loadData();
      } else {
        alert(res.message || 'Approval failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error approving customer');
    }
  };

  const handleToggleCustomerBlock = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'BLOCKED' ? 'APPROVED' : 'BLOCKED';
    if (!confirm(`Are you sure you want to change status to ${nextStatus}?`)) return;

    try {
      const res = await api.updateCustomerStatus(userId, nextStatus, 'Admin manual override');
      if (res.success) {
        await loadData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleViewInvoice = async (orderId: string) => {
    try {
      const res = await api.getOrderInvoice(orderId);
      if (res.success && res.data) {
        setActiveInvoice(res.data);
      } else {
        alert(res.message || 'Invoice data not found');
      }
    } catch (err: any) {
      alert(err.message || 'Error fetching invoice');
    }
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceModal) return;

    try {
      const res = await api.updateProductPrice(priceModal.productId, newBasePrice, newSalePrice, priceReason);
      if (res.success) {
        alert('Price updated! Automated record logged in Price History ledger.');
        setPriceModal(null);
        await loadData();
      } else {
        alert(res.message || 'Failed to update price');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModal) return;

    try {
      const res = await api.adjustInventory({
        variantId: stockModal.variantId,
        transactionType: stockType,
        quantity: stockQty,
        reason: stockReason,
      });
      if (res.success) {
        alert('Stock updated! Immutable record logged in Inventory Transactions ledger.');
        setStockModal(null);
        await loadData();
      } else {
        alert(res.message || 'Failed to adjust stock');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full my-6 shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Navbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-lg text-white">
              🛡️
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Liton Brothers Operations Control</h2>
              <span className="text-xs text-slate-400">Tejgaon Central Warehouse & Customer Management</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-Time KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Total Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg font-black text-slate-900">৳{totalRevenue.toFixed(0)} BDT</div>
            <div className="text-[10px] text-slate-500">{orders.length} orders settled</div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Pending Orders</span>
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg font-black text-blue-700">{pendingOrders}</div>
            <div className="text-[10px] text-slate-500">Awaiting confirmation</div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Pending Approvals</span>
              <Users className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-lg font-black text-amber-700">{pendingCustomers}</div>
            <div className="text-[10px] text-slate-500">Require admin verification</div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Stock Alerts</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-lg font-black text-rose-600">{alerts.length}</div>
            <div className="text-[10px] text-slate-500">Items low or out of stock</div>
          </div>
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
            <Package className="w-4 h-4" /> Order Fulfillment ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'customers'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Customer Approvals ({pendingCustomers} Pending)
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'inventory'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4" /> Inventory Alerts & Ledger
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'banners'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Hero Banners CMS ({banners.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* Orders Fulfillment Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wide">Live Customer Orders:</span>
                <button
                  onClick={loadData}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Refresh Orders
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">No orders registered yet.</div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Order / Tracking</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Total (BDT)</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Payment</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3">
                            <div className="font-mono font-bold text-slate-900">{ord.orderNumber || ord.order_number}</div>
                            <div className="font-mono text-[10px] text-emerald-700 font-bold">{ord.trackingNumber || ord.tracking_number}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{ord.customerName || ord.customer_name || 'Customer'}</div>
                            <div className="text-slate-400 font-mono text-[10px]">{ord.customerPhone || ord.customer_phone}</div>
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            ৳{Number(ord.grandTotal || ord.grand_total).toFixed(2)}
                          </td>
                          <td className="p-3">
                            <select
                              value={ord.status}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                              className="text-xs px-2 py-1 rounded-lg border border-slate-300 font-bold bg-white focus:outline-none"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="CONFIRMED">CONFIRMED</option>
                              <option value="PROCESSING">PROCESSING</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() =>
                                handleUpdatePayment(
                                  ord.id,
                                  (ord.paymentStatus || ord.payment_status) === 'PAID' ? 'PENDING' : 'PAID'
                                )
                              }
                              className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                (ord.paymentStatus || ord.payment_status) === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {ord.paymentMethod || ord.payment_method}: {ord.paymentStatus || ord.payment_status}
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleViewInvoice(ord.id)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 ml-auto"
                            >
                              <Printer className="w-3.5 h-3.5" /> Invoice
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Customer Approvals Tab */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wide">
                  Customer State Machine & Approval Subsystem (Sections 5 & 10):
                </span>
                <span className="text-slate-400 text-[11px]">Unapproved customers are blocked from placing orders</span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Mobile Phone</th>
                      <th className="p-3">Address</th>
                      <th className="p-3">Current Status</th>
                      <th className="p-3 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-bold text-slate-900">{c.fullName || c.full_name}</td>
                        <td className="p-3 font-mono font-semibold text-slate-700">{c.phone}</td>
                        <td className="p-3 text-slate-500 max-w-xs truncate">{c.address || 'Dhaka, BD'}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              c.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.status === 'PENDING_APPROVAL'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          {c.status === 'PENDING_APPROVAL' && (
                            <button
                              onClick={() => handleApproveCustomer(c.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition"
                            >
                              Approve Customer
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleCustomerBlock(c.id, c.status)}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                              c.status === 'BLOCKED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {c.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Inventory Alerts Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wide">
                  Warehouse Stock Alerts & Ledger Auditing (Section 15):
                </span>
              </div>

              {alerts.length === 0 ? (
                <div className="p-8 bg-emerald-50 rounded-2xl text-center text-xs text-emerald-800 font-bold border border-emerald-200">
                  All catalog items are stocked comfortably above warehouse thresholds.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {alerts.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{item.productName || item.product_name}</div>
                        <div className="text-slate-500 font-mono text-[11px]">
                          {item.displayName || item.display_name} (SKU: {item.sku})
                        </div>
                        <div className="text-rose-600 font-extrabold mt-1">
                          Stock: {item.stockQuantity ?? item.stock_quantity} units remaining
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setStockModal({
                            variantId: item.id,
                            sku: item.sku,
                          })
                        }
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                      >
                        Adjust Stock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Hero Banners & Promotions CMS Tab */}
          {activeTab === 'banners' && (
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <h3 className="font-bold text-slate-800 uppercase tracking-wide">
                    Hero Banners & Promotions Campaign CMS
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Add, edit, or delete slides displayed on the homepage hero carousel. Rotates automatically every 5 seconds.
                  </p>
                </div>
              </div>

              {/* Add New Banner Form */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <h4 className="text-xs font-black text-slate-800 mb-3 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-700" /> Add New Hero Promotion Slide
                </h4>
                <form onSubmit={handleAddBanner} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Headline</label>
                    <input
                      type="text"
                      required
                      value={newHeadline}
                      onChange={(e) => setNewHeadline(e.target.value)}
                      placeholder="e.g. Fresh Daily Deals — Up to 25% Off"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Image URL</label>
                    <input
                      type="url"
                      required
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Subtext / Description</label>
                    <input
                      type="text"
                      value={newSubtext}
                      onChange={(e) => setNewSubtext(e.target.value)}
                      placeholder="e.g. Pure oils, aromatic rice, and fresh dairy delivered in 15 mins."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Button Text</label>
                    <input
                      type="text"
                      value={newButtonText}
                      onChange={(e) => setNewButtonText(e.target.value)}
                      placeholder="e.g. Shop now"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                    />
                  </div>
                  <div className="md:col-span-2 pt-1 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition shadow-sm text-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add Slide to Homepage Carousel
                    </button>
                  </div>
                </form>
              </div>

              {/* Current Active Banners List */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-600 block">
                  Active Homepage Carousel Slides ({banners.length})
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {banners.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm relative group"
                    >
                      <img
                        src={b.imageUrl}
                        alt={b.headline}
                        className="w-20 h-20 rounded-xl object-cover shrink-0 bg-slate-100"
                      />
                      <div className="flex-1 min-w-0 pr-8">
                        <div className="font-bold text-slate-900 text-xs truncate">{b.headline}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{b.subtext}</div>
                        <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Btn: {b.buttonText}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteBanner(b.id)}
                        className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Slide"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Printable Tax Invoice Modal */}
        {activeInvoice && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setActiveInvoice(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Invoice Printable View */}
              <div id="printable-invoice" className="space-y-6 text-xs text-slate-800">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-1.5">
                      <span>LITON BROTHERS</span>
                    </h2>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Tejgaon Central Grocery Hub, Dhaka-1208, Bangladesh
                    </p>
                    <p className="text-slate-500 text-[11px]">Hotline: +880 1700-000000 | info@litonbrothers.com</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-700 block">TAX INVOICE</span>
                    <span className="font-mono text-slate-500 text-[11px] block">
                      #{activeInvoice.invoice?.invoiceNumber || 'INV-2026-001'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Date: {new Date(activeInvoice.invoice?.issuedAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Customer Snapshot */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Billed & Shipped To:</span>
                    <div className="font-bold text-slate-900">{activeInvoice.customer?.name}</div>
                    <div className="font-mono text-slate-600 text-[11px]">{activeInvoice.customer?.phone}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {activeInvoice.customer?.address?.addressLine || activeInvoice.customer?.address?.address}, Dhaka
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Order Details:</span>
                    <div className="font-mono font-bold text-slate-900">Ref: {activeInvoice.invoice?.orderNumber}</div>
                    <div className="font-mono text-emerald-700 font-bold text-[11px]">
                      Tracking: {activeInvoice.invoice?.trackingNumber}
                    </div>
                    <div className="text-slate-600 text-[11px] mt-0.5">
                      Payment: {activeInvoice.invoice?.paymentMethod} ({activeInvoice.invoice?.paymentStatus})
                    </div>
                  </div>
                </div>

                {/* Itemized Table */}
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeInvoice.items?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-800">{item.productName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.variantName} (SKU: {item.sku})
                          </div>
                        </td>
                        <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono">৳{item.unitPrice}</td>
                        <td className="p-2.5 text-right font-bold font-mono">৳{item.totalPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Financial Summary */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal:</span>
                      <span className="font-mono font-bold">৳{activeInvoice.totals?.subtotal?.toFixed(2)}</span>
                    </div>
                    {Number(activeInvoice.totals?.discountAmount || 0) > 0 && (
                      <div className="flex justify-between text-rose-600 font-semibold">
                        <span>Discount:</span>
                        <span className="font-mono">-৳{activeInvoice.totals?.discountAmount?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500">
                      <span>Dhaka Delivery Fee:</span>
                      <span className="font-mono">৳{activeInvoice.totals?.deliveryFee?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>Grand Total:</span>
                      <span className="text-emerald-700 font-mono text-base">
                        ৳{activeInvoice.totals?.grandTotal?.toFixed(2)} BDT
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400">
                  This is a computer-generated tax invoice verified by Liton Brothers Order Fulfillment Subsystem.
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Print Tax Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stock Adjustment Modal */}
        {stockModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
              <button
                onClick={() => setStockModal(null)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-black text-slate-900 mb-1">Adjust Inventory Stock</h3>
              <p className="text-xs text-slate-500 mb-4 font-mono">SKU: {stockModal.sku}</p>

              <form onSubmit={handleSaveStock} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Transaction Type</label>
                  <select
                    value={stockType}
                    onChange={(e) => setStockType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="STOCK_IN">STOCK_IN (Receiving fresh shipment)</option>
                    <option value="STOCK_OUT">STOCK_OUT (Damage / write-off)</option>
                    <option value="ADJUSTMENT">ADJUSTMENT (Cycle count reconciliation)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockQty}
                    onChange={(e) => setStockQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Audit Reason</label>
                  <input
                    type="text"
                    required
                    value={stockReason}
                    onChange={(e) => setStockReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-xs"
                >
                  Record Transaction & Update Stock
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
