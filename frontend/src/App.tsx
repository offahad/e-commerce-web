import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Header } from './components/Header';
import { HeroBanner, BannerSlide } from './components/HeroBanner';
import { AppDownloadBanner } from './components/AppDownloadBanner';
import { PromoPosterBanner } from './components/PromoPosterBanner';
import { FridayFlashSection } from './components/FridayFlashSection';
import { DealsOfTheDaySection } from './components/DealsOfTheDaySection';
import { CatalogSection } from './components/CatalogSection';
import { CategoryBar } from './components/CategoryBar';
import { CategoryPageView } from './components/CategoryPageView';
import { ProductCard } from './components/ProductCard';
import { ProductDetailView } from './components/ProductDetailView';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CartPage } from './components/CartPage';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { OrdersTrackingModal } from './components/OrdersTrackingModal';
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

  // Navigation View State: 'home' | 'product-detail' | 'cart-page' | 'category-page'
  const [currentView, setCurrentView] = useState<'home' | 'product-detail' | 'cart-page' | 'category-page'>('home');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [categoryPageViewSlug, setCategoryPageViewSlug] = useState<string>('all');
  const [categoryPageViewTitle, setCategoryPageViewTitle] = useState<string>('All Categories');

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
  const [isOrdersTrackingOpen, setIsOrdersTrackingOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [accountTab, setAccountTab] = useState('profile');

  // Hero CMS Banners State
  const [heroSlides, setHeroSlides] = useState<BannerSlide[]>([
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
  ]);

  // Load persistent hero banners from REST API
  useEffect(() => {
    const loadBanners = async () => {
      try {
        const res = await api.getHeroBanners();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setHeroSlides(res.data);
        }
      } catch (err) {
        console.error('Failed to load hero banners', err);
      }
    };
    loadBanners();
    window.addEventListener('lb_banners_updated', loadBanners);
    return () => window.removeEventListener('lb_banners_updated', loadBanners);
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
      let list = res.success && Array.isArray(res.data) ? [...res.data] : [];

      // Merge custom products created/updated by Admin or Moderator
      const customSaved = localStorage.getItem('lb_custom_catalog_products');
      if (customSaved) {
        try {
          const customProducts = JSON.parse(customSaved);
          for (const cp of customProducts) {
            const existingIdx = list.findIndex((p) => p.id === cp.id || p.slug === cp.slug);
            if (existingIdx >= 0) {
              list[existingIdx] = { ...list[existingIdx], ...cp };
            } else {
              list.unshift(cp);
            }
          }
        } catch (e) {}
      }

      setProducts(list);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
    const handleProductsUpdated = () => fetchCatalog();
    window.addEventListener('lb_products_updated', handleProductsUpdated);
    return () => window.removeEventListener('lb_products_updated', handleProductsUpdated);
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

  const handleOpenCategoryPage = (slug: string, title?: string) => {
    setCategoryPageViewSlug(slug || 'all');
    if (title) {
      setCategoryPageViewTitle(title);
    } else {
      const formatted = (slug || 'All Categories')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setCategoryPageViewTitle(formatted);
    }
    setCurrentView('category-page');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Header with Language Selector & Navigation */}
      <Header
        activeCategory={activeCategory}
        onSelectCategory={(slug) => {
          if (!slug || slug === 'all') {
            setActiveCategory(null);
            setSearchQuery('');
            setCurrentView('home');
          } else {
            handleOpenCategoryPage(slug);
          }
        }}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAccount={handleOpenAccount}
        onOpenOrdersTracking={() => setIsOrdersTrackingOpen(true)}
        onSearchSubmit={(q) => {
          setSearchQuery(q);
          if (q.trim()) {
            handleOpenCategoryPage('all', `Search: ${q}`);
          }
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

      {/* Main Body Switcher: Home vs ProductDetailView vs CartPage vs CategoryPage */}
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 md:pb-8 w-full">
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

        {/* VIEW 3: DEDICATED CATEGORY & PRODUCT-BY-ITEMS PAGE */}
        {currentView === 'category-page' && (
          <CategoryPageView
            categorySlug={categoryPageViewSlug}
            categoryTitle={categoryPageViewTitle}
            onBack={() => setCurrentView('home')}
            onOpenProduct={(prod) => handleOpenProductDetail(prod)}
            onSelectCategory={(slug) => handleOpenCategoryPage(slug)}
            apiProducts={products}
          />
        )}

        {/* VIEW 4: HOMEPAGE STOREFRONT (Promotional Hero -> Friday Flash -> Deals of the Day -> Categories & Items -> Promo Poster Banner -> Footer) */}
        {currentView === 'home' && (
          <>
            {/* 1. Hero Promotional Banner with Wave & Auto-advancing CMS Carousel */}
            <HeroBanner
              slides={heroSlides}
              onShopNow={(categorySlug) => {
                if (categorySlug) {
                  handleOpenCategoryPage(categorySlug);
                } else {
                  handleOpenCategoryPage('all');
                }
              }}
            />

            {/* 2. Friday Flash Deals (when deal is active it will show products, if not then it will show "Friday deals are closed for today. It will appear on Friday.") */}
            <FridayFlashSection
              onOpenProductModal={(slug) => {
                setActiveProductSlug(slug);
              }}
              onOpenProduct={(prod) => handleOpenProductDetail(prod)}
            />

            {/* 3. Deals of the Day with Red Clock Timer Badges, Sold: X/Y Progress & Sold Out Overlay */}
            <DealsOfTheDaySection
              onOpenProduct={(prod) => handleOpenProductDetail(prod)}
              onSeeMore={() => handleOpenCategoryPage('deals', t('dealsTitle') || 'Deals of the Day')}
            />

            {/* 4. Other Categories: Dual Mode Catalog Switcher ("By Category" vs "Product by Items") */}
            <CatalogSection
              onOpenProduct={(prod) => handleOpenProductDetail(prod)}
              onFilterByCategory={(slug, title) => handleOpenCategoryPage(slug, title)}
            />

            {/* 5. Another Promo Item Segment as a Banner or Poster Just Before the Footer */}
            <PromoPosterBanner
              onShopDeals={() => handleOpenCategoryPage('all', 'Summer Promo Deals')}
            />
          </>
        )}
      </main>

      {/* Cart Drawer (Quick slide-out) */}
      <CartDrawer />

      {/* Full Product Detail Modal (for quick modal views) */}
      {activeProductSlug && (
        <ProductDetailModal
          slug={activeProductSlug}
          onClose={() => setActiveProductSlug(null)}
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
          setIsOrdersTrackingOpen(true);
        }}
      />

      {/* Dedicated Orders & Live Status Tracking Modal (Triggered by Location Pin Button) */}
      <OrdersTrackingModal
        isOpen={isOrdersTrackingOpen}
        onClose={() => setIsOrdersTrackingOpen(false)}
        onOpenStore={() => setCurrentView('home')}
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
