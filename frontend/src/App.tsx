import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { Header } from './components/Header';
import { FridayFlashSection } from './components/FridayFlashSection';
import { DealsOfTheDaySection } from './components/DealsOfTheDaySection';
import { CategoryBar } from './components/CategoryBar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AuthModal } from './components/AuthModal';
import { AccountPortal } from './components/AccountPortal';
import { AdminPortal } from './components/AdminPortal';
import { Footer } from './components/Footer';
import { Product } from './types';
import { api } from './services/api';
import { Filter, SlidersHorizontal, Sparkles, Check, AlertCircle } from 'lucide-react';

const MainContent: React.FC = () => {
  const { user, isApproved } = useAuth();
  const { trackOrderNumber } = useCart();

  // Catalog state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Modals state
  const [activeProductSlug, setActiveProductSlug] = useState<string | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [accountTab, setAccountTab] = useState('orders');

  const fetchCatalog = async () => {
    setLoadingProducts(true);
    try {
      const params: Record<string, string | number> = {};
      if (activeCategory) params.category = activeCategory;
      if (selectedBrand) params.brand = selectedBrand;
      if (searchQuery) params.q = searchQuery;
      if (sortBy) params.sortBy = sortBy;
      if (inStockOnly) params.inStock = 'true';

      const res = await api.getProducts(params);
      if (res.success && Array.isArray(res.data)) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [activeCategory, selectedBrand, sortBy, searchQuery, inStockOnly]);

  const handleOpenAccount = (tab = 'orders') => {
    setAccountTab(tab);
    setIsAccountOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <Header
        activeCategory={activeCategory}
        onSelectCategory={(slug) => {
          setActiveCategory(slug);
          setSearchQuery('');
        }}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAccount={handleOpenAccount}
        onSearchSubmit={(q) => setSearchQuery(q)}
        onOpenProductModal={(slug) => setActiveProductSlug(slug)}
      />

      {/* Notice for Pending Approval Customer */}
      {user && !isApproved && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-bold shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Your account is currently <strong>PENDING_APPROVAL</strong>. You can browse the catalog and save items to basket. Once our admin verifies your phone number, you will be able to place orders!
              </span>
            </div>
            <button
              onClick={() => setIsAdminOpen(true)}
              className="bg-slate-950 text-white px-3 py-1 rounded-lg text-[11px] font-black hover:bg-slate-800 transition"
            >
              Open Admin to Approve Account
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* Hero Promotional Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 sm:p-10 shadow-lg relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Direct From Importer & Mill
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Dhaka&apos;s Trusted Hub for Pure Groceries & Essentials
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base mt-2.5 max-w-xl leading-relaxed">
              Order Teer & Rupchanda Soybean Oil, Miniket Rice, Radhuni Pure Spices, and Farm Fresh Eggs. Guaranteed authentic products delivered to your doorstep in Dhaka.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#friday-flash"
                className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition transform active:scale-95 flex items-center gap-2"
              >
                <span>⚡ Friday Flash Bazaar</span>
              </a>
              <button
                onClick={() => trackOrderNumber('TRK-DEMO-2026-001')}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 font-bold text-xs rounded-xl transition"
              >
                📦 Track Order: TRK-DEMO-2026-001
              </button>
            </div>
          </div>
        </div>

        {/* Category Visual Explorer Bar */}
        <CategoryBar
          activeCategory={activeCategory}
          onSelectCategory={(slug) => {
            setActiveCategory(slug);
            setSearchQuery('');
          }}
        />

        {/* Friday Flash Deal High-Concurrency Section */}
        <FridayFlashSection
          onOpenProductModal={(slug) => setActiveProductSlug(slug)}
        />

        {/* Deals of the Day Markdowns */}
        <DealsOfTheDaySection
          onOpenProductModal={(slug) => setActiveProductSlug(slug)}
        />

        {/* Main Product Catalog Section with Filters */}
        <section className="my-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {searchQuery
                  ? `Search Results for "${searchQuery}"`
                  : activeCategory
                  ? `Category: ${activeCategory.replace('-', ' ').toUpperCase()}`
                  : 'All Premium Grocery Catalog'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing {products.length} verified items available in Dhaka fulfillment warehouse
              </p>
            </div>

            {/* Faceted Sorting & In-Stock Filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer shadow-xs">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>In Stock Only</span>
              </label>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="featured">Featured First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse h-72">
                  <div className="h-32 bg-slate-100 rounded-xl mb-3" />
                  <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
                  <div className="h-8 bg-slate-100 rounded-xl mt-auto" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
              <div className="text-5xl mb-3">🔍</div>
              <h3 className="text-base font-bold text-slate-800">No products match your criteria</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try clearing your search query or selecting a different category from above.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory(null);
                  setSelectedBrand(null);
                  setInStockOnly(false);
                }}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenModal={() => setActiveProductSlug(product.slug)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals & Drawers */}
      <ProductDetailModal
        slug={activeProductSlug}
        onClose={() => setActiveProductSlug(null)}
      />

      <CartDrawer />

      <CheckoutModal />

      <OrderTrackingModal />

      <AuthModal />

      <AccountPortal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        defaultTab={accountTab}
      />

      <AdminPortal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <MainContent />
      </CartProvider>
    </AuthProvider>
  );
};
