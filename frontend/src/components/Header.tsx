import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Search,
  ShoppingCart,
  Heart,
  MapPin,
  Clock,
  Package,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  Globe,
  Sparkles,
  Zap,
  User,
  Home,
  LayoutGrid,
  Flame,
  X,
  Phone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { api } from '../services/api';

interface HeaderProps {
  onSelectCategory: (slug: string | null) => void;
  activeCategory: string | null;
  onOpenAdmin: () => void;
  onOpenAccount: (tab?: string) => void;
  onOpenOrdersTracking: () => void;
  onSearchSubmit: (q: string) => void;
  onOpenProductModal: (slug: string) => void;
  onOpenCartPage?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectCategory,
  activeCategory,
  onOpenAdmin,
  onOpenAccount,
  onOpenOrdersTracking,
  onSearchSubmit,
  onOpenProductModal,
  onOpenCartPage,
}) => {
  const { user, isAuthenticated, isApproved, isAdmin, logout, openAuthModal } = useAuth();
  const { itemCount, subtotal, openCart, favouriteItems, openFavourites, trackOrderNumber } = useCart();
  const { language, setLanguage, t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [trackInputOpen, setTrackInputOpen] = useState(false);
  const [trackingNumberInput, setTrackingNumberInput] = useState('');

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Autocomplete debounced fetch
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.getSuggestions(searchQuery.trim());
        if (res.success && Array.isArray(res.data)) {
          setSuggestions(res.data);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error(err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchRef.current && !searchRef.current.contains(e.target as Node) &&
        mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      onSearchSubmit(searchQuery);
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumberInput.trim()) {
      trackOrderNumber(trackingNumberInput.trim());
      setTrackInputOpen(false);
      setTrackingNumberInput('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#14532d] text-white border-b border-emerald-800 shadow-md">
        {/* Main Single Clean Header Bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-6">
            {/* Left: Hamburger Menu + Brand Logo */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 hover:bg-emerald-800 rounded-xl text-emerald-100 transition cursor-pointer active:scale-95"
                title="Open Navigation Menu"
                aria-label="Navigation Menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <div
                onClick={() => {
                  onSelectCategory(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="cursor-pointer flex items-center gap-2 select-none"
              >
                <div className="w-8 h-8 rounded-xl bg-white text-[#14532d] flex items-center justify-center font-black shadow-sm shrink-0">
                  <ShoppingCart className="w-5 h-5 fill-current" />
                </div>
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-white truncate max-w-[150px] sm:max-w-none">
                  {t('brandName')}
                </span>
              </div>
            </div>

            {/* Middle: Desktop Rounded Search Bar */}
            <div ref={searchRef} className="relative flex-1 max-w-xl mx-auto hidden md:block">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full bg-white text-slate-800 placeholder-slate-400 pl-4 pr-11 py-2 rounded-full text-xs sm:text-sm border-0 focus:ring-2 focus:ring-yellow-400 focus:outline-none shadow-inner"
                />
                <button
                  onClick={() => onSearchSubmit(searchQuery)}
                  className="absolute right-1.5 w-8 h-8 rounded-full bg-transparent hover:bg-slate-100 flex items-center justify-center text-slate-500 transition cursor-pointer"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Autocomplete Dropdown (Desktop) */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 px-3">
                    Matching items
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {suggestions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setShowSuggestions(false);
                          onOpenProductModal(item.slug);
                        }}
                        className="flex items-center justify-between p-3 hover:bg-emerald-50 cursor-pointer transition border-b border-slate-50 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-base overflow-hidden shrink-0">
                            {item.thumbnailUrl ? (
                              <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              '📦'
                            )}
                          </div>
                          <div className="text-left">
                            <div className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-1">{item.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {item.category?.name || 'Grocery'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs sm:text-sm font-bold text-emerald-800">৳{item.salePrice || item.basePrice}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick-Commerce 15-Minute Badge (Desktop) */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-emerald-100 whitespace-nowrap">
              <span className="text-yellow-300 font-extrabold flex items-center gap-1">
                <Zap className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                <span>{t('expressBadge')}</span>
              </span>
            </div>

            {/* Right: Icons Strip */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Location Pin - Dedicated Orders & Live Status Tracking */}
              <button
                type="button"
                onClick={onOpenOrdersTracking}
                className="p-1.5 hover:bg-emerald-800 rounded-full text-emerald-100 hover:text-white transition flex items-center justify-center group relative cursor-pointer"
                title="My Orders & Live Delivery Tracking"
                aria-label="Order Tracking"
              >
                <MapPin className="w-5 h-5 transition-transform group-hover:scale-110" />
              </button>

              {/* Wishlist Heart with count */}
              <button
                onClick={openFavourites}
                className="relative p-1.5 hover:bg-emerald-800 rounded-full text-emerald-100 hover:text-white transition group cursor-pointer"
                title="My Favourite Items"
                aria-label="Favourites"
              >
                <Heart
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    favouriteItems.length > 0 ? 'fill-rose-400 text-rose-400' : ''
                  }`}
                />
                {favouriteItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-fade-in shadow-xs">
                    {favouriteItems.length}
                  </span>
                )}
              </button>

              {/* Shopping Cart Icon */}
              <button
                onClick={() => (onOpenCartPage ? onOpenCartPage() : openCart())}
                className="relative p-1.5 hover:bg-emerald-800 rounded-full text-emerald-100 hover:text-white transition cursor-pointer"
                title="Shopping Cart"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] sm:min-w-[20px] h-4.5 sm:h-5 px-1 rounded-full bg-yellow-400 text-slate-950 text-[11px] sm:text-xs font-black flex items-center justify-center shadow-md animate-fade-in">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Circular User Profile Avatar */}
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#fed7aa] border-2 border-amber-200 text-amber-900 font-extrabold flex items-center justify-center text-xs sm:text-sm shadow-md hover:ring-2 hover:ring-amber-300 transition cursor-pointer"
                  title="Profile & Settings"
                  aria-label="Profile"
                >
                  {isAuthenticated && user?.fullName ? user.fullName.charAt(0).toUpperCase() : '👤'}
                </button>

                {/* User Dropdown with Language Switcher */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 max-w-[calc(100vw-1.5rem)] bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 overflow-hidden">
                    {/* Account Header */}
                    {isAuthenticated ? (
                      <div className="px-4 py-2 border-b border-slate-100">
                        <div className="text-xs font-bold text-slate-900 truncate">{user?.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{user?.phone}</div>
                        <div className="mt-1">
                          {isApproved ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Verified Customer
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Approval Pending
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-3 border-b border-slate-100 text-center">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            openAuthModal('login');
                          }}
                          className="w-full py-2 bg-[#14532d] hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition shadow cursor-pointer"
                        >
                          {t('signIn')}
                        </button>
                      </div>
                    )}

                    {/* Language Settings Section */}
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-emerald-800" />
                          <span>{t('language')}</span>
                        </span>
                        <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                          {language.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setLanguage('en')}
                          className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                            language === 'en'
                              ? 'bg-[#14532d] text-white border-[#14532d]'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          🇬🇧 English
                        </button>
                        <button
                          type="button"
                          onClick={() => setLanguage('bn')}
                          className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                            language === 'bn'
                              ? 'bg-[#14532d] text-white border-[#14532d]'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          🇧🇩 বাংলা
                        </button>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenAccount('profile');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold cursor-pointer"
                      >
                        <User className="w-4 h-4 text-emerald-800" />
                        <span>{t('myAccount')} (Profile)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenAccount('addresses');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <MapPin className="w-4 h-4 text-slate-400" /> Saved Addresses
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenOrdersTracking();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Package className="w-4 h-4 text-slate-400" /> My Orders & Live Tracking
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          openFavourites();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                        <span>My Favourite Items</span>
                        {favouriteItems.length > 0 && (
                          <span className="ml-auto text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                            {favouriteItems.length}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenOrdersTracking();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Clock className="w-4 h-4 text-slate-400" /> {t('trackOrder')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenAdmin();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-emerald-800 font-bold hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 text-emerald-700" /> {t('adminPortal')}
                      </button>
                      {isAuthenticated && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100 mt-1 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" /> {t('signOut')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Search Bar with LIVE Autocomplete Dropdown */}
          <div ref={mobileSearchRef} className="mt-2 md:hidden relative">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                placeholder={t('searchPlaceholder')}
                className="w-full bg-white text-slate-800 placeholder-slate-400 pl-3.5 pr-10 py-2 rounded-full text-xs border-0 focus:ring-2 focus:ring-yellow-400 focus:outline-none shadow-sm"
              />
              <button
                type="button"
                onClick={() => onSearchSubmit(searchQuery)}
                className="absolute right-1 w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-emerald-800 cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Autocomplete Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                <div className="p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 px-3 flex items-center justify-between">
                  <span>Matching items ({suggestions.length})</span>
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {suggestions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setShowSuggestions(false);
                        onOpenProductModal(item.slug);
                      }}
                      className="flex items-center justify-between p-2.5 hover:bg-emerald-50 cursor-pointer transition border-b border-slate-50 last:border-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm overflow-hidden shrink-0">
                          {item.thumbnailUrl ? (
                            <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            '📦'
                          )}
                        </div>
                        <div className="text-left min-w-0">
                          <div className="text-xs font-semibold text-slate-800 truncate">{item.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {item.category?.name || 'Grocery'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs font-bold text-emerald-800">৳{item.salePrice || item.basePrice}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Slide-out Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-fade-in">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 text-slate-900">
            {/* Drawer Header */}
            <div className="p-4 bg-[#14532d] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white text-[#14532d] flex items-center justify-center font-black">
                  <ShoppingCart className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <div className="font-extrabold text-sm">{t('brandName')}</div>
                  <div className="text-[10px] text-emerald-200">15-Min Express Grocery</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Switcher in Drawer */}
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-800" />
                <span>{t('language')}</span>
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${
                    language === 'en'
                      ? 'bg-[#14532d] text-white border-[#14532d]'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('bn')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${
                    language === 'bn'
                      ? 'bg-[#14532d] text-white border-[#14532d]'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  বাংলা
                </button>
              </div>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-semibold">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSelectCategory(null);
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 flex items-center gap-3 text-slate-800"
              >
                <Home className="w-4 h-4 text-emerald-800" />
                <span>Home Storefront</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSelectCategory('all');
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 flex items-center gap-3 text-slate-800"
              >
                <LayoutGrid className="w-4 h-4 text-emerald-800" />
                <span>Browse All Categories</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSelectCategory('deals');
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 flex items-center gap-3 text-rose-700 font-bold"
              >
                <Flame className="w-4 h-4 text-rose-600" />
                <span>Deals & Flash Bazaar</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenOrdersTracking();
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 flex items-center gap-3 text-slate-800"
              >
                <MapPin className="w-4 h-4 text-emerald-800" />
                <span>Live Orders Tracking</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openFavourites();
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 flex items-center justify-between text-slate-800"
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span>My Favourites</span>
                </div>
                {favouriteItems.length > 0 && (
                  <span className="bg-rose-100 text-rose-700 font-black text-[10px] px-2 py-0.5 rounded-full">
                    {favouriteItems.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="w-full text-left p-2.5 rounded-xl bg-emerald-50 text-emerald-900 font-bold flex items-center gap-3 mt-2"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-700" />
                <span>{t('adminPortal')}</span>
              </button>
            </div>

            {/* Drawer User Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#fed7aa] text-amber-900 font-black flex items-center justify-center text-xs">
                      {user?.fullName?.charAt(0) || '👤'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{user?.fullName}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">{user?.phone}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full py-1.5 text-center text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
                  >
                    {t('signOut')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full py-2 bg-[#14532d] hover:bg-emerald-950 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  {t('signIn')} / Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Track Shipment Dialog Modal */}
      {trackInputOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-slate-900">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Track Any Shipment</h3>
              <button
                onClick={() => setTrackInputOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Enter your tracking code (e.g. TRK-DEMO-2026-001) to view real-time fulfillment timeline.
            </p>
            <form onSubmit={handleTrackSubmit} className="space-y-3">
              <input
                type="text"
                value={trackingNumberInput}
                onChange={(e) => setTrackingNumberInput(e.target.value)}
                placeholder="TRK-DEMO-2026-001"
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-none font-mono"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-[#14532d] hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
              >
                Track Now
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb"
      >
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => {
            onSelectCategory(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
            !activeCategory
              ? 'text-emerald-800 font-extrabold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-none">Home</span>
        </button>

        {/* 2. Categories */}
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
            activeCategory === 'all'
              ? 'text-emerald-800 font-extrabold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-none">Catalog</span>
        </button>

        {/* 3. Live Tracking */}
        <button
          type="button"
          onClick={onOpenOrdersTracking}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-emerald-800 transition cursor-pointer relative"
        >
          <div className="relative">
            <MapPin className="w-5 h-5 mb-0.5 text-emerald-700" />
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <span className="text-[10px] leading-none">Track</span>
        </button>

        {/* 4. Cart */}
        <button
          type="button"
          onClick={() => (onOpenCartPage ? onOpenCartPage() : openCart())}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-emerald-800 transition cursor-pointer relative"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 mb-0.5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-yellow-400 text-slate-950 font-black text-[9px] flex items-center justify-center shadow-xs">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-none font-bold">Cart</span>
        </button>

        {/* 5. Account / Profile */}
        <button
          type="button"
          onClick={() => {
            if (isAuthenticated) {
              onOpenAccount('profile');
            } else {
              openAuthModal('login');
            }
          }}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-emerald-800 transition cursor-pointer"
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-none">{isAuthenticated ? 'Account' : 'Sign In'}</span>
        </button>
      </nav>
    </>
  );
};
