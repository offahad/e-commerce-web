import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Heart,
  Plus,
  Minus,
  Star,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

export interface CategoryPageProps {
  categorySlug: string;
  categoryTitle?: string;
  onBack: () => void;
  onOpenProduct: (product: any) => void;
  onSelectCategory: (slug: string) => void;
  apiProducts?: any[];
}

// Master categorized items database guaranteeing rich listings for every segment & item
export const CATEGORY_CATALOG_DATABASE: Record<
  string,
  {
    title: string;
    icon: string;
    description: string;
    products: Array<{
      id: string;
      name: string;
      slug: string;
      price: number;
      regularPrice?: number;
      unit: string;
      rating: number;
      reviewsCount: number;
      imageUrl: string;
      discountPercentage?: number;
      variantId?: string;
      tags?: string[];
    }>;
  }
> = {
  fruits: {
    title: 'Fresh Fruits',
    icon: '🍎',
    description: 'Crisp, naturally ripened and vitamin-rich fruits handpicked from certified orchards.',
    products: [
      {
        id: 'frt-1',
        name: 'Italian Avocado',
        slug: 'italian-avocado',
        price: 350,
        regularPrice: 380,
        unit: '1 pc',
        rating: 4.8,
        reviewsCount: 189,
        imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-frt-1',
      },
      {
        id: 'frt-2',
        name: 'Fresh Oranges (Malta)',
        slug: 'fresh-oranges',
        price: 220,
        regularPrice: 275,
        unit: '1 kg',
        rating: 4.7,
        reviewsCount: 234,
        discountPercentage: 20,
        imageUrl: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-frt-2',
      },
      {
        id: 'frt-3',
        name: 'Crisp Green Apples',
        slug: 'crisp-green-apples',
        price: 280,
        unit: '1 kg',
        rating: 4.6,
        reviewsCount: 189,
        imageUrl: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-frt-3',
      },
      {
        id: 'frt-4',
        name: 'Red Fuji Apples',
        slug: 'red-fuji-apples',
        price: 310,
        unit: '1 kg',
        rating: 4.9,
        reviewsCount: 412,
        imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-frt-4',
      },
      {
        id: 'frt-5',
        name: 'Sweet Ruby Pomegranate',
        slug: 'sweet-ruby-pomegranate',
        price: 380,
        regularPrice: 420,
        unit: '1 kg',
        rating: 4.9,
        reviewsCount: 156,
        imageUrl: 'https://images.unsplash.com/photo-1541344999736-83eca872f241?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-frt-5',
      },
      {
        id: 'frt-6',
        name: 'Sagor Premium Bananas',
        slug: 'sagor-premium-bananas',
        price: 110,
        unit: '1 Dozen (12 pcs)',
        rating: 4.8,
        reviewsCount: 320,
        imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-frt-6',
      },
    ],
  },

  vegetables: {
    title: 'Fresh Vegetables',
    icon: '🥦',
    description: 'Direct-from-farm crisp greens, roots and staples harvested early morning.',
    products: [
      {
        id: 'veg-1',
        name: 'Fresh Beetroot',
        slug: 'fresh-beetroot',
        price: 120,
        regularPrice: 140,
        unit: '1 kg',
        rating: 4.8,
        reviewsCount: 234,
        imageUrl: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-veg-1',
      },
      {
        id: 'veg-2',
        name: 'Fresh Red Tomatoes',
        slug: 'fresh-red-tomatoes',
        price: 85,
        regularPrice: 100,
        unit: '1 kg',
        rating: 4.7,
        reviewsCount: 310,
        imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-veg-2',
      },
      {
        id: 'veg-3',
        name: 'Organic Green Broccoli',
        slug: 'organic-green-broccoli',
        price: 150,
        unit: '500g',
        rating: 4.9,
        reviewsCount: 142,
        imageUrl: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-veg-3',
      },
      {
        id: 'veg-4',
        name: 'Fresh Red Onion (Deshi Piyaj)',
        slug: 'fresh-red-onion-deshi-piyaj',
        price: 90,
        unit: '1 kg',
        rating: 4.6,
        reviewsCount: 420,
        imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-veg-4',
      },
      {
        id: 'veg-5',
        name: 'Diamond Brown Potatoes (Alu)',
        slug: 'diamond-brown-potatoes',
        price: 55,
        unit: '1 kg',
        rating: 4.8,
        reviewsCount: 610,
        imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-veg-5',
      },
      {
        id: 'veg-6',
        name: 'Crisp Green Capsicum',
        slug: 'crisp-green-capsicum',
        price: 240,
        unit: '500g',
        rating: 4.7,
        reviewsCount: 95,
        imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-veg-6',
      },
    ],
  },

  'cooking-oil': {
    title: 'Edible Cooking Oils',
    icon: '🫒',
    description: '100% pure, unadulterated soybean, mustard, sunflower and olive oils.',
    products: [
      {
        id: 'oil-1',
        name: 'Teer Pure Soybean Oil (1 Liter)',
        slug: 'teer-pure-soybean-oil',
        price: 175,
        regularPrice: 180,
        unit: '1 Liter Bottle',
        rating: 4.9,
        reviewsCount: 840,
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-oil-1',
      },
      {
        id: 'oil-2',
        name: 'Rupchanda Fortified Soybean Oil (5 Liter)',
        slug: 'rupchanda-fortified-soybean-oil',
        price: 840,
        regularPrice: 870,
        unit: '5 Liter Jar',
        rating: 4.9,
        reviewsCount: 520,
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-oil-2',
      },
      {
        id: 'oil-3',
        name: 'Radhuni Pure Mustard Oil (Ghani Vanga)',
        slug: 'radhuni-pure-mustard-oil',
        price: 360,
        regularPrice: 380,
        unit: '1 Liter Bottle',
        rating: 4.8,
        reviewsCount: 310,
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-oil-3',
      },
      {
        id: 'oil-4',
        name: 'Olitalia Extra Virgin Olive Oil',
        slug: 'olitalia-extra-virgin-olive-oil',
        price: 1250,
        regularPrice: 1350,
        unit: '500 ml Glass Bottle',
        rating: 5.0,
        reviewsCount: 120,
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-oil-4',
      },
      {
        id: 'oil-5',
        name: 'Fortune Pure Sunflower Oil',
        slug: 'fortune-pure-sunflower-oil',
        price: 790,
        regularPrice: 830,
        unit: '3 Liter Jar',
        rating: 4.7,
        reviewsCount: 195,
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-oil-5',
      },
    ],
  },

  rice: {
    title: 'Premium Rice & Aromatic Grains',
    icon: '🍚',
    description: 'Slender, thoroughly sorted Miniket, Nazirshail, Basmati and Kalijira rice.',
    products: [
      {
        id: 'rice-1',
        name: 'Miniket Premium Rice (25 KG Bag)',
        slug: 'miniket-premium-rice',
        price: 1700,
        regularPrice: 1850,
        unit: '25 KG Bag',
        rating: 4.9,
        reviewsCount: 650,
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-rice-1',
      },
      {
        id: 'rice-2',
        name: 'Fresh Chinigura Aromatic Rice',
        slug: 'fresh-chinigura-aromatic-rice',
        price: 160,
        regularPrice: 175,
        unit: '1 KG Pack',
        rating: 4.8,
        reviewsCount: 420,
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-rice-2',
      },
      {
        id: 'rice-3',
        name: 'Nazirshail Polished White Rice',
        slug: 'nazirshail-polished-white-rice',
        price: 390,
        regularPrice: 420,
        unit: '5 KG Pack',
        rating: 4.7,
        reviewsCount: 310,
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-rice-3',
      },
      {
        id: 'rice-4',
        name: 'Daawat Rozana Basmati Rice',
        slug: 'daawat-rozana-basmati-rice',
        price: 490,
        regularPrice: 540,
        unit: '2 KG Pack',
        rating: 4.9,
        reviewsCount: 280,
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-rice-4',
      },
    ],
  },

  beverages: {
    title: 'Drinks & Beverages',
    icon: '🥤',
    description: 'Refreshing juices, chilled soft drinks, energy beverages and mineral water.',
    products: [
      {
        id: 'bev-1',
        name: 'Sprite Cold Drink (Can)',
        slug: 'sprite-cold-drink-can',
        price: 50,
        unit: '250 ml Can',
        rating: 4.8,
        reviewsCount: 567,
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-bev-1',
      },
      {
        id: 'bev-2',
        name: 'Coca-Cola Classic (Can)',
        slug: 'coca-cola-classic-can',
        price: 50,
        unit: '250 ml Can',
        rating: 4.9,
        reviewsCount: 890,
        imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-bev-2',
      },
      {
        id: 'bev-3',
        name: 'Pran Frooto Mango Juice',
        slug: 'pran-frooto-mango-juice',
        price: 75,
        unit: '1 Liter Bottle',
        rating: 4.7,
        reviewsCount: 340,
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-bev-3',
      },
      {
        id: 'bev-4',
        name: 'Kinley Pure Mineral Water',
        slug: 'kinley-pure-mineral-water',
        price: 30,
        unit: '1.5 Liter Bottle',
        rating: 4.8,
        reviewsCount: 1200,
        imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-bev-4',
      },
    ],
  },

  'flour-atta': {
    title: 'Flour, Atta & Baking Grains',
    icon: '🌾',
    description: 'Chakki-fresh whole wheat atta, refined maida and suji for home baking and rotis.',
    products: [
      {
        id: 'flour-1',
        name: 'Teer Whole Wheat Atta',
        slug: 'teer-whole-wheat-atta',
        price: 135,
        regularPrice: 145,
        unit: '2 KG Pack',
        rating: 4.9,
        reviewsCount: 480,
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-flour-1',
      },
      {
        id: 'flour-2',
        name: 'Fresh Refined White Maida',
        slug: 'fresh-refined-white-maida',
        price: 75,
        unit: '1 KG Pack',
        rating: 4.7,
        reviewsCount: 220,
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-flour-2',
      },
      {
        id: 'flour-3',
        name: 'Pran Pure Coarse Suji (Semolina)',
        slug: 'pran-pure-coarse-suji',
        price: 65,
        unit: '500g Pack',
        rating: 4.8,
        reviewsCount: 160,
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-flour-3',
      },
    ],
  },

  sugar: {
    title: 'Pure Sugar & Sweeteners',
    icon: '🍬',
    description: 'Sulphur-free crystal white sugar, deshi brown sugar and natural date molasses.',
    products: [
      {
        id: 'sug-1',
        name: 'Fresh White Crystal Sugar',
        slug: 'fresh-white-crystal-sugar',
        price: 130,
        unit: '1 KG Pack',
        rating: 4.8,
        reviewsCount: 390,
        imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-sug-1',
      },
      {
        id: 'sug-2',
        name: 'Organic Deshi Brown Sugar (Lal Chini)',
        slug: 'organic-deshi-brown-sugar',
        price: 160,
        regularPrice: 180,
        unit: '1 KG Pack',
        rating: 4.9,
        reviewsCount: 180,
        imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-sug-2',
      },
    ],
  },

  salt: {
    title: 'Iodized Salt & Seasoning',
    icon: '🧂',
    description: 'Vacuum-evaporated pure iodized table salt and organic pink Himalayan salt.',
    products: [
      {
        id: 'salt-1',
        name: 'Molla Super Pure Iodized Salt',
        slug: 'molla-super-pure-iodized-salt',
        price: 42,
        unit: '1 KG Pack',
        rating: 4.9,
        reviewsCount: 520,
        imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-salt-1',
      },
      {
        id: 'salt-2',
        name: 'Pure Himalayan Pink Rock Salt',
        slug: 'pure-himalayan-pink-rock-salt',
        price: 180,
        regularPrice: 210,
        unit: '500g Glass Grinder',
        rating: 4.8,
        reviewsCount: 140,
        imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-salt-2',
      },
    ],
  },

  'dal-pulses': {
    title: 'Dal, Lentils & Pulses',
    icon: '🫘',
    description: 'Cleaned, polished and wholesome red lentils, moong dal, chana dal and chickpeas.',
    products: [
      {
        id: 'dal-1',
        name: 'Fresh Deshi Masoor Dal (Red Lentils)',
        slug: 'fresh-deshi-masoor-dal',
        price: 140,
        unit: '1 KG Pack',
        rating: 4.8,
        reviewsCount: 310,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-dal-1',
      },
      {
        id: 'dal-2',
        name: 'Roasted Yellow Moong Dal',
        slug: 'roasted-yellow-moong-dal',
        price: 165,
        regularPrice: 180,
        unit: '1 KG Pack',
        rating: 4.9,
        reviewsCount: 195,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-dal-2',
      },
      {
        id: 'dal-3',
        name: 'Kabuli Chana (Chickpeas)',
        slug: 'kabuli-chana-chickpeas',
        price: 190,
        unit: '1 KG Pack',
        rating: 4.7,
        reviewsCount: 160,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-dal-3',
      },
    ],
  },

  'noodles-pasta': {
    title: 'Noodles & Pasta',
    icon: '🍜',
    description: 'Instant noodles, durum wheat pasta, spaghetti and vermicelli.',
    products: [
      {
        id: 'nood-1',
        name: 'Maggi 2-Minute Masala Noodles (8-Pack)',
        slug: 'maggi-2-minute-masala-noodles',
        price: 160,
        unit: '8 x 62g Pack',
        rating: 4.9,
        reviewsCount: 780,
        imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-nood-1',
      },
      {
        id: 'nood-2',
        name: 'Barilla Italian Penne Rigate Pasta',
        slug: 'barilla-penne-rigate-pasta',
        price: 240,
        regularPrice: 260,
        unit: '500g Box',
        rating: 4.8,
        reviewsCount: 210,
        imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-nood-2',
      },
    ],
  },

  'meat-fish': {
    title: 'Fresh Meat & Fish',
    icon: '🍗',
    description: 'BSTI inspected halal butchery, prime beef cuts, organic chicken and fresh river fish.',
    products: [
      {
        id: 'meat-1',
        name: 'Premium Beef (Cut Bone)',
        slug: 'fresh-beef-cut-bone',
        price: 750,
        regularPrice: 780,
        unit: '1 kg Cut',
        rating: 4.9,
        reviewsCount: 312,
        imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-meat-1',
      },
      {
        id: 'meat-2',
        name: 'Farm Fresh Broiler Chicken (Curry Cut)',
        slug: 'farm-fresh-chicken-curry-cut',
        price: 220,
        unit: '1 kg Clean Cut',
        rating: 4.8,
        reviewsCount: 480,
        imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-meat-2',
      },
    ],
  },

  dairy: {
    title: 'Organic Dairy & Farm Eggs',
    icon: '🧀',
    description: 'Chilled liquid milk, butter, cheese and fresh brown farm eggs.',
    products: [
      {
        id: 'dairy-1',
        name: 'Aarong Dairy Pure Liquid Milk',
        slug: 'aarong-dairy-pure-liquid-milk',
        price: 90,
        regularPrice: 110,
        unit: '1 Liter Poly Pack',
        rating: 4.9,
        reviewsCount: 892,
        discountPercentage: 18,
        imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-dairy-1',
      },
      {
        id: 'dairy-2',
        name: 'Farm Fresh Brown Eggs (Tray)',
        slug: 'farm-fresh-brown-eggs-tray',
        price: 370,
        regularPrice: 400,
        unit: '30 Pieces (Tray)',
        rating: 4.9,
        reviewsCount: 710,
        imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-dairy-2',
      },
    ],
  },

  all: {
    title: 'You Might Need',
    icon: '🛒',
    description: 'Everyday quick-commerce grocery essentials tailored to your daily cooking needs.',
    products: [
      {
        id: 'ymn-1',
        name: 'Fresh Beetroot',
        slug: 'fresh-beetroot',
        price: 120,
        unit: '1 kg',
        rating: 4.8,
        reviewsCount: 234,
        imageUrl: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-ymn-1',
      },
      {
        id: 'ymn-2',
        name: 'Italian Avocado',
        slug: 'italian-avocado',
        price: 350,
        unit: '1 pc',
        rating: 4.7,
        reviewsCount: 189,
        imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-ymn-2',
      },
      {
        id: 'ymn-3',
        name: 'Premium Beef (Cut Bone)',
        slug: 'fresh-beef-cut-bone',
        price: 750,
        unit: '1 kg',
        rating: 4.9,
        reviewsCount: 312,
        imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-ymn-3',
      },
      {
        id: 'ymn-4',
        name: 'Sprite Cold Drink (Can)',
        slug: 'sprite-cold-drink-can',
        price: 50,
        unit: '250 ml',
        rating: 4.6,
        reviewsCount: 567,
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-ymn-4',
      },
      {
        id: 'ymn-5',
        name: 'Aarong Dairy Liquid Milk',
        slug: 'aarong-dairy-pure-liquid-milk',
        price: 90,
        regularPrice: 110,
        unit: '1 Ltr',
        rating: 4.9,
        reviewsCount: 892,
        discountPercentage: 18,
        imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-ymn-5',
      },
    ],
  },

  deals: {
    title: 'Deals of the Day',
    icon: '⚡',
    description: 'Fresh daily bargains and limited-time savings across fresh produce, grocery staples and essentials.',
    products: [
      {
        id: 'deal-rice-25',
        name: 'Miniket Premium Rice',
        slug: 'miniket-premium-rice-25kg',
        price: 1700,
        regularPrice: 1850,
        unit: '25 KG (Bag)',
        rating: 4.9,
        reviewsCount: 420,
        discountPercentage: 8,
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-deal-rice-25',
      },
      {
        id: 'deal-rice-10',
        name: 'Miniket Premium Rice',
        slug: 'miniket-premium-rice-10kg',
        price: 700,
        regularPrice: 760,
        unit: '10 KG',
        rating: 4.8,
        reviewsCount: 310,
        discountPercentage: 8,
        imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-deal-rice-10',
      },
      {
        id: 'deal-onion-5',
        name: 'Fresh Red Onion (Deshi Piyaj)',
        slug: 'fresh-red-onion-deshi-piyaj-5kg',
        price: 380,
        regularPrice: 425,
        unit: '5 KG',
        rating: 4.7,
        reviewsCount: 512,
        discountPercentage: 11,
        imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-deal-onion-5',
      },
      {
        id: 'deal-oil-teer-5',
        name: 'Teer Pure Soybean Oil',
        slug: 'teer-pure-soybean-oil-5l',
        price: 820,
        regularPrice: 850,
        unit: '5 Liter',
        rating: 4.9,
        reviewsCount: 680,
        discountPercentage: 4,
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-deal-oil-teer-5',
      },
      {
        id: 'deal-oil-rup-5',
        name: 'Rupchanda Fortified Soybean Oil',
        slug: 'rupchanda-fortified-soybean-oil-5l',
        price: 840,
        regularPrice: 870,
        unit: '5 Liter',
        rating: 4.9,
        reviewsCount: 740,
        discountPercentage: 3,
        imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-deal-oil-rup-5',
      },
      {
        id: 'deal-rice-5',
        name: 'Miniket Premium Rice',
        slug: 'miniket-premium-rice-5kg',
        price: 360,
        regularPrice: 390,
        unit: '5 KG',
        rating: 4.8,
        reviewsCount: 290,
        discountPercentage: 8,
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-deal-rice-5',
      },
      {
        id: 'deal-eggs-30',
        name: 'Fresh Farm Eggs (Brown)',
        slug: 'fresh-farm-eggs-brown-30pcs',
        price: 370,
        regularPrice: 395,
        unit: '30 Pieces (Tray)',
        rating: 4.9,
        reviewsCount: 890,
        discountPercentage: 6,
        imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-deal-eggs-30',
      },
      {
        id: 'deal-turmeric-500',
        name: 'Radhuni Pure Turmeric Powder',
        slug: 'radhuni-pure-turmeric-powder-500g',
        price: 200,
        regularPrice: 220,
        unit: '500 Gram',
        rating: 4.8,
        reviewsCount: 340,
        discountPercentage: 9,
        imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-deal-turmeric-500',
      },
    ],
  },
  'cooking-oil': {
    title: 'Cooking Oil',
    icon: '🫒',
    description: 'Fortified edible oils, pure mustard oil, and sunflower oil from top certified refineries.',
    products: [
      {
        id: 'oil-teer-5',
        name: 'Teer Pure Fortified Soybean Oil',
        slug: 'teer-pure-soybean-oil-5l',
        price: 790,
        regularPrice: 850,
        unit: '5 Liter',
        rating: 4.9,
        reviewsCount: 520,
        discountPercentage: 7,
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-oil-teer-5',
      },
      {
        id: 'oil-rup-5',
        name: 'Rupchanda Fortified Soybean Oil',
        slug: 'rupchanda-fortified-soybean-oil-5l',
        price: 810,
        regularPrice: 860,
        unit: '5 Liter',
        rating: 4.8,
        reviewsCount: 430,
        discountPercentage: 6,
        imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-oil-rup-5',
      },
    ],
  },
  'flour-atta': {
    title: 'Flour & Atta',
    icon: '🌾',
    description: 'Whole wheat atta, premium maida, and suji for nutritious roti, paratha, and baking.',
    products: [
      {
        id: 'flour-teer-2',
        name: 'Teer Whole Wheat Atta',
        slug: 'teer-whole-wheat-atta-2kg',
        price: 135,
        regularPrice: 150,
        unit: '2 KG',
        rating: 4.8,
        reviewsCount: 310,
        discountPercentage: 10,
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-flour-teer-2',
      },
      {
        id: 'flour-fresh-5',
        name: 'Fresh Premium Maida',
        slug: 'fresh-premium-maida-5kg',
        price: 320,
        regularPrice: 350,
        unit: '5 KG',
        rating: 4.7,
        reviewsCount: 220,
        imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-flour-fresh-5',
      },
    ],
  },
  'dal-pulses': {
    title: 'Dal & Pulses',
    icon: '🫘',
    description: 'Cleaned and sorted masoor dal, moong dal, chhola, and yellow lentils.',
    products: [
      {
        id: 'dal-masoor-1',
        name: 'Deshi Masoor Dal (Red Lentil)',
        slug: 'deshi-masoor-dal-1kg',
        price: 145,
        regularPrice: 160,
        unit: '1 KG',
        rating: 4.9,
        reviewsCount: 410,
        discountPercentage: 9,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-dal-masoor-1',
      },
    ],
  },
  'noodles-pasta': {
    title: 'Noodles & Pasta',
    icon: '🍜',
    description: 'Instant noodles, egg noodles, macaroni, and durum wheat pasta.',
    products: [
      {
        id: 'noodle-maggi-8',
        name: 'Maggi 2-Minute Masala Noodles',
        slug: 'maggi-masala-noodles-8pack',
        price: 160,
        regularPrice: 180,
        unit: '8 Pack (560g)',
        rating: 4.9,
        reviewsCount: 950,
        discountPercentage: 11,
        imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-noodle-maggi-8',
      },
    ],
  },
  'meat-fish': {
    title: 'Meat & Fish',
    icon: '🍗',
    description: 'Fresh dressed broiler chicken, beef cuts, and fresh river and sea fish.',
    products: [
      {
        id: 'meat-beef-1',
        name: 'Fresh Beef (Curry Cut with Bone)',
        slug: 'fresh-beef-curry-cut-1kg',
        price: 750,
        regularPrice: 780,
        unit: '1 KG',
        rating: 4.9,
        reviewsCount: 310,
        imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-meat-beef-1',
      },
    ],
  },
  spices: {
    title: 'Spices & Seasonings',
    icon: '🌶️',
    description: 'Aromatic whole and ground spices, curry powders, and seasoning blends.',
    products: [
      {
        id: 'spice-radhuni-turmeric',
        name: 'Radhuni Pure Turmeric Powder',
        slug: 'radhuni-pure-turmeric-powder-500g',
        price: 200,
        regularPrice: 220,
        unit: '500 Gram',
        rating: 4.8,
        reviewsCount: 340,
        discountPercentage: 9,
        imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80',
        variantId: 'v-deal-turmeric-500',
      },
    ],
  },
};

export const CategoryPageView: React.FC<CategoryPageProps> = ({
  categorySlug,
  categoryTitle,
  onBack,
  onOpenProduct,
  onSelectCategory,
  apiProducts = [],
}) => {
  const { t } = useLanguage();
  const { cartItems, addToCart, updateQuantity, removeItem, toggleWishlist, isWishlisted } = useCart();

  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');

  // Custom products from local storage synced with Admin Portal
  const [customCatalogProducts, setCustomCatalogProducts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('lb_custom_catalog_products');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Custom categories from local storage
  const [customCategories, setCustomCategories] = useState<Array<{ name: string; slug: string }>>(() => {
    try {
      const saved = localStorage.getItem('lb_custom_categories');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Custom items from local storage
  const [customItems, setCustomItems] = useState<Array<{ name: string; slug: string; icon?: string }>>(() => {
    try {
      const saved = localStorage.getItem('lb_custom_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const handleSync = () => {
      try {
        const pSaved = localStorage.getItem('lb_custom_catalog_products');
        if (pSaved) setCustomCatalogProducts(JSON.parse(pSaved));
      } catch (e) {}
      try {
        const cSaved = localStorage.getItem('lb_custom_categories');
        if (cSaved) setCustomCategories(JSON.parse(cSaved));
      } catch (e) {}
      try {
        const iSaved = localStorage.getItem('lb_custom_items');
        if (iSaved) setCustomItems(JSON.parse(iSaved));
      } catch (e) {}
    };

    window.addEventListener('lb_products_updated', handleSync);
    window.addEventListener('lb_categories_updated', handleSync);
    window.addEventListener('lb_items_updated', handleSync);
    return () => {
      window.removeEventListener('lb_products_updated', handleSync);
      window.removeEventListener('lb_categories_updated', handleSync);
      window.removeEventListener('lb_items_updated', handleSync);
    };
  }, []);

  // Normalize slug to find category info
  const normalizedSlug = categorySlug.toLowerCase().trim();
  const catKey = Object.keys(CATEGORY_CATALOG_DATABASE).find(
    (k) =>
      k === normalizedSlug ||
      (normalizedSlug.includes('deal') && k === 'deals') ||
      (normalizedSlug.includes('fruit') && k === 'fruits') ||
      (normalizedSlug.includes('veg') && k === 'vegetables') ||
      (normalizedSlug.includes('oil') && k === 'cooking-oil') ||
      (normalizedSlug.includes('rice') && k === 'rice') ||
      (normalizedSlug.includes('drink') && k === 'beverages') ||
      (normalizedSlug.includes('flour') && k === 'flour-atta') ||
      (normalizedSlug.includes('sugar') && k === 'sugar') ||
      (normalizedSlug.includes('salt') && k === 'salt') ||
      (normalizedSlug.includes('dal') && k === 'dal-pulses') ||
      (normalizedSlug.includes('noodle') && k === 'noodles-pasta') ||
      (normalizedSlug.includes('meat') && k === 'meat-fish') ||
      (normalizedSlug.includes('dairy') && k === 'dairy') ||
      (normalizedSlug.includes('spice') && k === 'spices')
  ) || normalizedSlug;

  const categoryMeta = CATEGORY_CATALOG_DATABASE[catKey] || {
    title: categoryTitle || normalizedSlug.replace(/-/g, ' ').toUpperCase(),
    icon: '📦',
    description: `Browse all products in ${categoryTitle || normalizedSlug}.`,
    products: [],
  };

  // Combine database products with any matching backend API products + custom admin products
  const displayProducts = useMemo(() => {
    const list = [...categoryMeta.products];

    // Merge candidates from custom admin uploads and backend API
    const allCandidates = [...customCatalogProducts, ...apiProducts];

    for (const p of allCandidates) {
      let matches = false;

      if (catKey === 'all' || normalizedSlug === 'all') {
        matches = true;
      } else if (catKey === 'deals' || normalizedSlug === 'deals') {
        matches = Boolean(p.isDealOfTheDay || p.category?.slug === 'deals' || p.categorySlug === 'deals');
      } else {
        const pCatSlug = (p.categorySlug || p.category?.slug || '').toLowerCase();
        const pCatName = (p.category?.name || '').toLowerCase();
        const pItemType = (p.itemType || '').toLowerCase();
        const pItemSlug = (p.itemSlug || '').toLowerCase();

        // 1. Direct Category Matching
        const catMatch =
          pCatSlug === normalizedSlug ||
          pCatSlug === catKey ||
          pCatName === normalizedSlug ||
          pCatName === catKey;

        // 2. Item Section Matching (e.g. Rice, Oil, Vegetables, Fruits, etc.)
        const itemMatch =
          pItemType === normalizedSlug ||
          pItemType === catKey ||
          pItemSlug === normalizedSlug ||
          pItemSlug === catKey ||
          (catKey === 'cooking-oil' && pItemType.includes('oil')) ||
          (catKey === 'rice' && pItemType.includes('rice')) ||
          (catKey === 'vegetables' && pItemType.includes('veg')) ||
          (catKey === 'fruits' && pItemType.includes('fruit')) ||
          (catKey === 'beverages' && (pItemType.includes('drink') || pItemType.includes('beverag'))) ||
          (catKey === 'flour-atta' && (pItemType.includes('flour') || pItemType.includes('atta'))) ||
          (catKey === 'sugar' && pItemType.includes('sugar')) ||
          (catKey === 'salt' && pItemType.includes('salt')) ||
          (catKey === 'dal-pulses' && pItemType.includes('dal')) ||
          (catKey === 'noodles-pasta' && (pItemType.includes('noodle') || pItemType.includes('pasta'))) ||
          (catKey === 'meat-fish' && (pItemType.includes('meat') || pItemType.includes('fish') || pItemType.includes('beef') || pItemType.includes('chicken'))) ||
          (catKey === 'dairy' && (pItemType.includes('dairy') || pItemType.includes('milk') || pItemType.includes('egg'))) ||
          (catKey === 'spices' && pItemType.includes('spice'));

        // 3. Tag Matching
        const tagMatch =
          p.tags &&
          Array.isArray(p.tags) &&
          p.tags.some((t: string) => typeof t === 'string' && (t.toLowerCase().includes(catKey) || t.toLowerCase().includes(normalizedSlug)));

        matches = catMatch || itemMatch || tagMatch;
      }

      if (matches && !list.some((existing) => existing.id === p.id || existing.slug === p.slug)) {
        list.unshift({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.salePrice || p.price || p.basePrice || 100),
          regularPrice: Number(p.basePrice || p.regularPrice || Math.round((p.salePrice || p.price || 100) * 1.15)),
          unit: p.unit || p.variantName || p.variants?.[0]?.displayName || '1 Pack',
          rating: 4.8,
          reviewsCount: 120,
          imageUrl:
            p.primaryImage ||
            p.images?.[0]?.imageUrl ||
            (typeof p.images?.[0] === 'string' ? p.images[0] : 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80'),
          variantId: p.variants?.[0]?.id || `v-${p.id}`,
        });
      }
    }

    // Filter by search
    let filtered = list;
    if (searchFilter.trim()) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  }, [categoryMeta, apiProducts, customCatalogProducts, categorySlug, catKey, normalizedSlug, searchFilter, sortBy]);

  // Standard category and item tabs matching Screenshot 2
  const BASE_CATEGORY_TABS = [
    { key: 'all', label: 'All Items', icon: '🛒' },
    { key: 'deals', label: 'Deals of the Day', icon: '⚡' },
    { key: 'cooking-oil', label: 'Cooking Oil', icon: '🫒' },
    { key: 'rice', label: 'Rice', icon: '🍚' },
    { key: 'vegetables', label: 'Vegetables', icon: '🥦' },
    { key: 'fruits', label: 'Fruits', icon: '🍎' },
    { key: 'beverages', label: 'Drinks', icon: '🥤' },
    { key: 'flour-atta', label: 'Flour & Atta', icon: '🌾' },
    { key: 'sugar', label: 'Sugar', icon: '🍬' },
    { key: 'salt', label: 'Salt', icon: '🧂' },
    { key: 'dal-pulses', label: 'Dal & Pulses', icon: '🫘' },
    { key: 'noodles-pasta', label: 'Noodles & Pasta', icon: '🍜' },
    { key: 'meat-fish', label: 'Meat & Fish', icon: '🍗' },
    { key: 'dairy', label: 'Dairy & Eggs', icon: '🧀' },
  ];

  // Dynamic category tabs merging standard tabs + custom categories & items
  const CATEGORY_TABS = useMemo(() => {
    const tabs = [...BASE_CATEGORY_TABS];

    for (const c of customCategories) {
      if (!tabs.some((t) => t.key === c.slug)) {
        tabs.push({
          key: c.slug,
          label: c.name,
          icon: '🏷️',
        });
      }
    }

    for (const it of customItems) {
      if (!tabs.some((t) => t.key === it.slug || t.label.toLowerCase() === it.name.toLowerCase())) {
        tabs.push({
          key: it.slug,
          label: it.name,
          icon: it.icon || '📦',
        });
      }
    }

    return tabs;
  }, [customCategories, customItems]);

  return (
    <div className="text-left my-2 sm:my-4 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Top Back & Breadcrumb Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4 sm:mb-6 border-b border-slate-100 pb-3 sm:pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-[#14532d] hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Back to Home</span>
        </button>

        <div className="text-[11px] sm:text-xs font-semibold text-slate-400">
          Home / Catalog / <span className="text-emerald-800 font-bold">{categoryTitle || categoryMeta.title}</span>
        </div>
      </div>

      {/* Hero Category Banner Card */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#14532d] to-[#0f3d20] text-white p-4 sm:p-8 shadow-xl mb-4 sm:mb-6">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-emerald-800/80 border border-emerald-600/50 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold text-emerald-200">
              <span className="text-sm sm:text-base">{categoryMeta.icon}</span>
              <span>Liton Brothers Express Category</span>
            </div>
            <h1 className="text-xl sm:text-4xl font-black tracking-tight">
              {categoryTitle || categoryMeta.title}
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm max-w-xl">
              {categoryMeta.description}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/20 text-left sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between">
            <div className="text-xl sm:text-3xl font-black text-yellow-300">
              {displayProducts.length} <span className="text-xs sm:hidden font-normal text-white">Items</span>
            </div>
            <div className="text-[10px] sm:text-xs text-emerald-100 font-bold uppercase tracking-wider hidden sm:block">
              Items Available
            </div>
            <div className="text-[10px] sm:text-[11px] text-emerald-200">15-Min Delivery</div>
          </div>
        </div>
      </div>

      {/* Horizontal Category Switcher Ribbon */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2.5 mb-4 sm:mb-6 no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
        {CATEGORY_TABS.map((tab) => {
          const isActive = catKey === tab.key;
          return (
            <button
              type="button"
              key={tab.key}
              onClick={() => onSelectCategory(tab.key)}
              className={`shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                isActive
                  ? 'bg-[#14532d] text-white shadow-md scale-105'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Sort Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm mb-4 sm:mb-6">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={`Search within ${categoryTitle || categoryMeta.title}...`}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 justify-end">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Sort:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:border-emerald-700 focus:outline-none"
          >
            <option value="featured">Featured First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {displayProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8">
          <div className="text-5xl mb-3">🔍</div>
          <h3 className="text-base font-bold text-slate-800">No products found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Try adjusting your search filter or switch to another grocery category.
          </p>
          <button
            type="button"
            onClick={() => setSearchFilter('')}
            className="mt-4 px-5 py-2 bg-emerald-800 text-white rounded-full text-xs font-bold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-6">
          {displayProducts.map((p) => {
            const ci = cartItems.find((c) => {
              if (p.variantId && c.variantId === p.variantId) return true;
              if (p.id && (c.productId === p.id || c.id === p.id)) return true;
              const cName = (c.productName || c.name || '').toLowerCase().trim();
              const pName = (p.name || '').toLowerCase().trim();
              return pName.length > 0 && cName === pName;
            });
            const cartQty = ci ? ci.quantity : 0;
            const wishlisted = isWishlisted(p.id);

            return (
              <div
                key={p.id}
                onClick={() => onOpenProduct(p)}
                className="group cursor-pointer bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  {/* Thumbnail Image + Heart Wishlist Button */}
                  <div className="relative w-full h-32 sm:h-44 rounded-xl sm:rounded-2xl bg-slate-50 overflow-hidden mb-2.5 sm:mb-3 flex items-center justify-center p-2">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Wishlist Heart */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(p.id, p);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md text-slate-500 hover:text-rose-500 transition z-10"
                      title="Save to Favourites"
                    >
                      <Heart
                        className={`w-4 h-4 ${wishlisted ? 'fill-rose-500 text-rose-500' : ''}`}
                      />
                    </button>

                    {/* Discount badge */}
                    {p.discountPercentage && (
                      <span className="absolute top-2 left-2 bg-emerald-800 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
                        -{p.discountPercentage}%
                      </span>
                    )}
                  </div>

                  {/* Title & Unit */}
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-emerald-800 transition">
                    {p.name}
                  </h3>

                  <div className="text-xs text-slate-400 font-semibold mt-1">
                    {p.unit}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-500">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                    <span className="text-slate-400 font-medium">({p.reviewsCount})</span>
                  </div>
                </div>

                {/* Price & Add to Cart / Interactive Stepper */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-baseline gap-1.5 mb-2.5">
                    <span className="text-lg font-black text-slate-900">৳{p.price}</span>
                    {p.regularPrice && p.regularPrice > p.price && (
                      <span className="text-xs text-slate-400 line-through">৳{p.regularPrice}</span>
                    )}
                  </div>

                  {/* Stepper vs Add to Cart */}
                  {cartQty > 0 && ci ? (
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
                        title="Decrease"
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
                        title="Increase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(p.variantId || 'v-' + p.id, 1, p);
                      }}
                      className="w-full py-2.5 rounded-full border border-emerald-800 text-emerald-800 hover:bg-emerald-800 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('addToCart')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
