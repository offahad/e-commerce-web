import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Heart,
  User as UserIcon,
  MapPin,
  Clock,
  Flame,
  ShieldCheck,
  Package,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

interface HeaderProps {
  onSelectCategory: (slug: string | null) => void;
  activeCategory: string | null;
  onOpenAdmin: () => void;
  onOpenAccount: (tab?: string) => void;
  onSearchSubmit: (q: string) => void;
  onOpenProductModal: (slug: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectCategory,
  activeCategory,
  onOpenAdmin,
  onOpenAccount,
  onSearchSubmit,
  onOpenProductModal,
}) => {
  const { user, isAuthenticated, isApproved, isAdmin, logout, openAuthModal } = useAuth();
  const { itemCount, subtotal, openCart, wishlistIds, trackOrderNumber } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [trackInputOpen, setTrackInputOpen] = useState(false);
  const [trackingNumberInput, setTrackingNumberInput] = useState('');

  const searchRef = useRef<HTMLDivElement>(null);
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
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Banner */}
      <div className="bg-emerald-900 text-emerald-100 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-700 text-white font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide">
              Dhaka Express
            </span>
            <span>⚡ Same-day Delivery across Dhaka • <strong>FREE</strong> delivery on orders over ৳1,000</span>
          </div>
          <div className="flex items-center gap-4 text-emerald-200">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Next Slot: 2:00 PM - 5:00 PM
            </span>
            <span className="hidden sm:inline">|</span>
            <button
              onClick={() => onOpenAdmin()}
              className="hover:text-white transition flex items-center gap-1 text-[11px] font-semibold bg-emerald-800/80 px-2 py-0.5 rounded"
            >
              <LayoutDashboard className="w-3 h-3 text-emerald-300" /> Admin Portal
            </button>
            <span className="hidden sm:inline">|</span>
            <span className="font-semibold text-emerald-100">Hotline: 01700-000000</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Location */}
          <div className="flex items-center gap-6">
            <div
              onClick={() => onSelectCategory(null)}
              className="cursor-pointer flex items-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-green-500 flex items-center justify-center text-white text-xl shadow-md group-hover:scale-105 transition">
                🛒
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                  LITON <span className="text-emerald-600">BROTHERS</span>
                </span>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block -mt-1">
                  Pure Grocery & Staples
                </span>
              </div>
            </div>

            {/* Location indicator */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Deliver to: <strong className="text-slate-800">Dhaka City</strong></span>
            </div>
          </div>

          {/* Search Bar with Instant Autocomplete */}
          <div ref={searchRef} className="flex-1 max-w-xl relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search Teer oil, Miniket rice, Radhuni turmeric, eggs..."
                className="w-full pl-10 pr-24 py-2.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-sm rounded-full border border-slate-300 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                onClick={() => {
                  setShowSuggestions(false);
                  onSearchSubmit(searchQuery);
                }}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full transition shadow-sm"
              >
                Search
              </button>
            </div>

            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                <div className="p-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 px-3">
                  Products matching &ldquo;{searchQuery}&rdquo;
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {suggestions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setShowSuggestions(false);
                        onOpenProductModal(item.slug);
                      }}
                      className="flex items-center justify-between p-3 hover:bg-emerald-50/60 cursor-pointer transition border-b border-slate-50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg overflow-hidden shrink-0">
                          {item.thumbnailUrl ? (
                            <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            '📦'
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800 line-clamp-1">{item.name}</div>
                          <div className="text-xs text-slate-500">
                            {item.category?.name || 'Grocery'} • {item.brand?.name || 'Standard'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-emerald-700">৳{item.salePrice || item.basePrice}</div>
                        {item.variants?.length > 1 && (
                          <div className="text-[10px] text-slate-400">{item.variants.length} sizes</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Track Order */}
            <div className="relative">
              <button
                onClick={() => setTrackInputOpen(!trackInputOpen)}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 transition"
                title="Track any shipment by tracking number"
              >
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Track Order</span>
              </button>

              {trackInputOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50">
                  <div className="text-xs font-bold text-slate-800 mb-2">Track Any Shipment</div>
                  <form onSubmit={handleTrackSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={trackingNumberInput}
                      onChange={(e) => setTrackingNumberInput(e.target.value)}
                      placeholder="e.g. TRK-DEMO-2026-001"
                      className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded focus:border-emerald-500 focus:outline-none font-mono"
                    />
                    <button
                      type="submit"
                      className="bg-emerald-600 text-white text-xs px-3 py-1.5 font-bold rounded hover:bg-emerald-700"
                    >
                      Track
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => {
                      trackOrderNumber('TRK-DEMO-2026-001');
                      setTrackInputOpen(false);
                    }}
                    className="mt-2 text-[11px] text-emerald-600 hover:underline block text-left"
                  >
                    Quick demo: TRK-DEMO-2026-001
                  </button>
                </div>
              )}
            </div>

            {/* Wishlist */}
            <button
              onClick={() => {
                if (!isAuthenticated) openAuthModal('login');
                else onOpenAccount('orders');
              }}
              className="relative p-2 text-slate-700 hover:text-rose-600 hover:bg-rose-50 rounded-full transition"
              title="Saved items"
            >
              <Heart className="w-5 h-5" />
              {wishlistIds.size > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistIds.size}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition transform active:scale-95"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                    {itemCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-[10px] text-emerald-200 leading-tight">My Basket</div>
                <div className="font-extrabold leading-tight">৳{subtotal.toFixed(0)}</div>
              </div>
            </button>

            {/* Auth / Account Profile Dropdown */}
            <div ref={dropdownRef} className="relative">
              {isAuthenticated ? (
                <div>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pl-2.5 rounded-full hover:bg-slate-100 border border-slate-200 transition"
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <span className="text-xs font-semibold text-slate-800 max-w-[80px] truncate hidden sm:inline">
                      {user?.fullName?.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <div className="text-xs font-bold text-slate-800">{user?.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{user?.phone}</div>
                        <div className="mt-1 flex items-center gap-1 text-[10px]">
                          {isApproved ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Customer
                            </span>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-amber-200">
                              <AlertCircle className="w-3 h-3 text-amber-600" /> Approval Pending
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onOpenAccount('orders');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Package className="w-4 h-4 text-slate-400" /> My Orders & Invoices
                        </button>
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onOpenAccount('addresses');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <MapPin className="w-4 h-4 text-slate-400" /> Saved Addresses
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              onOpenAdmin();
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-emerald-700 hover:bg-emerald-50 font-semibold flex items-center gap-2"
                          >
                            <LayoutDashboard className="w-4 h-4 text-emerald-600" /> Admin Fulfillment Portal
                          </button>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => openAuthModal('login')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 hover:text-emerald-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                >
                  <UserIcon className="w-4 h-4 text-emerald-600" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Header: Categories Bar */}
      <div className="bg-slate-50 border-t border-slate-200/80 px-4 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-4 text-xs font-semibold no-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onSelectCategory(null)}
              className={`px-3 py-1 rounded-lg transition ${
                activeCategory === null
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => onSelectCategory('cooking-oil')}
              className={`px-3 py-1 rounded-lg transition ${
                activeCategory === 'cooking-oil'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              Cooking Oil
            </button>
            <button
              onClick={() => onSelectCategory('rice')}
              className={`px-3 py-1 rounded-lg transition ${
                activeCategory === 'rice'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              Rice & Grains
            </button>
            <button
              onClick={() => onSelectCategory('spices-masala')}
              className={`px-3 py-1 rounded-lg transition ${
                activeCategory === 'spices-masala'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              Masala & Spices
            </button>
            <button
              onClick={() => onSelectCategory('dairy-eggs')}
              className={`px-3 py-1 rounded-lg transition ${
                activeCategory === 'dairy-eggs'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              Dairy & Eggs
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="#friday-flash"
              className="flex items-center gap-1.5 text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-3 py-1 rounded-lg font-bold transition"
            >
              <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Friday Flash Deal</span>
            </a>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1 text-slate-500 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Genuine BSTI Approved</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
