import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Header } from './components/Header';
import { HeroBanner, BannerSlide } from './components/HeroBanner';
import { AppDownloadBanner } from './components/AppDownloadBanner';
import { FridayFlashSection } from './components/FridayFlashSection';
import { DealsOfTheDaySection } from './components/DealsOfTheDaySection';
import { CatalogSection } from './components/CatalogSection';
import { CategoryBar } from './components/CategoryBar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailView } from './components/ProductDetailView';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CartPage } from './components/CartPage';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AuthModal } from './components/AuthModal';
import { AccountPortal } from './components/AccountPortal';
import { AdminPortal } from './components/AdminPortal';
import { FavouritesModal } from './components/FavouritesModal';
import { Footer } from './components/Footer';
import { Product } from './types';
import { api } from './services/api';
import { AlertCircle, SlidersHorizontal, Check } from 'lucide-react';

const MainContent: React.FC = () => {
  const { user, isApproved } = useAuth();
  const { trackOrderNumber, addToCart } = useCart();
  const { t } = useLanguage();

  // Navigation View State: 'home' | 'product-detail' | 'cart-page'
  const [currentView, setCurrentView] = useState<'home' | 'product-detail' | 'cart-page'>('home');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

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
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [accountTab, setAccountTab] = useState('orders');

  // Hero CMS Banners State
  const [heroSlides, setHeroSlides] = useState<BannerSlide[]>(() => {
    const saved = localStorage.getItem('lb_cms_hero_banners');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
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

  // Listen for CMS updates from AdminPortal
  useEffect(() => {
    const handleBannersUpdated = () => {
      const saved = localStorage.getItem('lb_cms_hero_banners');
      if (saved) {
        try {
          setHeroSlides(JSON.parse(saved));
        } catch (e) {}
      }
    };
    window.addEventListener('lb_banners_updated', handleBannersUpdated);
    return () => window.removeEventListener('lb_banners_updated', handleBannersUpdated);
  }, []);

  const fetchCatalog = async () => {
    setLoadingProducts(true);
    try {
      const params: Record<string, string | number> = {};
      if (activeCategory && activeCategory !== 'all') params.category = activeCategory;
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

  const handleOpenProductDetail = (prod: any) => {
    setSelectedProduct(prod);
    setCurrentView('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBuyNowFromDetail = (variantId: string, quantity: number) => {
    addToCart(variantId, quantity);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Header with Language Selector & Navigation */}
      <Header
        activeCategory={activeCategory}
        onSelectCategory={(slug) => {
          setActiveCategory(slug);
          setSearchQuery('');
          setCurrentView('home');
        }}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAccount={handleOpenAccount}
        onSearchSubmit={(q) => {
          setSearchQuery(q);
          setCurrentView('home');
        }}
        onOpenProductModal={(slug) => {
          setActiveProductSlug(slug);
        }}
        onOpenCartPage={() => {
          setCurrentView('cart-page');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Notice for Pending Approval Customer */}
      {user && !isApproved && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-bold shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Your account is currently <strong>PENDING_APPROVAL</strong>. You can browse the catalog and save items to basket. Once our admin verifies your account, you will be able to place orders!
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

      {/* Main Body Switcher: Home vs ProductDetailView vs CartPage */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* VIEW 1: DEDICATED PRODUCT DETAIL VIEW (Matching Screenshot 6) */}
        {currentView === 'product-detail' && selectedProduct && (
          <ProductDetailView
            product={selectedProduct}
            onBack={() => setCurrentView('home')}
            onBuyNow={handleBuyNowFromDetail}
          />
        )}

        {/* VIEW 2: DEDICATED SHOPPING CART PAGE (Matching Screenshot 7) */}
        {currentView === 'cart-page' && (
          <CartPage
            onProceedToCheckout={() => setIsCheckoutOpen(true)}
            onContinueShopping={() => setCurrentView('home')}
            onOpenAccountAddresses={() => handleOpenAccount('addresses')}
          />
        )}

        {/* VIEW 3: HOMEPAGE STOREFRONT (Matching Screenshots 1, 2, 3, 4, 8, 9) */}
        {currentView === 'home' && (
          <>
            {/* 1. Hero Banner with Wave & Auto-advancing CMS Carousel (Screenshot 1) */}
            <HeroBanner
              slides={heroSlides}
              onShopNow={(categorySlug) => {
                if (categorySlug) setActiveCategory(categorySlug);
                const elem = document.getElementById('catalog-products-section');
                if (elem) elem.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* 2. Deals of the Day with Red Clock Timer Badges, Sold: X/Y Progress & Sold Out Overlay (Screenshot 2) */}
            <DealsOfTheDaySection
              onOpenProduct={(prod) => handleOpenProductDetail(prod)}
            />

            {/* 3. Dual Mode Catalog Switcher: "By Category" vs "Product by Items" (Screenshots 8 & 9) */}
            <CatalogSection
              onOpenProduct={(prod) => handleOpenProductDetail(prod)}
              onFilterByCategory={(slug) => {
                setActiveCategory(slug === 'all' ? null : slug);
                const elem = document.getElementById('catalog-products-section');
                if (elem) elem.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* 4. Friday Flash Deals Showcase */}
            <FridayFlashSection
              onOpenProductModal={(slug) => {
                setActiveProductSlug(slug);
              }}
            />

            {/* 5. Complete Catalog & Faceted Filter Section */}
            <div id="catalog-products-section" className="my-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#14532d] tracking-tight">
                    {activeCategory ? `Filtered Catalog: ${activeCategory}` : 'Full Grocery Catalog'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Multi-Quantity Variants (500 ML, 1L, 2L, 5L) with server-verified real-time stock.
                  </p>
                </div>

                {/* Filter and Sort Controls */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5" /> Sort:
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-white border border-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:border-emerald-700 focus:outline-none"
                    >
                      <option value="featured">Featured</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="rating">Top Rated</option>
                    </select>
                  </div>

                  {activeCategory && (
                    <button
                      onClick={() => setActiveCategory(null)}
                      className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl hover:bg-rose-100 transition"
                    >
                      Clear Filter ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Product Cards Grid with Multi-Quantity Pills */}
              {loadingProducts ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-80 rounded-3xl bg-slate-200/60 animate-pulse" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
                  <p className="text-sm font-bold text-slate-600">No products found matching your filter criteria.</p>
                  <button
                    onClick={() => {
                      setActiveCategory(null);
                      setSearchQuery('');
                      setSelectedBrand(null);
                    }}
                    className="mt-3 px-4 py-2 bg-[#14532d] text-white text-xs font-bold rounded-xl"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onOpenModal={() => handleOpenProductDetail(product)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 6. App Download Banner (Matching Screenshot 4) */}
            <AppDownloadBanner />
          </>
        )}
      </main>

      {/* Cart Drawer (Quick slide-out) */}
      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Full Product Detail Modal (for quick modal views) */}
      {activeProductSlug && (
        <ProductDetailModal
          slug={activeProductSlug}
          onClose={() => setActiveProductSlug(null)}
          onBuyNow={() => {
            setActiveProductSlug(null);
            setIsCheckoutOpen(true);
          }}
        />
      )}

      {/* 1-Page Checkout Modal with Dhaka delivery slots & payments */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={(trackingNo) => {
          setIsCheckoutOpen(false);
          setCurrentView('home');
          trackOrderNumber(trackingNo);
        }}
      />

      {/* Real-time Order Tracking Modal */}
      <OrderTrackingModal />

      {/* Auth Modal (Phone-first Login & Register) */}
      <AuthModal />

      {/* Customer Account & Address Manager Portal */}
      <AccountPortal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        initialTab={accountTab}
      />

      {/* Staff & Admin Operations Portal with CMS Banners Tab */}
      <AdminPortal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      {/* Favourites / Wishlist Modal */}
      <FavouritesModal />

      {/* Brand Footer with BSTI guarantee, delivery hubs & payment gateways */}
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <MainContent />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
