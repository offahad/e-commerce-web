import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    brandName: 'Liton Brother',
    searchPlaceholder: 'Search for Grocery, Stores, Vegetable or Meat',
    expressBadge: 'Order now and get it within 15 mint!',
    dealsTitle: 'Deals of the Day',
    dealsSubtitle: "Fresh deals - grab them before they're gone!",
    youMightNeed: 'You might need',
    freshVegetables: 'Fresh Vegetables',
    freshFruits: 'Fresh Fruits',
    freshFoods: 'Fresh Foods',
    byCategory: 'By Category',
    productByItems: 'Product by Items',
    viewBrandsSizes: 'View brands & sizes',
    seeAll: 'See All',
    seeMore: 'See more',
    sold: 'Sold',
    soldOut: 'Sold Out',
    stockOut: 'Stock Out',
    addToCart: 'Add to cart',
    buyNow: 'Buy Now',
    addWishlist: 'ADD TO WISHLIST',
    inWishlist: 'IN WISHLIST',
    shoppingCart: 'Shopping Cart',
    items: 'items',
    clearAll: 'Clear All',
    orderSummary: 'Order Summary',
    estDelivery: 'Estimated delivery: 15 mins',
    subtotal: 'Subtotal',
    delivery: 'Delivery',
    free: 'Free',
    total: 'Total',
    proceedToCheckout: 'Proceed to Checkout',
    continueShopping: 'Continue Shopping',
    deliveryAddress: 'Delivery Address',
    edit: 'Edit',
    customizeQuantity: 'Customize Quantity',
    totalPrice: 'Total Price',
    shopNow: 'Shop now',
    heroTitle: 'We bring the store to your door',
    heroSub: 'Get organic produce and sustainably sourced groceries delivery at up to 4% off grocery.',
    appTitle: 'Stay Home and Get All Your Essentials From Our Market!',
    appSub: 'Download the app from app store or google play',
    categoryVegetable: 'Vegetable',
    categoryVegetableSub: 'Local market',
    categoryFruits: 'Fruits',
    categoryFruitsSub: 'Fresh & organic',
    categorySnacks: 'Snacks & Breads',
    categorySnacksSub: 'In store delivery',
    categoryMeat: 'Meat & Fish',
    categoryMeatSub: 'Fresh cuts',
    categoryDairy: 'Milk & Dairy',
    categoryDairySub: 'Process food',
    categoryBeverages: 'Beverages',
    categoryBeveragesSub: 'Refreshing drinks',
    trackOrder: 'Track Order',
    signIn: 'Sign In',
    myAccount: 'My Account',
    adminPortal: 'Admin Portal',
    signOut: 'Sign Out',
    language: 'Language',
    english: 'English',
    bangla: 'বাংলা',
  },
  bn: {
    brandName: 'লিটন ব্রাদার্স',
    searchPlaceholder: 'মুদি, শাকসবজি, ফলমূল বা মাংস অনুসন্ধান করুন...',
    expressBadge: 'এখনই অর্ডার করুন এবং মাত্র ১৫ মিনিটে ডেলিভারি পান!',
    dealsTitle: 'আজকের সেরা ডিল',
    dealsSubtitle: 'তাজা পণ্য বিশেষ ছাড় - স্টক শেষ হওয়ার আগেই লুফে নিন!',
    youMightNeed: 'আপনার যা লাগতে পারে',
    freshVegetables: 'তাজা শাকসবজি',
    freshFruits: 'তাজা ফলমূল',
    freshFoods: 'তাজা মাংস ও খাবার',
    byCategory: 'ক্যাটাগরি অনুযায়ী',
    productByItems: 'পণ্য তালিকা',
    viewBrandsSizes: 'ব্র্যান্ড ও সাইজ দেখুন',
    seeAll: 'সব দেখুন',
    seeMore: 'আরও দেখুন',
    sold: 'বিক্রি হয়েছে',
    soldOut: 'স্টক শেষ',
    stockOut: 'স্টক খালি',
    addToCart: 'কার্টে যোগ করুন',
    buyNow: 'সরাসরি কিনুন',
    addWishlist: 'উইশলিস্টে রাখুন',
    inWishlist: 'উইশলিস্টে যুক্ত',
    shoppingCart: 'শপিং কার্ট',
    items: 'টি পণ্য',
    clearAll: 'সব মুছুন',
    orderSummary: 'অর্ডার সারাংশ',
    estDelivery: 'আনুমানিক ডেলিভারি: ১৫ মিনিট',
    subtotal: 'সাবটোটাল',
    delivery: 'ডেলিভারি চার্জ',
    free: 'ফ্রি',
    total: 'সর্বমোট',
    proceedToCheckout: 'চেকআউটে যান',
    continueShopping: 'আরও কেনাকাটা করুন',
    deliveryAddress: 'ডেলিভারি ঠিকানা',
    edit: 'সম্পাদনা',
    customizeQuantity: 'পরিমাণ কাস্টমাইজ করুন',
    totalPrice: 'মোট মূল্য',
    shopNow: 'এখনই কেনাকাটা করুন',
    heroTitle: 'বাজার পৌঁছে যাবে আপনার ঘরের দুয়ারে',
    heroSub: 'সবুজ সতেজ শাকসবজি ও খাঁটি মুদি পণ্য দ্রুত ডেলিভারি উপভোগ করুন।',
    appTitle: 'ঘরে থাকুন এবং প্রয়োজনীয় সবকিছু পান আমাদের অ্যাপে!',
    appSub: 'গুগল প্লে স্টোর বা অ্যাপল স্টোর থেকে ডাউনলোড করুন',
    categoryVegetable: 'শাকসবজি',
    categoryVegetableSub: 'স্থানীয় বাজার',
    categoryFruits: 'তাজা ফলমূল',
    categoryFruitsSub: 'অর্গানিক ও সতেজ',
    categorySnacks: 'স্ন্যাকস ও রুটি',
    categorySnacksSub: 'ইন-স্টোর ডেলিভারি',
    categoryMeat: 'মাংস ও মাছ',
    categoryMeatSub: 'তাজা কাট',
    categoryDairy: 'দুধ ও দুগ্ধজাত',
    categoryDairySub: 'প্রক্রিয়াজাত খাবার',
    categoryBeverages: 'পানীয়',
    categoryBeveragesSub: 'ঠান্ডা পানীয়',
    trackOrder: 'অর্ডার ট্র্যাক করুন',
    signIn: 'লগইন করুন',
    myAccount: 'আমার প্রোফাইল',
    adminPortal: 'অ্যাডমিন পোর্টাল',
    signOut: 'লগআউট',
    language: 'ভাষা পরিবর্তন',
    english: 'English',
    bangla: 'বাংলা',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('lb_language');
    return (saved === 'bn' || saved === 'en') ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('lb_language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
