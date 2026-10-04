import React, { useState, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Plus,
  Minus,
  Star,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

interface CatalogSectionProps {
  onOpenProduct: (product: any) => void;
  onFilterByCategory: (slug: string, title?: string) => void;
}

export interface PastelItem {
  id: string;
  name: string;
  slug: string;
  bgColor: string;
  imageUrl: string;
  iconText: string;
}

const DEFAULT_PASTEL_ITEMS: PastelItem[] = [
  {
    id: 'item-oil',
    name: 'Oil',
    slug: 'cooking-oil',
    bgColor: 'bg-amber-50 border-amber-100',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
    iconText: '🫒',
  },
  {
    id: 'item-rice',
    name: 'Rice',
    slug: 'rice',
    bgColor: 'bg-slate-50 border-slate-200',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    iconText: '🍚',
  },
  {
    id: 'item-veg',
    name: 'Vegetables',
    slug: 'vegetables',
    bgColor: 'bg-emerald-50 border-emerald-100',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80',
    iconText: '🥦',
  },
  {
    id: 'item-fruits',
    name: 'Fruits',
    slug: 'fruits',
    bgColor: 'bg-rose-50 border-rose-100',
    imageUrl: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&w=400&q=80',
    iconText: '🍎',
  },
  {
    id: 'item-drinks',
    name: 'Drinks',
    slug: 'beverages',
    bgColor: 'bg-cyan-50 border-cyan-100',
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
    iconText: '🥤',
  },
  {
    id: 'item-flour',
    name: 'Flour',
    slug: 'flour-atta',
    bgColor: 'bg-orange-50 border-orange-100',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
    iconText: '🌾',
  },
  {
    id: 'item-sugar',
    name: 'Sugar',
    slug: 'sugar',
    bgColor: 'bg-pink-50 border-pink-100',
    imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=400&q=80',
    iconText: '🍬',
  },
  {
    id: 'item-salt',
    name: 'Salt',
    slug: 'salt',
    bgColor: 'bg-gray-50 border-gray-200',
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80',
    iconText: '🧂',
  },
  {
    id: 'item-dal',
    name: 'Dal & Pulses',
    slug: 'dal-pulses',
    bgColor: 'bg-yellow-50 border-yellow-100',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    iconText: '🫘',
  },
  {
    id: 'item-noodles',
    name: 'Noodles & Pasta',
    slug: 'noodles-pasta',
    bgColor: 'bg-red-50 border-red-100',
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
    iconText: '🍜',
  },
  {
    id: 'item-spices',
    name: 'Spices',
    slug: 'spices',
    bgColor: 'bg-amber-50 border-amber-100',
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&q=80',
    iconText: '🌶️',
  },
  {
    id: 'item-dairy',
    name: 'Dairy & Eggs',
    slug: 'dairy',
    bgColor: 'bg-blue-50 border-blue-100',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
    iconText: '🥛',
  },
  {
    id: 'item-meat',
    name: 'Meat & Fish',
    slug: 'meat-fish',
    bgColor: 'bg-rose-50 border-rose-100',
    imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80',
    iconText: '🍗',
  },
];

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  onOpenProduct,
  onFilterByCategory,
}) => {
  const { t } = useLanguage();
  const { cartItems, addToCart, updateQuantity, removeItem, toggleWishlist, isWishlisted } = useCart();
  const [activeTab, setActiveTab] = useState<'category' | 'items'>('category');

  // Custom items list synced from Admin Portal
  const [pastelItems, setPastelItems] = useState<PastelItem[]>(() => {
    let list = [...DEFAULT_PASTEL_ITEMS];
    try {
      const saved = localStorage.getItem('lb_custom_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        for (const it of parsed) {
          if (!list.some((existing) => existing.slug === it.slug || existing.name.toLowerCase() === it.name.toLowerCase())) {
            list.push({
              id: 'custom-item-' + (it.slug || it.name),
              name: it.name,
              slug: it.slug || it.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              bgColor: 'bg-emerald-50 border-emerald-100',
              imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
              iconText: it.icon || '📦',
            });
          }
        }
      }
    } catch (e) {}
    return list;
  });

  // Custom products list synced from Admin Portal
  const [customCatalogProducts, setCustomCatalogProducts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('lb_custom_catalog_products');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  React.useEffect(() => {
    const handleSync = () => {
      try {
        const iSaved = localStorage.getItem('lb_custom_items');
        if (iSaved) {
          const parsed = JSON.parse(iSaved);
          let list = [...DEFAULT_PASTEL_ITEMS];
          for (const it of parsed) {
            if (!list.some((existing) => existing.slug === it.slug || existing.name.toLowerCase() === it.name.toLowerCase())) {
              list.push({
                id: 'custom-item-' + (it.slug || it.name),
                name: it.name,
                slug: it.slug || it.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                bgColor: 'bg-emerald-50 border-emerald-100',
                imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
                iconText: it.icon || '📦',
              });
            }
          }
          setPastelItems(list);
        }
      } catch (e) {}
      try {
        const pSaved = localStorage.getItem('lb_custom_catalog_products');
        if (pSaved) setCustomCatalogProducts(JSON.parse(pSaved));
      } catch (e) {}
    };

    window.addEventListener('lb_items_updated', handleSync);
    window.addEventListener('lb_products_updated', handleSync);
    return () => {
      window.removeEventListener('lb_items_updated', handleSync);
      window.removeEventListener('lb_products_updated', handleSync);
    };
  }, []);

  // Carousel refs for horizontal scrolling
  const youMightNeedRef = useRef<HTMLDivElement>(null);
  const vegetablesRef = useRef<HTMLDivElement>(null);
  const fruitsRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Sample structured rail products matching Screenshots 3, 5, 8
  const youMightNeedProducts = [
    {
      id: 'ymn-1',
      name: 'Fresh Beetroot',
      slug: 'fresh-beetroot',
      price: 120,
      rating: 4.8,
      reviewsCount: 234,
      imageUrl: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?auto=format&fit=crop&w=500&q=80',
      unit: '1 kg',
      variantId: 'v-ymn-1',
    },
    {
      id: 'ymn-2',
      name: 'Italian Avocado',
      slug: 'italian-avocado',
      price: 350,
      rating: 4.7,
      reviewsCount: 189,
      imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=500&q=80',
      unit: '1 pc',
      variantId: 'v-ymn-2',
    },
    {
      id: 'ymn-3',
      name: 'Premium Beef (Cut Bone)',
      slug: 'fresh-beef-cut-bone',
      price: 750,
      rating: 4.9,
      reviewsCount: 312,
      imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=500&q=80',
      unit: '1 kg',
      variantId: 'v-ymn-3',
    },
    {
      id: 'ymn-4',
      name: 'Sprite Cold Drink (Can)',
      slug: 'sprite-cold-drink-can',
      price: 50,
      rating: 4.6,
      reviewsCount: 567,
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80',
      unit: '250 ml',
      variantId: 'v-ymn-4',
    },
    {
      id: 'ymn-5',
      name: 'Aarong Dairy Liquid Milk',
      slug: 'aarong-dairy-pure-liquid-milk',
      price: 90,
      regularPrice: 110,
      rating: 4.9,
      reviewsCount: 892,
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
      unit: '1 Ltr',
      discountPercentage: 18,
      variantId: 'v-ymn-5',
    },
  ];

  const vegetableProducts = [
    {
      id: 'veg-1',
      name: 'Fresh Beetroot',
      slug: 'fresh-beetroot',
      price: 120,
      rating: 4.8,
      reviewsCount: 234,
      imageUrl: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?auto=format&fit=crop&w=500&q=80',
      unit: '1 kg',
      variantId: 'v-veg-1',
    },
    {
      id: 'veg-2',
      name: 'Organic Tomatoes',
      slug: 'organic-tomatoes',
      price: 48,
      regularPrice: 65,
      rating: 4.6,
      reviewsCount: 423,
      discountPercentage: 27,
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80',
      unit: '500 gm',
      variantId: 'v-veg-2',
    },
    {
      id: 'veg-3',
      name: 'Fresh Carrots',
      slug: 'fresh-carrots',
      price: 75,
      rating: 4.7,
      reviewsCount: 234,
      imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=80',
      unit: '1 kg',
      variantId: 'v-veg-3',
    },
    {
      id: 'veg-4',
      name: 'Green Capsicum (Bell Pepper)',
      slug: 'green-capsicum',
      price: 140,
      rating: 4.8,
      reviewsCount: 156,
      imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=500&q=80',
      unit: '500 gm',
      variantId: 'v-veg-4',
    },
  ];

  const fruitProducts = [
    {
      id: 'frt-1',
      name: 'Italian Avocado',
      slug: 'italian-avocado',
      price: 350,
      rating: 4.8,
      reviewsCount: 189,
      imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=500&q=80',
      unit: '1 pc',
      variantId: 'v-frt-1',
    },
    {
      id: 'frt-2',
      name: 'Fresh Oranges',
      slug: 'fresh-sweet-oranges',
      price: 220,
      regularPrice: 275,
      rating: 4.7,
      reviewsCount: 234,
      discountPercentage: 20,
      imageUrl: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=500&q=80',
      unit: '1 kg',
      variantId: 'v-frt-2',
    },
    {
      id: 'frt-3',
      name: 'Green Apples',
      slug: 'green-apples',
      price: 280,
      rating: 4.5,
      reviewsCount: 189,
      imageUrl: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&w=500&q=80',
      unit: '1 kg',
      variantId: 'v-frt-3',
    },
    {
      id: 'frt-4',
      name: 'Red Fuji Apples',
      slug: 'red-fuji-apples',
      price: 310,
      rating: 4.9,
      reviewsCount: 412,
      imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=500&q=80',
      unit: '1 kg',
      variantId: 'v-frt-4',
    },
  ];

  // Merge custom products into rails
  const mergedYouMightNeed = React.useMemo(() => {
    const customList = customCatalogProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.salePrice || p.price || 100),
      regularPrice: Number(p.basePrice || p.regularPrice),
      rating: 4.9,
      reviewsCount: 150,
      imageUrl: p.primaryImage || p.images?.[0]?.imageUrl || youMightNeedProducts[0].imageUrl,
      unit: p.unit || p.variantName || '1 Pack',
      variantId: p.variants?.[0]?.id || `v-${p.id}`,
    }));
    return [...customList, ...youMightNeedProducts];
  }, [customCatalogProducts]);

  const mergedVegetables = React.useMemo(() => {
    const customVegs = customCatalogProducts
      .filter((p) => p.categorySlug === 'vegetables' || p.category?.slug === 'vegetables' || p.itemType?.toLowerCase().includes('veg'))
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.salePrice || p.price || 100),
        regularPrice: Number(p.basePrice || p.regularPrice),
        rating: 4.8,
        reviewsCount: 120,
        imageUrl: p.primaryImage || p.images?.[0]?.imageUrl || vegetableProducts[0].imageUrl,
        unit: p.unit || p.variantName || '1 Pack',
        variantId: p.variants?.[0]?.id || `v-${p.id}`,
      }));
    return [...customVegs, ...vegetableProducts];
  }, [customCatalogProducts]);

  const mergedFruits = React.useMemo(() => {
    const customFruits = customCatalogProducts
      .filter((p) => p.categorySlug === 'fruits' || p.category?.slug === 'fruits' || p.itemType?.toLowerCase().includes('fruit'))
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.salePrice || p.price || 100),
        regularPrice: Number(p.basePrice || p.regularPrice),
        rating: 4.9,
        reviewsCount: 180,
        imageUrl: p.primaryImage || p.images?.[0]?.imageUrl || fruitProducts[0].imageUrl,
        unit: p.unit || p.variantName || '1 Pack',
        variantId: p.variants?.[0]?.id || `v-${p.id}`,
      }));
    return [...customFruits, ...fruitProducts];
  }, [customCatalogProducts]);

  const renderProductRail = (
    title: string,
    products: any[],
    ref: React.RefObject<HTMLDivElement | null>,
    categorySlug: string
  ) => (
    <div className="my-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl sm:text-2xl font-black text-[#14532d] tracking-tight">
          {title}
        </h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onFilterByCategory(categorySlug, title.replace(/^[^\w\s]+/, '').trim())}
            className="text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition"
          >
            <span>{t('seeMore')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => scrollCarousel(ref, 'left')}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollCarousel(ref, 'right')}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={ref}
        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none pb-3 scroll-smooth no-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {products.map((p) => (
          <div
            key={p.id}
            onClick={() => onOpenProduct(p)}
            className="group shrink-0 w-44 sm:w-56 bg-white rounded-3xl p-3 sm:p-3.5 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div>
              {/* Image & Wishlist Button */}
              <div className="relative w-full h-36 rounded-2xl bg-slate-50 overflow-hidden mb-2.5">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(p.id, p);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm text-slate-500 hover:text-rose-500 transition"
                  title="Add to Favourites"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isWishlisted(p.id) ? 'fill-rose-500 text-rose-500' : ''
                    }`}
                  />
                </button>
                {p.discountPercentage && (
                  <span className="absolute top-2 left-2 bg-emerald-800 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    -{p.discountPercentage}%
                  </span>
                )}
              </div>

              {/* Title & Star Rating */}
              <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-emerald-700 transition">
                {p.name}
              </h4>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-500">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <span className="text-slate-400 font-medium">({p.reviewsCount})</span>
              </div>
            </div>

            {/* Price & Add to Cart button */}
            <div className="mt-3 pt-2 border-t border-slate-50">
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-base font-black text-emerald-800">৳{p.price}</span>
                {p.regularPrice && (
                  <span className="text-xs text-slate-400 line-through">৳{p.regularPrice}</span>
                )}
              </div>

              {(() => {
                const ci = cartItems.find((c) => {
                  if (p.variantId && c.variantId === p.variantId) return true;
                  if (p.id && (c.productId === p.id || c.id === p.id)) return true;
                  const cName = (c.productName || c.name || '').toLowerCase().trim();
                  const pName = (p.name || '').toLowerCase().trim();
                  return pName.length > 0 && cName === pName;
                });
                const cartQty = ci ? ci.quantity : 0;

                if (cartQty > 0 && ci) {
                  return (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="w-full py-1.5 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-between px-3 shadow-md animate-fade-in"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (cartQty > 1) {
                            updateQuantity(ci.id, cartQty - 1);
                          } else {
                            removeItem(ci.id);
                          }
                        }}
                        className="w-6 h-6 rounded-full bg-emerald-900 hover:bg-emerald-950 flex items-center justify-center transition active:scale-90"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-black text-sm px-2 text-center min-w-[20px]">{cartQty}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(ci.id, cartQty + 1);
                        }}
                        className="w-6 h-6 rounded-full bg-emerald-900 hover:bg-emerald-950 flex items-center justify-center transition active:scale-90"
                        title="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                }

                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(p.variantId || 'v-' + p.id, 1, p);
                    }}
                    className="w-full py-2 rounded-full border border-emerald-800 text-emerald-800 hover:bg-emerald-800 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('addToCart')}</span>
                  </button>
                );
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="my-8">
      {/* Segmented Dual Mode Switcher (Matching Screenshots 8 & 9) */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-full w-fit mb-6 shadow-inner">
        <button
          onClick={() => setActiveTab('category')}
          className={`px-5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'category'
              ? 'bg-[#14532d] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('byCategory')}
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`px-5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'items'
              ? 'bg-[#14532d] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('productByItems')}
        </button>
      </div>

      {/* Mode 1: By Category View */}
      {activeTab === 'category' && (
        <div className="space-y-6">
          {/* Category Icon Strip with Sublabels (Matching Screenshot 3) */}
          <div className="my-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-black text-slate-800">Category</h3>
              <button
                type="button"
                onClick={() => onFilterByCategory('all', 'All Categories')}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950"
              >
                See All &gt;
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { name: t('categoryVegetable'), sub: t('categoryVegetableSub'), icon: '🥦', slug: 'vegetables', bg: 'bg-emerald-50' },
                { name: t('categoryFruits'), sub: t('categoryFruitsSub'), icon: '🍎', slug: 'fruits', bg: 'bg-red-50' },
                { name: t('categorySnacks'), sub: t('categorySnacksSub'), icon: '🥐', slug: 'snacks', bg: 'bg-amber-50' },
                { name: t('categoryMeat'), sub: t('categoryMeatSub'), icon: '🍗', slug: 'meat-fish', bg: 'bg-orange-50' },
                { name: t('categoryDairy'), sub: t('categoryDairySub'), icon: '🧀', slug: 'dairy', bg: 'bg-yellow-50' },
                { name: t('categoryBeverages'), sub: t('categoryBeveragesSub'), icon: '🥤', slug: 'beverages', bg: 'bg-cyan-50' },
              ].map((c) => (
                <div
                  key={c.slug}
                  onClick={() => onFilterByCategory(c.slug, c.name)}
                  className={`cursor-pointer rounded-2xl p-3 ${c.bg} border border-slate-100 hover:shadow-md transition flex items-center justify-between`}
                >
                  <div className="text-left">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">{c.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{c.sub}</div>
                  </div>
                  <span className="text-2xl shrink-0 ml-2">{c.icon}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rail 1: You might need */}
          {renderProductRail(t('youMightNeed'), mergedYouMightNeed, youMightNeedRef, 'all')}

          {/* Rail 2: Fresh Vegetables */}
          {renderProductRail(`🥦 ${t('freshVegetables')}`, mergedVegetables, vegetablesRef, 'vegetables')}

          {/* Rail 3: Fresh Fruits */}
          {renderProductRail(`🍎 ${t('freshFruits')}`, mergedFruits, fruitsRef, 'fruits')}
        </div>
      )}

      {/* Mode 2: Product by Items View (Matching Screenshot 9) */}
      {activeTab === 'items' && (
        <div className="my-6">
          <div className="mb-4 text-left">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">Essential Pantry Items</h3>
            <p className="text-xs sm:text-sm text-slate-500">Explore all major staple items, brands, and pack sizes.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pastelItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onFilterByCategory(item.slug, item.name)}
                className={`cursor-pointer rounded-3xl p-4 border ${item.bgColor} shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-sm group-hover:text-emerald-800 transition">
                    {item.name}
                  </span>
                  <span className="text-lg">{item.iconText}</span>
                </div>

                <div className="relative w-full h-28 rounded-2xl overflow-hidden bg-white/60 mb-3 flex items-center justify-center p-2">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="text-left">
                  <div className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-700 transition flex items-center gap-1">
                    <span>{t('viewBrandsSizes')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
