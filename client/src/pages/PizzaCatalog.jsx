import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { Search, SlidersHorizontal, Pizza as PizzaIcon, Plus, Sparkles, X, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export const PizzaCatalog = () => {
  const [pizzas, setPizzas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [activeModalPizza, setActiveModalPizza] = useState(null);

  const categories = ['All', 'Veg', 'Non-Veg', 'Specialty', 'Gourmet'];

  const fetchPizzas = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (search.trim()) params.search = search.trim();
      if (sortBy !== 'featured') params.sortBy = sortBy;

      const res = await API.get('/pizzas', { params });
      setPizzas(res.data.data.pizzas);
    } catch (error) {
      toast.error('Failed to load pizza catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPizzas();
    }, 250);
    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedCategory, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-orange-400 uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Artisanal Handcrafted Selection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Signature Pizzas</h1>
          <p className="text-sm text-stone-400 mt-1">
            Made with 48-hour fermented dough, San Marzano marinara, and fresh artisan toppings.
          </p>
        </div>

        <Link
          to="/custom-pizza"
          className="inline-flex items-center self-start md:self-auto px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-950 transition-all"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Custom Pizza Builder
        </Link>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-stone-900/60 p-4 rounded-2xl border border-stone-800 backdrop-blur-sm">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by pizza name, sauce, or ingredients..."
            className="w-full pl-10 pr-4 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-600 focus:outline-none focus:border-orange-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-stone-500 hover:text-stone-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center overflow-x-auto pb-2 lg:pb-0 gap-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                  : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center space-x-2 self-end lg:self-auto">
          <SlidersHorizontal className="w-4 h-4 text-stone-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="featured">Featured First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Pizza Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3 animate-pulse">
              <div className="h-44 bg-stone-800 rounded-xl"></div>
              <div className="h-4 bg-stone-800 rounded w-3/4"></div>
              <div className="h-3 bg-stone-800 rounded w-full"></div>
              <div className="h-8 bg-stone-800 rounded"></div>
            </div>
          ))}
        </div>
      ) : pizzas.length === 0 ? (
        <div className="p-12 text-center bg-stone-900/40 rounded-3xl border border-stone-800/60 space-y-3">
          <PizzaIcon className="w-12 h-12 text-stone-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Pizzas Match Your Filter</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Try adjusting your search terms or select "All" categories to view our entire menu.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
            }}
            className="text-xs text-orange-400 font-semibold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pizzas.map((pizza) => (
            <div
              key={pizza._id}
              className="group bg-stone-900 border border-stone-800 hover:border-orange-500/50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-orange-950/20 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Pizza Image & Badges */}
                <div className="relative h-48 overflow-hidden bg-stone-950">
                  <img
                    src={pizza.image}
                    alt={pizza.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-80"></div>

                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-md border ${
                        pizza.category === 'Veg'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50'
                          : pizza.category === 'Non-Veg'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-700/50'
                          : 'bg-amber-950/80 text-amber-300 border-amber-700/50'
                      }`}
                    >
                      {pizza.category}
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveModalPizza(pizza)}
                    className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-black/80 backdrop-blur-md text-stone-300 hover:text-white rounded-full transition-colors"
                    title="Quick Details"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                    {pizza.name}
                  </h3>
                  <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                    {pizza.description}
                  </p>

                  {/* Ingredients preview */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {pizza.ingredients?.slice(0, 3).map((ing, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-stone-950 text-stone-400 px-2 py-0.5 rounded border border-stone-800"
                      >
                        {ing}
                      </span>
                    ))}
                    {pizza.ingredients?.length > 3 && (
                      <span className="text-[10px] text-stone-500 px-1 py-0.5">
                        +{pizza.ingredients.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="p-4 pt-0 border-t border-stone-800/60 mt-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block font-semibold">Price</span>
                  <span className="text-base font-extrabold text-white">₹{pizza.price}</span>
                </div>

                <Link
                  to="/custom-pizza"
                  className="px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center"
                >
                  Order / Customize
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pizza Details Modal */}
      {activeModalPizza && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setActiveModalPizza(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black text-stone-300 hover:text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="h-56 relative overflow-hidden bg-stone-950">
              <img
                src={activeModalPizza.image}
                alt={activeModalPizza.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent"></div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  {activeModalPizza.category} Signature
                </span>
                <span className="text-xl font-extrabold text-white">₹{activeModalPizza.price}</span>
              </div>

              <h2 className="text-xl font-bold text-white">{activeModalPizza.name}</h2>
              <p className="text-xs text-stone-300 leading-relaxed">{activeModalPizza.description}</p>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Featured Ingredients & Toppings:
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeModalPizza.ingredients?.map((ing, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-stone-950 text-stone-300 px-2.5 py-1 rounded-lg border border-stone-800"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-800 flex gap-3">
                <button
                  onClick={() => setActiveModalPizza(null)}
                  className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl"
                >
                  Close
                </button>
                <Link
                  to="/custom-pizza"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold text-center rounded-xl shadow-lg"
                >
                  Customize Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};