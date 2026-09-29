import React from 'react';

interface CategoryBarProps {
  onSelectCategory: (slug: string | null) => void;
  activeCategory: string | null;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({ onSelectCategory, activeCategory }) => {
  const categories = [
    { name: 'All Groceries', slug: null, icon: '🛒', count: '50+ items' },
    { name: 'Cooking Oil', slug: 'cooking-oil', icon: '🛢️', count: 'Teer, Rupchanda' },
    { name: 'Rice & Grains', slug: 'rice', icon: '🍚', count: 'Miniket, Nazirshail' },
    { name: 'Masala & Spices', slug: 'spices-masala', icon: '🌶️', count: 'Radhuni, Pran' },
    { name: 'Dairy & Eggs', slug: 'dairy-eggs', icon: '🥚', count: 'Fresh Farm Eggs' },
  ];

  return (
    <div className="my-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Shop by Essential Category
        </h3>
        {activeCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="text-xs font-semibold text-emerald-600 hover:underline"
          >
            Clear Filter (Show All)
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <div
              key={cat.name}
              onClick={() => onSelectCategory(cat.slug)}
              className={`p-3.5 rounded-2xl cursor-pointer transition border text-left flex flex-col justify-between group ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                  : 'bg-white hover:bg-emerald-50/50 border-slate-200 hover:border-emerald-300 text-slate-800 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl group-hover:scale-110 transition transform">{cat.icon}</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                )}
              </div>
              <div>
                <div className="text-sm font-bold line-clamp-1">{cat.name}</div>
                <div className={`text-[11px] mt-0.5 ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {cat.count}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
