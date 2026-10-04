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
  Sparkles,
  Flame,
  Zap,
  Shield,
  ShieldCheck,
  Lock,
  Edit3,
  Truck,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Clock,
  ArrowRight,
  Filter,
  Tag,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminRole = 'SUPER_ADMIN' | 'MODERATOR';

export const AdminPortal: React.FC<AdminPortalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  // Role Switcher State: defaults to user.role if MODERATOR, else SUPER_ADMIN (allows live testing)
  const [activeRole, setActiveRole] = useState<AdminRole>(() => {
    return user?.role === 'MODERATOR' ? 'MODERATOR' : 'SUPER_ADMIN';
  });

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'customers' | 'inventory' | 'banners' | 'friday-deals'>('orders');

  // Sub-tab for Products: 'add' vs 'update'
  const [productSubTab, setProductSubTab] = useState<'add' | 'update'>('add');

  // Order status filter in Orders tab
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');

  // Hero Banners CMS State
  const [banners, setBanners] = useState<any[]>(() => {
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

  // Friday Flash Deals CMS State
  const [flashItems, setFlashItems] = useState<any[]>(() => {
    const saved = localStorage.getItem('lb_custom_flash_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'flash-oil-1',
        productName: 'Teer Pure Soybean Oil',
        productSlug: 'teer-pure-soybean-oil',
        variantName: '5 Liter',
        regularPrice: 850,
        dealPrice: 790,
        allocatedStock: 50,
        soldStock: 12,
        remainingStock: 38,
        maxPerCustomer: 2,
        savings: 60,
        discountPercentage: 7,
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'flash-rice-1',
        productName: 'Miniket Premium Rice',
        productSlug: 'miniket-premium-rice-5kg',
        variantName: '5 KG',
        regularPrice: 390,
        dealPrice: 330,
        allocatedStock: 40,
        soldStock: 8,
        remainingStock: 32,
        maxPerCustomer: 2,
        savings: 60,
        discountPercentage: 15,
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
      },
    ];
  });

  const [flashForm, setFlashForm] = useState({
    productName: '',
    variantName: '',
    regularPrice: '',
    dealPrice: '',
    allocatedStock: '50',
    maxPerCustomer: '2',
    imageUrl: '',
  });

  const handleAddFlashDealItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flashForm.productName.trim() || !flashForm.variantName.trim()) return;

    const regPrice = Number(flashForm.regularPrice) || 500;
    const dlPrice = Number(flashForm.dealPrice) || Math.round(regPrice * 0.85);
    const savings = Math.max(0, regPrice - dlPrice);
    const discountPercentage = Math.round((savings / Math.max(1, regPrice)) * 100);
    const allocated = Number(flashForm.allocatedStock) || 50;
    const maxCust = Number(flashForm.maxPerCustomer) || 2;

    const newItem = {
      id: 'flash-' + Date.now(),
      productId: 'p-' + Date.now(),
      variantId: 'v-' + Date.now(),
      productName: flashForm.productName.trim(),
      productSlug: flashForm.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      variantName: flashForm.variantName.trim(),
      regularPrice: regPrice,
      dealPrice: dlPrice,
      savings,
      discountPercentage,
      allocatedStock: allocated,
      soldStock: 0,
      remainingStock: allocated,
      maxPerCustomer: maxCust,
      imageUrl: flashForm.imageUrl.trim() || null,
    };

    const updated = [...flashItems, newItem];
    setFlashItems(updated);
    localStorage.setItem('lb_custom_flash_items', JSON.stringify(updated));
    window.dispatchEvent(new Event('lb_flash_deals_updated'));

    setFlashForm({
      productName: '',
      variantName: '',
      regularPrice: '',
      dealPrice: '',
      allocatedStock: '50',
      maxPerCustomer: '2',
      imageUrl: '',
    });
  };

  const handleDeleteFlashDealItem = (id: string) => {
    const updated = flashItems.filter((it) => it.id !== id);
    setFlashItems(updated);
    localStorage.setItem('lb_custom_flash_items', JSON.stringify(updated));
    window.dispatchEvent(new Event('lb_flash_deals_updated'));
  };

  const handleQuickAddFlashPreset = (preset: any) => {
    const newItem = {
      ...preset,
      id: 'flash-' + Date.now(),
      productId: 'p-' + Date.now(),
      variantId: 'v-' + Date.now(),
      soldStock: 0,
      remainingStock: preset.allocatedStock,
    };
    const updated = [...flashItems, newItem];
    setFlashItems(updated);
    localStorage.setItem('lb_custom_flash_items', JSON.stringify(updated));
    window.dispatchEvent(new Event('lb_flash_deals_updated'));
  };

  // KPI Metrics & Core State
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Invoice modal (Super Admin only)
  const [activeInvoice, setActiveInvoice] = useState<any | null>(null);

  // Decline Order Modal
  const [declineModal, setDeclineModal] = useState<{
    orderId: string;
    orderNumber: string;
  } | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('Customer unreachable by phone');

  // Update Order Tracking Modal
  const [trackingModal, setTrackingModal] = useState<{
    order: any;
  } | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<string>('PROCESSING');
  const [riderInfo, setRiderInfo] = useState<string>('Rafiqul Islam - 01700-112233');
  const [trackingComment, setTrackingComment] = useState<string>('Packed in insulated box at Tejgaon warehouse');

  // ==========================================
  // PRODUCT MANAGEMENT (Add & Update Product)
  // Requirement: "Depends on product description admin/moderator can add product"
  // ==========================================

  // Category & Tag Dictionaries
  const DEFAULT_CATEGORIES = [
    { name: 'Cooking Oil', slug: 'cooking-oil' },
    { name: 'Rice & Grains', slug: 'rice' },
    { name: 'Dairy & Eggs', slug: 'dairy' },
    { name: 'Fresh Vegetables', slug: 'vegetables' },
    { name: 'Fresh Fruits', slug: 'fruits' },
    { name: 'Flour, Atta & Suji', slug: 'flour-atta' },
    { name: 'Sugar & Sweeteners', slug: 'sugar' },
    { name: 'Spices & Salt', slug: 'salt' },
    { name: 'Drinks & Beverages', slug: 'beverages' },
    { name: 'Dal & Pulses', slug: 'dal-pulses' },
    { name: 'Noodles & Pasta', slug: 'noodles-pasta' },
    { name: 'Meat & Fish', slug: 'meat-fish' },
  ];

  const DEFAULT_TAGS = [
    'Cooking Oil',
    'Soybean',
    'Mustard Oil',
    'Rice',
    'Miniket',
    'Chinigura',
    'Spices',
    'Dairy & Eggs',
    'Vegetables',
    'Fruits',
    'Popular',
    'Best Seller',
    'Friday Flash Deal',
    'Deals of the Day',
    'Organic',
    'Halal',
    'Fresh',
    'Ramadan Special',
    'Daily Grocery',
    'Staples',
    'Wholesale',
    'Discount',
    'Pure',
    'Fortified',
  ];

  const UNIT_VARIANT_PRESETS: Record<string, string[]> = {
    Liter: ['250 ML', '500 ML', '1 Ltr', '2 Ltr', '3 Ltr', '5 Ltr', '8 Ltr', '10 Ltr'],
    Piece: ['1 Piece', '4 Pieces (Hali)', '6 Pieces', '12 Pieces (Dozen)', '24 Pieces', '30 Pieces (Tray)', '1 Pack', '1 Box'],
    KG: ['100 gm', '250 gm', '500 gm', '1 KG', '2 KG', '5 KG', '10 KG', '25 KG'],
    Gram: ['50 gm', '100 gm', '200 gm', '250 gm', '500 gm', '1000 gm'],
    Pack: ['1 Pack', '2 Pack', '3 Pack', '5 Pack', '10 Pack', 'Family Pack'],
    Box: ['1 Box (6 Pcs)', '1 Box (12 Pcs)', '1 Carton (24 Pcs)'],
    Bottle: ['1 Bottle', '2 Bottles', '1 Case (12 Bottles)'],
    Dozen: ['0.5 Dozen', '1 Dozen', '2 Dozen'],
  };

  const [categoriesList, setCategoriesList] = useState<Array<{ name: string; slug: string; description?: string }>>(() => {
    const saved = localStorage.getItem('lb_custom_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_CATEGORIES;
  });

  const [availableTags, setAvailableTags] = useState<string[]>(() => {
    const saved = localStorage.getItem('lb_custom_tags');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_TAGS;
  });

  const DEFAULT_ITEMS = [
    { name: 'Oil', slug: 'cooking-oil', icon: '🫒' },
    { name: 'Rice', slug: 'rice', icon: '🍚' },
    { name: 'Vegetables', slug: 'vegetables', icon: '🥦' },
    { name: 'Fruits', slug: 'fruits', icon: '🍎' },
    { name: 'Drinks', slug: 'beverages', icon: '🥤' },
    { name: 'Flour', slug: 'flour-atta', icon: '🌾' },
    { name: 'Sugar', slug: 'sugar', icon: '🍬' },
    { name: 'Salt', slug: 'salt', icon: '🧂' },
    { name: 'Dal & Pulses', slug: 'dal-pulses', icon: '🫘' },
    { name: 'Noodles & Pasta', slug: 'noodles-pasta', icon: '🍜' },
    { name: 'Spices', slug: 'spices', icon: '🌶️' },
    { name: 'Dairy & Eggs', slug: 'dairy', icon: '🥛' },
    { name: 'Meat & Fish', slug: 'meat-fish', icon: '🥩' },
  ];

  const [itemsList, setItemsList] = useState<Array<{ name: string; slug: string; icon?: string }>>(() => {
    const saved = localStorage.getItem('lb_custom_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_ITEMS;
  });

  // Modal states for adding Category, Item & Tag
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemIcon, setNewItemIcon] = useState('📦');

  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // Search input & dropdown visibility for Tags in Product Add form
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  // Search input & dropdown visibility for Tags in Product Edit form
  const [editTagSearchQuery, setEditTagSearchQuery] = useState('');
  const [isEditTagDropdownOpen, setIsEditTagDropdownOpen] = useState(false);

  const [productForm, setProductForm] = useState({
    description: '',
    name: '',
    category: 'cooking-oil',
    itemType: 'Oil',
    isDealOfTheDay: false,
    brand: 'Teer',
    variantName: '5 Liter',
    unit: 'Liter',
    basePrice: '850',
    salePrice: '790',
    stockQuantity: '50',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80',
    tags: 'Cooking Oil, Soybean, Grocery, Wholesale',
  });

  const [productSearch, setProductSearch] = useState('');
  const [editProductModal, setEditProductModal] = useState<any | null>(null);

  // Close tag dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setIsTagDropdownOpen(false);
      setIsEditTagDropdownOpen(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Category Save Handler
  const handleSaveNewCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    let updated = [...categoriesList];
    if (!updated.some((c) => c.slug === slug || c.name.toLowerCase() === name.toLowerCase())) {
      const newCat = { name, slug, description: newCategoryDesc.trim() || undefined };
      updated = [...updated, newCat];
      setCategoriesList(updated);
      localStorage.setItem('lb_custom_categories', JSON.stringify(updated));

      try {
        await api.createCategory({ name, slug, description: newCategoryDesc.trim() || undefined });
      } catch (err) {
        console.warn('API createCategory fallback:', err);
      }
    }

    setProductForm((prev) => ({ ...prev, category: slug }));
    if (editProductModal) {
      setEditProductModal((prev: any) => ({
        ...prev,
        category: { slug, name },
      }));
    }

    window.dispatchEvent(new Event('lb_categories_updated'));
    setShowAddCategoryModal(false);
    setNewCategoryName('');
    setNewCategoryDesc('');
  };

  // Item Save Handler
  const handleSaveNewItem = () => {
    const name = newItemName.trim();
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    let updated = [...itemsList];
    if (!updated.some((it) => it.slug === slug || it.name.toLowerCase() === name.toLowerCase())) {
      const newItem = { name, slug, icon: newItemIcon || '📦' };
      updated = [...updated, newItem];
      setItemsList(updated);
      localStorage.setItem('lb_custom_items', JSON.stringify(updated));
    }

    setProductForm((prev) => ({ ...prev, itemType: name }));
    if (editProductModal) {
      setEditProductModal((prev: any) => ({
        ...prev,
        itemType: name,
        itemSlug: slug,
      }));
    }

    window.dispatchEvent(new Event('lb_items_updated'));
    setShowAddItemModal(false);
    setNewItemName('');
    setNewItemIcon('📦');
  };

  // Tag Add / Select Handler
  const handleSelectOrAddNewTag = async (rawTagName: string, isEditing = false) => {
    const name = rawTagName.trim().replace(/^#/, '');
    if (!name) return;

    if (!availableTags.some((t) => t.toLowerCase() === name.toLowerCase())) {
      const updatedAvail = [...availableTags, name];
      setAvailableTags(updatedAvail);
      localStorage.setItem('lb_custom_tags', JSON.stringify(updatedAvail));

      try {
        await api.createTag({ name });
      } catch (err) {
        console.warn('API createTag fallback:', err);
      }
    }

    if (isEditing && editProductModal) {
      const currentTags = Array.isArray(editProductModal.tags)
        ? editProductModal.tags
        : typeof editProductModal.tags === 'string'
        ? editProductModal.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];
      if (!currentTags.some((t: string) => t.toLowerCase() === name.toLowerCase())) {
        setEditProductModal({
          ...editProductModal,
          tags: [...currentTags, name],
        });
      }
      setEditTagSearchQuery('');
      setIsEditTagDropdownOpen(false);
    } else {
      const currentTags = productForm.tags
        ? productForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      if (!currentTags.some((t) => t.toLowerCase() === name.toLowerCase())) {
        const nextTags = [...currentTags, name];
        setProductForm({
          ...productForm,
          tags: nextTags.join(', '),
        });
      }
      setTagSearchQuery('');
      setIsTagDropdownOpen(false);
    }
  };

  // Tag Remove Handler
  const handleRemoveTag = (tagToRemove: string, isEditing = false) => {
    if (isEditing && editProductModal) {
      const currentTags = Array.isArray(editProductModal.tags)
        ? editProductModal.tags
        : typeof editProductModal.tags === 'string'
        ? editProductModal.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];
      setEditProductModal({
        ...editProductModal,
        tags: currentTags.filter((t: string) => t.toLowerCase() !== tagToRemove.toLowerCase()),
      });
    } else {
      const currentTags = productForm.tags
        ? productForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      const nextTags = currentTags.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase());
      setProductForm({
        ...productForm,
        tags: nextTags.join(', '),
      });
    }
  };

  // Description-driven Smart Auto-Fill Parser
  const parseDescriptionAndAutoFill = (text: string) => {
    if (!text.trim()) return;

    const lower = text.toLowerCase();
    let detectedName = productForm.name;
    let detectedCategory = productForm.category;
    let detectedBrand = productForm.brand;
    let detectedVariant = productForm.variantName;
    let detectedUnit = productForm.unit;
    let detectedBasePrice = productForm.basePrice;
    let detectedSalePrice = productForm.salePrice;
    let detectedStock = productForm.stockQuantity;
    let detectedImg = productForm.imageUrl;

    // Detect Categories & Images
    if (lower.includes('oil') || lower.includes('soybean') || lower.includes('mustard')) {
      detectedCategory = 'cooking-oil';
      detectedUnit = 'Liter';
      detectedImg = 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80';
    } else if (lower.includes('rice') || lower.includes('miniket') || lower.includes('chinigura') || lower.includes('nazirshail')) {
      detectedCategory = 'rice';
      detectedUnit = 'KG';
      detectedImg = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80';
    } else if (lower.includes('ghee') || lower.includes('milk') || lower.includes('dairy') || lower.includes('butter')) {
      detectedCategory = 'dairy';
      detectedUnit = 'gm';
      detectedImg = 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80';
    } else if (lower.includes('egg')) {
      detectedCategory = 'dairy';
      detectedUnit = 'Piece';
      detectedImg = 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=500&q=80';
    } else if (lower.includes('turmeric') || lower.includes('chilli') || lower.includes('spice') || lower.includes('masala')) {
      detectedCategory = 'salt';
      detectedUnit = 'Gram';
      detectedImg = 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80';
    } else if (lower.includes('tomato') || lower.includes('onion') || lower.includes('potato') || lower.includes('vegetable')) {
      detectedCategory = 'vegetables';
      detectedUnit = 'KG';
      detectedImg = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80';
    } else if (lower.includes('apple') || lower.includes('orange') || lower.includes('fruit')) {
      detectedCategory = 'fruits';
      detectedUnit = 'KG';
      detectedImg = 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&w=500&q=80';
    }

    // Detect Brands
    if (lower.includes('teer')) detectedBrand = 'Teer';
    else if (lower.includes('rupchanda')) detectedBrand = 'Rupchanda';
    else if (lower.includes('aarong')) detectedBrand = 'Aarong';
    else if (lower.includes('radhuni')) detectedBrand = 'Radhuni';
    else if (lower.includes('pran')) detectedBrand = 'Pran';
    else if (lower.includes('fresh')) detectedBrand = 'Fresh';
    else if (lower.includes('molla')) detectedBrand = 'Molla Super';

    // Detect Pack/Variant sizes (e.g. 5 Liter, 25 KG, 1 KG, 500 gm, 30 Pieces, 900 gm)
    const packMatch = text.match(/(\d+\s*(liter|litre|l|kg|gm|gram|g|pieces|pcs|tray))/i);
    if (packMatch) {
      detectedVariant = packMatch[1];
    }

    // Extract regular price (e.g. 850 BDT, regular 850, price: 850, ৳850)
    const priceMatches = text.match(/(?:regular|base|mrp|price|৳|bdt)?\s*[:=]?\s*(\d{2,5})/gi);
    if (priceMatches && priceMatches.length > 0) {
      const numbers = priceMatches
        .map((m) => parseInt(m.replace(/\D/g, ''), 10))
        .filter((n) => n >= 20 && n <= 10000);

      if (numbers.length >= 2) {
        detectedBasePrice = String(Math.max(numbers[0], numbers[1]));
        detectedSalePrice = String(Math.min(numbers[0], numbers[1]));
      } else if (numbers.length === 1) {
        detectedBasePrice = String(numbers[0]);
        detectedSalePrice = String(Math.round(numbers[0] * 0.92));
      }
    }

    // Extract stock if specified (e.g. stock 50, 50 units, 100 in stock)
    const stockMatch = text.match(/(?:stock|available|quantity)\s*[:=]?\s*(\d+)/i) || text.match(/(\d+)\s*(?:units|packs|pieces|bottles)\s*in\s*stock/i);
    if (stockMatch) {
      detectedStock = stockMatch[1];
    }

    // Extract title from first sentence or headline
    const firstLine = text.split(/[\n.]/)[0].trim();
    if (firstLine && firstLine.length > 3) {
      detectedName = firstLine.replace(/^(this is|new|fresh|buy|sale)\s+/i, '');
      if (detectedName.length > 40) {
        detectedName = detectedName.slice(0, 40).trim();
      }
    }

    // Detect Item (Product by Item)
    let detectedItemType = productForm.itemType;
    if (lower.includes('oil') || lower.includes('soybean') || lower.includes('mustard')) {
      detectedItemType = 'Oil';
    } else if (lower.includes('rice') || lower.includes('miniket') || lower.includes('chinigura')) {
      detectedItemType = 'Rice';
    } else if (lower.includes('tomato') || lower.includes('onion') || lower.includes('potato') || lower.includes('vegetable')) {
      detectedItemType = 'Vegetables';
    } else if (lower.includes('apple') || lower.includes('orange') || lower.includes('banana') || lower.includes('fruit')) {
      detectedItemType = 'Fruits';
    } else if (lower.includes('drink') || lower.includes('juice') || lower.includes('beverage') || lower.includes('coke') || lower.includes('sprite')) {
      detectedItemType = 'Drinks';
    } else if (lower.includes('flour') || lower.includes('atta') || lower.includes('suji') || lower.includes('maida')) {
      detectedItemType = 'Flour';
    } else if (lower.includes('sugar')) {
      detectedItemType = 'Sugar';
    } else if (lower.includes('salt')) {
      detectedItemType = 'Salt';
    } else if (lower.includes('dal') || lower.includes('lentil') || lower.includes('chickpea')) {
      detectedItemType = 'Dal & Pulses';
    } else if (lower.includes('noodle') || lower.includes('pasta') || lower.includes('maggi') || lower.includes('spaghetti')) {
      detectedItemType = 'Noodles & Pasta';
    } else if (lower.includes('spice') || lower.includes('turmeric') || lower.includes('chilli') || lower.includes('masala')) {
      detectedItemType = 'Spices';
    } else if (lower.includes('milk') || lower.includes('egg') || lower.includes('ghee') || lower.includes('dairy')) {
      detectedItemType = 'Dairy & Eggs';
    } else if (lower.includes('meat') || lower.includes('beef') || lower.includes('chicken') || lower.includes('fish')) {
      detectedItemType = 'Meat & Fish';
    }

    setProductForm((prev) => ({
      ...prev,
      description: text,
      name: detectedName || prev.name,
      category: detectedCategory,
      itemType: detectedItemType,
      brand: detectedBrand,
      variantName: detectedVariant,
      unit: detectedUnit,
      basePrice: detectedBasePrice,
      salePrice: detectedSalePrice,
      stockQuantity: detectedStock,
      imageUrl: detectedImg,
      tags: `${detectedCategory}, ${detectedBrand.toLowerCase()}, essential, wholesale`,
    }));
  };

  // One-click Sample Description Templates
  const handleLoadDescriptionTemplate = (templateType: string) => {
    let tplText = '';
    switch (templateType) {
      case 'oil':
        tplText = 'Teer Pure Fortified Soybean Oil 5 Liter Can. Triple refined, cholesterol-free edible oil enriched with Vitamin A and D. Regular price 850 BDT, discounted sale price 790 BDT. Warehouse allocated stock 50 units. Category: Cooking Oil, Brand: Teer.';
        break;
      case 'rice':
        tplText = 'Miniket Premium Polished Rice 25 KG Sack. Extra long grain, thoroughly sorted white rice with naturally slender texture. Regular price 1850 BDT, wholesale promotional price 1700 BDT. Available stock 60 units. Category: Rice, Brand: Liton Brothers Fresh.';
        break;
      case 'ghee':
        tplText = 'Aarong Dairy Pure Granulated Ghee 900gm Glass Jar. Authentic desi ghee crafted from pure grass-fed cow milk with rich golden aroma. Regular price 1450 BDT, special deal price 1290 BDT. Stock 35 units. Category: Dairy, Brand: Aarong.';
        break;
      case 'turmeric':
        tplText = 'Radhuni Pure Turmeric Powder 500 Gram Foil Pack. Sourced from native ginger-turmeric rhizomes, lab tested for high natural curcumin and zero artificial colors. Regular price 220 BDT, sale price 200 BDT. Stock 80 units. Category: Spices & Salt, Brand: Radhuni.';
        break;
      case 'eggs':
        tplText = 'Farm Fresh Brown Eggs 30 Pieces Tray. Graded, sanitized, protein-packed farm eggs delivered in protective shock-absorbing tray. Regular price 395 BDT, daily deal 345 BDT. Stock 70 units. Category: Dairy & Eggs, Brand: Farm Fresh.';
        break;
      default:
        break;
    }
    parseDescriptionAndAutoFill(tplText);
  };

  // Add Product Submit Handler
  // User requested: "In the Admin Dashboard, don't make this required. Make it Optional."
  const isDescriptionValid = true;

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      alert('Please provide a product title.');
      return;
    }

    const regPrice = Number(productForm.basePrice) || 100;
    const sPrice = Number(productForm.salePrice) || regPrice;
    const stock = Number(productForm.stockQuantity) || 20;

    const itemSlug = (productForm.itemType || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newProd = {
      id: 'prod-' + Date.now(),
      name: productForm.name.trim(),
      slug: productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: productForm.description.trim() || undefined,
      basePrice: regPrice,
      salePrice: sPrice,
      price: sPrice,
      stockQuantity: stock,
      unit: productForm.variantName || productForm.unit || '1 Pack',
      primaryImage: productForm.imageUrl,
      images: [{ imageUrl: productForm.imageUrl }],
      category: { slug: productForm.category, name: productForm.category },
      categorySlug: productForm.category,
      itemType: productForm.itemType || undefined,
      itemSlug: itemSlug || undefined,
      isDealOfTheDay: Boolean(productForm.isDealOfTheDay),
      isFeatured: true,
      brand: { name: productForm.brand },
      tags: productForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      variants: [
        {
          id: 'v-' + Date.now(),
          sku: 'SKU-' + Date.now().toString().slice(-6),
          displayName: productForm.variantName || 'Standard',
          unit: productForm.unit || 'Pack',
          price: regPrice,
          salePrice: sPrice,
          stockQuantity: stock,
        },
      ],
    };

    // Save to local custom catalog storage
    let customProducts: any[] = [];
    const saved = localStorage.getItem('lb_custom_catalog_products');
    if (saved) {
      try {
        customProducts = JSON.parse(saved);
      } catch (e) {}
    }
    const updatedCatalog = [newProd, ...customProducts];
    localStorage.setItem('lb_custom_catalog_products', JSON.stringify(updatedCatalog));

    // Also attempt remote API creation if connected
    try {
      await api.createProduct({
        name: newProd.name,
        sku: newProd.variants[0].sku,
        slug: newProd.slug,
        description: newProd.description,
        basePrice: regPrice,
        salePrice: sPrice,
        stockQuantity: stock,
        unit: newProd.unit,
        thumbnailUrl: newProd.primaryImage,
        images: [newProd.primaryImage],
        variants: newProd.variants,
      });
    } catch (err) {
      // Gracefully continue using local catalog
    }

    window.dispatchEvent(new Event('lb_products_updated'));
    alert(`Success! "${newProd.name}" has been added to the catalog and is now available in the customer storefront.`);

    // Reset form
    setProductForm({
      description: '',
      name: '',
      category: 'cooking-oil',
      itemType: 'Oil',
      isDealOfTheDay: false,
      brand: 'Teer',
      variantName: '5 Liter',
      unit: 'Liter',
      basePrice: '850',
      salePrice: '790',
      stockQuantity: '50',
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80',
      tags: 'cooking oil, pure, grocery',
    });

    await loadData();
  };

  // Update Product Handler
  const handleUpdateProductSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProductModal) return;

    const itemSlug = (editProductModal.itemType || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const updatedItem = {
      ...editProductModal,
      description: editProductModal.description ? editProductModal.description.trim() : undefined,
      basePrice: Number(editProductModal.basePrice),
      salePrice: Number(editProductModal.salePrice),
      price: Number(editProductModal.salePrice),
      stockQuantity: Number(editProductModal.stockQuantity),
      itemType: editProductModal.itemType || undefined,
      itemSlug: itemSlug || undefined,
      isDealOfTheDay: Boolean(editProductModal.isDealOfTheDay),
    };

    // Update in localStorage catalog
    let customProducts: any[] = [];
    const saved = localStorage.getItem('lb_custom_catalog_products');
    if (saved) {
      try {
        customProducts = JSON.parse(saved);
      } catch (e) {}
    }

    const idx = customProducts.findIndex((p) => p.id === updatedItem.id || p.slug === updatedItem.slug);
    if (idx >= 0) {
      customProducts[idx] = updatedItem;
    } else {
      customProducts.unshift(updatedItem);
    }
    localStorage.setItem('lb_custom_catalog_products', JSON.stringify(customProducts));

    // Also attempt API update
    try {
      await api.updateProductPrice(
        updatedItem.id,
        updatedItem.basePrice,
        updatedItem.salePrice,
        'Updated via Admin Portal'
      );
    } catch (e) {}

    window.dispatchEvent(new Event('lb_products_updated'));
    alert(`Product "${updatedItem.name}" updated successfully!`);
    setEditProductModal(null);
    await loadData();
  };

  // Core Data Loader
  const loadData = async () => {
    setLoading(true);
    try {
      const [ordRes, custRes, alertRes, prodRes, catRes, tagRes] = await Promise.all([
        api.getAdminOrders({ limit: 60 }),
        api.getAdminCustomers(),
        api.getAdminStockAlerts(),
        api.getProducts({ limit: 60 }),
        api.getCategories().catch(() => null),
        api.getTags().catch(() => null),
      ]);

      if (ordRes && ordRes.success && ordRes.data) {
        setOrders(ordRes.data.orders || ordRes.data || []);
      }
      if (custRes && custRes.success && Array.isArray(custRes.data)) {
        setCustomers(custRes.data);
      }
      if (alertRes && alertRes.success && Array.isArray(alertRes.data)) {
        setAlerts(alertRes.data);
      }

      if (catRes && catRes.success && Array.isArray(catRes.data)) {
        setCategoriesList((prev) => {
          const merged = [...prev];
          for (const c of catRes.data) {
            if (!merged.some((item) => item.slug === c.slug)) {
              merged.push({ name: c.name, slug: c.slug, description: c.description });
            }
          }
          return merged;
        });
      }

      if (tagRes && tagRes.success && Array.isArray(tagRes.data)) {
        setAvailableTags((prev) => {
          const mergedTags = [...prev];
          for (const t of tagRes.data) {
            const tagName = typeof t === 'string' ? t : t.name;
            if (tagName && !mergedTags.some((mt) => mt.toLowerCase() === tagName.toLowerCase())) {
              mergedTags.push(tagName);
            }
          }
          return mergedTags;
        });
      }

      let prods: any[] = [];
      if (prodRes && prodRes.success && Array.isArray(prodRes.data)) {
        prods = [...prodRes.data];
      }
      // Merge with custom products
      const customSaved = localStorage.getItem('lb_custom_catalog_products');
      if (customSaved) {
        try {
          const cpList = JSON.parse(customSaved);
          for (const cp of cpList) {
            if (!prods.some((p) => p.id === cp.id || p.slug === cp.slug)) {
              prods.unshift(cp);
            }
          }
        } catch (e) {}
      }
      setCatalogProducts(prods);
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

  // KPI Calculations
  const totalRevenue = orders.reduce((acc, o) => acc + Number(o.grandTotal || o.grand_total || 0), 0);
  const pendingOrdersList = orders.filter((o) => o.status === 'PENDING');
  const pendingOrdersCount = pendingOrdersList.length;
  const pendingCustomers = customers.filter((c) => c.status === 'PENDING_APPROVAL').length;

  // Filter orders by active status pill
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'ALL') return true;
    if (orderStatusFilter === 'PENDING') return o.status === 'PENDING';
    if (orderStatusFilter === 'CONFIRMED') return o.status === 'CONFIRMED';
    if (orderStatusFilter === 'PROCESSING') return o.status === 'PROCESSING';
    if (orderStatusFilter === 'OUT_FOR_DELIVERY') return o.status === 'OUT_FOR_DELIVERY' || o.status === 'SHIPPED';
    if (orderStatusFilter === 'DELIVERED') return o.status === 'DELIVERED';
    if (orderStatusFilter === 'CANCELLED') return o.status === 'CANCELLED' || o.status === 'DECLINED';
    return true;
  });

  // Decline Order (Moderator & Super Admin)
  const handleConfirmDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineModal) return;

    try {
      const res = await api.updateOrderStatus(
        declineModal.orderId,
        'CANCELLED',
        `Declined by ${activeRole}: ${declineReason}`
      );
      if (res.success) {
        alert(`Order #${declineModal.orderNumber} has been declined. Warehouse stock has been restored.`);
        setDeclineModal(null);
        await loadData();
      } else {
        alert(res.message || 'Failed to decline order');
      }
    } catch (err: any) {
      alert(err.message || 'Error declining order');
    }
  };

  // Confirm Pending Order
  const handleQuickConfirmOrder = async (orderId: string, orderNumber: string) => {
    try {
      const res = await api.updateOrderStatus(orderId, 'CONFIRMED', `Confirmed by ${activeRole}`);
      if (res.success) {
        alert(`Order #${orderNumber} is CONFIRMED and ready for warehouse packing!`);
        await loadData();
      } else {
        alert(res.message || 'Error confirming order');
      }
    } catch (err: any) {
      alert(err.message || 'Error confirming order');
    }
  };

  // Save Order Tracking Updates (Moderator & Super Admin)
  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingModal) return;

    const comment = `[Rider: ${riderInfo}] ${trackingComment}`;
    try {
      const res = await api.updateOrderStatus(trackingModal.order.id, trackingStatus, comment);
      if (res.success) {
        alert(`Live tracking updated! Status: ${trackingStatus}. Customers tracking this order will see the update in real time.`);
        setTrackingModal(null);
        await loadData();
      } else {
        alert(res.message || 'Failed to update tracking');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating tracking');
    }
  };

  // Approve Customer (Super Admin Only)
  const handleApproveCustomer = async (userId: string) => {
    if (activeRole !== 'SUPER_ADMIN') {
      alert('Permission Denied: Customer KYC verification is restricted to Super Admin only.');
      return;
    }
    const reason = prompt('Optional approval verification note:', 'National ID & phone verified');
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

  // Quick Restock in Inventory Alerts
  const handleQuickRestock = async (variantId: string, qty: number) => {
    try {
      const res = await api.adjustInventory({
        variantId,
        transactionType: 'STOCK_IN',
        quantity: qty,
        reason: `Restocked by ${activeRole}`,
      });
      if (res.success) {
        alert(`Restocked +${qty} units successfully!`);
        await loadData();
      } else {
        alert(res.message || 'Restock failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error adjusting stock');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-2 md:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in text-slate-900">
      <div className="bg-white rounded-none sm:rounded-3xl max-w-6xl w-full h-full sm:h-[92vh] flex flex-col shadow-2xl overflow-hidden border-0 sm:border border-slate-200">
        {/* ========================================================= */}
        {/* RECONSTRUCTED ADMIN HEADER WITH ROLE SWITCHER & BADGES */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-3.5 sm:p-5 border-b border-slate-200 bg-slate-900 text-white shrink-0">
          <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h2 className="text-sm sm:text-lg font-black tracking-tight truncate">
                    Enterprise Control Center
                  </h2>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                    v2.4
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300 hidden xs:block">
                  Centralized fulfillment, catalog, inventory & promotions
                </p>
              </div>
            </div>

            {/* Mobile-only Close button in title row */}
            <button
              onClick={onClose}
              className="sm:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Close Dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Switcher Pill & Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
            {/* Live Role Selector */}
            <div className="bg-slate-800 p-1 rounded-2xl border border-slate-700 flex items-center gap-1 text-[11px] sm:text-xs font-bold w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={() => setActiveRole('SUPER_ADMIN')}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                  activeRole === 'SUPER_ADMIN'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Super Admin</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveRole('MODERATOR')}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                  activeRole === 'MODERATOR'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Moderator</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="hidden sm:flex p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer shrink-0"
              title="Close Dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role Permissions Notification Bar */}
        <div className="px-3 sm:px-5 py-2 sm:py-2.5 bg-slate-100 border-b border-slate-200 text-xs flex flex-wrap items-center justify-between gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span
              className={`px-2 py-0.5 rounded-md font-black text-[9px] sm:text-[10px] uppercase shrink-0 ${
                activeRole === 'SUPER_ADMIN'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {activeRole === 'SUPER_ADMIN' ? 'Super Administrator' : 'Moderator'}
            </span>
            <span className="text-slate-600 text-[11px] truncate hidden md:inline">
              {activeRole === 'SUPER_ADMIN'
                ? 'Full Root Privileges: All modules, customer KYC approvals, catalog creation, flash deals & stock management.'
                : 'Restricted Moderator Role: Authorized to Add/Update Products, Hero Banners, View Alerts, Fulfill Orders.'}
            </span>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="text-[11px] font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer shrink-0 ml-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Real-Time Operational KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-2.5 sm:p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="p-2 sm:p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-0.5 sm:mb-1">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">Total Sales</span>
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900">৳{totalRevenue.toFixed(0)}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-500 truncate">{orders.length} orders</div>
          </div>

          <div
            onClick={() => {
              setActiveTab('orders');
              setOrderStatusFilter('PENDING');
            }}
            className="p-2 sm:p-3 bg-white hover:bg-blue-50/50 rounded-xl border border-blue-200 shadow-xs cursor-pointer transition"
          >
            <div className="flex items-center justify-between text-blue-500 mb-0.5 sm:mb-1">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">Pending Orders</span>
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
            </div>
            <div className="text-base sm:text-lg font-black text-blue-700">{pendingOrdersCount}</div>
            <div className="text-[9px] sm:text-[10px] text-blue-600 font-bold truncate">Needs action →</div>
          </div>

          <div
            onClick={() => {
              if (activeRole === 'SUPER_ADMIN') setActiveTab('customers');
            }}
            className={`p-2 sm:p-3 bg-white rounded-xl border border-slate-200 shadow-xs ${
              activeRole === 'SUPER_ADMIN' ? 'cursor-pointer hover:bg-amber-50/50' : 'opacity-70'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-0.5 sm:mb-1">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">Pending Users</span>
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
            </div>
            <div className="text-base sm:text-lg font-black text-amber-700">{pendingCustomers}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-500 truncate">
              {activeRole === 'SUPER_ADMIN' ? 'KYC Approval' : 'Admin Only 🔒'}
            </div>
          </div>

          <div
            onClick={() => setActiveTab('inventory')}
            className="p-2 sm:p-3 bg-white hover:bg-rose-50/50 rounded-xl border border-slate-200 shadow-xs cursor-pointer transition"
          >
            <div className="flex items-center justify-between text-slate-400 mb-0.5 sm:mb-1">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">Stock Alerts</span>
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
            </div>
            <div className="text-base sm:text-lg font-black text-rose-600">{alerts.length}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-500 truncate">Low / Out stock</div>
          </div>
        </div>

        {/* Tab Navigation (Role-aware) */}
        <div
          className="flex border-b border-slate-200 bg-white px-2 sm:px-5 text-xs font-bold overflow-x-auto no-scrollbar shrink-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* 1. Orders & Tracking (Super Admin & Moderator) */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap cursor-pointer text-[11px] sm:text-xs shrink-0 ${
              activeTab === 'orders'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Orders & Tracking ({orders.length})</span>
            {pendingOrdersCount > 0 && (
              <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-black">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          {/* 2. Product Management (Add & Update Product - Super Admin & Moderator) */}
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap cursor-pointer text-[11px] sm:text-xs shrink-0 ${
              activeTab === 'products'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Product Add & Update ({catalogProducts.length})</span>
          </button>

          {/* 3. Customer Approvals (Super Admin Only) */}
          <button
            onClick={() => {
              if (activeRole === 'SUPER_ADMIN') {
                setActiveTab('customers');
              } else {
                alert('Access Restricted: Customer KYC approvals require Super Admin privileges.');
              }
            }}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap cursor-pointer text-[11px] sm:text-xs shrink-0 ${
              activeTab === 'customers'
                ? 'border-emerald-600 text-emerald-700'
                : activeRole === 'MODERATOR'
                ? 'border-transparent text-slate-400 cursor-not-allowed opacity-60'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customer Approvals ({pendingCustomers})</span>
            {activeRole === 'MODERATOR' && <Lock className="w-3 h-3 text-slate-400" />}
          </button>

          {/* 4. Inventory Alerts & Ledger (Super Admin & Moderator) */}
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap cursor-pointer text-[11px] sm:text-xs shrink-0 ${
              activeTab === 'inventory'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Inventory Alerts ({alerts.length})</span>
          </button>

          {/* 5. Hero Banners CMS (Super Admin & Moderator) */}
          <button
            onClick={() => setActiveTab('banners')}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap cursor-pointer text-[11px] sm:text-xs shrink-0 ${
              activeTab === 'banners'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Hero Banners CMS ({banners.length})</span>
          </button>

          {/* 6. Friday Flash Bazaar Offers (Super Admin & Moderator) */}
          <button
            onClick={() => setActiveTab('friday-deals')}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap cursor-pointer text-[11px] sm:text-xs shrink-0 ${
              activeTab === 'friday-deals'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Flame className="w-4 h-4 text-rose-600" />
            <span>Friday Flash Offers ({flashItems.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 text-slate-900 bg-slate-50/50">
          {/* ========================================================= */}
          {/* TAB 1: ORDERS FULFILLMENT, PENDING ORDERS & TRACKING */}
          {/* ========================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-4 text-left">
              {/* Order Status Filter Pills */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-3 bg-white p-2.5 sm:p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap text-[11px] sm:text-xs font-bold w-full sm:w-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <span className="text-slate-500 mr-1 flex items-center gap-1 shrink-0">
                    <Filter className="w-3.5 h-3.5" /> Filter:
                  </span>
                  {[
                    { key: 'ALL', label: `All (${orders.length})` },
                    { key: 'PENDING', label: `Pending (${pendingOrdersCount})`, alert: pendingOrdersCount > 0 },
                    { key: 'CONFIRMED', label: 'Confirmed' },
                    { key: 'PROCESSING', label: 'Processing' },
                    { key: 'OUT_FOR_DELIVERY', label: 'Dispatched' },
                    { key: 'DELIVERED', label: 'Delivered' },
                    { key: 'CANCELLED', label: 'Declined' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setOrderStatusFilter(f.key)}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl transition cursor-pointer shrink-0 whitespace-nowrap ${
                        orderStatusFilter === f.key
                          ? f.alert
                            ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                            : 'bg-emerald-800 text-white font-black shadow-xs'
                          : f.alert
                          ? 'bg-amber-50 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] sm:text-xs text-slate-500 font-semibold shrink-0">
                  Showing <strong>{filteredOrders.length}</strong> orders
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200">
                  <Package className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-2 sm:mb-3" />
                  <p className="text-slate-600 font-bold text-xs sm:text-sm">No orders matching selected filter</p>
                  <p className="text-slate-400 text-[11px] sm:text-xs mt-1">
                    New customer checkouts will appear here instantly.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((ord) => {
                    const isPending = ord.status === 'PENDING';
                    const isCancelled = ord.status === 'CANCELLED' || ord.status === 'DECLINED';

                    return (
                      <div
                        key={ord.id}
                        className={`p-3.5 sm:p-4 bg-white rounded-2xl border transition shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 ${
                          isPending
                            ? 'border-amber-300 bg-amber-50/30'
                            : isCancelled
                            ? 'border-rose-200 bg-rose-50/20 opacity-80'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-0 flex-1 w-full">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-slate-900 text-sm">
                              #{ord.orderNumber || ord.id.slice(0, 8)}
                            </span>
                            <span
                              className={`text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isPending
                                  ? 'bg-amber-500 text-slate-950 animate-pulse'
                                  : ord.status === 'CONFIRMED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : ord.status === 'PROCESSING'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : ord.status === 'OUT_FOR_DELIVERY' || ord.status === 'SHIPPED'
                                  ? 'bg-amber-100 text-amber-800'
                                  : ord.status === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {ord.status}
                            </span>
                            <span className="text-slate-400 text-[11px] sm:text-xs font-mono">
                              Tracking: <strong>{ord.trackingNumber || 'TRK-2026-DEMO'}</strong>
                            </span>
                          </div>

                          <div className="text-[11px] sm:text-xs text-slate-600 mt-1 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span>Recipient: <strong>{ord.deliveryAddress?.name || ord.customerName || 'Customer'}</strong> ({ord.deliveryAddress?.phone || ord.customerPhone || 'Phone'})</span>
                            <span>•</span>
                            <span>Slot: <strong>{ord.deliverySlot || 'Express 15-Min'}</strong></span>
                            <span>•</span>
                            <span>Payment: <strong>{ord.paymentMethod || 'COD'}</strong> ({ord.paymentStatus || 'PENDING'})</span>
                          </div>

                          {/* Line item snippets */}
                          {Array.isArray(ord.items) && ord.items.length > 0 && (
                            <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">
                              Items: {ord.items.map((i: any) => `${i.productName || i.name} (x${i.quantity})`).join(', ')}
                            </div>
                          )}
                        </div>

                        {/* Order Total & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0 flex-wrap w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-0 border-slate-100">
                          <div className="text-left sm:text-right">
                            <div className="text-sm sm:text-base font-black text-slate-900">
                              ৳{Number(ord.grandTotal || ord.grand_total || 0).toFixed(0)}
                            </div>
                            <div className="text-[9px] sm:text-[10px] text-slate-400">
                              {new Date(ord.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

                          {/* PENDING ORDER ACTIONS (Requirement: Pending order & Decline order) */}
                          {isPending && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleQuickConfirmOrder(ord.id, ord.orderNumber || ord.id.slice(0, 8))}
                                className="px-2.5 sm:px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeclineModal({
                                    orderId: ord.id,
                                    orderNumber: ord.orderNumber || ord.id.slice(0, 8),
                                  })
                                }
                                className="px-2.5 sm:px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition cursor-pointer"
                              >
                                Decline
                              </button>
                            </div>
                          )}

                          {/* UPDATE ORDER TRACKING BUTTON (Requirement: update order tracking) */}
                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => {
                                setTrackingModal({ order: ord });
                                setTrackingStatus(ord.status === 'PENDING' ? 'CONFIRMED' : ord.status);
                              }}
                              className="px-2.5 sm:px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Tracking</span>
                            </button>
                          )}

                          {/* INVOICE (Super Admin Only) */}
                          {activeRole === 'SUPER_ADMIN' && (
                            <button
                              type="button"
                              onClick={() => setActiveInvoice({ order: ord, invoice: { invoiceNumber: `INV-${ord.orderNumber || '001'}`, issuedAt: new Date().toISOString() }, customer: { name: ord.deliveryAddress?.name || 'Customer', phone: ord.deliveryAddress?.phone || '01700000000', address: ord.deliveryAddress?.address || 'Dhaka' } })}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Print Invoice"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PRODUCT MANAGEMENT (ADD FROM DESCRIPTION & UPDATE) */}
          {/* Requirement: Depends on product description admin/moderator can add product */}
          {/* ========================================================= */}
          {activeTab === 'products' && (
            <div className="space-y-6 text-left">
              {/* Product Sub-Tab Switcher: Add Product vs Update Product */}
              <div className="flex border-b border-slate-200 pb-3 justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setProductSubTab('add')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      productSubTab === 'add'
                        ? 'bg-[#14532d] text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Product (Description-Driven)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductSubTab('update')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      productSubTab === 'update'
                        ? 'bg-[#14532d] text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Update Existing Products ({catalogProducts.length})</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-500">
                  Authorized for both <strong>Super Admin</strong> & <strong>Moderator</strong>
                </div>
              </div>

              {/* SUB-VIEW A: ADD PRODUCT (DESCRIPTION DRIVEN) */}
              {productSubTab === 'add' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Form Column (2 Cols) */}
                  <div className="lg:col-span-2 space-y-4 sm:space-y-5 bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-700" />
                        <span>Description-Driven Product Creator</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Type or paste a product description. The smart intelligence parser will analyze it to suggest title, category, brand, pack size, price, and stock automatically!
                      </p>
                    </div>

                    {/* Quick Sample Description Templates */}
                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3 sm:p-3.5">
                      <span className="text-[10px] sm:text-[11px] font-black uppercase text-emerald-900 tracking-wider block mb-1.5">
                        Load Quick Sample Description Templates:
                      </span>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        <button
                          type="button"
                          onClick={() => handleLoadDescriptionTemplate('oil')}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-lg font-bold text-[11px] transition shadow-xs cursor-pointer"
                        >
                          + Teer Soybean 5L
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadDescriptionTemplate('rice')}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-lg font-bold text-[11px] transition shadow-xs cursor-pointer"
                        >
                          + Miniket Rice 25KG
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadDescriptionTemplate('ghee')}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-lg font-bold text-[11px] transition shadow-xs cursor-pointer"
                        >
                          + Aarong Ghee 900g
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadDescriptionTemplate('turmeric')}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-lg font-bold text-[11px] transition shadow-xs cursor-pointer"
                        >
                          + Radhuni Turmeric 500g
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadDescriptionTemplate('eggs')}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-lg font-bold text-[11px] transition shadow-xs cursor-pointer"
                        >
                          + Farm Brown Eggs 30s
                        </button>
                      </div>
                    </div>

                    <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
                      {/* Product Description Field (Optional) */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
                            <span>Product Description</span>
                            <span className="text-slate-400 font-semibold text-xs">(Optional)</span>
                          </label>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {productForm.description.trim().length} chars
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          value={productForm.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProductForm({ ...productForm, description: val });
                          }}
                          placeholder="Optional: Describe the product (e.g. Pure Teer Fortified Soybean Oil 5 Liter Can. Cholesterol-free, enriched with vitamins. Regular price 850 BDT, sale 790 BDT, stock 50 units)..."
                          className="w-full p-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600 transition text-xs font-sans bg-white"
                        />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mt-1.5">
                          <p className="text-[11px] text-slate-400">
                            Optional: You can type a description or click Auto-Fill to populate product details automatically.
                          </p>
                          <button
                            type="button"
                            onClick={() => parseDescriptionAndAutoFill(productForm.description)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer w-full sm:w-auto"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                            <span>✨ Auto-Fill Fields from Description</span>
                          </button>
                        </div>
                      </div>

                      {/* Auto-filled Form Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                        <div className="sm:col-span-2">
                          <label className="font-bold text-slate-700 block mb-1">Product Title / Name *</label>
                          <input
                            type="text"
                            required
                            value={productForm.name}
                            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                            placeholder="e.g. Teer Pure Soybean Oil"
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-700 focus:outline-none"
                          />
                        </div>

                        {/* 1. Category with + Add Category Button */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-bold text-slate-700 block text-xs">Category *</label>
                            <button
                              type="button"
                              onClick={() => setShowAddCategoryModal(true)}
                              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1 transition cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Category</span>
                            </button>
                          </div>
                          <select
                            value={productForm.category}
                            onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-700 focus:outline-none bg-white font-semibold text-xs"
                          >
                            {categoriesList.map((cat) => (
                              <option key={cat.slug} value={cat.slug}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 1b. Item (Product by Item) with + Add Item Button */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-bold text-slate-700 block text-xs">Item (Product by Item) *</label>
                            <button
                              type="button"
                              onClick={() => setShowAddItemModal(true)}
                              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1 transition cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Item</span>
                            </button>
                          </div>
                          <select
                            value={productForm.itemType}
                            onChange={(e) => setProductForm({ ...productForm, itemType: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-700 focus:outline-none bg-white font-semibold text-xs"
                          >
                            <option value="">-- None / General --</option>
                            {itemsList.map((it) => (
                              <option key={it.slug || it.name} value={it.name}>
                                {it.icon ? `${it.icon} ` : ''}{it.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Placement & Display Settings */}
                        <div className="sm:col-span-2 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
                          <label className="font-extrabold text-slate-800 block text-xs">Product Placement & Display Options</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-emerald-200">
                              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                              <div>
                                <span className="font-bold text-slate-800 block">Category Section</span>
                                <span className="text-[10px] text-slate-500">
                                  Appears under "{categoriesList.find((c) => c.slug === productForm.category)?.name || productForm.category}"
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-emerald-200">
                              <span className={`w-2 h-2 rounded-full ${productForm.itemType ? 'bg-emerald-600' : 'bg-slate-300'}`}></span>
                              <div>
                                <span className="font-bold text-slate-800 block">Item Section</span>
                                <span className="text-[10px] text-slate-500">
                                  {productForm.itemType
                                    ? `Appears in "${productForm.itemType}" item section`
                                    : 'Select an Item above to display in item section'}
                                </span>
                              </div>
                            </div>

                            <label className="sm:col-span-2 flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 cursor-pointer hover:bg-amber-100/50 transition">
                              <input
                                type="checkbox"
                                checked={productForm.isDealOfTheDay}
                                onChange={(e) => setProductForm({ ...productForm, isDealOfTheDay: e.target.checked })}
                                className="w-4 h-4 text-amber-600 rounded accent-amber-600 cursor-pointer"
                              />
                              <div>
                                <span className="font-extrabold text-amber-950 block">Feature in "Deals of the Day" 🔥</span>
                                <span className="text-[10px] text-amber-800">
                                  Displays this product in the Deals of the Day homepage carousel and dedicated deals catalog with daily deal badge.
                                </span>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* 2. Brand Name */}
                        <div>
                          <label className="font-bold text-slate-700 block mb-1 text-xs">Brand Name</label>
                          <input
                            type="text"
                            value={productForm.brand}
                            onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                            placeholder="e.g. Teer, Aarong, Fresh, Radhuni"
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-700 focus:outline-none text-xs"
                          />
                        </div>

                        {/* 3. Base Unit Dropdown (Liter, Piece, KG, etc.) */}
                        <div>
                          <label className="font-bold text-slate-700 block mb-1 text-xs">Base Unit *</label>
                          <select
                            value={productForm.unit}
                            onChange={(e) => {
                              const newUnit = e.target.value;
                              const presets = UNIT_VARIANT_PRESETS[newUnit] || [];
                              const defaultVariant = presets[2] || presets[0] || newUnit;
                              setProductForm({
                                ...productForm,
                                unit: newUnit,
                                variantName: defaultVariant,
                              });
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-700 focus:outline-none bg-white font-semibold text-xs"
                          >
                            <option value="Liter">Liter (Ltr / ML)</option>
                            <option value="Piece">Piece (Pcs / Hali / Dozen)</option>
                            <option value="KG">KG (Kilogram / Gram)</option>
                            <option value="Gram">Gram (gm)</option>
                            <option value="Pack">Pack (Packet / Poly)</option>
                            <option value="Box">Box (Carton / Box)</option>
                            <option value="Bottle">Bottle</option>
                            <option value="Dozen">Dozen</option>
                          </select>
                        </div>

                        {/* 4. Variant Display (Size/Pack) with dynamic quick buttons based on Base Unit */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-bold text-slate-700 block text-xs">Variant Display (Size/Pack) *</label>
                            {productForm.unit && (
                              <span className="text-[10px] text-slate-500 font-semibold">
                                Presets for <strong className="text-emerald-700">{productForm.unit}</strong>
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            required
                            value={productForm.variantName}
                            onChange={(e) => setProductForm({ ...productForm, variantName: e.target.value })}
                            placeholder="e.g. 5 Liter / 25 KG / 500 gm / 30 Pieces"
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-700 focus:outline-none text-xs"
                          />

                          {/* Quick Variant Buttons for selected Base Unit */}
                          {UNIT_VARIANT_PRESETS[productForm.unit] && (
                            <div className="mt-1.5">
                              <div className="flex flex-wrap gap-1">
                                {UNIT_VARIANT_PRESETS[productForm.unit].map((size) => {
                                  const isSelected =
                                    productForm.variantName === size ||
                                    (size === '1 Ltr' && (productForm.variantName === '1 Liter' || productForm.variantName === '1 Ltr')) ||
                                    (size === '5 Ltr' && (productForm.variantName === '5 Liter' || productForm.variantName === '5 Ltr')) ||
                                    (size === '1 KG' && productForm.variantName === '1 KG') ||
                                    (size === '1 Piece' && productForm.variantName === '1 Piece');
                                  return (
                                    <button
                                      key={size}
                                      type="button"
                                      onClick={() => setProductForm({ ...productForm, variantName: size })}
                                      className={`px-2 py-0.5 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                                        isSelected
                                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-200'
                                          : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      {size}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 5. Regular Price (৳) */}
                        <div>
                          <label className="font-bold text-slate-700 block mb-1 text-xs">Regular Price (৳)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={productForm.basePrice}
                            onChange={(e) => setProductForm({ ...productForm, basePrice: e.target.value })}
                            placeholder="e.g. 850"
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-700 focus:outline-none text-xs"
                          />
                        </div>

                        {/* 6. Sale Price (৳) */}
                        <div>
                          <label className="font-bold text-slate-700 block mb-1 text-xs">Sale Price (৳)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={productForm.salePrice}
                            onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value })}
                            placeholder="e.g. 790"
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-700 focus:outline-none text-xs"
                          />
                        </div>

                        {/* 7. Warehouse Stock */}
                        <div>
                          <label className="font-bold text-slate-700 block mb-1 text-xs">Warehouse Stock</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={productForm.stockQuantity}
                            onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                            placeholder="e.g. 50"
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-700 focus:outline-none text-xs"
                          />
                        </div>

                        {/* 8. Tags with Chips, Autocomplete Dropdown, and + Add Button */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-bold text-slate-700 block text-xs">Tags</label>
                            <button
                              type="button"
                              onClick={() => setShowAddTagModal(true)}
                              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1 transition cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Tag</span>
                            </button>
                          </div>

                          {/* Selected Tags Chips */}
                          {(() => {
                            const tags = productForm.tags
                              ? productForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
                              : [];
                            return (
                              tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-1.5">
                                  {tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold"
                                    >
                                      <span>#{tag}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="text-emerald-600 hover:text-rose-600 cursor-pointer p-0.5 rounded-full"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )
                            );
                          })()}

                          {/* Autocomplete Input & Dropdown */}
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center border border-slate-300 rounded-xl focus-within:border-emerald-700 bg-white overflow-hidden px-2.5">
                              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1.5" />
                              <input
                                type="text"
                                value={tagSearchQuery}
                                onChange={(e) => {
                                  setTagSearchQuery(e.target.value);
                                  setIsTagDropdownOpen(true);
                                }}
                                onFocus={() => setIsTagDropdownOpen(true)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ',') {
                                    e.preventDefault();
                                    if (tagSearchQuery.trim()) {
                                      handleSelectOrAddNewTag(tagSearchQuery);
                                    }
                                  }
                                }}
                                placeholder="Type to search tags or add new..."
                                className="w-full py-2 text-xs focus:outline-none"
                              />
                              {tagSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => setTagSearchQuery('')}
                                  className="text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            {/* Dropdown Suggestions */}
                            {isTagDropdownOpen && (
                              <div
                                className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl p-1 text-xs"
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                {(() => {
                                  const currentTags = productForm.tags
                                    ? productForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
                                    : [];
                                  const query = tagSearchQuery.toLowerCase().trim();
                                  const filtered = availableTags.filter(
                                    (t) =>
                                      (!query || t.toLowerCase().includes(query)) &&
                                      !currentTags.some((st) => st.toLowerCase() === t.toLowerCase())
                                  );
                                  const exactMatch = availableTags.some((t) => t.toLowerCase() === query);

                                  return (
                                    <>
                                      {filtered.slice(0, 8).map((t) => (
                                        <button
                                          key={t}
                                          type="button"
                                          onClick={() => {
                                            handleSelectOrAddNewTag(t);
                                          }}
                                          className="w-full px-2.5 py-1.5 text-left hover:bg-emerald-50 rounded-lg flex items-center justify-between transition cursor-pointer text-slate-700"
                                        >
                                          <span className="font-semibold text-xs">#{t}</span>
                                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                            + Add
                                          </span>
                                        </button>
                                      ))}

                                      {/* If query has text and not exact match, show Add button */}
                                      {query && !exactMatch && (
                                        <div className="pt-1 mt-1 border-t border-slate-100">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleSelectOrAddNewTag(tagSearchQuery);
                                            }}
                                            className="w-full px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                                          >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Add "{tagSearchQuery.trim()}" as New Tag</span>
                                          </button>
                                        </div>
                                      )}

                                      {filtered.length === 0 && !query && (
                                        <div className="p-2 text-center text-slate-400 text-[11px]">
                                          All standard tags selected
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="font-bold text-slate-700 block mb-1">Image URL</label>
                          <input
                            type="url"
                            value={productForm.imageUrl}
                            onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-700 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Submit Action */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-[11px] text-slate-400">
                          Ready to upload to Category, Item & Deals placements
                        </div>

                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-sm bg-[#14532d] hover:bg-[#0f3f22] text-white cursor-pointer active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Publish Product to Storefront</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Live Card Preview Column */}
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                      <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-3">
                        Live Storefront Card Preview
                      </span>

                      {/* Mock Product Card */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm">
                        <div className="relative w-full h-40 bg-slate-100 rounded-xl overflow-hidden mb-3 flex items-center justify-center">
                          {productForm.imageUrl ? (
                            <img
                              src={productForm.imageUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-10 h-10 text-slate-300" />
                          )}
                          {Number(productForm.basePrice) > Number(productForm.salePrice) && (
                            <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                              -{Math.round((((Number(productForm.basePrice) - Number(productForm.salePrice)) / (Number(productForm.basePrice) || 1)) * 100))}% OFF
                            </span>
                          )}
                          {productForm.isDealOfTheDay && (
                            <span className="absolute bottom-2 left-2 bg-amber-500 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                              <span>🔥 Deal of the Day</span>
                            </span>
                          )}
                        </div>

                        <div className="font-black text-slate-900 text-sm truncate">
                          {productForm.name || 'Product Title'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {productForm.variantName || '5 Liter'} • {productForm.brand || 'Brand'}
                        </div>

                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-lg font-black text-slate-900">৳{productForm.salePrice || '790'}</span>
                          {Number(productForm.basePrice) > Number(productForm.salePrice) && (
                            <span className="text-xs text-slate-400 line-through">৳{productForm.basePrice}</span>
                          )}
                        </div>

                        <div className="mt-2 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg">
                          Warehouse Stock: {productForm.stockQuantity || '50'} units
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 border border-slate-100">
                        <strong>Placement Summary:</strong> Product description is optional. The product will be indexed in its selected Category, Item section, and Deals of the Day (if enabled).
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-VIEW B: UPDATE EXISTING PRODUCTS */}
              {productSubTab === 'update' && (
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200">
                    <Search className="w-4 h-4 text-slate-400 ml-2" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search existing products by name, variant, or category..."
                      className="w-full text-xs focus:outline-none"
                    />
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {catalogProducts
                      .filter((p) => {
                        if (!productSearch.trim()) return true;
                        const term = productSearch.toLowerCase();
                        return (
                          (p.name || '').toLowerCase().includes(term) ||
                          (p.category?.name || p.category?.slug || '').toLowerCase().includes(term) ||
                          (p.brand?.name || '').toLowerCase().includes(term)
                        );
                      })
                      .map((p) => {
                        const curPrice = p.salePrice || p.price || 100;
                        const regPrice = p.basePrice || curPrice;

                        return (
                          <div
                            key={p.id}
                            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                          >
                            <div className="flex gap-3 mb-3">
                              <img
                                src={p.primaryImage || p.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80'}
                                alt={p.name}
                                className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-100"
                              />
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-slate-900 text-xs truncate">{p.name}</h4>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {p.unit || p.variants?.[0]?.displayName || 'Standard'} • {p.brand?.name || 'Brand'}
                                </div>
                                <div className="flex items-baseline gap-1.5 mt-1">
                                  <span className="font-black text-slate-900 text-sm">৳{curPrice}</span>
                                  {regPrice > curPrice && (
                                    <span className="text-[10px] text-slate-400 line-through">৳{regPrice}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                              <span className="text-[11px] text-slate-500">
                                Stock: <strong>{p.stockQuantity ?? 50}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditProductModal(p)}
                                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] transition flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit Product</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: CUSTOMER APPROVALS (SUPER ADMIN ONLY) */}
          {/* ========================================================= */}
          {activeTab === 'customers' && (
            <div className="space-y-4 text-left">
              {activeRole !== 'SUPER_ADMIN' ? (
                <div className="p-8 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                  <Lock className="w-10 h-10 text-amber-600 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-900 text-sm">Super Admin Privilege Required</h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                    Customer KYC approvals and account verification are restricted to Super Administrators. Moderators can fulfill pending orders, update tracking, and manage products.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 uppercase tracking-wide">
                      Customer Accounts Requiring Admin Approval:
                    </span>
                    <span className="text-slate-500">{customers.length} registered accounts</span>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="divide-y divide-slate-100">
                      {customers.map((c) => {
                        const isPending = c.status === 'PENDING_APPROVAL';

                        return (
                          <div key={c.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs">{c.name || 'New Customer'}</span>
                                <span
                                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {c.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">Phone: {c.phone}</div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              {isPending ? (
                                <button
                                  type="button"
                                  onClick={() => handleApproveCustomer(c.id)}
                                  className="w-full sm:w-auto px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition cursor-pointer text-center"
                                >
                                  Approve Customer
                                </button>
                              ) : (
                                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: INVENTORY ALERTS & LEDGER (SUPER ADMIN & MODERATOR) */}
          {/* ========================================================= */}
          {activeTab === 'inventory' && (
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wide">
                  Low Stock & Out-of-Stock Inventory Alerts ({alerts.length})
                </span>
                <span className="text-slate-500 text-[11px]">Threshold: Less than 10 units</span>
              </div>

              {alerts.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="font-bold text-slate-800 text-xs">All inventory levels are healthy!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((a: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-3"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-xs">
                          {a.productName || a.product_name} ({a.variantName || a.variant_name})
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">SKU: {a.sku}</div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <span className="text-xs font-black text-rose-600">
                          Remaining: {a.stockQuantity ?? a.stock_quantity} units
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickRestock(a.variantId || a.variant_id, 50)}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                        >
                          Restock +50
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: HERO BANNERS CMS (SUPER ADMIN & MODERATOR) */}
          {/* ========================================================= */}
          {activeTab === 'banners' && (
            <div className="space-y-6 text-left">
              <div>
                <h3 className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                  Hero Banners CMS ({banners.length} Active Slides)
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Add or delete promotional slides on the homepage carousel. Authorized for Super Admin and Moderator.
                </p>
              </div>

              {/* Add Banner Form */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <form onSubmit={handleAddBanner} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Headline</label>
                    <input
                      type="text"
                      required
                      value={newHeadline}
                      onChange={(e) => setNewHeadline(e.target.value)}
                      placeholder="e.g. Fresh Daily Deals — Up to 25% Off"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
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
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Subtext</label>
                    <input
                      type="text"
                      value={newSubtext}
                      onChange={(e) => setNewSubtext(e.target.value)}
                      placeholder="e.g. Pure oils and fresh produce delivered in 15 mins."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Button Text</label>
                    <input
                      type="text"
                      value={newButtonText}
                      onChange={(e) => setNewButtonText(e.target.value)}
                      placeholder="Shop now"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-950 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      + Add Slide to Carousel
                    </button>
                  </div>
                </form>
              </div>

              {/* Slides Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 relative group">
                    <img src={b.imageUrl} alt={b.headline} className="w-20 h-20 rounded-xl object-cover shrink-0 bg-slate-100" />
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="font-bold text-slate-900 text-xs truncate">{b.headline}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{b.subtext}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteBanner(b.id)}
                      className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                      title="Delete Slide"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: FRIDAY FLASH BAZAAR OFFERS */}
          {/* ========================================================= */}
          {activeTab === 'friday-deals' && (
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <h3 className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-600" /> Friday Flash Bazaar Offers ({flashItems.length})
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Subsidized Friday deals scroll horizontally on the storefront.
                  </p>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-3.5">
                <span className="text-[11px] font-black uppercase text-rose-800 tracking-wider block mb-2">
                  One-Click Flash Deal Presets:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickAddFlashPreset({
                        productName: 'Rupchanda Fortified Soybean Oil',
                        productSlug: 'rupchanda-fortified-soybean-oil-5l',
                        variantName: '5 Liter',
                        regularPrice: 870,
                        dealPrice: 810,
                        savings: 60,
                        discountPercentage: 7,
                        allocatedStock: 45,
                        maxPerCustomer: 2,
                        imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
                      })
                    }
                    className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-lg font-bold text-[11px] transition cursor-pointer"
                  >
                    + Rupchanda Oil 5L
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickAddFlashPreset({
                        productName: 'Aarong Dairy Pure Ghee',
                        productSlug: 'aarong-dairy-pure-ghee-900g',
                        variantName: '900 gm Jar',
                        regularPrice: 1450,
                        dealPrice: 1290,
                        savings: 160,
                        discountPercentage: 11,
                        allocatedStock: 30,
                        maxPerCustomer: 1,
                        imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80',
                      })
                    }
                    className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-lg font-bold text-[11px] transition cursor-pointer"
                  >
                    + Aarong Ghee 900g
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickAddFlashPreset({
                        productName: 'Fresh Chinigura Aromatic Rice',
                        productSlug: 'fresh-chinigura-aromatic-rice-1kg',
                        variantName: '1 KG Pack',
                        regularPrice: 175,
                        dealPrice: 145,
                        savings: 30,
                        discountPercentage: 17,
                        allocatedStock: 60,
                        maxPerCustomer: 3,
                        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
                      })
                    }
                    className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-lg font-bold text-[11px] transition cursor-pointer"
                  >
                    + Chinigura Rice 1KG
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {flashItems.map((item) => (
                  <div key={item.id} className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center gap-3 relative">
                    <img src={item.imageUrl || 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=200&q=80'} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="font-bold text-slate-900 text-xs truncate">{item.productName}</div>
                      <div className="text-[11px] text-slate-500">{item.variantName}</div>
                      <div className="text-xs font-black text-rose-600 mt-0.5">৳{item.dealPrice} <span className="text-slate-400 line-through text-[10px]">৳{item.regularPrice}</span></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteFlashDealItem(item.id)}
                      className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* MODAL 1: DECLINE PENDING ORDER (Moderator & Super Admin) */}
        {/* ========================================================= */}
        {declineModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in text-left">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center gap-2 text-rose-600 mb-2">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-black text-slate-900 text-base">Decline Pending Order</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Are you sure you want to decline Order <strong>#{declineModal.orderNumber}</strong>? Declining this order will automatically cancel it and restore inventory stock.
              </p>

              <form onSubmit={handleConfirmDecline} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reason for Declining:</label>
                  <select
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="Customer unreachable by phone">Customer unreachable by phone</option>
                    <option value="Delivery address out of service area">Delivery address out of service area</option>
                    <option value="Item damaged or short stock">Item damaged or short stock</option>
                    <option value="Suspected fraudulent / test order">Suspected fraudulent / test order</option>
                    <option value="Customer requested cancellation">Customer requested cancellation</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeclineModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Confirm Decline
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 2: UPDATE ORDER TRACKING (Moderator & Super Admin) */}
        {/* ========================================================= */}
        {trackingModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in text-left">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-800" />
                  <h3 className="font-black text-slate-900 text-base">
                    Update Live Order Tracking
                  </h3>
                </div>
                <button
                  onClick={() => setTrackingModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-slate-500 mb-4">
                Order <strong>#{trackingModal.order.orderNumber || trackingModal.order.id.slice(0, 8)}</strong> • Tracking: <strong>{trackingModal.order.trackingNumber || 'TRK-2026-DEMO'}</strong>
              </div>

              <form onSubmit={handleSaveTracking} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fulfillment Stage</label>
                  <select
                    value={trackingStatus}
                    onChange={(e) => setTrackingStatus(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-emerald-700 focus:outline-none bg-white font-bold"
                  >
                    <option value="CONFIRMED">1. Order Confirmed</option>
                    <option value="PROCESSING">2. Quality Check & Packaging</option>
                    <option value="OUT_FOR_DELIVERY">3. Out for 15-Min Doorstep Delivery</option>
                    <option value="DELIVERED">4. Delivered to Doorstep</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rider Assignment & Contact</label>
                  <input
                    type="text"
                    value={riderInfo}
                    onChange={(e) => setRiderInfo(e.target.value)}
                    placeholder="e.g. Rafiqul Islam - 01700-112233"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Live Tracking Progress Note</label>
                  <input
                    type="text"
                    value={trackingComment}
                    onChange={(e) => setTrackingComment(e.target.value)}
                    placeholder="e.g. Rider dispatched on motorcycle with insulated pouch"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-emerald-700 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTrackingModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Save & Broadcast Tracking
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 3: EDIT EXISTING PRODUCT */}
        {/* ========================================================= */}
        {editProductModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in text-left">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-emerald-800" />
                  <span>Update Product Details</span>
                </h3>
                <button
                  onClick={() => setEditProductModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateProductSave} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={editProductModal.name}
                    onChange={(e) => setEditProductModal({ ...editProductModal, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700 block text-xs">
                      Product Description <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={editProductModal.description || ''}
                    onChange={(e) => setEditProductModal({ ...editProductModal, description: e.target.value })}
                    placeholder="Optional: Enter product description..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Regular Price (৳)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editProductModal.basePrice || editProductModal.price}
                      onChange={(e) => setEditProductModal({ ...editProductModal, basePrice: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Sale Price (৳)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editProductModal.salePrice || editProductModal.price}
                      onChange={(e) => setEditProductModal({ ...editProductModal, salePrice: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Warehouse Stock</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editProductModal.stockQuantity ?? 50}
                      onChange={(e) => setEditProductModal({ ...editProductModal, stockQuantity: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">Brand Name</label>
                    <input
                      type="text"
                      value={editProductModal.brand?.name || editProductModal.brand || ''}
                      onChange={(e) =>
                        setEditProductModal({
                          ...editProductModal,
                          brand: { name: e.target.value },
                        })
                      }
                      placeholder="e.g. Teer, Aarong"
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 block text-xs">Category</label>
                      <button
                        type="button"
                        onClick={() => setShowAddCategoryModal(true)}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                    <select
                      value={editProductModal.category?.slug || editProductModal.categorySlug || 'cooking-oil'}
                      onChange={(e) => {
                        const slug = e.target.value;
                        const found = categoriesList.find((c) => c.slug === slug);
                        setEditProductModal({
                          ...editProductModal,
                          category: found || { slug, name: slug },
                          categorySlug: slug,
                        });
                      }}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs"
                    >
                      {categoriesList.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 block text-xs">Item (Product by Item)</label>
                      <button
                        type="button"
                        onClick={() => setShowAddItemModal(true)}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                    <select
                      value={editProductModal.itemType || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const itm = itemsList.find((i) => i.name === val);
                        setEditProductModal({
                          ...editProductModal,
                          itemType: val,
                          itemSlug: itm?.slug || val.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                        });
                      }}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs"
                    >
                      <option value="">-- None / General --</option>
                      {itemsList.map((it) => (
                        <option key={it.slug || it.name} value={it.name}>
                          {it.icon ? `${it.icon} ` : ''}{it.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Display in Deals of the Day toggle */}
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 cursor-pointer hover:bg-amber-100/50 transition">
                  <input
                    type="checkbox"
                    checked={Boolean(editProductModal.isDealOfTheDay)}
                    onChange={(e) =>
                      setEditProductModal({
                        ...editProductModal,
                        isDealOfTheDay: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-amber-600 rounded accent-amber-600 cursor-pointer"
                  />
                  <div>
                    <span className="font-extrabold text-amber-950 block text-xs">Feature in "Deals of the Day" 🔥</span>
                    <span className="text-[10px] text-amber-800">
                      Display on homepage Deals of the Day carousel and category deals tab.
                    </span>
                  </div>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">Base Unit</label>
                    <select
                      value={editProductModal.baseUnit || 'Liter'}
                      onChange={(e) => {
                        const unitVal = e.target.value;
                        const presets = UNIT_VARIANT_PRESETS[unitVal] || [];
                        setEditProductModal({
                          ...editProductModal,
                          baseUnit: unitVal,
                          unit: presets[0] || unitVal,
                        });
                      }}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs font-semibold"
                    >
                      <option value="Liter">Liter (Ltr / ML)</option>
                      <option value="Piece">Piece (Pcs / Hali / Dozen)</option>
                      <option value="KG">KG (Kilogram / Gram)</option>
                      <option value="Gram">Gram (gm)</option>
                      <option value="Pack">Pack (Packet / Poly)</option>
                      <option value="Box">Box (Carton / Box)</option>
                      <option value="Bottle">Bottle</option>
                      <option value="Dozen">Dozen</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 block text-xs">Variant Display (Size/Pack)</label>
                    </div>
                    <input
                      type="text"
                      value={editProductModal.unit || ''}
                      onChange={(e) => setEditProductModal({ ...editProductModal, unit: e.target.value })}
                      placeholder="e.g. 5 Liter / 1 KG / 12 Pieces"
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Quick Presets for Base Unit in Edit Modal */}
                {UNIT_VARIANT_PRESETS[editProductModal.baseUnit || 'Liter'] && (
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold mb-1">
                      Quick Presets for {editProductModal.baseUnit || 'Liter'}:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {UNIT_VARIANT_PRESETS[editProductModal.baseUnit || 'Liter'].map((size) => {
                        const isSelected = editProductModal.unit === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setEditProductModal({ ...editProductModal, unit: size })}
                            className={`px-2 py-0.5 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-200'
                                : 'bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border-slate-200'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tags in Edit Product Modal */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 block text-xs">Tags</label>
                    <button
                      type="button"
                      onClick={() => setShowAddTagModal(true)}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer"
                    >
                      + Add Tag
                    </button>
                  </div>

                  {/* Selected Tags Chips */}
                  {(() => {
                    const tags = Array.isArray(editProductModal.tags)
                      ? editProductModal.tags.map((t: any) => (typeof t === 'string' ? t : t.name || ''))
                      : typeof editProductModal.tags === 'string'
                      ? editProductModal.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
                      : [];
                    return (
                      tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold"
                            >
                              <span>#{tag}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag, true)}
                                className="text-emerald-600 hover:text-rose-600 cursor-pointer p-0.5 rounded-full"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )
                    );
                  })()}

                  {/* Autocomplete Input & Dropdown in Edit Modal */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center border border-slate-300 rounded-xl focus-within:border-emerald-700 bg-white overflow-hidden px-2.5">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1.5" />
                      <input
                        type="text"
                        value={editTagSearchQuery}
                        onChange={(e) => {
                          setEditTagSearchQuery(e.target.value);
                          setIsEditTagDropdownOpen(true);
                        }}
                        onFocus={() => setIsEditTagDropdownOpen(true)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            if (editTagSearchQuery.trim()) {
                              handleSelectOrAddNewTag(editTagSearchQuery, true);
                            }
                          }
                        }}
                        placeholder="Type to search tags or add new..."
                        className="w-full py-2 text-xs focus:outline-none"
                      />
                      {editTagSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setEditTagSearchQuery('')}
                          className="text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {isEditTagDropdownOpen && (
                      <div
                        className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl p-1 text-xs"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {(() => {
                          const currentTags = Array.isArray(editProductModal.tags)
                            ? editProductModal.tags.map((t: any) => (typeof t === 'string' ? t : t.name || ''))
                            : typeof editProductModal.tags === 'string'
                            ? editProductModal.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
                            : [];
                          const query = editTagSearchQuery.toLowerCase().trim();
                          const filtered = availableTags.filter(
                            (t) =>
                              (!query || t.toLowerCase().includes(query)) &&
                              !currentTags.some((st: string) => st.toLowerCase() === t.toLowerCase())
                          );
                          const exactMatch = availableTags.some((t) => t.toLowerCase() === query);

                          return (
                            <>
                              {filtered.slice(0, 8).map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => {
                                    handleSelectOrAddNewTag(t, true);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-left hover:bg-emerald-50 rounded-lg flex items-center justify-between transition cursor-pointer text-slate-700"
                                >
                                  <span className="font-semibold text-xs">#{t}</span>
                                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                    + Add
                                  </span>
                                </button>
                              ))}

                              {query && !exactMatch && (
                                <div className="pt-1 mt-1 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleSelectOrAddNewTag(editTagSearchQuery, true);
                                    }}
                                    className="w-full px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add "{editTagSearchQuery.trim()}" as New Tag</span>
                                  </button>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditProductModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#14532d] hover:bg-[#0f3f22] text-white rounded-xl font-bold cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: ADD CATEGORY */}
        {/* ========================================================= */}
        {showAddCategoryModal && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in text-left">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-700" />
                  <span>Add New Category</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setNewCategoryName('');
                    setNewCategoryDesc('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">Category Name *</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Organic Honey, Frozen Foods, Bakery"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:border-emerald-700 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">Category Slug (URL Identifier)</label>
                  <input
                    type="text"
                    value={newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}
                    disabled
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                    placeholder="Brief description of this grocery category..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:border-emerald-700 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCategoryModal(false);
                      setNewCategoryName('');
                      setNewCategoryDesc('');
                    }}
                    className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!newCategoryName.trim()}
                    onClick={handleSaveNewCategory}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Save & Select Category
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: ADD ITEM (PRODUCT BY ITEM) */}
        {/* ========================================================= */}
        {showAddItemModal && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in text-left">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-700" />
                  <span>Add New Item (Product by Item)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddItemModal(false);
                    setNewItemName('');
                    setNewItemIcon('📦');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">Item Name *</label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Rice, Oil, Vegetables, Spices, Dairy"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:border-emerald-700 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">Item Slug (Identifier)</label>
                  <input
                    type="text"
                    value={newItemName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}
                    disabled
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">Item Icon / Emoji</label>
                  <input
                    type="text"
                    value={newItemIcon}
                    onChange={(e) => setNewItemIcon(e.target.value)}
                    placeholder="e.g. 🍚, 🫒, 🥦, 🍎, 📦"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:border-emerald-700 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddItemModal(false);
                      setNewItemName('');
                      setNewItemIcon('📦');
                    }}
                    className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!newItemName.trim()}
                    onClick={handleSaveNewItem}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Save & Select Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: ADD TAG */}
        {/* ========================================================= */}
        {showAddTagModal && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in text-left">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-700" />
                  <span>Create New Tag</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTagModal(false);
                    setNewTagName('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">Tag Name *</label>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="e.g. Organic, Export Quality, Ramadan Special"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:border-emerald-700 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTagModal(false);
                      setNewTagName('');
                    }}
                    className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!newTagName.trim()}
                    onClick={() => {
                      handleSelectOrAddNewTag(newTagName.trim(), Boolean(editProductModal));
                      setNewTagName('');
                      setShowAddTagModal(false);
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Save & Add Tag
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 4: PRINTABLE TAX INVOICE (Super Admin Only) */}
        {/* ========================================================= */}
        {activeInvoice && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in text-left">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-8 shadow-2xl relative max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setActiveInvoice(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div id="printable-invoice" className="space-y-4 sm:space-y-6 text-xs text-slate-800">
                <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-4 gap-2">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900">LITON BROTHERS</h2>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Tejgaon Central Grocery Hub, Dhaka-1208, Bangladesh
                    </p>
                    <p className="text-slate-500 text-[11px]">Hotline: +880 1700-000000 | info@litonbrothers.com</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-base sm:text-lg font-black text-emerald-700 block">TAX INVOICE</span>
                    <span className="font-mono text-slate-500 text-[11px] block">
                      #{activeInvoice.invoice?.invoiceNumber || 'INV-2026-001'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Date: {new Date(activeInvoice.invoice?.issuedAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Billed & Shipped To:</span>
                    <div className="font-bold text-slate-900">{activeInvoice.customer?.name}</div>
                    <div className="font-mono text-slate-600 text-[11px]">{activeInvoice.customer?.phone}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{activeInvoice.customer?.address}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Payment Details:</span>
                    <div className="font-bold text-slate-900">Method: {activeInvoice.order?.paymentMethod || 'COD'}</div>
                    <div className="text-slate-500 text-[11px]">Status: {activeInvoice.order?.paymentStatus || 'PAID'}</div>
                    <div className="text-slate-500 text-[11px]">Slot: {activeInvoice.order?.deliverySlot || 'Express 15-Min'}</div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => window.print()}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Print Tax Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
