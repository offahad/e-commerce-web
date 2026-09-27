import React, { useState, useEffect } from 'react';
import { Tag, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { api } from '../services/api';

interface DealsOfTheDaySectionProps {
  onOpenProductModal: (slug: string) => void;
}

export const DealsOfTheDaySection: React.FC<DealsOfTheDaySectionProps> = ({ onOpenProductModal }) => {
  const [deals, setDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDeals = async () => {
      try {
        const res = await api.getDealsOfTheDay();
        if (res.success && Array.isArray(res.data)) {
          setDeals(res.data);
        }
      } catch (err) {
        console.error('Failed to load deals of the day', err);
      } finally {
        setLoading(false);
      }
    };
    loadDeals();
  }, []);

  if (!loading && deals.length === 0) return null;

  return (
    <section className="my-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Deals of the Day
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Hand-picked grocery markdowns refreshed daily for maximum household savings.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <Tag className="w-3.5 h-3.5" />
          <span>Save up to 10% Today</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {deals.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onOpenModal={() => onOpenProductModal(product.slug)}
          />
        ))}
      </div>
    </section>
  );
};
